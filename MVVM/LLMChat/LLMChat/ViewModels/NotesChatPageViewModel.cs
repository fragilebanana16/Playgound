using Azure;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LLMChat.Models;
using LLMChat.Services;
using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Memory;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace LLMChat.ViewModels;

public partial class NotesChatPageViewModel : ObservableObject
{
    private readonly KernelService _kernelService;
    private bool _isInitialized = false;

    [ObservableProperty]
    private string inputText = string.Empty;

    [ObservableProperty]
    private string responseText = "正在初始化 RAG 系统，请稍等...";

    public NotesChatPageViewModel(KernelService kernelService)
    {
        _kernelService = kernelService;
        _ = InitializeAsync();        // 后台异步初始化，不阻塞 UI
    }

    private async Task InitializeAsync()
    {
        try
        {
            await _kernelService.InitializeAsync();
            _isInitialized = true;
            ResponseText = $"✅ 初始化完成！当前向量库记录数: {await _kernelService.GetRecordCountAsync()}";
        }
        catch (Exception ex)
        {
            ResponseText = $"初始化失败：{ex.Message}";
        }
    }
    // ====================== 从文件夹导入并索引所有笔记 ======================
    [RelayCommand]
    private async Task ImportFolderAsync()
    {
        if (!_isInitialized)
        {
            ResponseText = "系统尚未初始化，请等待...";
            return;
        }

        // 使用 WPF 文件夹选择对话框
        var dialog = new Microsoft.Win32.OpenFolderDialog
        {
            Title = "请选择要导入的笔记文件夹",
            Multiselect = false
        };

        if (dialog.ShowDialog() != true)
            return;

        string folderPath = dialog.FolderName;
        ResponseText = $"正在扫描文件夹: {folderPath} ...";

        try
        {
            int indexedCount = 0;
            var mdFiles = Directory.GetFiles(folderPath, "*.md", SearchOption.AllDirectories);

            foreach (var filePath in mdFiles)
            {
                try
                {
                    string content = await File.ReadAllTextAsync(filePath);
                    string title = Path.GetFileNameWithoutExtension(filePath);
                    string noteId = Guid.NewGuid().ToString();   // 临时用 GUID，后面可改成文件路径哈希

                    await IndexNoteAsync(noteId, title, content);

                    indexedCount++;
                    ResponseText = $"已索引 {indexedCount}/{mdFiles.Length} 个文件...";
                }
                catch (Exception ex)
                {
                    // 单个文件失败不影响整体
                    Console.WriteLine($"索引失败 {filePath}: {ex.Message}");
                }
            }

            ResponseText = $"文件夹导入完成！共成功索引 {indexedCount} 个 Markdown 文件。";
        }
        catch (Exception ex)
        {
            ResponseText = $"导入失败：{ex.Message}";
        }
    }
    // ====================== 1. 索引笔记（向量化 + 存入向量库） ======================
    private async Task IndexNoteAsync(string noteId, string title, string content)
    {
        if (!_isInitialized)
        {
            ResponseText = "系统尚未初始化，请等待...";
            return;
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            ResponseText = "笔记内容为空，无法索引";
            return;
        }

        ResponseText = "正在向量化并索引笔记...";

        try
        {
            var chunks = SplitIntoChunks(content, maxLength: 600);
            int successCount = 0;

            foreach (var (chunkText, index) in chunks.Select((text, i) => (text, i)))
            {
                var recordId = $"{noteId}_{index}";
                var embeddingResult = await _kernelService.EmbeddingGenerator.GenerateAsync([chunkText]);
                if (embeddingResult.Count == 0 || embeddingResult[0].Vector.IsEmpty)
                {
                    continue; // 跳过这个 chunk
                }

                var record = new NoteVectorRecord
                {
                    Id = recordId,
                    Text = chunkText,
                    Title = title ?? "未命名笔记",
                    NoteId = noteId,
                    Timestamp = DateTime.UtcNow,
                    Vector = embeddingResult[0].Vector
                };

                await _kernelService.NotesCollection.UpsertAsync(record);
                successCount++;

                // 每索引一个 chunk 就刷新一下状态
                ResponseText = $"正在索引... {successCount}/{chunks.Count}";
            }

            ResponseText = $"✅ 索引完成！共存入 {successCount} 个向量片段。";

            //// 立即检查数据库数量（用于调试）
            //int totalCount = await _kernelService.GetRecordCountAsync();
            //ResponseText += $"\n当前向量库总记录数：{totalCount}";
        }
        catch (Exception ex)
        {
            ResponseText = $"索引失败：{ex.Message}";
        }
    }

    // ====================== 2. RAG 提问（检索 + 生成回答） ======================
    [RelayCommand]
    private async Task Send()
    {
        if (!_isInitialized)
        {
            ResponseText = "系统正在初始化，请稍等...";
            return;
        }

        if (string.IsNullOrWhiteSpace(InputText)) return;

        var question = InputText.Trim();
        InputText = string.Empty;
        ResponseText = "正在检索笔记并思考...";

        try
        {
            // 1. 生成查询向量
            var generated = await _kernelService.EmbeddingGenerator.GenerateAsync([question]);
            ReadOnlyMemory<float> queryEmbedding = generated[0].Vector;

            // 2. 准备搜索选项（关键在这里）
            var searchOptions = new VectorSearchOptions<NoteVectorRecord>{};
            // 3. 执行向量搜索（传入向量 + options）
            var searchResults = _kernelService.NotesCollection.SearchAsync(
                        queryEmbedding,     // 向量
                        top: 6,             // 返回数量（必须用命名参数 top: ）
                        options: searchOptions);

            // 遍历结果（因为返回的是 IAsyncEnumerable）
            var context = new StringBuilder();
            context.AppendLine("以下是用户个人笔记中与问题最相关的片段：\n");

            int count = 0;
            await foreach (var result in searchResults)
            {
                count++;
                context.AppendLine($"【{result.Record.Title}】 (相似度: {result.Score:F3})");
                context.AppendLine(result.Record.Text.Trim());
                context.AppendLine("─".PadRight(50, '─'));
            }

            if (count == 0)
            {
                string notFound = "（未找到足够相似的笔记内容）";
                ResponseText = notFound;
                return;
            }

            // 4. 构建 Prompt 并调用 LLM
            var prompt = $"""
            你是一个helpful的助手，专门基于用户的个人笔记来回答问题。
            请严格使用下面提供的笔记内容回答，不要编造信息。
            如果没有足够相关信息，请诚实说明。

            {context}

            用户问题：{question}

            请用自然、流畅的中文回答，并在合适的地方标注引用的笔记标题。
            """;

            var streamingResult = _kernelService.Kernel.InvokePromptStreamingAsync(prompt);
            bool isFirstChunk = true;
            await foreach (var chunk in streamingResult)
            {
                if (isFirstChunk)
                {
                    ResponseText = string.Empty; // 接收到第一个 chunk 时清空
                    isFirstChunk = false;
                }

                ResponseText += chunk.ToString();
                await Task.Delay(8);
            }
        }
        catch (Exception ex)
        {
            ResponseText = $"发生错误：{ex.Message}";
        }
    }
    // 简单分块方法（可后续优化为带重叠的 TextChunker）
    private List<string> SplitIntoChunks(string text, int maxLength = 600)
    {
        var chunks = new List<string>();
        var current = new StringBuilder();

        foreach (var sentence in text.Split(new[] { '。', '！', '？', '\n' }, StringSplitOptions.RemoveEmptyEntries))
        {
            if (current.Length + sentence.Length > maxLength && current.Length > 0)
            {
                chunks.Add(current.ToString().Trim());
                current.Clear();
            }
            current.Append(sentence).Append('。');
        }

        if (current.Length > 0)
            chunks.Add(current.ToString().Trim());

        return chunks;
    }
}

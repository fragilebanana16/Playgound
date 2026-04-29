using LLMChat.Models;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.Ollama;
using Microsoft.SemanticKernel.Connectors.SqliteVec;
using Microsoft.SemanticKernel.Embeddings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LLMChat.Services;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.SqliteVec;
using System.Net.Http;

public class KernelService
{
    public Kernel Kernel { get; private set; } = null!;
    public IEmbeddingGenerator<string, Embedding<float>> EmbeddingGenerator { get; private set; } = null!;

    // 使用 SqliteCollection 更直接（推荐目前用于 SqliteVec）
    public SqliteCollection<string, NoteVectorRecord> NotesCollection { get; private set; } = null!;

    private const string CollectionName = "MyNotes";
    private readonly string _dbPath = "notes_rag.db";
    private bool _initialized = false;

    public KernelService()
    {
        var builder = Kernel.CreateBuilder();

        builder.AddOllamaChatCompletion("brief-ai", new Uri("http://localhost:11434"));
        builder.AddOllamaEmbeddingGenerator("nomic-embed-text", new Uri("http://localhost:11434"));

        Kernel = builder.Build();
        EmbeddingGenerator = Kernel.GetRequiredService<IEmbeddingGenerator<string, Embedding<float>>>();
    }

    public async Task InitializeAsync()
    {
        if (_initialized) return;
        if (!await IsOllamaRunningAsync())
        {
            throw new Exception("无法连接到 Ollama 服务，请确保 Ollama 已启动 (http://localhost:11434)");
        }
        // 使用 SqliteCollection 直接创建（比 VectorStore.GetCollection 更稳定）
        NotesCollection = new SqliteCollection<string, NoteVectorRecord>(
            connectionString: $"Data Source={_dbPath}",
            name: CollectionName,
            options: new SqliteCollectionOptions
            {
                EmbeddingGenerator = EmbeddingGenerator   // 让它自动生成向量
            });

        // 创建表和向量索引（如果不存在则创建，已存在则跳过）
        await NotesCollection.EnsureCollectionExistsAsync();

        _initialized = true;
    }
    private async Task<bool> IsOllamaRunningAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            // Ollama 默认在 / 路径返回 "Ollama is running"
            var response = await client.GetAsync("http://localhost:11434");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<int> GetRecordCountAsync()
    {
        try
        {
            var results = NotesCollection.SearchAsync(
                "test",//new ReadOnlyMemory<float>(new float[768]), // 随便给一个向量
                top: 100);

            int count = 0;
            await foreach (var _ in results)
                count++;

            return count;
        }
        catch
        {
            return -1; // 表示出错
        }
    }
    public string GetCollectionName() => CollectionName;
}
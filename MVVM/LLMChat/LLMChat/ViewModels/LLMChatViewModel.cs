using Azure;
using Azure.AI.Inference;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LLMChat.Models;
using LLMChat.Models.Dtos;
using LLMChat.Views.Pages;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using static LLMChat.Models.Dtos.CommonProto;
namespace LLMChat.ViewModels;

public partial class LLMChatViewModel : ObservableObject
{
    [ObservableProperty]
    private string _inputText = string.Empty;
    [ObservableProperty]
    private string _selectedModel;

    private string? _freeAIApi;
    public ObservableCollection<ChatMessage> Messages { get; } = new();
    public List<string> Models { get; } = new() { "gpt-4o-mini", "gpt-3.5-turbo-0125", "gpt-3.5-turbo-1106", " gpt-3.5-turbo", "gpt-3.5-turbo-16k" };
    public LLMChatViewModel(IOptions<Models.AppConfig> appConfig)
    {
        _freeAIApi = appConfig.Value.FreeAIApi; ;
        _selectedModel = Models[0];
        // 初始欢迎语
        //Messages.Add(new ChatMessage
        //{
        //    Role = MessageRole.AI,
        //    Content = "你好！",
        //    Timestamp = DateTime.Now
        //});
    }

    //[RelayCommand]
    //private async Task SendMessage()
    //{
    //    if (string.IsNullOrWhiteSpace(InputText)) return;

    //    string userMessage = InputText;

    //    // 1. 添加用户消息
    //    Messages.Add(new ChatMessage
    //    {
    //        Role = MessageRole.User,
    //        Content = userMessage,
    //        Timestamp = DateTime.Now
    //    });

    //    InputText = string.Empty; // 清空输入框

    //    // 2. 模拟 AI 响应
    //    await Task.Delay(1000);
    //    var newMessage = new ChatMessage
    //    {
    //        Role = MessageRole.AI,
    //        Content = $"这是对“{userMessage}”的回复。",
    //        Timestamp = DateTime.Now
    //    };
    //    Messages.Add(newMessage);

    //}

    [RelayCommand]
    private async Task SendMessage()
    {
        if (string.IsNullOrWhiteSpace(InputText)) return;

        string userMessage = InputText;
        Messages.Add(new ChatMessage { Role = MessageRole.User, Content = userMessage, Timestamp = DateTime.Now });
        InputText = string.Empty;

        // 创建一个 AI 消息占位（先保留占位，真正输出在解析后开始）
        var aiMessage = new ChatMessage { Role = MessageRole.AI, Content = "...", Timestamp = DateTime.Now, IsLoading = false };
        Messages.Add(aiMessage);
        aiMessage.IsLoading = true;

        string baseUrl = "https://free.v36.cm/v1/chat/completions";
        string apiKey = _freeAIApi ?? string.Empty;
        if (string.IsNullOrEmpty(apiKey))
            return;
        var requestBody = new
        {
            model = _selectedModel,
            messages = new[]
            {
                new { role = "user", content = userMessage }
            }
            // stream = true // 根据 API 支持可启用
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        using var client = new HttpClient();
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, baseUrl) { Content = content };
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                await Application.Current.Dispatcher.InvokeAsync(() => aiMessage.Content = $"请求失败: {response.StatusCode}");
                Console.WriteLine(err);
                return;
            }

            // 累积完整响应（不在流中把原始 HTML 直接渲染）
            using var stream = await response.Content.ReadAsStreamAsync();
            var buffer = new byte[8192];
            var decoder = Encoding.UTF8.GetDecoder();
            var charBuffer = new char[8192];
            var sb = new StringBuilder();

            int bytesRead;
            while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                int chars = decoder.GetChars(buffer, 0, bytesRead, charBuffer, 0);
                sb.Append(charBuffer, 0, chars);
            }

            // 流结束后解析 JSON，提取 content 字段（完整 HTML / 转义文本）
            string finalHtml = null;
            try
            {
                var full = sb.ToString();
                using (JsonDocument doc = JsonDocument.Parse(full))
                {
                    if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                    {
                        var first = choices[0];
                        if (first.TryGetProperty("message", out var messageElement) &&
                            messageElement.TryGetProperty("content", out var contentElement))
                        {
                            finalHtml = contentElement.GetString();
                        }
                        else if (first.TryGetProperty("text", out var textElem))
                        {
                            finalHtml = textElem.GetString();
                        }
                    }
                }
            }
            catch (JsonException)
            {
                // 解析失败时 finalHtml 保持 null，之后 fallback 使用整个响应文本
            }

            // 决定要逐字符输出的最终文本（HTML 解码并可选择去标签）
            string output;
            if (!string.IsNullOrEmpty(finalHtml))
            {
                output = WebUtility.HtmlDecode(finalHtml);
                output = Regex.Replace(output, "<.*?>", string.Empty);
            }
            else
            {
                // fallback：对整个返回体做解码/去标签
                var fallback = WebUtility.HtmlDecode(sb.ToString());
                output = Regex.Replace(fallback, "<.*?>", string.Empty);
            }

            // 清空占位并按字符逐个输出（打字机效果），全部在 UI 线程更新
            await Application.Current.Dispatcher.InvokeAsync(() => {
                aiMessage.Content = string.Empty;
                aiMessage.IsLoading = false;
            }, DispatcherPriority.Background);

            foreach (var ch in output)
            {
                await Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    aiMessage.Content += ch;
                }, DispatcherPriority.Background);

                await Task.Delay(15); // 可调整速度或移除
            }
        }
        catch (Exception ex)
        {
            await Application.Current.Dispatcher.InvokeAsync(() => aiMessage.Content = $"发生错误: {ex.Message}");
            Console.WriteLine(ex);
        }

        //try
        //{
        //    // 1. 配置客户端（建议把 client 提到类成员变量，不用每次创建）
        //    var credential = new AzureKeyCredential("github_pat_");
        //    var endpoint = new Uri("https://models.github.ai/inference");
        //    var model = "deepseek/DeepSeek-V3-0324";
        //
        //    var client = new ChatCompletionsClient(
        //        endpoint,
        //        credential,
        //        new AzureAIInferenceClientOptions());
        //
        //    var requestOptions = new ChatCompletionsOptions()
        //    {
        //        Messages =
        //        {
        //            new ChatRequestSystemMessage("You are a helpful assistant."),
        //            new ChatRequestUserMessage(userMessage),
        //        },
        //        Temperature = 1.0f,
        //        NucleusSamplingFactor = 1.0f,
        //        MaxTokens = 1000,
        //        Model = model
        //    };
        //
        //    // 使用流式 API
        //    using var response = await client.CompleteStreamingAsync(requestOptions);
        //    aiMessage.Content = string.Empty;
        //
        //    // 逐个处理流中的内容
        //    await foreach (var update in response)
        //    {
        //        if (update.ContentUpdate != null)
        //        {
        //            // 逐个字符添加，加延迟
        //            foreach (var ch in update.ContentUpdate)
        //            {
        //                aiMessage.Content += ch;
        //                await Task.Delay(50);  // 每个字符延迟 50 毫秒
        //            }
        //        }
        //    }
        //}
        //catch (RequestFailedException ex) when ((int)ex.Status == 429)
        //{
        //    aiMessage.Content = "⚠️ 频率过快，请稍后再试。";
        //}
        //catch (Exception ex)
        //{
        //    aiMessage.Content = $"连接失败: {ex.Message}";
        //}
    }
}
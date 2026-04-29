using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LLMChat.Models.Dtos;

public enum MessageRole { User, AI }
public class ChatMessage : INotifyPropertyChanged
{
    private string _content;
    public string Content
    {
        get => _content;
        set
        {
            if (_content != value)
            {
                _content = value;
                OnPropertyChanged(nameof(Content));
            }
        }
    }

    private bool _isLoading;
    public bool IsLoading
    {
        get => _isLoading;
        set
        {
            if (_isLoading != value)
            {
                _isLoading = value;
                OnPropertyChanged(nameof(IsLoading));
                System.Diagnostics.Debug.WriteLine($"IsLoading: {_isLoading}");
            }
        }
    }

    public MessageRole Role { get; set; }
    public DateTime Timestamp { get; set; }

    public event PropertyChangedEventHandler PropertyChanged;

    protected void OnPropertyChanged(string propertyName)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Messaging;
using LLMChat.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Media;
using Wpf.Ui.Controls;
using static LLMChat.Views.Pages.DataService;

namespace LLMChat.ViewModels;

public partial class DataViewModel : ObservableObject, INavigationAware, IRecipient<FanSpeedChangedMessage>
{
    private bool _isInitialized = false;
    private readonly ThrottledValue<string> _fanSpeedThrottler;

    [ObservableProperty]
    private string _fanSpeed = "0";

    public void OnNavigatedTo()
    {
        if (!_isInitialized)
            InitializeViewModel();
    }

    public void OnNavigatedFrom() { }

    private void InitializeViewModel()
    {
    }

    public DataViewModel()
    {
        // 初始化节流器：每 100ms 更新一次 UI
        _fanSpeedThrottler = new ThrottledValue<string>(val => FanSpeed = val, 1000);
        WeakReferenceMessenger.Default.Register(this);
    }

    public void Receive(FanSpeedChangedMessage message)
    {
        // 关键：不要直接给 FanSpeed 赋值，而是交给节流器
        _fanSpeedThrottler.Update(message.Value);
    }
}


using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.DependencyInjection;
using System.Windows;
using MediaHub.Views.Modules;

namespace MediaHub.ViewModels;

public partial class MainWindowViewModel : ObservableObject
{
    private readonly IServiceProvider _sp;

    [ObservableProperty]
    private UIElement? _currentModuleView;

    /// <summary>通知 MainWindow 更新 Tab 按钮样式</summary>
    public event Action<string>? ModuleChanged;

    private string _currentModule = string.Empty;

    public MainWindowViewModel(IServiceProvider serviceProvider)
    {
        _sp = serviceProvider;

        // 默认加载音乐模块
        SwitchModule("music");
    }

    [RelayCommand]
    private void SwitchModule(string module)
    {
        if (_currentModule == module) return;
        _currentModule = module;

        CurrentModuleView = module switch
        {
            "music"   => _sp.GetRequiredService<MusicShellView>(),
            "movie"   => _sp.GetRequiredService<MovieShellView>(),
            "podcast" => _sp.GetRequiredService<PodcastShellView>(),
            _         => CurrentModuleView
        };

        ModuleChanged?.Invoke(module);
    }
}

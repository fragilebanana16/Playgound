using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Windows;
using Wpf.Ui;
using MediaHub.Services;
using MediaHub.ViewModels;
using MediaHub.Views.Modules;
using MediaHub.Views.Pages;

namespace MediaHub;

public partial class App : Application
{
    private IHost? _host;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _host = Host.CreateDefaultBuilder()
            .ConfigureServices(services =>
            {
                // ── WPF UI 服务
                services.AddSingleton<INavigationService, NavigationService>();
                services.AddSingleton<ISnackbarService, SnackbarService>();

                // ── DI 桥接：让 PageService 从容器取 Page 实例
                services.AddSingleton<IPageService, ServiceProviderPageProvider>();

                // ── 窗口
                services.AddSingleton<MainWindow>();
                services.AddSingleton<MainWindowViewModel>();

                // ── 音乐页面
                services.AddSingleton<MusicHomePage>();
                services.AddSingleton<MusicHomeViewModel>();
                services.AddSingleton<MusicRecentPage>();
                services.AddSingleton<MusicRecentViewModel>();
                services.AddSingleton<MusicFavoritePage>();
                services.AddSingleton<MusicFavoriteViewModel>();

                // ── 电影页面
                services.AddSingleton<MovieHomePage>();
                services.AddSingleton<MovieHomeViewModel>();
                services.AddSingleton<MovieWatchlistPage>();
                services.AddSingleton<MovieWatchlistViewModel>();
                services.AddSingleton<MovieHistoryPage>();
                services.AddSingleton<MovieHistoryViewModel>();

                // ── 播客页面
                services.AddSingleton<PodcastDiscoverPage>();
                services.AddSingleton<PodcastDiscoverViewModel>();
                services.AddSingleton<PodcastSubscribedPage>();
                services.AddSingleton<PodcastSubscribedViewModel>();

                // ── 模块壳（Singleton 保留左侧导航状态）
                services.AddSingleton<MusicShellView>();
                services.AddSingleton<MusicShellViewModel>();
                services.AddSingleton<MovieShellView>();
                services.AddSingleton<MovieShellViewModel>();
                services.AddSingleton<PodcastShellView>();
                services.AddSingleton<PodcastShellViewModel>();
            })
            .Build();

        _host.Start();

        var mainWindow = _host.Services.GetRequiredService<MainWindow>();
        mainWindow.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _host?.StopAsync().Wait();
        _host?.Dispose();
        base.OnExit(e);
    }
}

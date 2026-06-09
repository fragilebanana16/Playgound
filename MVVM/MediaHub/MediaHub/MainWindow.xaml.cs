using MediaHub.ViewModels;
using MediaHub.Views.Modules;
using System.Windows;
using System.Windows.Input;

namespace MediaHub;

public partial class MainWindow : Wpf.Ui.Controls.FluentWindow
{
    private readonly MusicShellView _shellMusic;
    private readonly MovieShellView _shellMovie;
    private readonly PodcastShellView _shellPodcast;

    public MainWindow(MainWindowViewModel viewModel,
                      MusicShellView shellMusic,
                      MovieShellView shellMovie,
                      PodcastShellView shellPodcast)
    {
        DataContext = viewModel;
        InitializeComponent();

        _shellMusic = shellMusic;
        _shellMovie = shellMovie;
        _shellPodcast = shellPodcast;

        // 全部加入 Grid，默认只显示音乐
        ContentGrid.Children.Add(_shellMusic);
        ContentGrid.Children.Add(_shellMovie);
        ContentGrid.Children.Add(_shellPodcast);

        _shellMovie.Visibility = Visibility.Collapsed;
        _shellPodcast.Visibility = Visibility.Collapsed;
    }

    private void SwitchModule(string module)
    {
        _shellMusic.Visibility = module == "music" ? Visibility.Visible : Visibility.Collapsed;
        _shellMovie.Visibility = module == "movie" ? Visibility.Visible : Visibility.Collapsed;
        _shellPodcast.Visibility = module == "podcast" ? Visibility.Visible : Visibility.Collapsed;

        BtnMusic.Style = (Style)Resources[module == "music" ? "TopTabButtonActive" : "TopTabButton"];
        BtnMovie.Style = (Style)Resources[module == "movie" ? "TopTabButtonActive" : "TopTabButton"];
        BtnPodcast.Style = (Style)Resources[module == "podcast" ? "TopTabButtonActive" : "TopTabButton"];
    }

    // ── 顶部 Tab 切换
    private void BtnMusic_Click(object sender, RoutedEventArgs e) => SwitchModule("music");
    private void BtnMovie_Click(object sender, RoutedEventArgs e) => SwitchModule("movie");
    private void BtnPodcast_Click(object sender, RoutedEventArgs e) => SwitchModule("podcast");

}

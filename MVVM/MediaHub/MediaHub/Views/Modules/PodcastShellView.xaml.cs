using MediaHub.ViewModels;
using MediaHub.Views.Pages;
using System.Windows;
using System.Windows.Controls;
using Wpf.Ui;

namespace MediaHub.Views.Modules;

public partial class PodcastShellView : UserControl
{
    public PodcastShellView(MusicShellViewModel viewModel, IServiceProvider serviceProvider)
    {
        DataContext = viewModel;
        InitializeComponent();
        PodcastNavView.SetServiceProvider(serviceProvider);
        IsVisibleChanged += OnVisibleChanged;
    }

    private void OnVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
    {
        if ((bool)e.NewValue == false) return;
        // NavigationView 内部字典没初始化完的问题。IsVisibleChanged 触发时 MenuItems 虽然在可视树里，但 NavigationView 内部的字典还没填充完
        Dispatcher.BeginInvoke(System.Windows.Threading.DispatcherPriority.Loaded, () =>
        {
            PodcastNavView.Navigate(typeof(PodcastDiscoverPage));
        });
    }
}

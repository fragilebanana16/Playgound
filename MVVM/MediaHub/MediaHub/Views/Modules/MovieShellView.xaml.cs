using MediaHub.ViewModels;
using MediaHub.Views.Pages;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using Wpf.Ui;

namespace MediaHub.Views.Modules;

public partial class MovieShellView : UserControl
{
    public MovieShellView(MovieShellViewModel viewModel, IServiceProvider serviceProvider)
    {
        DataContext = viewModel;
        InitializeComponent();
        MovieNavView.SetServiceProvider(serviceProvider);
        IsVisibleChanged += OnVisibleChanged;
    }

    private void OnVisibleChanged(object sender, DependencyPropertyChangedEventArgs e)
    {
        if ((bool)e.NewValue == false) return;
        // NavigationView 内部字典没初始化完的问题。IsVisibleChanged 触发时 MenuItems 虽然在可视树里，但 NavigationView 内部的字典还没填充完
        Dispatcher.BeginInvoke(System.Windows.Threading.DispatcherPriority.Loaded, () =>
        {
            MovieNavView.Navigate(typeof(MovieHomePage));
        });
    }
}

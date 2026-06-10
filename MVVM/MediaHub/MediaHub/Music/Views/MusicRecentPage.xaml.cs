using System.Windows;
using Wpf.Ui.Controls;
using MediaHub.Music.ViewModels;
using System.Windows.Controls;

namespace MediaHub.Music.Views;

public partial class MusicRecentPage : Page
{
    public MusicRecentViewModel ViewModel { get; }

    public MusicRecentPage(MusicRecentViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = viewModel;
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        RootGrid.Children.Clear();
        RootGrid.Children.Add(ViewModel.BuildContent());
    }
}

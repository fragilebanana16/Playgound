using System.Windows;
using Wpf.Ui.Controls;
using MediaHub.ViewModels;
using System.Windows.Controls;

namespace MediaHub.Views.Pages;

public partial class MovieHistoryPage : Page
{
    public MovieHistoryViewModel ViewModel { get; }

    public MovieHistoryPage(MovieHistoryViewModel viewModel)
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

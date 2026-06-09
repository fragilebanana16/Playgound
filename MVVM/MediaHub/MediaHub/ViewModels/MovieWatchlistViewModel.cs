using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.ViewModels;

public partial class MovieWatchlistViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "想看",
            "你标记的待看电影",
            Cards);

    private static readonly string[] Cards = ["沙丘2", "奥本海默", "芭比", "蜘蛛侠：纵横宇宙", "疾速追杀4"];
}

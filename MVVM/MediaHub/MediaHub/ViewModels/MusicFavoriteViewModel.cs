using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.ViewModels;

public partial class MusicFavoriteViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "我的收藏",
            "你收藏的音乐",
            Cards);

    private static readonly string[] Cards = ["Bohemian Rhapsody", "Hotel California", "Stairway to Heaven", "Imagine"];
}

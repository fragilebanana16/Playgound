using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.Music.ViewModels;

public partial class MusicRecentViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "最近播放",
            "你最近听过的歌曲",
            Cards);

    private static readonly string[] Cards = ["Shape of You", "Blinding Lights", "Levitating", "Peaches", "Stay", "Heat Waves"];
}

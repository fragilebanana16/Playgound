using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.ViewModels;

public partial class MusicHomeViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "音乐主页",
            "今日为你推荐，发现好音乐",
            Cards);

    private static readonly string[] Cards = ["为你推荐", "热门榜单", "新歌速递", "每日心情", "经典回忆", "我的歌单"];
}

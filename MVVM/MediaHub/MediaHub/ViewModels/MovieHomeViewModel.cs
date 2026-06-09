using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.ViewModels;

public partial class MovieHomeViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "电影首页",
            "院线热映与精选推荐",
            Cards);

    private static readonly string[] Cards = ["院线热映", "高分经典", "最近在看", "猜你喜欢", "即将上映"];
}

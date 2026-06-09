using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.ViewModels;

public partial class MovieHistoryViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "看过",
            "你已经看过的电影",
            Cards);

    private static readonly string[] Cards = ["星际穿越", "盗梦空间", "黑客帝国", "阿凡达", "泰坦尼克号"];
}

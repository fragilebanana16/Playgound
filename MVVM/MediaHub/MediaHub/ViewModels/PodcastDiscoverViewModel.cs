using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.ViewModels;

public partial class PodcastDiscoverViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "发现播客",
            "探索各类精彩播客节目",
            Cards);

    private static readonly string[] Cards = ["科技前沿", "历史文化", "商业洞察", "生活方式", "教育成长"];
}

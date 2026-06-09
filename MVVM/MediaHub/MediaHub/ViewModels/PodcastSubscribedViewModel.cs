using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows;

namespace MediaHub.ViewModels;

public partial class PodcastSubscribedViewModel : ObservableObject
{
    public UIElement BuildContent()
        => MediaHub.Views.Pages.CardHelper.BuildPage(
            "已订阅",
            "你订阅的播客节目",
            Cards);

    private static readonly string[] Cards = ["硅谷早知道", "得到头条", "故事FM", "枪炮病菌与钢铁"];
}

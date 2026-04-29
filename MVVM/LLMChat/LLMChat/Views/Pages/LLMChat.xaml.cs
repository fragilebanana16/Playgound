using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Wpf.Ui.Controls;

namespace LLMChat.Views.Pages;

/// <summary>
/// LLMChat.xaml 的交互逻辑
/// </summary>
public partial class LLMChat : INavigableView<ViewModels.LLMChatViewModel>
{
    public ViewModels.LLMChatViewModel ViewModel { get; }

    public LLMChat(ViewModels.LLMChatViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();

        if (ViewModel?.Messages is INotifyCollectionChanged collection)
        {
            collection.CollectionChanged += (s, e) =>
            {
                if (e.Action == NotifyCollectionChangedAction.Add)
                {
                    // 新消息增加时，确保在 UI 渲染后滚动
                    Dispatcher.BeginInvoke(new Action(() =>
                    {
                        ChatListBox.ScrollIntoView(e.NewItems[0]);
                    }));
                }
            };
        }
    }
}

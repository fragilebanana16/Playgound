using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Wpf.Ui.Controls;
using TextBlock = System.Windows.Controls.TextBlock;

namespace MediaHub.Views.Pages;

internal static class CardHelper
{
    private static readonly Color[] Palette =
    [
        Color.FromRgb(0x00, 0x78, 0xD4),
        Color.FromRgb(0x10, 0x7C, 0x10),
        Color.FromRgb(0xC2, 0x39, 0x5B),
        Color.FromRgb(0x88, 0x17, 0x98),
        Color.FromRgb(0xEA, 0x6C, 0x00),
        Color.FromRgb(0x00, 0x78, 0x9A),
    ];

    public static UIElement BuildPage(string title, string desc, IEnumerable<string> cardTitles)
    {
        var root = new StackPanel { Margin = new Thickness(32, 28, 32, 28) };

        root.Children.Add(new TextBlock
        {
            Text = title,
            FontSize = 24,
            FontWeight = FontWeights.Bold,
            Foreground = (Brush)Application.Current.Resources["TextFillColorPrimaryBrush"],
            Margin = new Thickness(0, 0, 0, 6)
        });

        root.Children.Add(new TextBlock
        {
            Text = desc,
            FontSize = 13,
            Foreground = (Brush)Application.Current.Resources["TextFillColorSecondaryBrush"],
            Margin = new Thickness(0, 0, 0, 24)
        });

        var wrap = new WrapPanel { Orientation = Orientation.Horizontal };
        int i = 0;
        foreach (var ct in cardTitles)
        {
            var color = Palette[i++ % Palette.Length];
            var card = new Card
            {
                Width = 160,
                Height = 110,
                Margin = new Thickness(0, 0, 12, 12),
                Padding = new Thickness(14),
                Cursor = System.Windows.Input.Cursors.Hand
            };

            var sp = new StackPanel();
            sp.Children.Add(new Border
            {
                Width = 28, Height = 4,
                CornerRadius = new CornerRadius(2),
                Background = new SolidColorBrush(color),
                HorizontalAlignment = HorizontalAlignment.Left,
                Margin = new Thickness(0, 0, 0, 8)
            });
            sp.Children.Add(new TextBlock
            {
                Text = ct,
                FontSize = 13,
                FontWeight = FontWeights.SemiBold,
                TextWrapping = TextWrapping.Wrap,
                Foreground = (Brush)Application.Current.Resources["TextFillColorPrimaryBrush"]
            });

            card.Content = sp;
            wrap.Children.Add(card);
        }

        root.Children.Add(wrap);

        var scroll = new ScrollViewer
        {
            Content = root,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto
        };
        return scroll;
    }
}

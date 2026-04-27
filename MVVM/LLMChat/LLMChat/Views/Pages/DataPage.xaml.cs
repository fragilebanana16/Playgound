using CommunityToolkit.Mvvm.Messaging;
using LLMChat.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
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
using System.Windows.Threading;
using WebSocketSharp;
using WebSocketSharp.Server;
using Wpf.Ui.Controls;
using static LLMChat.Models.Dtos.CommonProto;
using MessageBox = System.Windows.MessageBox;
using MessageBoxButton = System.Windows.MessageBoxButton;

namespace LLMChat.Views.Pages;

/// <summary>
/// DataPage.xaml 的交互逻辑
/// </summary>
public partial class DataPage : INavigableView<ViewModels.DataViewModel>
{
    public ViewModels.DataViewModel ViewModel { get; }

    private WebSocketServer wsServer;
    private DispatcherTimer uptimeTimer;
    private TimeSpan uptime = TimeSpan.Zero;

    public DataPage(ViewModels.DataViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;

        InitializeComponent();
        InitializeUptimeTimer();
    }

    private void InitializeUptimeTimer()
    {
        uptimeTimer = new DispatcherTimer();
        uptimeTimer.Interval = TimeSpan.FromSeconds(1);
        uptimeTimer.Tick += (s, e) =>
        {
            uptime = uptime.Add(TimeSpan.FromSeconds(1));
            UptimeText.Text = $"{uptime.Hours:D2}:{uptime.Minutes:D2}:{uptime.Seconds:D2}";
        };
    }
    private void PortTextBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        var textBox = sender as Wpf.Ui.Controls.TextBox;
        if (textBox == null)
            return;
        string port = textBox?.Text ?? "";
        bool portValid = !string.IsNullOrWhiteSpace(port) &&
                         int.TryParse(port, out int portNum) &&
                         portNum >= 1 && portNum <= 65535;

        textBox!.BorderBrush = portValid ? new SolidColorBrush(Colors.Green) : new SolidColorBrush(Colors.Red);
    }
    private void IpTextBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        var textBox = sender as Wpf.Ui.Controls.TextBox;
        if(textBox == null)
            return;
        string ipText = textBox?.Text ?? "";
        if (IPAddress.TryParse(ipText, out _))
        {
            // 有效 - 显示绿色或正常状态
            textBox!.BorderBrush = new SolidColorBrush(Colors.Green);
        }
        else if (!string.IsNullOrEmpty(ipText))
        {
            // 无效 - 显示红色
            textBox!.BorderBrush = new SolidColorBrush(Colors.Red);
        }
    }
    private void StartButton_Click(object sender, RoutedEventArgs e)
    {
        // 如果服务器正在运行，则停止
        if (wsServer != null && wsServer.IsListening)
        {
            StopServer();
            return;
        }

        // 否则启动服务器
        StartServer();
    }

    private void StartServer()
    {
        try
        {
            string ip = IpTextBox.Text.Trim();
            string portStr = PortTextBox.Text.Trim();
            if (!int.TryParse(portStr, out int port) || port < 1 || port > 65535)
            {
                MessageBox.Show("端口号无效，请输入 1-65535 之间的数字", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            wsServer = new WebSocketServer($"ws://{ip}:{port}");
            wsServer.AddWebSocketService<DataService>("/data");
            wsServer.Start();

            if (wsServer.IsListening)
            {
                StatusText.Text = "已连接";
                StatusIndicator.Fill = Application.Current.Resources["PaletteSuccessBrush"] as System.Windows.Media.Brush;
                AddressText.Text = $"ws://{ip}:{port}";
                StartButton.Content = "停止";  // 改成停止
                StartButton.Appearance = ControlAppearance.Secondary;
                IpTextBox.IsEnabled = false;
                PortTextBox.IsEnabled = false;
                uptime = TimeSpan.Zero;
                uptimeTimer.Start();
                MessageBox.Show($"WebSocket Server 已启动\n地址: ws://{ip}:{port}", "成功", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"启动失败: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void StopServer()
    {
        try
        {
            wsServer?.Stop();
            StartButton.Appearance = ControlAppearance.Success;
            StatusText.Text = "已断开";
            StatusIndicator.Fill = new SolidColorBrush(Colors.Gray);  // 灰色表示离线
            AddressText.Text = "";
            StartButton.Content = "启动";  // 改回启动
            IpTextBox.IsEnabled = true;
            PortTextBox.IsEnabled = true;
            uptimeTimer.Stop();

            MessageBox.Show("WebSocket Server 已停止", "成功", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"停止失败: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void StopButton_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            if (wsServer != null)
            {
                wsServer.Stop();
                wsServer = null;

                // 更新 UI
                StatusText.Text = "未连接";
                StatusIndicator.Fill = Application.Current.Resources["PaletteErrorBrush"] as System.Windows.Media.Brush;

                StartButton.IsEnabled = true;
                //StopButton.IsEnabled = false;
                IpTextBox.IsEnabled = true;
                PortTextBox.IsEnabled = true;

                uptimeTimer.Stop();
                ClientCountText.Text = "0";

                MessageBox.Show("WebSocket Server 已停止", "成功", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"停止失败: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void SendMessageButton_Click(object sender, RoutedEventArgs e)
    {
        //var dialog = new SendMessageDialog();
        //dialog.Owner = Window.GetWindow(this);
        //dialog.ShowDialog();

        //if (dialog.DialogResult == true && !string.IsNullOrEmpty(dialog.MessageContent))
        //{
        //    string message = dialog.MessageContent;

        //    // 广播消息给所有连接的客户端
        //    if (wsServer != null && wsServer.IsListening)
        //    {
        //        try
        //        {
        //            var service = wsServer.WebSocketServices["/data"];
        //            if (service != null)
        //            {
        //                service.Sessions.Broadcast(message);
        //                MessageBox.Show($"消息已发送: {message}", "成功", MessageBoxButton.OK, MessageBoxImage.Information);
        //            }
        //        }
        //        catch (Exception ex)
        //        {
        //            MessageBox.Show($"发送失败: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
        //        }
        //    }
        //    else
        //    {
        //        MessageBox.Show("Server 未运行", "错误", MessageBoxButton.OK, MessageBoxImage.Warning);
        //    }
        //}
    }

    // 静态方法供 DataService 调用，更新 UI
    public static DashboardPage CurrentPage { get; set; }

    public void UpdateFanSpeed(int speed)
    {
        Dispatcher.Invoke(() =>
        {
            FanSpeedValue.Text = speed.ToString();
            FanSpeedProgress.Value = speed;
        });
    }

    public void UpdateTemperature(double temp)
    {
        Dispatcher.Invoke(() =>
        {
            TempValue.Text = temp.ToString("F1");
        });
    }

    public void UpdateClientCount(int count)
    {
        Dispatcher.Invoke(() =>
        {
            ClientCountText.Text = count.ToString();
        });
    }

    public void UpdatePowerStatus(string status)
    {
        Dispatcher.Invoke(() =>
        {
            PowerStatusBadge.Content = status;
        });
    }
}

// WebSocket 服务类
public class DataService : WebSocketBehavior
{
    public record FanSpeedChangedMessage(string Value);
    protected override void OnOpen()
    {
        // 客户端连接
        UpdateClientCount();
    }

    protected override void OnClose(CloseEventArgs e)
    {
        // 客户端断开
        UpdateClientCount();
    }

    protected override void OnMessage(MessageEventArgs e)
    {
        // 接收来自客户端的消息
        System.Diagnostics.Debug.WriteLine($"收到消息: {e.Data}");

        // 1. 反序列化 JSON
        var data = JsonSerializer.Deserialize<FanControlProtocol>(e.Data);

        // 2. 根据命令类型处理逻辑
        if (data?.command == "SetFanSpeed")
        {
            WeakReferenceMessenger.Default.Send(new FanSpeedChangedMessage(data.percent.ToString()));
        }
        else if (e.Data.StartsWith("TEMP:"))
        {
            // 假设接收的是温度信息
            string tempStr = e.Data.Substring(5);
            if (double.TryParse(tempStr, out double temp))
            {
                //DataViewModel.Instance.UpdateTemperature(temp);
            }
        }
    }

    private void UpdateClientCount()
    {
        //int count = Sessions.Count;
        //DashboardPage.CurrentPage?.UpdateClientCount(count);
    }
}

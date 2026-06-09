using Microsoft.Extensions.DependencyInjection;
using System.Windows;
using Wpf.Ui;

namespace MediaHub.Services;

/// <summary>
/// 桥接 DI 容器和 wpfui 的 PageService，让导航时从容器取 Page 实例而不是 new。
/// </summary>
// 3.x 的正确写法
public class ServiceProviderPageProvider : IPageService
{
    private readonly IServiceProvider _sp;
    public ServiceProviderPageProvider(IServiceProvider sp) => _sp = sp;

    public T? GetPage<T>() where T : class => _sp.GetService<T>();
    public FrameworkElement? GetPage(Type pageType) => _sp.GetService(pageType) as FrameworkElement;
}

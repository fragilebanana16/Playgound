using LLMChat.Services;
using LLMChat.ViewModels;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Configuration;
using System.Data;
using System.IO;
using System.Windows;
using System.Windows.Threading;
using Wpf.Ui;
namespace LLMChat
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        private static readonly IHost _host = Host.CreateDefaultBuilder()
        .ConfigureAppConfiguration(c =>
        {
            c.SetBasePath(Path.GetDirectoryName(AppContext.BaseDirectory));
        })
        .ConfigureServices(
            (context, services) =>
            {
                // App Host
                services.AddHostedService<ApplicationHostService>();

                // Page resolver service
                services.AddSingleton<IPageService, PageService>();

                // Theme manipulation
                services.AddSingleton<IThemeService, ThemeService>();

                // TaskBar manipulation
                services.AddSingleton<ITaskBarService, TaskBarService>();

                // Service containing navigation, same as INavigationWindow... but without window
                services.AddSingleton<INavigationService, NavigationService>();

                // Main window with navigation
                services.AddSingleton<INavigationWindow, Views.MainWindow>();
                services.AddSingleton<ViewModels.MainWindowViewModel>();

                // Views and ViewModels
                services.AddSingleton<Views.Pages.DashboardPage>();
                services.AddSingleton<ViewModels.DashboardViewModel>();
                services.AddSingleton<Views.Pages.DataPage>();
                services.AddSingleton<ViewModels.DataViewModel>();
                services.AddSingleton<Views.Pages.SettingsPage>();
                services.AddSingleton<ViewModels.SettingsViewModel>();
                services.AddSingleton<Views.Pages.LLMChat>();
                services.AddSingleton<ViewModels.LLMChatViewModel>();

                // Configuration
                services.Configure<Models.AppConfig>(context.Configuration.GetSection(nameof(Models.AppConfig)));
            }
        )
        .Build();

        /// <summary>
        /// Gets registered service.
        /// </summary>
        /// <typeparam name="T">Type of the service to get.</typeparam>
        /// <returns>Instance of the service or <see langword="null"/>.</returns>
        public static T? GetService<T>()
            where T : class
        {
            return _host.Services.GetService(typeof(T)) as T;
        }

        /// <summary>
        /// Occurs when the application is loading.
        /// </summary>
        private async void OnStartup(object sender, StartupEventArgs e)
        {
            await _host.StartAsync();
        }

        /// <summary>
        /// Occurs when the application is closing.
        /// </summary>
        private async void OnExit(object sender, ExitEventArgs e)
        {
            await _host.StopAsync();

            _host.Dispose();
        }

        /// <summary>
        /// Occurs when an exception is thrown by an application but not handled.
        /// </summary>
        private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            // For more info see https://docs.microsoft.com/en-us/dotnet/api/system.windows.application.dispatcherunhandledexception?view=windowsdesktop-6.0
        }
    }

}

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services;
using SimpleTrader.Domain.Services.AuthenticationServices;
using SimpleTrader.Domain.Services.TransactionServices;
using SimpleTrader.EntityFrameWork;
using SimpleTrader.EntityFrameWork.Services;
using SimpleTrader.FinancialModelingPrepAPI;
using SimpleTrader.FinancialModelingPrepAPI.Services;
using SimpleTrader.WPF.State.Accounts;
using SimpleTrader.WPF.State.Assets;
using SimpleTrader.WPF.State.Authenticators;
using SimpleTrader.WPF.State.Navigators;
using SimpleTrader.WPF.ViewModels;
using SimpleTrader.WPF.ViewModels.Factories;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Markup;
using static SimpleTrader.WPF.ViewModels.Factories.ISimpleTraderViewModelFactory;

namespace SimpleTrader.WPF
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {

        protected override async void OnStartup(StartupEventArgs e)
        {

            IServiceProvider serviceProvider = this.CreateServiceProvider();

            Window window = serviceProvider.GetRequiredService<MainWindow>();
            window.Show();

            // test
            // new StockPriceService().GetPrice("AAPL");

            //new MajorIndexService().GetMajorIndex(Domain.Models.MajorIndexType.SP500).ContinueWith((task) =>
            //{
            //    var index = task.Result;
            //});

            //IDataService<Account> accountService = new AccountDataService(new SimpleTraderDbContextFactory());
            //IStockPriceService stockPriceService = new StockPriceService();
            //IBuyStockService buyStockService = new BuyStockService(stockPriceService, accountService);
            //Account buyer = await accountService.Get(1);
            //await buyStockService.BuyStock(buyer, "T", 5);

            //IBuyStockService buyStockService = serviceProvider.GetRequiredService<IBuyStockService>();

            // register/login
            //IAuthenticationService authentication = serviceProvider.GetRequiredService<IAuthenticationService>();
            //await authentication.Register("testIAuth@mail.com", "testRegUser", "123", "123");

            //await authentication.Login("testRegUser", "123");

            base.OnStartup(e);
        }

        private IServiceProvider CreateServiceProvider()
        {
            IServiceCollection services = new ServiceCollection();

            string apiKey = ConfigurationManager.AppSettings.Get("financeApiKey");
            services.AddSingleton<FinancialModelingPrepHttpClientFactory>(new FinancialModelingPrepHttpClientFactory(apiKey));

            // register service
            services.AddSingleton<SimpleTraderDbContextFactory>();
            services.AddSingleton<IAuthenticationService, AuthenticationService>();
            services.AddSingleton<IDataService<Account>, AccountDataService>();
            services.AddSingleton<IAccountService, AccountDataService>();
            services.AddSingleton<IStockPriceService, StockPriceService>();
            services.AddSingleton<IBuyStockService, BuyStockService>();
            services.AddSingleton<IMajorIndexService, MajorIndexService>();

            services.AddSingleton<ISimpleTraderViewModelFactory, SimpleTraderViewModelFactory>();
            services.AddSingleton<BuyViewModel>();
            services.AddSingleton<PortfolioViewModel>();
            services.AddSingleton<ViewModelDelegateRenavigator<HomeViewModel>>();
            services.AddSingleton<AssetSummaryViewModel>();

            services.AddSingleton<HomeViewModel>(services =>
            {
                return new HomeViewModel(services.GetRequiredService<AssetSummaryViewModel>(), MajorIndexListingViewModel.LoadMajorIndexViewModel(services.GetRequiredService<IMajorIndexService>())); // api call count limit, only one single in application
            });

            // register delegate
            services.AddSingleton<CreateViewModel<HomeViewModel>>(services =>
            {
                return () => services.GetRequiredService<HomeViewModel>();
            });

            services.AddSingleton<CreateViewModel<BuyViewModel>>(services =>
            {
                return () => services.GetRequiredService<BuyViewModel>(); // new  BuyViewModel() if each time needs a new model
            });

            services.AddSingleton<CreateViewModel<PortfolioViewModel>>(services =>
            {
                return () => services.GetRequiredService<PortfolioViewModel>();
            });

            services.AddSingleton<CreateViewModel<LoginViewModel>>(services =>
            {
                return () => new LoginViewModel(services.GetRequiredService<IAuthenticator>(),
                    services.GetRequiredService<ViewModelDelegateRenavigator<HomeViewModel>>()); // login to home
            });

            services.AddSingleton<INavigator, Navigator>();
            services.AddSingleton<IAuthenticator, Authenticator>();
            services.AddSingleton<IAccountStore, AccountStore>();
            services.AddSingleton<AssetStore>();

            services.AddScoped<MainViewModel>(); // model have state, like current model
            services.AddScoped<BuyViewModel>();
            services.AddScoped<MainWindow>(s => new MainWindow(s.GetRequiredService<MainViewModel>()));

            return services.BuildServiceProvider();
        }
    }
}
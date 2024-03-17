using Microsoft.Extensions.DependencyInjection;
using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services;
using SimpleTrader.Domain.Services.AuthenticationServices;
using SimpleTrader.Domain.Services.TransactionServices;
using SimpleTrader.EntityFrameWork;
using SimpleTrader.EntityFrameWork.Services;
using SimpleTrader.FinancialModelingPrepAPI.Services;
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
using static SimpleTrader.WPF.ViewModels.Factories.IRootSimpleTraderViewModelFactory;

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

            IBuyStockService buyStockService = serviceProvider.GetRequiredService<IBuyStockService>();

            // register/login
            IAuthenticationService authentication = serviceProvider.GetRequiredService<IAuthenticationService>();
            await authentication.Register("testIAuth@mail.com", "testRegUser", "123", "123");

            await authentication.Login("testRegUser", "123");

            base.OnStartup(e);
        }

        private IServiceProvider CreateServiceProvider()
        {
            IServiceCollection services = new ServiceCollection();

            // register service
            services.AddSingleton<SimpleTraderDbContextFactory>();
            services.AddSingleton<IAuthenticationService, AuthenticationService>();
            services.AddSingleton<IDataService<Account>, AccountDataService>();
            services.AddSingleton<IAccountService, AccountDataService>();
            services.AddSingleton<IStockPriceService, StockPriceService>();
            services.AddSingleton<IBuyStockService, BuyStockService>();
            services.AddSingleton<IMajorIndexService, MajorIndexService>();

            services.AddSingleton<IRootSimpleTraderViewModelFactory, RootSimpleTraderViewModelFactory>();
            services.AddSingleton<ISimpleTraderViewModelFactory<HomeViewModel>, HomeViewModelFactory>();
            services.AddSingleton<ISimpleTraderViewModelFactory<PortfolioViewModel>, PortfolioViewModelFactory>();
            services.AddSingleton<ISimpleTraderViewModelFactory<MajorIndexListingViewModel>, MajorIndexListingViewModelFactory>();
            
            services.AddScoped<INavigator, Navigator>();
            services.AddScoped<MainViewModel>(); // model have state, like current model
            services.AddScoped<BuyViewModel>();
            services.AddScoped<MainWindow>(s => new MainWindow(s.GetRequiredService<MainViewModel>()));

            return services.BuildServiceProvider();
        }
    }
}
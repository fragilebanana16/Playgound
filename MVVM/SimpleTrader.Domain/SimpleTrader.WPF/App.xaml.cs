using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
using SimpleTrader.WPF.HostBuilder;
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
        private readonly IHost _host;

        public App()
        {
            _host = CreateHostBuilder().Build();
        }

        public static IHostBuilder CreateHostBuilder(string[] args = null)
        {
            return Host.CreateDefaultBuilder(args)
                .AddConfiguration()
                .AddFinanceAPI()
                .AddDbContext()
                .AddServices()
                .AddStores()
                .AddViewModels()
                .AddViews();
        }


        protected override async void OnStartup(StartupEventArgs e)
        {
            _host.Start();

            Window window = _host.Services.GetRequiredService<MainWindow>();
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

            // config doesnt apply migration, run it manually
            SimpleTraderDbContextFactory contextFactory = _host.Services.GetRequiredService<SimpleTraderDbContextFactory>();
            using (SimpleTraderDbContext context = contextFactory.CreateDbContext())
            {
                context.Database.Migrate();
            }

            base.OnStartup(e);
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            await _host.StopAsync();
            _host.Dispose();

            base.OnExit(e);
        }
    }
}
using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services;
using SimpleTrader.Domain.Services.TransactionServices;
using SimpleTrader.EntityFrameWork;
using SimpleTrader.EntityFrameWork.Services;
using SimpleTrader.FinancialModelingPrepAPI.Services;
using SimpleTrader.WPF.ViewModels;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace SimpleTrader.WPF
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        protected override async void OnStartup(StartupEventArgs e)
        {


            Window window = new MainWindow();
            window.DataContext = new MainViewModel();
            window.Show();

            // test
            // new StockPriceService().GetPrice("AAPL");

            //new MajorIndexService().GetMajorIndex(Domain.Models.MajorIndexType.SP500).ContinueWith((task) =>
            //{
            //    var index = task.Result;
            //});

            IDataService<Account> accountService = new AccountDataService(new SimpleTraderDbContextFactory());
            IStockPriceService stockPriceService = new StockPriceService();
            IBuyStockService buyStockService = new BuyStockService(stockPriceService, accountService);
            Account buyer = await accountService.Get(1);
            await buyStockService.BuyStock(buyer, "T", 5);
            base.OnStartup(e);
        }
    }
}

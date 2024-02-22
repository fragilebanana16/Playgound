using SimpleTrader.EntityFrameWork;
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
        protected override void OnStartup(StartupEventArgs e)
        {
            new MajorIndexService().GetMajorIndex(Domain.Models.MajorIndexType.SP500).ContinueWith((task) =>
            {
                var index = task.Result;
            });

            Window window = new MainWindow();
            window.DataContext = new MainViewModel();
            window.Show();

            // test
            new StockPriceService().GetPrice("AAPL");

            base.OnStartup(e);
        }
    }
}

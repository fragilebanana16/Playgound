using SimpleTrader.Domain.Services;
using SimpleTrader.WPF.ViewModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Shapes;

namespace SimpleTrader.WPF.Commands
{
    public class SearchSymbolCommand : AsyncCommandBase
    {
        private readonly ISearchSymbolViewModel _viewModel;
        private readonly IStockPriceService _stockPriceService;

        public SearchSymbolCommand(ISearchSymbolViewModel viewModel, IStockPriceService stockPriceService)
        {
            _viewModel = viewModel;
            _stockPriceService = stockPriceService;

            _viewModel.PropertyChanged += ViewModel_PropertyChanged;
        }

        public override async Task ExecuteAsync(object parameter)
        {
            try
            {
                double stockPrice = await _stockPriceService.GetPrice(_viewModel.Symbol);
                _viewModel.SearchResultSymbol = _viewModel.Symbol;
                _viewModel.StockPrice = stockPrice;
            }
            catch (Exception e)
            {
                _viewModel.ErrorMessage = "Failed to get Symbol info...";
            }
        }
        public override bool CanExecute(object parameter)
        {
            return _viewModel.CanSearchSymbol && base.CanExecute(parameter);
        }

        private void ViewModel_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(ISearchSymbolViewModel.CanSearchSymbol))
            {
                OnCanExecuteChanged();
            }
        }
    }
}

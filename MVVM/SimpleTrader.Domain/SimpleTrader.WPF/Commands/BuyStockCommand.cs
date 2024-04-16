using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services.TransactionServices;
using SimpleTrader.WPF.State.Accounts;
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
    public class BuyStockCommand : AsyncCommandBase
    {
        private readonly BuyViewModel _buyViewModel;
        private readonly IBuyStockService _buyStockService;
        private readonly IAccountStore _accountStore;

        public BuyStockCommand(BuyViewModel buyViewModel, IBuyStockService buyStockService, IAccountStore accountStore)
        {
            _buyViewModel = buyViewModel;
            _buyStockService = buyStockService;
            _accountStore = accountStore;

            _buyViewModel.PropertyChanged += BuyViewModel_PropertyChanged;
        }

        public override async Task ExecuteAsync(object parameter)
        {
            _buyViewModel.ErrorMessage = string.Empty;
            _buyViewModel.StatusMessage = string.Empty;

            try
            {
                string symbol = _buyViewModel.Symbol;
                int shares = _buyViewModel.SharesToBuy;
                Account account = await _buyStockService.BuyStock(_accountStore.CurrentAccount,
                    symbol, shares);
                _accountStore.CurrentAccount = account;
                _buyViewModel.StatusMessage = $"Successfully purchased {shares} share of {symbol}";
            }
            catch (Exception e)
            {
                _buyViewModel.ErrorMessage = e.Message;
            }
        }

        public override bool CanExecute(object parameter)
        {
            return _buyViewModel.CanBuyStock && base.CanExecute(parameter);
        }

        private void BuyViewModel_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(BuyViewModel.CanBuyStock))
            {
                OnCanExecuteChanged();
            }
        }
    }
}

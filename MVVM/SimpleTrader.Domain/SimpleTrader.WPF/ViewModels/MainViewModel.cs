using SimpleTrader.WPF.Commands;
using SimpleTrader.WPF.State.Authenticators;
using SimpleTrader.WPF.State.Navigators;
using SimpleTrader.WPF.ViewModels.Factories;
using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Input;

namespace SimpleTrader.WPF.ViewModels
{
    public class MainViewModel : ViewModelBase
    {
        public INavigator Navigator { get; set; }
        public IAuthenticator Authenticator { get; }
        public ICommand UpdateCurrentViewModelCommand { get; }
        public MainViewModel(INavigator navigator, IAuthenticator authenticator, ISimpleTraderViewModelFactory rootSimpleTraderViewModelFactory)
        {
            Navigator = navigator;
            Authenticator = authenticator;
            UpdateCurrentViewModelCommand = new UpdateCurrentViewModelCommand(navigator, rootSimpleTraderViewModelFactory);
            UpdateCurrentViewModelCommand.Execute(ViewType.Login);
        }
    }
}

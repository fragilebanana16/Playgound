using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SimpleTrader.WPF.State.Authenticators;
using SimpleTrader.WPF.State.Navigators;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.WPF.ViewModels.Factories
{
    public class LoginViewModelFactory : ISimpleTraderViewModelFactory<LoginViewModel>
    {
        private readonly IAuthenticator _authenticator;
        public readonly IRenavigator _reNavigator;
        public readonly MainViewModel _mvm;

        public LoginViewModelFactory(MainViewModel mvm, IAuthenticator authenticator, IRenavigator reNavigator)
        {
            _authenticator = authenticator;
            _reNavigator = reNavigator;
            _mvm = mvm;
        }
        public LoginViewModel CreateViewModel()
        {
            return new LoginViewModel(_mvm, _authenticator, _reNavigator);
        }
    }
}

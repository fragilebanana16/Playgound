using SimpleTrader.WPF.State.Authenticators;
using SimpleTrader.WPF.State.Navigators;
using SimpleTrader.WPF.ViewModels;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace SimpleTrader.WPF.Commands
{
    public class LoginCommand : AsyncCommandBase
    {
        private readonly LoginViewModel _loginViewModel; 
        private readonly IAuthenticator _authenticator;
        private readonly IRenavigator _renavigator;

        public LoginCommand(LoginViewModel loginViewModel, IAuthenticator authenticator, IRenavigator renavigator)
        {
            _authenticator = authenticator;
            _renavigator = renavigator;
            _loginViewModel = loginViewModel;
            _loginViewModel.PropertyChanged += LoginViewModel_PropertyChanged;
        }


        public override async Task ExecuteAsync(object parameter)
        {
            try
            {
                bool success = await _authenticator.Login(_loginViewModel.Username, parameter.ToString());
                if (success)
                {
                    _renavigator.Renavigate();
                    //_navigator.UpdateCurrentViewModelCommand.Execute(ViewType.Home);
                }
            }
            catch (Exception e)
            {
                _loginViewModel.ErrorMessage = e.Message;
            }

        }

        private void LoginViewModel_PropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            
        }
    }
}

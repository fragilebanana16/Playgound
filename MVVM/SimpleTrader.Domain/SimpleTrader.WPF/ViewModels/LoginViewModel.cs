using SimpleTrader.WPF.Commands;
using SimpleTrader.WPF.State.Authenticators;
using SimpleTrader.WPF.State.Navigators;
using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Input;

namespace SimpleTrader.WPF.ViewModels
{
	public class LoginViewModel : ViewModelBase
	{
		private string _username = "testRegUser";
		public string Username
		{
			get
			{
				return _username;
			}
			set
			{
				_username = value;
				OnPropertyChanged(nameof(Username));
			}
		}

		public ICommand LoginCommand { get; }
		public LoginViewModel(MainViewModel mvm, IAuthenticator authenticator, IRenavigator reNavigator)
		{
			LoginCommand = new LoginCommand(mvm, this, authenticator, reNavigator);
		}
	}
}

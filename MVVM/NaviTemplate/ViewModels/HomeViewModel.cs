using NaviTemplate.Commands;
using NaviTemplate.Services;
using NaviTemplate.Stores;
using System.Windows.Input;

namespace NaviTemplate.ViewModels
{
    public class HomeViewModel : ViewModelBase
    {
        public string WelcomeMessage => "Welcome to my application.";

        public ICommand NavigateAccountCommand { get; }


        public HomeViewModel(NavigationStore navigationStore)
        {
            NavigateAccountCommand = new NavigateCommand<AccountViewModel>(new NavigationService<AccountViewModel>(
                navigationStore, () => new AccountViewModel(navigationStore)));
        }
    }
}

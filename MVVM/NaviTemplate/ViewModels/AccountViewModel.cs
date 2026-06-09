using NaviTemplate.Commands;
using NaviTemplate.Stores;
using System.Windows.Input;

namespace NaviTemplate.ViewModels
{
    public class AccountViewModel : ViewModelBase
    {
        public string Name => "SingletonSean";

        public ICommand NavigateHomeCommand { get; }

        public AccountViewModel(NavigationStore navigationStore)
        {
            NavigateHomeCommand = new NavigateCommand<HomeViewModel>(navigationStore, () => new HomeViewModel(navigationStore));
        }
    }
}

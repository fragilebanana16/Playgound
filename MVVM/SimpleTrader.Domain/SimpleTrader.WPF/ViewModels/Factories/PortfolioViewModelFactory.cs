using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.WPF.ViewModels.Factories
{

    public class PortfolioViewModelFactory : ISimpleTraderViewModelFactory<PortfolioViewModel>
    {
        // note: circular DI!!!
        //private ISimpleTraderViewModelFactory<PortfolioViewModel> _portfolioViewModelFactory;

        //public PortfolioViewModelFactory(ISimpleTraderViewModelFactory<PortfolioViewModel> portfolioViewModelFactory)
        //{
        //    _portfolioViewModelFactory = portfolioViewModelFactory;
        //}
        // note: circular DI!!!

        public PortfolioViewModelFactory()
        {

        }

        public PortfolioViewModel CreateViewModel()
        {
            return new PortfolioViewModel();
        }
    }
}

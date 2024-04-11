using SimpleTrader.WPF.State.Navigators;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.WPF.ViewModels
{
    public class HomeViewModel : ViewModelBase
    {
        public AssetSummaryViewModel AssetSummaryViewModel { get; } // home can bind its  property
        public MajorIndexListingViewModel MajorIndexListingViewModel { get; }

        public HomeViewModel(AssetSummaryViewModel assetSummaryViewModel, MajorIndexListingViewModel majorIndexListingViewModel)
        {
            AssetSummaryViewModel = assetSummaryViewModel;
            MajorIndexListingViewModel = majorIndexListingViewModel;
        }
    }
}

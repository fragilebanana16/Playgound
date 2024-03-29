﻿using SimpleTrader.WPF.State.Navigators;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.WPF.ViewModels
{
    public class HomeViewModel : ViewModelBase
    {
        public MajorIndexListingViewModel MajorIndexListingViewModel { get; }

        public HomeViewModel(MajorIndexListingViewModel majorIndexViewModel)
        {
            MajorIndexListingViewModel = majorIndexViewModel;
        }
    }
}

﻿using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace SimpleTrader.WPF.ViewModels
{
    public class MajorIndexListingViewModel : ViewModelBase
    {
        private MajorIndex _dowJones;
        private MajorIndex _nasdaq;
        private MajorIndex _sp500;

        private readonly IMajorIndexService _majorIndexService;

        public MajorIndexListingViewModel(IMajorIndexService majorIndexService)
        {
            _majorIndexService = majorIndexService;
        }

        public MajorIndex DowJones
        {
            get
            {
                return _dowJones;
            }
            set
            {
                _dowJones = value;
                OnPropertyChanged(nameof(DowJones));
            }
        }

        public MajorIndex Nasdaq
        {
            get
            {
                return _nasdaq;
            }
            set
            {
                _nasdaq = value;
                OnPropertyChanged(nameof(Nasdaq));
            }
        }

        public MajorIndex SP500
        {
            get
            {
                return _sp500;
            }
            set
            {
                _sp500 = value;
                OnPropertyChanged(nameof(SP500));
            }
        }

        /// <summary>
        /// only the model wanted, model async data, otherwise we need to wait, where the caller needs to wait, the root caller might be the main ui
        /// </summary>
        /// <param name="majorIndexService"></param>
        /// <returns></returns>
        public static MajorIndexListingViewModel LoadMajorIndexViewModel(IMajorIndexService majorIndexService)
        {
            MajorIndexListingViewModel majorIndexViewModel = new MajorIndexListingViewModel(majorIndexService);
            majorIndexViewModel.LoadMajorIndexViewModel(); // no wait
            return majorIndexViewModel;
        }

        private void LoadMajorIndexViewModel()
        {
            _majorIndexService.GetMajorIndex(MajorIndexType.DowJones).ContinueWith(task =>
            {
                if (task.Exception == null)
                {
                    this.DowJones = task.Result;
                }
            });

            _majorIndexService.GetMajorIndex(MajorIndexType.Nasdaq).ContinueWith(task =>
            {
                if (task.Exception == null)
                {
                    this.Nasdaq = task.Result;
                }
            }); ;

            _majorIndexService.GetMajorIndex(MajorIndexType.SP500).ContinueWith(task =>
            {
                if (task.Exception == null)
                {
                    this.SP500 = task.Result;
                }
            }); ;
        }
    }
}

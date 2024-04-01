using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.WPF.ViewModels
{
    public class AssetViewModel : ViewModelBase // inherient viewModelBase to avoid memory leaks? Binding ui to non-property change class may leads to leak
    {
        public string Symbol { get; }
        public int Shares { get; }

        public AssetViewModel(string symbol, int shares)
        {
            Symbol = symbol;
            Shares = shares;
        }
    }
}

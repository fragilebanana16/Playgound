using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.FinancialModelingPrepAPI.Results
{
    public class CompanyPrice
    {
        public string Symbol { get; set; }
        public double Price { get; set; }
    }

    public class CompaniesPrices
    {
        public List<CompanyPrice> CompaniesPriceList { get; set; }
    }
}

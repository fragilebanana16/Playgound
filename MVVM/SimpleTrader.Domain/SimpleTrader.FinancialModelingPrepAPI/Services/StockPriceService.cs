using Newtonsoft.Json;
using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services;
using SimpleTrader.FinancialModelingPrepAPI.Results;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SimpleTrader.FinancialModelingPrepAPI.Services
{
    public class StockPriceService : IStockPriceService
    {
        private readonly FinancialModelingPrepHttpClient _httpClient;

        public StockPriceService(FinancialModelingPrepHttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<double> GetPrice(string symbol)
        {
            string uri = "stock/real-time-price/" + symbol;
            CompaniesPrices stockPriceResult = await _httpClient.GetAsync<CompaniesPrices>(uri);
            return stockPriceResult.CompaniesPriceList[0].Price;
        }
    }
}

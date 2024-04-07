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
        private readonly FinancialModelingPrepHttpClientFactory _httpClientFactory;

        public StockPriceService(FinancialModelingPrepHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<double> GetPrice(string symbol)
        {
            string uri = "stock/real-time-price/" + symbol;
            using (FinancialModelingPrepHttpClient client = _httpClientFactory.CreateHttpClient())
            {
                CompaniesPrices stockPriceResult = await client.GetAsync<CompaniesPrices>(uri);
                return stockPriceResult.CompaniesPriceList[0].Price;
            }
        }
    }
}

﻿using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SimpleTrader.FinancialModelingPrepAPI;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.WPF.HostBuilder
{
    public static class AddFinanceAPIHostBuilderExtensions
    {
        public static IHostBuilder AddFinanceAPI(this IHostBuilder host)
        {
            host.ConfigureServices((context, services) =>
            {
                //string apiKey = context.Configuration.GetValue<string>("FINANCE_API_KEY");
                //services.AddSingleton(new FinancialModelingPrepAPIKey(apiKey));

                //services.AddHttpClient<FinancialModelingPrepHttpClient>(c =>
                //{
                //    c.BaseAddress = new Uri("https://financialmodelingprep.com/api/v3/");
                //});

                string apiKey = context.Configuration.GetConnectionString("FINANCE_API_KEY");
                services.AddSingleton<FinancialModelingPrepHttpClientFactory>(new FinancialModelingPrepHttpClientFactory(apiKey));

            });

            return host;
        }
    }
}

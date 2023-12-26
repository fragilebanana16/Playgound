using Newtonsoft.Json;
using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace SimpleTrader.FinancialModelingPrepAPI.Services
{
    public class MajorIndexService : IMajorIndexService
    {
        public async Task<MajorIndex> GetMajorIndex(MajorIndexType indexType)
        {
            string uri = "https://financialmodelingprep.com/api/v3/majors-indexes/" + GetUriSuffix(indexType);
            using (HttpClient client = new HttpClient())
            {
                HttpResponseMessage rsp = await client.GetAsync(uri + "?apikey=" + ConfigurationManager.AppSettings.Get("financeApiKey"));
                string jsonRsp = await rsp.Content.ReadAsStringAsync();
                MajorIndex majorIndex = JsonConvert.DeserializeObject<MajorIndex>(jsonRsp);
                majorIndex.Type = indexType;
                return majorIndex;
            }
        }

        private string GetUriSuffix(MajorIndexType indexType)
        {
            switch (indexType)
            {
                case MajorIndexType.DowJones:
                    return ".DJI";
                case MajorIndexType.Nasdaq:
                    return ".IXIC";
                case MajorIndexType.SP500:
                    return ".INX";
                default:
                    throw new Exception("MajorIndexType does not have a suffix defined.");
            }
        }
    }
}

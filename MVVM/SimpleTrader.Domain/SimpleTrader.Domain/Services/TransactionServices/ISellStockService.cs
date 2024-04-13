using SimpleTrader.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace SimpleTrader.Domain.Services.TransactionServices
{
    public interface ISellStockService
    {
        /// <summary>
        /// Sell a stock for an account.
        /// </summary>
        /// <param name="seller">The account of the seller.</param>
        /// <param name="symbol">The symbol sold.</param>
        /// <param name="shares">The amount of shares to sell.</param>
        /// <returns>The updated account.</returns>
        Task<Account> SellStock(Account seller, string symbol, int shares);
    }
}

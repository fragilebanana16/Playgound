using Moq;
using NUnit.Framework;
using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services.TransactionServices;
using SimpleTrader.Domain.Services;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace SimpleTrader.Domain.Test.Services.TransactionServices
{
    [TestFixture]
    public class SellStockServiceTests
    {
        private SellStockService _sellStockService;

        private Mock<IStockPriceService> _mockStockPriceService;
        private Mock<IDataService<Account>> _mockAccountService;

        [SetUp]
        public void SetUp()
        {
            _mockStockPriceService = new Mock<IStockPriceService>();
            _mockAccountService = new Mock<IDataService<Account>>();

            _sellStockService = new SellStockService(_mockStockPriceService.Object, _mockAccountService.Object);
        }

        [Test]
        public void SellStock_WithInsufficientShares_ThrowsInsufficientSharesException()
        {
            string expectedSymbol = "T";
            int expectedAccountShares = 0;
            int expectedRequiredShares = 10;
            Account seller = CreateAccount(expectedSymbol, expectedAccountShares);

            Exception exception = Assert.ThrowsAsync<Exception>(
                () => _sellStockService.SellStock(seller, expectedSymbol, expectedRequiredShares));

            Assert.AreEqual("accountShares < shares", exception.Message);
        }

        [Test]
        public void SellStock_WithInvalidSymbol_ThrowsInvalidSymbolExceptionForSymbol()
        {
            string expectedInvalidSymbol = "bad_symbol";
            Account seller = CreateAccount(expectedInvalidSymbol, 10);
            _mockStockPriceService.Setup(s => s.GetPrice(expectedInvalidSymbol)).ThrowsAsync(new Exception(expectedInvalidSymbol));

            Exception exception = Assert.ThrowsAsync<Exception>(() => _sellStockService.SellStock(seller, expectedInvalidSymbol, 5));
            Assert.AreEqual(expectedInvalidSymbol, exception.Message);
        }

        [Test]
        public void SellStock_WithGetPriceFailure_ThrowsException()
        {
            Account seller = CreateAccount(It.IsAny<string>(), 10);
            _mockStockPriceService.Setup(s => s.GetPrice(It.IsAny<string>())).ThrowsAsync(new Exception());

            Assert.ThrowsAsync<Exception>(() => _sellStockService.SellStock(seller, It.IsAny<string>(), 5));
        }

        [Test]
        public void SellStock_WithAccountUpdateFailure_ThrowsException()
        {
            Account seller = CreateAccount(It.IsAny<string>(), 10);
            _mockAccountService.Setup(s => s.Update(It.IsAny<int>(), It.IsAny<Account>())).ThrowsAsync(new Exception());

            Assert.ThrowsAsync<Exception>(() => _sellStockService.SellStock(seller, It.IsAny<string>(), 5));
        }

        [Test]
        public async Task SellStock_WithSuccessfulSell_ReturnsAccountWithNewTransaction()
        {
            int expectedTransactionCount = 2;
            Account seller = CreateAccount(It.IsAny<string>(), 10);

            seller = await _sellStockService.SellStock(seller, It.IsAny<string>(), 5);
            int actualTransactionCount = seller.AssetTransactions.Count;

            Assert.AreEqual(expectedTransactionCount, actualTransactionCount);
        }

        [Test]
        public async Task SellStock_WithSuccessfulSell_ReturnsAccountWithNewBalance()
        {
            double expectedBalance = 100;
            Account seller = CreateAccount(It.IsAny<string>(), 10);
            _mockStockPriceService.Setup(s => s.GetPrice(It.IsAny<string>())).ReturnsAsync(50);

            seller = await _sellStockService.SellStock(seller, It.IsAny<string>(), 2);
            double actualBalance = seller.Balance;

            Assert.AreEqual(expectedBalance, actualBalance);
        }

        private Account CreateAccount(string symbol, int shares)
        {
            return new Account()
            {
                AssetTransactions = new List<AssetTransaction>()
                {
                    new AssetTransaction()
                    {
                        Asset = new Asset()
                        {
                            Symbol = symbol
                        },
                        IsPurchase = true,
                        Shares = shares
                    }
                }
            };
        }
    }
}

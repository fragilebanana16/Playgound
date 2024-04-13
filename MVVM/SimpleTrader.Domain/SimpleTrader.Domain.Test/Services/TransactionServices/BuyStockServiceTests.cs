using Moq;
using NUnit.Framework;
using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services.TransactionServices;
using SimpleTrader.Domain.Services;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using System.Linq;

namespace SimpleTrader.Domain.Test.Services.TransactionServices
{
    [TestFixture]
    public class BuyStockServiceTests
    {
        private Mock<IStockPriceService> _mockStockPriceService;
        private Mock<IDataService<Account>> _mockAccountService;
        private BuyStockService _buyStockService;

        [SetUp]
        public void SetUp()
        {
            _mockStockPriceService = new Mock<IStockPriceService>();
            _mockAccountService = new Mock<IDataService<Account>>();

            _buyStockService = new BuyStockService(_mockStockPriceService.Object, _mockAccountService.Object);
        }

        [Test]
        public void BuyStock_WithInvalidSymbol_ThrowsInvalidSymbolExceptionForSymbol()
        {
            string expectedInvalidSymbol = "bad_symbol";
            _mockStockPriceService.Setup(s => s.GetPrice(expectedInvalidSymbol)).ThrowsAsync(new Exception(expectedInvalidSymbol));

            Exception excpetion = Assert.ThrowsAsync<Exception>(
                () => _buyStockService.BuyStock(It.IsAny<Account>(), expectedInvalidSymbol, It.IsAny<int>()));

            Assert.AreEqual(expectedInvalidSymbol, excpetion.Message);
        }

        [Test]
        public void BuyStock_WithGetPriceFailure_ThrowsException()
        {
            _mockStockPriceService.Setup(s => s.GetPrice(It.IsAny<string>())).ThrowsAsync(new Exception());

            Assert.ThrowsAsync<Exception>(
                () => _buyStockService.BuyStock(It.IsAny<Account>(), It.IsAny<string>(), It.IsAny<int>()));
        }

        [Test]
        public void BuyStock_WithInsufficientFunds_ThrowsInsufficientFundsExceptionForBalances()
        {
            double expectedAccountBalance = 0;
            double expectedRequiredBalance = 100;
            Account buyer = CreateAccount(expectedAccountBalance);
            _mockStockPriceService.Setup(s => s.GetPrice(It.IsAny<string>())).ReturnsAsync(expectedRequiredBalance);

            Exception exception = Assert.ThrowsAsync<Exception>(
                () => _buyStockService.BuyStock(buyer, It.IsAny<string>(), 1));

            Assert.AreEqual("transactionPrice > buyer.Balance", exception.Message);
        }

        [Test]
        public void BuyStock_WithAccountUpdateFailure_ThrowsException()
        {
            Account buyer = CreateAccount(1000);
            _mockStockPriceService.Setup(s => s.GetPrice(It.IsAny<string>())).ReturnsAsync(100);
            _mockAccountService.Setup(s => s.Update(It.IsAny<int>(), It.IsAny<Account>())).Throws(new Exception());

            Assert.ThrowsAsync<Exception>(() => _buyStockService.BuyStock(buyer, It.IsAny<string>(), 1));
        }

        [Test]
        public async Task BuyStock_WithSuccessfulPurchase_ReturnsAccountWithNewTransaction()
        {
            int expectedTransactionCount = 1;
            Account buyer = CreateAccount(1000);
            _mockStockPriceService.Setup(s => s.GetPrice(It.IsAny<string>())).ReturnsAsync(100);

            buyer = await _buyStockService.BuyStock(buyer, It.IsAny<string>(), 1);
            int actualTransactionCount = buyer.AssetTransactions.Count();

            Assert.AreEqual(expectedTransactionCount, actualTransactionCount);
        }

        [Test]
        public async Task BuyStock_WithSuccessfulPurchase_ReturnsAccountWithNewBalance()
        {
            double expectedBalance = 0;
            Account buyer = CreateAccount(100);
            _mockStockPriceService.Setup(s => s.GetPrice(It.IsAny<string>())).ReturnsAsync(50);

            buyer = await _buyStockService.BuyStock(buyer, It.IsAny<string>(), 2);
            double actualBalance = buyer.Balance;

            Assert.AreEqual(expectedBalance, actualBalance);
        }

        private Account CreateAccount(double balance)
        {
            return new Account()
            {
                Balance = balance,
                AssetTransactions = new List<AssetTransaction>()
            };
        }
    }
}

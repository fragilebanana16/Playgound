using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.EntityFrameWork
{
    public class SimpleTraderDbContextFactory
    {
        private readonly string _connectionString;

        public SimpleTraderDbContextFactory(string connectionString)
        {
            _connectionString = connectionString;
        }

        public SimpleTraderDbContext CreateDbContext()
        {
            DbContextOptionsBuilder<SimpleTraderDbContext> options = new DbContextOptionsBuilder<SimpleTraderDbContext>();
            options.UseSqlServer(_connectionString);
            // options.UseSqlServer(@"Data Source=(local)\SQLEXPRESS;Initial Catalog=LifeRecorder;Integrated Security=True;Pooling=False");
            return new SimpleTraderDbContext(options.Options);
        }
    }
}

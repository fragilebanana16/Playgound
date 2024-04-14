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
        private readonly Action<DbContextOptionsBuilder> _configureDbContext;

        public SimpleTraderDbContextFactory(Action<DbContextOptionsBuilder> configureDbContext)
        {
            _configureDbContext = configureDbContext;
        }

        public SimpleTraderDbContext CreateDbContext()
        {
            DbContextOptionsBuilder<SimpleTraderDbContext> options = new DbContextOptionsBuilder<SimpleTraderDbContext>();
            _configureDbContext(options);
            // options.UseSqlServer(@"Data Source=(local)\SQLEXPRESS;Initial Catalog=LifeRecorder;Integrated Security=True;Pooling=False");
            return new SimpleTraderDbContext(options.Options);
        }
    }
}

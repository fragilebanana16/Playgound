using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.EntityFrameWork
{
    public class SimpleTraderDbContextFactory:IDesignTimeDbContextFactory<SimpleTraderDbContext>
    {
        public SimpleTraderDbContext CreateDbContext(string[] args = null)
        {
            DbContextOptionsBuilder<SimpleTraderDbContext> options = new DbContextOptionsBuilder<SimpleTraderDbContext>();
            options.UseSqlServer(@"Data Source=(local)\SQLEXPRESS;Initial Catalog=LifeRecorder;Integrated Security=True;Pooling=False");
            return new SimpleTraderDbContext(options.Options);
        }
    }
}

using Microsoft.EntityFrameworkCore;
using SimpleTrader.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.EntityFrameWork
{
    public class SimpleTraderDbContext : DbContext
    {
        //public DbSet<User> Users { get; set; }
        //public DbSet<Account> Accounts { get; set; }
        //public DbSet<AssetTransaction> AssetTransactions { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql("User ID=postgres;Password=jaydean;Host=localhost;Port=5432;Database=mydb;");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //modelBuilder.Entity<AssetTransaction>().OwnsOne(a => a.Stock);
            base.OnModelCreating(modelBuilder);
        }
    }
}

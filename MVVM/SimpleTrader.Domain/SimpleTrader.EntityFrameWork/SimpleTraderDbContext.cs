using Microsoft.EntityFrameworkCore;
using SimpleTrader.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace SimpleTrader.EntityFrameWork
{
    public class SimpleTraderDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<AssetTransaction> AssetTransactions { get; set; }

        public SimpleTraderDbContext(DbContextOptions dbContextOptions):base(dbContextOptions) {}
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 所有权实体:OwnsOne 用于定义所有权关系，并配置如何在数据库中存储所有权实体的数据。
            // 而 Include 则用于加载与主实体相关联的数据，通过生成 JOIN 语句来实现
            modelBuilder.Entity<AssetTransaction>().OwnsOne(a => a.Asset);
            base.OnModelCreating(modelBuilder);
        }
    }
}

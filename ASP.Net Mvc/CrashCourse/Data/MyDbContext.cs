using CrashCourse.Models;
using Microsoft.EntityFrameworkCore;
using System;

public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options) : base(options) { }

    public DbSet<Item> Items { get; set; }

    public DbSet<SerialNumber> SerialNumbers { get; set; }
    public DbSet<Category> Categories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ItemClient>().HasKey(ic => new
        {
            ic.ItemId,
            ic.ClientId
        });
        modelBuilder.Entity<Item>().HasData(
            new Item { Id = 4, Name = "microphone", Price = 40 }
            );
        modelBuilder.Entity<SerialNumber>().HasData(
            new SerialNumber { Id = 10, Name = "MIC150", ItemId = 4 }
            );
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Electronics" },
            new Category { Id = 2, Name = "Books" }
            );
        base.OnModelCreating(modelBuilder);
    }
}
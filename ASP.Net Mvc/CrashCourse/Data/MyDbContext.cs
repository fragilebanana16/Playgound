using CrashCourse.Models;
using Microsoft.EntityFrameworkCore;
using System;

public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options) : base(options) { }

    public DbSet<Item> Items { get; set; }
}
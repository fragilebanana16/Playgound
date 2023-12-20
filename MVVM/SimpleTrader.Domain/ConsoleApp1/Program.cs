using SimpleTrader.Domain.Models;
using SimpleTrader.Domain.Services;
using SimpleTrader.EntityFrameWork;
using SimpleTrader.EntityFrameWork.Services;
using System;
using System.Linq;

namespace ConsoleApp1
{
    class Program
    {
        static void Main(string[] args)
        {
            IDataService<User> userService = new GenericDataService<User>(new SimpleTraderDbContextFactory());
            // Create
            //userService.Create(new User { Username = "Test" }).Wait();

            // Retreive
            //Console.WriteLine(userService.GetAll().Result.Count());
            //Console.WriteLine(userService.Get(1).Result);

            // Update
            //Console.WriteLine(userService.Update(1, new User { Username = "updated username" }).Result);

            // Delete
            //Console.WriteLine(userService.Delete(1).Result);

            Console.ReadLine();
        }
    }
}

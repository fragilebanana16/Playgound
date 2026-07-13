using System.ComponentModel.DataAnnotations.Schema;

namespace CrashCourse.Models;

public class Item
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public double Price { get; set; }
    public SerialNumber? SerialNumber { get; set; }
    public int? CategoryId { get; set; }
    [ForeignKey("CategoryId")]
    public Category? Category { get; set; }
}


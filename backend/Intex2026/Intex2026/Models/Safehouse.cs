using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class Safehouse
{
    [Key]
    public int SafehouseId { get; set; }
    public string SafehouseCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public DateOnly OpenDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CapacityGirls { get; set; }
    public int CapacityStaff { get; set; }
    public int CurrentOccupancy { get; set; }
    public string? Notes { get; set; }
}

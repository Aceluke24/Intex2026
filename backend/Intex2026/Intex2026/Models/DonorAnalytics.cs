using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class DonorAnalytics
{
    [Key]
    public int Id { get; set; }

    public int DonorId { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal RiskScore { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LifetimeValue { get; set; }

    public string Status { get; set; } = "Active"; // Active | AtRisk | HighPotential
    public DateTime LastUpdated { get; set; }
}

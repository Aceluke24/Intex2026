using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class ResidentAnalytics
{
    [Key]
    public int Id { get; set; }

    public int ResidentId { get; set; }

    [Column(TypeName = "decimal(9,2)")]
    public decimal ProgressScore { get; set; }

    public string Status { get; set; } = "Improving"; // Improving | AtRisk | Ready
    public DateTime LastUpdated { get; set; }
}

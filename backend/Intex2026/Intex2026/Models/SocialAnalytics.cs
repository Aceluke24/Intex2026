using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class SocialAnalytics
{
    [Key]
    public int Id { get; set; }

    public string Platform { get; set; } = string.Empty;

    [Column(TypeName = "decimal(9,6)")]
    public decimal EngagementRate { get; set; }

    public string BestPostTime { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}

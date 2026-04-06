using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class SafehouseMonthlyMetric
{
    [Key]
    public int MetricId { get; set; }

    public int SafehouseId { get; set; }
    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    public DateOnly MonthStart { get; set; }
    public DateOnly MonthEnd { get; set; }
    public int ActiveResidents { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal AvgEducationProgress { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal AvgHealthScore { get; set; }

    public int ProcessRecordingCount { get; set; }
    public int HomeVisitationCount { get; set; }
    public int IncidentCount { get; set; }
    public string? Notes { get; set; }
}

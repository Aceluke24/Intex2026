using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class OrganizationalGoal
{
    [Key]
    public int GoalId { get; set; }

    // Admissions | HomeVisits | ProcessRecordings | MonetaryDonations | Reintegrations | IncidentResolutions | Expenses
    public string GoalCategory { get; set; } = string.Empty;

    // nullable = org-wide goal not scoped to a single safehouse
    public int? SafehouseId { get; set; }
    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TargetValue { get; set; }

    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }

    public string? Description { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

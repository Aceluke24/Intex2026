using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class InterventionPlan
{
    [Key]
    public int PlanId { get; set; }

    public int ResidentId { get; set; }
    [ForeignKey(nameof(ResidentId))]
    public Resident? Resident { get; set; }

    public string PlanCategory { get; set; } = string.Empty; // Safety | Psychosocial | Education | Physical Health | Legal | Reintegration
    public string? PlanDescription { get; set; }
    public string? ServicesProvided { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? TargetValue { get; set; }

    public DateOnly TargetDate { get; set; }
    public string Status { get; set; } = string.Empty; // Open | In Progress | Achieved | On Hold | Closed
    public DateOnly? CaseConferenceDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

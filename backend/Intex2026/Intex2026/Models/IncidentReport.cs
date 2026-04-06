using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class IncidentReport
{
    [Key]
    public int IncidentId { get; set; }

    public int ResidentId { get; set; }
    [ForeignKey(nameof(ResidentId))]
    public Resident? Resident { get; set; }

    public int SafehouseId { get; set; }
    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    public DateOnly IncidentDate { get; set; }
    public string IncidentType { get; set; } = string.Empty; // Behavioral | Medical | Security | RunawayAttempt | SelfHarm | ConflictWithPeer | PropertyDamage
    public string Severity { get; set; } = string.Empty; // Low | Medium | High
    public string? Description { get; set; }
    public string? ResponseTaken { get; set; }
    public bool Resolved { get; set; }
    public DateOnly? ResolutionDate { get; set; }
    public string? ReportedBy { get; set; }
    public bool FollowUpRequired { get; set; }
}

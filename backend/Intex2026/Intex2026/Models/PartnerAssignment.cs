using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class PartnerAssignment
{
    [Key]
    public int AssignmentId { get; set; }

    public int PartnerId { get; set; }
    [ForeignKey(nameof(PartnerId))]
    public Partner? Partner { get; set; }

    public int? SafehouseId { get; set; }
    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    public string ProgramArea { get; set; } = string.Empty; // Education | Wellbeing | Operations | Transport | Maintenance
    public DateOnly AssignmentStart { get; set; }
    public DateOnly? AssignmentEnd { get; set; }
    public string? ResponsibilityNotes { get; set; }
    public bool IsPrimary { get; set; }
    public string Status { get; set; } = string.Empty; // Active | Ended
}

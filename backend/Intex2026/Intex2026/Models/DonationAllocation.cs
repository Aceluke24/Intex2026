using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class DonationAllocation
{
    [Key]
    public int AllocationId { get; set; }

    public int DonationId { get; set; }
    [ForeignKey(nameof(DonationId))]
    public Donation? Donation { get; set; }

    public int SafehouseId { get; set; }
    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    public string ProgramArea { get; set; } = string.Empty; // Education | Wellbeing | Operations | Transport | Maintenance | Outreach

    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountAllocated { get; set; }

    public DateOnly AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }
}

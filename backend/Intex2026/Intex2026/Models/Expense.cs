using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class Expense
{
    [Key]
    public int ExpenseId { get; set; }

    // nullable = org-wide expense not tied to a specific safehouse
    public int? SafehouseId { get; set; }
    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    // Education | Wellbeing | Operations | Transport | Maintenance | Outreach | General
    public string ProgramArea { get; set; } = string.Empty;

    // Rent | Food | Salaries | Medical | Utilities | Supplies | Transport | Other
    public string Category { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public DateOnly ExpenseDate { get; set; }

    public string? Description { get; set; }
    public string? RecordedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

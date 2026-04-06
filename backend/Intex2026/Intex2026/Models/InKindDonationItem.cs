using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class InKindDonationItem
{
    [Key]
    public int ItemId { get; set; }

    public int DonationId { get; set; }
    [ForeignKey(nameof(DonationId))]
    public Donation? Donation { get; set; }

    public string ItemName { get; set; } = string.Empty;
    public string ItemCategory { get; set; } = string.Empty; // Food | Supplies | Clothing | SchoolMaterials | Hygiene | Furniture | Medical
    public int Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty; // pcs | boxes | kg | sets | packs

    [Column(TypeName = "decimal(18,2)")]
    public decimal EstimatedUnitValue { get; set; }

    public string? IntendedUse { get; set; }     // Meals | Education | Shelter | Hygiene | Health
    public string? ReceivedCondition { get; set; } // New | Good | Fair
}

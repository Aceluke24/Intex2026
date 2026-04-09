using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class Donation
{
    [Key]
    public int DonationId { get; set; }

    public int? SupporterId { get; set; }
    [ForeignKey(nameof(SupporterId))]
    public Supporter? Supporter { get; set; }

    public string DonationType { get; set; } = string.Empty; // Monetary | InKind | Time | Skills | SocialMedia
    public DateOnly DonationDate { get; set; }
    public string ChannelSource { get; set; } = string.Empty; // Campaign | Event | Direct | SocialMedia | PartnerReferral
    public string? CurrencyCode { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? EstimatedValue { get; set; }

    public string? ImpactUnit { get; set; } // pesos | items | hours | campaigns
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public int? DonationTypeId { get; set; }
    [ForeignKey(nameof(DonationTypeId))]
    public DonationType? DonationTypeRef { get; set; }
    public string? Notes { get; set; }
    public int? CreatedByPartnerId { get; set; }
    public int? ReferralPostId { get; set; }
}

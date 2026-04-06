using System.ComponentModel.DataAnnotations;

namespace Intex2026.Models;

public class Supporter
{
    [Key]
    public int SupporterId { get; set; }
    public string SupporterType { get; set; } = string.Empty; // MonetaryDonor | InKindDonor | Volunteer | SkillsContributor | SocialMediaAdvocate | PartnerOrganization
    public string DisplayName { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string RelationshipType { get; set; } = string.Empty; // Local | International | PartnerOrganization
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = string.Empty; // Active | Inactive
    public DateOnly? FirstDonationDate { get; set; }
    public string? AcquisitionChannel { get; set; } // Website | SocialMedia | Event | WordOfMouth | PartnerReferral | Church
    public DateTime CreatedAt { get; set; }
}

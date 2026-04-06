using System.ComponentModel.DataAnnotations;

namespace Intex2026.Models;

public class Partner
{
    [Key]
    public int PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public string PartnerType { get; set; } = string.Empty; // Organization | Individual
    public string RoleType { get; set; } = string.Empty;    // Education | Evaluation | SafehouseOps | FindSafehouse | Logistics | Transport | Maintenance
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Region { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Notes { get; set; }
}

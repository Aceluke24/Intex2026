using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class HomeVisitation
{
    [Key]
    public int VisitationId { get; set; }

    public int ResidentId { get; set; }
    [ForeignKey(nameof(ResidentId))]
    public Resident? Resident { get; set; }

    public DateOnly VisitDate { get; set; }

    public string CoordinationKind { get; set; } = "HomeVisit";

    public string? VisitTime { get; set; }

    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty; // Initial Assessment | Routine Follow-Up | Reintegration Assessment | Post-Placement Monitoring | Emergency
    public string? LocationVisited { get; set; }
    public string? FamilyMembersPresent { get; set; }
    public string? Purpose { get; set; }
    public string? Observations { get; set; }
    public string? FamilyCooperationLevel { get; set; } // Highly Cooperative | Cooperative | Neutral | Uncooperative
    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string? VisitOutcome { get; set; } // Favorable | Needs Improvement | Unfavorable | Inconclusive
}

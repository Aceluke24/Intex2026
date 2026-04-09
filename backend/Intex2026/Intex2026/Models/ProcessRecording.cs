using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class ProcessRecording
{
    [Key]
    public int RecordingId { get; set; }

    public int ResidentId { get; set; }
    [ForeignKey(nameof(ResidentId))]
    public Resident? Resident { get; set; }

    public DateOnly SessionDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string SessionType { get; set; } = string.Empty; // Individual | Group
    public int? SessionDurationMinutes { get; set; }
    public string EmotionalStateObserved { get; set; } = string.Empty; // Calm | Anxious | Sad | Angry | Hopeful | Withdrawn | Happy | Distressed
    public string? EmotionalStateEnd { get; set; }
    [Required]
    public string SessionNarrative { get; set; } = string.Empty;
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool ProgressNoted { get; set; }
    public bool ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }
}

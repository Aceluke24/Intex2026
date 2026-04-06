using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class EducationRecord
{
    [Key]
    public int EducationRecordId { get; set; }

    public int ResidentId { get; set; }
    [ForeignKey(nameof(ResidentId))]
    public Resident? Resident { get; set; }

    public DateOnly RecordDate { get; set; }
    public string? EducationLevel { get; set; }    // Primary | Secondary | Vocational | CollegePrep
    public string? SchoolName { get; set; }
    public string? EnrollmentStatus { get; set; }

    [Column(TypeName = "decimal(5,4)")]
    public decimal? AttendanceRate { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? ProgressPercent { get; set; }

    public string? CompletionStatus { get; set; }  // NotStarted | InProgress | Completed
    public string? Notes { get; set; }
}

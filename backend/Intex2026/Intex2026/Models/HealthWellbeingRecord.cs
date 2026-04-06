using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class HealthWellbeingRecord
{
    [Key]
    public int HealthRecordId { get; set; }

    public int ResidentId { get; set; }
    [ForeignKey(nameof(ResidentId))]
    public Resident? Resident { get; set; }

    public DateOnly RecordDate { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal? GeneralHealthScore { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal? NutritionScore { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal? SleepQualityScore { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal? EnergyLevelScore { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? HeightCm { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? WeightKg { get; set; }

    [Column(TypeName = "decimal(4,2)")]
    public decimal? Bmi { get; set; }

    public bool MedicalCheckupDone { get; set; }
    public bool DentalCheckupDone { get; set; }
    public bool PsychologicalCheckupDone { get; set; }
    public string? Notes { get; set; }
}

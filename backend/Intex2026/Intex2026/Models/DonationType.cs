using System.ComponentModel.DataAnnotations;

namespace Intex2026.Models;

public class DonationType
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

using Microsoft.AspNetCore.Identity;

namespace Intex2026.Models;

public class ApplicationUser : IdentityUser
{
    // Links a donor-role user to their supporters record
    public int? SupporterId { get; set; }
}

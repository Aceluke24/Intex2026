using Microsoft.AspNetCore.Mvc;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/preferences")]
public class PreferencesController : ControllerBase
{
    // POST /api/preferences/theme
    // Sets a browser-accessible (non-HttpOnly) cookie for dark/light mode.
    // React reads document.cookie to detect the preference.
    [HttpPost("theme")]
    public IActionResult SetTheme([FromBody] ThemeRequest req)
    {
        var theme = req.Theme?.ToLower() switch
        {
            "dark" => "dark",
            "light" => "light",
            _ => "light"
        };

        Response.Cookies.Append("theme", theme, new CookieOptions
        {
            HttpOnly = false,          // Browser-accessible so React can read it
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddYears(1)
        });

        return Ok(new { theme });
    }

    // GET /api/preferences/theme
    [HttpGet("theme")]
    public IActionResult GetTheme()
    {
        var theme = Request.Cookies.TryGetValue("theme", out var value) ? value : "light";
        return Ok(new { theme });
    }
}

public record ThemeRequest(string? Theme);

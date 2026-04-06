using Intex2026.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Intex2026.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid credentials." });

        // PasswordSignInAsync handles the partial 2FA cookie automatically
        var result = await _signInManager.PasswordSignInAsync(
            user, req.Password, isPersistent: false, lockoutOnFailure: false);

        if (result.RequiresTwoFactor)
            return Ok(new { requiresMfa = true });

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid credentials." });

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new { email = user.Email, roles });
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logged out." });
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new
        {
            email = user.Email,
            userName = user.UserName,
            supporterId = user.SupporterId,
            roles,
            mfaEnabled = await _userManager.GetTwoFactorEnabledAsync(user)
        });
    }

    // POST /api/auth/register  (Admin-only in production; open in dev for seeding)
    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            SupporterId = req.SupporterId
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        if (!string.IsNullOrWhiteSpace(req.Role))
        {
            if (!await _roleManager.RoleExistsAsync(req.Role))
                return BadRequest(new { message = $"Role '{req.Role}' does not exist." });
            await _userManager.AddToRoleAsync(user, req.Role);
        }

        return Ok(new { message = "User created.", email = user.Email });
    }

    // ── Google OAuth ──────────────────────────────────────────────────────────

    // GET /api/auth/google-login
    [HttpGet("google-login")]
    public IActionResult GoogleLogin([FromQuery] string? returnUrl = "/")
    {
        var redirectUrl = Url.Action(nameof(GoogleCallback), "Auth", new { returnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme, redirectUrl);
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    // GET /api/auth/google-callback
    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string? returnUrl = "/")
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
            return Redirect($"http://localhost:5173/login?error=google_failed");

        var result = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey, isPersistent: false);

        if (result.Succeeded)
            return Redirect($"http://localhost:5173{returnUrl}");

        // Auto-provision account on first Google sign-in
        var email = info.Principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        if (email == null)
            return Redirect($"http://localhost:5173/login?error=no_email");

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser { UserName = email, Email = email };
            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                return Redirect($"http://localhost:5173/login?error=create_failed");
        }

        await _userManager.AddLoginAsync(user, info);
        await _signInManager.SignInAsync(user, isPersistent: false);
        return Redirect($"http://localhost:5173{returnUrl}");
    }

    // ── MFA (TOTP) ────────────────────────────────────────────────────────────

    // POST /api/auth/mfa/enable  — returns TOTP secret + authenticator URI
    [HttpPost("mfa/enable")]
    [Authorize]
    public async Task<IActionResult> MfaEnable()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        await _userManager.ResetAuthenticatorKeyAsync(user);
        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        var email = user.Email ?? user.UserName ?? "user";
        var uri = $"otpauth://totp/NorthStarSanctuary:{Uri.EscapeDataString(email)}?secret={key}&issuer=NorthStarSanctuary";

        return Ok(new { key, uri });
    }

    // POST /api/auth/mfa/verify  — verify code and enable 2FA on account
    [HttpPost("mfa/verify")]
    [Authorize]
    public async Task<IActionResult> MfaVerify([FromBody] MfaVerifyRequest req)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var code = req.Code.Replace(" ", "").Replace("-", "");
        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider, code);

        if (!isValid)
            return BadRequest(new { message = "Invalid verification code." });

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { message = "MFA enabled successfully." });
    }

    // POST /api/auth/mfa/login  — complete login after password step
    [HttpPost("mfa/login")]
    public async Task<IActionResult> MfaLogin([FromBody] MfaLoginRequest req)
    {
        var user = await _signInManager.GetTwoFactorAuthenticationUserAsync();
        if (user == null)
            return Unauthorized(new { message = "MFA session expired. Please log in again." });

        var code = req.Code.Replace(" ", "").Replace("-", "");
        var result = await _signInManager.TwoFactorAuthenticatorSignInAsync(
            code, isPersistent: false, rememberClient: false);

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid MFA code." });

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new { email = user.Email, roles });
    }

    // POST /api/auth/mfa/disable
    [HttpPost("mfa/disable")]
    [Authorize]
    public async Task<IActionResult> MfaDisable()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        return Ok(new { message = "MFA disabled." });
    }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record LoginRequest(
    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.EmailAddress]
    string Email,
    [property: System.ComponentModel.DataAnnotations.Required]
    string Password);

public record RegisterRequest(
    [property: System.ComponentModel.DataAnnotations.Required]
    [property: System.ComponentModel.DataAnnotations.EmailAddress]
    string Email,
    [property: System.ComponentModel.DataAnnotations.Required]
    string Password,
    string? Role,
    int? SupporterId);

public record MfaVerifyRequest(string Code);
public record MfaLoginRequest(string Code);

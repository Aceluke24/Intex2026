using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Intex2026.Data;
using Intex2026.Models;

namespace Intex2026.Controllers;

public record CustomLoginRequest(string Email, string Password, string? MfaCode = null);
public record MfaCodeRequest(string Code);
public record RegisterDonorRequest(string Email, string Password, string ConfirmPassword, string? DisplayName);

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IConfiguration configuration,
    ILogger<AuthController> logger,
    AppDbContext db) : ControllerBase
{
    private const string DefaultFrontendUrl = "http://localhost:3000";
    private const string DefaultExternalReturnPath = "/google-callback";

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentSession()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            logger.LogWarning("Unauthorized /api/auth/me request. Authenticated={IsAuthenticated}", User.Identity?.IsAuthenticated ?? false);
            return Unauthorized();
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            logger.LogWarning("Unauthorized /api/auth/me request. Missing user identifier claim.");
            return Unauthorized();
        }

        var user = await FindUserByIdAsync(userId);
        if (user is null)
        {
            logger.LogWarning("Unauthorized /api/auth/me request. User not found for claim id.");
            return Unauthorized();
        }

        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .Distinct()
            .OrderBy(r => r)
            .ToArray();

        return Ok(new
        {
            email = user.Email,
            userName = user.UserName,
            supporterId = user.SupporterId,
            roles,
            mfaEnabled = user.TwoFactorEnabled
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] CustomLoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var user = await FindUserByEmailAsync(req.Email);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials." });

        var hasher = new PasswordHasher<ApplicationUser>();
        var passwordResult = hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);

        if (passwordResult == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Invalid credentials." });

        // If MFA is enabled, require a TOTP code
        if (user.TwoFactorEnabled)
        {
            if (string.IsNullOrWhiteSpace(req.MfaCode))
                return Ok(new { requiresMfa = true });

            var stripped = req.MfaCode.Replace(" ", "").Replace("-", "");
            var isValidTotp = await userManager.VerifyTwoFactorTokenAsync(
                user,
                userManager.Options.Tokens.AuthenticatorTokenProvider,
                stripped);

            if (!isValidTotp)
                return Unauthorized(new { message = "Invalid verification code." });
        }

        var roles = await GetRolesForUserAsync(user.Id);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? req.Email),
            new(ClaimTypes.Email, user.Email ?? req.Email)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var identity = new ClaimsIdentity(claims, IdentityConstants.ApplicationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            IdentityConstants.ApplicationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                AllowRefresh = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
            });

        return Ok(new { roles });
    }

    [HttpPost("register-donor")]
    public async Task<IActionResult> RegisterDonor([FromBody] RegisterDonorRequest req)
    {
        if (req.Password != req.ConfirmPassword)
            return BadRequest(new { message = "Passwords do not match." });

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            EmailConfirmed = true,
            DisplayName = req.DisplayName
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

        await userManager.AddToRoleAsync(user, AuthRoles.Donor);

        // Find or create a Supporter record and link it to the new user account
        var email = req.Email.Trim().ToLower();
        var supporter = await db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
        if (supporter == null)
        {
            supporter = new Supporter
            {
                SupporterType = "MonetaryDonor",
                DisplayName = req.DisplayName ?? email.Split('@')[0],
                Email = email,
                RelationshipType = "Local",
                Status = "Active",
                AcquisitionChannel = "Website",
                CreatedAt = DateTime.UtcNow,
            };
            db.Supporters.Add(supporter);
            await db.SaveChangesAsync();
        }
        user.SupporterId = supporter.SupporterId;
        await userManager.UpdateAsync(user);

        return Ok(new { message = "Account created successfully." });
    }

    [HttpGet("providers")]
    public IActionResult GetExternalProviders()
    {
        var providers = new List<object>();

        if (IsGoogleConfigured())
        {
            providers.Add(new
            {
                name = GoogleDefaults.AuthenticationScheme,
                displayName = "Google"
            });
        }

        return Ok(providers);
    }

    [HttpGet("external-login")]
    public IActionResult ExternalLogin(
        [FromQuery] string provider,
        [FromQuery] string? returnPath = null)
    {
        if (!string.Equals(provider, GoogleDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase) ||
            !IsGoogleConfigured())
        {
            return BadRequest(new
            {
                message = "The requested external login provider is not available."
            });
        }

        var callbackUrl = Url.Action(nameof(ExternalLoginCallback), new
        {
            returnPath = NormalizeReturnPath(returnPath)
        });

        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            return Problem("Unable to create the external login callback URL.");
        }

        var properties = signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme,
            callbackUrl);

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalLoginCallback([FromQuery] string? returnPath = null, [FromQuery] string? remoteError = null)
    {
        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            return Redirect(BuildFrontendErrorUrl("External login failed."));
        }

        var info = await signInManager.GetExternalLoginInfoAsync();

        if (info is null)
        {
            return Redirect(BuildFrontendErrorUrl("External login information was unavailable."));
        }

        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        if (signInResult.Succeeded)
        {
            return Redirect(BuildFrontendSuccessUrl(returnPath));
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email) ??
            info.Principal.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
        {
            return Redirect(BuildFrontendErrorUrl("The external provider did not return an email address."));
        }

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var createUserResult = await userManager.CreateAsync(user);

            if (!createUserResult.Succeeded)
            {
                return Redirect(BuildFrontendErrorUrl("Unable to create a local account for the external login."));
            }
        }

        var addLoginResult = await userManager.AddLoginAsync(user, info);

        if (!addLoginResult.Succeeded)
        {
            return Redirect(BuildFrontendErrorUrl("Unable to associate the external login with the local account."));
        }

        await signInManager.SignInAsync(user, isPersistent: false, info.LoginProvider);
        return Redirect(BuildFrontendSuccessUrl(returnPath));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        return Ok(new
        {
            message = "Logout successful."
        });
    }

    [HttpGet("mfa/setup")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetMfaSetup()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var key = await userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrWhiteSpace(key))
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            key = await userManager.GetAuthenticatorKeyAsync(user);
        }

        const string issuer = "NorthStarSanctuary";
        var email = user.Email ?? user.UserName ?? "";
        var otpUri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(email)}" +
                     $"?secret={key}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

        return Ok(new { key, otpUri, isEnabled = user.TwoFactorEnabled });
    }

    [HttpPost("mfa/enable")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> EnableMfa([FromBody] MfaCodeRequest req)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var stripped = req.Code.Replace(" ", "").Replace("-", "");
        var isValid = await userManager.VerifyTwoFactorTokenAsync(
            user,
            userManager.Options.Tokens.AuthenticatorTokenProvider,
            stripped);

        if (!isValid)
            return BadRequest(new { message = "Invalid verification code. Try again." });

        await userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { message = "Two-factor authentication enabled." });
    }

    [HttpPost("mfa/disable")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> DisableMfa()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);
        return Ok(new { message = "Two-factor authentication disabled." });
    }

    private bool IsGoogleConfigured()
    {
        var id = configuration["Authentication:Google:ClientId"];
        var secret = configuration["Authentication:Google:ClientSecret"];
        return !string.IsNullOrWhiteSpace(id) &&
               !string.IsNullOrWhiteSpace(secret) &&
               !id.Contains("SET_VIA_ENVIRONMENT_VARIABLE") &&
               !secret.Contains("SET_VIA_ENVIRONMENT_VARIABLE");
    }

    private string NormalizeReturnPath(string? returnPath)
    {
        if (string.IsNullOrWhiteSpace(returnPath) || !returnPath.StartsWith('/'))
        {
            return DefaultExternalReturnPath;
        }

        return returnPath;
    }

    private string BuildFrontendSuccessUrl(string? returnPath)
    {
        var frontendUrl =
            configuration["Frontend:BaseUrl"] ??
            configuration["FrontendUrl"] ??
            DefaultFrontendUrl;
        return $"{frontendUrl.TrimEnd('/')}{NormalizeReturnPath(returnPath)}";
    }

    private string BuildFrontendErrorUrl(string errorMessage)
    {
        var frontendUrl =
            configuration["Frontend:BaseUrl"] ??
            configuration["FrontendUrl"] ??
            DefaultFrontendUrl;
        var loginUrl = $"{frontendUrl.TrimEnd('/')}/login";
        return QueryHelpers.AddQueryString(loginUrl, "externalError", errorMessage);
    }

    private async Task<ApplicationUser?> FindUserByEmailAsync(string email)
    {
        return await userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    private async Task<ApplicationUser?> FindUserByIdAsync(string userId)
    {
        return await userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    private async Task<string[]> GetRolesForUserAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return [];
        }

        var roles = await userManager.GetRolesAsync(user);
        return roles
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}
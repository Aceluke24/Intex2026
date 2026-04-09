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
    private const string DefaultFrontendUrl = "http://localhost:8080";
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

        var ensuredSupporter = await EnsureSupporterLinkedAsync(user);
        if (ensuredSupporter != null && user.SupporterId != ensuredSupporter.SupporterId)
        {
            user.SupporterId = ensuredSupporter.SupporterId;
            await userManager.UpdateAsync(user);
        }

        var supporterId = user.SupporterId ?? ensuredSupporter?.SupporterId;
        Supporter? supporter = null;
        if (supporterId.HasValue)
        {
            supporter = await db.Supporters.AsNoTracking()
                .FirstOrDefaultAsync(s => s.SupporterId == supporterId.Value);
        }

        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .Distinct()
            .OrderBy(r => r)
            .ToArray();

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            userName = user.UserName,
            supporterId,
            firstName = supporter?.FirstName,
            lastName = supporter?.LastName,
            roles,
            mfaEnabled = user.TwoFactorEnabled
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] CustomLoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        var normalizedEmail = NormalizeEmail(req.Email);
        var user = await FindUserByEmailAsync(normalizedEmail);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials." });

        var hasher = new PasswordHasher<ApplicationUser>();
        var passwordResult = hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);

        if (passwordResult == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Invalid credentials." });

        var supporter = await EnsureSupporterLinkedAsync(user);
        if (supporter != null && user.SupporterId != supporter.SupporterId)
        {
            user.SupporterId = supporter.SupporterId;
            await userManager.UpdateAsync(user);
        }

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
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? normalizedEmail),
            new(ClaimTypes.Email, user.Email ?? normalizedEmail)
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

        return Ok(new
        {
            roles,
            supporterId = user.SupporterId ?? supporter?.SupporterId
        });
    }

    [HttpPost("register-donor")]
    public async Task<IActionResult> RegisterDonor([FromBody] RegisterDonorRequest req)
    {
        if (req.Password != req.ConfirmPassword)
            return BadRequest(new { message = "Passwords do not match." });

        var normalizedEmail = NormalizeEmail(req.Email);
        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            EmailConfirmed = true,
            DisplayName = req.DisplayName
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

        await userManager.AddToRoleAsync(user, AuthRoles.Donor);

        var supporter = await EnsureSupporterLinkedAsync(user, req.DisplayName);
        if (supporter != null)
        {
            user.SupporterId = supporter.SupporterId;
        }
        await userManager.UpdateAsync(user);

        await signInManager.SignInAsync(user, isPersistent: true);

        var roles = await GetRolesForUserAsync(user.Id);
        return Ok(new
        {
            message = "Account created successfully.",
            roles,
            supporterId = user.SupporterId
        });
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
        [FromQuery] string? returnPath = null,
        [FromQuery] string? frontendBase = null)
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
            returnPath = NormalizeReturnPath(returnPath),
            frontendBase = NormalizeFrontendBase(frontendBase)
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
    public async Task<IActionResult> ExternalLoginCallback(
        [FromQuery] string? returnPath = null,
        [FromQuery] string? remoteError = null,
        [FromQuery] string? frontendBase = null)
    {
        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            return Redirect(BuildFrontendErrorUrl("External login failed.", frontendBase));
        }

        var info = await signInManager.GetExternalLoginInfoAsync();

        if (info is null)
        {
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            return Redirect(BuildFrontendErrorUrl("External login information was unavailable.", frontendBase));
        }

        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        if (signInResult.Succeeded)
        {
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            return Redirect(BuildFrontendSuccessUrl(returnPath, frontendBase));
        }

        var externalEmail = info.Principal.FindFirstValue(ClaimTypes.Email) ??
            info.Principal.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(externalEmail))
        {
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            return Redirect(BuildFrontendErrorUrl("The external provider did not return an email address.", frontendBase));
        }

        var email = NormalizeEmail(externalEmail);
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
                await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
                return Redirect(BuildFrontendErrorUrl("Unable to create a local account for the external login.", frontendBase));
            }

            // Assign donor role to new users from external login
            await userManager.AddToRoleAsync(user, AuthRoles.Donor);
        }

        var supporter = await EnsureSupporterLinkedAsync(user);
        if (supporter != null && user.SupporterId != supporter.SupporterId)
        {
            user.SupporterId = supporter.SupporterId;
            await userManager.UpdateAsync(user);
        }

        var addLoginResult = await userManager.AddLoginAsync(user, info);

        if (!addLoginResult.Succeeded)
        {
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
            return Redirect(BuildFrontendErrorUrl("Unable to associate the external login with the local account.", frontendBase));
        }

        await signInManager.SignInAsync(user, isPersistent: false);
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        return Redirect(BuildFrontendSuccessUrl(returnPath, frontendBase));
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

    private string BuildFrontendSuccessUrl(string? returnPath, string? frontendBaseOverride)
    {
        var frontendBase = ResolveFrontendBase(frontendBaseOverride);
        return $"{frontendBase}{NormalizeReturnPath(returnPath)}";
    }

    private string BuildFrontendErrorUrl(string errorMessage, string? frontendBaseOverride)
    {
        var loginUrl = $"{ResolveFrontendBase(frontendBaseOverride)}/login";
        return QueryHelpers.AddQueryString(loginUrl, "externalError", errorMessage);
    }

    private string ResolveFrontendBase(string? frontendBaseOverride)
    {
        var candidates = new[]
        {
            NormalizeFrontendBase(frontendBaseOverride),
            NormalizeFrontendBase(configuration["Frontend:BaseUrl"]),
            NormalizeFrontendBase(configuration["FrontendUrl"]),
            NormalizeFrontendBase(DefaultFrontendUrl)
        };

        return candidates.First(candidate => !string.IsNullOrWhiteSpace(candidate))!;
    }

    private static string? NormalizeFrontendBase(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        if (trimmed.Contains("SET_VIA_ENVIRONMENT_VARIABLE", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
        {
            return null;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }

    private async Task<ApplicationUser?> FindUserByEmailAsync(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        return await userManager.FindByEmailAsync(normalizedEmail);
    }

    private async Task<ApplicationUser?> FindUserByIdAsync(string userId)
    {
        return await userManager.FindByIdAsync(userId);
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

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private async Task<Supporter?> EnsureSupporterLinkedAsync(ApplicationUser user, string? displayNameOverride = null)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            return null;
        }

        var email = NormalizeEmail(user.Email);
        var supporter = await db.Supporters
            .OrderBy(s => s.SupporterId)
            .FirstOrDefaultAsync(s => s.Email == email);

        if (supporter != null)
        {
            return supporter;
        }

        var parsedName = ParseDisplayName(displayNameOverride ?? user.DisplayName);
        var displayName = !string.IsNullOrWhiteSpace(displayNameOverride)
            ? displayNameOverride.Trim()
            : !string.IsNullOrWhiteSpace(user.DisplayName)
                ? user.DisplayName.Trim()
                : email;

        supporter = new Supporter
        {
            SupporterType = "MonetaryDonor",
            FirstName = parsedName.firstName,
            LastName = parsedName.lastName,
            DisplayName = displayName,
            Email = email,
            RelationshipType = "Local",
            Status = "Active",
            AcquisitionChannel = "Website",
            CreatedAt = DateTime.UtcNow
        };

        db.Supporters.Add(supporter);
        await db.SaveChangesAsync();
        return supporter;
    }

    private static (string? firstName, string? lastName) ParseDisplayName(string? displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            return (null, null);
        }

        var parts = displayName.Trim()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 0)
        {
            return (null, null);
        }

        if (parts.Length == 1)
        {
            return (parts[0], null);
        }

        return (parts[0], string.Join(' ', parts.Skip(1)));
    }
}
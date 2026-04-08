using Microsoft.EntityFrameworkCore;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Identity;
using Intex2026.Infrastructure;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "FrontendPolicy";
const string DefaultFrontendUrl = "http://localhost:8080";

static string? NormalizeOrigin(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return null;
    }

    var trimmed = value.Trim();

    if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
    {
        return null;
    }

    if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
    {
        return null;
    }

    return uri.GetLeftPart(UriPartial.Authority);
}

var frontendUrl =
    builder.Configuration["Frontend:BaseUrl"] ??
    builder.Configuration["FrontendUrl"] ??
    DefaultFrontendUrl;

var configAllowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

var allowedOrigins = new List<string>();

var normalizedFrontendUrl = NormalizeOrigin(frontendUrl);

if (!string.IsNullOrWhiteSpace(normalizedFrontendUrl))
{
    allowedOrigins.Add(normalizedFrontendUrl);
}

allowedOrigins.AddRange(configAllowedOrigins
    .Select(NormalizeOrigin)
    .Where(origin => !string.IsNullOrWhiteSpace(origin))!
    .Cast<string>());

if (builder.Environment.IsDevelopment())
{
    // Common local dev ports for Vite and alternate frontend hosts.
    allowedOrigins.Add(NormalizeOrigin("http://localhost:5173")!);
    allowedOrigins.Add(NormalizeOrigin("http://localhost:8080")!);
}

var dedupedOrigins = allowedOrigins
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

// ── Controllers & OpenAPI ─────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── Database ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

if (connectionString.Contains("SET_VIA_ENVIRONMENT_VARIABLE", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is still set to the placeholder value. " +
        "Configure a real connection string in Azure App Service.");
}

var authIdentityConnectionString =
    builder.Configuration.GetConnectionString("AuthIdentityConnection") ?? connectionString;

if (authIdentityConnectionString.Contains("SET_VIA_ENVIRONMENT_VARIABLE", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Connection string 'AuthIdentityConnection' is still set to the placeholder value. " +
        "Configure a real connection string in Azure App Service or omit it to fallback to DefaultConnection.");
}

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options
            .UseSqlite(connectionString)
            .ConfigureWarnings(w => w.Log(RelationalEventId.PendingModelChangesWarning)));
    builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
        options
            .UseSqlite(authIdentityConnectionString)
            .ConfigureWarnings(w => w.Log(RelationalEventId.PendingModelChangesWarning)));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options
            .UseSqlServer(connectionString)
            .ConfigureWarnings(w => w.Log(RelationalEventId.PendingModelChangesWarning)));
    builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
        options
            .UseSqlServer(authIdentityConnectionString)
            .ConfigureWarnings(w => w.Log(RelationalEventId.PendingModelChangesWarning)));
}

builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AuthIdentityDbContext>();

// ── Authentication & Authorization ───────────────────────────────────────────
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.ManageCatalog, policy => policy.RequireRole(AuthRoles.Admin));
});

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 14;
    options.Password.RequiredUniqueChars = 1;
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.None;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.WithOrigins(dedupedOrigins)
            .AllowCredentials()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await appDb.Database.MigrateAsync();
        await CsvDataSeeder.SeedAsync(appDb, app.Environment);

        var authDb = scope.ServiceProvider.GetRequiredService<AuthIdentityDbContext>();
        await authDb.Database.MigrateAsync();
        await AuthIdentityGenerator.GenerateDefaultIdentityAsync(scope.ServiceProvider, app.Configuration);
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "Startup migration/seeding failed");

        // In production, fail fast so deployment health checks surface the root cause immediately
        // instead of returning opaque runtime 500s from auth/data endpoints.
        if (!app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseSecurityHeaders();

app.UseCors(FrontendCorsPolicy);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGroup("/api/identity").MapIdentityApi<ApplicationUser>().RequireCors(FrontendCorsPolicy);
app.Run();

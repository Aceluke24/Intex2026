using Microsoft.EntityFrameworkCore;
using Intex2026.Data;
using Intex2026.Models;
using Microsoft.AspNetCore.Identity;
using Intex2026.Infrastructure;
using Intex2026.Services.Analytics;
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

static bool IsAllowedCorsOrigin(string? origin, IReadOnlyCollection<string> explicitOrigins)
{
    var normalized = NormalizeOrigin(origin);
    if (string.IsNullOrWhiteSpace(normalized))
    {
        return false;
    }

    if (explicitOrigins.Contains(normalized, StringComparer.OrdinalIgnoreCase))
    {
        return true;
    }

    if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri))
    {
        return false;
    }

    // Allow Azure Static Web Apps frontends even when exact host is not pre-configured.
    return uri.Host.EndsWith(".azurestaticapps.net", StringComparison.OrdinalIgnoreCase);
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
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IDonorAnalyticsService, DonorAnalyticsService>();
builder.Services.AddScoped<IResidentAnalyticsService, ResidentAnalyticsService>();
builder.Services.AddScoped<ISocialAnalyticsService, SocialAnalyticsService>();

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

static bool IsSqliteConnectionString(string value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return false;
    }

    return value.Contains("Data Source=", StringComparison.OrdinalIgnoreCase)
        && value.Contains(".db", StringComparison.OrdinalIgnoreCase);
}

if (authIdentityConnectionString.Contains("SET_VIA_ENVIRONMENT_VARIABLE", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Connection string 'AuthIdentityConnection' is still set to the placeholder value. " +
        "Configure a real connection string in Azure App Service or omit it to fallback to DefaultConnection.");
}

if (builder.Environment.IsDevelopment())
{
    if (IsSqliteConnectionString(connectionString) && IsSqliteConnectionString(authIdentityConnectionString))
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

// Register Google OAuth only when real credentials are provided
if (!string.IsNullOrWhiteSpace(googleClientId) &&
    !string.IsNullOrWhiteSpace(googleClientSecret) &&
    !googleClientId.Contains("SET_VIA_ENVIRONMENT_VARIABLE") &&
    !googleClientSecret.Contains("SET_VIA_ENVIRONMENT_VARIABLE"))
{
    builder.Services.AddAuthentication()
        .AddGoogle(options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.Events.OnTicketReceived = context =>
            {
                var redirectUri = context.Properties?.RedirectUri;
                if (string.IsNullOrWhiteSpace(redirectUri))
                {
                    redirectUri = "/api/auth/external-callback";
                }

                context.Response.Redirect(redirectUri);
                context.HandleResponse();
                return Task.CompletedTask;
            };
            options.Events.OnRemoteFailure = context =>
            {
                var loggerFactory = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("GoogleOAuth");
                logger.LogWarning(context.Failure, "Google OAuth remote failure at callback path {Path}", context.Request.Path);

                // Route failures through our existing external callback error handler.
                context.Response.Redirect("/api/auth/external-callback?remoteError=External%20login%20failed");
                context.HandleResponse();
                return Task.CompletedTask;
            };
        });
}

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
        policy.SetIsOriginAllowed(origin => IsAllowedCorsOrigin(origin, dedupedOrigins))
            .AllowCredentials()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Default: run CSV seed in all environments (idempotent per-table checks prevent duplicates).
// Set Seed:RunCsvOnStartup=false in App Settings to disable.
var runCsvSeedOnStartup =
    builder.Configuration.GetValue<bool?>("Seed:RunCsvOnStartup") ?? true;

var runIdentitySeedOnStartup =
    builder.Configuration.GetValue<bool?>("GenerateDefaultIdentityAdmin:RunOnStartup") ??
    app.Environment.IsDevelopment();

var applyMigrationsOnStartup =
    builder.Configuration.GetValue<bool?>("Database:ApplyMigrationsOnStartup") ??
    true;

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (applyMigrationsOnStartup)
        {
            await appDb.Database.MigrateAsync();
        }

        if (runCsvSeedOnStartup)
        {
            await CsvDataSeeder.SeedAsync(appDb, app.Environment);
        }

        var authDb = scope.ServiceProvider.GetRequiredService<AuthIdentityDbContext>();
        if (applyMigrationsOnStartup)
        {
            await authDb.Database.MigrateAsync();
        }

        if (runIdentitySeedOnStartup)
        {
            await AuthIdentityGenerator.GenerateDefaultIdentityAsync(scope.ServiceProvider, app.Configuration);
        }

        // Idempotent table creation for Expenses and OrganizationalGoals.
        // Use provider-specific SQL so both SQL Server and SQLite dev setups can boot.
        if (appDb.Database.IsSqlite())
        {
            await appDb.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS "Expenses" (
                    "ExpenseId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "SafehouseId" INTEGER NULL,
                    "ProgramArea" TEXT NOT NULL DEFAULT '',
                    "Category" TEXT NOT NULL DEFAULT '',
                    "Amount" NUMERIC NOT NULL DEFAULT 0,
                    "ExpenseDate" TEXT NOT NULL,
                    "Description" TEXT NULL,
                    "RecordedBy" TEXT NULL,
                    "CreatedAt" TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                    CONSTRAINT "FK_Expenses_Safehouses_SafehouseId" FOREIGN KEY ("SafehouseId")
                        REFERENCES "Safehouses" ("SafehouseId") ON DELETE SET NULL
                );
                CREATE INDEX IF NOT EXISTS "IX_Expenses_SafehouseId" ON "Expenses" ("SafehouseId");
                """);

            await appDb.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS "OrganizationalGoals" (
                    "GoalId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "GoalCategory" TEXT NOT NULL DEFAULT '',
                    "SafehouseId" INTEGER NULL,
                    "TargetValue" NUMERIC NOT NULL DEFAULT 0,
                    "PeriodStart" TEXT NOT NULL,
                    "PeriodEnd" TEXT NOT NULL,
                    "Description" TEXT NULL,
                    "CreatedBy" TEXT NULL,
                    "CreatedAt" TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                    CONSTRAINT "FK_OrganizationalGoals_Safehouses_SafehouseId" FOREIGN KEY ("SafehouseId")
                        REFERENCES "Safehouses" ("SafehouseId") ON DELETE SET NULL
                );
                CREATE INDEX IF NOT EXISTS "IX_OrganizationalGoals_SafehouseId" ON "OrganizationalGoals" ("SafehouseId");
                """);

            await appDb.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS "DonationTypes" (
                    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "Name" TEXT NOT NULL,
                    "IsActive" INTEGER NOT NULL DEFAULT 1
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_DonationTypes_Name" ON "DonationTypes" ("Name");
                """);

            try
            {
                await appDb.Database.ExecuteSqlRawAsync("""
                    ALTER TABLE "Donations" ADD COLUMN "DonationTypeId" INTEGER NULL;
                    """);
            }
            catch (Exception ex)
            {
                if (!ex.Message.Contains("duplicate column name", StringComparison.OrdinalIgnoreCase))
                {
                    throw;
                }
            }

            await appDb.Database.ExecuteSqlRawAsync("""
                CREATE INDEX IF NOT EXISTS "IX_Donations_DonationTypeId" ON "Donations" ("DonationTypeId");
                """);

            await appDb.Database.ExecuteSqlRawAsync("""
                INSERT OR IGNORE INTO "DonationTypes" ("Name", "IsActive") VALUES
                    ('Event donation', 1),
                    ('Community outreach support', 1),
                    ('In support of safehouse operations', 1),
                    ('Campaign support', 1),
                    ('Recurring gift', 1),
                    ('Monthly contribution', 1);
                """);
        }
        else
        {
            await appDb.Database.ExecuteSqlRawAsync("""
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Expenses')
                BEGIN
                    CREATE TABLE [Expenses] (
                        [ExpenseId] int NOT NULL IDENTITY(1,1),
                        [SafehouseId] int NULL,
                        [ProgramArea] nvarchar(max) NOT NULL DEFAULT '',
                        [Category] nvarchar(max) NOT NULL DEFAULT '',
                        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
                        [ExpenseDate] date NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [RecordedBy] nvarchar(max) NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_Expenses] PRIMARY KEY ([ExpenseId]),
                        CONSTRAINT [FK_Expenses_Safehouses_SafehouseId] FOREIGN KEY ([SafehouseId])
                            REFERENCES [Safehouses] ([SafehouseId]) ON DELETE SET NULL
                    );
                    CREATE INDEX [IX_Expenses_SafehouseId] ON [Expenses] ([SafehouseId]);
                END
                """);

            await appDb.Database.ExecuteSqlRawAsync("""
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrganizationalGoals')
                BEGIN
                    CREATE TABLE [OrganizationalGoals] (
                        [GoalId] int NOT NULL IDENTITY(1,1),
                        [GoalCategory] nvarchar(max) NOT NULL DEFAULT '',
                        [SafehouseId] int NULL,
                        [TargetValue] decimal(18,2) NOT NULL DEFAULT 0,
                        [PeriodStart] date NOT NULL,
                        [PeriodEnd] date NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [CreatedBy] nvarchar(max) NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
                        CONSTRAINT [PK_OrganizationalGoals] PRIMARY KEY ([GoalId]),
                        CONSTRAINT [FK_OrganizationalGoals_Safehouses_SafehouseId] FOREIGN KEY ([SafehouseId])
                            REFERENCES [Safehouses] ([SafehouseId]) ON DELETE SET NULL
                    );
                    CREATE INDEX [IX_OrganizationalGoals_SafehouseId] ON [OrganizationalGoals] ([SafehouseId]);
                END
                """);

            await appDb.Database.ExecuteSqlRawAsync("""
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DonationTypes')
                BEGIN
                    CREATE TABLE [DonationTypes] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [Name] nvarchar(200) NOT NULL,
                        [IsActive] bit NOT NULL DEFAULT 1,
                        CONSTRAINT [PK_DonationTypes] PRIMARY KEY ([Id])
                    );
                    CREATE UNIQUE INDEX [IX_DonationTypes_Name] ON [DonationTypes] ([Name]);
                END
                """);

            await appDb.Database.ExecuteSqlRawAsync("""
                IF COL_LENGTH('Donations', 'DonationTypeId') IS NULL
                BEGIN
                    ALTER TABLE [Donations] ADD [DonationTypeId] int NULL;
                END
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Donations_DonationTypeId' AND object_id = OBJECT_ID('Donations'))
                BEGIN
                    CREATE INDEX [IX_Donations_DonationTypeId] ON [Donations] ([DonationTypeId]);
                END
                IF NOT EXISTS (
                    SELECT 1 FROM sys.foreign_keys
                    WHERE name = 'FK_Donations_DonationTypes_DonationTypeId'
                )
                BEGIN
                    ALTER TABLE [Donations]
                    ADD CONSTRAINT [FK_Donations_DonationTypes_DonationTypeId]
                    FOREIGN KEY ([DonationTypeId]) REFERENCES [DonationTypes]([Id]) ON DELETE SET NULL;
                END
                """);

            await appDb.Database.ExecuteSqlRawAsync("""
                MERGE [DonationTypes] AS target
                USING (VALUES
                    ('Event donation', CAST(1 AS bit)),
                    ('Community outreach support', CAST(1 AS bit)),
                    ('In support of safehouse operations', CAST(1 AS bit)),
                    ('Campaign support', CAST(1 AS bit)),
                    ('Recurring gift', CAST(1 AS bit)),
                    ('Monthly contribution', CAST(1 AS bit))
                ) AS source ([Name], [IsActive])
                ON target.[Name] = source.[Name]
                WHEN NOT MATCHED BY TARGET THEN
                    INSERT ([Name], [IsActive]) VALUES (source.[Name], source.[IsActive]);
                """);
        }

    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "Startup migration/seeding failed");
        throw;
    }

    try
    {
        // Keep analytics warm-up non-fatal so route registration and API availability are not blocked.
        var donorAnalytics = scope.ServiceProvider.GetRequiredService<IDonorAnalyticsService>();
        var residentAnalytics = scope.ServiceProvider.GetRequiredService<IResidentAnalyticsService>();
        var socialAnalytics = scope.ServiceProvider.GetRequiredService<ISocialAnalyticsService>();
        await donorAnalytics.RecalculateAsync(CancellationToken.None);
        await residentAnalytics.RecalculateAsync(CancellationToken.None);
        await socialAnalytics.RecalculateAsync(CancellationToken.None);
    }
    catch (Exception ex)
    {
        logger.LogError(ex,
            "Startup analytics recalculation failed — analytics data may be stale until next recalculation. Error: {Message}",
            ex.Message);
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
app.UseHttpsRedirection();
app.UseCors(FrontendCorsPolicy);

app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    var path = context.Request.Path.ToString();
    var method = context.Request.Method;
    var started = DateTime.UtcNow;
    try
    {
        await next();
    }
    finally
    {
        var elapsedMs = (DateTime.UtcNow - started).TotalMilliseconds;
        var user = context.User?.Identity?.IsAuthenticated == true
            ? context.User.Identity?.Name ?? "authenticated"
            : "anonymous";
        logger.LogInformation(
            "HTTP {Method} {Path} -> {StatusCode} in {ElapsedMs}ms user={User}",
            method,
            path,
            context.Response.StatusCode,
            Math.Round(elapsedMs, 1),
            user);
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    await next();
    if (context.Response.StatusCode == StatusCodes.Status401Unauthorized)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(
            "401 Unauthorized for {Method} {Path}. Origin={Origin}",
            context.Request.Method,
            context.Request.Path.ToString(),
            context.Request.Headers.Origin.ToString());
    }
});

app.MapControllers();
if (app.Environment.IsDevelopment())
{
    // Keep scaffolded Identity API endpoints for local debugging only.
    // Production auth flows use AuthController endpoints under /api/auth.
    app.MapGroup("/api/identity").MapIdentityApi<ApplicationUser>().RequireCors(FrontendCorsPolicy);
}
app.Run();

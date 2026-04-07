using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.TypeConversion;
using Intex2026.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Data;

public static class CsvDataSeeder
{
    public static async Task SeedAsync(AppDbContext db, IWebHostEnvironment env)
    {
        // Skip if already seeded
        if (await db.Safehouses.AnyAsync()) return;

        var seedDir = Path.Combine(env.ContentRootPath, "Data", "seed");

        // Insert in FK-safe order, clearing the change tracker between batches
        // to prevent EF tracking conflicts when child entities reference parents.
        db.Safehouses.AddRange(Read<Safehouse>(seedDir, "safehouses.csv"));
        db.Partners.AddRange(Read<Partner>(seedDir, "partners.csv"));
        db.Supporters.AddRange(Read<Supporter>(seedDir, "supporters.csv"));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        db.Residents.AddRange(Read<Resident>(seedDir, "residents.csv"));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        db.PartnerAssignments.AddRange(Read<PartnerAssignment>(seedDir, "partner_assignments.csv"));
        db.Donations.AddRange(Read<Donation>(seedDir, "donations.csv"));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        db.InKindDonationItems.AddRange(Read<InKindDonationItem>(seedDir, "in_kind_donation_items.csv"));
        db.DonationAllocations.AddRange(Read<DonationAllocation>(seedDir, "donation_allocations.csv"));
        db.EducationRecords.AddRange(Read<EducationRecord>(seedDir, "education_records.csv"));
        db.HealthWellbeingRecords.AddRange(Read<HealthWellbeingRecord>(seedDir, "health_wellbeing_records.csv"));
        db.InterventionPlans.AddRange(Read<InterventionPlan>(seedDir, "intervention_plans.csv"));
        db.IncidentReports.AddRange(Read<IncidentReport>(seedDir, "incident_reports.csv"));
        db.ProcessRecordings.AddRange(Read<ProcessRecording>(seedDir, "process_recordings.csv"));
        db.HomeVisitations.AddRange(Read<HomeVisitation>(seedDir, "home_visitations.csv"));
        db.SafehouseMonthlyMetrics.AddRange(Read<SafehouseMonthlyMetric>(seedDir, "safehouse_monthly_metrics.csv"));
        db.SocialMediaPosts.AddRange(Read<SocialMediaPost>(seedDir, "social_media_posts.csv"));
        db.PublicImpactSnapshots.AddRange(Read<PublicImpactSnapshot>(seedDir, "public_impact_snapshots.csv"));
        await db.SaveChangesAsync();
    }

    private static List<T> Read<T>(string seedDir, string filename) where T : class
    {
        var path = Path.Combine(seedDir, filename);
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            // Map snake_case CSV headers to PascalCase C# properties
            PrepareHeaderForMatch = args => args.Header.Replace("_", "").ToLowerInvariant(),
            // Ignore CSV columns that have no matching property
            HeaderValidated = null,
            // Ignore missing fields (model properties not in CSV)
            MissingFieldFound = null,
        };

        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, config);

        // Some CSVs have float-formatted integer IDs (e.g. "8.0"). Register
        // converters that parse via decimal then truncate to int.
        csv.Context.TypeConverterCache.AddConverter<int>(new FloatToIntConverter());
        csv.Context.TypeConverterCache.AddConverter<int?>(new NullableFloatToIntConverter());
        csv.Context.TypeConverterCache.AddConverter<decimal>(new EmptyDecimalConverter());
        var records = csv.GetRecords<T>().ToList();

        // CsvHelper auto-maps columns to nested navigation properties, creating
        // stub objects that conflict with EF Core's change tracker. Null them out.
        var navProps = typeof(T).GetProperties()
            .Where(p => !p.PropertyType.IsValueType
                        && p.PropertyType != typeof(string)
                        && p.CanWrite)
            .ToArray();

        if (navProps.Length > 0)
            foreach (var record in records)
                foreach (var prop in navProps)
                    prop.SetValue(record, null);

        return records;
    }
}

// Handles CSV integer fields stored as floats (e.g. "8.0" → 8)
file sealed class FloatToIntConverter : ITypeConverter
{
    public object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return (int)decimal.Parse(text, CultureInfo.InvariantCulture);
    }

    public string? ConvertToString(object? value, IWriterRow row, MemberMapData memberMapData)
        => value?.ToString();
}

file sealed class NullableFloatToIntConverter : ITypeConverter
{
    public object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        return (int)decimal.Parse(text, CultureInfo.InvariantCulture);
    }

    public string? ConvertToString(object? value, IWriterRow row, MemberMapData memberMapData)
        => value?.ToString();
}

// Handles empty CSV cells for non-nullable decimal fields — returns 0
file sealed class EmptyDecimalConverter : ITypeConverter
{
    public object? ConvertFromString(string? text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0m;
        return decimal.Parse(text, CultureInfo.InvariantCulture);
    }

    public string? ConvertToString(object? value, IWriterRow row, MemberMapData memberMapData)
        => value?.ToString();
}

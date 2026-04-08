using Intex2026.Models;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Donor & Support Domain
    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<DonorAnalytics> DonorAnalytics => Set<DonorAnalytics>();

    // Case Management Domain
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<ResidentAnalytics> ResidentAnalytics => Set<ResidentAnalytics>();

    // Finance & Operations
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<OrganizationalGoal> OrganizationalGoals => Set<OrganizationalGoal>();

    // Outreach & Communication Domain
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();
    public DbSet<SocialAnalytics> SocialAnalytics => Set<SocialAnalytics>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // PartnerAssignment: optional FK to Safehouse
        builder.Entity<PartnerAssignment>()
            .HasOne(pa => pa.Safehouse)
            .WithMany()
            .HasForeignKey(pa => pa.SafehouseId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Donation: no cascade delete from Supporter (avoid cycles)
        builder.Entity<Donation>()
            .HasOne(d => d.Supporter)
            .WithMany()
            .HasForeignKey(d => d.SupporterId)
            .OnDelete(DeleteBehavior.Restrict);

        // IncidentReport: Resident and Safehouse — restrict to avoid cycles
        builder.Entity<IncidentReport>()
            .HasOne(ir => ir.Resident)
            .WithMany()
            .HasForeignKey(ir => ir.ResidentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<IncidentReport>()
            .HasOne(ir => ir.Safehouse)
            .WithMany()
            .HasForeignKey(ir => ir.SafehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        // DonationAllocation: restrict cascades
        builder.Entity<DonationAllocation>()
            .HasOne(da => da.Donation)
            .WithMany()
            .HasForeignKey(da => da.DonationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<DonationAllocation>()
            .HasOne(da => da.Safehouse)
            .WithMany()
            .HasForeignKey(da => da.SafehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<DonorAnalytics>()
            .HasIndex(x => x.DonorId)
            .IsUnique();

        builder.Entity<ResidentAnalytics>()
            .HasIndex(x => x.ResidentId)
            .IsUnique();

        builder.Entity<SocialAnalytics>()
            .HasIndex(x => x.Platform)
            .IsUnique();

        builder.Entity<HomeVisitation>()
            .HasIndex(h => h.VisitDate);

        // Expense: optional FK to Safehouse
        builder.Entity<Expense>()
            .HasOne(e => e.Safehouse)
            .WithMany()
            .HasForeignKey(e => e.SafehouseId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // OrganizationalGoal: optional FK to Safehouse
        builder.Entity<OrganizationalGoal>()
            .HasOne(g => g.Safehouse)
            .WithMany()
            .HasForeignKey(g => g.SafehouseId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

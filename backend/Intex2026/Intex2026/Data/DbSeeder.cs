using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Intex2026.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Intex2026.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IWebHostEnvironment env,
        IConfiguration config)
    {
        // Seed roles
        foreach (var role in new[] { "Admin", "Donor" })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Seed admin user
        var adminEmail = config["Seed:AdminEmail"] ?? "admin@northstarsanctuary.org";
        var adminPassword = config["Seed:AdminPassword"] ?? "AdminPassword123!@#";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail };
            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "Admin");
        }

        // Only seed operational data once
        if (await context.Safehouses.AnyAsync()) return;

        var csvBase = FindCsvDirectory(env);
        if (csvBase == null)
        {
            Console.WriteLine("CSV directory not found — skipping data seed.");
            return;
        }

        var cfg = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
            BadDataFound = null,
            MemberTypes = CsvHelper.Configuration.MemberTypes.Fields,
        };

        // ── 1. Safehouses ─────────────────────────────────────────────────────
        if (!await context.Safehouses.AnyAsync())
        {
            var records = ReadCsv<SafehouseCsv>(csvBase, "safehouses.csv", cfg);
            context.Safehouses.AddRange(records.Select(r => new Safehouse
            {
                SafehouseId = r.safehouse_id,
                SafehouseCode = r.safehouse_code ?? "",
                Name = r.name ?? "",
                Region = r.region ?? "",
                City = r.city ?? "",
                Province = r.province ?? "",
                Country = r.country ?? "",
                OpenDate = ParseDate(r.open_date),
                Status = r.status ?? "",
                CapacityGirls = r.capacity_girls,
                CapacityStaff = r.capacity_staff,
                CurrentOccupancy = r.current_occupancy,
                Notes = r.notes
            }));
            await context.SaveChangesAsync();
        }

        // ── 2. Partners ───────────────────────────────────────────────────────
        if (!await context.Partners.AnyAsync())
        {
            var records = ReadCsv<PartnerCsv>(csvBase, "partners.csv", cfg);
            context.Partners.AddRange(records.Select(r => new Partner
            {
                PartnerId = r.partner_id,
                PartnerName = r.partner_name ?? "",
                PartnerType = r.partner_type ?? "",
                RoleType = r.role_type ?? "",
                ContactName = r.contact_name,
                Email = r.email,
                Phone = r.phone,
                Region = r.region,
                Status = r.status ?? "",
                StartDate = ParseDate(r.start_date),
                EndDate = string.IsNullOrWhiteSpace(r.end_date) ? null : ParseDate(r.end_date),
                Notes = r.notes
            }));
            await context.SaveChangesAsync();
        }

        // ── 3. Partner Assignments ────────────────────────────────────────────
        if (!await context.PartnerAssignments.AnyAsync())
        {
            var records = ReadCsv<PartnerAssignmentCsv>(csvBase, "partner_assignments.csv", cfg);
            context.PartnerAssignments.AddRange(records.Select(r => new PartnerAssignment
            {
                AssignmentId = r.assignment_id,
                PartnerId = r.partner_id,
                SafehouseId = r.safehouse_id == 0 ? null : r.safehouse_id,
                ProgramArea = r.program_area ?? "",
                AssignmentStart = ParseDate(r.assignment_start),
                AssignmentEnd = string.IsNullOrWhiteSpace(r.assignment_end) ? null : ParseDate(r.assignment_end),
                ResponsibilityNotes = r.responsibility_notes,
                IsPrimary = ParseBool(r.is_primary),
                Status = r.status ?? ""
            }));
            await context.SaveChangesAsync();
        }

        // ── 4. Supporters ─────────────────────────────────────────────────────
        if (!await context.Supporters.AnyAsync())
        {
            var records = ReadCsv<SupporterCsv>(csvBase, "supporters.csv", cfg);
            context.Supporters.AddRange(records.Select(r => new Supporter
            {
                SupporterId = r.supporter_id,
                SupporterType = r.supporter_type ?? "",
                DisplayName = r.display_name ?? "",
                OrganizationName = r.organization_name,
                FirstName = r.first_name,
                LastName = r.last_name,
                RelationshipType = r.relationship_type ?? "",
                Region = r.region,
                Country = r.country,
                Email = r.email,
                Phone = r.phone,
                Status = r.status ?? "",
                FirstDonationDate = string.IsNullOrWhiteSpace(r.first_donation_date) ? null : ParseDate(r.first_donation_date),
                AcquisitionChannel = r.acquisition_channel,
                CreatedAt = string.IsNullOrWhiteSpace(r.created_at) ? DateTime.UtcNow : DateTime.Parse(r.created_at)
            }));
            await context.SaveChangesAsync();
        }

        // ── 5. Donation Types ─────────────────────────────────────────────────
        if (!await context.DonationTypes.AnyAsync())
        {
            context.DonationTypes.AddRange(new[]
            {
                new DonationType { Name = "Event donation", IsActive = true },
                new DonationType { Name = "Community outreach support", IsActive = true },
                new DonationType { Name = "In support of safehouse operations", IsActive = true },
                new DonationType { Name = "Campaign support", IsActive = true },
                new DonationType { Name = "Recurring gift", IsActive = true },
                new DonationType { Name = "Monthly contribution", IsActive = true },
            });
            await context.SaveChangesAsync();
        }

        // ── 6. Donations ──────────────────────────────────────────────────────
        if (!await context.Donations.AnyAsync())
        {
            var records = ReadCsv<DonationCsv>(csvBase, "donations.csv", cfg);
            context.Donations.AddRange(records.Select(r => new Donation
            {
                DonationId = r.donation_id,
                SupporterId = r.supporter_id,
                DonationType = r.donation_type ?? "",
                DonationDate = ParseDate(r.donation_date),
                ChannelSource = r.channel_source ?? "",
                CurrencyCode = r.currency_code,
                Amount = string.IsNullOrWhiteSpace(r.amount) ? null : decimal.Parse(r.amount, CultureInfo.InvariantCulture),
                EstimatedValue = string.IsNullOrWhiteSpace(r.estimated_value) ? null : decimal.Parse(r.estimated_value, CultureInfo.InvariantCulture),
                ImpactUnit = r.impact_unit,
                IsRecurring = ParseBool(r.is_recurring),
                CampaignName = r.campaign_name,
                Notes = r.notes,
                ReferralPostId = string.IsNullOrWhiteSpace(r.referral_post_id) ? null : int.Parse(r.referral_post_id)
            }));
            await context.SaveChangesAsync();
        }

        // ── 7. In-Kind Donation Items ─────────────────────────────────────────
        if (!await context.InKindDonationItems.AnyAsync())
        {
            var records = ReadCsv<InKindItemCsv>(csvBase, "in_kind_donation_items.csv", cfg);
            context.InKindDonationItems.AddRange(records.Select(r => new InKindDonationItem
            {
                ItemId = r.item_id,
                DonationId = r.donation_id,
                ItemName = r.item_name ?? "",
                ItemCategory = r.item_category ?? "",
                Quantity = r.quantity,
                UnitOfMeasure = r.unit_of_measure ?? "",
                EstimatedUnitValue = string.IsNullOrWhiteSpace(r.estimated_unit_value) ? 0 : decimal.Parse(r.estimated_unit_value, CultureInfo.InvariantCulture),
                IntendedUse = r.intended_use,
                ReceivedCondition = r.received_condition
            }));
            await context.SaveChangesAsync();
        }

        // ── 8. Donation Allocations ───────────────────────────────────────────
        if (!await context.DonationAllocations.AnyAsync())
        {
            var records = ReadCsv<DonationAllocationCsv>(csvBase, "donation_allocations.csv", cfg);
            context.DonationAllocations.AddRange(records.Select(r => new DonationAllocation
            {
                AllocationId = r.allocation_id,
                DonationId = r.donation_id,
                SafehouseId = r.safehouse_id,
                ProgramArea = r.program_area ?? "",
                AmountAllocated = string.IsNullOrWhiteSpace(r.amount_allocated) ? 0 : decimal.Parse(r.amount_allocated, CultureInfo.InvariantCulture),
                AllocationDate = ParseDate(r.allocation_date),
                AllocationNotes = r.allocation_notes
            }));
            await context.SaveChangesAsync();
        }

        // ── 9. Residents ──────────────────────────────────────────────────────
        if (!await context.Residents.AnyAsync())
        {
            var records = ReadCsv<ResidentCsv>(csvBase, "residents.csv", cfg);
            context.Residents.AddRange(records.Select(r => new Resident
            {
                ResidentId = r.resident_id,
                CaseControlNo = r.case_control_no ?? "",
                InternalCode = r.internal_code ?? "",
                SafehouseId = r.safehouse_id,
                CaseStatus = r.case_status ?? "",
                Sex = r.sex ?? "F",
                DateOfBirth = ParseDate(r.date_of_birth),
                BirthStatus = r.birth_status,
                PlaceOfBirth = r.place_of_birth,
                Religion = r.religion,
                CaseCategory = r.case_category ?? "",
                SubCatOrphaned = ParseBool(r.sub_cat_orphaned),
                SubCatTrafficked = ParseBool(r.sub_cat_trafficked),
                SubCatChildLabor = ParseBool(r.sub_cat_child_labor),
                SubCatPhysicalAbuse = ParseBool(r.sub_cat_physical_abuse),
                SubCatSexualAbuse = ParseBool(r.sub_cat_sexual_abuse),
                SubCatOsaec = ParseBool(r.sub_cat_osaec),
                SubCatCicl = ParseBool(r.sub_cat_cicl),
                SubCatAtRisk = ParseBool(r.sub_cat_at_risk),
                SubCatStreetChild = ParseBool(r.sub_cat_street_child),
                SubCatChildWithHiv = ParseBool(r.sub_cat_child_with_hiv),
                IsPwd = ParseBool(r.is_pwd),
                PwdType = r.pwd_type,
                HasSpecialNeeds = ParseBool(r.has_special_needs),
                SpecialNeedsDiagnosis = r.special_needs_diagnosis,
                FamilyIs4ps = ParseBool(r.family_is_4ps),
                FamilySoloParent = ParseBool(r.family_solo_parent),
                FamilyIndigenous = ParseBool(r.family_indigenous),
                FamilyParentPwd = ParseBool(r.family_parent_pwd),
                FamilyInformalSettler = ParseBool(r.family_informal_settler),
                DateOfAdmission = ParseDate(r.date_of_admission),
                AgeUponAdmission = r.age_upon_admission,
                PresentAge = r.present_age,
                LengthOfStay = r.length_of_stay,
                ReferralSource = r.referral_source,
                ReferringAgencyPerson = r.referring_agency_person,
                DateColbRegistered = string.IsNullOrWhiteSpace(r.date_colb_registered) ? null : ParseDate(r.date_colb_registered),
                DateColbObtained = string.IsNullOrWhiteSpace(r.date_colb_obtained) ? null : ParseDate(r.date_colb_obtained),
                AssignedSocialWorker = r.assigned_social_worker,
                InitialCaseAssessment = r.initial_case_assessment,
                DateCaseStudyPrepared = string.IsNullOrWhiteSpace(r.date_case_study_prepared) ? null : ParseDate(r.date_case_study_prepared),
                ReintegrationType = r.reintegration_type,
                ReintegrationStatus = r.reintegration_status,
                InitialRiskLevel = r.initial_risk_level ?? "",
                CurrentRiskLevel = r.current_risk_level ?? "",
                DateEnrolled = ParseDate(r.date_enrolled),
                DateClosed = string.IsNullOrWhiteSpace(r.date_closed) ? null : ParseDate(r.date_closed),
                CreatedAt = string.IsNullOrWhiteSpace(r.created_at) ? DateTime.UtcNow : DateTime.Parse(r.created_at),
                NotesRestricted = r.notes_restricted
            }));
            await context.SaveChangesAsync();
        }

        // ── 10. Process Recordings ────────────────────────────────────────────
        if (!await context.ProcessRecordings.AnyAsync())
        {
            var records = ReadCsv<ProcessRecordingCsv>(csvBase, "process_recordings.csv", cfg);
            context.ProcessRecordings.AddRange(records.Select(r => new ProcessRecording
            {
                RecordingId = r.recording_id,
                ResidentId = r.resident_id,
                SessionDate = ParseDate(r.session_date),
                SocialWorker = r.social_worker ?? "",
                SessionType = r.session_type ?? "",
                SessionDurationMinutes = string.IsNullOrWhiteSpace(r.session_duration_minutes) ? null : int.Parse(r.session_duration_minutes),
                EmotionalStateObserved = r.emotional_state_observed ?? "",
                EmotionalStateEnd = r.emotional_state_end,
                SessionNarrative = r.session_narrative,
                InterventionsApplied = r.interventions_applied,
                FollowUpActions = r.follow_up_actions,
                ProgressNoted = ParseBool(r.progress_noted),
                ConcernsFlagged = ParseBool(r.concerns_flagged),
                ReferralMade = ParseBool(r.referral_made),
                NotesRestricted = r.notes_restricted
            }));
            await context.SaveChangesAsync();
        }

        // ── 11. Home Visitations ──────────────────────────────────────────────
        if (!await context.HomeVisitations.AnyAsync())
        {
            var records = ReadCsv<HomeVisitationCsv>(csvBase, "home_visitations.csv", cfg);
            context.HomeVisitations.AddRange(records.Select(r => new HomeVisitation
            {
                VisitationId = r.visitation_id,
                ResidentId = r.resident_id,
                VisitDate = ParseDate(r.visit_date),
                CoordinationKind = "HomeVisit",
                VisitTime = null,
                SocialWorker = r.social_worker ?? "",
                VisitType = r.visit_type ?? "",
                LocationVisited = r.location_visited,
                FamilyMembersPresent = r.family_members_present,
                Purpose = r.purpose,
                Observations = r.observations,
                FamilyCooperationLevel = r.family_cooperation_level,
                SafetyConcernsNoted = ParseBool(r.safety_concerns_noted),
                FollowUpNeeded = ParseBool(r.follow_up_needed),
                FollowUpNotes = r.follow_up_notes,
                VisitOutcome = r.visit_outcome
            }));
            await context.SaveChangesAsync();
        }

        // ── 12. Education Records ─────────────────────────────────────────────
        if (!await context.EducationRecords.AnyAsync())
        {
            var records = ReadCsv<EducationRecordCsv>(csvBase, "education_records.csv", cfg);
            context.EducationRecords.AddRange(records.Select(r => new EducationRecord
            {
                EducationRecordId = r.education_record_id,
                ResidentId = r.resident_id,
                RecordDate = ParseDate(r.record_date),
                EducationLevel = r.education_level,
                SchoolName = r.school_name,
                EnrollmentStatus = r.enrollment_status,
                AttendanceRate = string.IsNullOrWhiteSpace(r.attendance_rate) ? null : decimal.Parse(r.attendance_rate, CultureInfo.InvariantCulture),
                ProgressPercent = string.IsNullOrWhiteSpace(r.progress_percent) ? null : decimal.Parse(r.progress_percent, CultureInfo.InvariantCulture),
                CompletionStatus = r.completion_status,
                Notes = r.notes
            }));
            await context.SaveChangesAsync();
        }

        // ── 13. Health & Wellbeing Records ────────────────────────────────────
        if (!await context.HealthWellbeingRecords.AnyAsync())
        {
            var records = ReadCsv<HealthRecordCsv>(csvBase, "health_wellbeing_records.csv", cfg);
            context.HealthWellbeingRecords.AddRange(records.Select(r => new HealthWellbeingRecord
            {
                HealthRecordId = r.health_record_id,
                ResidentId = r.resident_id,
                RecordDate = ParseDate(r.record_date),
                GeneralHealthScore = ParseDecimal(r.general_health_score),
                NutritionScore = ParseDecimal(r.nutrition_score),
                SleepQualityScore = ParseDecimal(r.sleep_quality_score),
                EnergyLevelScore = ParseDecimal(r.energy_level_score),
                HeightCm = ParseDecimal(r.height_cm),
                WeightKg = ParseDecimal(r.weight_kg),
                Bmi = ParseDecimal(r.bmi),
                MedicalCheckupDone = ParseBool(r.medical_checkup_done),
                DentalCheckupDone = ParseBool(r.dental_checkup_done),
                PsychologicalCheckupDone = ParseBool(r.psychological_checkup_done),
                Notes = r.notes
            }));
            await context.SaveChangesAsync();
        }

        // ── 14. Intervention Plans ────────────────────────────────────────────
        if (!await context.InterventionPlans.AnyAsync())
        {
            var records = ReadCsv<InterventionPlanCsv>(csvBase, "intervention_plans.csv", cfg);
            context.InterventionPlans.AddRange(records.Select(r => new InterventionPlan
            {
                PlanId = r.plan_id,
                ResidentId = r.resident_id,
                PlanCategory = r.plan_category ?? "",
                PlanDescription = r.plan_description,
                ServicesProvided = r.services_provided,
                TargetValue = ParseDecimal(r.target_value),
                TargetDate = ParseDate(r.target_date),
                Status = r.status ?? "",
                CaseConferenceDate = string.IsNullOrWhiteSpace(r.case_conference_date) ? null : ParseDate(r.case_conference_date),
                CreatedAt = string.IsNullOrWhiteSpace(r.created_at) ? DateTime.UtcNow : DateTime.Parse(r.created_at),
                UpdatedAt = string.IsNullOrWhiteSpace(r.updated_at) ? DateTime.UtcNow : DateTime.Parse(r.updated_at)
            }));
            await context.SaveChangesAsync();
        }

        // ── 15. Incident Reports ──────────────────────────────────────────────
        if (!await context.IncidentReports.AnyAsync())
        {
            var records = ReadCsv<IncidentReportCsv>(csvBase, "incident_reports.csv", cfg);
            context.IncidentReports.AddRange(records.Select(r => new IncidentReport
            {
                IncidentId = r.incident_id,
                ResidentId = r.resident_id,
                SafehouseId = r.safehouse_id,
                IncidentDate = ParseDate(r.incident_date),
                IncidentType = r.incident_type ?? "",
                Severity = r.severity ?? "",
                Description = r.description,
                ResponseTaken = r.response_taken,
                Resolved = ParseBool(r.resolved),
                ResolutionDate = string.IsNullOrWhiteSpace(r.resolution_date) ? null : ParseDate(r.resolution_date),
                ReportedBy = r.reported_by,
                FollowUpRequired = ParseBool(r.follow_up_required)
            }));
            await context.SaveChangesAsync();
        }

        // ── 16. Social Media Posts ────────────────────────────────────────────
        if (!await context.SocialMediaPosts.AnyAsync())
        {
            var records = ReadCsv<SocialMediaPostCsv>(csvBase, "social_media_posts.csv", cfg);
            context.SocialMediaPosts.AddRange(records.Select(r => new SocialMediaPost
            {
                PostId = r.post_id,
                Platform = r.platform ?? "",
                PlatformPostId = r.platform_post_id,
                PostUrl = r.post_url,
                CreatedAt = string.IsNullOrWhiteSpace(r.created_at) ? DateTime.UtcNow : DateTime.Parse(r.created_at),
                DayOfWeek = r.day_of_week,
                PostHour = string.IsNullOrWhiteSpace(r.post_hour) ? null : int.Parse(r.post_hour),
                PostType = r.post_type ?? "",
                MediaType = r.media_type,
                Caption = r.caption,
                Hashtags = r.hashtags,
                NumHashtags = string.IsNullOrWhiteSpace(r.num_hashtags) ? 0 : int.Parse(r.num_hashtags),
                MentionsCount = string.IsNullOrWhiteSpace(r.mentions_count) ? 0 : int.Parse(r.mentions_count),
                HasCallToAction = ParseBool(r.has_call_to_action),
                CallToActionType = r.call_to_action_type,
                ContentTopic = r.content_topic,
                SentimentTone = r.sentiment_tone,
                CaptionLength = string.IsNullOrWhiteSpace(r.caption_length) ? 0 : int.Parse(r.caption_length),
                FeaturesResidentStory = ParseBool(r.features_resident_story),
                CampaignName = r.campaign_name,
                IsBoosted = ParseBool(r.is_boosted),
                BoostBudgetPhp = ParseDecimal(r.boost_budget_php),
                Impressions = string.IsNullOrWhiteSpace(r.impressions) ? 0 : int.Parse(r.impressions),
                Reach = string.IsNullOrWhiteSpace(r.reach) ? 0 : int.Parse(r.reach),
                Likes = string.IsNullOrWhiteSpace(r.likes) ? 0 : int.Parse(r.likes),
                Comments = string.IsNullOrWhiteSpace(r.comments) ? 0 : int.Parse(r.comments),
                Shares = string.IsNullOrWhiteSpace(r.shares) ? 0 : int.Parse(r.shares),
                Saves = string.IsNullOrWhiteSpace(r.saves) ? 0 : int.Parse(r.saves),
                ClickThroughs = string.IsNullOrWhiteSpace(r.click_throughs) ? 0 : int.Parse(r.click_throughs),
                VideoViews = string.IsNullOrWhiteSpace(r.video_views) ? null : int.Parse(r.video_views),
                EngagementRate = ParseDecimal(r.engagement_rate) ?? 0,
                ProfileVisits = string.IsNullOrWhiteSpace(r.profile_visits) ? 0 : int.Parse(r.profile_visits),
                DonationReferrals = string.IsNullOrWhiteSpace(r.donation_referrals) ? 0 : int.Parse(r.donation_referrals),
                EstimatedDonationValuePhp = ParseDecimal(r.estimated_donation_value_php) ?? 0,
                FollowerCountAtPost = string.IsNullOrWhiteSpace(r.follower_count_at_post) ? 0 : int.Parse(r.follower_count_at_post),
                WatchTimeSeconds = string.IsNullOrWhiteSpace(r.watch_time_seconds) ? null : int.Parse(r.watch_time_seconds),
                AvgViewDurationSeconds = string.IsNullOrWhiteSpace(r.avg_view_duration_seconds) ? null : int.Parse(r.avg_view_duration_seconds),
                SubscriberCountAtPost = string.IsNullOrWhiteSpace(r.subscriber_count_at_post) ? null : int.Parse(r.subscriber_count_at_post),
                Forwards = string.IsNullOrWhiteSpace(r.forwards) ? null : int.Parse(r.forwards)
            }));
            await context.SaveChangesAsync();
        }

        // ── 17. Safehouse Monthly Metrics ─────────────────────────────────────
        if (!await context.SafehouseMonthlyMetrics.AnyAsync())
        {
            var records = ReadCsv<SafehouseMonthlyMetricCsv>(csvBase, "safehouse_monthly_metrics.csv", cfg);
            context.SafehouseMonthlyMetrics.AddRange(records.Select(r => new SafehouseMonthlyMetric
            {
                MetricId = r.metric_id,
                SafehouseId = r.safehouse_id,
                MonthStart = ParseDate(r.month_start),
                MonthEnd = ParseDate(r.month_end),
                ActiveResidents = r.active_residents,
                AvgEducationProgress = ParseDecimal(r.avg_education_progress) ?? 0,
                AvgHealthScore = ParseDecimal(r.avg_health_score) ?? 0,
                ProcessRecordingCount = r.process_recording_count,
                HomeVisitationCount = r.home_visitation_count,
                IncidentCount = r.incident_count,
                Notes = r.notes
            }));
            await context.SaveChangesAsync();
        }

        // ── 18. Public Impact Snapshots ───────────────────────────────────────
        if (!await context.PublicImpactSnapshots.AnyAsync())
        {
            var records = ReadCsv<PublicImpactSnapshotCsv>(csvBase, "public_impact_snapshots.csv", cfg);
            context.PublicImpactSnapshots.AddRange(records.Select(r => new PublicImpactSnapshot
            {
                SnapshotId = r.snapshot_id,
                SnapshotDate = ParseDate(r.snapshot_date),
                Headline = r.headline,
                SummaryText = r.summary_text,
                MetricPayloadJson = r.metric_payload_json,
                IsPublished = ParseBool(r.is_published),
                PublishedAt = string.IsNullOrWhiteSpace(r.published_at) ? null : ParseDate(r.published_at)
            }));
            await context.SaveChangesAsync();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string? FindCsvDirectory(IWebHostEnvironment env)
    {
        // Try several candidate paths relative to the project
        var candidates = new[]
        {
            Path.Combine(env.ContentRootPath, "..", "..", "..", "ML pipelines", "lighthouse_csv_v7", "lighthouse_csv_v7"),
            Path.Combine(env.ContentRootPath, "ML pipelines", "lighthouse_csv_v7", "lighthouse_csv_v7"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "ML pipelines", "lighthouse_csv_v7", "lighthouse_csv_v7"),
        };
        return candidates.Select(Path.GetFullPath).FirstOrDefault(Directory.Exists);
    }

    private static List<T> ReadCsv<T>(string dir, string file, CsvConfiguration cfg)
    {
        var path = Path.Combine(dir, file);
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, cfg);
        return csv.GetRecords<T>().ToList();
    }

    private static DateOnly ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DateOnly.MinValue;
        // Handle both yyyy-MM-dd and MM/dd/yyyy
        if (DateOnly.TryParseExact(value, "yyyy-MM-dd", null, DateTimeStyles.None, out var d)) return d;
        if (DateOnly.TryParse(value, out d)) return d;
        return DateOnly.MinValue;
    }

    private static bool ParseBool(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        return value.Trim().ToLower() is "true" or "1" or "yes";
    }

    private static decimal? ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : null;
    }
}

// ── CSV row DTOs (snake_case to match headers) ────────────────────────────────
#pragma warning disable CS8618, CS0649
file class SafehouseCsv { public int safehouse_id; public string? safehouse_code; public string? name; public string? region; public string? city; public string? province; public string? country; public string? open_date; public string? status; public int capacity_girls; public int capacity_staff; public int current_occupancy; public string? notes; }
file class PartnerCsv { public int partner_id; public string? partner_name; public string? partner_type; public string? role_type; public string? contact_name; public string? email; public string? phone; public string? region; public string? status; public string? start_date; public string? end_date; public string? notes; }
file class PartnerAssignmentCsv { public int assignment_id; public int partner_id; public int safehouse_id; public string? program_area; public string? assignment_start; public string? assignment_end; public string? responsibility_notes; public string? is_primary; public string? status; }
file class SupporterCsv { public int supporter_id; public string? supporter_type; public string? display_name; public string? organization_name; public string? first_name; public string? last_name; public string? relationship_type; public string? region; public string? country; public string? email; public string? phone; public string? status; public string? created_at; public string? first_donation_date; public string? acquisition_channel; }
file class DonationCsv { public int donation_id; public int supporter_id; public string? donation_type; public string? donation_date; public string? is_recurring; public string? campaign_name; public string? channel_source; public string? currency_code; public string? amount; public string? estimated_value; public string? impact_unit; public string? notes; public string? referral_post_id; }
file class InKindItemCsv { public int item_id; public int donation_id; public string? item_name; public string? item_category; public int quantity; public string? unit_of_measure; public string? estimated_unit_value; public string? intended_use; public string? received_condition; }
file class DonationAllocationCsv { public int allocation_id; public int donation_id; public int safehouse_id; public string? program_area; public string? amount_allocated; public string? allocation_date; public string? allocation_notes; }
file class ResidentCsv { public int resident_id; public string? case_control_no; public string? internal_code; public int safehouse_id; public string? case_status; public string? sex; public string? date_of_birth; public string? birth_status; public string? place_of_birth; public string? religion; public string? case_category; public string? sub_cat_orphaned; public string? sub_cat_trafficked; public string? sub_cat_child_labor; public string? sub_cat_physical_abuse; public string? sub_cat_sexual_abuse; public string? sub_cat_osaec; public string? sub_cat_cicl; public string? sub_cat_at_risk; public string? sub_cat_street_child; public string? sub_cat_child_with_hiv; public string? is_pwd; public string? pwd_type; public string? has_special_needs; public string? special_needs_diagnosis; public string? family_is_4ps; public string? family_solo_parent; public string? family_indigenous; public string? family_parent_pwd; public string? family_informal_settler; public string? date_of_admission; public string? age_upon_admission; public string? present_age; public string? length_of_stay; public string? referral_source; public string? referring_agency_person; public string? date_colb_registered; public string? date_colb_obtained; public string? assigned_social_worker; public string? initial_case_assessment; public string? date_case_study_prepared; public string? reintegration_type; public string? reintegration_status; public string? initial_risk_level; public string? current_risk_level; public string? date_enrolled; public string? date_closed; public string? created_at; public string? notes_restricted; }
file class ProcessRecordingCsv { public int recording_id; public int resident_id; public string? session_date; public string? social_worker; public string? session_type; public string? session_duration_minutes; public string? emotional_state_observed; public string? emotional_state_end; public string? session_narrative; public string? interventions_applied; public string? follow_up_actions; public string? progress_noted; public string? concerns_flagged; public string? referral_made; public string? notes_restricted; }
file class HomeVisitationCsv { public int visitation_id; public int resident_id; public string? visit_date; public string? social_worker; public string? visit_type; public string? location_visited; public string? family_members_present; public string? purpose; public string? observations; public string? family_cooperation_level; public string? safety_concerns_noted; public string? follow_up_needed; public string? follow_up_notes; public string? visit_outcome; }
file class EducationRecordCsv { public int education_record_id; public int resident_id; public string? record_date; public string? education_level; public string? school_name; public string? enrollment_status; public string? attendance_rate; public string? progress_percent; public string? completion_status; public string? notes; }
file class HealthRecordCsv { public int health_record_id; public int resident_id; public string? record_date; public string? general_health_score; public string? nutrition_score; public string? sleep_quality_score; public string? energy_level_score; public string? height_cm; public string? weight_kg; public string? bmi; public string? medical_checkup_done; public string? dental_checkup_done; public string? psychological_checkup_done; public string? notes; }
file class InterventionPlanCsv { public int plan_id; public int resident_id; public string? plan_category; public string? plan_description; public string? services_provided; public string? target_value; public string? target_date; public string? status; public string? case_conference_date; public string? created_at; public string? updated_at; }
file class IncidentReportCsv { public int incident_id; public int resident_id; public int safehouse_id; public string? incident_date; public string? incident_type; public string? severity; public string? description; public string? response_taken; public string? resolved; public string? resolution_date; public string? reported_by; public string? follow_up_required; }
file class SocialMediaPostCsv { public int post_id; public string? platform; public string? platform_post_id; public string? post_url; public string? created_at; public string? day_of_week; public string? post_hour; public string? post_type; public string? media_type; public string? caption; public string? hashtags; public string? num_hashtags; public string? mentions_count; public string? has_call_to_action; public string? call_to_action_type; public string? content_topic; public string? sentiment_tone; public string? caption_length; public string? features_resident_story; public string? campaign_name; public string? is_boosted; public string? boost_budget_php; public string? impressions; public string? reach; public string? likes; public string? comments; public string? shares; public string? saves; public string? click_throughs; public string? video_views; public string? engagement_rate; public string? profile_visits; public string? donation_referrals; public string? estimated_donation_value_php; public string? follower_count_at_post; public string? watch_time_seconds; public string? avg_view_duration_seconds; public string? subscriber_count_at_post; public string? forwards; }
file class SafehouseMonthlyMetricCsv { public int metric_id; public int safehouse_id; public string? month_start; public string? month_end; public int active_residents; public string? avg_education_progress; public string? avg_health_score; public int process_recording_count; public int home_visitation_count; public int incident_count; public string? notes; }
file class PublicImpactSnapshotCsv { public int snapshot_id; public string? snapshot_date; public string? headline; public string? summary_text; public string? metric_payload_json; public string? is_published; public string? published_at; }
#pragma warning restore CS8618, CS0649

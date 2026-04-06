using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Intex2026.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    SupporterId = table.Column<int>(type: "INTEGER", nullable: true),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                    SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Partners",
                columns: table => new
                {
                    PartnerId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PartnerName = table.Column<string>(type: "TEXT", nullable: false),
                    PartnerType = table.Column<string>(type: "TEXT", nullable: false),
                    RoleType = table.Column<string>(type: "TEXT", nullable: false),
                    ContactName = table.Column<string>(type: "TEXT", nullable: true),
                    Email = table.Column<string>(type: "TEXT", nullable: true),
                    Phone = table.Column<string>(type: "TEXT", nullable: true),
                    Region = table.Column<string>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partners", x => x.PartnerId);
                });

            migrationBuilder.CreateTable(
                name: "PublicImpactSnapshots",
                columns: table => new
                {
                    SnapshotId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SnapshotDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Headline = table.Column<string>(type: "TEXT", nullable: true),
                    SummaryText = table.Column<string>(type: "TEXT", nullable: true),
                    MetricPayloadJson = table.Column<string>(type: "TEXT", nullable: true),
                    IsPublished = table.Column<bool>(type: "INTEGER", nullable: false),
                    PublishedAt = table.Column<DateOnly>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicImpactSnapshots", x => x.SnapshotId);
                });

            migrationBuilder.CreateTable(
                name: "Safehouses",
                columns: table => new
                {
                    SafehouseId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SafehouseCode = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Region = table.Column<string>(type: "TEXT", nullable: false),
                    City = table.Column<string>(type: "TEXT", nullable: false),
                    Province = table.Column<string>(type: "TEXT", nullable: false),
                    Country = table.Column<string>(type: "TEXT", nullable: false),
                    OpenDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CapacityGirls = table.Column<int>(type: "INTEGER", nullable: false),
                    CapacityStaff = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentOccupancy = table.Column<int>(type: "INTEGER", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Safehouses", x => x.SafehouseId);
                });

            migrationBuilder.CreateTable(
                name: "SocialMediaPosts",
                columns: table => new
                {
                    PostId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Platform = table.Column<string>(type: "TEXT", nullable: false),
                    PlatformPostId = table.Column<string>(type: "TEXT", nullable: true),
                    PostUrl = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DayOfWeek = table.Column<string>(type: "TEXT", nullable: true),
                    PostHour = table.Column<int>(type: "INTEGER", nullable: true),
                    PostType = table.Column<string>(type: "TEXT", nullable: false),
                    MediaType = table.Column<string>(type: "TEXT", nullable: true),
                    Caption = table.Column<string>(type: "TEXT", nullable: true),
                    Hashtags = table.Column<string>(type: "TEXT", nullable: true),
                    NumHashtags = table.Column<int>(type: "INTEGER", nullable: false),
                    MentionsCount = table.Column<int>(type: "INTEGER", nullable: false),
                    HasCallToAction = table.Column<bool>(type: "INTEGER", nullable: false),
                    CallToActionType = table.Column<string>(type: "TEXT", nullable: true),
                    ContentTopic = table.Column<string>(type: "TEXT", nullable: true),
                    SentimentTone = table.Column<string>(type: "TEXT", nullable: true),
                    CaptionLength = table.Column<int>(type: "INTEGER", nullable: false),
                    FeaturesResidentStory = table.Column<bool>(type: "INTEGER", nullable: false),
                    CampaignName = table.Column<string>(type: "TEXT", nullable: true),
                    IsBoosted = table.Column<bool>(type: "INTEGER", nullable: false),
                    BoostBudgetPhp = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Impressions = table.Column<int>(type: "INTEGER", nullable: false),
                    Reach = table.Column<int>(type: "INTEGER", nullable: false),
                    Likes = table.Column<int>(type: "INTEGER", nullable: false),
                    Comments = table.Column<int>(type: "INTEGER", nullable: false),
                    Shares = table.Column<int>(type: "INTEGER", nullable: false),
                    Saves = table.Column<int>(type: "INTEGER", nullable: false),
                    ClickThroughs = table.Column<int>(type: "INTEGER", nullable: false),
                    VideoViews = table.Column<int>(type: "INTEGER", nullable: true),
                    EngagementRate = table.Column<decimal>(type: "decimal(8,6)", nullable: false),
                    ProfileVisits = table.Column<int>(type: "INTEGER", nullable: false),
                    DonationReferrals = table.Column<int>(type: "INTEGER", nullable: false),
                    EstimatedDonationValuePhp = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FollowerCountAtPost = table.Column<int>(type: "INTEGER", nullable: false),
                    WatchTimeSeconds = table.Column<int>(type: "INTEGER", nullable: true),
                    AvgViewDurationSeconds = table.Column<int>(type: "INTEGER", nullable: true),
                    SubscriberCountAtPost = table.Column<int>(type: "INTEGER", nullable: true),
                    Forwards = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialMediaPosts", x => x.PostId);
                });

            migrationBuilder.CreateTable(
                name: "Supporters",
                columns: table => new
                {
                    SupporterId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SupporterType = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    OrganizationName = table.Column<string>(type: "TEXT", nullable: true),
                    FirstName = table.Column<string>(type: "TEXT", nullable: true),
                    LastName = table.Column<string>(type: "TEXT", nullable: true),
                    RelationshipType = table.Column<string>(type: "TEXT", nullable: false),
                    Region = table.Column<string>(type: "TEXT", nullable: true),
                    Country = table.Column<string>(type: "TEXT", nullable: true),
                    Email = table.Column<string>(type: "TEXT", nullable: true),
                    Phone = table.Column<string>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    FirstDonationDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    AcquisitionChannel = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supporters", x => x.SupporterId);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderKey = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PartnerAssignments",
                columns: table => new
                {
                    AssignmentId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PartnerId = table.Column<int>(type: "INTEGER", nullable: false),
                    SafehouseId = table.Column<int>(type: "INTEGER", nullable: true),
                    ProgramArea = table.Column<string>(type: "TEXT", nullable: false),
                    AssignmentStart = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    AssignmentEnd = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    ResponsibilityNotes = table.Column<string>(type: "TEXT", nullable: true),
                    IsPrimary = table.Column<bool>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerAssignments", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_PartnerAssignments_Partners_PartnerId",
                        column: x => x.PartnerId,
                        principalTable: "Partners",
                        principalColumn: "PartnerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PartnerAssignments_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Residents",
                columns: table => new
                {
                    ResidentId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CaseControlNo = table.Column<string>(type: "TEXT", nullable: false),
                    InternalCode = table.Column<string>(type: "TEXT", nullable: false),
                    SafehouseId = table.Column<int>(type: "INTEGER", nullable: false),
                    CaseStatus = table.Column<string>(type: "TEXT", nullable: false),
                    Sex = table.Column<string>(type: "TEXT", nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    BirthStatus = table.Column<string>(type: "TEXT", nullable: true),
                    PlaceOfBirth = table.Column<string>(type: "TEXT", nullable: true),
                    Religion = table.Column<string>(type: "TEXT", nullable: true),
                    CaseCategory = table.Column<string>(type: "TEXT", nullable: false),
                    SubCatOrphaned = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatTrafficked = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatChildLabor = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatPhysicalAbuse = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatSexualAbuse = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatOsaec = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatCicl = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatAtRisk = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatStreetChild = table.Column<bool>(type: "INTEGER", nullable: false),
                    SubCatChildWithHiv = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPwd = table.Column<bool>(type: "INTEGER", nullable: false),
                    PwdType = table.Column<string>(type: "TEXT", nullable: true),
                    HasSpecialNeeds = table.Column<bool>(type: "INTEGER", nullable: false),
                    SpecialNeedsDiagnosis = table.Column<string>(type: "TEXT", nullable: true),
                    FamilyIs4ps = table.Column<bool>(type: "INTEGER", nullable: false),
                    FamilySoloParent = table.Column<bool>(type: "INTEGER", nullable: false),
                    FamilyIndigenous = table.Column<bool>(type: "INTEGER", nullable: false),
                    FamilyParentPwd = table.Column<bool>(type: "INTEGER", nullable: false),
                    FamilyInformalSettler = table.Column<bool>(type: "INTEGER", nullable: false),
                    DateOfAdmission = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    AgeUponAdmission = table.Column<string>(type: "TEXT", nullable: true),
                    PresentAge = table.Column<string>(type: "TEXT", nullable: true),
                    LengthOfStay = table.Column<string>(type: "TEXT", nullable: true),
                    ReferralSource = table.Column<string>(type: "TEXT", nullable: true),
                    ReferringAgencyPerson = table.Column<string>(type: "TEXT", nullable: true),
                    DateColbRegistered = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    DateColbObtained = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    AssignedSocialWorker = table.Column<string>(type: "TEXT", nullable: true),
                    InitialCaseAssessment = table.Column<string>(type: "TEXT", nullable: true),
                    DateCaseStudyPrepared = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    ReintegrationType = table.Column<string>(type: "TEXT", nullable: true),
                    ReintegrationStatus = table.Column<string>(type: "TEXT", nullable: true),
                    InitialRiskLevel = table.Column<string>(type: "TEXT", nullable: false),
                    CurrentRiskLevel = table.Column<string>(type: "TEXT", nullable: false),
                    DateEnrolled = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    DateClosed = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NotesRestricted = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Residents", x => x.ResidentId);
                    table.ForeignKey(
                        name: "FK_Residents_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SafehouseMonthlyMetrics",
                columns: table => new
                {
                    MetricId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SafehouseId = table.Column<int>(type: "INTEGER", nullable: false),
                    MonthStart = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    MonthEnd = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    ActiveResidents = table.Column<int>(type: "INTEGER", nullable: false),
                    AvgEducationProgress = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    AvgHealthScore = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    ProcessRecordingCount = table.Column<int>(type: "INTEGER", nullable: false),
                    HomeVisitationCount = table.Column<int>(type: "INTEGER", nullable: false),
                    IncidentCount = table.Column<int>(type: "INTEGER", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafehouseMonthlyMetrics", x => x.MetricId);
                    table.ForeignKey(
                        name: "FK_SafehouseMonthlyMetrics_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Donations",
                columns: table => new
                {
                    DonationId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SupporterId = table.Column<int>(type: "INTEGER", nullable: false),
                    DonationType = table.Column<string>(type: "TEXT", nullable: false),
                    DonationDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    ChannelSource = table.Column<string>(type: "TEXT", nullable: false),
                    CurrencyCode = table.Column<string>(type: "TEXT", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ImpactUnit = table.Column<string>(type: "TEXT", nullable: true),
                    IsRecurring = table.Column<bool>(type: "INTEGER", nullable: false),
                    CampaignName = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedByPartnerId = table.Column<int>(type: "INTEGER", nullable: true),
                    ReferralPostId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Donations", x => x.DonationId);
                    table.ForeignKey(
                        name: "FK_Donations_Supporters_SupporterId",
                        column: x => x.SupporterId,
                        principalTable: "Supporters",
                        principalColumn: "SupporterId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationRecords",
                columns: table => new
                {
                    EducationRecordId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ResidentId = table.Column<int>(type: "INTEGER", nullable: false),
                    RecordDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    EducationLevel = table.Column<string>(type: "TEXT", nullable: true),
                    SchoolName = table.Column<string>(type: "TEXT", nullable: true),
                    EnrollmentStatus = table.Column<string>(type: "TEXT", nullable: true),
                    AttendanceRate = table.Column<decimal>(type: "decimal(5,4)", nullable: true),
                    ProgressPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    CompletionStatus = table.Column<string>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationRecords", x => x.EducationRecordId);
                    table.ForeignKey(
                        name: "FK_EducationRecords_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HealthWellbeingRecords",
                columns: table => new
                {
                    HealthRecordId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ResidentId = table.Column<int>(type: "INTEGER", nullable: false),
                    RecordDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    GeneralHealthScore = table.Column<decimal>(type: "decimal(3,2)", nullable: true),
                    NutritionScore = table.Column<decimal>(type: "decimal(3,2)", nullable: true),
                    SleepQualityScore = table.Column<decimal>(type: "decimal(3,2)", nullable: true),
                    EnergyLevelScore = table.Column<decimal>(type: "decimal(3,2)", nullable: true),
                    HeightCm = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    WeightKg = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Bmi = table.Column<decimal>(type: "decimal(4,2)", nullable: true),
                    MedicalCheckupDone = table.Column<bool>(type: "INTEGER", nullable: false),
                    DentalCheckupDone = table.Column<bool>(type: "INTEGER", nullable: false),
                    PsychologicalCheckupDone = table.Column<bool>(type: "INTEGER", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthWellbeingRecords", x => x.HealthRecordId);
                    table.ForeignKey(
                        name: "FK_HealthWellbeingRecords_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HomeVisitations",
                columns: table => new
                {
                    VisitationId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ResidentId = table.Column<int>(type: "INTEGER", nullable: false),
                    VisitDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    SocialWorker = table.Column<string>(type: "TEXT", nullable: false),
                    VisitType = table.Column<string>(type: "TEXT", nullable: false),
                    LocationVisited = table.Column<string>(type: "TEXT", nullable: true),
                    FamilyMembersPresent = table.Column<string>(type: "TEXT", nullable: true),
                    Purpose = table.Column<string>(type: "TEXT", nullable: true),
                    Observations = table.Column<string>(type: "TEXT", nullable: true),
                    FamilyCooperationLevel = table.Column<string>(type: "TEXT", nullable: true),
                    SafetyConcernsNoted = table.Column<bool>(type: "INTEGER", nullable: false),
                    FollowUpNeeded = table.Column<bool>(type: "INTEGER", nullable: false),
                    FollowUpNotes = table.Column<string>(type: "TEXT", nullable: true),
                    VisitOutcome = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeVisitations", x => x.VisitationId);
                    table.ForeignKey(
                        name: "FK_HomeVisitations_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IncidentReports",
                columns: table => new
                {
                    IncidentId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ResidentId = table.Column<int>(type: "INTEGER", nullable: false),
                    SafehouseId = table.Column<int>(type: "INTEGER", nullable: false),
                    IncidentDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    IncidentType = table.Column<string>(type: "TEXT", nullable: false),
                    Severity = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    ResponseTaken = table.Column<string>(type: "TEXT", nullable: true),
                    Resolved = table.Column<bool>(type: "INTEGER", nullable: false),
                    ResolutionDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    ReportedBy = table.Column<string>(type: "TEXT", nullable: true),
                    FollowUpRequired = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentReports", x => x.IncidentId);
                    table.ForeignKey(
                        name: "FK_IncidentReports_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_IncidentReports_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InterventionPlans",
                columns: table => new
                {
                    PlanId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ResidentId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlanCategory = table.Column<string>(type: "TEXT", nullable: false),
                    PlanDescription = table.Column<string>(type: "TEXT", nullable: true),
                    ServicesProvided = table.Column<string>(type: "TEXT", nullable: true),
                    TargetValue = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    TargetDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CaseConferenceDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterventionPlans", x => x.PlanId);
                    table.ForeignKey(
                        name: "FK_InterventionPlans_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcessRecordings",
                columns: table => new
                {
                    RecordingId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ResidentId = table.Column<int>(type: "INTEGER", nullable: false),
                    SessionDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    SocialWorker = table.Column<string>(type: "TEXT", nullable: false),
                    SessionType = table.Column<string>(type: "TEXT", nullable: false),
                    SessionDurationMinutes = table.Column<int>(type: "INTEGER", nullable: true),
                    EmotionalStateObserved = table.Column<string>(type: "TEXT", nullable: false),
                    EmotionalStateEnd = table.Column<string>(type: "TEXT", nullable: true),
                    SessionNarrative = table.Column<string>(type: "TEXT", nullable: true),
                    InterventionsApplied = table.Column<string>(type: "TEXT", nullable: true),
                    FollowUpActions = table.Column<string>(type: "TEXT", nullable: true),
                    ProgressNoted = table.Column<bool>(type: "INTEGER", nullable: false),
                    ConcernsFlagged = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReferralMade = table.Column<bool>(type: "INTEGER", nullable: false),
                    NotesRestricted = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessRecordings", x => x.RecordingId);
                    table.ForeignKey(
                        name: "FK_ProcessRecordings_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DonationAllocations",
                columns: table => new
                {
                    AllocationId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DonationId = table.Column<int>(type: "INTEGER", nullable: false),
                    SafehouseId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProgramArea = table.Column<string>(type: "TEXT", nullable: false),
                    AmountAllocated = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AllocationDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    AllocationNotes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonationAllocations", x => x.AllocationId);
                    table.ForeignKey(
                        name: "FK_DonationAllocations_Donations_DonationId",
                        column: x => x.DonationId,
                        principalTable: "Donations",
                        principalColumn: "DonationId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DonationAllocations_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InKindDonationItems",
                columns: table => new
                {
                    ItemId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DonationId = table.Column<int>(type: "INTEGER", nullable: false),
                    ItemName = table.Column<string>(type: "TEXT", nullable: false),
                    ItemCategory = table.Column<string>(type: "TEXT", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "TEXT", nullable: false),
                    EstimatedUnitValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IntendedUse = table.Column<string>(type: "TEXT", nullable: true),
                    ReceivedCondition = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InKindDonationItems", x => x.ItemId);
                    table.ForeignKey(
                        name: "FK_InKindDonationItems_Donations_DonationId",
                        column: x => x.DonationId,
                        principalTable: "Donations",
                        principalColumn: "DonationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DonationAllocations_DonationId",
                table: "DonationAllocations",
                column: "DonationId");

            migrationBuilder.CreateIndex(
                name: "IX_DonationAllocations_SafehouseId",
                table: "DonationAllocations",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_Donations_SupporterId",
                table: "Donations",
                column: "SupporterId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationRecords_ResidentId",
                table: "EducationRecords",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthWellbeingRecords_ResidentId",
                table: "HealthWellbeingRecords",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_HomeVisitations_ResidentId",
                table: "HomeVisitations",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_ResidentId",
                table: "IncidentReports",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_SafehouseId",
                table: "IncidentReports",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_InKindDonationItems_DonationId",
                table: "InKindDonationItems",
                column: "DonationId");

            migrationBuilder.CreateIndex(
                name: "IX_InterventionPlans_ResidentId",
                table: "InterventionPlans",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerAssignments_PartnerId",
                table: "PartnerAssignments",
                column: "PartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerAssignments_SafehouseId",
                table: "PartnerAssignments",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRecordings_ResidentId",
                table: "ProcessRecordings",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_Residents_SafehouseId",
                table: "Residents",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_SafehouseMonthlyMetrics_SafehouseId",
                table: "SafehouseMonthlyMetrics",
                column: "SafehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "DonationAllocations");

            migrationBuilder.DropTable(
                name: "EducationRecords");

            migrationBuilder.DropTable(
                name: "HealthWellbeingRecords");

            migrationBuilder.DropTable(
                name: "HomeVisitations");

            migrationBuilder.DropTable(
                name: "IncidentReports");

            migrationBuilder.DropTable(
                name: "InKindDonationItems");

            migrationBuilder.DropTable(
                name: "InterventionPlans");

            migrationBuilder.DropTable(
                name: "PartnerAssignments");

            migrationBuilder.DropTable(
                name: "ProcessRecordings");

            migrationBuilder.DropTable(
                name: "PublicImpactSnapshots");

            migrationBuilder.DropTable(
                name: "SafehouseMonthlyMetrics");

            migrationBuilder.DropTable(
                name: "SocialMediaPosts");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Donations");

            migrationBuilder.DropTable(
                name: "Partners");

            migrationBuilder.DropTable(
                name: "Residents");

            migrationBuilder.DropTable(
                name: "Supporters");

            migrationBuilder.DropTable(
                name: "Safehouses");
        }
    }
}

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "__EFMigrationsLock" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK___EFMigrationsLock" PRIMARY KEY,
    "Timestamp" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);
INSERT INTO __EFMigrationsHistory VALUES('20260406220305_InitialCreate','10.0.4');
CREATE TABLE IF NOT EXISTS "AspNetRoles" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_AspNetRoles" PRIMARY KEY,
    "Name" TEXT NULL,
    "NormalizedName" TEXT NULL,
    "ConcurrencyStamp" TEXT NULL
);
INSERT INTO AspNetRoles VALUES('087e1a9a-6d6d-464b-b9c9-f39d6ae43991','Admin','ADMIN','8eaeab4a-6c00-4f63-8052-bd595f36daf5');
INSERT INTO AspNetRoles VALUES('2641d75d-33e6-415f-b91a-2659c23cb0bf','Donor','DONOR','93b1d4aa-09ef-4744-b9c3-782180bd7e0c');
CREATE TABLE IF NOT EXISTS "AspNetUsers" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_AspNetUsers" PRIMARY KEY,
    "SupporterId" INTEGER NULL,
    "UserName" TEXT NULL,
    "NormalizedUserName" TEXT NULL,
    "Email" TEXT NULL,
    "NormalizedEmail" TEXT NULL,
    "EmailConfirmed" INTEGER NOT NULL,
    "PasswordHash" TEXT NULL,
    "SecurityStamp" TEXT NULL,
    "ConcurrencyStamp" TEXT NULL,
    "PhoneNumber" TEXT NULL,
    "PhoneNumberConfirmed" INTEGER NOT NULL,
    "TwoFactorEnabled" INTEGER NOT NULL,
    "LockoutEnd" TEXT NULL,
    "LockoutEnabled" INTEGER NOT NULL,
    "AccessFailedCount" INTEGER NOT NULL
);
INSERT INTO AspNetUsers VALUES('3677460e-f135-4c73-9af6-5e3ba8b68791',NULL,'admin@northstarsanctuary.org','ADMIN@NORTHSTARSANCTUARY.ORG','admin@northstarsanctuary.org','ADMIN@NORTHSTARSANCTUARY.ORG',0,'AQAAAAIAAYagAAAAEE2lmDIZNCYM2Qz0rTB0X3Lk4xzNlk3Eq4FbAuKBabnP6STUIUrWtGf96EucNmmp5Q==','BAHIBWLW2LJINFH2ISVBF3NKS2M4ENQD','9b899d28-e44d-4c15-8db8-38d1c304657a',NULL,0,0,NULL,1,0);
CREATE TABLE IF NOT EXISTS "Partners" (
    "PartnerId" INTEGER NOT NULL CONSTRAINT "PK_Partners" PRIMARY KEY AUTOINCREMENT,
    "PartnerName" TEXT NOT NULL,
    "PartnerType" TEXT NOT NULL,
    "RoleType" TEXT NOT NULL,
    "ContactName" TEXT NULL,
    "Email" TEXT NULL,
    "Phone" TEXT NULL,
    "Region" TEXT NULL,
    "Status" TEXT NOT NULL,
    "StartDate" TEXT NOT NULL,
    "EndDate" TEXT NULL,
    "Notes" TEXT NULL
);
INSERT INTO Partners VALUES(1,'Ana Reyes','Organization','SafehouseOps','Ana Reyes','ana-reyes@hopepartners.ph','+63 993 532 6574','Luzon','Active','2022-01-01',NULL,'Primary contractor');
INSERT INTO Partners VALUES(2,'Maria Santos','Individual','Evaluation','Maria Santos','maria-santos@pldt.net.ph','+63 927 194 7224','Luzon','Active','2022-01-21',NULL,'Primary contractor');
INSERT INTO Partners VALUES(3,'Elena Cruz','Individual','Education','Elena Cruz','elena-cruz@eastern.com.ph','+63 966 926 1711','Mindanao','Active','2022-02-10',NULL,'Primary contractor');
INSERT INTO Partners VALUES(4,'Sofia Dizon','Organization','Logistics','Sofia Dizon','sofia-dizon@bayanihanfoundation.ph','+63 947 400 6925','Visayas','Active','2022-03-02',NULL,'Primary contractor');
INSERT INTO Partners VALUES(5,'Grace Flores','Individual','SafehouseOps','Grace Flores','grace-flores@yahoo.com.ph','+63 991 333 5741','Visayas','Active','2022-03-22',NULL,'Primary contractor');
INSERT INTO Partners VALUES(6,'Joy Garcia','Individual','Maintenance','Joy Garcia','joy-garcia@yahoo.com.ph','+63 995 384 8428','Mindanao','Active','2022-04-11',NULL,'Primary contractor');
INSERT INTO Partners VALUES(7,'Lina Mendoza','Organization','FindSafehouse','Lina Mendoza','lina-mendoza@unityalliance.ph','+63 955 786 5374','Luzon','Active','2022-05-01',NULL,'Primary contractor');
INSERT INTO Partners VALUES(8,'Noel Torres','Individual','Logistics','Noel Torres','noel-torres@yahoo.com.ph','+63 951 750 3803','Visayas','Active','2022-05-21',NULL,'Primary contractor');
INSERT INTO Partners VALUES(9,'Mark Lopez','Individual','SafehouseOps','Mark Lopez','mark-lopez@smart.com.ph','+63 995 376 4598','Luzon','Active','2022-06-10',NULL,'Primary contractor');
INSERT INTO Partners VALUES(10,'Ramon Bautista','Organization','Logistics','Ramon Bautista','ramon-bautista@hopepartners.ph','+63 915 924 6168','Mindanao','Active','2022-06-30',NULL,'Primary contractor');
INSERT INTO Partners VALUES(11,'Paolo Navarro','Individual','SafehouseOps','Paolo Navarro','paolo-navarro@eastern.com.ph','+63 977 317 9179','Luzon','Active','2022-07-20',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(12,'Jessa Ramos','Individual','SafehouseOps','Jessa Ramos','jessa-ramos@smart.com.ph','+63 937 371 3287','Mindanao','Active','2022-08-09',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(13,'Mica Castillo','Organization','Evaluation','Mica Castillo','mica-castillo@faithgroup.ph','+63 949 508 6930','Visayas','Active','2022-08-29',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(14,'Leah Gomez','Individual','Education','Leah Gomez','leah-gomez@eastern.com.ph','+63 928 193 1771','Mindanao','Active','2022-09-18',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(15,'Ruth Naval','Individual','Transport','Ruth Naval','ruth-naval@globe.com.ph','+63 992 532 2040','Luzon','Active','2022-10-08',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(16,'Ivan Pascual','Organization','SafehouseOps','Ivan Pascual','ivan-pascual@kapatiranalliance.ph','+63 947 981 1188','Visayas','Active','2022-10-28',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(17,'Aiko Rivera','Individual','Logistics','Aiko Rivera','aiko-rivera@eastern.com.ph','+63 967 887 6573','Luzon','Active','2022-11-17',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(18,'Mara Salazar','Individual','Education','Mara Salazar','mara-salazar@smart.com.ph','+63 905 839 5315','Luzon','Active','2022-12-07',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(19,'Paula Tan','Organization','Maintenance','Paula Tan','paula-tan@brightalliance.ph','+63 998 619 4258','Mindanao','Active','2022-12-27',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(20,'Chris Uy','Individual','Education','Chris Uy','chris-uy@eastern.com.ph','+63 939 100 6310','Mindanao','Active','2023-01-16',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(21,'Ben Diaz','Individual','SafehouseOps','Ben Diaz','ben-diaz@pldt.net.ph','+63 976 345 1949','Luzon','Active','2023-02-05',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(22,'Kai Javier','Organization','Evaluation','Kai Javier','kai-javier@brightfoundation.ph','+63 928 935 2133','Visayas','Active','2023-02-25',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(23,'Tess Lim','Individual','Maintenance','Tess Lim','tess-lim@globe.com.ph','+63 936 775 8787','Visayas','Active','2023-03-17',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(24,'Nina Vega','Individual','Maintenance','Nina Vega','nina-vega@eastern.com.ph','+63 951 533 4470','Luzon','Active','2023-04-06',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(25,'Rico Ramos','Organization','Maintenance','Rico Ramos','rico-ramos@globalalliance.ph','+63 996 787 7118','Mindanao','Active','2023-04-26',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(26,'Maya Serrano','Individual','SafehouseOps','Maya Serrano','maya-serrano@yahoo.com.ph','+63 965 330 2049','Visayas','Active','2023-05-16',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(27,'Ivy Valdez','Individual','Evaluation','Ivy Valdez','ivy-valdez@globe.com.ph','+63 949 325 1117','Visayas','Active','2023-06-05',NULL,'Secondary contractor');
INSERT INTO Partners VALUES(28,'Paul Yap','Organization','Education','Paul Yap','paul-yap@globalfoundation.ph','+63 915 980 6413','Visayas','Inactive','2023-06-25','2025-12-31','Secondary contractor');
INSERT INTO Partners VALUES(29,'June Cortez','Individual','Education','June Cortez','june-cortez@smart.com.ph','+63 955 652 3167','Luzon','Inactive','2023-07-15','2025-12-31','Secondary contractor');
INSERT INTO Partners VALUES(30,'Lara Soriano','Individual','Logistics','Lara Soriano','lara-soriano@eastern.com.ph','+63 921 348 8749','Mindanao','Inactive','2023-08-04','2025-12-31','Secondary contractor');
CREATE TABLE IF NOT EXISTS "PublicImpactSnapshots" (
    "SnapshotId" INTEGER NOT NULL CONSTRAINT "PK_PublicImpactSnapshots" PRIMARY KEY AUTOINCREMENT,
    "SnapshotDate" TEXT NOT NULL,
    "Headline" TEXT NULL,
    "SummaryText" TEXT NULL,
    "MetricPayloadJson" TEXT NULL,
    "IsPublished" INTEGER NOT NULL,
    "PublishedAt" TEXT NULL
);
CREATE TABLE IF NOT EXISTS "Safehouses" (
    "SafehouseId" INTEGER NOT NULL CONSTRAINT "PK_Safehouses" PRIMARY KEY AUTOINCREMENT,
    "SafehouseCode" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Region" TEXT NOT NULL,
    "City" TEXT NOT NULL,
    "Province" TEXT NOT NULL,
    "Country" TEXT NOT NULL,
    "OpenDate" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "CapacityGirls" INTEGER NOT NULL,
    "CapacityStaff" INTEGER NOT NULL,
    "CurrentOccupancy" INTEGER NOT NULL,
    "Notes" TEXT NULL
);
INSERT INTO Safehouses VALUES(1,'SH01','Lighthouse Safehouse 1','Luzon','Quezon City','Metro Manila','Philippines','2022-01-01','Active',8,4,8,'');
INSERT INTO Safehouses VALUES(2,'SH02','Lighthouse Safehouse 2','Visayas','Cebu City','Cebu','Philippines','2022-02-15','Active',10,5,8,'');
INSERT INTO Safehouses VALUES(3,'SH03','Lighthouse Safehouse 3','Mindanao','Davao City','Davao del Sur','Philippines','2022-04-01','Active',9,4,9,'');
INSERT INTO Safehouses VALUES(4,'SH04','Lighthouse Safehouse 4','Visayas','Iloilo City','Iloilo','Philippines','2022-05-16','Active',12,4,12,'');
INSERT INTO Safehouses VALUES(5,'SH05','Lighthouse Safehouse 5','Luzon','Baguio City','Benguet','Philippines','2022-06-30','Active',11,4,9,'');
INSERT INTO Safehouses VALUES(6,'SH06','Lighthouse Safehouse 6','Mindanao','Cagayan de Oro','Misamis Oriental','Philippines','2022-08-14','Active',8,5,6,'');
INSERT INTO Safehouses VALUES(7,'SH07','Lighthouse Safehouse 7','Visayas','Bacolod','Negros Occidental','Philippines','2022-09-28','Active',12,4,12,'');
INSERT INTO Safehouses VALUES(8,'SH08','Lighthouse Safehouse 8','Visayas','Tacloban','Leyte','Philippines','2022-11-12','Active',9,7,7,'');
INSERT INTO Safehouses VALUES(9,'SH09','Lighthouse Safehouse 9','Mindanao','General Santos','South Cotabato','Philippines','2022-12-27','Active',6,3,6,'');
CREATE TABLE IF NOT EXISTS "SocialMediaPosts" (
    "PostId" INTEGER NOT NULL CONSTRAINT "PK_SocialMediaPosts" PRIMARY KEY AUTOINCREMENT,
    "Platform" TEXT NOT NULL,
    "PlatformPostId" TEXT NULL,
    "PostUrl" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "DayOfWeek" TEXT NULL,
    "PostHour" INTEGER NULL,
    "PostType" TEXT NOT NULL,
    "MediaType" TEXT NULL,
    "Caption" TEXT NULL,
    "Hashtags" TEXT NULL,
    "NumHashtags" INTEGER NOT NULL,
    "MentionsCount" INTEGER NOT NULL,
    "HasCallToAction" INTEGER NOT NULL,
    "CallToActionType" TEXT NULL,
    "ContentTopic" TEXT NULL,
    "SentimentTone" TEXT NULL,
    "CaptionLength" INTEGER NOT NULL,
    "FeaturesResidentStory" INTEGER NOT NULL,
    "CampaignName" TEXT NULL,
    "IsBoosted" INTEGER NOT NULL,
    "BoostBudgetPhp" decimal(10,2) NULL,
    "Impressions" INTEGER NOT NULL,
    "Reach" INTEGER NOT NULL,
    "Likes" INTEGER NOT NULL,
    "Comments" INTEGER NOT NULL,
    "Shares" INTEGER NOT NULL,
    "Saves" INTEGER NOT NULL,
    "ClickThroughs" INTEGER NOT NULL,
    "VideoViews" INTEGER NULL,
    "EngagementRate" decimal(8,6) NOT NULL,
    "ProfileVisits" INTEGER NOT NULL,
    "DonationReferrals" INTEGER NOT NULL,
    "EstimatedDonationValuePhp" decimal(18,2) NOT NULL,
    "FollowerCountAtPost" INTEGER NOT NULL,
    "WatchTimeSeconds" INTEGER NULL,
    "AvgViewDurationSeconds" INTEGER NULL,
    "SubscriberCountAtPost" INTEGER NULL,
    "Forwards" INTEGER NULL
);
CREATE TABLE IF NOT EXISTS "Supporters" (
    "SupporterId" INTEGER NOT NULL CONSTRAINT "PK_Supporters" PRIMARY KEY AUTOINCREMENT,
    "SupporterType" TEXT NOT NULL,
    "DisplayName" TEXT NOT NULL,
    "OrganizationName" TEXT NULL,
    "FirstName" TEXT NULL,
    "LastName" TEXT NULL,
    "RelationshipType" TEXT NOT NULL,
    "Region" TEXT NULL,
    "Country" TEXT NULL,
    "Email" TEXT NULL,
    "Phone" TEXT NULL,
    "Status" TEXT NOT NULL,
    "FirstDonationDate" TEXT NULL,
    "AcquisitionChannel" TEXT NULL,
    "CreatedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "AspNetRoleClaims" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY AUTOINCREMENT,
    "RoleId" TEXT NOT NULL,
    "ClaimType" TEXT NULL,
    "ClaimValue" TEXT NULL,
    CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "AspNetUserClaims" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "ClaimType" TEXT NULL,
    "ClaimValue" TEXT NULL,
    CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "AspNetUserLogins" (
    "LoginProvider" TEXT NOT NULL,
    "ProviderKey" TEXT NOT NULL,
    "ProviderDisplayName" TEXT NULL,
    "UserId" TEXT NOT NULL,
    CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY ("LoginProvider", "ProviderKey"),
    CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "AspNetUserRoles" (
    "UserId" TEXT NOT NULL,
    "RoleId" TEXT NOT NULL,
    CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY ("UserId", "RoleId"),
    CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
INSERT INTO AspNetUserRoles VALUES('3677460e-f135-4c73-9af6-5e3ba8b68791','087e1a9a-6d6d-464b-b9c9-f39d6ae43991');
CREATE TABLE IF NOT EXISTS "AspNetUserTokens" (
    "UserId" TEXT NOT NULL,
    "LoginProvider" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Value" TEXT NULL,
    CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY ("UserId", "LoginProvider", "Name"),
    CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "PartnerAssignments" (
    "AssignmentId" INTEGER NOT NULL CONSTRAINT "PK_PartnerAssignments" PRIMARY KEY AUTOINCREMENT,
    "PartnerId" INTEGER NOT NULL,
    "SafehouseId" INTEGER NULL,
    "ProgramArea" TEXT NOT NULL,
    "AssignmentStart" TEXT NOT NULL,
    "AssignmentEnd" TEXT NULL,
    "ResponsibilityNotes" TEXT NULL,
    "IsPrimary" INTEGER NOT NULL,
    "Status" TEXT NOT NULL,
    CONSTRAINT "FK_PartnerAssignments_Partners_PartnerId" FOREIGN KEY ("PartnerId") REFERENCES "Partners" ("PartnerId") ON DELETE CASCADE,
    CONSTRAINT "FK_PartnerAssignments_Safehouses_SafehouseId" FOREIGN KEY ("SafehouseId") REFERENCES "Safehouses" ("SafehouseId") ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS "Residents" (
    "ResidentId" INTEGER NOT NULL CONSTRAINT "PK_Residents" PRIMARY KEY AUTOINCREMENT,
    "CaseControlNo" TEXT NOT NULL,
    "InternalCode" TEXT NOT NULL,
    "SafehouseId" INTEGER NOT NULL,
    "CaseStatus" TEXT NOT NULL,
    "Sex" TEXT NOT NULL,
    "DateOfBirth" TEXT NOT NULL,
    "BirthStatus" TEXT NULL,
    "PlaceOfBirth" TEXT NULL,
    "Religion" TEXT NULL,
    "CaseCategory" TEXT NOT NULL,
    "SubCatOrphaned" INTEGER NOT NULL,
    "SubCatTrafficked" INTEGER NOT NULL,
    "SubCatChildLabor" INTEGER NOT NULL,
    "SubCatPhysicalAbuse" INTEGER NOT NULL,
    "SubCatSexualAbuse" INTEGER NOT NULL,
    "SubCatOsaec" INTEGER NOT NULL,
    "SubCatCicl" INTEGER NOT NULL,
    "SubCatAtRisk" INTEGER NOT NULL,
    "SubCatStreetChild" INTEGER NOT NULL,
    "SubCatChildWithHiv" INTEGER NOT NULL,
    "IsPwd" INTEGER NOT NULL,
    "PwdType" TEXT NULL,
    "HasSpecialNeeds" INTEGER NOT NULL,
    "SpecialNeedsDiagnosis" TEXT NULL,
    "FamilyIs4ps" INTEGER NOT NULL,
    "FamilySoloParent" INTEGER NOT NULL,
    "FamilyIndigenous" INTEGER NOT NULL,
    "FamilyParentPwd" INTEGER NOT NULL,
    "FamilyInformalSettler" INTEGER NOT NULL,
    "DateOfAdmission" TEXT NOT NULL,
    "AgeUponAdmission" TEXT NULL,
    "PresentAge" TEXT NULL,
    "LengthOfStay" TEXT NULL,
    "ReferralSource" TEXT NULL,
    "ReferringAgencyPerson" TEXT NULL,
    "DateColbRegistered" TEXT NULL,
    "DateColbObtained" TEXT NULL,
    "AssignedSocialWorker" TEXT NULL,
    "InitialCaseAssessment" TEXT NULL,
    "DateCaseStudyPrepared" TEXT NULL,
    "ReintegrationType" TEXT NULL,
    "ReintegrationStatus" TEXT NULL,
    "InitialRiskLevel" TEXT NOT NULL,
    "CurrentRiskLevel" TEXT NOT NULL,
    "DateEnrolled" TEXT NOT NULL,
    "DateClosed" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "NotesRestricted" TEXT NULL,
    CONSTRAINT "FK_Residents_Safehouses_SafehouseId" FOREIGN KEY ("SafehouseId") REFERENCES "Safehouses" ("SafehouseId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "SafehouseMonthlyMetrics" (
    "MetricId" INTEGER NOT NULL CONSTRAINT "PK_SafehouseMonthlyMetrics" PRIMARY KEY AUTOINCREMENT,
    "SafehouseId" INTEGER NOT NULL,
    "MonthStart" TEXT NOT NULL,
    "MonthEnd" TEXT NOT NULL,
    "ActiveResidents" INTEGER NOT NULL,
    "AvgEducationProgress" decimal(5,2) NOT NULL,
    "AvgHealthScore" decimal(3,2) NOT NULL,
    "ProcessRecordingCount" INTEGER NOT NULL,
    "HomeVisitationCount" INTEGER NOT NULL,
    "IncidentCount" INTEGER NOT NULL,
    "Notes" TEXT NULL,
    CONSTRAINT "FK_SafehouseMonthlyMetrics_Safehouses_SafehouseId" FOREIGN KEY ("SafehouseId") REFERENCES "Safehouses" ("SafehouseId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "Donations" (
    "DonationId" INTEGER NOT NULL CONSTRAINT "PK_Donations" PRIMARY KEY AUTOINCREMENT,
    "SupporterId" INTEGER NOT NULL,
    "DonationType" TEXT NOT NULL,
    "DonationDate" TEXT NOT NULL,
    "ChannelSource" TEXT NOT NULL,
    "CurrencyCode" TEXT NULL,
    "Amount" decimal(18,2) NULL,
    "EstimatedValue" decimal(18,2) NULL,
    "ImpactUnit" TEXT NULL,
    "IsRecurring" INTEGER NOT NULL,
    "CampaignName" TEXT NULL,
    "Notes" TEXT NULL,
    "CreatedByPartnerId" INTEGER NULL,
    "ReferralPostId" INTEGER NULL,
    CONSTRAINT "FK_Donations_Supporters_SupporterId" FOREIGN KEY ("SupporterId") REFERENCES "Supporters" ("SupporterId") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "EducationRecords" (
    "EducationRecordId" INTEGER NOT NULL CONSTRAINT "PK_EducationRecords" PRIMARY KEY AUTOINCREMENT,
    "ResidentId" INTEGER NOT NULL,
    "RecordDate" TEXT NOT NULL,
    "EducationLevel" TEXT NULL,
    "SchoolName" TEXT NULL,
    "EnrollmentStatus" TEXT NULL,
    "AttendanceRate" decimal(5,4) NULL,
    "ProgressPercent" decimal(5,2) NULL,
    "CompletionStatus" TEXT NULL,
    "Notes" TEXT NULL,
    CONSTRAINT "FK_EducationRecords_Residents_ResidentId" FOREIGN KEY ("ResidentId") REFERENCES "Residents" ("ResidentId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "HealthWellbeingRecords" (
    "HealthRecordId" INTEGER NOT NULL CONSTRAINT "PK_HealthWellbeingRecords" PRIMARY KEY AUTOINCREMENT,
    "ResidentId" INTEGER NOT NULL,
    "RecordDate" TEXT NOT NULL,
    "GeneralHealthScore" decimal(3,2) NULL,
    "NutritionScore" decimal(3,2) NULL,
    "SleepQualityScore" decimal(3,2) NULL,
    "EnergyLevelScore" decimal(3,2) NULL,
    "HeightCm" decimal(5,2) NULL,
    "WeightKg" decimal(5,2) NULL,
    "Bmi" decimal(4,2) NULL,
    "MedicalCheckupDone" INTEGER NOT NULL,
    "DentalCheckupDone" INTEGER NOT NULL,
    "PsychologicalCheckupDone" INTEGER NOT NULL,
    "Notes" TEXT NULL,
    CONSTRAINT "FK_HealthWellbeingRecords_Residents_ResidentId" FOREIGN KEY ("ResidentId") REFERENCES "Residents" ("ResidentId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "HomeVisitations" (
    "VisitationId" INTEGER NOT NULL CONSTRAINT "PK_HomeVisitations" PRIMARY KEY AUTOINCREMENT,
    "ResidentId" INTEGER NOT NULL,
    "VisitDate" TEXT NOT NULL,
    "SocialWorker" TEXT NOT NULL,
    "VisitType" TEXT NOT NULL,
    "LocationVisited" TEXT NULL,
    "FamilyMembersPresent" TEXT NULL,
    "Purpose" TEXT NULL,
    "Observations" TEXT NULL,
    "FamilyCooperationLevel" TEXT NULL,
    "SafetyConcernsNoted" INTEGER NOT NULL,
    "FollowUpNeeded" INTEGER NOT NULL,
    "FollowUpNotes" TEXT NULL,
    "VisitOutcome" TEXT NULL,
    CONSTRAINT "FK_HomeVisitations_Residents_ResidentId" FOREIGN KEY ("ResidentId") REFERENCES "Residents" ("ResidentId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "IncidentReports" (
    "IncidentId" INTEGER NOT NULL CONSTRAINT "PK_IncidentReports" PRIMARY KEY AUTOINCREMENT,
    "ResidentId" INTEGER NOT NULL,
    "SafehouseId" INTEGER NOT NULL,
    "IncidentDate" TEXT NOT NULL,
    "IncidentType" TEXT NOT NULL,
    "Severity" TEXT NOT NULL,
    "Description" TEXT NULL,
    "ResponseTaken" TEXT NULL,
    "Resolved" INTEGER NOT NULL,
    "ResolutionDate" TEXT NULL,
    "ReportedBy" TEXT NULL,
    "FollowUpRequired" INTEGER NOT NULL,
    CONSTRAINT "FK_IncidentReports_Residents_ResidentId" FOREIGN KEY ("ResidentId") REFERENCES "Residents" ("ResidentId") ON DELETE RESTRICT,
    CONSTRAINT "FK_IncidentReports_Safehouses_SafehouseId" FOREIGN KEY ("SafehouseId") REFERENCES "Safehouses" ("SafehouseId") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "InterventionPlans" (
    "PlanId" INTEGER NOT NULL CONSTRAINT "PK_InterventionPlans" PRIMARY KEY AUTOINCREMENT,
    "ResidentId" INTEGER NOT NULL,
    "PlanCategory" TEXT NOT NULL,
    "PlanDescription" TEXT NULL,
    "ServicesProvided" TEXT NULL,
    "TargetValue" decimal(10,2) NULL,
    "TargetDate" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "CaseConferenceDate" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_InterventionPlans_Residents_ResidentId" FOREIGN KEY ("ResidentId") REFERENCES "Residents" ("ResidentId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "ProcessRecordings" (
    "RecordingId" INTEGER NOT NULL CONSTRAINT "PK_ProcessRecordings" PRIMARY KEY AUTOINCREMENT,
    "ResidentId" INTEGER NOT NULL,
    "SessionDate" TEXT NOT NULL,
    "SocialWorker" TEXT NOT NULL,
    "SessionType" TEXT NOT NULL,
    "SessionDurationMinutes" INTEGER NULL,
    "EmotionalStateObserved" TEXT NOT NULL,
    "EmotionalStateEnd" TEXT NULL,
    "SessionNarrative" TEXT NULL,
    "InterventionsApplied" TEXT NULL,
    "FollowUpActions" TEXT NULL,
    "ProgressNoted" INTEGER NOT NULL,
    "ConcernsFlagged" INTEGER NOT NULL,
    "ReferralMade" INTEGER NOT NULL,
    "NotesRestricted" TEXT NULL,
    CONSTRAINT "FK_ProcessRecordings_Residents_ResidentId" FOREIGN KEY ("ResidentId") REFERENCES "Residents" ("ResidentId") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "DonationAllocations" (
    "AllocationId" INTEGER NOT NULL CONSTRAINT "PK_DonationAllocations" PRIMARY KEY AUTOINCREMENT,
    "DonationId" INTEGER NOT NULL,
    "SafehouseId" INTEGER NOT NULL,
    "ProgramArea" TEXT NOT NULL,
    "AmountAllocated" decimal(18,2) NOT NULL,
    "AllocationDate" TEXT NOT NULL,
    "AllocationNotes" TEXT NULL,
    CONSTRAINT "FK_DonationAllocations_Donations_DonationId" FOREIGN KEY ("DonationId") REFERENCES "Donations" ("DonationId") ON DELETE RESTRICT,
    CONSTRAINT "FK_DonationAllocations_Safehouses_SafehouseId" FOREIGN KEY ("SafehouseId") REFERENCES "Safehouses" ("SafehouseId") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "InKindDonationItems" (
    "ItemId" INTEGER NOT NULL CONSTRAINT "PK_InKindDonationItems" PRIMARY KEY AUTOINCREMENT,
    "DonationId" INTEGER NOT NULL,
    "ItemName" TEXT NOT NULL,
    "ItemCategory" TEXT NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "UnitOfMeasure" TEXT NOT NULL,
    "EstimatedUnitValue" decimal(18,2) NOT NULL,
    "IntendedUse" TEXT NULL,
    "ReceivedCondition" TEXT NULL,
    CONSTRAINT "FK_InKindDonationItems_Donations_DonationId" FOREIGN KEY ("DonationId") REFERENCES "Donations" ("DonationId") ON DELETE CASCADE
);
INSERT INTO sqlite_sequence VALUES('Safehouses',9);
INSERT INTO sqlite_sequence VALUES('Partners',30);
CREATE INDEX "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");
CREATE UNIQUE INDEX "RoleNameIndex" ON "AspNetRoles" ("NormalizedName");
CREATE INDEX "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");
CREATE INDEX "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");
CREATE INDEX "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" ("RoleId");
CREATE INDEX "EmailIndex" ON "AspNetUsers" ("NormalizedEmail");
CREATE UNIQUE INDEX "UserNameIndex" ON "AspNetUsers" ("NormalizedUserName");
CREATE INDEX "IX_DonationAllocations_DonationId" ON "DonationAllocations" ("DonationId");
CREATE INDEX "IX_DonationAllocations_SafehouseId" ON "DonationAllocations" ("SafehouseId");
CREATE INDEX "IX_Donations_SupporterId" ON "Donations" ("SupporterId");
CREATE INDEX "IX_EducationRecords_ResidentId" ON "EducationRecords" ("ResidentId");
CREATE INDEX "IX_HealthWellbeingRecords_ResidentId" ON "HealthWellbeingRecords" ("ResidentId");
CREATE INDEX "IX_HomeVisitations_ResidentId" ON "HomeVisitations" ("ResidentId");
CREATE INDEX "IX_IncidentReports_ResidentId" ON "IncidentReports" ("ResidentId");
CREATE INDEX "IX_IncidentReports_SafehouseId" ON "IncidentReports" ("SafehouseId");
CREATE INDEX "IX_InKindDonationItems_DonationId" ON "InKindDonationItems" ("DonationId");
CREATE INDEX "IX_InterventionPlans_ResidentId" ON "InterventionPlans" ("ResidentId");
CREATE INDEX "IX_PartnerAssignments_PartnerId" ON "PartnerAssignments" ("PartnerId");
CREATE INDEX "IX_PartnerAssignments_SafehouseId" ON "PartnerAssignments" ("SafehouseId");
CREATE INDEX "IX_ProcessRecordings_ResidentId" ON "ProcessRecordings" ("ResidentId");
CREATE INDEX "IX_Residents_SafehouseId" ON "Residents" ("SafehouseId");
CREATE INDEX "IX_SafehouseMonthlyMetrics_SafehouseId" ON "SafehouseMonthlyMetrics" ("SafehouseId");
COMMIT;

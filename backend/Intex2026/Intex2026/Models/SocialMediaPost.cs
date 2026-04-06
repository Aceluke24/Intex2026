using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Intex2026.Models;

public class SocialMediaPost
{
    [Key]
    public int PostId { get; set; }
    public string Platform { get; set; } = string.Empty; // Facebook | Instagram | Twitter | TikTok | LinkedIn | YouTube | WhatsApp
    public string? PlatformPostId { get; set; }
    public string? PostUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? DayOfWeek { get; set; }
    public int? PostHour { get; set; }
    public string PostType { get; set; } = string.Empty; // ImpactStory | Campaign | EventPromotion | ThankYou | EducationalContent | FundraisingAppeal
    public string? MediaType { get; set; } // Photo | Video | Carousel | Text | Reel
    public string? Caption { get; set; }
    public string? Hashtags { get; set; }
    public int NumHashtags { get; set; }
    public int MentionsCount { get; set; }
    public bool HasCallToAction { get; set; }
    public string? CallToActionType { get; set; } // DonateNow | LearnMore | ShareStory | SignUp
    public string? ContentTopic { get; set; }
    public string? SentimentTone { get; set; } // Hopeful | Urgent | Celebratory | Informative | Grateful | Emotional
    public int CaptionLength { get; set; }
    public bool FeaturesResidentStory { get; set; }
    public string? CampaignName { get; set; }
    public bool IsBoosted { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? BoostBudgetPhp { get; set; }

    public int Impressions { get; set; }
    public int Reach { get; set; }
    public int Likes { get; set; }
    public int Comments { get; set; }
    public int Shares { get; set; }
    public int Saves { get; set; }
    public int ClickThroughs { get; set; }
    public int? VideoViews { get; set; }

    [Column(TypeName = "decimal(8,6)")]
    public decimal EngagementRate { get; set; }

    public int ProfileVisits { get; set; }
    public int DonationReferrals { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EstimatedDonationValuePhp { get; set; }

    public int FollowerCountAtPost { get; set; }
    public int? WatchTimeSeconds { get; set; }           // YouTube only
    public int? AvgViewDurationSeconds { get; set; }    // YouTube only
    public int? SubscriberCountAtPost { get; set; }     // YouTube only
    public int? Forwards { get; set; }                   // WhatsApp only
}

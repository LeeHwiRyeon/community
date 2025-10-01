using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NotificationService.Models;

[Table("notifications")]
public class Notification
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Type { get; set; } = string.Empty; // post_like, comment_reply, mention, system, etc.

    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "TEXT")]
    public string Message { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ActionUrl { get; set; }

    [MaxLength(255)]
    public string? ImageUrl { get; set; }

    public int? RelatedId { get; set; } // ID of related post, comment, etc.

    [MaxLength(50)]
    public string? RelatedType { get; set; } // post, comment, user, etc.

    public bool IsRead { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public int Priority { get; set; } = 1; // 1=low, 2=medium, 3=high, 4=urgent

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("notification_templates")]
public class NotificationTemplate
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string TitleTemplate { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "TEXT")]
    public string MessageTemplate { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ActionUrlTemplate { get; set; }

    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("notification_settings")]
public class NotificationSettings
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public bool EmailEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public bool InAppEnabled { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("push_tokens")]
public class PushToken
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Token { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Platform { get; set; } = string.Empty; // ios, android, web

    [MaxLength(100)]
    public string? DeviceId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

// External User model (from User Service)
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

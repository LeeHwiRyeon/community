using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UserService.Models;

[Table("users")]
public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(500)]
    public string? Bio { get; set; }

    [MaxLength(255)]
    public string? AvatarUrl { get; set; }

    [MaxLength(50)]
    public string Role { get; set; } = "User";

    public bool IsActive { get; set; } = true;

    public bool IsEmailVerified { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
    public virtual ICollection<OAuthToken> OAuthTokens { get; set; } = new List<OAuthToken>();
}

[Table("user_sessions")]
public class UserSession
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Token { get; set; } = string.Empty;

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation property
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("oauth_tokens")]
public class OAuthToken
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Provider { get; set; } = string.Empty; // Google, GitHub, etc.

    [Required]
    [MaxLength(500)]
    public string AccessToken { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? RefreshToken { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}


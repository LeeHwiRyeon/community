using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UserService.Models
{
    public class OAuthToken
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Provider { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string AccessToken { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? RefreshToken { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
    }
}


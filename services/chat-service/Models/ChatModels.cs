using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChatService.Models;

[Table("chat_rooms")]
public class ChatRoom
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string Type { get; set; } = "public"; // public, private, direct

    [MaxLength(7)]
    public string? Color { get; set; }

    [MaxLength(255)]
    public string? AvatarUrl { get; set; }

    public int CreatedBy { get; set; }
    public bool IsActive { get; set; } = true;
    public int MaxMembers { get; set; } = 0; // 0 = unlimited

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ChatRoomMember> Members { get; set; } = new List<ChatRoomMember>();
}

[Table("chat_messages")]
public class ChatMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RoomId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [Column(TypeName = "TEXT")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? MessageType { get; set; } = "text"; // text, image, file, emoji, system

    [MaxLength(500)]
    public string? FileUrl { get; set; }

    [MaxLength(100)]
    public string? FileName { get; set; }

    public long? FileSize { get; set; }

    [MaxLength(100)]
    public string? MimeType { get; set; }

    public int? ReplyToId { get; set; } // For message replies

    public bool IsEdited { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public int ReactionCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoomId")]
    public virtual ChatRoom Room { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("ReplyToId")]
    public virtual ChatMessage? ReplyTo { get; set; }

    public virtual ICollection<ChatMessage> Replies { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ChatReaction> Reactions { get; set; } = new List<ChatReaction>();
}

[Table("chat_room_members")]
public class ChatRoomMember
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RoomId { get; set; }

    [Required]
    public int UserId { get; set; }

    [MaxLength(50)]
    public string Role { get; set; } = "member"; // admin, moderator, member

    public bool IsActive { get; set; } = true;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReadAt { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public virtual ChatRoom Room { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("chat_reactions")]
public class ChatReaction
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MessageId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(10)]
    public string Emoji { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("MessageId")]
    public virtual ChatMessage Message { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("user_online_status")]
public class UserOnlineStatus
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "online"; // online, away, busy, offline

    [MaxLength(100)]
    public string? CustomStatus { get; set; }

    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

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

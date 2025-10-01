using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ContentService.Models;

[Table("posts")]
public class Post
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "TEXT")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Summary { get; set; }

    [Required]
    public int AuthorId { get; set; }

    [Required]
    public int BoardId { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; }

    [MaxLength(1000)]
    public string? Tags { get; set; } // JSON array as string

    [MaxLength(255)]
    public string? FeaturedImageUrl { get; set; }

    public bool IsPublished { get; set; } = true;
    public bool IsPinned { get; set; } = false;
    public bool IsLocked { get; set; } = false;
    public bool AllowComments { get; set; } = true;

    public int ViewCount { get; set; } = 0;
    public int LikeCount { get; set; } = 0;
    public int DislikeCount { get; set; } = 0;
    public int CommentCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }

    // Navigation properties
    [ForeignKey("AuthorId")]
    public virtual User Author { get; set; } = null!;

    [ForeignKey("BoardId")]
    public virtual Board Board { get; set; } = null!;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
    public virtual ICollection<PostView> Views { get; set; } = new List<PostView>();
    public virtual ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
    public virtual ICollection<PostAttachment> Attachments { get; set; } = new List<PostAttachment>();
}

[Table("boards")]
public class Board
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Icon { get; set; }

    [MaxLength(7)]
    public string? Color { get; set; } // Hex color

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
}

[Table("comments")]
public class Comment
{
    [Key]
    public int Id { get; set; }

    [Required]
    [Column(TypeName = "TEXT")]
    public string Content { get; set; } = string.Empty;

    [Required]
    public int PostId { get; set; }

    [Required]
    public int AuthorId { get; set; }

    public int? ParentId { get; set; } // For nested comments

    public bool IsDeleted { get; set; } = false;
    public int LikeCount { get; set; } = 0;
    public int DislikeCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PostId")]
    public virtual Post Post { get; set; } = null!;

    [ForeignKey("AuthorId")]
    public virtual User Author { get; set; } = null!;

    [ForeignKey("ParentId")]
    public virtual Comment? Parent { get; set; }

    public virtual ICollection<Comment> Replies { get; set; } = new List<Comment>();
    public virtual ICollection<CommentLike> Likes { get; set; } = new List<CommentLike>();
}

[Table("post_likes")]
public class PostLike
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PostId { get; set; }

    [Required]
    public int UserId { get; set; }

    public bool IsLike { get; set; } = true; // true = like, false = dislike

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PostId")]
    public virtual Post Post { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("comment_likes")]
public class CommentLike
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CommentId { get; set; }

    [Required]
    public int UserId { get; set; }

    public bool IsLike { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CommentId")]
    public virtual Comment Comment { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("post_views")]
public class PostView
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PostId { get; set; }

    [Required]
    public int UserId { get; set; }

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PostId")]
    public virtual Post Post { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

[Table("tags")]
public class Tag
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    [MaxLength(7)]
    public string? Color { get; set; }

    public int UsageCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
}

[Table("post_tags")]
public class PostTag
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PostId { get; set; }

    [Required]
    public int TagId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PostId")]
    public virtual Post Post { get; set; } = null!;

    [ForeignKey("TagId")]
    public virtual Tag Tag { get; set; } = null!;
}

[Table("post_attachments")]
public class PostAttachment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PostId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FileUrl { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? MimeType { get; set; }

    public long FileSize { get; set; } = 0;

    [MaxLength(50)]
    public string? FileType { get; set; } // image, video, document, etc.

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PostId")]
    public virtual Post Post { get; set; } = null!;
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


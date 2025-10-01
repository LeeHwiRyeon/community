using System.ComponentModel.DataAnnotations;

namespace ContentService.DTOs;

// 게시물 생성 요청 DTO
public class CreatePostRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(10000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Summary { get; set; }

    [Required]
    public int BoardId { get; set; }

    [StringLength(50)]
    public string? Category { get; set; }

    public List<string>? Tags { get; set; }

    [StringLength(255)]
    public string? FeaturedImageUrl { get; set; }

    public bool IsPublished { get; set; } = true;
    public bool AllowComments { get; set; } = true;
    public DateTime? ScheduledAt { get; set; }
}

// 게시물 업데이트 요청 DTO
public class UpdatePostRequest
{
    [StringLength(200, MinimumLength = 1)]
    public string? Title { get; set; }

    [StringLength(10000, MinimumLength = 1)]
    public string? Content { get; set; }

    [StringLength(500)]
    public string? Summary { get; set; }

    public int? BoardId { get; set; }

    [StringLength(50)]
    public string? Category { get; set; }

    public List<string>? Tags { get; set; }

    [StringLength(255)]
    public string? FeaturedImageUrl { get; set; }

    public bool? IsPublished { get; set; }
    public bool? AllowComments { get; set; }
    public DateTime? ScheduledAt { get; set; }
}

// 댓글 생성 요청 DTO
public class CreateCommentRequest
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    [Required]
    public int PostId { get; set; }

    public int? ParentId { get; set; }
}

// 댓글 업데이트 요청 DTO
public class UpdateCommentRequest
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}

// 게시물 응답 DTO
public class PostResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatar { get; set; }
    public int BoardId { get; set; }
    public string BoardName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? FeaturedImageUrl { get; set; }
    public bool IsPublished { get; set; }
    public bool IsPinned { get; set; }
    public bool IsLocked { get; set; }
    public bool AllowComments { get; set; }
    public int ViewCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public int CommentCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public bool IsLiked { get; set; }
    public bool IsDisliked { get; set; }
    public List<CommentResponse> Comments { get; set; } = new();
    public List<PostAttachmentResponse> Attachments { get; set; } = new();
}

// 댓글 응답 DTO
public class CommentResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int PostId { get; set; }
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatar { get; set; }
    public int? ParentId { get; set; }
    public bool IsDeleted { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsLiked { get; set; }
    public bool IsDisliked { get; set; }
    public List<CommentResponse> Replies { get; set; } = new();
}

// 게시판 응답 DTO
public class BoardResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public int PostCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// 태그 응답 DTO
public class TagResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public int UsageCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

// 첨부파일 응답 DTO
public class PostAttachmentResponse
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? MimeType { get; set; }
    public long FileSize { get; set; }
    public string? FileType { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

// 검색 요청 DTO
public class SearchRequest
{
    [StringLength(100)]
    public string? Query { get; set; }

    public int? BoardId { get; set; }
    public string? Category { get; set; }
    public List<string>? Tags { get; set; }
    public int? AuthorId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string SortBy { get; set; } = "created"; // created, updated, views, likes, comments
    public string SortOrder { get; set; } = "desc"; // asc, desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool IncludeComments { get; set; } = false;
}

// 검색 응답 DTO
public class SearchResponse
{
    public List<PostResponse> Posts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public List<TagResponse> SuggestedTags { get; set; } = new();
    public List<BoardResponse> SuggestedBoards { get; set; } = new();
}

// 좋아요/싫어요 요청 DTO
public class LikeRequest
{
    [Required]
    public int TargetId { get; set; } // PostId or CommentId

    [Required]
    public string TargetType { get; set; } = string.Empty; // "post" or "comment"

    [Required]
    public bool IsLike { get; set; } // true = like, false = dislike
}

// 조회수 증가 요청 DTO
public class ViewRequest
{
    [Required]
    public int PostId { get; set; }

    [StringLength(45)]
    public string? IpAddress { get; set; }
}

// 통계 응답 DTO
public class ContentStatsResponse
{
    public int TotalPosts { get; set; }
    public int TotalComments { get; set; }
    public int TotalViews { get; set; }
    public int TotalLikes { get; set; }
    public int TotalDislikes { get; set; }
    public int TotalUsers { get; set; }
    public int TotalBoards { get; set; }
    public int TotalTags { get; set; }
    public List<PostResponse> PopularPosts { get; set; } = new();
    public List<TagResponse> PopularTags { get; set; } = new();
    public List<BoardResponse> PopularBoards { get; set; } = new();
}

// API 응답 래퍼 DTO
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ApiResponse<T> SuccessResult(T data, string message = "Success")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> ErrorResult(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }
}


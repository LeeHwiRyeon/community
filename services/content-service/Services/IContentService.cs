using ContentService.DTOs;

namespace ContentService.Services;

public interface IContentService
{
    // 게시물 관련
    Task<ApiResponse<PostResponse>> CreatePostAsync(CreatePostRequest request, int authorId);
    Task<ApiResponse<PostResponse>> GetPostByIdAsync(int id, int? userId = null);
    Task<ApiResponse<List<PostResponse>>> GetPostsAsync(int page = 1, int pageSize = 20, int? boardId = null, int? authorId = null);
    Task<ApiResponse<PostResponse>> UpdatePostAsync(int id, UpdatePostRequest request, int userId);
    Task<ApiResponse<bool>> DeletePostAsync(int id, int userId);
    Task<ApiResponse<bool>> PinPostAsync(int id, int userId);
    Task<ApiResponse<bool>> LockPostAsync(int id, int userId);

    // 댓글 관련
    Task<ApiResponse<CommentResponse>> CreateCommentAsync(CreateCommentRequest request, int authorId);
    Task<ApiResponse<CommentResponse>> GetCommentByIdAsync(int id);
    Task<ApiResponse<List<CommentResponse>>> GetCommentsByPostIdAsync(int postId, int? userId = null);
    Task<ApiResponse<CommentResponse>> UpdateCommentAsync(int id, UpdateCommentRequest request, int userId);
    Task<ApiResponse<bool>> DeleteCommentAsync(int id, int userId);

    // 좋아요/싫어요 관련
    Task<ApiResponse<bool>> LikePostAsync(int postId, int userId, bool isLike);
    Task<ApiResponse<bool>> LikeCommentAsync(int commentId, int userId, bool isLike);
    Task<ApiResponse<bool>> RemoveLikeAsync(int targetId, string targetType, int userId);

    // 조회수 관련
    Task<ApiResponse<bool>> IncrementViewCountAsync(int postId, int? userId = null, string? ipAddress = null);

    // 검색 관련
    Task<ApiResponse<SearchResponse>> SearchPostsAsync(SearchRequest request, int? userId = null);
    Task<ApiResponse<List<TagResponse>>> SearchTagsAsync(string query, int limit = 10);
    Task<ApiResponse<List<BoardResponse>>> GetBoardsAsync();

    // 통계 관련
    Task<ApiResponse<ContentStatsResponse>> GetContentStatsAsync();
    Task<ApiResponse<List<PostResponse>>> GetPopularPostsAsync(int limit = 10);
    Task<ApiResponse<List<TagResponse>>> GetPopularTagsAsync(int limit = 10);

    // 첨부파일 관련
    Task<ApiResponse<PostAttachmentResponse>> AddAttachmentAsync(int postId, string fileName, string fileUrl, string? mimeType, long fileSize, string? fileType);
    Task<ApiResponse<bool>> RemoveAttachmentAsync(int attachmentId, int userId);
    Task<ApiResponse<List<PostAttachmentResponse>>> GetAttachmentsByPostIdAsync(int postId);
}


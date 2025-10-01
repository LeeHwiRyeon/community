using Microsoft.EntityFrameworkCore;
using ContentService.Data;
using ContentService.DTOs;
using ContentService.Models;
using AutoMapper;
using StackExchange.Redis;
using System.Text.Json;

namespace ContentService.Services;

public class ContentService : IContentService
{
    private readonly ContentDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheService _cacheService;
    private readonly ILogger<ContentService> _logger;

    public ContentService(
        ContentDbContext context,
        IMapper mapper,
        ICacheService cacheService,
        ILogger<ContentService> logger)
    {
        _context = context;
        _mapper = mapper;
        _cacheService = cacheService;
        _logger = logger;
    }

    #region Post Methods

    public async Task<ApiResponse<PostResponse>> CreatePostAsync(CreatePostRequest request, int authorId)
    {
        try
        {
            var post = new Post
            {
                Title = request.Title,
                Content = request.Content,
                Summary = request.Summary,
                AuthorId = authorId,
                BoardId = request.BoardId,
                Category = request.Category,
                Tags = request.Tags != null ? JsonSerializer.Serialize(request.Tags) : null,
                FeaturedImageUrl = request.FeaturedImageUrl,
                IsPublished = request.IsPublished,
                AllowComments = request.AllowComments,
                ScheduledAt = request.ScheduledAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                PublishedAt = request.IsPublished ? DateTime.UtcNow : null
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // 태그 처리
            if (request.Tags != null && request.Tags.Any())
            {
                await ProcessPostTagsAsync(post.Id, request.Tags);
            }

            // 캐시 무효화
            await _cacheService.RemoveAsync("posts:list");
            await _cacheService.RemoveAsync($"board:{request.BoardId}:posts");

            var postResponse = await GetPostResponseAsync(post.Id, authorId);
            return ApiResponse<PostResponse>.SuccessResult(postResponse, "Post created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post for author {AuthorId}", authorId);
            return ApiResponse<PostResponse>.ErrorResult($"Error creating post: {ex.Message}");
        }
    }

    public async Task<ApiResponse<PostResponse>> GetPostByIdAsync(int id, int? userId = null)
    {
        try
        {
            var cacheKey = $"post:{id}:{userId ?? 0}";
            var cachedPost = await _cacheService.GetAsync<PostResponse>(cacheKey);
            if (cachedPost != null)
            {
                return ApiResponse<PostResponse>.SuccessResult(cachedPost);
            }

            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Board)
                .Include(p => p.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.Author)
                .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
                .Include(p => p.Attachments.Where(a => a.IsActive))
                .FirstOrDefaultAsync(p => p.Id == id && p.IsPublished);

            if (post == null)
            {
                return ApiResponse<PostResponse>.ErrorResult("Post not found");
            }

            var postResponse = await GetPostResponseAsync(post.Id, userId);

            // 캐시에 저장 (5분)
            await _cacheService.SetAsync(cacheKey, postResponse, TimeSpan.FromMinutes(5));

            return ApiResponse<PostResponse>.SuccessResult(postResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving post {PostId}", id);
            return ApiResponse<PostResponse>.ErrorResult($"Error retrieving post: {ex.Message}");
        }
    }

    public async Task<ApiResponse<List<PostResponse>>> GetPostsAsync(int page = 1, int pageSize = 20, int? boardId = null, int? authorId = null)
    {
        try
        {
            var cacheKey = $"posts:page:{page}:size:{pageSize}:board:{boardId}:author:{authorId}";
            var cachedPosts = await _cacheService.GetAsync<List<PostResponse>>(cacheKey);
            if (cachedPosts != null)
            {
                return ApiResponse<List<PostResponse>>.SuccessResult(cachedPosts);
            }

            var query = _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Board)
                .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
                .Where(p => p.IsPublished);

            if (boardId.HasValue)
                query = query.Where(p => p.BoardId == boardId.Value);

            if (authorId.HasValue)
                query = query.Where(p => p.AuthorId == authorId.Value);

            var posts = await query
                .OrderByDescending(p => p.IsPinned)
                .ThenByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var postResponses = new List<PostResponse>();
            foreach (var post in posts)
            {
                var postResponse = await GetPostResponseAsync(post.Id, null);
                postResponses.Add(postResponse);
            }

            // 캐시에 저장 (2분)
            await _cacheService.SetAsync(cacheKey, postResponses, TimeSpan.FromMinutes(2));

            return ApiResponse<List<PostResponse>>.SuccessResult(postResponses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving posts");
            return ApiResponse<List<PostResponse>>.ErrorResult($"Error retrieving posts: {ex.Message}");
        }
    }

    public async Task<ApiResponse<PostResponse>> UpdatePostAsync(int id, UpdatePostRequest request, int userId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null)
            {
                return ApiResponse<PostResponse>.ErrorResult("Post not found");
            }

            if (post.AuthorId != userId)
            {
                return ApiResponse<PostResponse>.ErrorResult("Unauthorized to update this post");
            }

            // 업데이트할 필드만 변경
            if (!string.IsNullOrEmpty(request.Title))
                post.Title = request.Title;
            if (!string.IsNullOrEmpty(request.Content))
                post.Content = request.Content;
            if (request.Summary != null)
                post.Summary = request.Summary;
            if (request.BoardId.HasValue)
                post.BoardId = request.BoardId.Value;
            if (request.Category != null)
                post.Category = request.Category;
            if (request.Tags != null)
                post.Tags = JsonSerializer.Serialize(request.Tags);
            if (request.FeaturedImageUrl != null)
                post.FeaturedImageUrl = request.FeaturedImageUrl;
            if (request.IsPublished.HasValue)
            {
                post.IsPublished = request.IsPublished.Value;
                if (request.IsPublished.Value && post.PublishedAt == null)
                    post.PublishedAt = DateTime.UtcNow;
            }
            if (request.AllowComments.HasValue)
                post.AllowComments = request.AllowComments.Value;
            if (request.ScheduledAt.HasValue)
                post.ScheduledAt = request.ScheduledAt.Value;

            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 태그 처리
            if (request.Tags != null)
            {
                await ProcessPostTagsAsync(post.Id, request.Tags);
            }

            // 캐시 무효화
            await _cacheService.RemoveAsync($"post:{id}:*");
            await _cacheService.RemoveAsync("posts:list");

            var postResponse = await GetPostResponseAsync(post.Id, userId);
            return ApiResponse<PostResponse>.SuccessResult(postResponse, "Post updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating post {PostId}", id);
            return ApiResponse<PostResponse>.ErrorResult($"Error updating post: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> DeletePostAsync(int id, int userId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null)
            {
                return ApiResponse<bool>.ErrorResult("Post not found");
            }

            if (post.AuthorId != userId)
            {
                return ApiResponse<bool>.ErrorResult("Unauthorized to delete this post");
            }

            // 소프트 삭제
            post.IsPublished = false;
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 캐시 무효화
            await _cacheService.RemoveAsync($"post:{id}:*");
            await _cacheService.RemoveAsync("posts:list");

            return ApiResponse<bool>.SuccessResult(true, "Post deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {PostId}", id);
            return ApiResponse<bool>.ErrorResult($"Error deleting post: {ex.Message}");
        }
    }

    #endregion

    #region Comment Methods

    public async Task<ApiResponse<CommentResponse>> CreateCommentAsync(CreateCommentRequest request, int authorId)
    {
        try
        {
            var post = await _context.Posts.FindAsync(request.PostId);
            if (post == null)
            {
                return ApiResponse<CommentResponse>.ErrorResult("Post not found");
            }

            if (!post.AllowComments)
            {
                return ApiResponse<CommentResponse>.ErrorResult("Comments are not allowed on this post");
            }

            var comment = new Comment
            {
                Content = request.Content,
                PostId = request.PostId,
                AuthorId = authorId,
                ParentId = request.ParentId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // 댓글 수 증가
            post.CommentCount++;
            await _context.SaveChangesAsync();

            // 캐시 무효화
            await _cacheService.RemoveAsync($"post:{request.PostId}:*");
            await _cacheService.RemoveAsync($"comments:post:{request.PostId}");

            var commentResponse = await GetCommentResponseAsync(comment.Id, authorId);
            return ApiResponse<CommentResponse>.SuccessResult(commentResponse, "Comment created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment for post {PostId}", request.PostId);
            return ApiResponse<CommentResponse>.ErrorResult($"Error creating comment: {ex.Message}");
        }
    }

    public async Task<ApiResponse<CommentResponse>> GetCommentByIdAsync(int id)
    {
        try
        {
            var comment = await _context.Comments
                .Include(c => c.Author)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

            if (comment == null)
            {
                return ApiResponse<CommentResponse>.ErrorResult("Comment not found");
            }

            var commentResponse = await GetCommentResponseAsync(comment.Id, null);
            return ApiResponse<CommentResponse>.SuccessResult(commentResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comment {CommentId}", id);
            return ApiResponse<CommentResponse>.ErrorResult($"Error retrieving comment: {ex.Message}");
        }
    }

    public async Task<ApiResponse<List<CommentResponse>>> GetCommentsByPostIdAsync(int postId, int? userId = null)
    {
        try
        {
            var cacheKey = $"comments:post:{postId}:user:{userId ?? 0}";
            var cachedComments = await _cacheService.GetAsync<List<CommentResponse>>(cacheKey);
            if (cachedComments != null)
            {
                return ApiResponse<List<CommentResponse>>.SuccessResult(cachedComments);
            }

            var comments = await _context.Comments
                .Include(c => c.Author)
                .Include(c => c.Replies.Where(r => !r.IsDeleted))
                .ThenInclude(r => r.Author)
                .Where(c => c.PostId == postId && !c.IsDeleted && c.ParentId == null)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            var commentResponses = new List<CommentResponse>();
            foreach (var comment in comments)
            {
                var commentResponse = await GetCommentResponseAsync(comment.Id, userId);
                commentResponses.Add(commentResponse);
            }

            // 캐시에 저장 (5분)
            await _cacheService.SetAsync(cacheKey, commentResponses, TimeSpan.FromMinutes(5));

            return ApiResponse<List<CommentResponse>>.SuccessResult(commentResponses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comments for post {PostId}", postId);
            return ApiResponse<List<CommentResponse>>.ErrorResult($"Error retrieving comments: {ex.Message}");
        }
    }

    #endregion

    #region Like Methods

    public async Task<ApiResponse<bool>> LikePostAsync(int postId, int userId, bool isLike)
    {
        try
        {
            var existingLike = await _context.PostLikes
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == userId);

            if (existingLike != null)
            {
                if (existingLike.IsLike == isLike)
                {
                    // 같은 상태면 제거
                    _context.PostLikes.Remove(existingLike);
                }
                else
                {
                    // 다른 상태면 업데이트
                    existingLike.IsLike = isLike;
                }
            }
            else
            {
                // 새로 생성
                var newLike = new PostLike
                {
                    PostId = postId,
                    UserId = userId,
                    IsLike = isLike,
                    CreatedAt = DateTime.UtcNow
                };
                _context.PostLikes.Add(newLike);
            }

            await _context.SaveChangesAsync();

            // 게시물 좋아요/싫어요 수 업데이트
            await UpdatePostLikeCountsAsync(postId);

            // 캐시 무효화
            await _cacheService.RemoveAsync($"post:{postId}:*");

            return ApiResponse<bool>.SuccessResult(true, isLike ? "Post liked" : "Post disliked");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking post {PostId}", postId);
            return ApiResponse<bool>.ErrorResult($"Error liking post: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> LikeCommentAsync(int commentId, int userId, bool isLike)
    {
        try
        {
            var existingLike = await _context.CommentLikes
                .FirstOrDefaultAsync(cl => cl.CommentId == commentId && cl.UserId == userId);

            if (existingLike != null)
            {
                if (existingLike.IsLike == isLike)
                {
                    _context.CommentLikes.Remove(existingLike);
                }
                else
                {
                    existingLike.IsLike = isLike;
                }
            }
            else
            {
                var newLike = new CommentLike
                {
                    CommentId = commentId,
                    UserId = userId,
                    IsLike = isLike,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CommentLikes.Add(newLike);
            }

            await _context.SaveChangesAsync();

            // 댓글 좋아요/싫어요 수 업데이트
            await UpdateCommentLikeCountsAsync(commentId);

            return ApiResponse<bool>.SuccessResult(true, isLike ? "Comment liked" : "Comment disliked");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking comment {CommentId}", commentId);
            return ApiResponse<bool>.ErrorResult($"Error liking comment: {ex.Message}");
        }
    }

    #endregion

    #region View Methods

    public async Task<ApiResponse<bool>> IncrementViewCountAsync(int postId, int? userId = null, string? ipAddress = null)
    {
        try
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
            {
                return ApiResponse<bool>.ErrorResult("Post not found");
            }

            // 조회수 증가
            post.ViewCount++;

            // 조회 기록 저장 (중복 방지)
            if (userId.HasValue || !string.IsNullOrEmpty(ipAddress))
            {
                var existingView = await _context.PostViews
                    .FirstOrDefaultAsync(pv => pv.PostId == postId &&
                        (userId.HasValue ? pv.UserId == userId.Value : pv.IpAddress == ipAddress));

                if (existingView == null)
                {
                    var postView = new PostView
                    {
                        PostId = postId,
                        UserId = userId ?? 0,
                        IpAddress = ipAddress,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.PostViews.Add(postView);
                }
            }

            await _context.SaveChangesAsync();

            // 캐시 무효화
            await _cacheService.RemoveAsync($"post:{postId}:*");

            return ApiResponse<bool>.SuccessResult(true, "View count incremented");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing view count for post {PostId}", postId);
            return ApiResponse<bool>.ErrorResult($"Error incrementing view count: {ex.Message}");
        }
    }

    #endregion

    #region Search Methods

    public async Task<ApiResponse<SearchResponse>> SearchPostsAsync(SearchRequest request, int? userId = null)
    {
        try
        {
            var query = _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Board)
                .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
                .Where(p => p.IsPublished);

            // 검색 조건 적용
            if (!string.IsNullOrEmpty(request.Query))
            {
                query = query.Where(p => p.Title.Contains(request.Query) ||
                                       p.Content.Contains(request.Query) ||
                                       p.Summary.Contains(request.Query));
            }

            if (request.BoardId.HasValue)
                query = query.Where(p => p.BoardId == request.BoardId.Value);

            if (!string.IsNullOrEmpty(request.Category))
                query = query.Where(p => p.Category == request.Category);

            if (request.AuthorId.HasValue)
                query = query.Where(p => p.AuthorId == request.AuthorId.Value);

            if (request.StartDate.HasValue)
                query = query.Where(p => p.CreatedAt >= request.StartDate.Value);

            if (request.EndDate.HasValue)
                query = query.Where(p => p.CreatedAt <= request.EndDate.Value);

            if (request.Tags != null && request.Tags.Any())
            {
                query = query.Where(p => p.PostTags.Any(pt => request.Tags.Contains(pt.Tag.Name)));
            }

            // 정렬
            query = request.SortBy.ToLower() switch
            {
                "updated" => request.SortOrder == "asc" ? query.OrderBy(p => p.UpdatedAt) : query.OrderByDescending(p => p.UpdatedAt),
                "views" => request.SortOrder == "asc" ? query.OrderBy(p => p.ViewCount) : query.OrderByDescending(p => p.ViewCount),
                "likes" => request.SortOrder == "asc" ? query.OrderBy(p => p.LikeCount) : query.OrderByDescending(p => p.LikeCount),
                "comments" => request.SortOrder == "asc" ? query.OrderBy(p => p.CommentCount) : query.OrderByDescending(p => p.CommentCount),
                _ => request.SortOrder == "asc" ? query.OrderBy(p => p.CreatedAt) : query.OrderByDescending(p => p.CreatedAt)
            };

            var totalCount = await query.CountAsync();

            var posts = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var postResponses = new List<PostResponse>();
            foreach (var post in posts)
            {
                var postResponse = await GetPostResponseAsync(post.Id, userId);
                postResponses.Add(postResponse);
            }

            // 추천 태그 및 게시판
            var suggestedTags = await GetSuggestedTagsAsync(request.Query);
            var suggestedBoards = await GetSuggestedBoardsAsync();

            var response = new SearchResponse
            {
                Posts = postResponses,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize),
                SuggestedTags = suggestedTags,
                SuggestedBoards = suggestedBoards
            };

            return ApiResponse<SearchResponse>.SuccessResult(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching posts");
            return ApiResponse<SearchResponse>.ErrorResult($"Error searching posts: {ex.Message}");
        }
    }

    #endregion

    #region Helper Methods

    private async Task<PostResponse> GetPostResponseAsync(int postId, int? userId)
    {
        var post = await _context.Posts
            .Include(p => p.Author)
            .Include(p => p.Board)
            .Include(p => p.PostTags)
            .ThenInclude(pt => pt.Tag)
            .Include(p => p.Attachments.Where(a => a.IsActive))
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null) return null;

        var tags = new List<string>();
        if (!string.IsNullOrEmpty(post.Tags))
        {
            try
            {
                tags = JsonSerializer.Deserialize<List<string>>(post.Tags) ?? new List<string>();
            }
            catch
            {
                tags = new List<string>();
            }
        }

        var isLiked = false;
        var isDisliked = false;
        if (userId.HasValue)
        {
            var like = await _context.PostLikes
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == userId.Value);
            if (like != null)
            {
                isLiked = like.IsLike;
                isDisliked = !like.IsLike;
            }
        }

        return new PostResponse
        {
            Id = post.Id,
            Title = post.Title,
            Content = post.Content,
            Summary = post.Summary,
            AuthorId = post.AuthorId,
            AuthorName = post.Author?.Username ?? "Unknown",
            AuthorAvatar = post.Author?.AvatarUrl,
            BoardId = post.BoardId,
            BoardName = post.Board?.Name ?? "Unknown",
            Category = post.Category,
            Tags = tags,
            FeaturedImageUrl = post.FeaturedImageUrl,
            IsPublished = post.IsPublished,
            IsPinned = post.IsPinned,
            IsLocked = post.IsLocked,
            AllowComments = post.AllowComments,
            ViewCount = post.ViewCount,
            LikeCount = post.LikeCount,
            DislikeCount = post.DislikeCount,
            CommentCount = post.CommentCount,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            PublishedAt = post.PublishedAt,
            ScheduledAt = post.ScheduledAt,
            IsLiked = isLiked,
            IsDisliked = isDisliked,
            Attachments = post.Attachments.Select(a => new PostAttachmentResponse
            {
                Id = a.Id,
                PostId = a.PostId,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                MimeType = a.MimeType,
                FileSize = a.FileSize,
                FileType = a.FileType,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt
            }).ToList()
        };
    }

    private async Task<CommentResponse> GetCommentResponseAsync(int commentId, int? userId)
    {
        var comment = await _context.Comments
            .Include(c => c.Author)
            .Include(c => c.Replies.Where(r => !r.IsDeleted))
            .ThenInclude(r => r.Author)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null) return null;

        var isLiked = false;
        var isDisliked = false;
        if (userId.HasValue)
        {
            var like = await _context.CommentLikes
                .FirstOrDefaultAsync(cl => cl.CommentId == commentId && cl.UserId == userId.Value);
            if (like != null)
            {
                isLiked = like.IsLike;
                isDisliked = !like.IsLike;
            }
        }

        var replies = new List<CommentResponse>();
        foreach (var reply in comment.Replies)
        {
            var replyResponse = await GetCommentResponseAsync(reply.Id, userId);
            if (replyResponse != null)
                replies.Add(replyResponse);
        }

        return new CommentResponse
        {
            Id = comment.Id,
            Content = comment.Content,
            PostId = comment.PostId,
            AuthorId = comment.AuthorId,
            AuthorName = comment.Author?.Username ?? "Unknown",
            AuthorAvatar = comment.Author?.AvatarUrl,
            ParentId = comment.ParentId,
            IsDeleted = comment.IsDeleted,
            LikeCount = comment.LikeCount,
            DislikeCount = comment.DislikeCount,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            IsLiked = isLiked,
            IsDisliked = isDisliked,
            Replies = replies
        };
    }

    private async Task ProcessPostTagsAsync(int postId, List<string> tagNames)
    {
        // 기존 태그 제거
        var existingTags = await _context.PostTags.Where(pt => pt.PostId == postId).ToListAsync();
        _context.PostTags.RemoveRange(existingTags);

        // 새 태그 처리
        foreach (var tagName in tagNames)
        {
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName);
            if (tag == null)
            {
                tag = new Tag
                {
                    Name = tagName,
                    UsageCount = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Tags.Add(tag);
            }
            else
            {
                tag.UsageCount++;
            }

            var postTag = new PostTag
            {
                PostId = postId,
                TagId = tag.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.PostTags.Add(postTag);
        }

        await _context.SaveChangesAsync();
    }

    private async Task UpdatePostLikeCountsAsync(int postId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post != null)
        {
            post.LikeCount = await _context.PostLikes.CountAsync(pl => pl.PostId == postId && pl.IsLike);
            post.DislikeCount = await _context.PostLikes.CountAsync(pl => pl.PostId == postId && !pl.IsLike);
            await _context.SaveChangesAsync();
        }
    }

    private async Task UpdateCommentLikeCountsAsync(int commentId)
    {
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment != null)
        {
            comment.LikeCount = await _context.CommentLikes.CountAsync(cl => cl.CommentId == commentId && cl.IsLike);
            comment.DislikeCount = await _context.CommentLikes.CountAsync(cl => cl.CommentId == commentId && !cl.IsLike);
            await _context.SaveChangesAsync();
        }
    }

    private async Task<List<TagResponse>> GetSuggestedTagsAsync(string? query)
    {
        var tags = await _context.Tags
            .Where(t => t.IsActive && (string.IsNullOrEmpty(query) || t.Name.Contains(query)))
            .OrderByDescending(t => t.UsageCount)
            .Take(10)
            .ToListAsync();

        return tags.Select(t => new TagResponse
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            Color = t.Color,
            UsageCount = t.UsageCount,
            IsActive = t.IsActive,
            CreatedAt = t.CreatedAt
        }).ToList();
    }

    private async Task<List<BoardResponse>> GetSuggestedBoardsAsync()
    {
        var boards = await _context.Boards
            .Where(b => b.IsActive)
            .OrderBy(b => b.SortOrder)
            .Take(10)
            .ToListAsync();

        return boards.Select(b => new BoardResponse
        {
            Id = b.Id,
            Name = b.Name,
            Description = b.Description,
            Icon = b.Icon,
            Color = b.Color,
            IsActive = b.IsActive,
            SortOrder = b.SortOrder,
            PostCount = 0, // TODO: 실제 게시물 수 계산
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt
        }).ToList();
    }

    #endregion

    #region Not Implemented Methods

    public Task<ApiResponse<bool>> PinPostAsync(int id, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> LockPostAsync(int id, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<CommentResponse>> UpdateCommentAsync(int id, UpdateCommentRequest request, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> DeleteCommentAsync(int id, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> RemoveLikeAsync(int targetId, string targetType, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<TagResponse>>> SearchTagsAsync(string query, int limit = 10)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<BoardResponse>>> GetBoardsAsync()
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<ContentStatsResponse>> GetContentStatsAsync()
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<PostResponse>>> GetPopularPostsAsync(int limit = 10)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<TagResponse>>> GetPopularTagsAsync(int limit = 10)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<PostAttachmentResponse>> AddAttachmentAsync(int postId, string fileName, string fileUrl, string? mimeType, long fileSize, string? fileType)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<bool>> RemoveAttachmentAsync(int attachmentId, int userId)
    {
        throw new NotImplementedException();
    }

    public Task<ApiResponse<List<PostAttachmentResponse>>> GetAttachmentsByPostIdAsync(int postId)
    {
        throw new NotImplementedException();
    }

    #endregion
}

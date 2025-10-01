using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ContentService.DTOs;
using ContentService.Services;

namespace ContentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly IContentService _contentService;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(IContentService contentService, ILogger<CommentsController> logger)
    {
        _contentService = contentService;
        _logger = logger;
    }

    /// <summary>
    /// 게시물의 댓글 목록 조회
    /// </summary>
    [HttpGet("post/{postId}")]
    public async Task<ActionResult<ApiResponse<List<CommentResponse>>>> GetCommentsByPostId(int postId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _contentService.GetCommentsByPostIdAsync(postId, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comments for post {PostId}", postId);
            return StatusCode(500, ApiResponse<List<CommentResponse>>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 댓글 상세 조회
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CommentResponse>>> GetComment(int id)
    {
        try
        {
            var result = await _contentService.GetCommentByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comment {CommentId}", id);
            return StatusCode(500, ApiResponse<CommentResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 댓글 생성
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CommentResponse>>> CreateComment([FromBody] CreateCommentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<CommentResponse>.ErrorResult("Validation failed", errors));
            }

            var userId = GetCurrentUserId();
            var result = await _contentService.CreateCommentAsync(request, userId);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetComment), new { id = result.Data!.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment");
            return StatusCode(500, ApiResponse<CommentResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 댓글 수정
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CommentResponse>>> UpdateComment(
        int id,
        [FromBody] UpdateCommentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<CommentResponse>.ErrorResult("Validation failed", errors));
            }

            var userId = GetCurrentUserId();
            var result = await _contentService.UpdateCommentAsync(id, request, userId);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating comment {CommentId}", id);
            return StatusCode(500, ApiResponse<CommentResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 댓글 삭제
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteComment(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _contentService.DeleteCommentAsync(id, userId);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {CommentId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 댓글 좋아요/싫어요
    /// </summary>
    [HttpPost("{id}/like")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> LikeComment(int id, [FromBody] LikeRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _contentService.LikeCommentAsync(id, userId, request.IsLike);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking comment {CommentId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId");
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId) ? userId : null;
    }
}

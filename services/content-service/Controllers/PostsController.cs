using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ContentService.DTOs;
using ContentService.Services;

namespace ContentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IContentService _contentService;
    private readonly ILogger<PostsController> _logger;

    public PostsController(IContentService contentService, ILogger<PostsController> logger)
    {
        _contentService = contentService;
        _logger = logger;
    }

    /// <summary>
    /// 게시물 목록 조회
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PostResponse>>>> GetPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? boardId = null,
        [FromQuery] int? authorId = null)
    {
        try
        {
            var result = await _contentService.GetPostsAsync(page, pageSize, boardId, authorId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving posts");
            return StatusCode(500, ApiResponse<List<PostResponse>>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 게시물 상세 조회
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PostResponse>>> GetPost(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _contentService.GetPostByIdAsync(id, userId);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving post {PostId}", id);
            return StatusCode(500, ApiResponse<PostResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 게시물 생성
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PostResponse>>> CreatePost([FromBody] CreatePostRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<PostResponse>.ErrorResult("Validation failed", errors));
            }

            var userId = GetCurrentUserId();
            var result = await _contentService.CreatePostAsync(request, userId);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetPost), new { id = result.Data!.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post");
            return StatusCode(500, ApiResponse<PostResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 게시물 수정
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PostResponse>>> UpdatePost(
        int id,
        [FromBody] UpdatePostRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<PostResponse>.ErrorResult("Validation failed", errors));
            }

            var userId = GetCurrentUserId();
            var result = await _contentService.UpdatePostAsync(id, request, userId);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating post {PostId}", id);
            return StatusCode(500, ApiResponse<PostResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 게시물 삭제
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePost(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _contentService.DeletePostAsync(id, userId);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {PostId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 게시물 좋아요/싫어요
    /// </summary>
    [HttpPost("{id}/like")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> LikePost(int id, [FromBody] LikeRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _contentService.LikePostAsync(id, userId, request.IsLike);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking post {PostId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 조회수 증가
    /// </summary>
    [HttpPost("{id}/view")]
    public async Task<ActionResult<ApiResponse<bool>>> IncrementView(int id, [FromBody] ViewRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _contentService.IncrementViewCountAsync(id, userId, ipAddress);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing view count for post {PostId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId");
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId) ? userId : null;
    }
}

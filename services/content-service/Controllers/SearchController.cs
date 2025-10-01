using Microsoft.AspNetCore.Mvc;
using ContentService.DTOs;
using ContentService.Services;

namespace ContentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly IContentService _contentService;
    private readonly ILogger<SearchController> _logger;

    public SearchController(IContentService contentService, ILogger<SearchController> logger)
    {
        _contentService = contentService;
        _logger = logger;
    }

    /// <summary>
    /// 게시물 검색
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SearchResponse>>> SearchPosts([FromBody] SearchRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<SearchResponse>.ErrorResult("Validation failed", errors));
            }

            var userId = GetCurrentUserId();
            var result = await _contentService.SearchPostsAsync(request, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching posts");
            return StatusCode(500, ApiResponse<SearchResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 태그 검색
    /// </summary>
    [HttpGet("tags")]
    public async Task<ActionResult<ApiResponse<List<TagResponse>>>> SearchTags(
        [FromQuery] string query,
        [FromQuery] int limit = 10)
    {
        try
        {
            var result = await _contentService.SearchTagsAsync(query, limit);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching tags");
            return StatusCode(500, ApiResponse<List<TagResponse>>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 게시판 목록 조회
    /// </summary>
    [HttpGet("boards")]
    public async Task<ActionResult<ApiResponse<List<BoardResponse>>>> GetBoards()
    {
        try
        {
            var result = await _contentService.GetBoardsAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving boards");
            return StatusCode(500, ApiResponse<List<BoardResponse>>.ErrorResult("Internal server error"));
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("userId");
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId) ? userId : null;
    }
}

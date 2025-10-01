using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.DTOs;
using UserService.Services;

namespace UserService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// 사용자 목록 조회
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<UserResponse>>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _userService.GetUsersAsync(page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return StatusCode(500, ApiResponse<List<UserResponse>>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 사용자 ID로 조회
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> GetUser(int id)
    {
        try
        {
            var result = await _userService.GetUserByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, ApiResponse<UserResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 사용자 생성
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserResponse>>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<UserResponse>.ErrorResult("Validation failed", errors));
            }

            var result = await _userService.CreateUserAsync(request);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetUser), new { id = result.Data!.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, ApiResponse<UserResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 사용자 정보 업데이트
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateUser(
        int id,
        [FromBody] UpdateUserRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<UserResponse>.ErrorResult("Validation failed", errors));
            }

            var result = await _userService.UpdateUserAsync(id, request);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, ApiResponse<UserResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 사용자 삭제
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(int id)
    {
        try
        {
            var result = await _userService.DeleteUserAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 프로필 업데이트
    /// </summary>
    [HttpPut("{id}/profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateProfile(
        int id,
        [FromBody] UpdateProfileRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<UserResponse>.ErrorResult("Validation failed", errors));
            }

            var result = await _userService.UpdateProfileAsync(id, request);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user {UserId}", id);
            return StatusCode(500, ApiResponse<UserResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 사용자 통계 조회
    /// </summary>
    [HttpGet("{id}/stats")]
    public async Task<ActionResult<ApiResponse<UserStatsResponse>>> GetUserStats(int id)
    {
        try
        {
            var result = await _userService.GetUserStatsAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stats for user {UserId}", id);
            return StatusCode(500, ApiResponse<UserStatsResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 비밀번호 변경
    /// </summary>
    [HttpPut("{id}/change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> ChangePassword(
        int id,
        [FromBody] ChangePasswordRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<bool>.ErrorResult("Validation failed", errors));
            }

            var result = await _userService.ChangePasswordAsync(id, request);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user {UserId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 이메일 인증
    /// </summary>
    [HttpPost("{id}/verify-email")]
    public async Task<ActionResult<ApiResponse<bool>>> VerifyEmail(
        int id,
        [FromBody] VerifyEmailRequest request)
    {
        try
        {
            var result = await _userService.VerifyEmailAsync(id, request.Token);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying email for user {UserId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 인증 이메일 재전송
    /// </summary>
    [HttpPost("{id}/resend-verification")]
    public async Task<ActionResult<ApiResponse<bool>>> ResendVerificationEmail(int id)
    {
        try
        {
            var result = await _userService.ResendVerificationEmailAsync(id);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending verification email for user {UserId}", id);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }
}

public class VerifyEmailRequest
{
    public string Token { get; set; } = string.Empty;
}


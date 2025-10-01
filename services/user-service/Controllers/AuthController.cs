using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.DTOs;
using UserService.Services;

namespace UserService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// 사용자 로그인
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<LoginResponse>.ErrorResult("Validation failed", errors));
            }

            var result = await _authService.LoginAsync(request);
            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email {Email}", request.Email);
            return StatusCode(500, ApiResponse<LoginResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 사용자 회원가입
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Register([FromBody] CreateUserRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<LoginResponse>.ErrorResult("Validation failed", errors));
            }

            var result = await _authService.RegisterAsync(request);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(Login), result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email {Email}", request.Email);
            return StatusCode(500, ApiResponse<LoginResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 토큰 갱신
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                return BadRequest(ApiResponse<LoginResponse>.ErrorResult("Refresh token is required"));
            }

            var result = await _authService.RefreshTokenAsync(request.RefreshToken);
            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, ApiResponse<LoginResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 로그아웃
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> Logout([FromBody] LogoutRequest request)
    {
        try
        {
            var result = await _authService.LogoutAsync(request.Token);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// OAuth 로그인
    /// </summary>
    [HttpPost("oauth")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> OAuthLogin([FromBody] OAuthLoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<LoginResponse>.ErrorResult("Validation failed", errors));
            }

            var result = await _authService.OAuthLoginAsync(request);
            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during OAuth login for provider {Provider}", request.Provider);
            return StatusCode(500, ApiResponse<LoginResponse>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 토큰 검증
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ApiResponse<bool>>> ValidateToken([FromBody] ValidateTokenRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(ApiResponse<bool>.ErrorResult("Token is required"));
            }

            var result = await _authService.ValidateTokenAsync(request.Token);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token validation");
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Internal server error"));
        }
    }

    /// <summary>
    /// 현재 사용자 정보 조회
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserResponse>>> GetCurrentUser()
    {
        try
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(ApiResponse<UserResponse>.ErrorResult("Token is required"));
            }

            var result = await _authService.GetCurrentUserAsync(token);
            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, ApiResponse<UserResponse>.ErrorResult("Internal server error"));
        }
    }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class LogoutRequest
{
    public string Token { get; set; } = string.Empty;
}

public class ValidateTokenRequest
{
    public string Token { get; set; } = string.Empty;
}


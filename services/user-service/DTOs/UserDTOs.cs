using System.ComponentModel.DataAnnotations;

namespace UserService.DTOs;

// 사용자 생성 요청 DTO
public class CreateUserRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [StringLength(500)]
    public string? Bio { get; set; }
}

// 사용자 업데이트 요청 DTO
public class UpdateUserRequest
{
    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [StringLength(500)]
    public string? Bio { get; set; }

    [StringLength(255)]
    public string? AvatarUrl { get; set; }
}

// 로그인 요청 DTO
public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}

// 비밀번호 변경 요청 DTO
public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}

// 사용자 응답 DTO
public class UserResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

// 로그인 응답 DTO
public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserResponse User { get; set; } = new();
}

// OAuth 로그인 요청 DTO
public class OAuthLoginRequest
{
    [Required]
    public string Provider { get; set; } = string.Empty;

    [Required]
    public string AccessToken { get; set; } = string.Empty;

    public string? RefreshToken { get; set; }
}

// 사용자 프로필 업데이트 DTO
public class UpdateProfileRequest
{
    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [StringLength(500)]
    public string? Bio { get; set; }

    [StringLength(255)]
    public string? AvatarUrl { get; set; }
}

// 사용자 통계 DTO
public class UserStatsResponse
{
    public int TotalPosts { get; set; }
    public int TotalComments { get; set; }
    public int TotalLikes { get; set; }
    public int TotalViews { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public int Level { get; set; }
    public int Experience { get; set; }
    public List<string> Badges { get; set; } = new();
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


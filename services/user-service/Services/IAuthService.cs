using UserService.DTOs;

namespace UserService.Services;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<LoginResponse>> RegisterAsync(CreateUserRequest request);
    Task<ApiResponse<LoginResponse>> RefreshTokenAsync(string refreshToken);
    Task<ApiResponse<bool>> LogoutAsync(string token);
    Task<ApiResponse<LoginResponse>> OAuthLoginAsync(OAuthLoginRequest request);
    Task<ApiResponse<bool>> ValidateTokenAsync(string token);
    Task<ApiResponse<UserResponse>> GetCurrentUserAsync(string token);
}


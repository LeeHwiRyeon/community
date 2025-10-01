using UserService.DTOs;

namespace UserService.Services;

public interface IUserService
{
    Task<ApiResponse<UserResponse>> CreateUserAsync(CreateUserRequest request);
    Task<ApiResponse<UserResponse>> GetUserByIdAsync(int id);
    Task<ApiResponse<UserResponse>> GetUserByEmailAsync(string email);
    Task<ApiResponse<UserResponse>> GetUserByUsernameAsync(string username);
    Task<ApiResponse<UserResponse>> UpdateUserAsync(int id, UpdateUserRequest request);
    Task<ApiResponse<bool>> DeleteUserAsync(int id);
    Task<ApiResponse<List<UserResponse>>> GetUsersAsync(int page = 1, int pageSize = 10);
    Task<ApiResponse<UserResponse>> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task<ApiResponse<UserStatsResponse>> GetUserStatsAsync(int userId);
    Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<ApiResponse<bool>> VerifyEmailAsync(int userId, string token);
    Task<ApiResponse<bool>> ResendVerificationEmailAsync(int userId);
}


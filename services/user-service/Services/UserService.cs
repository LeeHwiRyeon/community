using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;
using AutoMapper;
using System.Security.Cryptography;
using System.Text;

namespace UserService.Services;

public class UserService : IUserService
{
    private readonly UserDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheService _cacheService;
    private readonly IEmailService _emailService;

    public UserService(
        UserDbContext context,
        IMapper mapper,
        ICacheService cacheService,
        IEmailService emailService)
    {
        _context = context;
        _mapper = mapper;
        _cacheService = cacheService;
        _emailService = emailService;
    }

    public async Task<ApiResponse<UserResponse>> CreateUserAsync(CreateUserRequest request)
    {
        try
        {
            // 이메일 중복 확인
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email || u.Username == request.Username);

            if (existingUser != null)
            {
                return ApiResponse<UserResponse>.ErrorResult(
                    "User with this email or username already exists");
            }

            // 비밀번호 해시
            var passwordHash = HashPassword(request.Password);

            // 새 사용자 생성
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Bio = request.Bio,
                Role = "User",
                IsActive = true,
                IsEmailVerified = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // 캐시에 저장
            await _cacheService.SetAsync($"user:{user.Id}", user, TimeSpan.FromMinutes(30));

            var userResponse = _mapper.Map<UserResponse>(user);
            return ApiResponse<UserResponse>.SuccessResult(userResponse, "User created successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<UserResponse>.ErrorResult($"Error creating user: {ex.Message}");
        }
    }

    public async Task<ApiResponse<UserResponse>> GetUserByIdAsync(int id)
    {
        try
        {
            // 캐시에서 먼저 확인
            var cachedUser = await _cacheService.GetAsync<User>($"user:{id}");
            if (cachedUser != null)
            {
                var cachedResponse = _mapper.Map<UserResponse>(cachedUser);
                return ApiResponse<UserResponse>.SuccessResult(cachedResponse);
            }

            // 데이터베이스에서 조회
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.IsActive);

            if (user == null)
            {
                return ApiResponse<UserResponse>.ErrorResult("User not found");
            }

            // 캐시에 저장
            await _cacheService.SetAsync($"user:{id}", user, TimeSpan.FromMinutes(30));

            var userResponse = _mapper.Map<UserResponse>(user);
            return ApiResponse<UserResponse>.SuccessResult(userResponse);
        }
        catch (Exception ex)
        {
            return ApiResponse<UserResponse>.ErrorResult($"Error retrieving user: {ex.Message}");
        }
    }

    public async Task<ApiResponse<UserResponse>> GetUserByEmailAsync(string email)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

            if (user == null)
            {
                return ApiResponse<UserResponse>.ErrorResult("User not found");
            }

            var userResponse = _mapper.Map<UserResponse>(user);
            return ApiResponse<UserResponse>.SuccessResult(userResponse);
        }
        catch (Exception ex)
        {
            return ApiResponse<UserResponse>.ErrorResult($"Error retrieving user: {ex.Message}");
        }
    }

    public async Task<ApiResponse<UserResponse>> GetUserByUsernameAsync(string username)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);

            if (user == null)
            {
                return ApiResponse<UserResponse>.ErrorResult("User not found");
            }

            var userResponse = _mapper.Map<UserResponse>(user);
            return ApiResponse<UserResponse>.SuccessResult(userResponse);
        }
        catch (Exception ex)
        {
            return ApiResponse<UserResponse>.ErrorResult($"Error retrieving user: {ex.Message}");
        }
    }

    public async Task<ApiResponse<UserResponse>> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return ApiResponse<UserResponse>.ErrorResult("User not found");
            }

            // 업데이트할 필드만 변경
            if (!string.IsNullOrEmpty(request.FirstName))
                user.FirstName = request.FirstName;
            if (!string.IsNullOrEmpty(request.LastName))
                user.LastName = request.LastName;
            if (!string.IsNullOrEmpty(request.Bio))
                user.Bio = request.Bio;
            if (!string.IsNullOrEmpty(request.AvatarUrl))
                user.AvatarUrl = request.AvatarUrl;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 캐시 업데이트
            await _cacheService.SetAsync($"user:{id}", user, TimeSpan.FromMinutes(30));

            var userResponse = _mapper.Map<UserResponse>(user);
            return ApiResponse<UserResponse>.SuccessResult(userResponse, "User updated successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<UserResponse>.ErrorResult($"Error updating user: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(int id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResult("User not found");
            }

            // 소프트 삭제
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 캐시에서 제거
            await _cacheService.RemoveAsync($"user:{id}");

            return ApiResponse<bool>.SuccessResult(true, "User deleted successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResult($"Error deleting user: {ex.Message}");
        }
    }

    public async Task<ApiResponse<List<UserResponse>>> GetUsersAsync(int page = 1, int pageSize = 10)
    {
        try
        {
            var users = await _context.Users
                .Where(u => u.IsActive)
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userResponses = _mapper.Map<List<UserResponse>>(users);
            return ApiResponse<List<UserResponse>>.SuccessResult(userResponses);
        }
        catch (Exception ex)
        {
            return ApiResponse<List<UserResponse>>.ErrorResult($"Error retrieving users: {ex.Message}");
        }
    }

    public async Task<ApiResponse<UserResponse>> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserResponse>.ErrorResult("User not found");
            }

            // 프로필 업데이트
            if (!string.IsNullOrEmpty(request.FirstName))
                user.FirstName = request.FirstName;
            if (!string.IsNullOrEmpty(request.LastName))
                user.LastName = request.LastName;
            if (!string.IsNullOrEmpty(request.Bio))
                user.Bio = request.Bio;
            if (!string.IsNullOrEmpty(request.AvatarUrl))
                user.AvatarUrl = request.AvatarUrl;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 캐시 업데이트
            await _cacheService.SetAsync($"user:{userId}", user, TimeSpan.FromMinutes(30));

            var userResponse = _mapper.Map<UserResponse>(user);
            return ApiResponse<UserResponse>.SuccessResult(userResponse, "Profile updated successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<UserResponse>.ErrorResult($"Error updating profile: {ex.Message}");
        }
    }

    public async Task<ApiResponse<UserStatsResponse>> GetUserStatsAsync(int userId)
    {
        try
        {
            // 캐시에서 먼저 확인
            var cachedStats = await _cacheService.GetAsync<UserStatsResponse>($"user_stats:{userId}");
            if (cachedStats != null)
            {
                return ApiResponse<UserStatsResponse>.SuccessResult(cachedStats);
            }

            // 실제 통계는 다른 서비스에서 가져와야 함 (현재는 모의 데이터)
            var stats = new UserStatsResponse
            {
                TotalPosts = 0,
                TotalComments = 0,
                TotalLikes = 0,
                TotalViews = 0,
                LastActivityAt = DateTime.UtcNow,
                Level = 1,
                Experience = 0,
                Badges = new List<string>()
            };

            // 캐시에 저장 (5분)
            await _cacheService.SetAsync($"user_stats:{userId}", stats, TimeSpan.FromMinutes(5));

            return ApiResponse<UserStatsResponse>.SuccessResult(stats);
        }
        catch (Exception ex)
        {
            return ApiResponse<UserStatsResponse>.ErrorResult($"Error retrieving user stats: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResult("User not found");
            }

            // 현재 비밀번호 확인
            if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                return ApiResponse<bool>.ErrorResult("Current password is incorrect");
            }

            // 새 비밀번호 해시
            user.PasswordHash = HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 캐시 업데이트
            await _cacheService.SetAsync($"user:{userId}", user, TimeSpan.FromMinutes(30));

            return ApiResponse<bool>.SuccessResult(true, "Password changed successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResult($"Error changing password: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> VerifyEmailAsync(int userId, string token)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResult("User not found");
            }

            // 토큰 검증 로직 (실제로는 더 복잡한 검증 필요)
            if (string.IsNullOrEmpty(token))
            {
                return ApiResponse<bool>.ErrorResult("Invalid verification token");
            }

            user.IsEmailVerified = true;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 캐시 업데이트
            await _cacheService.SetAsync($"user:{userId}", user, TimeSpan.FromMinutes(30));

            return ApiResponse<bool>.SuccessResult(true, "Email verified successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResult($"Error verifying email: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> ResendVerificationEmailAsync(int userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResult("User not found");
            }

            if (user.IsEmailVerified)
            {
                return ApiResponse<bool>.ErrorResult("Email is already verified");
            }

            // 이메일 전송 로직
            await _emailService.SendVerificationEmailAsync(user.Email, user.Username);

            return ApiResponse<bool>.SuccessResult(true, "Verification email sent successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResult($"Error sending verification email: {ex.Message}");
        }
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private bool VerifyPassword(string password, string hashedPassword)
    {
        var hashedInput = HashPassword(password);
        return hashedInput == hashedPassword;
    }
}


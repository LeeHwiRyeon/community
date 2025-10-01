using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;
using AutoMapper;

namespace UserService.Services;

public class AuthService : IAuthService
{
    private readonly UserDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheService _cacheService;
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserDbContext context,
        IMapper mapper,
        ICacheService cacheService,
        IUserService userService,
        IConfiguration configuration)
    {
        _context = context;
        _mapper = mapper;
        _cacheService = cacheService;
        _userService = userService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            // 사용자 조회
            var userResult = await _userService.GetUserByEmailAsync(request.Email);
            if (!userResult.Success || userResult.Data == null)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Invalid email or password");
            }

            var user = await _context.Users.FindAsync(userResult.Data.Id);
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return ApiResponse<LoginResponse>.ErrorResult("Invalid email or password");
            }

            if (!user.IsActive)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Account is deactivated");
            }

            // JWT 토큰 생성
            var tokenResult = await GenerateTokensAsync(user);
            if (!tokenResult.Success)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Failed to generate tokens");
            }

            // 마지막 로그인 시간 업데이트
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var loginResponse = new LoginResponse
            {
                AccessToken = tokenResult.Data!.AccessToken,
                RefreshToken = tokenResult.Data.RefreshToken,
                ExpiresAt = tokenResult.Data.ExpiresAt,
                User = userResult.Data
            };

            return ApiResponse<LoginResponse>.SuccessResult(loginResponse, "Login successful");
        }
        catch (Exception ex)
        {
            return ApiResponse<LoginResponse>.ErrorResult($"Login failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<LoginResponse>> RegisterAsync(CreateUserRequest request)
    {
        try
        {
            // 사용자 생성
            var createResult = await _userService.CreateUserAsync(request);
            if (!createResult.Success || createResult.Data == null)
            {
                return ApiResponse<LoginResponse>.ErrorResult(createResult.Message);
            }

            var user = await _context.Users.FindAsync(createResult.Data.Id);
            if (user == null)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Failed to create user");
            }

            // JWT 토큰 생성
            var tokenResult = await GenerateTokensAsync(user);
            if (!tokenResult.Success)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Failed to generate tokens");
            }

            var loginResponse = new LoginResponse
            {
                AccessToken = tokenResult.Data!.AccessToken,
                RefreshToken = tokenResult.Data.RefreshToken,
                ExpiresAt = tokenResult.Data.ExpiresAt,
                User = createResult.Data
            };

            return ApiResponse<LoginResponse>.SuccessResult(loginResponse, "Registration successful");
        }
        catch (Exception ex)
        {
            return ApiResponse<LoginResponse>.ErrorResult($"Registration failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<LoginResponse>> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            // 세션에서 리프레시 토큰 확인
            var session = await _context.UserSessions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Token == refreshToken && s.IsActive && s.ExpiresAt > DateTime.UtcNow);

            if (session == null)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Invalid refresh token");
            }

            // 새 토큰 생성
            var tokenResult = await GenerateTokensAsync(session.User);
            if (!tokenResult.Success)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Failed to generate new tokens");
            }

            // 기존 세션 비활성화
            session.IsActive = false;
            await _context.SaveChangesAsync();

            var userResponse = _mapper.Map<UserResponse>(session.User);
            var loginResponse = new LoginResponse
            {
                AccessToken = tokenResult.Data!.AccessToken,
                RefreshToken = tokenResult.Data.RefreshToken,
                ExpiresAt = tokenResult.Data.ExpiresAt,
                User = userResponse
            };

            return ApiResponse<LoginResponse>.SuccessResult(loginResponse, "Token refreshed successfully");
        }
        catch (Exception ex)
        {
            return ApiResponse<LoginResponse>.ErrorResult($"Token refresh failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> LogoutAsync(string token)
    {
        try
        {
            // 세션 비활성화
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.Token == token && s.IsActive);

            if (session != null)
            {
                session.IsActive = false;
                await _context.SaveChangesAsync();
            }

            // 캐시에서 제거
            await _cacheService.RemoveAsync($"session:{token}");

            return ApiResponse<bool>.SuccessResult(true, "Logout successful");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResult($"Logout failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<LoginResponse>> OAuthLoginAsync(OAuthLoginRequest request)
    {
        try
        {
            // OAuth 토큰 검증 (실제로는 각 프로바이더별로 구현 필요)
            var userInfo = await ValidateOAuthTokenAsync(request.Provider, request.AccessToken);
            if (userInfo == null)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Invalid OAuth token");
            }

            // 기존 사용자 조회 또는 생성
            var user = await _context.Users
                .Include(u => u.OAuthTokens)
                .FirstOrDefaultAsync(u => u.Email == userInfo.Email);

            if (user == null)
            {
                // 새 사용자 생성
                var createRequest = new CreateUserRequest
                {
                    Username = userInfo.Username,
                    Email = userInfo.Email,
                    FirstName = userInfo.FirstName,
                    LastName = userInfo.LastName
                };

                var createResult = await _userService.CreateUserAsync(createRequest);
                if (!createResult.Success || createResult.Data == null)
                {
                    return ApiResponse<LoginResponse>.ErrorResult(createResult.Message);
                }

                user = await _context.Users.FindAsync(createResult.Data.Id);
                if (user == null)
                {
                    return ApiResponse<LoginResponse>.ErrorResult("Failed to create user");
                }
            }

            // OAuth 토큰 저장/업데이트
            var oauthToken = user.OAuthTokens.FirstOrDefault(t => t.Provider == request.Provider);
            if (oauthToken == null)
            {
                oauthToken = new OAuthToken
                {
                    UserId = user.Id,
                    Provider = request.Provider,
                    AccessToken = request.AccessToken,
                    RefreshToken = request.RefreshToken,
                    ExpiresAt = DateTime.UtcNow.AddDays(30),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.OAuthTokens.Add(oauthToken);
            }
            else
            {
                oauthToken.AccessToken = request.AccessToken;
                oauthToken.RefreshToken = request.RefreshToken;
                oauthToken.ExpiresAt = DateTime.UtcNow.AddDays(30);
                oauthToken.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // JWT 토큰 생성
            var tokenResult = await GenerateTokensAsync(user);
            if (!tokenResult.Success)
            {
                return ApiResponse<LoginResponse>.ErrorResult("Failed to generate tokens");
            }

            var userResponse = _mapper.Map<UserResponse>(user);
            var loginResponse = new LoginResponse
            {
                AccessToken = tokenResult.Data!.AccessToken,
                RefreshToken = tokenResult.Data.RefreshToken,
                ExpiresAt = tokenResult.Data.ExpiresAt,
                User = userResponse
            };

            return ApiResponse<LoginResponse>.SuccessResult(loginResponse, "OAuth login successful");
        }
        catch (Exception ex)
        {
            return ApiResponse<LoginResponse>.ErrorResult($"OAuth login failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> ValidateTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found"));

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return ApiResponse<bool>.SuccessResult(true, "Token is valid");
            }
            catch
            {
                return ApiResponse<bool>.ErrorResult("Invalid token");
            }
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResult($"Token validation failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<UserResponse>> GetCurrentUserAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);
            var userIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == "userId");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return ApiResponse<UserResponse>.ErrorResult("Invalid token");
            }

            var userResult = await _userService.GetUserByIdAsync(userId);
            if (!userResult.Success || userResult.Data == null)
            {
                return ApiResponse<UserResponse>.ErrorResult("User not found");
            }

            return ApiResponse<UserResponse>.SuccessResult(userResult.Data);
        }
        catch (Exception ex)
        {
            return ApiResponse<UserResponse>.ErrorResult($"Failed to get current user: {ex.Message}");
        }
    }

    private async Task<ApiResponse<LoginResponse>> GenerateTokensAsync(User user)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found"));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("userId", user.Id.ToString()),
                    new Claim("username", user.Username),
                    new Claim("email", user.Email),
                    new Claim("role", user.Role)
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var accessToken = tokenHandler.WriteToken(token);

            // 리프레시 토큰 생성
            var refreshToken = Guid.NewGuid().ToString();
            var expiresAt = DateTime.UtcNow.AddDays(7);

            // 세션 저장
            var session = new UserSession
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = expiresAt,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();

            var loginResponse = new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = tokenDescriptor.Expires.Value
            };

            return ApiResponse<LoginResponse>.SuccessResult(loginResponse);
        }
        catch (Exception ex)
        {
            return ApiResponse<LoginResponse>.ErrorResult($"Token generation failed: {ex.Message}");
        }
    }

    private bool VerifyPassword(string password, string hashedPassword)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        var hashedInput = Convert.ToBase64String(hashedBytes);
        return hashedInput == hashedPassword;
    }

    private async Task<OAuthUserInfo?> ValidateOAuthTokenAsync(string provider, string accessToken)
    {
        // 실제로는 각 OAuth 프로바이더별로 API 호출하여 사용자 정보 조회
        // 여기서는 모의 데이터 반환
        return new OAuthUserInfo
        {
            Username = "oauth_user",
            Email = "oauth@example.com",
            FirstName = "OAuth",
            LastName = "User"
        };
    }

    private class OAuthUserInfo
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }
}


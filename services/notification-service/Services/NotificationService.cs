using Microsoft.EntityFrameworkCore;
using NotificationService.DTOs;
using NotificationService.Models;
using NotificationService.Data;
using StackExchange.Redis;
using System.Text.Json;

namespace NotificationService.Services;

public class NotificationService : INotificationService
{
    private readonly NotificationDbContext _context;
    private readonly IDatabase _redis;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        NotificationDbContext context,
        IConnectionMultiplexer redis,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _redis = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<ServiceResult<NotificationDto>> CreateNotificationAsync(CreateNotificationRequest request)
    {
        try
        {
            var notification = new Notification
            {
                UserId = request.UserId,
                Type = request.Type,
                Title = request.Title,
                Message = request.Message,
                ActionUrl = request.ActionUrl,
                ImageUrl = request.ImageUrl,
                RelatedId = request.RelatedId,
                RelatedType = request.RelatedType,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Redis에 캐시
            await CacheNotificationAsync(notification);

            var dto = MapToDto(notification);
            return ServiceResult<NotificationDto>.CreateSuccess(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification for user {UserId}", request.UserId);
            return ServiceResult<NotificationDto>.CreateError("알림 생성 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<List<NotificationDto>>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = notifications.Select(MapToDto).ToList();
            return ServiceResult<List<NotificationDto>>.CreateSuccess(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user {UserId}", userId);
            return ServiceResult<List<NotificationDto>>.CreateError("알림 조회 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<NotificationDto>> GetNotificationByIdAsync(int id, int userId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
            {
                return ServiceResult<NotificationDto>.CreateError("알림을 찾을 수 없습니다.", "NOT_FOUND");
            }

            var dto = MapToDto(notification);
            return ServiceResult<NotificationDto>.CreateSuccess(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification {Id} for user {UserId}", id, userId);
            return ServiceResult<NotificationDto>.CreateError("알림 조회 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<bool>> MarkAsReadAsync(MarkAsReadRequest request, int userId)
    {
        try
        {
            var notifications = await _context.Notifications
                .Where(n => request.NotificationIds.Contains(n.Id) && n.UserId == userId)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Redis 캐시 업데이트
            foreach (var notification in notifications)
            {
                await CacheNotificationAsync(notification);
            }

            return ServiceResult<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notifications as read for user {UserId}", userId);
            return ServiceResult<bool>.CreateError("알림 읽음 처리 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<bool>> DeleteNotificationsAsync(DeleteNotificationRequest request, int userId)
    {
        try
        {
            var notifications = await _context.Notifications
                .Where(n => request.NotificationIds.Contains(n.Id) && n.UserId == userId)
                .ToListAsync();

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            // Redis에서 제거
            foreach (var notification in notifications)
            {
                await _redis.KeyDeleteAsync($"notification:{notification.Id}");
            }

            return ServiceResult<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notifications for user {UserId}", userId);
            return ServiceResult<bool>.CreateError("알림 삭제 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<NotificationSettingsDto>> GetNotificationSettingsAsync(int userId)
    {
        try
        {
            var settings = await _context.NotificationSettings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                // 기본 설정 생성
                settings = new NotificationSettings
                {
                    UserId = userId,
                    EmailEnabled = true,
                    PushEnabled = true,
                    InAppEnabled = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.NotificationSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            var dto = MapToSettingsDto(settings);
            return ServiceResult<NotificationSettingsDto>.CreateSuccess(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification settings for user {UserId}", userId);
            return ServiceResult<NotificationSettingsDto>.CreateError("알림 설정 조회 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<NotificationSettingsDto>> UpdateNotificationSettingsAsync(UpdateNotificationSettingsRequest request, int userId)
    {
        try
        {
            var settings = await _context.NotificationSettings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                settings = new NotificationSettings
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.NotificationSettings.Add(settings);
            }

            // 타입별 설정 업데이트
            switch (request.Type.ToLower())
            {
                case "email":
                    settings.EmailEnabled = request.EmailEnabled;
                    break;
                case "push":
                    settings.PushEnabled = request.PushEnabled;
                    break;
                case "inapp":
                    settings.InAppEnabled = request.InAppEnabled;
                    break;
                default:
                    return ServiceResult<NotificationSettingsDto>.CreateError("지원하지 않는 알림 타입입니다.", "INVALID_TYPE");
            }

            settings.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = MapToSettingsDto(settings);
            return ServiceResult<NotificationSettingsDto>.CreateSuccess(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification settings for user {UserId}", userId);
            return ServiceResult<NotificationSettingsDto>.CreateError("알림 설정 업데이트 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<bool>> RegisterPushTokenAsync(RegisterPushTokenRequest request, int userId)
    {
        try
        {
            var existingToken = await _context.PushTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.Token == request.Token);

            if (existingToken != null)
            {
                existingToken.UpdatedAt = DateTime.UtcNow;
                existingToken.IsActive = true;
            }
            else
            {
                var pushToken = new PushToken
                {
                    UserId = userId,
                    Token = request.Token,
                    Platform = request.Platform,
                    DeviceId = request.DeviceId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.PushTokens.Add(pushToken);
            }

            await _context.SaveChangesAsync();
            return ServiceResult<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering push token for user {UserId}", userId);
            return ServiceResult<bool>.CreateError("푸시 토큰 등록 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<bool>> SendPushNotificationAsync(int userId, string title, string message, string? actionUrl = null)
    {
        try
        {
            // 실제 푸시 알림 서비스 연동 (FCM, APNS 등)
            _logger.LogInformation("Sending push notification to user {UserId}: {Title}", userId, title);

            // 여기에 실제 푸시 알림 전송 로직 구현
            await Task.Delay(100); // 시뮬레이션

            return ServiceResult<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
            return ServiceResult<bool>.CreateError("푸시 알림 전송 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<bool>> SendEmailNotificationAsync(int userId, string subject, string body, string? actionUrl = null)
    {
        try
        {
            // 실제 이메일 서비스 연동 (SendGrid, SES 등)
            _logger.LogInformation("Sending email notification to user {UserId}: {Subject}", userId, subject);

            // 여기에 실제 이메일 전송 로직 구현
            await Task.Delay(100); // 시뮬레이션

            return ServiceResult<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email notification to user {UserId}", userId);
            return ServiceResult<bool>.CreateError("이메일 알림 전송 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<List<NotificationDto>>> GetUnreadCountAsync(int userId)
    {
        try
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            var dtos = unreadNotifications.Select(MapToDto).ToList();
            return ServiceResult<List<NotificationDto>>.CreateSuccess(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread notifications for user {UserId}", userId);
            return ServiceResult<List<NotificationDto>>.CreateError("읽지 않은 알림 조회 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<bool>> MarkAllAsReadAsync(int userId)
    {
        try
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return ServiceResult<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
            return ServiceResult<bool>.CreateError("모든 알림 읽음 처리 중 오류가 발생했습니다.");
        }
    }

    public async Task<ServiceResult<bool>> DeleteAllNotificationsAsync(int userId)
    {
        try
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ToListAsync();

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            return ServiceResult<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting all notifications for user {UserId}", userId);
            return ServiceResult<bool>.CreateError("모든 알림 삭제 중 오류가 발생했습니다.");
        }
    }

    private async Task CacheNotificationAsync(Notification notification)
    {
        try
        {
            var dto = MapToDto(notification);
            var json = JsonSerializer.Serialize(dto);
            await _redis.StringSetAsync($"notification:{notification.Id}", json, TimeSpan.FromHours(24));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache notification {Id}", notification.Id);
        }
    }

    private static NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            ActionUrl = notification.ActionUrl,
            ImageUrl = notification.ImageUrl,
            RelatedId = notification.RelatedId,
            RelatedType = notification.RelatedType,
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            CreatedAt = notification.CreatedAt
        };
    }

    private static NotificationSettingsDto MapToSettingsDto(NotificationSettings settings)
    {
        return new NotificationSettingsDto
        {
            Id = settings.Id,
            UserId = settings.UserId,
            EmailEnabled = settings.EmailEnabled,
            PushEnabled = settings.PushEnabled,
            InAppEnabled = settings.InAppEnabled,
            CreatedAt = settings.CreatedAt,
            UpdatedAt = settings.UpdatedAt
        };
    }
}

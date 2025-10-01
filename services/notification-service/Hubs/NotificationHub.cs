using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Services;
using NotificationService.DTOs;
using System.Security.Claims;

namespace NotificationService.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(INotificationService notificationService, ILogger<NotificationHub> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                // 사용자별 그룹에 연결
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId.Value}");

                _logger.LogInformation("User {UserId} connected to notification hub", userId.Value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnConnectedAsync");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                _logger.LogInformation("User {UserId} disconnected from notification hub", userId.Value);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnDisconnectedAsync");
        }

        await base.OnDisconnectedAsync(exception);
    }

    // 특정 사용자에게 알림 전송
    public async Task SendNotificationToUser(int userId, string type, string title, string message,
        string? actionUrl = null, string? imageUrl = null, int? relatedId = null, string? relatedType = null)
    {
        try
        {
            var request = new CreateNotificationRequest
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                ActionUrl = actionUrl,
                ImageUrl = imageUrl,
                RelatedId = relatedId,
                RelatedType = relatedType
            };

            var result = await _notificationService.CreateNotificationAsync(request);
            if (result.Success)
            {
                await Clients.Group($"User_{userId}").SendAsync("NotificationReceived", result.Data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification to user {UserId}", userId);
        }
    }

    // 모든 사용자에게 알림 전송
    public async Task SendNotificationToAll(string type, string title, string message,
        string? actionUrl = null, string? imageUrl = null)
    {
        try
        {
            // 시스템 알림으로 처리
            await Clients.All.SendAsync("SystemNotification", new
            {
                Type = type,
                Title = title,
                Message = message,
                ActionUrl = actionUrl,
                ImageUrl = imageUrl,
                CreatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification to all users");
        }
    }

    // 알림 읽음 처리
    public async Task MarkNotificationsAsRead(List<int> notificationIds)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var request = new MarkAsReadRequest { NotificationIds = notificationIds };
            var result = await _notificationService.MarkAsReadAsync(request, userId.Value);

            if (result.Success)
            {
                await Clients.Group($"User_{userId.Value}").SendAsync("NotificationsMarkedAsRead", notificationIds);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notifications as read");
        }
    }

    // 알림 삭제
    public async Task DeleteNotifications(List<int> notificationIds)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var request = new DeleteNotificationRequest { NotificationIds = notificationIds };
            var result = await _notificationService.DeleteNotificationsAsync(request, userId.Value);

            if (result.Success)
            {
                await Clients.Group($"User_{userId.Value}").SendAsync("NotificationsDeleted", notificationIds);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notifications");
        }
    }

    // 알림 설정 업데이트
    public async Task UpdateNotificationSettings(string type, bool emailEnabled, bool pushEnabled, bool inAppEnabled)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var request = new UpdateNotificationSettingsRequest
            {
                Type = type,
                EmailEnabled = emailEnabled,
                PushEnabled = pushEnabled,
                InAppEnabled = inAppEnabled
            };

            var result = await _notificationService.UpdateNotificationSettingsAsync(request, userId.Value);

            if (result.Success)
            {
                await Clients.Group($"User_{userId.Value}").SendAsync("NotificationSettingsUpdated", result.Data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification settings");
        }
    }

    // 푸시 토큰 등록
    public async Task RegisterPushToken(string token, string platform, string? deviceId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            var request = new RegisterPushTokenRequest
            {
                Token = token,
                Platform = platform,
                DeviceId = deviceId
            };

            var result = await _notificationService.RegisterPushTokenAsync(request, userId.Value);

            if (result.Success)
            {
                await Clients.Group($"User_{userId.Value}").SendAsync("PushTokenRegistered", new
                {
                    Token = token,
                    Platform = platform,
                    DeviceId = deviceId
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering push token");
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = Context.User?.FindFirst("userId");
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId) ? userId : null;
    }
}

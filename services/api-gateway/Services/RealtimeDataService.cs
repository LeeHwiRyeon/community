using Microsoft.AspNetCore.SignalR;
using ApiGateway.Hubs;

namespace ApiGateway.Services;

public class RealtimeDataService : IRealtimeDataService
{
    private readonly IHubContext<RealtimeHub> _hubContext;
    private readonly IConnectionManager _connectionManager;
    private readonly ILogger<RealtimeDataService> _logger;

    public RealtimeDataService(
        IHubContext<RealtimeHub> hubContext,
        IConnectionManager connectionManager,
        ILogger<RealtimeDataService> logger)
    {
        _hubContext = hubContext;
        _connectionManager = connectionManager;
        _logger = logger;
    }

    public async Task BroadcastUserUpdateAsync(object userData)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("user_update", new
            {
                Type = "user_update",
                Data = userData,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted user update");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast user update");
        }
    }

    public async Task BroadcastNewsUpdateAsync(object newsData)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("news_update", new
            {
                Type = "news_update",
                Data = newsData,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted news update");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast news update");
        }
    }

    public async Task BroadcastPostUpdateAsync(object postData)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("post_update", new
            {
                Type = "post_update",
                Data = postData,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted post update");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast post update");
        }
    }

    public async Task BroadcastCommentUpdateAsync(object commentData)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("comment_update", new
            {
                Type = "comment_update",
                Data = commentData,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted comment update");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast comment update");
        }
    }

    public async Task BroadcastAnalyticsUpdateAsync(object analyticsData)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("analytics_update", new
            {
                Type = "analytics_update",
                Data = analyticsData,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted analytics update");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast analytics update");
        }
    }

    public async Task BroadcastSystemUpdateAsync(object systemData)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("system_update", new
            {
                Type = "system_update",
                Data = systemData,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted system update");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast system update");
        }
    }

    public async Task BroadcastCustomEventAsync(string eventType, object data)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync(eventType, new
            {
                Type = eventType,
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Broadcasted custom event {EventType}", eventType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast custom event {EventType}", eventType);
        }
    }

    public async Task SendToUserAsync(string userId, string eventType, object data)
    {
        try
        {
            await _connectionManager.SendToUserAsync(userId, eventType, new
            {
                Type = eventType,
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Sent {EventType} to user {UserId}", eventType, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send {EventType} to user {UserId}", eventType, userId);
        }
    }

    public async Task SendToGroupAsync(string groupName, string eventType, object data)
    {
        try
        {
            await _connectionManager.SendToGroupAsync(groupName, eventType, new
            {
                Type = eventType,
                Data = data,
                Timestamp = DateTime.UtcNow
            });

            _logger.LogDebug("Sent {EventType} to group {GroupName}", eventType, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send {EventType} to group {GroupName}", eventType, groupName);
        }
    }
}

namespace ApiGateway.Services;

public interface IRealtimeDataService
{
    Task BroadcastUserUpdateAsync(object userData);
    Task BroadcastNewsUpdateAsync(object newsData);
    Task BroadcastPostUpdateAsync(object postData);
    Task BroadcastCommentUpdateAsync(object commentData);
    Task BroadcastAnalyticsUpdateAsync(object analyticsData);
    Task BroadcastSystemUpdateAsync(object systemData);
    Task BroadcastCustomEventAsync(string eventType, object data);
    Task SendToUserAsync(string userId, string eventType, object data);
    Task SendToGroupAsync(string groupName, string eventType, object data);
}

namespace ApiGateway.Services;

public interface IConnectionManager
{
    Task AddConnectionAsync(string userId, string connectionId);
    Task RemoveConnectionAsync(string userId, string connectionId);
    Task<List<string>> GetUserConnectionsAsync(string userId);
    Task<List<string>> GetAllConnectedUsersAsync();
    Task<bool> IsUserConnectedAsync(string userId);
    Task<int> GetConnectionCountAsync();
    Task<Dictionary<string, List<string>>> GetAllConnectionsAsync();

    // SignalR 메시지 전송 메서드들
    Task SendToUserAsync(string userId, string method, object? data = null);
    Task BroadcastToAllAsync(string method, object? data = null);
    Task SendToGroupAsync(string groupName, string method, object? data = null);
}

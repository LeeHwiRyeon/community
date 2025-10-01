using Microsoft.AspNetCore.SignalR;
using ApiGateway.Hubs;

namespace ApiGateway.Services;

public class ConnectionManager : IConnectionManager
{
    private readonly IHubContext<RealtimeHub> _hubContext;
    private readonly ILogger<ConnectionManager> _logger;
    private readonly Dictionary<string, List<string>> _userConnections = new();
    private readonly object _lock = new object();

    public ConnectionManager(IHubContext<RealtimeHub> hubContext, ILogger<ConnectionManager> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public Task AddConnectionAsync(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_userConnections.ContainsKey(userId))
            {
                _userConnections[userId] = new List<string>();
            }

            if (!_userConnections[userId].Contains(connectionId))
            {
                _userConnections[userId].Add(connectionId);
            }
        }

        _logger.LogDebug("Added connection {ConnectionId} for user {UserId}", connectionId, userId);
        return Task.CompletedTask;
    }

    public Task RemoveConnectionAsync(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (_userConnections.ContainsKey(userId))
            {
                _userConnections[userId].Remove(connectionId);

                if (_userConnections[userId].Count == 0)
                {
                    _userConnections.Remove(userId);
                }
            }
        }

        _logger.LogDebug("Removed connection {ConnectionId} for user {UserId}", connectionId, userId);
        return Task.CompletedTask;
    }

    public Task<List<string>> GetUserConnectionsAsync(string userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_userConnections.ContainsKey(userId)
                ? new List<string>(_userConnections[userId])
                : new List<string>());
        }
    }

    public Task<List<string>> GetAllConnectedUsersAsync()
    {
        lock (_lock)
        {
            return Task.FromResult(_userConnections.Keys.ToList());
        }
    }

    public Task<bool> IsUserConnectedAsync(string userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_userConnections.ContainsKey(userId) && _userConnections[userId].Count > 0);
        }
    }

    public Task<int> GetConnectionCountAsync()
    {
        lock (_lock)
        {
            return Task.FromResult(_userConnections.Values.Sum(connections => connections.Count));
        }
    }

    public Task<Dictionary<string, List<string>>> GetAllConnectionsAsync()
    {
        lock (_lock)
        {
            return Task.FromResult(new Dictionary<string, List<string>>(_userConnections));
        }
    }

    // 특정 사용자에게 메시지 전송
    public async Task SendToUserAsync(string userId, string method, object? data = null)
    {
        var connections = await GetUserConnectionsAsync(userId);

        foreach (var connectionId in connections)
        {
            await _hubContext.Clients.Client(connectionId).SendAsync(method, data);
        }
    }

    // 모든 연결된 사용자에게 메시지 전송
    public async Task BroadcastToAllAsync(string method, object? data = null)
    {
        await _hubContext.Clients.All.SendAsync(method, data);
    }

    // 특정 그룹에 메시지 전송
    public async Task SendToGroupAsync(string groupName, string method, object? data = null)
    {
        await _hubContext.Clients.Group(groupName).SendAsync(method, data);
    }
}

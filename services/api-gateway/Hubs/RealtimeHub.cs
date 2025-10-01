using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ApiGateway.Services;

namespace ApiGateway.Hubs;

[Authorize]
public class RealtimeHub : Hub
{
    private readonly ILogger<RealtimeHub> _logger;
    private readonly IConnectionManager _connectionManager;

    public RealtimeHub(ILogger<RealtimeHub> logger, IConnectionManager connectionManager)
    {
        _logger = logger;
        _connectionManager = connectionManager;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        await _connectionManager.AddConnectionAsync(userId, connectionId);

        _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);

        // 사용자에게 연결 성공 알림
        await Clients.Caller.SendAsync("Connected", new
        {
            ConnectionId = connectionId,
            UserId = userId,
            Timestamp = DateTime.UtcNow
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        var connectionId = Context.ConnectionId;

        await _connectionManager.RemoveConnectionAsync(userId, connectionId);

        _logger.LogInformation("User {UserId} disconnected from connection {ConnectionId}", userId, connectionId);

        await base.OnDisconnectedAsync(exception);
    }

    // 사용자가 특정 채널을 구독
    public async Task SubscribeToChannel(string channel)
    {
        var userId = GetUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, channel);

        _logger.LogInformation("User {UserId} subscribed to channel {Channel}", userId, channel);

        await Clients.Caller.SendAsync("Subscribed", new
        {
            Channel = channel,
            Timestamp = DateTime.UtcNow
        });
    }

    // 사용자가 특정 채널 구독 해제
    public async Task UnsubscribeFromChannel(string channel)
    {
        var userId = GetUserId();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channel);

        _logger.LogInformation("User {UserId} unsubscribed from channel {Channel}", userId, channel);

        await Clients.Caller.SendAsync("Unsubscribed", new
        {
            Channel = channel,
            Timestamp = DateTime.UtcNow
        });
    }

    // 특정 사용자에게 메시지 전송
    public async Task SendToUser(string targetUserId, string message, object? data = null)
    {
        var senderId = GetUserId();

        _logger.LogInformation("User {SenderId} sending message to user {TargetUserId}", senderId, targetUserId);

        await Clients.User(targetUserId).SendAsync("Message", new
        {
            From = senderId,
            To = targetUserId,
            Message = message,
            Data = data,
            Timestamp = DateTime.UtcNow
        });
    }

    // 특정 채널에 메시지 브로드캐스트
    public async Task BroadcastToChannel(string channel, string message, object? data = null)
    {
        var senderId = GetUserId();

        _logger.LogInformation("User {SenderId} broadcasting to channel {Channel}", senderId, channel);

        await Clients.Group(channel).SendAsync("Broadcast", new
        {
            From = senderId,
            Channel = channel,
            Message = message,
            Data = data,
            Timestamp = DateTime.UtcNow
        });
    }

    // 핑/퐁 테스트
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", new
        {
            Timestamp = DateTime.UtcNow
        });
    }

    private string GetUserId()
    {
        return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
    }
}

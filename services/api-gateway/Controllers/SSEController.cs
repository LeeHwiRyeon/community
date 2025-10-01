using Microsoft.AspNetCore.Mvc;
using ApiGateway.Models;
using ApiGateway.Services;
using System.Text;
using System.Text.Json;

namespace ApiGateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SSEController : ControllerBase
{
    private readonly IConnectionManager _connectionManager;
    private readonly ILogger<SSEController> _logger;
    private readonly Dictionary<string, CancellationTokenSource> _sseConnections = new();

    public SSEController(IConnectionManager connectionManager, ILogger<SSEController> logger)
    {
        _connectionManager = connectionManager;
        _logger = logger;
    }

    /// <summary>
    /// Server-Sent Events 스트림 시작
    /// </summary>
    [HttpGet("stream")]
    public async Task GetStream([FromQuery] string? userId = null)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");
        Response.Headers.Append("Access-Control-Allow-Origin", "*");
        Response.Headers.Append("Access-Control-Allow-Headers", "Cache-Control");

        var connectionId = Guid.NewGuid().ToString();
        var cancellationTokenSource = new CancellationTokenSource();

        lock (_sseConnections)
        {
            _sseConnections[connectionId] = cancellationTokenSource;
        }

        try
        {
            // 연결 시작 이벤트
            await WriteSSEEvent("connected", new
            {
                ConnectionId = connectionId,
                UserId = userId ?? "anonymous",
                Timestamp = DateTime.UtcNow
            });

            // 주기적으로 하트비트 전송
            _ = Task.Run(async () =>
            {
                while (!cancellationTokenSource.Token.IsCancellationRequested)
                {
                    await Task.Delay(30000, cancellationTokenSource.Token); // 30초마다
                    await WriteSSEEvent("heartbeat", new
                    {
                        Timestamp = DateTime.UtcNow
                    });
                }
            }, cancellationTokenSource.Token);

            // 연결이 유지되는 동안 대기
            await Task.Delay(Timeout.Infinite, cancellationTokenSource.Token);
        }
        catch (OperationCanceledException)
        {
            // 정상적인 연결 종료
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SSE connection error for connection {ConnectionId}", connectionId);
        }
        finally
        {
            lock (_sseConnections)
            {
                _sseConnections.Remove(connectionId);
            }
            cancellationTokenSource.Dispose();
        }
    }

    /// <summary>
    /// 특정 사용자에게 SSE 이벤트 전송
    /// </summary>
    [HttpPost("send/{userId}")]
    public async Task<ActionResult<ApiResponse<bool>>> SendToUser(string userId, [FromBody] SSEEventData eventData)
    {
        try
        {
            await _connectionManager.SendToUserAsync(userId, eventData.EventType, eventData.Data);

            return Ok(ApiResponse<bool>.SuccessResult(true, "SSE event sent successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SSE event to user {UserId}", userId);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Failed to send SSE event"));
        }
    }

    /// <summary>
    /// 모든 연결된 사용자에게 SSE 이벤트 브로드캐스트
    /// </summary>
    [HttpPost("broadcast")]
    public async Task<ActionResult<ApiResponse<bool>>> Broadcast([FromBody] SSEEventData eventData)
    {
        try
        {
            await _connectionManager.BroadcastToAllAsync(eventData.EventType, eventData.Data);

            return Ok(ApiResponse<bool>.SuccessResult(true, "SSE event broadcasted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast SSE event");
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Failed to broadcast SSE event"));
        }
    }

    /// <summary>
    /// 특정 그룹에 SSE 이벤트 전송
    /// </summary>
    [HttpPost("group/{groupName}")]
    public async Task<ActionResult<ApiResponse<bool>>> SendToGroup(string groupName, [FromBody] SSEEventData eventData)
    {
        try
        {
            await _connectionManager.SendToGroupAsync(groupName, eventData.EventType, eventData.Data);

            return Ok(ApiResponse<bool>.SuccessResult(true, "SSE event sent to group successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SSE event to group {GroupName}", groupName);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Failed to send SSE event to group"));
        }
    }

    /// <summary>
    /// 활성 SSE 연결 수 조회
    /// </summary>
    [HttpGet("connections")]
    public ActionResult<ApiResponse<SSEConnectionInfo>> GetConnections()
    {
        try
        {
            var connectionCount = _sseConnections.Count;
            var totalConnections = _connectionManager.GetConnectionCountAsync().Result;

            var info = new SSEConnectionInfo
            {
                SSEConnections = connectionCount,
                TotalConnections = totalConnections,
                Timestamp = DateTime.UtcNow
            };

            return Ok(ApiResponse<SSEConnectionInfo>.SuccessResult(info));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get connection info");
            return StatusCode(500, ApiResponse<SSEConnectionInfo>.ErrorResult("Failed to get connection info"));
        }
    }

    private async Task WriteSSEEvent(string eventType, object data)
    {
        var json = JsonSerializer.Serialize(data);
        var eventData = $"event: {eventType}\ndata: {json}\n\n";
        var bytes = Encoding.UTF8.GetBytes(eventData);

        await Response.Body.WriteAsync(bytes);
        await Response.Body.FlushAsync();
    }
}

// SSE 이벤트 데이터 모델
public class SSEEventData
{
    public string EventType { get; set; } = string.Empty;
    public object? Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

// SSE 연결 정보 모델
public class SSEConnectionInfo
{
    public int SSEConnections { get; set; }
    public int TotalConnections { get; set; }
    public DateTime Timestamp { get; set; }
}

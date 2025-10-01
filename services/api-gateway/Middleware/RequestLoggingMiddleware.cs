using ApiGateway.Models;
using System.Diagnostics;

namespace ApiGateway.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = Guid.NewGuid().ToString();
        context.Items["RequestId"] = requestId;

        var stopwatch = Stopwatch.StartNew();
        var requestLog = new RequestLog
        {
            RequestId = requestId,
            Method = context.Request.Method,
            Path = context.Request.Path.Value ?? "",
            QueryString = context.Request.QueryString.Value ?? "",
            Headers = context.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()),
            UserId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
            IpAddress = GetClientIpAddress(context),
            UserAgent = context.Request.Headers.UserAgent.ToString(),
            Timestamp = DateTime.UtcNow
        };

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            requestLog.Error = ex.Message;
            _logger.LogError(ex, "Request {RequestId} failed: {Method} {Path}", requestId, requestLog.Method, requestLog.Path);
            throw;
        }
        finally
        {
            stopwatch.Stop();
            requestLog.ResponseTimeMs = stopwatch.ElapsedMilliseconds;
            requestLog.StatusCode = context.Response.StatusCode;
            requestLog.ServiceName = context.Items["ServiceName"]?.ToString();

            LogRequest(requestLog);
        }
    }

    private void LogRequest(RequestLog requestLog)
    {
        var logLevel = requestLog.StatusCode switch
        {
            >= 200 and < 300 => LogLevel.Information,
            >= 300 and < 400 => LogLevel.Information,
            >= 400 and < 500 => LogLevel.Warning,
            >= 500 => LogLevel.Error,
            _ => LogLevel.Information
        };

        _logger.Log(logLevel,
            "Request {RequestId}: {Method} {Path} - {StatusCode} in {ResponseTimeMs}ms - User: {UserId} - IP: {IpAddress} - Service: {ServiceName}",
            requestLog.RequestId,
            requestLog.Method,
            requestLog.Path,
            requestLog.StatusCode,
            requestLog.ResponseTimeMs,
            requestLog.UserId ?? "Anonymous",
            requestLog.IpAddress,
            requestLog.ServiceName ?? "Unknown");

        if (!string.IsNullOrEmpty(requestLog.Error))
        {
            _logger.LogError("Request {RequestId} error: {Error}", requestLog.RequestId, requestLog.Error);
        }
    }

    private string GetClientIpAddress(HttpContext context)
    {
        var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (string.IsNullOrEmpty(ipAddress))
        {
            ipAddress = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        }
        if (string.IsNullOrEmpty(ipAddress))
        {
            ipAddress = context.Connection.RemoteIpAddress?.ToString();
        }
        return ipAddress ?? "unknown";
    }
}

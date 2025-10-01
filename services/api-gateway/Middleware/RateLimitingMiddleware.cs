using ApiGateway.Services;
using System.Security.Claims;
using System.Text.Json;

namespace ApiGateway.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IRateLimiter _rateLimiter;
    private readonly ILogger<RateLimitingMiddleware> _logger;

    public RateLimitingMiddleware(RequestDelegate next, IRateLimiter rateLimiter, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            var key = GetRateLimitKey(context);
            var endpoint = GetEndpointKey(context);

            var isAllowed = await _rateLimiter.IsAllowedAsync(key, 100, TimeSpan.FromMinutes(1));

            if (!isAllowed)
            {
                var remaining = await _rateLimiter.GetRemainingRequestsAsync(key, 100, TimeSpan.FromMinutes(1));

                context.Response.StatusCode = 429; // Too Many Requests
                context.Response.Headers.Append("Retry-After", "60");
                context.Response.Headers.Append("X-RateLimit-Limit", "100");
                context.Response.Headers.Append("X-RateLimit-Remaining", remaining.ToString());

                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = "Rate limit exceeded",
                    message = "Too many requests. Try again in 1 minute.",
                    retryAfter = 60,
                    limit = 100,
                    remaining = remaining
                }));

                _logger.LogWarning("Rate limit exceeded for key {Key}", key);
                return;
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in rate limiting middleware");
            await _next(context);
        }
    }

    private string GetRateLimitKey(HttpContext context)
    {
        var key = "";

        // Try user-based limiting first
        var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            key = $"user:{userId}";
        }

        // Fall back to IP-based limiting
        if (string.IsNullOrEmpty(key))
        {
            var ipAddress = GetClientIpAddress(context);
            key = $"ip:{ipAddress}";
        }

        // Fall back to anonymous
        if (string.IsNullOrEmpty(key))
        {
            key = "anonymous";
        }

        return key;
    }

    private string GetEndpointKey(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";
        var method = context.Request.Method.ToUpper();
        return $"{method}:{path}";
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

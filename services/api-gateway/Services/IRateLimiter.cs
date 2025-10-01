namespace ApiGateway.Services;

public interface IRateLimiter
{
    Task<bool> IsAllowedAsync(string key, int limit, TimeSpan window);
    Task<int> GetRemainingRequestsAsync(string key, int limit, TimeSpan window);
    Task ResetAsync(string key);
}
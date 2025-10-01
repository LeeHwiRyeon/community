using StackExchange.Redis;
using System.Text.Json;

namespace ApiGateway.Services;

public class RedisRateLimiter : IRateLimiter
{
    private readonly IDatabase _database;
    private readonly ILogger<RedisRateLimiter> _logger;

    public RedisRateLimiter(IConnectionMultiplexer redis, ILogger<RedisRateLimiter> logger)
    {
        _database = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<bool> IsAllowedAsync(string key, int limit, TimeSpan window)
    {
        try
        {
            var redisKey = $"rate_limit:{key}";
            var current = await _database.StringIncrementAsync(redisKey);

            if (current == 1)
            {
                await _database.KeyExpireAsync(redisKey, window);
            }

            return current <= limit;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check rate limit for key {Key}", key);
            return true; // Allow on error
        }
    }

    public async Task<int> GetRemainingRequestsAsync(string key, int limit, TimeSpan window)
    {
        try
        {
            var redisKey = $"rate_limit:{key}";
            var current = await _database.StringGetAsync(redisKey);

            if (!current.HasValue)
                return limit;

            var currentCount = (int)current;
            return Math.Max(0, limit - currentCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get remaining requests for key {Key}", key);
            return limit;
        }
    }

    public async Task ResetAsync(string key)
    {
        try
        {
            var redisKey = $"rate_limit:{key}";
            await _database.KeyDeleteAsync(redisKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reset rate limit for key {Key}", key);
        }
    }
}
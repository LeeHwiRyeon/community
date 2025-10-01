using StackExchange.Redis;
using System.Text.Json;

namespace ChatService.Services;

public class RedisCacheService : ICacheService
{
    private readonly IDatabase _database;
    private readonly JsonSerializerOptions _jsonOptions;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        try
        {
            var value = await _database.StringGetAsync(key);
            if (!value.HasValue)
                return null;

            return JsonSerializer.Deserialize<T>(value, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        try
        {
            var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
            await _database.StringSetAsync(key, serializedValue, expiration);
        }
        catch (Exception)
        {
            // 로깅 처리
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _database.KeyDeleteAsync(key);
        }
        catch (Exception)
        {
            // 로깅 처리
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            return await _database.KeyExistsAsync(key);
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<TimeSpan?> GetExpirationAsync(string key)
    {
        try
        {
            return await _database.KeyTimeToLiveAsync(key);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task SetExpirationAsync(string key, TimeSpan expiration)
    {
        try
        {
            await _database.KeyExpireAsync(key, expiration);
        }
        catch (Exception)
        {
            // 로깅 처리
        }
    }
}

namespace UserService.Services;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;
    Task RemoveAsync(string key);
    Task<bool> ExistsAsync(string key);
    Task<TimeSpan?> GetExpirationAsync(string key);
    Task SetExpirationAsync(string key, TimeSpan expiration);
}


using StackExchange.Redis;
using System.Text.Json;

namespace PatientService.API.Services;

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
}

public class RedisCacheService : IRedisCacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var db = _redis.GetDatabase();
            var value = await db.StringGetAsync(key);

            if (value.IsNullOrEmpty)
            {
                _logger.LogInformation("Cache miss for key: {Key}", key);
                return default;
            }

            _logger.LogInformation("Cache hit for key: {Key}", key);
            return JsonSerializer.Deserialize<T>(value.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting value from cache for key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var db = _redis.GetDatabase();
            var serialized = JsonSerializer.Serialize(value);
            await db.StringSetAsync(key, serialized, expiration ?? TimeSpan.FromMinutes(10));
            _logger.LogInformation("Cached value for key: {Key} with expiration: {Expiration}", key, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting value in cache for key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(key);
            _logger.LogInformation("Removed cache for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing value from cache for key: {Key}", key);
        }
    }
}

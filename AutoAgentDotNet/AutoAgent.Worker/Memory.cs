// Memory.cs (SQLite 영속 메모리)
// ------------------------------------------------------------
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace AutoAgent.Worker;

public interface IAgentMemory
{
    ValueTask SaveAsync(string key, string value, CancellationToken token);
    ValueTask<string?> LoadAsync(string key, CancellationToken token);
    ValueTask<IReadOnlyList<string>> LoadRecentAsync(int take, CancellationToken token);
}

public sealed class SqliteAgentMemory : IAgentMemory
{
    private readonly string _cs;
    private readonly ILogger<SqliteAgentMemory> _logger;

    public SqliteAgentMemory(IOptions<AgentOptions> opt, ILogger<SqliteAgentMemory> logger)
    {
        _cs = $"Data Source={opt.Value.StoragePath}";
        _logger = logger;
        Init();
    }

    private void Init()
    {
        using var conn = new SqliteConnection(_cs);
        conn.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText =
            @"CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT);
              CREATE TABLE IF NOT EXISTS logs (ts TEXT, key TEXT, value TEXT);";
        cmd.ExecuteNonQuery();
    }

    public async ValueTask SaveAsync(string key, string value, CancellationToken token)
    {
        await using var conn = new SqliteConnection(_cs);
        await conn.OpenAsync(token);
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "INSERT INTO kv(key,value,updated_at) VALUES($k,$v,$t) ON CONFLICT(key) DO UPDATE SET value=$v, updated_at=$t;";
            cmd.Parameters.AddWithValue("$k", key);
            cmd.Parameters.AddWithValue("$v", value);
            cmd.Parameters.AddWithValue("$t", DateTimeOffset.UtcNow.ToString("o"));
            await cmd.ExecuteNonQueryAsync(token);
        }
        await using (var log = conn.CreateCommand())
        {
            log.CommandText = "INSERT INTO logs(ts,key,value) VALUES($t,$k,$v);";
            log.Parameters.AddWithValue("$t", DateTimeOffset.UtcNow.ToString("o"));
            log.Parameters.AddWithValue("$k", key);
            log.Parameters.AddWithValue("$v", value.Length > 5000 ? value.Substring(0, 5000) : value);
            await log.ExecuteNonQueryAsync(token);
        }
    }

    public async ValueTask<string?> LoadAsync(string key, CancellationToken token)
    {
        await using var conn = new SqliteConnection(_cs);
        await conn.OpenAsync(token);
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT value FROM kv WHERE key=$k;";
        cmd.Parameters.AddWithValue("$k", key);
        var o = await cmd.ExecuteScalarAsync(token);
        return o?.ToString();
    }

    public async ValueTask<IReadOnlyList<string>> LoadRecentAsync(int take, CancellationToken token)
    {
        await using var conn = new SqliteConnection(_cs);
        await conn.OpenAsync(token);
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT ts||' | '||key||' | '||substr(value,1,200) FROM logs ORDER BY ts DESC LIMIT $n;";
        cmd.Parameters.AddWithValue("$n", take);
        var list = new List<string>();
        await using var r = await cmd.ExecuteReaderAsync(token);
        while (await r.ReadAsync(token))
        {
            list.Add(r.GetString(0));
        }
        return list.AsReadOnly();
    }
}

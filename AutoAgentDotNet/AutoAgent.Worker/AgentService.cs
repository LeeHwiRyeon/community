// AgentService.cs (작업 소비자 루프)
// ------------------------------------------------------------
using Microsoft.Extensions.Options;

namespace AutoAgent.Worker;

public sealed class AgentService : BackgroundService
{
    private readonly ITaskQueue _queue;
    private readonly IPlanner _planner;
    private readonly IExecutor _executor;
    private readonly IAgentMemory _memory;
    private readonly AgentOptions _opt;
    private readonly ILogger<AgentService> _logger;

    public AgentService(ITaskQueue q, IPlanner p, IExecutor e, IAgentMemory m, IOptions<AgentOptions> opt, ILogger<AgentService> logger)
    {
        _queue = q; _planner = p; _executor = e; _memory = m; _opt = opt.Value; _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Agent loop start");
        while (stoppingToken.IsCancellationRequested == false)
        {
            TaskRequest request;
            try
            {
                request = await _queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            using var cts = new CancellationTokenSource();
            var maxRun = request.MaxRunTime ?? TimeSpan.FromSeconds(_opt.DefaultMaxRunTimeSeconds);
            cts.CancelAfter(maxRun);
            using var linked = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, cts.Token);

            try
            {
                var key = request.IdempotencyKey ?? $"{request.Objective}:{request.Deadline?.ToString("o")}";
                var done = await _memory.LoadAsync($"done:{key}", linked.Token);
                if (string.IsNullOrWhiteSpace(done) == false)
                {
                    _logger.LogInformation("Skip duplicated task: {Key}", key);
                    continue;
                }

                var plan = await _planner.CreatePlanAsync(request, linked.Token);
                var result = await _executor.ExecuteAsync(request, plan, _memory, linked.Token);

                if (result.Success)
                {
                    await _memory.SaveAsync($"done:{key}", "true", linked.Token);
                    _logger.LogInformation("Task success: {Objective}", request.Objective);
                }
                else
                {
                    _logger.LogWarning("Task failed: {Objective} | {Reason}", request.Objective, result.Output);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Task crashed: {Objective}", request.Objective);
            }
        }
        _logger.LogInformation("Agent loop stop");
    }
}

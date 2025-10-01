// RecurringSchedulerService.cs (주기적 트리거)
// ------------------------------------------------------------
using Microsoft.Extensions.Options;

namespace AutoAgent.Worker;

/// <summary>
/// appsettings.json 의 RecurringWorkflows 를 읽어 각자 타이머로 큐에 넣습니다.
/// </summary>
public sealed class RecurringSchedulerService : BackgroundService
{
    private readonly ITaskQueue _queue;
    private readonly SchedulerOptions _sched;
    private readonly ILogger<RecurringSchedulerService> _logger;
    private readonly List<(PeriodicTimer Timer, RecurringWorkflowOptions Wf)> _timers = new();

    public RecurringSchedulerService(ITaskQueue queue, IOptions<SchedulerOptions> sched, ILogger<RecurringSchedulerService> logger)
    {
        _queue = queue; _sched = sched.Value; _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_sched.RecurringWorkflows == null || _sched.RecurringWorkflows.Count == 0)
        {
            _logger.LogWarning("No recurring workflows configured");
            return;
        }

        foreach (var wf in _sched.RecurringWorkflows)
        {
            var minutes = wf.PeriodMinutes <= 0 ? 5 : wf.PeriodMinutes;
            _timers.Add((new PeriodicTimer(TimeSpan.FromMinutes(minutes)), wf));
        }

        _logger.LogInformation("Recurring scheduler started");

        // 초기 즉시 실행 1회
        foreach (var t in _timers)
        {
            _ = EnqueueOnce(t.Wf, stoppingToken);
        }

        // 주기 실행
        while (stoppingToken.IsCancellationRequested == false)
        {
            foreach (var (timer, wf) in _timers.ToArray())
            {
                try
                {
                    var tick = await timer.WaitForNextTickAsync(stoppingToken);
                    if (tick == false) { continue; }
                    await EnqueueOnce(wf, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // 종료
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Scheduler tick failed: {Objective}", wf.Objective);
                }
            }
        }
    }

    private async Task EnqueueOnce(RecurringWorkflowOptions wf, CancellationToken token)
    {
        var req = new TaskRequest(
            Objective: wf.Objective,
            Context: wf.Context != null ? new Dictionary<string, string>(wf.Context) : null,
            MaxSteps: null,
            MaxRunTime: null,
            IdempotencyKey: $"{wf.Objective}:{DateTimeOffset.UtcNow:yyyy-MM-dd-HH-mm}",
            Priority: wf.Priority
        );
        await _queue.EnqueueAsync(req, token);
    }
}

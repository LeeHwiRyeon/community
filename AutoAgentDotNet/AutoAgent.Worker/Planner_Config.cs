// Planner_Config.cs (설정 기반 Planner + 치환자)
// ------------------------------------------------------------
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace AutoAgent.Worker;

public interface IPlanner
{
    Task<Plan> CreatePlanAsync(TaskRequest request, CancellationToken token);
}

public sealed class ConfigPlanner : IPlanner
{
    private readonly SchedulerOptions _sched;
    private readonly AgentOptions _agent;
    private readonly ILogger<ConfigPlanner> _logger;

    public ConfigPlanner(IOptions<SchedulerOptions> s, IOptions<AgentOptions> a, ILogger<ConfigPlanner> logger)
    {
        _sched = s.Value;
        _agent = a.Value;
        _logger = logger;
    }

    public Task<Plan> CreatePlanAsync(TaskRequest request, CancellationToken token)
    {
        // 1) Objective 매칭
        var wf = _sched.RecurringWorkflows.FirstOrDefault(x => string.Equals(x.Objective, request.Objective, StringComparison.OrdinalIgnoreCase));
        if (wf == null)
        {
            // 미지정이면: 기본 2단계 계획 (홈페이지 → 파일)
            var outPath = Resolve("%ctx:out%", request.Context);
            if (string.IsNullOrWhiteSpace(outPath)) { outPath = "artifacts/out.txt"; }
            var steps = new List<PlanStep>
            {
                new PlanStep(1, "http.get", "https://example.com"),
                new PlanStep(2, "file.write", outPath)
            };
            return Task.FromResult(new Plan(steps));
        }

        // 2) Context 병합(스케줄러 Context + 요청 Context)
        var ctx = new Dictionary<string, string>(wf.Context ?? new Dictionary<string, string>(), StringComparer.OrdinalIgnoreCase);
        if (request.Context != null)
        {
            foreach (var kv in request.Context) { ctx[kv.Key] = kv.Value; }
        }

        // 3) 치환자 처리
        string Resolver(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) { return string.Empty; }
            var s = raw;

            // %ctx:key%
            foreach (var kv in ctx)
            {
                s = s.Replace($"%ctx:{kv.Key}%", kv.Value, StringComparison.OrdinalIgnoreCase);
            }

            // %now:format%
            s = Regex.Replace(s, "%now:([^%]+)%", m =>
            {
                var fmt = m.Groups[1].Value;
                return DateTimeOffset.Now.ToString(fmt);
            });

            return s;
        }

        var planned = wf.Plan
            .OrderBy(p => p.Order)
            .Select(p => new PlanStep(p.Order, p.Tool, Resolver(p.Input)))
            .ToList();

        // 4) MaxSteps 제한
        var maxSteps = request.MaxSteps ?? _agent.DefaultMaxSteps;
        planned = planned.Take(Math.Max(1, maxSteps)).ToList();

        return Task.FromResult(new Plan(planned));
    }

    private static string Resolve(string? token, Dictionary<string, string>? ctx)
    {
        if (string.IsNullOrWhiteSpace(token)) { return string.Empty; }
        if (token.StartsWith("%ctx:", StringComparison.OrdinalIgnoreCase) && token.EndsWith("%", StringComparison.OrdinalIgnoreCase))
        {
            var key = token.Substring(5, token.Length - 6);
            if (ctx != null && ctx.TryGetValue(key, out var val)) { return val; }
            return string.Empty;
        }
        return token;
    }
}

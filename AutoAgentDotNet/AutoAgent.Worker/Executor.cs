// Executor.cs
// ------------------------------------------------------------
using Microsoft.Extensions.Options;

namespace AutoAgent.Worker;

public interface IExecutor
{
    Task<StepResult> ExecuteAsync(TaskRequest request, Plan plan, IAgentMemory memory, CancellationToken token);
}

public sealed class SimpleExecutor : IExecutor
{
    private readonly IReadOnlyDictionary<string, ITool> _tools;
    private readonly ILogger<SimpleExecutor> _logger;
    private readonly AgentOptions _opt;

    public SimpleExecutor(IEnumerable<ITool> tools, ILogger<SimpleExecutor> logger, IOptions<AgentOptions> opt)
    {
        _tools = tools.ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);
        _logger = logger;
        _opt = opt.Value;
    }

    public async Task<StepResult> ExecuteAsync(TaskRequest request, Plan plan, IAgentMemory memory, CancellationToken token)
    {
        string lastOutput = string.Empty;
        var maxChars = _opt.Policy.MaxCharsPerStep;
        foreach (var step in plan.Steps.OrderBy(s => s.Order))
        {
            token.ThrowIfCancellationRequested();

            var hasTool = _tools.TryGetValue(step.Tool, out var tool);
            if (hasTool == false)
            {
                return new StepResult(false, $"Tool not found: {step.Tool}");
            }

            var can = await tool.CanHandleAsync(step, token);
            if (can == false)
            {
                return new StepResult(false, $"Tool cannot handle step: {step.Tool}");
            }

            // 재시도 정책
            StepResult? result = null;
            for (int attempt = 0; attempt <= _opt.Policy.MaxRetries; attempt++)
            {
                try
                {
                    var input = step.Input;
                    result = await tool.RunAsync(input ?? string.Empty, lastOutput, token);
                    // 안전한 로그/메모리 기록
                    var save = result.Output.Length > maxChars ? result.Output.Substring(0, (int)maxChars) : result.Output;
                    await memory.SaveAsync($"step:{request.Objective}:{step.Order}:{step.Tool}", save, token);
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Step error: {Tool} (attempt {Attempt})", step.Tool, attempt + 1);
                    if (attempt < _opt.Policy.MaxRetries)
                    {
                        await Task.Delay(_opt.Policy.BackoffMs, token);
                    }
                    else
                    {
                        return new StepResult(false, $"Step crashed: {ex.Message}");
                    }
                }
            }

            if (result == null) { return new StepResult(false, "Unknown step failure"); }
            if (result.Success == false) { return result; }

            lastOutput = result.Output;

            if (result.IsTerminal)
            {
                return result;
            }
        }
        return new StepResult(true, lastOutput);
    }
}

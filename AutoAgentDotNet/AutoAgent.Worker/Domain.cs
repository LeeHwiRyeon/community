// Domain.cs
// ------------------------------------------------------------
namespace AutoAgent.Worker;

public sealed record TaskRequest(
    string Objective,
    Dictionary<string, string>? Context = null,
    int? MaxSteps = null,
    TimeSpan? MaxRunTime = null,
    string? IdempotencyKey = null,
    DateTimeOffset? Deadline = null,
    int Priority = 0);

public sealed record Plan(List<PlanStep> Steps);
public sealed record PlanStep(int Order, string Tool, string? Input);
public sealed record StepResult(bool Success, string Output, Dictionary<string, string>? Artifacts = null, bool IsTerminal = false);

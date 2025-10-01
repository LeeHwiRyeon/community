// Options.cs
// ------------------------------------------------------------
namespace AutoAgent.Worker;

public sealed class AgentOptions
{
    public int DefaultMaxSteps { get; set; } = 8;
    public int DefaultMaxRunTimeSeconds { get; set; } = 60;
    public PolicyOptions Policy { get; set; } = new();
    public string StoragePath { get; set; } = "agent.db";
}

public sealed class PolicyOptions
{
    public int MaxRetries { get; set; } = 2;
    public int BackoffMs { get; set; } = 1500;
    public long MaxCharsPerStep { get; set; } = 100_000;
}

public sealed class SchedulerOptions
{
    public List<RecurringWorkflowOptions> RecurringWorkflows { get; set; } = new();
}

public sealed class RecurringWorkflowOptions
{
    public string Objective { get; set; } = string.Empty;
    public int PeriodMinutes { get; set; } = 5;
    public int Priority { get; set; } = 0;
    public Dictionary<string, string>? Context { get; set; } = new();
    public List<PlanStepOptions> Plan { get; set; } = new();
}

public sealed class PlanStepOptions
{
    public int Order { get; set; }
    public string Tool { get; set; } = string.Empty;
    public string? Input { get; set; }
}

// Tools.cs
// ------------------------------------------------------------
using Microsoft.Extensions.Options;
using System.Xml.Linq;

namespace AutoAgent.Worker;

public interface ITool
{
    string Name { get; }
    Task<bool> CanHandleAsync(PlanStep step, CancellationToken token);
    Task<StepResult> RunAsync(string input, string? previousOutput, CancellationToken token);
}

// HTTP GET
public sealed class HttpGetTool : ITool
{
    public string Name => "http.get";
    private readonly IHttpClientFactory _factory;
    private readonly AgentOptions _opt;

    public HttpGetTool(IHttpClientFactory factory, IOptions<AgentOptions> opt)
    {
        _factory = factory;
        _opt = opt.Value;
    }

    public Task<bool> CanHandleAsync(PlanStep step, CancellationToken token)
    {
        var ok = step.Input != null && step.Input.StartsWith("http", StringComparison.OrdinalIgnoreCase);
        return Task.FromResult(ok);
    }

    public async Task<StepResult> RunAsync(string input, string? previousOutput, CancellationToken token)
    {
        var http = _factory.CreateClient();
        using var res = await http.GetAsync(input, token);
        var body = await res.Content.ReadAsStringAsync(token);
        var ok = res.IsSuccessStatusCode;
        if (ok == false)
        {
            return new StepResult(false, $"HTTP {res.StatusCode}");
        }
        if (body.Length > _opt.Policy.MaxCharsPerStep)
        {
            body = body.Substring(0, (int)_opt.Policy.MaxCharsPerStep);
        }
        return new StepResult(true, body);
    }
}

// RSS 상위 N개 추출
public sealed class RssTopTool : ITool
{
    public string Name => "rss.top";

    public Task<bool> CanHandleAsync(PlanStep step, CancellationToken token)
    {
        // 입력 N(숫자) 필요, 실제 컨텐츠는 previousOutput에서 받음
        var ok = int.TryParse(step.Input, out var _);
        return Task.FromResult(ok);
    }

    public Task<StepResult> RunAsync(string input, string? previousOutput, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(previousOutput))
        {
            return Task.FromResult(new StepResult(false, "No RSS content"));
        }
        int n = 3;
        int.TryParse(input, out n);
        if (n <= 0) { n = 3; }

        try
        {
            var doc = XDocument.Parse(previousOutput);
            var items = doc.Descendants("item").Take(n).Select(x =>
            {
                var title = x.Element("title")?.Value?.Trim() ?? "(no title)";
                var link = x.Element("link")?.Value?.Trim() ?? string.Empty;
                var pub = x.Element("pubDate")?.Value?.Trim() ?? string.Empty;
                return $"- {title}\n  {link}\n  {pub}";
            });

            var text = string.Join("\n", items);
            if (string.IsNullOrWhiteSpace(text))
            {
                return Task.FromResult(new StepResult(false, "RSS parse produced no items"));
            }
            return Task.FromResult(new StepResult(true, text));
        }
        catch (Exception ex)
        {
            return Task.FromResult(new StepResult(false, $"RSS parse error: {ex.Message}"));
        }
    }
}

// 파일 기록
public sealed class FileWriteTool : ITool
{
    public string Name => "file.write";

    public Task<bool> CanHandleAsync(PlanStep step, CancellationToken token)
    {
        var ok = string.IsNullOrWhiteSpace(step.Input) == false;
        return Task.FromResult(ok);
    }

    public async Task<StepResult> RunAsync(string input, string? previousOutput, CancellationToken token)
    {
        // input: 경로, previousOutput: 내용
        if (string.IsNullOrWhiteSpace(previousOutput))
        {
            return new StepResult(false, "No content to write");
        }

        var isUnsafe = input.Contains("..") || input.Contains(":");
        if (isUnsafe)
        {
            return new StepResult(false, "Unsafe path");
        }

        var path = Path.GetFullPath(input, Directory.GetCurrentDirectory());
        var dir = Path.GetDirectoryName(path);
        if (string.IsNullOrWhiteSpace(dir) == false && Directory.Exists(dir) == false)
        {
            Directory.CreateDirectory(dir);
        }

        await File.WriteAllTextAsync(path, previousOutput, token);
        return new StepResult(true, $"saved:{path}", new Dictionary<string, string> { ["path"] = path }, IsTerminal: true);
    }
}

// 웹훅 POST (선택)
// input: URL, previousOutput: 전송할 텍스트
public sealed class WebhookPostTool : ITool
{
    public string Name => "webhook.post";
    private readonly IHttpClientFactory _factory;

    public WebhookPostTool(IHttpClientFactory factory) { _factory = factory; }

    public Task<bool> CanHandleAsync(PlanStep step, CancellationToken token)
    {
        var ok = step.Input != null && step.Input.StartsWith("http", StringComparison.OrdinalIgnoreCase);
        return Task.FromResult(ok);
    }

    public async Task<StepResult> RunAsync(string input, string? previousOutput, CancellationToken token)
    {
        var http = _factory.CreateClient();
        var content = new StringContent($"{{\"content\":\"{Escape(previousOutput)}\"}}", System.Text.Encoding.UTF8, "application/json");
        using var res = await http.PostAsync(input, content, token);
        var ok = res.IsSuccessStatusCode;
        if (ok == false)
        {
            return new StepResult(false, $"Webhook HTTP {res.StatusCode}");
        }
        return new StepResult(true, "webhook:ok");
    }

    private static string Escape(string? s)
    {
        if (s == null) { return string.Empty; }
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "\\r").Replace("\n", "\\n");
    }
}

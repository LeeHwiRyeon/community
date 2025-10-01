// Program.cs
// ------------------------------------------------------------
using System.Collections.Concurrent;
using System.Threading.Channels;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http;
using System.Xml.Linq;
using AutoAgent.Worker;

var builder = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration((ctx, cfg) =>
    {
        // appsettings.json 자동 로드 (기본 템플릿 기능)
    })
    .ConfigureServices((ctx, services) =>
    {
        services.Configure<AgentOptions>(ctx.Configuration.GetSection("Agent"));
        services.Configure<SchedulerOptions>(ctx.Configuration.GetSection("Scheduler"));

        // Core
        services.AddSingleton<ITaskQueue, ChannelTaskQueue>();
        services.AddSingleton<IAgentMemory, SqliteAgentMemory>();
        services.AddSingleton<IPlanner, ConfigPlanner>(); // 설정 기반 Planner
        services.AddSingleton<IExecutor, SimpleExecutor>();

        // Tools
        services.AddHttpClient();
        services.AddSingleton<ITool, HttpGetTool>();
        services.AddSingleton<ITool, RssTopTool>();
        services.AddSingleton<ITool, FileWriteTool>();
        services.AddSingleton<ITool, WebhookPostTool>(); // 선택 사용

        // Background services
        services.AddHostedService<AgentService>();            // 소비자 루프
        services.AddHostedService<RecurringSchedulerService>(); // 주기적 트리거
    })
    .ConfigureLogging(logging =>
    {
        logging.SetMinimumLevel(LogLevel.Information);
    });

await builder.Build().RunAsync();

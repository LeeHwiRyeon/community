using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Services;
using NotificationService.Hubs;
using StackExchange.Redis;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog 설정
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/notification-service-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// 서비스 등록
builder.Services.AddDbContext<NotificationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection") ??
        "Server=localhost;Database=community_notifications;Uid=root;Pwd=password;",
        new MySqlServerVersion(new Version(8, 0, 0))
    ));

// Redis 설정
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(configuration);
});

// 서비스 등록
builder.Services.AddScoped<INotificationService, NotificationService.Services.NotificationService>();

// SignalR 설정
builder.Services.AddSignalR();

// CORS 설정
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 컨트롤러 및 API 설정
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Notification Service API", Version = "v1" });
});

var app = builder.Build();

// 미들웨어 설정
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseRouting();

// SignalR 허브 매핑
app.MapHub<NotificationHub>("/notificationHub");

// 컨트롤러 매핑
app.MapControllers();

// 데이터베이스 마이그레이션
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    try
    {
        context.Database.EnsureCreated();
        Log.Information("Database initialized successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while initializing the database");
    }
}

Log.Information("Notification Service starting...");

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

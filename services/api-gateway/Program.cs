using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ApiGateway.Services;
using ApiGateway.Middleware;
using ApiGateway.Models;
using ApiGateway.Hubs;
using StackExchange.Redis;
using Consul;
using Serilog;
using Yarp.ReverseProxy.Configuration;
using Polly;
using Polly.Extensions.Http;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/api-gateway-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "API Gateway", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });
    c.AddSecurityRequirement(new()
    {
        {
            new()
            {
                Reference = new()
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379"));

// Consul
builder.Services.AddSingleton<IConsulClient>(sp =>
    new ConsulClient(c => c.Address = new Uri(builder.Configuration["Consul:Address"] ?? "http://localhost:8500")));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found"))
            )
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddScoped<IServiceDiscovery, ConsulServiceDiscovery>();
builder.Services.AddScoped<ILoadBalancer, RoundRobinLoadBalancer>();
builder.Services.AddScoped<IRateLimiter, RedisRateLimiter>();
builder.Services.AddSingleton<IConnectionManager, ConnectionManager>();
builder.Services.AddScoped<IRealtimeDataService, RealtimeDataService>();

// SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

// HTTP Client with Polly
builder.Services.AddHttpClient("GatewayClient")
    .AddPolicyHandler(GetRetryPolicy())
    .AddPolicyHandler(GetCircuitBreakerPolicy());

// YARP Reverse Proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API Gateway v1");
        c.RoutePrefix = string.Empty; // Swagger UI at root
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Custom middleware
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapReverseProxy();

// SignalR Hub
app.MapHub<RealtimeHub>("/realtime");

// Register services on startup
using (var scope = app.Services.CreateScope())
{
    var serviceDiscovery = scope.ServiceProvider.GetRequiredService<IServiceDiscovery>();

    // Register API Gateway itself
    await serviceDiscovery.RegisterServiceAsync(new ServiceRegistration
    {
        ServiceId = "api-gateway-1",
        ServiceName = "api-gateway",
        Host = "localhost",
        Port = 7000,
        HealthCheckUrl = "/api/gateway/health"
    });

    // Register other services
    var services = new[]
    {
        new ServiceRegistration
        {
            ServiceId = "user-service-1",
            ServiceName = "user-service",
            Host = "localhost",
            Port = 7001,
            HealthCheckUrl = "/health"
        },
        new ServiceRegistration
        {
            ServiceId = "content-service-1",
            ServiceName = "content-service",
            Host = "localhost",
            Port = 7002,
            HealthCheckUrl = "/health"
        },
        new ServiceRegistration
        {
            ServiceId = "chat-service-1",
            ServiceName = "chat-service",
            Host = "localhost",
            Port = 7003,
            HealthCheckUrl = "/health"
        },
        new ServiceRegistration
        {
            ServiceId = "notification-service-1",
            ServiceName = "notification-service",
            Host = "localhost",
            Port = 7004,
            HealthCheckUrl = "/health"
        }
    };

    foreach (var service in services)
    {
        try
        {
            await serviceDiscovery.RegisterServiceAsync(service);
            Log.Information("Service {ServiceId} registered successfully", service.ServiceId);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to register service {ServiceId}", service.ServiceId);
        }
    }
}

Log.Information("API Gateway starting up...");

app.Run();

// Polly policies
static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(
            retryCount: 3,
            sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
            onRetry: (outcome, timespan, retryCount, context) =>
            {
                Log.Warning("Retry {RetryCount} for {PolicyKey} in {Delay}ms", retryCount, context.PolicyKey, timespan.TotalMilliseconds);
            });
}

static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(
            handledEventsAllowedBeforeBreaking: 5,
            durationOfBreak: TimeSpan.FromSeconds(30),
            onBreak: (exception, duration) =>
            {
                Log.Warning("Circuit breaker opened for {Duration}ms", duration.TotalMilliseconds);
            },
            onReset: () =>
            {
                Log.Information("Circuit breaker reset");
            });
}

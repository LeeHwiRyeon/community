using System.ComponentModel.DataAnnotations;

namespace ApiGateway.Models;

// 서비스 등록 모델
public class ServiceRegistration
{
    public string ServiceId { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string HealthCheckUrl { get; set; } = string.Empty;
    public bool IsHealthy { get; set; } = true;
    public DateTime LastHealthCheck { get; set; } = DateTime.UtcNow;
    public Dictionary<string, string> Tags { get; set; } = new();
}

// 라우팅 규칙 모델
public class RoutingRule
{
    public string Path { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string[] Methods { get; set; } = Array.Empty<string>();
    public Dictionary<string, string> Headers { get; set; } = new();
    public int Priority { get; set; } = 0;
    public bool RequiresAuth { get; set; } = false;
    public string[] RequiredRoles { get; set; } = Array.Empty<string>();
}

// 로드밸런싱 설정 모델
public class LoadBalancingConfig
{
    public string Strategy { get; set; } = "RoundRobin"; // RoundRobin, LeastConnections, Weighted
    public Dictionary<string, int> ServiceWeights { get; set; } = new();
    public int MaxRetries { get; set; } = 3;
    public int TimeoutMs { get; set; } = 30000;
}

// Rate Limiting 설정 모델
public class RateLimitConfig
{
    public int RequestsPerMinute { get; set; } = 100;
    public int RequestsPerHour { get; set; } = 1000;
    public int RequestsPerDay { get; set; } = 10000;
    public Dictionary<string, int> EndpointLimits { get; set; } = new();
    public bool EnableIpBasedLimiting { get; set; } = true;
    public bool EnableUserBasedLimiting { get; set; } = true;
}

// 인증 설정 모델
public class AuthConfig
{
    public string JwtSecret { get; set; } = string.Empty;
    public string JwtIssuer { get; set; } = string.Empty;
    public string JwtAudience { get; set; } = string.Empty;
    public int TokenValidityMinutes { get; set; } = 60;
    public bool RequireHttps { get; set; } = true;
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

// 헬스체크 응답 모델
public class HealthCheckResponse
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, ServiceHealth> Services { get; set; } = new();
    public GatewayMetrics Metrics { get; set; } = new();
}

// 서비스 헬스 모델
public class ServiceHealth
{
    public string ServiceName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime LastCheck { get; set; }
    public int ResponseTimeMs { get; set; }
    public string? Error { get; set; }
}

// 게이트웨이 메트릭 모델
public class GatewayMetrics
{
    public long TotalRequests { get; set; }
    public long SuccessfulRequests { get; set; }
    public long FailedRequests { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public Dictionary<string, long> RequestsByService { get; set; } = new();
    public Dictionary<string, long> RequestsByEndpoint { get; set; } = new();
    public Dictionary<int, long> RequestsByStatusCode { get; set; } = new();
}

// 요청 로그 모델
public class RequestLog
{
    public string RequestId { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string QueryString { get; set; } = string.Empty;
    public Dictionary<string, string> Headers { get; set; } = new();
    public string? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int StatusCode { get; set; }
    public long ResponseTimeMs { get; set; }
    public string? ServiceName { get; set; }
    public string? Error { get; set; }
}

// API 응답 래퍼 모델
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();
    public string RequestId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> SuccessResult(T data, string message = "Success", string requestId = "")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            RequestId = requestId,
            Timestamp = DateTime.UtcNow
        };
    }

    public static ApiResponse<T> ErrorResult(string message, List<string>? errors = null, string requestId = "")
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>(),
            RequestId = requestId,
            Timestamp = DateTime.UtcNow
        };
    }
}

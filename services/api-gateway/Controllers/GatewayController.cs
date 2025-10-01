using Microsoft.AspNetCore.Mvc;
using ApiGateway.Models;
using ApiGateway.Services;

namespace ApiGateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GatewayController : ControllerBase
{
    private readonly IServiceDiscovery _serviceDiscovery;
    private readonly ILoadBalancer _loadBalancer;
    private readonly ILogger<GatewayController> _logger;

    public GatewayController(
        IServiceDiscovery serviceDiscovery,
        ILoadBalancer loadBalancer,
        ILogger<GatewayController> logger)
    {
        _serviceDiscovery = serviceDiscovery;
        _loadBalancer = loadBalancer;
        _logger = logger;
    }

    /// <summary>
    /// 게이트웨이 헬스체크
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult<ApiResponse<HealthCheckResponse>>> GetHealth()
    {
        try
        {
            var serviceHealths = new Dictionary<string, ServiceHealth>();

            // 기본 서비스들에 대한 헬스체크
            var serviceNames = new[] { "user-service", "content-service", "chat-service", "notification-service" };

            foreach (var serviceName in serviceNames)
            {
                var services = await _serviceDiscovery.GetServicesAsync(serviceName);
                var isHealthy = services.Any() && services.All(s => s.IsHealthy);

                serviceHealths[serviceName] = new ServiceHealth
                {
                    ServiceName = serviceName,
                    Status = isHealthy ? "Healthy" : "Unhealthy",
                    LastCheck = DateTime.UtcNow,
                    ResponseTimeMs = 0 // TODO: 실제 응답 시간 측정
                };
            }

            var response = new HealthCheckResponse
            {
                Status = serviceHealths.Values.All(s => s.Status == "Healthy") ? "Healthy" : "Degraded",
                Services = serviceHealths,
                Metrics = new GatewayMetrics
                {
                    TotalRequests = 0, // TODO: 실제 메트릭 수집
                    SuccessfulRequests = 0,
                    FailedRequests = 0,
                    AverageResponseTimeMs = 0
                }
            };

            return Ok(ApiResponse<HealthCheckResponse>.SuccessResult(response, "Gateway health check completed"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing health check");
            return StatusCode(500, ApiResponse<HealthCheckResponse>.ErrorResult("Health check failed"));
        }
    }

    /// <summary>
    /// 등록된 서비스 목록 조회
    /// </summary>
    [HttpGet("services")]
    public async Task<ActionResult<ApiResponse<List<ServiceRegistration>>>> GetServices()
    {
        try
        {
            var allServices = new List<ServiceRegistration>();
            var serviceNames = new[] { "user-service", "content-service", "chat-service", "notification-service" };

            foreach (var serviceName in serviceNames)
            {
                var services = await _serviceDiscovery.GetServicesAsync(serviceName);
                allServices.AddRange(services);
            }

            return Ok(ApiResponse<List<ServiceRegistration>>.SuccessResult(allServices));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving services");
            return StatusCode(500, ApiResponse<List<ServiceRegistration>>.ErrorResult("Failed to retrieve services"));
        }
    }

    /// <summary>
    /// 특정 서비스의 헬시한 인스턴스 조회
    /// </summary>
    [HttpGet("services/{serviceName}/healthy")]
    public async Task<ActionResult<ApiResponse<List<ServiceRegistration>>>> GetHealthyServices(string serviceName)
    {
        try
        {
            var services = await _serviceDiscovery.GetServicesAsync(serviceName);
            var healthyServices = services.Where(s => s.IsHealthy).ToList();
            return Ok(ApiResponse<List<ServiceRegistration>>.SuccessResult(healthyServices));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving healthy services for {ServiceName}", serviceName);
            return StatusCode(500, ApiResponse<List<ServiceRegistration>>.ErrorResult($"Failed to retrieve healthy services for {serviceName}"));
        }
    }

    /// <summary>
    /// 서비스 등록
    /// </summary>
    [HttpPost("services")]
    public async Task<ActionResult<ApiResponse<bool>>> RegisterService([FromBody] ServiceRegistration service)
    {
        try
        {
            await _serviceDiscovery.RegisterServiceAsync(service);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Service registered successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering service {ServiceId}", service.ServiceId);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Failed to register service"));
        }
    }

    /// <summary>
    /// 서비스 등록 해제
    /// </summary>
    [HttpDelete("services/{serviceId}")]
    public async Task<ActionResult<ApiResponse<bool>>> UnregisterService(string serviceId)
    {
        try
        {
            await _serviceDiscovery.DeregisterServiceAsync(serviceId);
            return Ok(ApiResponse<bool>.SuccessResult(true, "Service unregistered successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering service {ServiceId}", serviceId);
            return StatusCode(500, ApiResponse<bool>.ErrorResult("Failed to unregister service"));
        }
    }

    /// <summary>
    /// 서비스 선택 테스트
    /// </summary>
    [HttpGet("loadbalancer/select/{serviceName}")]
    public async Task<ActionResult<ApiResponse<ServiceRegistration>>> SelectService(string serviceName)
    {
        try
        {
            var services = await _serviceDiscovery.GetServicesAsync(serviceName);
            var healthyServices = services.Where(s => s.IsHealthy).ToList();

            if (!healthyServices.Any())
            {
                return NotFound(ApiResponse<ServiceRegistration>.ErrorResult($"No healthy service found for {serviceName}"));
            }

            var selectedService = _loadBalancer.SelectService(healthyServices);
            return Ok(ApiResponse<ServiceRegistration>.SuccessResult(selectedService!, "Service selected successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error selecting service for {ServiceName}", serviceName);
            return StatusCode(500, ApiResponse<ServiceRegistration>.ErrorResult("Failed to select service"));
        }
    }
}

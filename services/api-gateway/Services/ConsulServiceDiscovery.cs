using ApiGateway.Models;
using Consul;

namespace ApiGateway.Services;

public class ConsulServiceDiscovery : IServiceDiscovery
{
    private readonly IConsulClient _consulClient;
    private readonly ILogger<ConsulServiceDiscovery> _logger;

    public ConsulServiceDiscovery(IConsulClient consulClient, ILogger<ConsulServiceDiscovery> logger)
    {
        _consulClient = consulClient;
        _logger = logger;
    }

    public async Task RegisterServiceAsync(ServiceRegistration service)
    {
        try
        {
            var registration = new AgentServiceRegistration
            {
                ID = service.ServiceId,
                Name = service.ServiceName,
                Address = service.Host,
                Port = service.Port,
                Check = new AgentServiceCheck
                {
                    HTTP = $"http://{service.Host}:{service.Port}{service.HealthCheckUrl}",
                    Interval = TimeSpan.FromSeconds(10),
                    Timeout = TimeSpan.FromSeconds(5),
                    DeregisterCriticalServiceAfter = TimeSpan.FromMinutes(1)
                }
            };

            await _consulClient.Agent.ServiceRegister(registration);
            _logger.LogInformation("Service {ServiceId} registered successfully", service.ServiceId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register service {ServiceId}", service.ServiceId);
            throw;
        }
    }

    public async Task DeregisterServiceAsync(string serviceId)
    {
        try
        {
            await _consulClient.Agent.ServiceDeregister(serviceId);
            _logger.LogInformation("Service {ServiceId} deregistered successfully", serviceId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deregister service {ServiceId}", serviceId);
            throw;
        }
    }

    public async Task<List<ServiceRegistration>> GetServicesAsync(string serviceName)
    {
        try
        {
            var services = await _consulClient.Health.Service(serviceName, "", true);
            return services.Response.Select(s => new ServiceRegistration
            {
                ServiceId = s.Service.ID,
                ServiceName = s.Service.Service,
                Host = s.Service.Address,
                Port = s.Service.Port,
                HealthCheckUrl = "/health"
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get services for {ServiceName}", serviceName);
            return new List<ServiceRegistration>();
        }
    }

    public async Task<ServiceRegistration?> GetServiceAsync(string serviceName)
    {
        var services = await GetServicesAsync(serviceName);
        return services.FirstOrDefault();
    }

    public async Task<bool> IsServiceHealthyAsync(string serviceId)
    {
        try
        {
            var checks = await _consulClient.Health.Checks(serviceId);
            return checks.Response.All(c => c.Status == HealthStatus.Passing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check health for service {ServiceId}", serviceId);
            return false;
        }
    }
}
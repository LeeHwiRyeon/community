using ApiGateway.Models;

namespace ApiGateway.Services;

public interface IServiceDiscovery
{
    Task RegisterServiceAsync(ServiceRegistration service);
    Task DeregisterServiceAsync(string serviceId);
    Task<List<ServiceRegistration>> GetServicesAsync(string serviceName);
    Task<ServiceRegistration?> GetServiceAsync(string serviceName);
    Task<bool> IsServiceHealthyAsync(string serviceId);
}
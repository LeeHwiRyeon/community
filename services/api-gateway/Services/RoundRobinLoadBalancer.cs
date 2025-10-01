using ApiGateway.Models;

namespace ApiGateway.Services;

public class RoundRobinLoadBalancer : ILoadBalancer
{
    private int _currentIndex = 0;
    private readonly object _lock = new object();

    public ServiceRegistration? SelectService(List<ServiceRegistration> services)
    {
        if (services == null || services.Count == 0)
            return null;

        lock (_lock)
        {
            var service = services[_currentIndex % services.Count];
            _currentIndex++;
            return service;
        }
    }
}
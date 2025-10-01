using ApiGateway.Models;

namespace ApiGateway.Services;

public interface ILoadBalancer
{
    ServiceRegistration? SelectService(List<ServiceRegistration> services);
}
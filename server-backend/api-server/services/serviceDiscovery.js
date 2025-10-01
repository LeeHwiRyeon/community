const { EventEmitter } = require('events');
const axios = require('axios');

class ServiceDiscovery extends EventEmitter {
    constructor() {
        super();
        this.services = new Map();
        this.healthChecks = new Map();
        this.loadBalancers = new Map();
        this.circuitBreakers = new Map();
        this.isEnabled = true;
    }

    // 서비스 등록
    registerService(serviceInfo) {
        const service = {
            id: serviceInfo.id || `service_${Date.now()}`,
            name: serviceInfo.name,
            version: serviceInfo.version || '1.0.0',
            host: serviceInfo.host,
            port: serviceInfo.port,
            protocol: serviceInfo.protocol || 'http',
            healthCheck: serviceInfo.healthCheck || '/health',
            metadata: serviceInfo.metadata || {},
            status: 'unknown',
            lastHealthCheck: null,
            registeredAt: new Date().toISOString(),
            ...serviceInfo,
        };

        this.services.set(service.id, service);
        this.emit('serviceRegistered', service);

        console.log(`서비스가 등록되었습니다: ${service.name} (${service.id})`);

        // 헬스 체크 시작
        this.startHealthCheck(service.id);

        return service.id;
    }

    // 서비스 등록 해제
    unregisterService(serviceId) {
        const service = this.services.get(serviceId);
        if (service) {
            this.services.delete(serviceId);
            this.stopHealthCheck(serviceId);
            this.emit('serviceUnregistered', service);
            console.log(`서비스가 등록 해제되었습니다: ${service.name} (${serviceId})`);
            return true;
        }
        return false;
    }

    // 서비스 조회
    getService(serviceId) {
        return this.services.get(serviceId);
    }

    // 서비스명으로 조회
    getServicesByName(serviceName) {
        return Array.from(this.services.values())
            .filter(service => service.name === serviceName);
    }

    // 활성 서비스 조회
    getActiveServices(serviceName = null) {
        let services = Array.from(this.services.values())
            .filter(service => service.status === 'healthy');

        if (serviceName) {
            services = services.filter(service => service.name === serviceName);
        }

        return services;
    }

    // 서비스 목록 조회
    getAllServices() {
        return Array.from(this.services.values());
    }

    // 헬스 체크 시작
    startHealthCheck(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;

        const healthCheckInterval = setInterval(async () => {
            try {
                const isHealthy = await this.performHealthCheck(service);
                this.updateServiceStatus(serviceId, isHealthy ? 'healthy' : 'unhealthy');
            } catch (error) {
                console.error(`서비스 ${service.name} 헬스 체크 실패:`, error.message);
                this.updateServiceStatus(serviceId, 'unhealthy');
            }
        }, service.healthCheckInterval || 30000); // 30초

        this.healthChecks.set(serviceId, healthCheckInterval);
    }

    // 헬스 체크 중지
    stopHealthCheck(serviceId) {
        const interval = this.healthChecks.get(serviceId);
        if (interval) {
            clearInterval(interval);
            this.healthChecks.delete(serviceId);
        }
    }

    // 헬스 체크 수행
    async performHealthCheck(service) {
        const healthCheckUrl = `${service.protocol}://${service.host}:${service.port}${service.healthCheck}`;

        try {
            const response = await axios.get(healthCheckUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'ServiceDiscovery/1.0',
                },
            });

            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // 서비스 상태 업데이트
    updateServiceStatus(serviceId, status) {
        const service = this.services.get(serviceId);
        if (service) {
            const previousStatus = service.status;
            service.status = status;
            service.lastHealthCheck = new Date().toISOString();

            if (previousStatus !== status) {
                this.emit('serviceStatusChanged', {
                    serviceId,
                    serviceName: service.name,
                    previousStatus,
                    newStatus: status,
                    timestamp: service.lastHealthCheck,
                });

                console.log(`서비스 상태 변경: ${service.name} (${previousStatus} -> ${status})`);
            }
        }
    }

    // 로드 밸런서 생성
    createLoadBalancer(serviceName, strategy = 'round-robin') {
        const loadBalancer = {
            serviceName,
            strategy,
            currentIndex: 0,
            services: [],
        };

        this.loadBalancers.set(serviceName, loadBalancer);
        this.updateLoadBalancerServices(serviceName);

        return loadBalancer;
    }

    // 로드 밸런서 서비스 목록 업데이트
    updateLoadBalancerServices(serviceName) {
        const loadBalancer = this.loadBalancers.get(serviceName);
        if (loadBalancer) {
            loadBalancer.services = this.getActiveServices(serviceName);
        }
    }

    // 로드 밸런싱된 서비스 선택
    selectService(serviceName) {
        const loadBalancer = this.loadBalancers.get(serviceName);
        if (!loadBalancer || loadBalancer.services.length === 0) {
            return null;
        }

        this.updateLoadBalancerServices(serviceName);

        if (loadBalancer.services.length === 0) {
            return null;
        }

        let selectedService;

        switch (loadBalancer.strategy) {
            case 'round-robin':
                selectedService = loadBalancer.services[loadBalancer.currentIndex];
                loadBalancer.currentIndex = (loadBalancer.currentIndex + 1) % loadBalancer.services.length;
                break;

            case 'random':
                selectedService = loadBalancer.services[Math.floor(Math.random() * loadBalancer.services.length)];
                break;

            case 'least-connections':
                selectedService = loadBalancer.services.reduce((min, service) =>
                    (service.connections || 0) < (min.connections || 0) ? service : min
                );
                break;

            case 'weighted':
                const totalWeight = loadBalancer.services.reduce((sum, service) => sum + (service.weight || 1), 0);
                let random = Math.random() * totalWeight;
                for (const service of loadBalancer.services) {
                    random -= (service.weight || 1);
                    if (random <= 0) {
                        selectedService = service;
                        break;
                    }
                }
                break;

            default:
                selectedService = loadBalancer.services[0];
        }

        return selectedService;
    }

    // 서비스 호출
    async callService(serviceName, endpoint, options = {}) {
        const service = this.selectService(serviceName);
        if (!service) {
            throw new Error(`서비스를 찾을 수 없습니다: ${serviceName}`);
        }

        const url = `${service.protocol}://${service.host}:${service.port}${endpoint}`;

        try {
            const response = await axios({
                method: options.method || 'GET',
                url,
                data: options.data,
                params: options.params,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                timeout: options.timeout || 10000,
            });

            return response.data;
        } catch (error) {
            console.error(`서비스 호출 실패: ${serviceName}${endpoint}`, error.message);
            throw error;
        }
    }

    // 서킷 브레이커 생성
    createCircuitBreaker(serviceName, options = {}) {
        const circuitBreaker = {
            serviceName,
            state: 'closed', // closed, open, half-open
            failureCount: 0,
            failureThreshold: options.failureThreshold || 5,
            timeout: options.timeout || 60000, // 1분
            lastFailureTime: null,
            successCount: 0,
            successThreshold: options.successThreshold || 3,
        };

        this.circuitBreakers.set(serviceName, circuitBreaker);
        return circuitBreaker;
    }

    // 서킷 브레이커를 통한 서비스 호출
    async callServiceWithCircuitBreaker(serviceName, endpoint, options = {}) {
        const circuitBreaker = this.circuitBreakers.get(serviceName);

        if (!circuitBreaker) {
            return this.callService(serviceName, endpoint, options);
        }

        // 서킷 브레이커 상태 확인
        if (circuitBreaker.state === 'open') {
            if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.timeout) {
                circuitBreaker.state = 'half-open';
                circuitBreaker.successCount = 0;
            } else {
                throw new Error(`서킷 브레이커가 열려있습니다: ${serviceName}`);
            }
        }

        try {
            const result = await this.callService(serviceName, endpoint, options);

            // 성공 시 처리
            if (circuitBreaker.state === 'half-open') {
                circuitBreaker.successCount++;
                if (circuitBreaker.successCount >= circuitBreaker.successThreshold) {
                    circuitBreaker.state = 'closed';
                    circuitBreaker.failureCount = 0;
                }
            } else {
                circuitBreaker.failureCount = 0;
            }

            return result;
        } catch (error) {
            // 실패 시 처리
            circuitBreaker.failureCount++;
            circuitBreaker.lastFailureTime = Date.now();

            if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
                circuitBreaker.state = 'open';
            }

            throw error;
        }
    }

    // 서비스 검색
    discoverServices(serviceName, filters = {}) {
        let services = this.getActiveServices(serviceName);

        // 필터 적용
        if (filters.version) {
            services = services.filter(service => service.version === filters.version);
        }

        if (filters.metadata) {
            services = services.filter(service => {
                return Object.entries(filters.metadata).every(([key, value]) =>
                    service.metadata[key] === value
                );
            });
        }

        return services;
    }

    // 서비스 상태 조회
    getServiceStatus(serviceName) {
        const services = this.getServicesByName(serviceName);
        const statusCounts = services.reduce((acc, service) => {
            acc[service.status] = (acc[service.status] || 0) + 1;
            return acc;
        }, {});

        return {
            total: services.length,
            healthy: statusCounts.healthy || 0,
            unhealthy: statusCounts.unhealthy || 0,
            unknown: statusCounts.unknown || 0,
            services: services.map(service => ({
                id: service.id,
                host: service.host,
                port: service.port,
                status: service.status,
                lastHealthCheck: service.lastHealthCheck,
            })),
        };
    }

    // 서비스 디스커버리 상태
    getDiscoveryStatus() {
        return {
            enabled: this.isEnabled,
            totalServices: this.services.size,
            activeServices: this.getActiveServices().length,
            loadBalancers: this.loadBalancers.size,
            circuitBreakers: this.circuitBreakers.size,
            healthChecks: this.healthChecks.size,
        };
    }

    // 서비스 디스커버리 활성화/비활성화
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`서비스 디스커버리가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
    }

    // 모든 서비스 정리
    cleanup() {
        // 모든 헬스 체크 중지
        for (const [serviceId, interval] of this.healthChecks) {
            clearInterval(interval);
        }

        this.healthChecks.clear();
        this.services.clear();
        this.loadBalancers.clear();
        this.circuitBreakers.clear();

        console.log('서비스 디스커버리가 정리되었습니다.');
    }
}

module.exports = ServiceDiscovery;

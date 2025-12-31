# Healthcare Microservices - Distributed System Learning Project

A production-ready distributed microservices architecture demonstrating enterprise patterns.

## Architecture

### Microservices (Polyglot)
- **Patient Service** - .NET 10 + SQL Server + Redis
- **Appointment Service** - Node.js + MongoDB + Redis
- **Billing Service** - .NET 10 + SQL Server + Redis
- **Notification Service** - .NET 10 + MongoDB

### Infrastructure
- **API Gateway** - YARP
- **Service Discovery** - Consul
- **Message Broker** - RabbitMQ
- **Cache** - Redis
- **Databases** - SQL Server, MongoDB

### Monitoring Stack (Local)
- **Logging** - Seq (http://localhost:5341)
- **Metrics** - Prometheus (http://localhost:9090)
- **Dashboards** - Grafana (http://localhost:3001)
- **Tracing** - Jaeger (http://localhost:16686)
- **Health Checks** - Health UI (http://localhost:5000/healthchecks-ui)
- **RabbitMQ Management** - http://localhost:15672
- **Consul UI** - http://localhost:8500
- **Redis Commander** - http://localhost:8081

## Patterns Demonstrated
- ✅ Saga Pattern (orchestration & choreography)
- ✅ Circuit Breaker (Polly for .NET, Opossum for Node.js)
- ✅ Event-Driven Architecture
- ✅ CQRS (basic)
- ✅ Distributed Caching
- ✅ Service Discovery
- ✅ API Gateway
- ✅ Distributed Tracing
- ✅ Health Checks

## Technology Stack
- .NET 10
- Node.js 22
- SQL Server 2022
- MongoDB 7
- Redis 7
- RabbitMQ 3
- Docker & Docker Compose

## Prerequisites
- Docker Desktop
- .NET 10 SDK
- Node.js 22 LTS

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Service Endpoints
- API Gateway: http://localhost:5000
- Patient Service: http://localhost:5001
- Appointment Service: http://localhost:5002
- Billing Service: http://localhost:5003
- Notification Service: http://localhost:5004

## Development Phases
- **Phase 1** - Core services (Patient, Appointment) + Basic monitoring
- **Phase 2** - Complete services (Billing, Notification) + Saga + Circuit breaker
- **Phase 3** - Authentication + Authorization + Angular Dashboard

## Documentation
- [Event Schemas](docs/EVENT_SCHEMAS.md)
- [Phase 1 Plan](docs/PHASE1.md)
- [Phase 2 Plan](docs/PHASE2.md)
- [Phase 3 Plan](docs/PHASE3.md)

## Learning Outcomes
This project demonstrates real-world enterprise microservices patterns used in production systems.

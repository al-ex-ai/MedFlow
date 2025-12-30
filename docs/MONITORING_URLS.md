# Monitoring & Infrastructure URLs

## 🎯 Quick Access Dashboard URLs

Once all services are running, access these dashboards in your browser:

| Service | URL | Credentials | Purpose |
|---------|-----|-------------|---------|
| **Seq (Logs)** | http://localhost:5341 | admin / admin123 | Centralized logging from all services |
| **Grafana (Metrics)** | http://localhost:3001 | admin / admin | Metrics dashboards and visualization |
| **Prometheus** | http://localhost:9090 | None | Raw metrics queries and monitoring |
| **Jaeger (Tracing)** | http://localhost:16686 | None | Distributed tracing across services |
| **RabbitMQ Management** | http://localhost:15672 | admin / admin123 | Message queue monitoring |
| **Consul** | http://localhost:8500 | None | Service discovery and health |
| **Redis Commander** | http://localhost:8081 | None | Browse Redis cache data |

## 📊 Infrastructure Ports

| Service | Port | Protocol |
|---------|------|----------|
| SQL Server | 1433 | TCP |
| MongoDB | 27017 | TCP |
| Redis | 6379 | TCP |
| RabbitMQ (AMQP) | 5672 | TCP |
| Consul (HTTP) | 8500 | HTTP |

## ✅ Verify Infrastructure is Running

```bash
# Check all containers
docker ps

# Check specific service logs
docker logs sqlserver
docker logs mongodb
docker logs rabbitmq
docker logs redis
docker logs consul
docker logs seq
```

## 🔧 Common Commands

```bash
# Start all infrastructure
docker-compose up -d

# Stop all infrastructure
docker-compose down

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart seq

# Remove all containers and volumes (clean slate)
docker-compose down -v
```

## 🎯 What's Next

Now that infrastructure is running, we'll build:
1. **Patient Service** (.NET 10)
2. **Appointment Service** (Node.js 22)
3. **Billing Service** (.NET 10)
4. **Notification Service** (.NET 10)

Each service will automatically send:
- **Logs** → Seq
- **Metrics** → Prometheus → Grafana
- **Traces** → Jaeger

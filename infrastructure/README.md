# KIRO ERP Infrastructure

This directory contains all infrastructure configurations and deployment files for the KIRO ERP system.

## Directory Structure

```
infrastructure/
├── cdn/                    # Cloudflare Workers configuration
├── database/              # PostgreSQL and TimescaleDB configurations
│   ├── init/              # Database initialization scripts
│   ├── postgresql.conf    # PostgreSQL configuration
│   └── pg_hba.conf       # Authentication configuration
├── docker/               # Docker configurations
│   ├── Dockerfile        # Production Docker image
│   ├── Dockerfile.dev    # Development Docker image
│   ├── docker-compose.yml           # Development environment
│   ├── docker-compose.prod.yml      # Production environment
│   └── docker-compose.performance.yml # High-performance setup
├── k8s/                  # Kubernetes manifests
│   ├── api-deployment.yaml
│   └── ingress.yaml
├── monitoring/           # Monitoring and observability
│   ├── prometheus.yml
│   └── grafana/
├── nginx/               # Reverse proxy configuration
│   ├── nginx.conf
│   └── ssl/
└── README.md
```

## Quick Start

### Development Environment
```bash
# Start development environment
npm run docker:up

# View logs
npm run docker:logs

# Stop environment
npm run docker:down
```

### Production Environment
```bash
# Start production environment
npm run docker:prod

# High-performance setup
npm run docker:performance
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/k8s/

# Check deployment status
kubectl get pods,services,ingress
```

## Environment Configuration

### Required Environment Variables

Create `.env.production` file in the root directory:

```env
# Database
POSTGRES_PASSWORD=your_secure_password
POSTGRES_REPLICATION_PASSWORD=your_replication_password
REDIS_PASSWORD=your_redis_password

# Elasticsearch
ELASTIC_PASSWORD=your_elastic_password

# MinIO
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key

# Application
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

## Services

### Core Services
- **API**: NestJS backend application (Port 4000)
- **Web**: Next.js frontend application (Port 3000)
- **PostgreSQL**: Primary database (Port 5432)
- **TimescaleDB**: Time-series database (Port 5433)
- **Redis**: Caching and sessions (Port 6379)
- **Elasticsearch**: Search and analytics (Port 9200)
- **MinIO**: Object storage (Port 9000)

### Infrastructure Services
- **NGINX**: Reverse proxy and load balancer (Port 80/443)
- **Prometheus**: Metrics collection (Port 9090)
- **Grafana**: Monitoring dashboards (Port 3001)

## Scaling and Performance

### Horizontal Scaling
- API instances can be scaled using Kubernetes HPA
- Database read replicas for improved performance
- Redis clustering for high availability
- CDN integration with Cloudflare Workers

### Performance Optimizations
- Multi-level caching (CDN, NGINX, Redis, Application)
- Database connection pooling
- Compression and asset optimization
- Rate limiting and security headers

## Security

### Network Security
- Network policies in Kubernetes
- Rate limiting at multiple layers
- SSL/TLS termination
- Security headers implementation

### Data Security
- Database encryption at rest
- Secure authentication with JWT
- Role-based access control
- Audit logging

## Monitoring and Observability

### Metrics Collection
- Application performance metrics
- Infrastructure metrics (CPU, memory, disk)
- Database performance metrics
- Custom business metrics

### Logging
- Centralized logging with structured format
- Log aggregation and analysis
- Error tracking and alerting
- Audit trail maintenance

### Health Checks
- Application health endpoints
- Database connectivity checks
- Service dependency monitoring
- Automated failover capabilities

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery capability
- Cross-region backup replication
- Backup verification and testing

### Disaster Recovery
- Multi-region deployment capability
- Data replication strategies
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)

## Deployment Strategies

### Blue-Green Deployment
- Zero-downtime deployments
- Quick rollback capability
- Production traffic validation
- Automated deployment pipelines

### Canary Releases
- Gradual feature rollouts
- A/B testing capabilities
- Risk mitigation
- Performance monitoring

## Troubleshooting

### Common Issues
1. **Database Connection Issues**: Check network policies and credentials
2. **High Memory Usage**: Monitor and adjust resource limits
3. **Slow API Response**: Check database queries and caching
4. **SSL Certificate Issues**: Verify certificate validity and configuration

### Debugging Commands
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs [service_name]

# Execute commands in containers
docker-compose exec [service_name] bash

# Monitor resource usage
docker stats
```

## Contributing

When making infrastructure changes:
1. Test changes in development environment first
2. Update documentation accordingly
3. Verify security implications
4. Test backup and recovery procedures
5. Update monitoring and alerting as needed

## Support

For infrastructure-related issues:
1. Check service logs first
2. Verify environment configuration
3. Test connectivity between services
4. Review resource utilization
5. Consult monitoring dashboards
#!/usr/bin/env node

/**
 * KIRO ERP Health Check Script
 * Comprehensive health check for all services
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const SERVICES = {
  api: { url: 'http://localhost:4000/health', timeout: 5000 },
  web: { url: 'http://localhost:3000', timeout: 5000 },
  postgres: { command: 'docker-compose -f infrastructure/docker/docker-compose.yml exec -T postgres pg_isready', timeout: 5000 },
  redis: { command: 'docker-compose -f infrastructure/docker/docker-compose.yml exec -T redis redis-cli ping', timeout: 5000 },
  elasticsearch: { url: 'http://localhost:9200/_cluster/health', timeout: 10000 },
  minio: { url: 'http://localhost:9000/minio/health/live', timeout: 5000 }
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function log(level, message) {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: 'blue',
    SUCCESS: 'green',
    WARNING: 'yellow',
    ERROR: 'red'
  };
  
  console.log(`${colorize(`[${timestamp}]`, 'cyan')} ${colorize(`[${level}]`, colors[level])} ${message}`);
}

// HTTP health check
function checkHttpService(name, config) {
  return new Promise((resolve) => {
    const url = new URL(config.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const startTime = Date.now();
    const req = client.get(config.url, { timeout: config.timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      const isHealthy = res.statusCode >= 200 && res.statusCode < 400;
      
      resolve({
        name,
        healthy: isHealthy,
        status: res.statusCode,
        responseTime,
        message: isHealthy ? 'OK' : `HTTP ${res.statusCode}`
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name,
        healthy: false,
        responseTime: Date.now() - startTime,
        message: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        healthy: false,
        responseTime: config.timeout,
        message: 'Timeout'
      });
    });
  });
}

// Command-based health check
async function checkCommandService(name, config) {
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(config.command, { timeout: config.timeout });
    const responseTime = Date.now() - startTime;
    
    // Check for specific success indicators
    let healthy = false;
    let message = 'Unknown';
    
    if (name === 'postgres') {
      healthy = stdout.includes('accepting connections') || !stderr;
      message = healthy ? 'Accepting connections' : stderr || 'Not ready';
    } else if (name === 'redis') {
      healthy = stdout.trim() === 'PONG';
      message = healthy ? 'PONG' : stdout.trim() || stderr;
    }
    
    return {
      name,
      healthy,
      responseTime,
      message
    };
  } catch (error) {
    return {
      name,
      healthy: false,
      responseTime: Date.now() - startTime,
      message: error.message
    };
  }
}

// Main health check function
async function performHealthCheck() {
  log('INFO', 'Starting comprehensive health check...');
  console.log();
  
  const results = [];
  const checks = [];
  
  // Prepare health checks
  for (const [name, config] of Object.entries(SERVICES)) {
    if (config.url) {
      checks.push(checkHttpService(name, config));
    } else if (config.command) {
      checks.push(checkCommandService(name, config));
    }
  }
  
  // Execute all checks concurrently
  const checkResults = await Promise.all(checks);
  
  // Process results
  let allHealthy = true;
  let totalResponseTime = 0;
  
  console.log(colorize('Service Health Status:', 'bright'));
  console.log('─'.repeat(80));
  
  for (const result of checkResults) {
    results.push(result);
    totalResponseTime += result.responseTime || 0;
    
    if (!result.healthy) {
      allHealthy = false;
    }
    
    const status = result.healthy ? colorize('✓ HEALTHY', 'green') : colorize('✗ UNHEALTHY', 'red');
    const responseTime = result.responseTime ? `${result.responseTime}ms` : 'N/A';
    const message = result.message || 'No message';
    
    console.log(`${result.name.padEnd(15)} ${status.padEnd(20)} ${responseTime.padEnd(10)} ${message}`);
  }
  
  console.log('─'.repeat(80));
  
  // Summary
  const healthyCount = results.filter(r => r.healthy).length;
  const totalCount = results.length;
  const avgResponseTime = totalCount > 0 ? Math.round(totalResponseTime / totalCount) : 0;
  
  console.log();
  console.log(colorize('Health Check Summary:', 'bright'));
  console.log(`Services: ${colorize(`${healthyCount}/${totalCount}`, healthyCount === totalCount ? 'green' : 'red')} healthy`);
  console.log(`Average Response Time: ${colorize(`${avgResponseTime}ms`, 'cyan')}`);
  console.log(`Overall Status: ${allHealthy ? colorize('HEALTHY', 'green') : colorize('DEGRADED', 'yellow')}`);
  
  // Detailed recommendations
  if (!allHealthy) {
    console.log();
    console.log(colorize('Recommendations:', 'yellow'));
    
    const unhealthyServices = results.filter(r => !r.healthy);
    for (const service of unhealthyServices) {
      console.log(`• ${service.name}: ${service.message}`);
      
      // Service-specific recommendations
      switch (service.name) {
        case 'postgres':
          console.log('  - Check if PostgreSQL container is running');
          console.log('  - Verify database credentials and connection string');
          console.log('  - Check container logs: docker-compose logs postgres');
          break;
        case 'redis':
          console.log('  - Check if Redis container is running');
          console.log('  - Verify Redis configuration');
          console.log('  - Check container logs: docker-compose logs redis');
          break;
        case 'api':
          console.log('  - Check if API server is running on port 4000');
          console.log('  - Verify environment variables');
          console.log('  - Check application logs for errors');
          break;
        case 'web':
          console.log('  - Check if web server is running on port 3000');
          console.log('  - Verify Next.js build and configuration');
          console.log('  - Check for build errors');
          break;
        case 'elasticsearch':
          console.log('  - Check if Elasticsearch container is running');
          console.log('  - Verify Elasticsearch configuration');
          console.log('  - Check available memory and disk space');
          break;
        case 'minio':
          console.log('  - Check if MinIO container is running');
          console.log('  - Verify MinIO credentials');
          console.log('  - Check storage configuration');
          break;
      }
      console.log();
    }
  }
  
  // Exit with appropriate code
  process.exit(allHealthy ? 0 : 1);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log('ERROR', `Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('ERROR', `Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Run health check
if (require.main === module) {
  performHealthCheck().catch((error) => {
    log('ERROR', `Health check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { performHealthCheck };
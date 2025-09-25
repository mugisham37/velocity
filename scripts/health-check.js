#!/usr/bin/env node

/**
 * KIRO ERP Health Check Script
 * Verifies that all services and dependencies are running correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(level, message) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: 'blue',
    SUCCESS: 'green',
    WARNING: 'yellow',
    ERROR: 'red',
  };
  
  console.log(
    `${colorize(`[${level}]`, levelColors[level])} ${colorize(timestamp, 'cyan')} ${message}`
  );
}

async function checkService(name, checkFn) {
  try {
    log('INFO', `Checking ${name}...`);
    await checkFn();
    log('SUCCESS', `${name} is healthy`);
    return true;
  } catch (error) {
    log('ERROR', `${name} check failed: ${error.message}`);
    return false;
  }
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

async function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    throw new Error(`Node.js 18+ required, current version: ${version}`);
  }
  
  log('INFO', `Node.js version: ${version}`);
}

async function checkEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found. Run setup script first.');
  }
  
  // Check for required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)
  );
  
  if (missingVars.length > 0) {
    throw new Error(`Missing or placeholder environment variables: ${missingVars.join(', ')}`);
  }
}

async function checkDependencies() {
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    throw new Error('Dependencies not installed. Run "npm install" first.');
  }
  
  // Check package-lock.json
  if (!fs.existsSync('package-lock.json')) {
    log('WARNING', 'package-lock.json not found. Consider running "npm ci" for reproducible builds.');
  }
}

async function checkDockerServices() {
  // Check if Docker is running
  try {
    execCommand('docker info', { silent: true });
  } catch (error) {
    throw new Error('Docker is not running or not accessible');
  }
  
  // Check Docker Compose services
  const services = ['postgres', 'redis', 'timescaledb', 'elasticsearch', 'minio'];
  
  for (const service of services) {
    try {
      const output = execCommand(`docker-compose ps ${service}`, { silent: true });
      if (!output.includes('Up')) {
        throw new Error(`Service ${service} is not running`);
      }
    } catch (error) {
      throw new Error(`Failed to check ${service} status: ${error.message}`);
    }
  }
}

async function checkPostgreSQL() {
  try {
    execCommand('docker-compose exec -T postgres pg_isready -U kiro_user -d kiro_erp_dev', { silent: true });
  } catch (error) {
    throw new Error('PostgreSQL is not ready');
  }
}

async function checkRedis() {
  try {
    const output = execCommand('docker-compose exec -T redis redis-cli ping', { silent: true });
    if (!output.trim().includes('PONG')) {
      throw new Error('Redis ping failed');
    }
  } catch (error) {
    throw new Error('Redis is not responding');
  }
}

async function checkElasticsearch() {
  try {
    const output = execCommand('curl -s http://localhost:9200/_cluster/health', { silent: true });
    const health = JSON.parse(output);
    
    if (health.status === 'red') {
      throw new Error('Elasticsearch cluster is in red status');
    }
    
    log('INFO', `Elasticsearch status: ${health.status}`);
  } catch (error) {
    throw new Error(`Elasticsearch health check failed: ${error.message}`);
  }
}

async function checkMinIO() {
  try {
    execCommand('curl -s http://localhost:9000/minio/health/live', { silent: true });
  } catch (error) {
    throw new Error('MinIO health check failed');
  }
}

async function checkBuildSystem() {
  // Check if TypeScript compiles
  try {
    execCommand('npx tsc --noEmit', { silent: true });
  } catch (error) {
    throw new Error('TypeScript compilation failed');
  }
  
  // Check if linting passes
  try {
    execCommand('npm run lint', { silent: true });
  } catch (error) {
    log('WARNING', 'Linting issues found. Run "npm run lint" to see details.');
  }
}

async function checkDatabaseSchema() {
  try {
    // Check if migrations are up to date
    execCommand('npm run db:generate', { silent: true });
    
    // Verify database connection by running a simple query
    execCommand('docker-compose exec -T postgres psql -U kiro_user -d kiro_erp_dev -c "SELECT 1;"', { silent: true });
  } catch (error) {
    throw new Error('Database schema check failed');
  }
}

async function runHealthChecks() {
  console.log(colorize('🏥 KIRO ERP Health Check', 'magenta'));
  console.log(colorize('=' .repeat(50), 'blue'));
  
  const checks = [
    ['Node.js Version', checkNodeVersion],
    ['Environment Configuration', checkEnvironmentFile],
    ['Dependencies', checkDependencies],
    ['Docker Services', checkDockerServices],
    ['PostgreSQL', checkPostgreSQL],
    ['Redis', checkRedis],
    ['Elasticsearch', checkElasticsearch],
    ['MinIO', checkMinIO],
    ['Build System', checkBuildSystem],
    ['Database Schema', checkDatabaseSchema],
  ];
  
  let passedChecks = 0;
  const totalChecks = checks.length;
  
  for (const [name, checkFn] of checks) {
    const passed = await checkService(name, checkFn);
    if (passed) passedChecks++;
  }
  
  console.log(colorize('=' .repeat(50), 'blue'));
  
  if (passedChecks === totalChecks) {
    log('SUCCESS', `🎉 All health checks passed! (${passedChecks}/${totalChecks})`);
    log('INFO', 'Your KIRO ERP development environment is ready!');
    process.exit(0);
  } else {
    log('ERROR', `❌ ${totalChecks - passedChecks} health check(s) failed! (${passedChecks}/${totalChecks})`);
    log('INFO', 'Please fix the issues above before proceeding.');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
KIRO ERP Health Check Script

Usage: node scripts/health-check.js [options]

Options:
  --help, -h    Show this help message
  
This script verifies that all services and dependencies are running correctly.
  `);
  process.exit(0);
}

// Run health checks
runHealthChecks().catch(error => {
  log('ERROR', `Health check script failed: ${error.message}`);
  process.exit(1);
});
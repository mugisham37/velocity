# KIRO ERP

> Next-generation Enterprise Resource Planning System built with modern technologies

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)

KIRO ERP is a complete modernization of ERPNext, rebuilt from the ground up using cutting-edge technologies while maintaining all existing functionality and adding advanced features. This project aims to create a next-generation enterprise resource planning system that leverages modern web technologies, microservices architecture, and AI-powered capabilities.

## 🚀 Features

### Core Modules
- **Financial Management** - Complete accounting with GL, AR, AP, and banking
- **Sales & CRM** - Lead management, opportunities, and sales order processing
- **Inventory Management** - Multi-warehouse, serial/batch tracking, and valuation
- **Manufacturing** - BOM management, production planning, and shop floor control
- **Project Management** - Task tracking, time management, and project accounting
- **Human Resources** - Employee management, payroll, and attendance tracking
- **Asset Management** - Asset tracking, depreciation, and maintenance scheduling

### Advanced Features
- **AI-Powered Analytics** - Predictive insights and automated recommendations
- **IoT Integration** - Real-time equipment monitoring and asset tracking
- **Real-time Collaboration** - Live document editing and team communication
- **Mobile Applications** - Native iOS and Android apps with offline capabilities
- **Advanced Workflows** - Visual workflow designer with complex logic support

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL with DrizzleORM
- **API**: GraphQL with Apollo Federation
- **Caching**: Redis for sessions and application cache
- **Search**: Elasticsearch for full-text search
- **Queue**: Bull Queue for background jobs
- **Storage**: S3-compatible object storage (MinIO)
- **Time Series**: TimescaleDB for IoT and analytics data

#### Frontend
- **Framework**: Next.js 14+ with App Router
- **UI**: Tailwind CSS with Headless UI components
- **State**: Zustand for global state, React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts and D3.js for visualizations

#### Mobile
- **Framework**: React Native with Expo
- **Offline**: SQLite with sync capabilities
- **Push**: Expo Notifications

#### Infrastructure
- **Monorepo**: Turborepo for build management
- **Containerization**: Docker with Docker Compose
- **CI/CD**: GitHub Actions (planned)
- **Monitoring**: Prometheus and Grafana (planned)

### Microservices Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Apps    │    │ Admin Dashboard │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ GraphQL Gateway │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Accounts Service│    │   Sales Service │    │Inventory Service│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+
- **Docker** and Docker Compose
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/kiro-erp.git
   cd kiro-erp
   ```

2. **Run the setup script**
   ```bash
   # On Windows
   npm run setup:win

   # On macOS/Linux
   npm run setup
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Access the applications**
   - Frontend: http://localhost:3000
   - GraphQL Playground: http://localhost:4000/graphql
   - Database Studio: http://localhost:5555

### Manual Setup

If you prefer to set up manually:

1. **Install dependencies**
   ```bash
   npm ci
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Docker services**
   ```bash
   npm run docker:up
   ```

4. **Set up database**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all development servers |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Run ESLint on all packages |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run health` | Run health checks |

## 📁 Project Structure

```
kiro-erp/
├── apps/                          # Applications
│   ├── api/                       # Backend API (NestJS)
│   ├── web/                       # Frontend Web App (Next.js)
│   └── mobile/                    # Mobile App (React Native)
├── packages/                      # Shared packages
│   ├── config/                    # Configuration management
│   ├── database/                  # Database schema and utilities
│   ├── ui/                        # Shared UI components
│   └── shared/                    # Shared utilities and types
├── scripts/                       # Development and deployment scripts
├── docs/                          # Documentation
├── .vscode/                       # VS Code configuration
├── docker-compose.yml             # Docker services configuration
├── turbo.json                     # Turborepo configuration
└── package.json                   # Root package configuration
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Structure

- **Unit Tests**: Located alongside source files (`*.test.ts`)
- **Integration Tests**: In `test/integration/` directories
- **E2E Tests**: In `test/e2e/` directories

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Docker Production

```bash
docker build -t kiro-erp .
docker run -p 3000:3000 -p 4000:4000 kiro-erp
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Other changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the foundation of [ERPNext](https://erpnext.com/)
- Inspired by modern ERP solutions and best practices
- Thanks to all contributors and the open-source community

## 📞 Support

- 📧 Email: support@kiro-erp.com
- 💬 Discord: [Join our community](https://discord.gg/kiro-erp)
- 📖 Documentation: [docs.kiro-erp.com](https://docs.kiro-erp.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/kiro-erp/issues)

---

<div align="center">
  <strong>Built with ❤️ by the KIRO ERP Team</strong>
</div>

# ERPNext Frontend Rebuild

A complete frontend rebuild of ERPNext using Next.js 14, maintaining 100% visual and functional parity with the existing Frappe-based system.

## 🎯 Project Overview

This project recreates the entire ERPNext frontend using modern web technologies while preserving every pixel, interaction, and business rule from the original system. It's not a modernization or improvement project - it's a precise recreation that ensures existing users experience zero disruption.

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with ERPNext design tokens
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components matching ERPNext exactly
- **Backend Integration**: Frappe REST API

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── layout/         # Layout components (Sidebar, Topbar, etc.)
│   ├── forms/          # Form-related components
│   ├── lists/          # List view components
│   ├── dashboard/      # Dashboard widgets
│   └── modules/        # Module-specific components
├── lib/                # Utility libraries
│   ├── api/           # API client and methods
│   ├── utils/         # Helper functions
│   ├── constants/     # Design tokens and constants
│   └── validations/   # Zod schemas
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── stores/             # Zustand stores
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd erpnext-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your Frappe backend URL
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📜 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🎨 Design System

The project includes a comprehensive design system extracted from the original ERPNext:

- **Colors**: Exact color palette matching ERPNext
- **Typography**: Font families, sizes, and weights
- **Spacing**: Consistent spacing scale
- **Components**: Pixel-perfect component recreation
- **Animations**: Matching transitions and effects

Design tokens are located in `src/lib/constants/design-tokens.ts`.

## 🔧 Code Quality

The project enforces code quality through:

- **ESLint**: Comprehensive linting rules for React, TypeScript, and accessibility
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Commitlint**: Conventional commit message format
- **TypeScript**: Strict type checking

## 🏗️ Architecture

### API Integration

The frontend integrates with the existing Frappe backend through:

- RESTful API calls using the existing endpoints
- WebSocket connections for real-time updates
- Session management compatible with Frappe authentication

### State Management

- **Zustand**: Global application state (auth, app settings)
- **React Query**: Server state management and caching
- **React Hook Form**: Form state management

### Component Architecture

Components are organized by functionality and follow ERPNext's exact structure:

- Dynamic form generation from DocType schemas
- List views with filtering, sorting, and pagination
- Dashboard widgets and charts
- Module-specific interfaces

## 🔒 Requirements Compliance

This rebuild maintains strict compliance with the original system:

- ✅ Pixel-perfect visual recreation
- ✅ Identical business logic and calculations
- ✅ Same keyboard shortcuts and interactions
- ✅ Compatible with existing Frappe backend
- ✅ Identical user workflows and processes

## 🚦 Development Guidelines

### Commit Convention

Follow conventional commits:

```
feat: add new component
fix: resolve calculation issue
docs: update README
style: format code
refactor: restructure component
test: add unit tests
chore: update dependencies
```

### Code Style

- Use TypeScript for all new code
- Follow the established component patterns
- Maintain pixel-perfect visual accuracy
- Write descriptive variable names
- Add JSDoc comments for complex functions

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Ensure all tests pass and code is formatted
4. Submit a pull request with a clear description

## 📄 License

This project follows the same license as ERPNext (GPL-3.0).

## 🔗 Related Links

- [ERPNext Documentation](https://docs.erpnext.com/)
- [Frappe Framework](https://frappeframework.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

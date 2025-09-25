# Contributing to KIRO ERP

Thank you for your interest in contributing to KIRO ERP! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher
- **Docker** and Docker Compose
- **Git**
- A code editor (VS Code recommended)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/kiro-erp.git
   cd kiro-erp
   ```

2. **Set up the development environment**
   ```bash
   # On Windows
   npm run setup:win

   # On macOS/Linux
   npm run setup
   ```

3. **Verify the setup**
   ```bash
   npm run health
   ```

## 📋 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run health checks
npm run health
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/). Please format your commits as follows:

```bash
git commit -m "feat: add user authentication module"
git commit -m "fix: resolve database connection issue"
git commit -m "doate API documentation"
```

#### Commit Types

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `build:` - Build system or external dependencies
- `ci:` - CI/CD changes
- `chore:` - Other changes

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Reference to related issues
- Screenshots (if applicable)
- Test results

## 🏗️ Code Style and Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use proper type annotations
- Avoid `any` type - use proper typing

```typescript
// Good
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Avoid
const user: any = { ... };
```

### Code Formatting

We use Prettier and ESLint for code formatting:

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix
```

### Naming Conventions

- **Files**: Use kebab-case (`user-service.ts`)
- **Directories**: Use kebab-case (`user-management/`)
- **Variables/Functions**: Use camelCase (`getUserById`)
- **Classes**: Use PascalCase (`UserService`)
- **Constants**: Use UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Interfaces**: Use PascalCase (`UserInterface` or just `User`)

### Database Guidelines

- Use DrizzleORM for database operations
- Follow the existing schema patterns
- Always create migrations for schema changes
- Use proper indexing for performance

```typescript
// Good
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### API Guidelines

- Use GraphQL for all API endpoints
- Follow the existing resolver patterns
- Implement proper error handling
- Add input validation using Zod schemas

```typescript
// Good
@Resolver(() => User)
export class UserResolver {
  @Query(() => User)
  async user(@Args('id') id: string): Promise<User> {
    return this.userService.findById(id);
  }
}
```

## 🧪 Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions/methods
- **Integration Tests**: Test service interactions
- **E2E Tests**: Test complete user workflows

### Writing Tests

```typescript
// Unit Test Example
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it('should create a user', async () => {
    const userData = { email: 'test@example.com' };
    const user = await service.create(userData);

    expect(user.email).toBe(userData.email);
    expect(user.id).toBeDefined();
  });
});
```

### Test Coverage

- Aim for at least 80% test coverage
- Focus on critical business logic
- Test error scenarios and edge cases

## 📚 Documentation

### Code Documentation

- Use JSDoc comments for functions and classes
- Document complex business logic
- Keep comments up-to-date with code changes

```typescript
/**
 * Creates a new user account with the provided information
 * @param userData - The user data to create the account with
 * @returns Promise<User> - The created user object
 * @throws {ValidationError} When user data is invalid
 */
async createUser(userData: CreateUserDto): Promise<User> {
  // Implementation
}
```

### README Updates

- Update README.md for new features
- Add examples for new APIs
- Update setup instructions if needed

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node.js version, browser, etc.
6. **Screenshots**: If applicable
7. **Logs**: Relevant error messages or logs

## 💡 Feature Requests

When requesting features, please include:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other solutions considered
4. **Use Cases**: Real-world scenarios
5. **Priority**: How important is this feature?

## 🔍 Code Review Process

### For Contributors

- Ensure all tests pass
- Keep PRs focused and small
- Respond to feedback promptly
- Update your branch with latest changes

### For Reviewers

- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security issues
- Verify tests cover the changes

## 📦 Package Management

### Adding Dependencies

- Use `npm install` for production dependencies
- Use `npm install --save-dev` for development dependencies
- Update package.json in the appropriate workspace
- Document why the dependency is needed

### Workspace Structure

```
packages/
├── config/          # Configuration management
├── database/        # Database schema and utilities
├── ui/             # Shared UI components
└── shared/         # Shared utilities and types

apps/
├── api/            # Backend API
├── web/            # Frontend web application
└── mobile/         # Mobile application
```

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Release notes prepared

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different opinions and approaches

### Communication

- Use GitHub Issues for bug reports and feature requests
- Use GitHub Discussions for questions and general discussion
- Join our Discord for real-time chat
- Be patient and helpful with responses

## 📞 Getting Help

If you need help:

1. Check the documentation
2. Search existing issues
3. Ask in GitHub Discussions
4. Join our Discord community
5. Contact maintainers directly

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Annual contributor highlights
- Special badges and mentions

Thank you for contributing to KIRO ERP! 🎉

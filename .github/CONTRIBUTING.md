# Contributing to Nebula Screen Capture

Thank you for your interest in contributing to Nebula Screen Capture! This document provides guidelines and instructions for contributing.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/YOUR-USERNAME/nebula-screen-capture.git`
3. **Install dependencies**: `npm install`
4. **Create a branch**: `git checkout -b feature/your-feature-name`
5. **Make your changes**
6. **Test your changes**: `npm test && npm run build`
7. **Commit**: `git commit -m "feat: your feature description"`
8. **Push**: `git push origin feature/your-feature-name`
9. **Create a Pull Request**

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Security](#security)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Report unacceptable behavior to colinnebula@gmail.com

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: 18+ (20 recommended)
- **Rust**: Latest stable (for Tauri builds)
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone https://github.com/ColinNebula/nebula-screen-capture.git
cd nebula-screen-capture

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure Firebase (optional for local dev):
   - Create a Firebase project
   - Add your credentials to `.env`
3. For full features, configure:
   - Firebase Authentication
   - Firebase Firestore
   - Firebase Storage

## 📁 Project Structure

```
nebula-screen-capture/
├── src/
│   ├── components/        # Svelte components
│   ├── services/          # Business logic and API services
│   ├── stores/            # Svelte stores (state management)
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   └── main.js            # Application entry point
├── src-tauri/             # Tauri (Rust) backend
│   ├── src/
│   │   └── main.rs        # Tauri main process
│   └── Cargo.toml         # Rust dependencies
├── public/                # Static assets
├── functions/             # Firebase Cloud Functions
├── .github/               # GitHub configuration
│   ├── workflows/         # CI/CD workflows
│   └── SECURITY.md        # Security policy
├── package.json           # Node.js dependencies
└── vite.config.js         # Vite configuration
```

## 🔄 Development Workflow

### Running the App

```bash
# Web development mode
npm run dev

# Tauri development mode (desktop app)
npm run tauri dev

# Build for production
npm run build

# Build Tauri installer
npm run tauri:build:installer
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.js
```

### Security Checks

Before committing, run:

```bash
# Comprehensive security and preparation check
.\prepare-for-github.ps1

# Quick check (skip audits)
.\prepare-for-github.ps1 -SkipAudit

# Auto-fix issues where possible
.\prepare-for-github.ps1 -Fix
```

## 📝 Coding Standards

### JavaScript/Svelte

- **ES6+** syntax
- **2 spaces** for indentation
- **Single quotes** for strings (except JSX)
- **Semicolons** required
- **Async/await** preferred over promises
- **Functional components** preferred in Svelte

### File Naming

- **Components**: PascalCase (e.g., `VideoEditor.svelte`)
- **Services**: camelCase (e.g., `authService.js`)
- **Utils**: camelCase (e.g., `formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE

### Code Style

```javascript
// ✅ Good
async function fetchUserData(userId) {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// ❌ Avoid
function getUserData(userId) {
  return new Promise((resolve, reject) => {
    api.getUser(userId).then(response => {
      resolve(response.data)
    }).catch(error => {
      console.log(error)
      reject(error)
    })
  })
}
```

### Security Best Practices

1. **Never hardcode secrets** - use environment variables
2. **Sanitize user input** - always validate and escape
3. **Use Content Security Policy** - already configured
4. **Avoid `eval()`** - never use dynamic code execution
5. **Use `textContent`** instead of `innerHTML` when possible
6. **Validate file uploads** - check types and sizes

## 💬 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security fixes

### Examples

```bash
# Feature
git commit -m "feat(video-editor): add trim functionality"

# Bug fix
git commit -m "fix(auth): resolve login redirect issue"

# Security
git commit -m "security: update dependencies with vulnerabilities"

# Documentation
git commit -m "docs: update README with installation instructions"
```

## 🧪 Testing

### Writing Tests

```javascript
// Example test
import { describe, test, expect } from 'vitest';
import { formatDuration } from './formatDate';

describe('formatDuration', () => {
  test('formats seconds correctly', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3661)).toBe('1:01:01');
  });
  
  test('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});
```

### Coverage Requirements

- **New features**: Add tests
- **Bug fixes**: Add regression test
- **Critical paths**: High coverage expected

## 🔒 Security

### Reporting Security Issues

**DO NOT** open a public issue for security vulnerabilities.

Email: **colinnebula@gmail.com**

Include:
- Vulnerability description
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

### Security Checklist

Before submitting:

- [ ] No hardcoded secrets or credentials
- [ ] User input is sanitized
- [ ] No use of dangerous functions (`eval`, `innerHTML` with untrusted data)
- [ ] Dependencies are up to date (`npm audit`)
- [ ] `.env` file is in `.gitignore`
- [ ] No sensitive data in commit history

## 🔀 Pull Request Process

### Before Submitting

1. **Update your fork**:
   ```bash
   git remote add upstream https://github.com/ColinNebula/nebula-screen-capture.git
   git fetch upstream
   git merge upstream/main
   ```

2. **Run security checks**:
   ```bash
   .\prepare-for-github.ps1
   ```

3. **Run tests**:
   ```bash
   npm test
   npm run build
   ```

4. **Update documentation** if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Security checks passed
```

### Review Process

1. **Automated checks** must pass:
   - Build succeeds
   - Tests pass
   - Security scan passes
   - No linting errors

2. **Code review** by maintainers:
   - Code quality
   - Security considerations
   - Performance impact
   - Documentation

3. **Approval and merge**:
   - At least 1 approval required
   - Maintainers will merge

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `feature`: New feature request
- `documentation`: Documentation improvements
- `security`: Security-related issues
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `priority: high`: Critical issues
- `priority: medium`: Important issues
- `priority: low`: Nice to have

## 🎯 Development Tips

### Hot Reload

The dev server supports hot module replacement (HMR):
- Changes to Svelte components reload instantly
- Changes to services may require manual reload

### Debugging

```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Check app version
console.log(APP_VERSION);

// Inspect stores
import { get } from 'svelte/store';
import { userStore } from './stores/user';
console.log(get(userStore));
```

### Common Issues

**Port 3001 already in use:**
```bash
# Kill process on port 3001
npx kill-port 3001
npm run dev
```

**WASM not loading:**
```bash
# Rebuild WASM modules
.\build-wasm.ps1
```

**Firebase auth errors:**
- Check `.env` configuration
- Verify Firebase project settings
- Check browser console for specific errors

## 📚 Resources

- [Svelte Documentation](https://svelte.dev/docs)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

## 💖 Support

- **Issues**: [GitHub Issues](https://github.com/ColinNebula/nebula-screen-capture/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ColinNebula/nebula-screen-capture/discussions)
- **Email**: colinnebula@gmail.com

## 🙏 Recognition

Contributors will be acknowledged in:
- README.md
- Release notes
- Project documentation

Thank you for contributing to Nebula Screen Capture! 🚀

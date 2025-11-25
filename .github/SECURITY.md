# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Nebula Screen Capture, please report it by emailing **colinnebula@gmail.com** with the following information:

- Type of vulnerability
- Full paths of affected source files
- Location of the affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Impact of the issue

**Please do NOT:**
- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before we've had a chance to address it

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies based on severity (High: 7-14 days, Medium: 14-30 days)

## Security Measures

### Code Security
- Content Security Policy (CSP) implemented
- Input sanitization and validation
- XSS protection
- CSRF protection
- Rate limiting

### Data Security
- Firebase Authentication with secure session management
- Encrypted data transmission (HTTPS/TLS)
- Secure credential storage
- No sensitive data in localStorage without encryption

### Build Security
- Code signing for releases
- Dependency scanning with npm audit
- Regular security updates
- Minimal third-party dependencies

### API Security
- Environment variable protection
- API key rotation
- Rate limiting on all endpoints
- Input validation and sanitization

## Security Best Practices for Contributors

1. **Never commit sensitive data:**
   - API keys, tokens, passwords
   - Private keys or certificates
   - User data or credentials

2. **Use environment variables:**
   - Store secrets in `.env` (never committed)
   - Use `.env.example` as template

3. **Validate all inputs:**
   - Sanitize user input
   - Validate file uploads
   - Check URL parameters

4. **Keep dependencies updated:**
   - Run `npm audit` regularly
   - Update vulnerable packages
   - Review security advisories

5. **Follow secure coding practices:**
   - Use prepared statements for queries
   - Implement proper authentication
   - Use HTTPS everywhere
   - Enable CORS carefully

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who report vulnerabilities responsibly.

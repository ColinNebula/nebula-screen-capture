# 🔒 Security Best Practices for Nebula Screen Capture

## Quick Security Checklist

### Before Deployment
- [ ] Change default admin credentials
- [ ] Update all environment variables
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Enable HTTPS
- [ ] Review and test CSP headers
- [ ] Remove or disable source maps in production
- [ ] Test all security features

### GitHub Repository Security
- [ ] Enable Dependabot for automated security updates
- [ ] Enable secret scanning
- [ ] Set up branch protection on `main`
- [ ] Require code reviews before merging
- [ ] Enable signed commits (recommended)
- [ ] Review repository visibility settings

### Environment Configuration
- [ ] Never commit `.env` files
- [ ] Use `.env.example` as template only
- [ ] Rotate secrets regularly
- [ ] Use different credentials for dev/prod
- [ ] Store production secrets securely

## Security Features Enabled

### 1. Content Security Policy (CSP)
Protects against:
- Cross-Site Scripting (XSS)
- Code injection attacks
- Clickjacking
- Data theft

**Configuration**: `public/index.html`
```html
<meta http-equiv="Content-Security-Policy" content="...">
```

### 2. Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Restricts browser features

### 3. Input Sanitization
All user inputs are sanitized using `src/utils/security.js`:
- HTML sanitization
- URL validation
- Email validation
- Filename sanitization
- XSS detection
- SQL injection detection

### 4. Authentication Security
- Password hashing (SHA-256 client-side)
- Password strength validation
- Rate limiting (5 attempts per 5 minutes)
- Session timeout (1 hour default)
- Secure token generation

### 5. File Upload Security
- MIME type validation
- File size limits
- Dangerous file extension blocking
- Path traversal prevention

### 6. Data Protection
- Local storage encryption
- Checksum verification
- Secure data transmission (HTTPS only)
- No sensitive data in URLs

## Security Testing

### Automated Security Checks
```bash
# Run security audit
npm audit

# Check for outdated packages
npm outdated

# Run all security checks
npm run security:check

# Fix vulnerabilities
npm run audit:fix
```

### Manual Security Testing

#### Test CSP Headers
1. Open browser DevTools
2. Check Console for CSP violations
3. Verify network requests follow CSP rules

#### Test XSS Protection
```javascript
import { isSafeFromXSS } from './utils/security';

// Should return false (unsafe)
isSafeFromXSS('<script>alert("XSS")</script>');
```

#### Test Rate Limiting
1. Attempt login 5 times rapidly
2. Verify 6th attempt is blocked
3. Wait 5 minutes and try again

#### Verify Security Logs
```javascript
import { getSecurityLogs } from './utils/security';
console.log(getSecurityLogs());
```

## Common Security Mistakes to Avoid

### ❌ DON'T
- Commit `.env` files to git
- Use `eval()` or `Function()` constructors
- Use `dangerouslySetInnerHTML` without sanitization
- Store passwords in plain text
- Disable security features in production
- Use HTTP in production
- Hardcode API keys or secrets
- Trust user input without validation

### ✅ DO
- Always sanitize user inputs
- Use HTTPS everywhere
- Validate file uploads
- Implement rate limiting
- Log security events
- Keep dependencies updated
- Use environment variables for secrets
- Test security regularly
- Review code for security issues

## Security Event Logging

### Viewing Security Logs
```javascript
// In browser console
import { getSecurityLogs } from './utils/security';
const logs = getSecurityLogs();
console.table(logs);
```

### Types of Logged Events
- `app_initialized` - App startup
- `login_attempt` - User login attempts
- `rate_limit_exceeded` - Too many requests
- `xss_attempt_blocked` - XSS attack blocked
- `file_upload_rejected` - Invalid file upload
- `session_timeout` - Session expired
- `integrity_check_failed` - Security check failed
- `devtools_detected` - DevTools opened (production)

## Admin Access Security

### Hidden Admin Access
Admin login is hidden from normal users and accessible only via:
- **Keyboard Shortcut**: `Alt + O`
- No visible UI button
- Prevents casual discovery

### Default Credentials
```
Username: admin
Password: Nebula@Admin2025!
```

**⚠️ CRITICAL**: Change these immediately in production!

### Securing Admin Credentials

1. **Update `.env`**:
```bash
REACT_APP_ADMIN_USERNAME=your-secure-username
REACT_APP_ADMIN_PASSWORD=YourStrongPassword123!@#
REACT_APP_ADMIN_EMAIL=your-admin@domain.com
```

2. **Use Strong Password**:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- Unique to this application

3. **Production Recommendations**:
- Use backend authentication
- Implement 2FA/MFA
- Use JWT tokens
- Hash passwords with bcrypt/Argon2
- Store sessions server-side
- Implement account lockout after failed attempts

## GitHub Security Features

### Enable Dependabot
1. Go to repository Settings
2. Navigate to Security & analysis
3. Enable "Dependabot alerts"
4. Enable "Dependabot security updates"

### Enable Secret Scanning
1. Go to repository Settings
2. Navigate to Security & analysis
3. Enable "Secret scanning"

### Branch Protection
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

## Incident Response

### If You Suspect a Security Breach

1. **Immediate Actions**:
   - Change all credentials immediately
   - Review security logs
   - Check for unauthorized access
   - Disable compromised accounts

2. **Investigation**:
   - Review recent commits
   - Check deployment logs
   - Analyze security event logs
   - Identify vulnerability

3. **Remediation**:
   - Patch vulnerability
   - Update dependencies
   - Rotate all secrets
   - Notify affected users

4. **Prevention**:
   - Document incident
   - Update security procedures
   - Add automated tests
   - Review code for similar issues

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [CSP Reference](https://content-security-policy.com/)
- [npm Audit Docs](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Security](https://docs.github.com/en/code-security)

## Security Contact

For security issues:
- **DO NOT** create public GitHub issues
- Email: [Your Security Email]
- Include detailed description and steps to reproduce

## Compliance

This application implements security measures to help comply with:
- GDPR (data protection)
- OWASP Top 10 (web security)
- CSP Level 3 (content security)
- Secure Development Lifecycle

---

**Last Updated**: January 7, 2025
**Security Version**: 1.0.0

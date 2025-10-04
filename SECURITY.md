# Security Policy

## 🔒 Security Overview

Nebula Screen Capture takes security seriously. This document outlines our security practices, how to report vulnerabilities, and our commitment to protecting user data.

## 🛡️ Security Features

### 1. Content Security Policy (CSP)
- Strict CSP headers prevent XSS attacks
- No inline script execution from untrusted sources
- Whitelisted sources for scripts, styles, and media
- `frame-ancestors: none` prevents clickjacking

### 2. Input Validation & Sanitization
- All user inputs are validated and sanitized
- Filename validation prevents directory traversal attacks
- HTML sanitization prevents XSS injection
- URL validation prevents SSRF and open redirect attacks

### 3. Secure Context Requirements
- App requires HTTPS in production
- Screen Capture API only works in secure contexts
- Service workers require secure origins

### 4. Client-Side Security
- Rate limiting on user actions
- Secure random ID generation using Web Crypto API
- Clickjacking protection
- MIME type validation

### 5. Data Protection
- All recordings stored locally in browser (IndexedDB)
- No data transmitted to external servers
- Secure storage wrapper with validation
- Blob URL validation for media resources

### 6. HTTP Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Referrer-Policy` - Limits information leakage
- `Permissions-Policy` - Restricts browser features

### 7. Dependency Security
- Regular `npm audit` checks
- Automated dependency updates via Dependabot
- No dependencies with known high-severity vulnerabilities
- Minimal third-party dependencies

## 🚨 Reporting Security Vulnerabilities

We take all security vulnerabilities seriously. If you discover a security issue, please follow responsible disclosure:

### Please DO:
1. **Email us privately** at: [your-security-email@example.com]
2. Provide detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Allow us reasonable time to fix the issue before public disclosure (90 days recommended)
4. Act in good faith - don't access or modify user data

### Please DON'T:
- Publicly disclose the vulnerability before we've had a chance to fix it
- Access or modify other users' data
- Perform destructive testing (DoS attacks, etc.)
- Exploit the vulnerability for malicious purposes

### Response Timeline
- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Based on severity (Critical: 7 days, High: 30 days, Medium: 60 days, Low: 90 days)

## 🎯 Scope

### In Scope
✅ Cross-Site Scripting (XSS)
✅ Cross-Site Request Forgery (CSRF)
✅ Injection vulnerabilities (SQL, HTML, etc.)
✅ Authentication/Authorization issues
✅ Insecure data storage
✅ Security misconfigurations
✅ Dependency vulnerabilities
✅ Clickjacking
✅ Information disclosure

### Out of Scope
❌ Social engineering attacks
❌ Denial of Service (DoS) attacks
❌ Physical security
❌ Issues in third-party dependencies (report to the dependency maintainer)
❌ Issues requiring user interaction (e.g., installing malicious extensions)
❌ Theoretical vulnerabilities without proof of concept

## 🔐 Security Best Practices for Users

### For End Users:
1. **Use HTTPS:** Always access the app via HTTPS
2. **Keep Browser Updated:** Use the latest browser version
3. **Review Permissions:** Only grant screen recording permissions when needed
4. **Download Recordings Promptly:** Don't store sensitive recordings indefinitely
5. **Use Trusted Networks:** Avoid using on public/untrusted networks for sensitive recordings

### For Developers/Contributors:
1. **Never Commit Secrets:** No API keys, tokens, or credentials in code
2. **Validate All Inputs:** Always sanitize user inputs
3. **Use Security Utilities:** Use provided security.js utilities
4. **Run Security Audits:** `npm audit` before every commit
5. **Follow Secure Coding:** Follow OWASP guidelines
6. **Review Dependencies:** Check new dependencies for security issues
7. **Test Security:** Include security tests in your PRs

## 🔍 Security Checklist

Before deploying:
- [ ] All dependencies pass `npm audit`
- [ ] CSP headers are properly configured
- [ ] All external resources use SRI (if applicable)
- [ ] Input validation on all user inputs
- [ ] HTTPS enforced in production
- [ ] Security headers applied
- [ ] No secrets in code or env files
- [ ] Rate limiting implemented on actions
- [ ] Error messages don't leak sensitive info
- [ ] Browser console disabled in production

## 📋 Known Limitations

### Browser-Based Limitations:
1. **Local Storage:** Recordings stored in browser can be cleared by user or browser
2. **Browser Extensions:** Malicious browser extensions could potentially access data
3. **Physical Access:** Anyone with physical access to the device can access recordings

### Platform-Specific:
1. **iOS Safari:** Limited screen recording API support
2. **Private Browsing:** May have reduced functionality
3. **Mobile Browsers:** Some features may be limited

## 🔄 Security Update Policy

- **Critical vulnerabilities:** Patched within 24-48 hours
- **High severity:** Patched within 7 days
- **Medium severity:** Patched within 30 days
- **Low severity:** Patched in next regular release

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Reference](https://content-security-policy.com/)
- [Web Security Guidelines](https://web.dev/secure/)
- [Mozilla Security Best Practices](https://infosec.mozilla.org/guidelines/web_security)

## 🏆 Security Hall of Fame

We recognize and thank security researchers who responsibly disclose vulnerabilities:

_No vulnerabilities reported yet - be the first!_

## 📞 Contact

- **Security Email:** [your-security-email@example.com]
- **General Issues:** [GitHub Issues](https://github.com/ColinNebula/nebula-screen-capture/issues)
- **Project Maintainer:** Colin Nebula

## 📄 License

This security policy is part of the Nebula Screen Capture project and follows the same license as the main project.

---

**Last Updated:** October 4, 2025
**Version:** 1.0.0

Thank you for helping keep Nebula Screen Capture secure! 🙏

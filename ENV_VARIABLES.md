# Environment Variables Documentation

This document explains all environment variables used in Nebula Screen Capture.

## 📋 Table of Contents
- [Setup Instructions](#setup-instructions)
- [App Configuration](#app-configuration)
- [Recording Settings](#recording-settings)
- [Security Settings](#security-settings)
- [Admin Configuration](#admin-configuration)
- [Third-Party Services](#third-party-services)
- [Feature Flags](#feature-flags)
- [Production Deployment](#production-deployment)

## 🚀 Setup Instructions

1. **Copy the template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   - Update deployment URLs
   - Configure admin credentials
   - Add API keys for third-party services
   - Adjust feature flags as needed

3. **Restart the development server:**
   ```bash
   npm start
   ```

## 🔧 App Configuration

### Basic Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_VERSION` | `1.0.0` | Application version number |
| `REACT_APP_NAME` | `Nebula Screen Capture` | Application name |
| `NODE_ENV` | `development` | Environment: development/production/test |

### Deployment URLs
| Variable | Example | Description |
|----------|---------|-------------|
| `PUBLIC_URL` | `https://user.github.io/app` | Base URL for deployed app |
| `REACT_APP_BASE_URL` | `/nebula-screen-capture` | Path prefix for routing |

## 🎥 Recording Settings

### Video Quality & Limits
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_MAX_RECORDING_DURATION` | `3600000` | Max duration in milliseconds (1 hour) |
| `REACT_APP_MAX_FILE_SIZE` | `524288000` | Max file size in bytes (500 MB) |
| `REACT_APP_DEFAULT_VIDEO_QUALITY` | `1080p` | Options: 480p, 720p, 1080p, 4K |
| `REACT_APP_DEFAULT_FRAME_RATE` | `30` | Frames per second |
| `REACT_APP_DEFAULT_VIDEO_CODEC` | `VP9` | Options: VP8, VP9, H264 |
| `REACT_APP_DEFAULT_AUDIO_CODEC` | `opus` | Options: opus, pcm |
| `REACT_APP_DEFAULT_AUDIO_BITRATE` | `128000` | Audio bitrate in bps |

### Storage Quotas (in MB)
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_FREE_STORAGE_QUOTA` | `500` | Free plan storage (500 MB) |
| `REACT_APP_PRO_STORAGE_QUOTA` | `10240` | Pro plan storage (10 GB) |
| `REACT_APP_PREMIUM_STORAGE_QUOTA` | `102400` | Premium plan storage (100 GB) |
| `REACT_APP_ADMIN_STORAGE_QUOTA` | `0` | Admin unlimited (0 = infinite) |

### Recording Limits
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_FREE_RECORDING_LIMIT` | `10` | Free plan monthly limit |
| `REACT_APP_PRO_RECORDING_LIMIT` | `0` | Pro unlimited (0 = infinite) |
| `REACT_APP_PREMIUM_RECORDING_LIMIT` | `0` | Premium unlimited |
| `REACT_APP_ADMIN_RECORDING_LIMIT` | `0` | Admin unlimited |

## 🔐 Security Settings

### Rate Limiting
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_RATE_LIMIT_REQUESTS` | `10` | Max requests per window |
| `REACT_APP_RATE_LIMIT_WINDOW` | `60000` | Time window in ms (1 minute) |
| `REACT_APP_MAX_LOGIN_ATTEMPTS` | `5` | Max failed login attempts |
| `REACT_APP_LOCKOUT_DURATION` | `900000` | Lockout duration in ms (15 min) |

### Session Management
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_SESSION_TIMEOUT` | `3600000` | Session timeout in ms (1 hour) |
| `REACT_APP_SESSION_REFRESH_INTERVAL` | `300000` | Refresh interval in ms (5 min) |
| `REACT_APP_REMEMBER_ME_DURATION` | `2592000000` | Remember me duration (30 days) |

### Security Flags
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_ENABLE_CSP` | `true` | Enable Content Security Policy |
| `REACT_APP_ENABLE_HTTPS_ONLY` | `true` | Force HTTPS in production |

## 👨‍💼 Admin Configuration

### Admin Credentials
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_ADMIN_USERNAME` | `admin` | Admin username for login |
| `REACT_APP_ADMIN_PASSWORD` | `Nebula@Admin2025!` | **⚠️ CHANGE IN PRODUCTION!** |
| `REACT_APP_ADMIN_EMAIL` | `admin@nebula-capture.com` | Admin email address |

**⚠️ SECURITY WARNING:**
- Change default admin credentials immediately in production
- Use strong, unique passwords
- Consider implementing 2FA
- Store credentials in secure secret management service

## 🔌 Third-Party Services

### Analytics
```env
REACT_APP_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
REACT_APP_MIXPANEL_TOKEN=your_mixpanel_token
```

### Error Tracking (Sentry)
```env
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx
REACT_APP_SENTRY_ENVIRONMENT=production
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=0.1
```

### Cloud Storage (AWS S3)
```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_BUCKET=nebula-recordings
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Payment Processing (Stripe)
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
REACT_APP_STRIPE_PRO_PRICE_ID=price_xxxxx
REACT_APP_STRIPE_PREMIUM_PRICE_ID=price_xxxxx
```

### OAuth Providers
```env
REACT_APP_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
REACT_APP_GITHUB_CLIENT_ID=xxxxx
REACT_APP_MICROSOFT_CLIENT_ID=xxxxx
```

## 🎛️ Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_ENABLE_ANALYTICS` | `false` | Enable analytics tracking |
| `REACT_APP_ENABLE_ERROR_TRACKING` | `false` | Enable error reporting |
| `REACT_APP_ENABLE_DEBUG_MODE` | `true` | Show debug information |
| `REACT_APP_ENABLE_SERVICE_WORKER` | `true` | Enable PWA service worker |
| `REACT_APP_ENABLE_PWA` | `true` | Enable Progressive Web App |
| `REACT_APP_ENABLE_OFFLINE_MODE` | `true` | Enable offline functionality |
| `REACT_APP_ENABLE_ANIMATIONS` | `true` | Enable UI animations |
| `REACT_APP_ENABLE_NOTIFICATIONS` | `true` | Enable push notifications |
| `REACT_APP_ENABLE_BETA_FEATURES` | `false` | Enable experimental features |

## 🌐 Production Deployment

### GitHub Pages
```env
NODE_ENV=production
PUBLIC_URL=https://ColinNebula.github.io/nebula-screen-capture
REACT_APP_BASE_URL=/nebula-screen-capture
GENERATE_SOURCEMAP=false
REACT_APP_ENABLE_DEBUG_MODE=false
```

### Netlify
```env
NODE_ENV=production
PUBLIC_URL=https://nebula-capture.netlify.app
REACT_APP_BASE_URL=/
GENERATE_SOURCEMAP=false
```

### Vercel
```env
NODE_ENV=production
PUBLIC_URL=https://nebula-capture.vercel.app
REACT_APP_BASE_URL=/
GENERATE_SOURCEMAP=false
```

### Custom Domain
```env
NODE_ENV=production
PUBLIC_URL=https://nebula-capture.com
REACT_APP_BASE_URL=/
GENERATE_SOURCEMAP=false
REACT_APP_ENABLE_HTTPS_ONLY=true
```

## 🧪 Development vs Production

### Development (.env)
```env
NODE_ENV=development
REACT_APP_ENABLE_DEBUG_MODE=true
REACT_APP_ENABLE_CONSOLE_LOGS=true
REACT_APP_LOG_LEVEL=debug
GENERATE_SOURCEMAP=true
FAST_REFRESH=true
```

### Production (.env.production)
```env
NODE_ENV=production
REACT_APP_ENABLE_DEBUG_MODE=false
REACT_APP_ENABLE_CONSOLE_LOGS=false
REACT_APP_LOG_LEVEL=error
GENERATE_SOURCEMAP=false
REACT_APP_ENABLE_ERROR_TRACKING=true
REACT_APP_ENABLE_ANALYTICS=true
```

## 📝 Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use different .env files per environment**
   - `.env.development`
   - `.env.production`
   - `.env.test`

3. **Secrets Management**
   - Use GitHub Secrets for CI/CD
   - Use AWS Secrets Manager / Azure Key Vault for production
   - Rotate credentials regularly

4. **Validation**
   - Validate required env vars on startup
   - Provide meaningful defaults
   - Document all variables

5. **Security**
   - Change default admin credentials
   - Use strong passwords
   - Enable 2FA where possible
   - Review security settings regularly

## 🔍 Debugging

### Check loaded environment variables:
```javascript
console.log('Environment:', process.env.NODE_ENV);
console.log('Public URL:', process.env.PUBLIC_URL);
console.log('All REACT_APP vars:', 
  Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {})
);
```

### Common Issues:
1. **Variables not loading?**
   - Restart dev server after changing .env
   - Ensure variable name starts with `REACT_APP_`
   - Check for typos in variable names

2. **Different values in production?**
   - Check build-time vs runtime variables
   - Verify deployment platform environment settings
   - Review build logs for env var injection

## 📚 Additional Resources

- [Create React App - Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [12-Factor App Methodology](https://12factor.net/config)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## 🆘 Support

If you need help with environment configuration:
- Check this documentation first
- Review `.env.example` for all available options
- Open an issue on GitHub
- Contact support@nebula-capture.com

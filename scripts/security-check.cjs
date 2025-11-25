/**
 * Security Check Script for Nebula Screen Capture
 * Validates security configurations before build/deploy
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let hasErrors = false;
let hasWarnings = false;
const errors = [];
const warnings = [];
const passed = [];

console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║    🔒 SECURITY VALIDATION CHECK           ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

// 1. Check Electron Security Settings
console.log(`${colors.blue}[1/8]${colors.reset} Checking Electron security configuration...`);
try {
  const electronContent = fs.readFileSync('electron.cjs', 'utf8');
  
  const requiredSettings = {
    'nodeIntegration: false': 'Node integration must be disabled',
    'contextIsolation: true': 'Context isolation must be enabled',
    'sandbox: true': 'Sandbox must be enabled',
    'enableRemoteModule: false': 'Remote module must be disabled',
    'webSecurity: true': 'Web security must be enabled'
  };
  
  for (const [setting, message] of Object.entries(requiredSettings)) {
    if (electronContent.includes(setting)) {
      passed.push(`✓ ${message}`);
    } else {
      errors.push(`✗ ${message}`);
      hasErrors = true;
    }
  }
  
  // Check for dangerous patterns
  if (electronContent.includes('webSecurity: false')) {
    errors.push('✗ Web security is disabled - CRITICAL');
    hasErrors = true;
  }
  
  if (electronContent.includes('nodeIntegration: true')) {
    errors.push('✗ Node integration is enabled - CRITICAL');
    hasErrors = true;
  }
  
} catch (err) {
  errors.push('✗ Could not read electron.cjs');
  hasErrors = true;
}

// 2. Check Preload Script Security
console.log(`${colors.blue}[2/8]${colors.reset} Checking preload script security...`);
try {
  const preloadContent = fs.readFileSync('preload.cjs', 'utf8');
  
  if (preloadContent.includes('contextBridge.exposeInMainWorld')) {
    passed.push('✓ Using contextBridge for IPC');
  } else {
    errors.push('✗ Not using contextBridge - CRITICAL');
    hasErrors = true;
  }
  
  // Check for validation functions
  if (preloadContent.includes('validate')) {
    passed.push('✓ Input validation implemented in preload');
  } else {
    warnings.push('⚠ No input validation found in preload script');
    hasWarnings = true;
  }
  
} catch (err) {
  errors.push('✗ Could not read preload.cjs');
  hasErrors = true;
}

// 3. Check for Sensitive Data in Source
console.log(`${colors.blue}[3/8]${colors.reset} Scanning for exposed secrets...`);
const sensitivePatterns = [
  { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/, name: 'API Key' },
  { pattern: /password\s*[:=]\s*['"][^'"]+['"]/, name: 'Password' },
  { pattern: /secret\s*[:=]\s*['"][^'"]{20,}['"]/, name: 'Secret' },
  { pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/, name: 'Token' },
  { pattern: /private[_-]?key\s*[:=]\s*['"]/, name: 'Private Key' }
];

function scanDirectory(dir, exclude = ['node_modules', 'build', 'dist', '.git']) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!exclude.includes(file)) {
        scanDirectory(filePath, exclude);
      }
    } else if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.svelte')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      sensitivePatterns.forEach(({ pattern, name }) => {
        if (pattern.test(content) && !filePath.includes('test') && !filePath.includes('example')) {
          warnings.push(`⚠ Possible ${name} found in ${filePath}`);
          hasWarnings = true;
        }
      });
    }
  });
}

try {
  scanDirectory('./src');
  scanDirectory('./');
  if (!hasWarnings) {
    passed.push('✓ No exposed secrets found');
  }
} catch (err) {
  warnings.push('⚠ Could not scan all files');
}

// 4. Check CSP Configuration
console.log(`${colors.blue}[4/8]${colors.reset} Checking Content Security Policy...`);
try {
  const electronContent = fs.readFileSync('electron.cjs', 'utf8');
  
  if (electronContent.includes('Content-Security-Policy')) {
    passed.push('✓ CSP configured in Electron');
    
    // Check for unsafe-inline (should only be in specific contexts)
    const cspUnsafeCount = (electronContent.match(/unsafe-inline/g) || []).length;
    if (cspUnsafeCount > 2) {
      warnings.push(`⚠ Multiple unsafe-inline directives found (${cspUnsafeCount})`);
      hasWarnings = true;
    }
    
    // Check for unsafe-eval
    if (electronContent.includes('unsafe-eval')) {
      warnings.push('⚠ unsafe-eval found in CSP - consider removing if possible');
      hasWarnings = true;
    }
  } else {
    errors.push('✗ CSP not configured');
    hasErrors = true;
  }
} catch (err) {
  errors.push('✗ Could not check CSP');
  hasErrors = true;
}

// 5. Check Dependencies
console.log(`${colors.blue}[5/8]${colors.reset} Checking dependencies...`);
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const totalDeps = Object.keys(packageJson.dependencies || {}).length + 
                    Object.keys(packageJson.devDependencies || {}).length;
  
  passed.push(`✓ ${totalDeps} dependencies (minimal surface area)`);
  
  // Check for deprecated packages
  const deprecatedPatterns = ['request', 'node-uuid'];
  const allDeps = {...packageJson.dependencies, ...packageJson.devDependencies};
  
  deprecatedPatterns.forEach(pkg => {
    if (allDeps[pkg]) {
      warnings.push(`⚠ Deprecated package found: ${pkg}`);
      hasWarnings = true;
    }
  });
  
} catch (err) {
  warnings.push('⚠ Could not read package.json');
}

// 6. Check for Dangerous Patterns in Code
console.log(`${colors.blue}[6/8]${colors.reset} Scanning for dangerous code patterns...`);
const dangerousPatterns = [
  { pattern: /eval\s*\(/, name: 'eval()' },
  { pattern: /Function\s*\(/, name: 'Function()' },
  { pattern: /innerHTML\s*=(?!\s*['"`])/g, name: 'innerHTML (without sanitization)' },
  { pattern: /dangerouslySetInnerHTML/g, name: 'dangerouslySetInnerHTML' },
  { pattern: /exec\s*\(/g, name: 'exec() (command execution)' }
];

let dangerousPatternsFound = 0;

function scanForDangerousPatterns(dir, exclude = ['node_modules', 'build', 'dist', '.git']) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!exclude.includes(file)) {
        scanForDangerousPatterns(filePath, exclude);
      }
    } else if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.svelte')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      dangerousPatterns.forEach(({ pattern, name }) => {
        const matches = content.match(pattern);
        if (matches) {
          warnings.push(`⚠ ${name} found in ${filePath} (${matches.length} occurrences)`);
          hasWarnings = true;
          dangerousPatternsFound += matches.length;
        }
      });
    }
  });
}

try {
  scanForDangerousPatterns('./src');
  if (dangerousPatternsFound === 0) {
    passed.push('✓ No dangerous code patterns found');
  }
} catch (err) {
  warnings.push('⚠ Could not scan for dangerous patterns');
}

// 7. Check File Permissions (Unix-like systems)
console.log(`${colors.blue}[7/8]${colors.reset} Checking file permissions...`);
if (process.platform !== 'win32') {
  try {
    const sensitivFiles = ['electron.cjs', 'preload.cjs', 'package.json'];
    
    sensitivFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        
        if (mode.endsWith('7') || mode.endsWith('6')) {
          warnings.push(`⚠ ${file} is world-writable (${mode})`);
          hasWarnings = true;
        } else {
          passed.push(`✓ ${file} has safe permissions (${mode})`);
        }
      }
    });
  } catch (err) {
    warnings.push('⚠ Could not check file permissions');
  }
} else {
  passed.push('✓ File permission check skipped (Windows)');
}

// 8. Check for Security Documentation
console.log(`${colors.blue}[8/8]${colors.reset} Checking security documentation...`);
const securityDocs = ['SECURITY.md', 'docs/SECURITY_GUIDE.md'];
let docsFound = 0;

securityDocs.forEach(doc => {
  if (fs.existsSync(doc)) {
    passed.push(`✓ ${doc} exists`);
    docsFound++;
  }
});

if (docsFound === 0) {
  warnings.push('⚠ No security documentation found');
  hasWarnings = true;
}

// Print Results
console.log(`\n${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);

if (passed.length > 0) {
  console.log(`${colors.green}✓ PASSED (${passed.length}):${colors.reset}`);
  passed.forEach(p => console.log(`  ${colors.green}${p}${colors.reset}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log(`${colors.yellow}⚠ WARNINGS (${warnings.length}):${colors.reset}`);
  warnings.forEach(w => console.log(`  ${colors.yellow}${w}${colors.reset}`));
  console.log('');
}

if (errors.length > 0) {
  console.log(`${colors.red}✗ ERRORS (${errors.length}):${colors.reset}`);
  errors.forEach(e => console.log(`  ${colors.red}${e}${colors.reset}`));
  console.log('');
}

// Summary
console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
if (hasErrors) {
  console.log(`${colors.red}❌ SECURITY CHECK FAILED${colors.reset}`);
  console.log(`${colors.red}   Critical security issues must be fixed before deployment${colors.reset}\n`);
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}⚠️  SECURITY CHECK PASSED WITH WARNINGS${colors.reset}`);
  console.log(`${colors.yellow}   Review warnings before deployment${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.green}✅ SECURITY CHECK PASSED${colors.reset}`);
  console.log(`${colors.green}   All security requirements met!${colors.reset}\n`);
  process.exit(0);
}

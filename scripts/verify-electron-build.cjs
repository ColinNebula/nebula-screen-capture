/**
 * Pre-build verification script for Electron
 * Ensures all necessary files exist before building
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'electron.cjs',
  'preload.cjs',
  'package.json',
  'electron-builder.json',
  'build/index.html'
];

const requiredDirs = [
  'build',
  'build/static'
];

console.log('🔍 Verifying Electron build requirements...\n');

let hasErrors = false;

// Check required files
console.log('Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (!exists) hasErrors = true;
});

console.log('\nChecking required directories:');
requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${dir}`);
  if (!exists) hasErrors = true;
});

// Check build output
console.log('\nChecking build output:');
if (fs.existsSync('build/static')) {
  const staticFiles = fs.readdirSync('build/static');
  const jsFiles = staticFiles.filter(f => f.endsWith('.js'));
  const cssFiles = staticFiles.filter(f => f.endsWith('.css'));
  
  console.log(`  📦 JS files: ${jsFiles.length}`);
  console.log(`  🎨 CSS files: ${cssFiles.length}`);
  
  if (jsFiles.length === 0) {
    console.log('  ❌ No JavaScript files found in build/static');
    hasErrors = true;
  }
}

// Check electron-builder config
console.log('\nChecking electron-builder config:');
try {
  const config = JSON.parse(fs.readFileSync('electron-builder.json', 'utf8'));
  
  // Verify preload.cjs is referenced
  const hasPreloadCjs = config.files && config.files.includes('preload.cjs');
  console.log(`  ${hasPreloadCjs ? '✅' : '❌'} preload.cjs in files list`);
  if (!hasPreloadCjs) hasErrors = true;
  
  // Verify build directory is referenced
  const hasBuildFiles = config.files && config.files.some(f => f.includes('build'));
  console.log(`  ${hasBuildFiles ? '✅' : '❌'} build files included`);
  if (!hasBuildFiles) hasErrors = true;
  
} catch (error) {
  console.log(`  ❌ Error reading electron-builder.json: ${error.message}`);
  hasErrors = true;
}

// Check electron.cjs references correct preload
console.log('\nChecking electron.cjs configuration:');
try {
  const electronCjs = fs.readFileSync('electron.cjs', 'utf8');
  
  const hasPreloadCjs = electronCjs.includes('preload.cjs');
  console.log(`  ${hasPreloadCjs ? '✅' : '❌'} References preload.cjs`);
  if (!hasPreloadCjs) hasErrors = true;
  
  const loadsBuildIndex = electronCjs.includes('build/index.html');
  console.log(`  ${loadsBuildIndex ? '✅' : '❌'} Loads build/index.html`);
  if (!loadsBuildIndex) hasErrors = true;
  
} catch (error) {
  console.log(`  ❌ Error reading electron.cjs: ${error.message}`);
  hasErrors = true;
}

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ VERIFICATION FAILED - Fix issues before building');
  process.exit(1);
} else {
  console.log('✅ ALL CHECKS PASSED - Ready to build Electron app');
  process.exit(0);
}

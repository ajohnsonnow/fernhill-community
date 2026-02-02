#!/usr/bin/env node
/**
 * Fernhill Community - Automated Audit Script
 * 
 * Runs Lighthouse audits and generates a comprehensive report.
 * 
 * Usage:
 *   npm run audit              # Full audit
 *   npm run audit:mobile       # Mobile-only audit
 *   npm run audit:desktop      # Desktop-only audit
 * 
 * Requirements:
 *   - Chrome/Chromium installed
 *   - Dev server running (npm run dev)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  url: process.env.AUDIT_URL || 'http://localhost:3000',
  outputDir: path.join(__dirname, '..', 'docs', 'audits'),
  thresholds: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 90,
    pwa: 90,
  },
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function logHeader(msg) {
  console.log('\n' + '═'.repeat(50));
  log(msg, colors.bright + colors.cyan);
  console.log('═'.repeat(50));
}

function logScore(name, score, threshold) {
  const passed = score >= threshold;
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(`${icon} ${name}: ${score}/100 (threshold: ${threshold})`, color);
  return passed;
}

// Check if Lighthouse is installed
function checkLighthouse() {
  try {
    execSync('npx lighthouse --version', { stdio: 'pipe' });
    return true;
  } catch {
    log('Lighthouse not found. Installing...', colors.yellow);
    try {
      execSync('npm install -g lighthouse', { stdio: 'inherit' });
      return true;
    } catch (e) {
      log('Failed to install Lighthouse. Please install manually:', colors.red);
      log('  npm install -g lighthouse', colors.yellow);
      return false;
    }
  }
}

// Check if dev server is running
async function checkServer(url) {
  try {
    const response = await fetch(url);
    return response.ok || response.status === 401; // 401 is OK (protected routes)
  } catch {
    return false;
  }
}

// Run Lighthouse audit
function runLighthouse(url, device, outputPath) {
  const args = [
    url,
    '--output=json,html',
    `--output-path=${outputPath}`,
    '--chrome-flags="--headless --no-sandbox"',
    device === 'mobile' 
      ? '--preset=perf --form-factor=mobile --screenEmulation.mobile=true'
      : '--preset=desktop --form-factor=desktop --screenEmulation.mobile=false',
    '--only-categories=performance,accessibility,best-practices,seo,pwa',
  ];

  log(`Running ${device} audit...`, colors.blue);
  
  try {
    execSync(`npx lighthouse ${args.join(' ')}`, {
      stdio: 'pipe',
      timeout: 120000, // 2 minute timeout
    });
    return true;
  } catch (error) {
    log(`Audit failed: ${error.message}`, colors.red);
    return false;
  }
}

// Parse Lighthouse JSON results
function parseResults(jsonPath) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return {
      performance: Math.round(data.categories.performance?.score * 100) || 0,
      accessibility: Math.round(data.categories.accessibility?.score * 100) || 0,
      bestPractices: Math.round(data.categories['best-practices']?.score * 100) || 0,
      seo: Math.round(data.categories.seo?.score * 100) || 0,
      pwa: Math.round(data.categories.pwa?.score * 100) || 0,
      metrics: {
        fcp: data.audits['first-contentful-paint']?.numericValue,
        lcp: data.audits['largest-contentful-paint']?.numericValue,
        tti: data.audits['interactive']?.numericValue,
        cls: data.audits['cumulative-layout-shift']?.numericValue,
        tbt: data.audits['total-blocking-time']?.numericValue,
      },
      pwaChecks: {
        installable: data.audits['installable-manifest']?.score === 1,
        serviceWorker: data.audits['service-worker']?.score === 1,
        httpsRedirect: data.audits['redirects-http']?.score === 1,
        viewport: data.audits['viewport']?.score === 1,
        appleIcon: data.audits['apple-touch-icon']?.score === 1,
        maskableIcon: data.audits['maskable-icon']?.score === 1,
      },
    };
  } catch (error) {
    log(`Failed to parse results: ${error.message}`, colors.red);
    return null;
  }
}

// Generate markdown report
function generateReport(mobileResults, desktopResults) {
  const now = new Date().toISOString().split('T')[0];
  
  let report = `# Fernhill Lighthouse Audit Report

**Date:** ${now}  
**URL:** ${CONFIG.url}  
**Version:** ${require('../package.json').version}

---

## 📊 Summary

### Mobile Scores
| Category | Score | Threshold | Status |
|----------|-------|-----------|--------|
| Performance | ${mobileResults.performance} | ${CONFIG.thresholds.performance} | ${mobileResults.performance >= CONFIG.thresholds.performance ? '✅' : '❌'} |
| Accessibility | ${mobileResults.accessibility} | ${CONFIG.thresholds.accessibility} | ${mobileResults.accessibility >= CONFIG.thresholds.accessibility ? '✅' : '❌'} |
| Best Practices | ${mobileResults.bestPractices} | ${CONFIG.thresholds.bestPractices} | ${mobileResults.bestPractices >= CONFIG.thresholds.bestPractices ? '✅' : '❌'} |
| SEO | ${mobileResults.seo} | ${CONFIG.thresholds.seo} | ${mobileResults.seo >= CONFIG.thresholds.seo ? '✅' : '❌'} |
| PWA | ${mobileResults.pwa} | ${CONFIG.thresholds.pwa} | ${mobileResults.pwa >= CONFIG.thresholds.pwa ? '✅' : '❌'} |

### Desktop Scores
| Category | Score | Threshold | Status |
|----------|-------|-----------|--------|
| Performance | ${desktopResults.performance} | ${CONFIG.thresholds.performance} | ${desktopResults.performance >= CONFIG.thresholds.performance ? '✅' : '❌'} |
| Accessibility | ${desktopResults.accessibility} | ${CONFIG.thresholds.accessibility} | ${desktopResults.accessibility >= CONFIG.thresholds.accessibility ? '✅' : '❌'} |
| Best Practices | ${desktopResults.bestPractices} | ${CONFIG.thresholds.bestPractices} | ${desktopResults.bestPractices >= CONFIG.thresholds.bestPractices ? '✅' : '❌'} |
| SEO | ${desktopResults.seo} | ${CONFIG.thresholds.seo} | ${desktopResults.seo >= CONFIG.thresholds.seo ? '✅' : '❌'} |
| PWA | ${desktopResults.pwa} | ${CONFIG.thresholds.pwa} | ${desktopResults.pwa >= CONFIG.thresholds.pwa ? '✅' : '❌'} |

---

## ⚡ Core Web Vitals (Mobile)

| Metric | Value | Good | Needs Work | Poor |
|--------|-------|------|------------|------|
| First Contentful Paint | ${(mobileResults.metrics.fcp / 1000).toFixed(2)}s | <1.8s | 1.8-3s | >3s |
| Largest Contentful Paint | ${(mobileResults.metrics.lcp / 1000).toFixed(2)}s | <2.5s | 2.5-4s | >4s |
| Time to Interactive | ${(mobileResults.metrics.tti / 1000).toFixed(2)}s | <3.8s | 3.8-7.3s | >7.3s |
| Total Blocking Time | ${mobileResults.metrics.tbt.toFixed(0)}ms | <200ms | 200-600ms | >600ms |
| Cumulative Layout Shift | ${mobileResults.metrics.cls.toFixed(3)} | <0.1 | 0.1-0.25 | >0.25 |

---

## 📱 PWA Checklist

| Check | Mobile | Desktop |
|-------|--------|---------|
| Installable | ${mobileResults.pwaChecks.installable ? '✅' : '❌'} | ${desktopResults.pwaChecks.installable ? '✅' : '❌'} |
| Service Worker | ${mobileResults.pwaChecks.serviceWorker ? '✅' : '❌'} | ${desktopResults.pwaChecks.serviceWorker ? '✅' : '❌'} |
| HTTPS Redirect | ${mobileResults.pwaChecks.httpsRedirect ? '✅' : '❌'} | ${desktopResults.pwaChecks.httpsRedirect ? '✅' : '❌'} |
| Viewport Meta | ${mobileResults.pwaChecks.viewport ? '✅' : '❌'} | ${desktopResults.pwaChecks.viewport ? '✅' : '❌'} |
| Apple Touch Icon | ${mobileResults.pwaChecks.appleIcon ? '✅' : '❌'} | ${desktopResults.pwaChecks.appleIcon ? '✅' : '❌'} |
| Maskable Icon | ${mobileResults.pwaChecks.maskableIcon ? '✅' : '❌'} | ${desktopResults.pwaChecks.maskableIcon ? '✅' : '❌'} |

---

## 📁 Full Reports

- [Mobile HTML Report](./mobile-report.html)
- [Desktop HTML Report](./desktop-report.html)

---

*Generated by Fernhill Audit Script*
`;

  return report;
}

// Main audit function
async function runAudit() {
  logHeader('🔍 FERNHILL COMMUNITY AUDIT');
  log(`URL: ${CONFIG.url}`);
  log(`Date: ${new Date().toISOString()}`);

  // Pre-checks
  log('\n📋 Pre-flight checks...');
  
  if (!checkLighthouse()) {
    process.exit(1);
  }
  log('✓ Lighthouse available', colors.green);

  const serverRunning = await checkServer(CONFIG.url);
  if (!serverRunning) {
    log(`✗ Server not running at ${CONFIG.url}`, colors.red);
    log('  Start the dev server: npm run dev', colors.yellow);
    process.exit(1);
  }
  log('✓ Server is running', colors.green);

  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Run audits
  const mobileOutput = path.join(CONFIG.outputDir, 'mobile-report');
  const desktopOutput = path.join(CONFIG.outputDir, 'desktop-report');

  logHeader('📱 MOBILE AUDIT');
  const mobileSuccess = runLighthouse(CONFIG.url, 'mobile', mobileOutput);

  logHeader('🖥️ DESKTOP AUDIT');
  const desktopSuccess = runLighthouse(CONFIG.url, 'desktop', desktopOutput);

  if (!mobileSuccess || !desktopSuccess) {
    log('\n❌ Audit failed. Check the errors above.', colors.red);
    process.exit(1);
  }

  // Parse results
  const mobileResults = parseResults(`${mobileOutput}.json`);
  const desktopResults = parseResults(`${desktopOutput}.json`);

  if (!mobileResults || !desktopResults) {
    log('\n❌ Failed to parse audit results.', colors.red);
    process.exit(1);
  }

  // Display results
  logHeader('📊 RESULTS');

  log('\n📱 Mobile:', colors.bright);
  let allPassed = true;
  allPassed &= logScore('Performance', mobileResults.performance, CONFIG.thresholds.performance);
  allPassed &= logScore('Accessibility', mobileResults.accessibility, CONFIG.thresholds.accessibility);
  allPassed &= logScore('Best Practices', mobileResults.bestPractices, CONFIG.thresholds.bestPractices);
  allPassed &= logScore('SEO', mobileResults.seo, CONFIG.thresholds.seo);
  allPassed &= logScore('PWA', mobileResults.pwa, CONFIG.thresholds.pwa);

  log('\n🖥️ Desktop:', colors.bright);
  allPassed &= logScore('Performance', desktopResults.performance, CONFIG.thresholds.performance);
  allPassed &= logScore('Accessibility', desktopResults.accessibility, CONFIG.thresholds.accessibility);
  allPassed &= logScore('Best Practices', desktopResults.bestPractices, CONFIG.thresholds.bestPractices);
  allPassed &= logScore('SEO', desktopResults.seo, CONFIG.thresholds.seo);
  allPassed &= logScore('PWA', desktopResults.pwa, CONFIG.thresholds.pwa);

  // Generate markdown report
  const reportMd = generateReport(mobileResults, desktopResults);
  const reportPath = path.join(CONFIG.outputDir, 'AUDIT_REPORT.md');
  fs.writeFileSync(reportPath, reportMd);
  log(`\n📄 Report saved to: ${reportPath}`, colors.cyan);

  // Final status
  logHeader(allPassed ? '✅ ALL CHECKS PASSED!' : '⚠️ SOME CHECKS FAILED');
  
  if (!allPassed) {
    log('\nReview the HTML reports for detailed recommendations.', colors.yellow);
    process.exit(1);
  }
}

// Run if executed directly
runAudit().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});

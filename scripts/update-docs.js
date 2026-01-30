#!/usr/bin/env node
/**
 * Pre-push Documentation Generator
 * 
 * This script automatically updates documentation before pushing to git.
 * It scans the codebase and generates up-to-date statistics and feature lists.
 * 
 * Usage: npm run docs:update
 * Auto-runs: git push (via husky pre-push hook)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Count files by extension
function countFiles(dir, extensions, ignore = ['node_modules', '.next', '.git']) {
  let count = 0;
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!ignore.includes(file)) {
          walk(filePath);
        }
      } else {
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          count++;
        }
      }
    }
  }
  
  walk(dir);
  return count;
}

// Count lines of code
function countLinesOfCode(dir, extensions, ignore = ['node_modules', '.next', '.git']) {
  let lines = 0;
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!ignore.includes(file)) {
          walk(filePath);
        }
      } else {
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          const content = fs.readFileSync(filePath, 'utf8');
          lines += content.split('\n').length;
        }
      }
    }
  }
  
  walk(dir);
  return lines;
}

// Get list of routes/pages
function getRoutes(appDir) {
  const routes = [];
  
  function walk(currentDir, prefix = '') {
    if (!fs.existsSync(currentDir)) return;
    
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Handle route groups (parentheses)
        const routeName = file.startsWith('(') ? '' : `/${file}`;
        walk(filePath, prefix + routeName);
      } else if (file === 'page.tsx' || file === 'page.ts') {
        routes.push(prefix || '/');
      }
    }
  }
  
  walk(appDir);
  return routes;
}

// Get components list
function getComponents(componentsDir) {
  const components = [];
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        components.push(file.replace(/\.(tsx?|jsx?)$/, ''));
      }
    }
  }
  
  walk(componentsDir);
  return components;
}

// Get database tables from schema
function getDatabaseTables(schemaPath) {
  if (!fs.existsSync(schemaPath)) return [];
  
  const content = fs.readFileSync(schemaPath, 'utf8');
  const tableMatches = content.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi) || [];
  return tableMatches.map(m => m.replace(/CREATE TABLE (?:IF NOT EXISTS )?/i, ''));
}

// Get package version
function getPackageVersion() {
  const packagePath = path.join(ROOT_DIR, 'package.json');
  if (!fs.existsSync(packagePath)) return '0.0.0';
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return pkg.version || '0.0.0';
}

// Get git info
function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR }).toString().trim();
    const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR }).toString().trim();
    const commitCount = execSync('git rev-list --count HEAD', { cwd: ROOT_DIR }).toString().trim();
    return { branch, commit, commitCount };
  } catch {
    return { branch: 'unknown', commit: 'unknown', commitCount: '0' };
  }
}

// Main documentation generator
function generateDocs() {
  log('\n📚 Generating Documentation...', 'cyan');
  
  const timestamp = new Date().toISOString();
  const version = getPackageVersion();
  const gitInfo = getGitInfo();
  
  // Collect stats
  const stats = {
    timestamp,
    version,
    git: gitInfo,
    files: {
      typescript: countFiles(ROOT_DIR, ['.ts', '.tsx']),
      javascript: countFiles(ROOT_DIR, ['.js', '.jsx']),
      css: countFiles(ROOT_DIR, ['.css']),
      sql: countFiles(ROOT_DIR, ['.sql']),
      markdown: countFiles(ROOT_DIR, ['.md']),
    },
    linesOfCode: countLinesOfCode(ROOT_DIR, ['.ts', '.tsx', '.js', '.jsx']),
    routes: getRoutes(path.join(ROOT_DIR, 'app')),
    components: getComponents(path.join(ROOT_DIR, 'components')),
    tables: [
      ...getDatabaseTables(path.join(ROOT_DIR, 'supabase', 'schema.sql')),
      ...getDatabaseTables(path.join(ROOT_DIR, 'supabase', 'additional_schema.sql')),
      ...getDatabaseTables(path.join(ROOT_DIR, 'supabase', 'boards_schema.sql')),
    ],
  };
  
  log(`  ✓ Found ${stats.files.typescript} TypeScript files`, 'green');
  log(`  ✓ Found ${stats.routes.length} routes`, 'green');
  log(`  ✓ Found ${stats.components.length} components`, 'green');
  log(`  ✓ Found ${stats.tables.length} database tables`, 'green');
  log(`  ✓ Total ${stats.linesOfCode.toLocaleString()} lines of code`, 'green');
  
  // Update USER_GUIDE.md
  updateUserGuide(stats);
  
  // Update README.md
  updateReadme(stats);
  
  // Generate STATS.json
  generateStatsJson(stats);
  
  log('\n✨ Documentation updated successfully!\n', 'green');
}

function updateUserGuide(stats) {
  const userGuidePath = path.join(DOCS_DIR, 'USER_GUIDE.md');
  if (!fs.existsSync(userGuidePath)) return;
  
  let content = fs.readFileSync(userGuidePath, 'utf8');
  
  const autoGenSection = `<!-- AUTO-GENERATED: DO NOT EDIT BELOW -->
\`\`\`
Generated: ${stats.timestamp}
Version: ${stats.version}
Git: ${stats.git.branch}@${stats.git.commit} (${stats.git.commitCount} commits)
Features: ${stats.routes.length} pages
Components: ${stats.components.length} reusable
Database Tables: ${stats.tables.length}
Lines of Code: ${stats.linesOfCode.toLocaleString()}
\`\`\`
<!-- AUTO-GENERATED: DO NOT EDIT ABOVE -->`;
  
  content = content.replace(
    /<!-- AUTO-GENERATED: DO NOT EDIT BELOW -->[\s\S]*<!-- AUTO-GENERATED: DO NOT EDIT ABOVE -->/,
    autoGenSection
  );
  
  fs.writeFileSync(userGuidePath, content);
  log('  ✓ Updated USER_GUIDE.md', 'green');
}

function updateReadme(stats) {
  const readmePath = path.join(ROOT_DIR, 'README.md');
  if (!fs.existsSync(readmePath)) return;
  
  let content = fs.readFileSync(readmePath, 'utf8');
  
  // Update project status section
  const statusSection = `## 📝 Project Status

### ✅ Completed Features (${stats.routes.length} pages)
${stats.routes.map(r => `- [x] \`${r}\``).join('\n')}

### 📊 Codebase Statistics
- **Version:** ${stats.version}
- **TypeScript Files:** ${stats.files.typescript}
- **Components:** ${stats.components.length}
- **Database Tables:** ${stats.tables.length}
- **Lines of Code:** ${stats.linesOfCode.toLocaleString()}
- **Last Updated:** ${new Date(stats.timestamp).toLocaleDateString()}

---`;

  // Replace existing status section or append
  if (content.includes('## 📝 Project Status')) {
    content = content.replace(
      /## 📝 Project Status[\s\S]*?(?=\n## |$)/,
      statusSection + '\n\n'
    );
  }
  
  fs.writeFileSync(readmePath, content);
  log('  ✓ Updated README.md', 'green');
}

function generateStatsJson(stats) {
  const statsPath = path.join(DOCS_DIR, 'STATS.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  log('  ✓ Generated STATS.json', 'green');
}

// Run the generator
generateDocs();

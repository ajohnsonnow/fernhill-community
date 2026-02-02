#!/usr/bin/env node
/**
 * Fernhill Community - Archive Old/Unused Files Script
 * 
 * Automatically identifies and archives old/deprecated files before deployment.
 * Files are moved to an .archive/ directory (gitignored) with timestamps.
 * 
 * Usage:
 *   npm run archive           # Dry run - show what would be archived
 *   npm run archive -- --run  # Actually archive files
 *   npm run archive -- --restore [timestamp]  # Restore archived files
 * 
 * What gets archived:
 * 1. Duplicate migration files (keeps newest)
 * 2. Old/superseded SQL files
 * 3. Orphaned components (optional, with --include-components)
 * 4. Files matching patterns: *.backup, *.old, *.deprecated
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT_DIR, '.archive');

// Parse command line arguments
const args = process.argv.slice(2);
const FLAGS = {
  dryRun: !args.includes('--run'),
  includeComponents: args.includes('--include-components'),
  restore: args.includes('--restore'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

// Get restore timestamp if provided
const restoreTimestamp = FLAGS.restore 
  ? args[args.indexOf('--restore') + 1] 
  : null;

// Colors for console output
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logSection(title) {
  console.log();
  log(`${'═'.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'═'.repeat(60)}`, 'cyan');
}

// Files to archive (duplicate/superseded migrations)
const ARCHIVE_PATTERNS = {
  // Duplicate SQL migrations - keep the standalone/clean versions
  duplicateMigrations: [
    // ========================================
    // Already-applied migrations (archive these)
    // ========================================
    {
      path: 'supabase/electric_avenue_standalone.sql',
      reason: 'Phase H migration - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/diamond_status_migration.sql',
      reason: 'Phase I migration - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/supernova_migration.sql',
      reason: 'Phase J migration - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/social_features_v2_migration.sql',
      reason: 'Social features v2 - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/phase_a_completion_migration.sql',
      reason: 'Phase A migration - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/phase_b_community_resources.sql',
      reason: 'Phase B migration - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/phase_c_advanced_features.sql',
      reason: 'Phase C migration - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/boards_schema.sql',
      reason: 'Boards schema - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/boundary_reports_migration.sql',
      reason: 'Boundary reports - already applied to Supabase',
      keepInstead: null,
    },
    {
      path: 'supabase/marketplace_expiration_migration.sql',
      reason: 'Marketplace expiration - already applied to Supabase',
      keepInstead: null,
    },
  ],
  
  // File patterns to always archive
  patterns: [
    '**/*.backup',
    '**/*.backup.*',
    '**/*.old',
    '**/*.old.*',
    '**/*.deprecated',
    '**/*.deprecated.*',
    '**/~*',
    '**/#*#',
  ],
  
  // Orphaned components (only with --include-components flag)
  orphanedComponents: [
    // These are built for future features - only archive if explicitly requested
    // 'components/verification/FaceCapture.tsx',
  ],
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function findFilesMatchingPattern(pattern) {
  // Simple glob-like matching for our use case
  const files = [];
  
  function walkDir(dir, relativePath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip certain directories
          if (['node_modules', '.git', '.next', '.archive', 'dist'].includes(entry.name)) {
            continue;
          }
          walkDir(fullPath, relPath);
        } else if (entry.isFile()) {
          // Check against pattern
          if (matchesPattern(relPath, pattern)) {
            files.push(relPath);
          }
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }
  
  walkDir(ROOT_DIR);
  return files;
}

function matchesPattern(filePath, pattern) {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*\*/g, '@@GLOBSTAR@@')
    .replace(/\*/g, '[^/]*')
    .replace(/@@GLOBSTAR@@/g, '.*')
    .replace(/\./g, '\\.');
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(filePath.replace(/\\/g, '/'));
}

// ============================================================
// ARCHIVE FUNCTIONS
// ============================================================

function archiveFile(relativePath, reason, timestamp) {
  const sourcePath = path.join(ROOT_DIR, relativePath);
  
  if (!fs.existsSync(sourcePath)) {
    if (FLAGS.verbose) {
      log(`  ⚠️  File not found: ${relativePath}`, 'yellow');
    }
    return { archived: false, reason: 'File not found' };
  }
  
  const fileSize = getFileSize(sourcePath);
  const archivePath = path.join(ARCHIVE_DIR, timestamp, relativePath);
  
  if (FLAGS.dryRun) {
    log(`  📦 Would archive: ${relativePath}`, 'blue');
    log(`     Reason: ${reason}`, 'dim');
    log(`     Size: ${formatBytes(fileSize)}`, 'dim');
    return { archived: false, dryRun: true, size: fileSize };
  }
  
  // Create archive directory structure
  ensureDir(path.dirname(archivePath));
  
  // Move file to archive
  fs.renameSync(sourcePath, archivePath);
  
  log(`  ✅ Archived: ${relativePath}`, 'green');
  log(`     → ${path.relative(ROOT_DIR, archivePath)}`, 'dim');
  
  return { archived: true, archivePath, size: fileSize };
}

function createManifest(archivedFiles, timestamp) {
  const manifestPath = path.join(ARCHIVE_DIR, timestamp, 'MANIFEST.json');
  const manifest = {
    timestamp,
    date: new Date().toISOString(),
    totalFiles: archivedFiles.length,
    totalSize: archivedFiles.reduce((sum, f) => sum + (f.size || 0), 0),
    files: archivedFiles.map(f => ({
      path: f.path,
      reason: f.reason,
      size: f.size,
    })),
  };
  
  if (!FLAGS.dryRun) {
    ensureDir(path.dirname(manifestPath));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    log(`\n📋 Manifest saved: ${path.relative(ROOT_DIR, manifestPath)}`, 'cyan');
  }
  
  return manifest;
}

// ============================================================
// RESTORE FUNCTIONS  
// ============================================================

function restoreArchive(timestamp) {
  const archiveDir = path.join(ARCHIVE_DIR, timestamp);
  
  if (!fs.existsSync(archiveDir)) {
    log(`❌ Archive not found: ${timestamp}`, 'red');
    
    // List available archives
    if (fs.existsSync(ARCHIVE_DIR)) {
      const archives = fs.readdirSync(ARCHIVE_DIR)
        .filter(f => fs.statSync(path.join(ARCHIVE_DIR, f)).isDirectory())
        .sort()
        .reverse();
      
      if (archives.length > 0) {
        log('\nAvailable archives:', 'yellow');
        archives.forEach(a => log(`  • ${a}`, 'dim'));
      }
    }
    return;
  }
  
  const manifestPath = path.join(archiveDir, 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) {
    log(`❌ Manifest not found in archive`, 'red');
    return;
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  logSection(`🔄 Restoring Archive: ${timestamp}`);
  log(`   Date: ${manifest.date}`, 'dim');
  log(`   Files: ${manifest.totalFiles}`, 'dim');
  
  let restored = 0;
  let skipped = 0;
  
  for (const file of manifest.files) {
    const archivePath = path.join(archiveDir, file.path);
    const targetPath = path.join(ROOT_DIR, file.path);
    
    if (!fs.existsSync(archivePath)) {
      log(`  ⚠️  Missing: ${file.path}`, 'yellow');
      skipped++;
      continue;
    }
    
    if (fs.existsSync(targetPath)) {
      log(`  ⚠️  Already exists: ${file.path}`, 'yellow');
      skipped++;
      continue;
    }
    
    ensureDir(path.dirname(targetPath));
    fs.renameSync(archivePath, targetPath);
    log(`  ✅ Restored: ${file.path}`, 'green');
    restored++;
  }
  
  log(`\n📊 Restore Summary:`, 'cyan');
  log(`   Restored: ${restored}`, 'green');
  log(`   Skipped: ${skipped}`, 'yellow');
  
  // Clean up empty archive directory
  if (restored === manifest.files.length) {
    fs.rmSync(archiveDir, { recursive: true });
    log(`   Archive directory removed`, 'dim');
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log();
  log('🗄️  Fernhill Community - Archive Script', 'bright');
  log(`   Version: ${require('../package.json').version}`, 'dim');
  
  if (FLAGS.restore) {
    if (!restoreTimestamp) {
      log('\n❌ Please specify a timestamp to restore:', 'red');
      log('   npm run archive -- --restore 2026-02-01T12-00-00', 'dim');
      
      // List available archives
      if (fs.existsSync(ARCHIVE_DIR)) {
        const archives = fs.readdirSync(ARCHIVE_DIR)
          .filter(f => fs.statSync(path.join(ARCHIVE_DIR, f)).isDirectory())
          .sort()
          .reverse();
        
        if (archives.length > 0) {
          log('\nAvailable archives:', 'yellow');
          archives.forEach(a => log(`  • ${a}`, 'dim'));
        }
      }
      return;
    }
    
    restoreArchive(restoreTimestamp);
    return;
  }
  
  if (FLAGS.dryRun) {
    log('\n⚠️  DRY RUN MODE - No files will be moved', 'yellow');
    log('   Use --run flag to actually archive files\n', 'dim');
  }
  
  const timestamp = getTimestamp();
  const toArchive = [];
  
  // ============================================================
  // 1. Check duplicate migrations
  // ============================================================
  logSection('📂 Checking Duplicate Migrations');
  
  for (const dup of ARCHIVE_PATTERNS.duplicateMigrations) {
    const dupPath = path.join(ROOT_DIR, dup.path);
    
    // Check if the duplicate file exists
    if (!fs.existsSync(dupPath)) {
      if (FLAGS.verbose) {
        log(`  ℹ️  Already archived: ${dup.path}`, 'dim');
      }
      continue;
    }
    
    // If there's a replacement file, verify it exists
    if (dup.keepInstead) {
      const keepPath = path.join(ROOT_DIR, dup.keepInstead);
      if (!fs.existsSync(keepPath)) {
        if (FLAGS.verbose) {
          log(`  ℹ️  Replacement not found: ${dup.keepInstead}`, 'dim');
        }
        continue;
      }
    }
    
    // Archive this file
    toArchive.push({
      path: dup.path,
      reason: dup.reason,
      size: getFileSize(dupPath),
    });
  }
  
  if (toArchive.length === 0) {
    log('  ✅ No duplicate migrations found', 'green');
  }
  
  // ============================================================
  // 2. Check pattern-matched files
  // ============================================================
  logSection('🔍 Checking File Patterns');
  
  for (const pattern of ARCHIVE_PATTERNS.patterns) {
    const matches = findFilesMatchingPattern(pattern);
    for (const match of matches) {
      const fullPath = path.join(ROOT_DIR, match);
      toArchive.push({
        path: match,
        reason: `Matches pattern: ${pattern}`,
        size: getFileSize(fullPath),
      });
    }
  }
  
  const patternMatches = toArchive.filter(f => f.reason.includes('Matches pattern'));
  if (patternMatches.length === 0) {
    log('  ✅ No files matching archive patterns', 'green');
  } else {
    log(`  Found ${patternMatches.length} files matching patterns`, 'blue');
  }
  
  // ============================================================
  // 3. Check orphaned components (optional)
  // ============================================================
  if (FLAGS.includeComponents && ARCHIVE_PATTERNS.orphanedComponents.length > 0) {
    logSection('🧩 Checking Orphaned Components');
    
    for (const comp of ARCHIVE_PATTERNS.orphanedComponents) {
      const compPath = path.join(ROOT_DIR, comp);
      if (fs.existsSync(compPath)) {
        toArchive.push({
          path: comp,
          reason: 'Orphaned component (not imported anywhere)',
          size: getFileSize(compPath),
        });
      }
    }
  }
  
  // ============================================================
  // Summary and archive
  // ============================================================
  logSection('📊 Archive Summary');
  
  if (toArchive.length === 0) {
    log('  ✨ No files to archive - codebase is clean!', 'green');
    return;
  }
  
  const totalSize = toArchive.reduce((sum, f) => sum + (f.size || 0), 0);
  log(`  Files to archive: ${toArchive.length}`, 'blue');
  log(`  Total size: ${formatBytes(totalSize)}`, 'blue');
  
  logSection('📦 Archiving Files');
  
  const results = [];
  for (const file of toArchive) {
    const result = archiveFile(file.path, file.reason, timestamp);
    results.push({ ...file, ...result });
  }
  
  // Create manifest
  if (!FLAGS.dryRun && results.some(r => r.archived)) {
    createManifest(results.filter(r => r.archived), timestamp);
  }
  
  // Final summary
  console.log();
  log('═'.repeat(60), 'cyan');
  
  if (FLAGS.dryRun) {
    log('  📋 DRY RUN COMPLETE', 'yellow');
    log(`     Would archive ${toArchive.length} files (${formatBytes(totalSize)})`, 'dim');
    log('     Run with --run flag to actually archive', 'dim');
  } else {
    const archived = results.filter(r => r.archived).length;
    log('  ✅ ARCHIVE COMPLETE', 'green');
    log(`     Archived ${archived} files (${formatBytes(totalSize)})`, 'dim');
    log(`     Archive location: .archive/${timestamp}/`, 'dim');
  }
  
  log('═'.repeat(60), 'cyan');
  console.log();
}

main().catch(err => {
  console.error('Archive script failed:', err);
  process.exit(1);
});

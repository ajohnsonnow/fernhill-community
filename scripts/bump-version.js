#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Read lib/version.ts
const versionPath = path.join(__dirname, '..', 'lib', 'version.ts');
const versionContent = fs.readFileSync(versionPath, 'utf8');

// Parse current version
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Determine bump type from git commit message
const commitMsg = process.env.HUSKY_GIT_PARAMS || '';
let newVersion;

if (commitMsg.includes('BREAKING CHANGE') || commitMsg.startsWith('feat!:') || commitMsg.startsWith('fix!:')) {
  // Major version bump
  newVersion = `${major + 1}.0.0`;
} else if (commitMsg.startsWith('feat:') || commitMsg.startsWith('feat(')) {
  // Minor version bump
  newVersion = `${major}.${minor + 1}.0`;
} else {
  // Patch version bump
  newVersion = `${major}.${minor}.${patch + 1}`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Update lib/version.ts
const newVersionContent = versionContent.replace(
  /version: ['"][\d.]+['"]/,
  `version: '${newVersion}'`
);
fs.writeFileSync(versionPath, newVersionContent);

console.log(`✅ Version bumped to ${newVersion}`);
console.log(`📝 Updated: package.json, lib/version.ts`);

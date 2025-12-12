#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the repo root (where this script is located)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const distPath = join(repoRoot, 'public');

// Change to repo root to ensure we're in the right context
process.chdir(repoRoot);

console.log('Repo root:', repoRoot);
console.log('Current working directory:', process.cwd());
console.log('Checking public directory at:', distPath);
console.log('public exists:', existsSync(distPath));

if (existsSync(distPath)) {
  const stats = statSync(distPath);
  console.log('public is directory:', stats.isDirectory());
}

if (existsSync(distPath)) {
  const files = readdirSync(distPath);
  console.log('Files in public:', files);
  const hasIndex = existsSync(join(distPath, 'index.html'));
  console.log('index.html exists:', hasIndex);
  
  if (!hasIndex) {
    console.error('ERROR: dist/index.html not found!');
    process.exit(1);
  }
  
  console.log('✓ Build output verified successfully');
} else {
  console.error('ERROR: public directory not found!');
  process.exit(1);
}


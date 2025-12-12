#!/usr/bin/env node
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const distPath = join(process.cwd(), 'public');

console.log('Current working directory:', process.cwd());
console.log('Checking public directory at:', distPath);
console.log('public exists:', existsSync(distPath));

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


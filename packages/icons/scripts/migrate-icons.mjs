#!/usr/bin/env node
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

const DEFAULT_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
  ".mdx"
]);

const DEFAULT_IGNORE_DIRS = new Set([
  ".cache",
  ".git",
  ".next",
  ".nuxt",
  ".output",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out"
]);

function printHelp() {
  console.log(`marshmallow-icons migrate

Usage:
  npx marshmallow-icons migrate [paths...] [options]
  npx marshmallow-icons-migrate [paths...] [options]

Options:
  --dry-run      Show files that would change without writing them.
  --check        Exit 1 when migrations are needed, without writing files.
  --no-tabler    Do not rewrite supported @tabler/icons-react imports.
  --extensions   Comma-separated extension list. Default: js,jsx,ts,tsx,mjs,cjs,mts,cts,mdx.
  --help         Show this help.

What it updates:
  - Old marshmallow-icons export names from 0.3.0 to canonical Icon{Name} names.
  - Renamed icon catalog IDs such as assets/svg/vuesax/outline/google-paly.
  - Supported named imports from @tabler/icons-react to marshmallow-icons.
`);
}

function parseArgs(argv) {
  const args = argv.slice();
  if (args[0] === "migrate") args.shift();

  const paths = [];
  let dryRun = false;
  let check = false;
  let tabler = true;
  let extensions = new Set(DEFAULT_EXTENSIONS);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--check") {
      check = true;
      dryRun = true;
      continue;
    }
    if (arg === "--no-tabler") {
      tabler = false;
      continue;
    }
    if (arg === "--extensions") {
      const value = args[i + 1];
      if (!value) throw new Error("--extensions requires a comma-separated value.");
      extensions = parseExtensions(value);
      i += 1;
      continue;
    }
    if (arg.startsWith("--extensions=")) {
      extensions = parseExtensions(arg.slice("--extensions=".length));
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    paths.push(arg);
  }

  return {
    check,
    dryRun,
    extensions,
    help: false,
    paths: paths.length > 0 ? paths : ["."],
    tabler
  };
}

function parseExtensions(value) {
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.startsWith(".") ? item : `.${item}`))
  );
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function loadMigrationMap() {
  const mapPath = path.join(packageRoot, "dist", "migration-map.json");
  if (!fsSync.existsSync(mapPath)) {
    throw new Error(`Missing migration map at ${mapPath}. Reinstall marshmallow-icons or run npm run build in the package.`);
  }
  return readJson(mapPath);
}

async function collectFiles(entries, extensions) {
  const files = [];

  async function visit(target) {
    const fullPath = path.resolve(target);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat) return;

    if (stat.isDirectory()) {
      const base = path.basename(fullPath);
      if (DEFAULT_IGNORE_DIRS.has(base)) return;
      const dirents = await fs.readdir(fullPath, { withFileTypes: true });
      for (const dirent of dirents) {
        await visit(path.join(fullPath, dirent.name));
      }
      return;
    }

    if (stat.isFile() && extensions.has(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }

  for (const entry of entries) {
    await visit(entry);
  }

  return files.sort();
}

function splitNamedSpecifiers(input) {
  const parts = [];
  let start = 0;
  let depth = 0;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "{" || char === "(" || char === "[") depth += 1;
    if (char === "}" || char === ")" || char === "]") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(input.slice(start));
  return parts;
}

function parseSpecifier(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const typePrefix = /^type\s+/.test(trimmed);
  const body = typePrefix ? trimmed.replace(/^type\s+/, "") : trimmed;
  const match = body.match(/^([A-Za-z_$][A-Za-z0-9_$]*)(?:\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*))?$/);
  if (!match) {
    return { raw: trimmed, parsed: false };
  }

  return {
    imported: match[1],
    local: match[2] || match[1],
    parsed: true,
    typePrefix
  };
}

function formatSpecifier(specifier) {
  if (!specifier.parsed) return specifier.raw;
  const prefix = specifier.typePrefix ? "type " : "";
  if (specifier.local && specifier.local !== specifier.imported) {
    return `${prefix}${specifier.imported} as ${specifier.local}`;
  }
  return `${prefix}${specifier.imported}`;
}

function formatNamedBlock(specifiers, originalBlock) {
  const formatted = specifiers.map(formatSpecifier);
  if (!originalBlock.includes("\n")) {
    return `{ ${formatted.join(", ")} }`;
  }

  const indentMatch = originalBlock.match(/\n([ \t]*)\S/);
  const indent = indentMatch?.[1] || "  ";
  return `{\n${formatted.map((item) => `${indent}${item}`).join(",\n")}\n}`;
}

function parseImportClause(clause) {
  const open = clause.indexOf("{");
  const close = clause.lastIndexOf("}");
  if (open === -1 || close === -1 || close < open) return null;

  return {
    beforeNamed: clause.slice(0, open),
    namedBlock: clause.slice(open, close + 1),
    namedContent: clause.slice(open + 1, close),
    afterNamed: clause.slice(close + 1)
  };
}

function rebuildImport(prefix, clause, quoteStart, source, quoteEnd, suffix) {
  return `${prefix}${clause}${quoteStart}${source}${quoteEnd}${suffix}`;
}

function transformImports(source, migrationMap, options) {
  const importRenames = migrationMap.importRenames || {};
  const tablerNames = new Set(migrationMap.tablerCompatibleImports || []);
  const localRenames = new Map();
  const importPattern = /(^|[\n\r])([ \t]*import\s+(?:type\s+)?)([\s\S]*?)(\s+from\s+)(["'])(marshmallow-icons|@tabler\/icons-react)(["'])(\s*;?)/g;

  let changed = false;
  const output = source.replace(importPattern, (match, lineStart, prefix, clause, fromKeyword, quoteStart, moduleName, quoteEnd, suffix) => {
    const parsedClause = parseImportClause(clause);
    if (!parsedClause) return match;

    const specifiers = splitNamedSpecifiers(parsedClause.namedContent)
      .map(parseSpecifier)
      .filter(Boolean);

    if (specifiers.some((specifier) => !specifier.parsed)) {
      return match;
    }

    if (moduleName === "marshmallow-icons") {
      let importChanged = false;
      const nextSpecifiers = specifiers.map((specifier) => {
        const nextName = importRenames[specifier.imported];
        if (!nextName) return specifier;

        importChanged = true;
        const nextSpecifier = { ...specifier, imported: nextName };
        if (specifier.local === specifier.imported) {
          nextSpecifier.local = nextName;
          localRenames.set(specifier.local, nextName);
        }
        return nextSpecifier;
      });

      if (!importChanged) return match;

      changed = true;
      const nextNamed = formatNamedBlock(nextSpecifiers, parsedClause.namedBlock);
      const nextClause = `${parsedClause.beforeNamed}${nextNamed}${parsedClause.afterNamed}`;
      return `${lineStart}${rebuildImport(prefix, nextClause, `${fromKeyword}${quoteStart}`, moduleName, quoteEnd, suffix)}`;
    }

    if (!options.tabler) return match;

    const hasNamespaceImport = /\*\s+as\s+/.test(parsedClause.beforeNamed);
    if (hasNamespaceImport) return match;

    const supported = [];
    const remaining = [];

    for (const specifier of specifiers) {
      if (tablerNames.has(specifier.imported)) {
        supported.push(specifier);
      } else {
        remaining.push(specifier);
      }
    }

    if (supported.length === 0) return match;

    changed = true;

    const marshmallowImport = rebuildImport(
      prefix,
      formatNamedBlock(supported, parsedClause.namedBlock),
      `${fromKeyword}${quoteStart}`,
      "marshmallow-icons",
      quoteEnd,
      suffix
    );

    const defaultClause = parsedClause.beforeNamed.replace(/,\s*$/, "").trim();
    if (remaining.length === 0 && !defaultClause && !parsedClause.afterNamed.trim()) {
      return `${lineStart}${marshmallowImport}`;
    }

    const rebuilt = [];
    rebuilt.push(marshmallowImport);

    if (remaining.length > 0 || defaultClause) {
      const remainingNamed = remaining.length > 0 ? formatNamedBlock(remaining, parsedClause.namedBlock) : "";
      const separator = defaultClause && remainingNamed ? ", " : "";
      const tablerClause = `${defaultClause}${separator}${remainingNamed}${parsedClause.afterNamed}`;
      rebuilt.push(rebuildImport(prefix, tablerClause, `${fromKeyword}${quoteStart}`, moduleName, quoteEnd, suffix));
    }

    return `${lineStart}${rebuilt.join("\n")}`;
  });

  return {
    changed,
    code: replaceIdentifiersOutsideSyntax(output, localRenames)
  };
}

function replaceIconIds(source, idRenames) {
  let next = source;
  let changed = false;
  const entries = Object.entries(idRenames || {}).sort((a, b) => b[0].length - a[0].length);

  for (const [from, to] of entries) {
    for (const [fromValue, toValue] of [
      [from, to],
      [`${from}.svg`, `${to}.svg`]
    ]) {
      if (next.includes(fromValue)) {
        next = next.split(fromValue).join(toValue);
        changed = true;
      }
    }
  }

  return { changed, code: next };
}

function isIdentifierStart(char) {
  return /[A-Za-z_$]/.test(char);
}

function isIdentifierPart(char) {
  return /[A-Za-z0-9_$]/.test(char);
}

function replaceIdentifiersOutsideSyntax(source, renames) {
  if (!renames || renames.size === 0) return source;

  let output = "";
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];

    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", i + 2);
      const sliceEnd = end === -1 ? source.length : end;
      output += source.slice(i, sliceEnd);
      i = sliceEnd;
      continue;
    }

    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const sliceEnd = end === -1 ? source.length : end + 2;
      output += source.slice(i, sliceEnd);
      i = sliceEnd;
      continue;
    }

    if (char === "'" || char === "\"") {
      const quote = char;
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      output += source.slice(i, j);
      i = j;
      continue;
    }

    if (char === "`") {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === "`") {
          j += 1;
          break;
        }
        j += 1;
      }
      output += source.slice(i, j);
      i = j;
      continue;
    }

    if (isIdentifierStart(char)) {
      let j = i + 1;
      while (j < source.length && isIdentifierPart(source[j])) {
        j += 1;
      }
      const name = source.slice(i, j);
      output += renames.get(name) || name;
      i = j;
      continue;
    }

    output += char;
    i += 1;
  }

  return output;
}

async function migrateFile(filePath, migrationMap, options) {
  const original = await fs.readFile(filePath, "utf8");
  const withIds = replaceIconIds(original, migrationMap.idRenames);
  const withImports = transformImports(withIds.code, migrationMap, options);
  const next = withImports.code;

  if (next === original) {
    return { changed: false, filePath };
  }

  if (!options.dryRun) {
    await fs.writeFile(filePath, next);
  }

  return { changed: true, filePath };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const migrationMap = await loadMigrationMap();
  const files = await collectFiles(options.paths, options.extensions);
  const changedFiles = [];

  for (const filePath of files) {
    const result = await migrateFile(filePath, migrationMap, options);
    if (result.changed) changedFiles.push(result.filePath);
  }

  const relativeFiles = changedFiles.map((filePath) => path.relative(process.cwd(), filePath));
  for (const filePath of relativeFiles) {
    console.log(`${options.dryRun ? "would update" : "updated"} ${filePath}`);
  }

  console.log(`${options.dryRun ? "Checked" : "Migrated"} ${files.length} files; ${changedFiles.length} ${changedFiles.length === 1 ? "file" : "files"} ${options.dryRun ? "need updates" : "updated"}.`);

  if (options.check && changedFiles.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

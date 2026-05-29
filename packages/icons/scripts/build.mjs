import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function tryRun(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false
  });

  if (result.error?.code === "ENOENT") {
    return false;
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status === 127) {
    return false;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return true;
}

const tsupArgs = [
  "src/index.ts",
  "--format",
  "esm,cjs",
  "--dts",
  "--sourcemap",
  "--clean",
  "--external",
  "react",
  "--out-dir",
  "dist",
  "--treeshake",
  "--config",
  "false"
];

run(process.execPath, ["./scripts/generate-icons.mjs"]);

if (!tryRun("tsup", tsupArgs)) {
  run("npm", [
    "exec",
    "--yes",
    "--package",
    "tsup@8.3.5",
    "--package",
    "typescript@5.7.2",
    "--",
    "tsup",
    ...tsupArgs
  ]);
}

let tscPath = null;
try {
  tscPath = require.resolve("typescript/bin/tsc");
} catch {
  tscPath = null;
}

if (tscPath) {
  run(process.execPath, [tscPath, "-p", "tsconfig.json", "--emitDeclarationOnly", "--declaration", "--outDir", "dist"]);
} else {
  run("npm", [
    "exec",
    "--yes",
    "--package",
    "typescript@5.7.2",
    "--",
    "tsc",
    "-p",
    "tsconfig.json",
    "--emitDeclarationOnly",
    "--declaration",
    "--outDir",
    "dist"
  ]);
}

fs.writeFileSync("dist/index.d.ts", 'export * from "./generated/index.js";\n');
fs.writeFileSync("dist/index.d.cts", 'export * from "./generated/index.js";\n');

run(process.execPath, ["./scripts/clean-dist.mjs"]);
run(process.execPath, ["./scripts/write-catalogs.mjs"]);

/**
 * Coverage gate: enforces minimum line coverage for source files.
 * Parses lcov.info and fails if any src/*.ts file falls below the threshold.
 */

import { readFileSync, existsSync } from "fs";

const MIN_LINE_COVERAGE = 0.75;
const lcovPath = "coverage/lcov.info";

if (!existsSync(lcovPath)) {
  console.error(`Coverage file not found: ${lcovPath}`);
  console.error("Run: bun test --coverage --coverage-reporter=lcov --coverage-dir=coverage");
  process.exit(1);
}

const lcov = readFileSync(lcovPath, "utf-8");

const files = new Map<string, { total: number; hit: number }>();
let current: { file: string; total: number; hit: number } | null = null;

for (const line of lcov.split("\n")) {
  if (line.startsWith("SF:")) {
    current = { file: line.slice(3), total: 0, hit: 0 };
  } else if (line.startsWith("DA:")) {
    const hits = parseInt(line.slice(3).split(",")[1] ?? "0", 10);
    if (current) {
      current.total++;
      if (hits > 0) current.hit++;
    }
  } else if (line === "end_of_record" && current && current.total > 0) {
    const isSrcTs = /^src\/.*\.ts$/.test(current.file);
    const isDistJs = /^dist\/src\/.*\.js$/.test(current.file);
    if (isSrcTs) {
      files.set(current.file, { total: current.total, hit: current.hit });
    } else if (isDistJs) {
      const tsPath = current.file.replace(/^dist\//, "").replace(/\.js$/, ".ts");
      if (!files.has(tsPath)) {
        files.set(current.file, { total: current.total, hit: current.hit });
      }
    }
    current = null;
  }
}

const failures: string[] = [];

for (const [file, cov] of files) {
  const pct = cov.total > 0 ? cov.hit / cov.total : 1;
  const pctStr = (pct * 100).toFixed(1);
  if (pct < MIN_LINE_COVERAGE) {
    const shortName = file.replace(/.*\//, "");
    failures.push(`  ${shortName}: ${pctStr}% (min ${MIN_LINE_COVERAGE * 100}%)`);
  }
}

if (failures.length > 0) {
  console.error(`\nCoverage gate FAILED — ${failures.length} file(s) below ${MIN_LINE_COVERAGE * 100}%:\n`);
  for (const f of failures) console.error(f);
  console.error(`\nTotal source files checked: ${files.size}`);
  process.exit(1);
}

const avg = files.size > 0
  ? ([...files.values()].reduce((sum, r) => sum + (r.total > 0 ? r.hit / r.total : 1), 0) / files.size * 100).toFixed(1)
  : "100";
console.log(`Coverage gate PASSED — ${files.size} source files, avg ${avg}% line coverage (min ${MIN_LINE_COVERAGE * 100}% per file)`);

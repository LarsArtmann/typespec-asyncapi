#!/usr/bin/env bun
/**
 * Retry-with-logs wrapper around `bun test --coverage`.
 *
 * Guards the transient exit-zero flake: bun occasionally exits 0 without
 * running the suite to completion (missing summary, 0 pass, or a nonzero
 * fail count reported as success). Every attempt captures stdout/stderr
 * under coverage/flake-logs/ so a bad run keeps its evidence. The wrapper
 * exits nonzero when no attempt satisfies the contract:
 *   exit code 0 AND a "N pass" summary line AND 0 fail.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export interface BunSummary {
  pass: number;
  fail: number;
  ranLine: boolean;
}

export function parseSummary(output: string): BunSummary {
  const pass = /\b(?<pass>\d+) pass\b/.exec(output);
  const fail = /\b(?<fail>\d+) fail\b/.exec(output);
  return {
    pass: pass?.groups?.pass ? Number(pass.groups.pass) : -1,
    fail: fail?.groups?.fail ? Number(fail.groups.fail) : -1,
    ranLine: /Ran \d+ tests? across \d+ files?\./.test(output),
  };
}

export function summaryIsHealthy(summary: BunSummary): boolean {
  return summary.pass > 0 && summary.fail === 0 && summary.ranLine;
}

const COVERAGE_FLAGS = [
  "test",
  "--coverage",
  "--coverage-reporter=lcov",
  "--coverage-dir=coverage",
];

const MAX_ATTEMPTS = 3;

function main(): number {
  mkdirSync("coverage/flake-logs", { recursive: true });
  let lastLog = "";
  let lastCode = -1;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const logPath = `coverage/flake-logs/run-${new Date().toISOString().replaceAll(/[:.]/g, "-")}-attempt${attempt}.log`;
    const proc = spawnSync("bun", COVERAGE_FLAGS, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = proc.stdout ?? "";
    const stderr = proc.stderr ?? "";
    const code = proc.status ?? -1;
    writeFileSync(logPath, `exit=${code}\n--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`);
    lastLog = logPath;
    lastCode = code;
    const summary = parseSummary(stdout + stderr);
    if (code === 0 && summaryIsHealthy(summary)) {
      console.log(
        `coverage-run: attempt ${attempt} healthy (${summary.pass} pass, ${summary.fail} fail), log ${logPath}`,
      );
      return 0;
    }
    console.error(
      `coverage-run: attempt ${attempt} UNHEALTHY (exit=${code}, pass=${summary.pass}, fail=${summary.fail}), log ${logPath}`,
    );
  }
  console.error(
    `coverage-run: giving up after ${MAX_ATTEMPTS} attempts; last log ${lastLog} (exit=${lastCode})`,
  );
  return 1;
}

if (import.meta.main) {
  process.exit(main());
}

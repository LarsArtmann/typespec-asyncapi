import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import pkg from "../../package.json" with { type: "json" };

const bin = fileURLToPath(
  new URL(`../../${pkg.bin["tsp-asyncapi"]}`, import.meta.url),
);

function run(...args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    timeout: 15_000,
  });
}

describe("published importer command", () => {
  it("implements help and rejects invalid arguments", () => {
    expect(run("--help")).toMatchObject({
      status: 0,
      stdout: expect.stringContaining("--namespace"),
      stderr: "",
    });
    expect(
      run("input.yml", "extra.yml", "--output-dir", "unused"),
    ).toMatchObject({
      status: 1,
      stderr: expect.stringContaining("Expected one input path"),
    });
  }, 35_000);

  it("creates output, warns on stderr, and refuses to overwrite", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-import-"));
    try {
      const input = fileURLToPath(
        new URL("fixtures/account-events.yaml", import.meta.url),
      );
      const output = join(dir, "nested", "output");
      const args = [
        input,
        "--output-dir",
        output,
        "--namespace",
        "CLI Service",
      ];
      expect(run(...args)).toMatchObject({
        status: 0,
        stdout: "",
        stderr: expect.stringContaining("#/channels/registrations"),
      });
      const file = join(output, "main.tsp");
      const saved = await readFile(file, "utf8");
      expect(saved).toContain("namespace CLI_Service;");
      expect(run(...args)).toMatchObject({
        status: 1,
        stderr: expect.stringContaining("Refusing to overwrite"),
      });
      await expect(readFile(file, "utf8")).resolves.toBe(saved);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  }, 35_000);

  it("does not write anything for malformed input or external references", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-import-"));
    try {
      const file = join(dir, "input.yaml");
      const output = join(dir, "output");
      for (const [source, error] of [
        ["asyncapi: [", /flow sequence/iu],
        [
          "asyncapi: 3.1.0\ninfo: { title: Events, version: '1' }\nservers:\n  server:\n    $ref: https://example.test/server.yaml",
          /External references/u,
        ],
      ] as const) {
        await writeFile(file, source);
        expect(run(file, "--output-dir", output)).toMatchObject({
          status: 1,
          stderr: expect.stringMatching(error),
        });
        await expect(readFile(join(output, "main.tsp"))).rejects.toMatchObject({
          code: "ENOENT",
        });
      }
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  }, 35_000);
});

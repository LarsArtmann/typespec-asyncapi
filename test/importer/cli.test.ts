import { spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import pkg from "../../package.json" with { type: "json" };

const bin = fileURLToPath(
  new URL(`../../${pkg.bin["tsp-asyncapi"]}`, import.meta.url),
);

function run(...args: string[]) {
  return runBin(bin, ...args);
}

function runBin(command: string, ...args: string[]) {
  return spawnSync(process.execPath, [command, ...args], {
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

  it("only requires OpenAPI3 when converting schemas", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-import-"));
    try {
      const repo = fileURLToPath(new URL("../../", import.meta.url));
      const modules = join(dir, "node_modules");
      await mkdir(join(modules, "@typespec"), { recursive: true });
      for (const name of ["@typespec/compiler", "yaml"]) {
        await symlink(
          join(repo, "node_modules", name),
          join(modules, name),
          "junction",
        );
      }
      await writeFile(join(dir, "package.json"), '{"type":"module"}');
      await cp(join(repo, "dist", "src"), join(dir, "src"), { recursive: true });
      const command = join(dir, "src", "importer", "cli.js");
      expect(runBin(command, "--help")).toMatchObject({
        status: 0,
        stderr: "",
      });

      const schemaFree = join(dir, "schema-free.yaml");
      await writeFile(
        schemaFree,
        "asyncapi: 3.1.0\ninfo: { title: Events, version: '1' }",
      );
      expect(
        runBin(command, schemaFree, "--output-dir", join(dir, "empty")),
      ).toMatchObject({
        status: 0,
        stderr: "",
      });

      const fixture = fileURLToPath(
        new URL("fixtures/account-events.yaml", import.meta.url),
      );
      const output = join(dir, "with-schemas");
      expect(runBin(command, fixture, "--output-dir", output)).toMatchObject({
        status: 1,
        stderr: expect.stringContaining("pnpm add -D @typespec/openapi3"),
      });
      await expect(readFile(join(output, "main.tsp"))).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
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
      const sentinel = "// Existing file must remain unchanged.\n";
      await writeFile(file, sentinel, "utf8");
      expect(run(...args)).toMatchObject({
        status: 1,
        stderr: expect.stringContaining("Refusing to overwrite"),
      });
      await expect(readFile(file, "utf8")).resolves.toBe(sentinel);
      await expect(readdir(output)).resolves.toStrictEqual(["main.tsp"]);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  }, 35_000);

  it("cleans up a partial write and lets the import be retried", async () => {
    const dir = await mkdtemp(join(tmpdir(), "asyncapi-import-"));
    try {
      const input = join(dir, "input.yaml");
      await writeFile(
        input,
        "asyncapi: 3.1.0\ninfo: { title: Events, version: '1' }",
      );
      const output = join(dir, "output");
      const args = [input, "--output-dir", output];
      const preload = `
        import fs from "node:fs/promises";
        import { syncBuiltinESMExports } from "node:module";
        const writeFile = fs.writeFile;
        fs.writeFile = async (target, _source, options) => {
          await writeFile(target, "partial output", options);
          throw Object.assign(new Error("Simulated disk full"), { code: "ENOSPC" });
        };
        syncBuiltinESMExports();
      `;
      const nodeArgs = [
        "--import",
        `data:text/javascript,${encodeURIComponent(preload)}`,
        bin,
        ...args,
      ];
      expect(
        spawnSync("node", nodeArgs, { encoding: "utf8", timeout: 15_000 }),
      ).toMatchObject({
        status: 1,
        stderr: expect.stringContaining("Simulated disk full"),
      });
      await expect(readdir(output)).resolves.toStrictEqual([]);

      expect(run(...args)).toMatchObject({ status: 0, stderr: "" });
      await expect(readFile(join(output, "main.tsp"), "utf8")).resolves.toContain(
        "namespace Events;",
      );
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

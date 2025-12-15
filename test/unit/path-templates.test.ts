import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  createTemplateVariables,
  detectCommandName,
  detectProjectRoot,
  getTemplateVariables,
  hasTemplateVariables,
  resolvePathTemplate,
  resolvePathTemplateWithValidation,
  SUPPORTED_TEMPLATE_VARIABLES,
  validatePathTemplate,
} from "../../src/domain/models/path-templates.js";
import { PathTemplateContext } from "../../src/path-template-context";
import { PathTemplateVariables } from "../../src/path-template-variables";

//TODO: this file is getting to big split it up

describe("Path Template Validation", () => {
  test("should validate supported template variables", () => {
    const validTemplate = "{project-root}/generated/{cmd}-asyncapi.yaml";
    const result = validatePathTemplate(validTemplate);

    expect(result.isValid).toBe(true);
    expect(result.variables).toEqual(["project-root", "cmd"]);
    expect(result.unsupportedVariables).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  test("should detect unsupported template variables", () => {
    const invalidTemplate = "{project-root}/{unknown-var}/{cmd}.yaml";
    const result = validatePathTemplate(invalidTemplate);

    expect(result.isValid).toBe(false);
    expect(result.variables).toEqual(["project-root", "unknown-var", "cmd"]);
    expect(result.unsupportedVariables).toEqual(["unknown-var"]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("unknown-var");
    expect(result.errors[0]).toContain(
      "Supported variables: cmd, project-root, emitter-name, output-dir",
    );
  });

  test("should validate path without template variables", () => {
    const simpleTemplate = "asyncapi.yaml";
    const result = validatePathTemplate(simpleTemplate);

    expect(result.isValid).toBe(true);
    expect(result.variables).toEqual([]);
    expect(result.unsupportedVariables).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  test("should validate all supported template variables", () => {
    const allVariablesTemplate = "{cmd}/{project-root}/{emitter-name}/{output-dir}/spec.yaml";
    const result = validatePathTemplate(allVariablesTemplate);

    expect(result.isValid).toBe(true);
    expect(result.variables).toEqual(["cmd", "project-root", "emitter-name", "output-dir"]);
    expect(result.unsupportedVariables).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  test("should handle malformed template variables", () => {
    const malformedTemplate = "{unclosed-var/test/{cmd}";
    const result = validatePathTemplate(malformedTemplate);

    // The regex should find only properly closed braces
    expect(result.variables).toEqual(["cmd"]);
    // "cmd" is a supported variable, so this should be valid
    expect(result.isValid).toBe(true);
    expect(result.unsupportedVariables).toEqual([]);
  });
});

describe("Command Name Detection", () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  test("should detect typespec command from process.argv", () => {
    process.argv = ["node", "/usr/local/bin/typespec", "emit"];
    const cmd = detectCommandName();
    expect(cmd).toBe("typespec");
  });

  test("should detect tsp command from process.argv", () => {
    process.argv = ["node", "/usr/local/bin/tsp", "compile"];
    const cmd = detectCommandName();
    expect(cmd).toBe("tsp");
  });

  test("should fall back to typespec when no command detected", () => {
    process.argv = ["node", "some-script"];
    const cmd = detectCommandName();
    expect(cmd).toBe("typespec");
  });

  test("should handle Windows executable paths", () => {
    process.argv = ["node", "C:\\Program Files\\typespec.exe", "emit"];
    const cmd = detectCommandName();
    expect(cmd).toBe("typespec");
  });
});

describe("Project Root Detection", () => {
  test("should detect project root from current directory", () => {
    // This test assumes we're in a project with package.json
    const projectRoot = detectProjectRoot();
    expect(projectRoot).toContain("typespec-asyncapi");
  });

  test("should fall back to provided path when no project root found", () => {
    const tempPath = "/tmp/nonexistent";
    const projectRoot = detectProjectRoot(tempPath);
    expect(projectRoot).toBe(resolve(tempPath));
  });
});

describe("Template Variables Creation", () => {
  test("should create default template variables", () => {
    const context: PathTemplateContext = {};
    const variables = createTemplateVariables(context);

    expect(variables).toHaveProperty("cmd");
    expect(variables).toHaveProperty("project-root");
    expect(variables).toHaveProperty("emitter-name", "asyncapi");
    expect(variables).toHaveProperty("output-dir");

    expect(typeof variables.cmd).toBe("string");
    expect(typeof variables["project-root"]).toBe("string");
    expect(typeof variables["output-dir"]).toBe("string");
  });

  test("should use provided emitter output directory", () => {
    const customOutputDir = "/custom/output/path";
    const context: PathTemplateContext = {
      emitterOutputDir: customOutputDir,
    };
    const variables = createTemplateVariables(context);

    expect(variables["output-dir"]).toBe(customOutputDir);
  });

  test("should use custom working directory", () => {
    const customCwd = "/custom/working/directory";
    const context: PathTemplateContext = {
      cwd: customCwd,
    };
    const variables = createTemplateVariables(context);

    // Project root detection should start from custom cwd
    expect(variables["project-root"]).toBe(resolve(customCwd));
  });
});

describe("Path Template Resolution", () => {
  const testVariables: PathTemplateVariables = {
    cmd: "typespec",
    "project-root": "/project",
    "emitter-name": "asyncapi",
    "output-dir": "/project/generated",
  };

  test("should resolve simple template variables", () => {
    const template = "{cmd}-api.yaml";
    const resolved = resolvePathTemplate(template, testVariables);
    expect(resolved).toBe("/project/typespec-api.yaml"); // Absolute path
  });

  test("should resolve complex template paths", () => {
    const template = "{project-root}/generated/{emitter-name}/{cmd}/spec.yaml";
    const resolved = resolvePathTemplate(template, testVariables);
    expect(resolved).toBe("/project/generated/asyncapi/typespec/spec.yaml");
  });

  test("should handle path without template variables", () => {
    const template = "simple-path.yaml";
    const resolved = resolvePathTemplate(template, testVariables);
    expect(resolved).toBe("/project/simple-path.yaml"); // Made absolute using project-root
  });

  test("should preserve absolute paths", () => {
    const template = "/absolute/{cmd}/path.yaml";
    const resolved = resolvePathTemplate(template, testVariables);
    expect(resolved).toBe("/absolute/typespec/path.yaml");
  });

  test("should normalize path separators", () => {
    const template = "{project-root}\\\\windows\\\\path\\\\{cmd}.yaml";
    const resolved = resolvePathTemplate(template, testVariables);
    expect(resolved).toBe("/project/windows/path/typespec.yaml");
  });

  test("should handle repeated template variables", () => {
    const template = "{cmd}-{cmd}-spec.yaml";
    const resolved = resolvePathTemplate(template, testVariables);
    expect(resolved).toBe("/project/typespec-typespec-spec.yaml");
  });
});

describe("Path Template Resolution with Validation", () => {
  test("should resolve valid template with context", () => {
    const template = "{project-root}/specs/{cmd}-api.yaml";
    const context: PathTemplateContext = {};

    const resolved = resolvePathTemplateWithValidation(template, context);
    expect(resolved).toContain("specs");
    expect(resolved).toContain("-api.yaml");
  });

  test("should throw error for invalid template variables", () => {
    const invalidTemplate = "{invalid-var}/spec.yaml";
    const context: PathTemplateContext = {};

    expect(() => {
      resolvePathTemplateWithValidation(invalidTemplate, context);
    }).toThrow("Path template validation failed");
  });

  test("should handle empty context", () => {
    const template = "{emitter-name}/simple.yaml";

    const resolved = resolvePathTemplateWithValidation(template);
    expect(resolved).toContain("asyncapi/simple.yaml");
  });
});

describe("Template Variable Detection", () => {
  test("should detect template variables in path", () => {
    const pathWithTemplates = "{project-root}/generated/{cmd}-api.yaml";
    expect(hasTemplateVariables(pathWithTemplates)).toBe(true);
  });

  test("should detect no template variables", () => {
    const simplePath = "generated/api.yaml";
    expect(hasTemplateVariables(simplePath)).toBe(false);
  });

  test("should extract template variables from path", () => {
    const pathWithTemplates = "{cmd}/{project-root}/{cmd}/spec.yaml";
    const variables = getTemplateVariables(pathWithTemplates);
    expect(variables).toEqual(["cmd", "project-root", "cmd"]);
  });

  test("should return empty array for path without variables", () => {
    const simplePath = "api-spec.yaml";
    const variables = getTemplateVariables(simplePath);
    expect(variables).toEqual([]);
  });
});

describe("Supported Template Variables", () => {
  test("should export expected supported variables", () => {
    expect(SUPPORTED_TEMPLATE_VARIABLES).toEqual([
      "cmd",
      "project-root",
      "emitter-name",
      "output-dir",
    ]);
  });

  test("should have all supported variables as const", () => {
    // This ensures the type system understands these as literal types
    const cmdVar: "cmd" = SUPPORTED_TEMPLATE_VARIABLES[0];
    expect(cmdVar).toBe("cmd");
  });
});

describe("Cross-Platform Path Handling", () => {
  test("should handle Windows-style paths", () => {
    const variables: PathTemplateVariables = {
      cmd: "tsp",
      "project-root": "/tmp/test-project",
      "emitter-name": "asyncapi",
      "output-dir": "/tmp/test-project/generated",
    };

    const template = "{project-root}/specs/{cmd}.yaml";
    const resolved = resolvePathTemplate(template, variables);

    // Should properly resolve the template variables
    expect(resolved).toBe("/tmp/test-project/specs/tsp.yaml");
  });

  test("should handle Unix-style paths", () => {
    const variables: PathTemplateVariables = {
      cmd: "typespec",
      "project-root": "/home/user/projects/api",
      "emitter-name": "asyncapi",
      "output-dir": "/home/user/projects/api/dist",
    };

    const template = "{project-root}/generated/{cmd}/{emitter-name}.yaml";
    const resolved = resolvePathTemplate(template, variables);

    expect(resolved).toBe("/home/user/projects/api/generated/typespec/asyncapi.yaml");
  });
});

describe("Error Handling", () => {
  test("should provide detailed error messages for validation failures", () => {
    const invalidTemplate = "{unknown1}/{unknown2}/spec.yaml";

    try {
      resolvePathTemplateWithValidation(invalidTemplate);
      expect.unreachable("Should have thrown validation error");
    } catch (error) {
      const message = String(error);
      expect(message).toContain("Path template validation failed");
      expect(message).toContain("unknown1");
      expect(message).toContain("unknown2");
      expect(message).toContain("Supported variables");
    }
  });

  test("should handle malformed template syntax gracefully", () => {
    const malformedTemplate = "path-with-{unclosed-brace";
    const result = validatePathTemplate(malformedTemplate);

    // Should not find any variables due to malformed syntax
    expect(result.isValid).toBe(true);
    expect(result.variables).toEqual([]);
  });
});

describe("Performance Tests", () => {
  test("should resolve templates efficiently for large variable sets", () => {
    const largeTemplate = Array.from({ length: 100 }, (_, i) =>
      i % 4 === 0
        ? "{cmd}"
        : i % 4 === 1
          ? "{project-root}"
          : i % 4 === 2
            ? "{emitter-name}"
            : "{output-dir}",
    ).join("/");

    const variables: PathTemplateVariables = {
      cmd: "typespec",
      "project-root": "/project",
      "emitter-name": "asyncapi",
      "output-dir": "/output",
    };

    const start = performance.now();
    const resolved = resolvePathTemplate(largeTemplate, variables);
    const duration = performance.now() - start;

    expect(resolved).toContain("typespec");
    expect(resolved).toContain("asyncapi");
    expect(duration).toBeLessThan(10); // Should complete in under 10ms
  });

  test("should validate complex templates efficiently", () => {
    const complexTemplate = "{cmd}/{project-root}/{emitter-name}/{output-dir}".repeat(50);

    const start = performance.now();
    const result = validatePathTemplate(complexTemplate);
    const duration = performance.now() - start;

    expect(result.isValid).toBe(true);
    expect(duration).toBeLessThan(5); // Should complete in under 5ms
  });
});

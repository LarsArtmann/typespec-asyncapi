#!/usr/bin/env bun

import { execSync } from "child_process";
import { readdir, readFile, access } from "fs/promises";
import { join } from "path";

/**
 * Simple Production Readiness Check
 *
 * Validates critical production requirements for TypeSpec AsyncAPI emitter
 */
class SimpleProductionChecker {
  private rootPath = process.cwd();
  private passedChecks = 0;
  private totalChecks = 0;
  private criticalFailures: string[] = [];

  async runChecks(): Promise<void> {
    console.log("🔍 Running Production Readiness Checks...\n");

    // Critical validation checks
    await this.checkTypeScriptCompilation();
    await this.checkTestSuite();
    await this.checkBuildArtifacts();
    await this.checkPackageConfiguration();
    await this.checkDocumentation();
    await this.checkTypeSpecIntegration();
    await this.checkAsyncAPICompliance();
    await this.checkPluginInfrastructure();

    // Final assessment
    this.generateSummary();
  }

  private async checkTypeScriptCompilation(): Promise<void> {
    this.totalChecks++;
    console.log("⚡ Checking TypeScript compilation...");

    try {
      execSync("bun run typecheck", { cwd: this.rootPath, stdio: "pipe" });
      console.log("✅ TypeScript compilation: PASSED");
      this.passedChecks++;
    } catch (error) {
      console.log("❌ TypeScript compilation: FAILED");
      this.criticalFailures.push("TypeScript compilation errors");
    }
  }

  private async checkTestSuite(): Promise<void> {
    this.totalChecks++;
    console.log("🧪 Checking test suite...");

    try {
      execSync("bun test", { cwd: this.rootPath, stdio: "pipe" });
      console.log("✅ Test suite: PASSED");
      this.passedChecks++;
    } catch (error) {
      console.log("❌ Test suite: FAILED");
      this.criticalFailures.push("Test suite has failing tests");
    }
  }

  private async checkBuildArtifacts(): Promise<void> {
    this.totalChecks++;
    console.log("📦 Checking build artifacts...");

    try {
      const distPath = join(this.rootPath, "dist");
      const distFiles = await readdir(distPath);

      const requiredFiles = ["index.js", "lib.js"];
      const missingFiles = requiredFiles.filter((file) => !distFiles.includes(file));

      if (missingFiles.length === 0) {
        console.log(`✅ Build artifacts: PASSED (${distFiles.length} files)`);
        this.passedChecks++;
      } else {
        console.log(`❌ Build artifacts: FAILED - Missing: ${missingFiles.join(", ")}`);
        this.criticalFailures.push("Missing build artifacts");
      }
    } catch (error) {
      console.log("❌ Build artifacts: FAILED - No dist directory");
      this.criticalFailures.push("Build artifacts not found");
    }
  }

  private async checkPackageConfiguration(): Promise<void> {
    this.totalChecks++;
    console.log("📋 Checking package configuration...");

    try {
      const packagePath = join(this.rootPath, "package.json");
      const packageContent = await readFile(packagePath, "utf8");
      const packageJson = JSON.parse(packageContent);

      const requiredFields = ["name", "version", "description", "main", "types"];
      const missingFields = requiredFields.filter((field) => !packageJson[field]);

      const hasTypeSpecDep =
        packageJson.peerDependencies?.["@typespec/compiler"] ||
        packageJson.dependencies?.["@typespec/compiler"];

      if (missingFields.length === 0 && hasTypeSpecDep) {
        console.log("✅ Package configuration: PASSED");
        this.passedChecks++;
      } else {
        console.log(`❌ Package configuration: FAILED`);
        if (missingFields.length > 0) {
          console.log(`   Missing fields: ${missingFields.join(", ")}`);
        }
        if (!hasTypeSpecDep) {
          console.log("   Missing @typespec/compiler dependency");
          this.criticalFailures.push("Missing TypeSpec compiler dependency");
        }
      }
    } catch (error) {
      console.log("❌ Package configuration: FAILED - Cannot read package.json");
      this.criticalFailures.push("Invalid package.json");
    }
  }

  private async checkDocumentation(): Promise<void> {
    this.totalChecks++;
    console.log("📚 Checking documentation...");

    try {
      await access(join(this.rootPath, "README.md"));
      const readmeContent = await readFile(join(this.rootPath, "README.md"), "utf8");

      const qualityChecks = [
        readmeContent.length > 1000,
        readmeContent.includes("## Installation"),
        readmeContent.includes("## Usage"),
        readmeContent.includes("TypeSpec"),
        readmeContent.includes("AsyncAPI"),
      ];

      const passedQualityChecks = qualityChecks.filter(Boolean).length;

      if (passedQualityChecks >= 4) {
        console.log(`✅ Documentation: PASSED (${passedQualityChecks}/5 quality criteria)`);
        this.passedChecks++;
      } else {
        console.log(`⚠️ Documentation: PARTIAL (${passedQualityChecks}/5 quality criteria)`);
        this.passedChecks += 0.5;
      }
    } catch (error) {
      console.log("❌ Documentation: FAILED - README.md not found");
    }
  }

  private async checkTypeSpecIntegration(): Promise<void> {
    this.totalChecks++;
    console.log("🔧 Checking TypeSpec integration...");

    try {
      // Check for TypeSpec library definition
      await access(join(this.rootPath, "lib", "main.tsp"));

      // Check for emitter implementation
      const indexPath = join(this.rootPath, "src", "index.ts");
      const indexContent = await readFile(indexPath, "utf8");

      const hasOnEmit = indexContent.includes("$onEmit");
      const hasNamespace = indexContent.includes("setTypeSpecNamespace");

      if (hasOnEmit && hasNamespace) {
        console.log("✅ TypeSpec integration: PASSED");
        this.passedChecks++;
      } else {
        console.log("❌ TypeSpec integration: FAILED");
        this.criticalFailures.push("Incomplete TypeSpec integration");
      }
    } catch (error) {
      console.log("❌ TypeSpec integration: FAILED");
      this.criticalFailures.push("TypeSpec integration not found");
    }
  }

  private async checkAsyncAPICompliance(): Promise<void> {
    this.totalChecks++;
    console.log("📋 Checking AsyncAPI compliance...");

    try {
      const decoratorsPath = join(this.rootPath, "src", "decorators");
      const decoratorFiles = await readdir(decoratorsPath);

      const requiredDecorators = [
        "channel.ts",
        "publish.ts",
        "subscribe.ts",
        "server.ts",
        "message.ts",
      ];
      const foundDecorators = requiredDecorators.filter((decorator) =>
        decoratorFiles.includes(decorator),
      );

      if (foundDecorators.length >= 4) {
        console.log(
          `✅ AsyncAPI compliance: PASSED (${foundDecorators.length}/${requiredDecorators.length} decorators)`,
        );
        this.passedChecks++;
      } else {
        console.log(
          `❌ AsyncAPI compliance: FAILED (${foundDecorators.length}/${requiredDecorators.length} decorators)`,
        );
        this.criticalFailures.push("Missing essential AsyncAPI decorators");
      }
    } catch (error) {
      console.log("❌ AsyncAPI compliance: FAILED - Decorators directory not found");
      this.criticalFailures.push("AsyncAPI decorators not implemented");
    }
  }

  private async checkPluginInfrastructure(): Promise<void> {
    this.totalChecks++;
    console.log("🔌 Checking plugin infrastructure...");

    try {
      // Check for plugin interfaces
      await access(join(this.rootPath, "src", "plugins", "interfaces"));

      // Check for at least one cloud provider plugin
      const cloudProvidersPath = join(this.rootPath, "src", "plugins", "cloud-providers");
      const cloudProviders = await readdir(cloudProvidersPath);
      const pluginFiles = cloudProviders.filter((file) => file.endsWith("-plugin.ts"));

      if (pluginFiles.length >= 2) {
        console.log(
          `✅ Plugin infrastructure: PASSED (${pluginFiles.length} cloud provider plugins)`,
        );
        this.passedChecks++;
      } else {
        console.log(
          `⚠️ Plugin infrastructure: PARTIAL (${pluginFiles.length} cloud provider plugins)`,
        );
        this.passedChecks += 0.5;
      }
    } catch (error) {
      console.log("❌ Plugin infrastructure: FAILED");
    }
  }

  private generateSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 PRODUCTION READINESS ASSESSMENT SUMMARY");
    console.log("=".repeat(60));

    const successRate = (this.passedChecks / this.totalChecks) * 100;

    console.log(
      `\n📊 Overall Score: ${this.passedChecks.toFixed(1)}/${this.totalChecks} (${successRate.toFixed(1)}%)`,
    );

    if (this.criticalFailures.length === 0 && successRate >= 80) {
      console.log("\n✅ PRODUCTION READY!");
      console.log("🚀 All critical validations passed. Ready for deployment.");
    } else if (this.criticalFailures.length === 0 && successRate >= 70) {
      console.log("\n⚠️  MOSTLY READY");
      console.log("👍 No critical failures, but some improvements recommended.");
    } else {
      console.log("\n❌ NOT PRODUCTION READY");
      console.log("🔧 Critical issues must be resolved before deployment.");

      if (this.criticalFailures.length > 0) {
        console.log("\n🚨 Critical Failures:");
        for (const failure of this.criticalFailures) {
          console.log(`   - ${failure}`);
        }
      }

      process.exit(1);
    }

    console.log("\n📋 Validation Categories:");
    console.log("   ⚡ TypeScript Compilation - Build process integrity");
    console.log("   🧪 Test Suite - Code quality assurance");
    console.log("   📦 Build Artifacts - Distribution readiness");
    console.log("   📋 Package Configuration - NPM publishing requirements");
    console.log("   📚 Documentation - User guidance and examples");
    console.log("   🔧 TypeSpec Integration - Compiler integration");
    console.log("   📋 AsyncAPI Compliance - Specification compliance");
    console.log("   🔌 Plugin Infrastructure - Extensibility framework");

    console.log("\n🎉 Assessment completed successfully!");
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const checker = new SimpleProductionChecker();
  await checker.runChecks();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Production readiness check failed:", error);
    process.exit(1);
  });
}

export { SimpleProductionChecker };

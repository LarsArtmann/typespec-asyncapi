# TypeSpec AsyncAPI Project Justfile

# Default recipe
default:
    just --list

# Build the project
build:
    #!/bin/bash
    set -euo pipefail
    echo "🏗️  Building TypeScript project..."
    if bun run build; then
        echo "✅ Build completed successfully"
        echo "📦 Checking build artifacts..."
        if [ -d "dist" ]; then
            echo "✅ Build artifacts generated in dist/"
            echo "📊 Build statistics:"
            find dist -name "*.js" -o -name "*.d.ts" | wc -l | xargs echo "  Generated files:"
            du -sh dist 2>/dev/null | awk '{print "  Total size: " $1}' || echo "  Total size: unknown"
        else
            echo "⚠️  No dist/ directory found"
            exit 1
        fi
    else
        echo "❌ Build failed with TypeScript compilation errors"
        echo "💡 Run 'just typecheck' for detailed error information"
        exit 1
    fi

# Run linting
lint:
    bun run lint

# Run linting with auto-fix
lint-fix:
    bun run lint:fix

# Type check without emitting files
typecheck:
    bun run typecheck

# Validate build artifacts
validate-build:
    #!/bin/bash
    set -euo pipefail
    echo "🔍 Validating build artifacts..."
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        echo "❌ Build artifacts not found. Run 'just build' first."
        exit 1
    fi
    
    # Check for declaration files
    if [ $(find dist -name "*.d.ts" | wc -l) -eq 0 ]; then
        echo "❌ No TypeScript declaration files found"
        exit 1
    fi
    
    # Check for JavaScript files
    if [ $(find dist -name "*.js" | wc -l) -eq 0 ]; then
        echo "❌ No JavaScript files found"
        exit 1
    fi
    
    # Check for source maps
    if [ $(find dist -name "*.map" | wc -l) -eq 0 ]; then
        echo "⚠️  No source maps found (may be expected)"
    fi
    
    echo "✅ Build artifacts validation passed"
    echo "📊 Summary:"
    echo "  JS files: $(find dist -name "*.js" | wc -l | tr -d ' ')"
    echo "  Declaration files: $(find dist -name "*.d.ts" | wc -l | tr -d ' ')"
    echo "  Source maps: $(find dist -name "*.map" | wc -l | tr -d ' ')"

# Run tests
test:
    bun test

# Run validation tests
test-validation:
    bun run test:validation

# Run AsyncAPI tests
test-asyncapi:
    bun run test:asyncapi

# Run tests with coverage
test-coverage:
    bun run test:coverage

# Clean build artifacts
clean:
    bun run clean

# Install dependencies
install:
    bun install

# Install jscpd globally if not present, then find code duplicates
find-duplicates:
    #!/bin/bash
    set -euo pipefail
    if ! command -v jscpd &> /dev/null; then
        echo "Installing jscpd globally..."
        bun install -g jscpd
    fi
    echo "Running code duplication detection..."
    jscpd src --min-tokens 50 --min-lines 5 --format typescript,javascript --reporters console,json --output ./jscpd-report

# Alias for find-duplicates
alias fd := find-duplicates

# Full quality check pipeline
quality-check:
    just clean
    just build
    just validate-build
    just typecheck
    just lint
    just test
    just find-duplicates

# Development workflow
dev:
    bun run dev

# Watch mode for building
watch:
    bun run watch

# Watch mode for tests
test-watch:
    bun run test:watch
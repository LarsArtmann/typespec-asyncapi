# TypeSpec AsyncAPI Project Justfile

# Default recipe
default:
    just --list

# Build the project
build:
    #!/bin/bash
    set -euo pipefail
    echo "🏗️  Building TypeScript project..."
    echo "🧹 Cleaning dist/ directory..."
    bun run clean
    echo "🔨 Running TypeScript compilation..."
    bun run build
    sleep 1
    if [ -d "dist" ]; then
        echo "✅ Build completed successfully"
        echo "📦 Build artifacts generated in dist/"
        echo "📊 Build statistics:"
        find dist -name "*.js" -o -name "*.d.ts" | wc -l | xargs echo "  Generated files:"
        du -sh dist 2>/dev/null | awk '{print "  Total size: " $1}' || echo "  Total size: unknown"
    else
        echo "❌ Build failed - no dist directory found"
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
    #!/bin/bash
    set -euo pipefail
    echo "🧹 Cleaning build artifacts..."
    if [ -d "dist" ]; then
        trash dist/
        echo "✅ Cleaned dist/ directory"
    else
        echo "ℹ️  No dist/ directory to clean"
    fi
    echo "✅ Clean completed"

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
    echo "🔍 Running code duplication detection..."
    echo "📊 Generating console, JSON, and HTML reports..."
    
    # Create output directory if it doesn't exist
    mkdir -p ./jscpd-report
    
    # Run jscpd with multiple reporters including HTML
    jscpd src --min-tokens 40 --min-lines 3 --format typescript,javascript --reporters console,json,html --output ./jscpd-report
    
    echo "✅ Duplication analysis complete!"
    echo "📁 Reports generated:"
    echo "  📄 Console: Output above"
    echo "  📋 JSON: ./jscpd-report/jscpd-report.json"
    echo "  🌐 HTML: ./jscpd-report/html/index.html"
    
    # Check if HTML report was generated and provide direct link
    if [ -f "./jscpd-report/html/index.html" ]; then
        echo "🔗 Open HTML report: open ./jscpd-report/html/index.html"
    fi

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

# Compile TypeSpec files (requires dist/ to exist first)
compile:
    #!/bin/bash
    set -euo pipefail
    echo "🔧 Compiling TypeSpec files with AsyncAPI emitter..."
    
    # Check if dist directory exists (required for TypeSpec to import decorators)
    if [ ! -d "dist" ]; then
        echo "❌ dist/ directory not found. TypeSpec needs compiled decorators."
        echo "💡 Run 'just build' first to generate dist/ directory"
        exit 1
    fi
    
    # Check if there are any .tsp files to compile
    if [ $(find . -name "*.tsp" -not -path "./node_modules/*" -not -path "./dist/*" | wc -l) -eq 0 ]; then
        echo "⚠️  No TypeSpec (.tsp) files found to compile"
        echo "💡 Create a .tsp file or run from examples/ directory"
        exit 1
    fi
    
    echo "📁 Found TypeSpec files:"
    find . -name "*.tsp" -not -path "./node_modules/*" -not -path "./dist/*" | head -5
    
    echo "🚀 Running TypeSpec compilation..."
    if bunx tsp compile . --emit @typespec/asyncapi; then
        echo "✅ TypeSpec compilation completed successfully"
        echo "📦 Checking for generated files..."
        
        # Look for common output directories
        for dir in tsp-output test-output; do
            if [ -d "$dir" ]; then
                echo "✅ Generated files in $dir/"
                find "$dir" -type f | head -3 | sed 's/^/  /'
                break
            fi
        done
    else
        echo "❌ TypeSpec compilation failed"
        echo "💡 Check .tsp files for syntax errors or missing imports"
        exit 1
    fi

# AsyncAPI CLI Commands

# Validate AsyncAPI specifications using AsyncAPI CLI
validate-asyncapi:
    #!/bin/bash
    set -euo pipefail
    echo "🔍 Validating AsyncAPI specifications with AsyncAPI CLI..."
    
    # Check if asyncapi command is available
    if ! command -v asyncapi &> /dev/null; then
        echo "❌ AsyncAPI CLI not found. Installing..."
        bun install
    fi
    
    # Find generated AsyncAPI files
    asyncapi_files=$(find tsp-output test-output examples -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null | grep -E "(asyncapi|tsp-output)" | head -10)
    
    if [ -z "$asyncapi_files" ]; then
        echo "⚠️  No AsyncAPI files found. Generate them first with 'just compile'"
        exit 1
    fi
    
    validation_success=0
    validation_total=0
    
    echo "📋 Found AsyncAPI files:"
    for file in $asyncapi_files; do
        echo "  📄 $file"
        validation_total=$((validation_total + 1))
        
        echo "  🔍 Validating $file..."
        if bunx asyncapi validate "$file"; then
            echo "  ✅ $file is valid"
            validation_success=$((validation_success + 1))
        else
            echo "  ❌ $file has validation errors"
        fi
        echo ""
    done
    
    echo "📊 Validation Results:"
    echo "  ✅ Valid: $validation_success/$validation_total"
    if [ $validation_success -eq $validation_total ]; then
        echo "🎉 All AsyncAPI specifications are valid!"
    else
        echo "❌ Some AsyncAPI specifications have validation errors"
        exit 1
    fi

# Generate AsyncAPI specs and validate them
validate-generated:
    just compile
    just validate-asyncapi

# Check AsyncAPI Studio compatibility
check-studio-compatibility:
    #!/bin/bash
    set -euo pipefail
    echo "🎨 Checking AsyncAPI Studio compatibility..."
    
    asyncapi_files=$(find tsp-output test-output examples -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null | head -5)
    
    if [ -z "$asyncapi_files" ]; then
        echo "⚠️  No AsyncAPI files found. Generate them first with 'just compile'"
        exit 1
    fi
    
    echo "📋 Checking Studio compatibility for files:"
    for file in $asyncapi_files; do
        echo "  📄 $file"
        echo "  🔍 Validating structure for Studio..."
        
        # Check if it's valid AsyncAPI first
        if bunx asyncapi validate "$file"; then
            echo "  ✅ $file is Studio-compatible (valid AsyncAPI 3.0)"
            echo "  🌐 View in Studio: https://studio.asyncapi.com/?url=file://$PWD/$file"
        else
            echo "  ❌ $file is not Studio-compatible (validation failed)"
        fi
        echo ""
    done

# Validate binding compliance
validate-bindings:
    ./scripts/validate-bindings.sh

# Full validation workflow
validate-all: validate-build test validate-asyncapi validate-bindings
# TypeSpec AsyncAPI Project Justfile

# Default recipe
default:
    just --list

# Build the project
build:
    #!/bin/bash
    set -euo pipefail
    echo "🏗️  Building TypeScript project..."
    
    # Clean dist directory first (safe cleanup)
    echo "🧹 Cleaning dist/ directory..."
    if [ -d "dist" ]; then
        trash dist/
        echo "  ✅ Cleaned existing dist/ directory"
    else
        echo "  ℹ️  No dist/ directory to clean"
    fi
    
    # Build with skipLibCheck to avoid library compatibility issues  
    echo "🔨 Running TypeScript compilation..."
    # Use direct compilation approach that we know works
    if bunx tsc src/index.ts --outDir dist --declaration --skipLibCheck --moduleResolution bundler --module ESNext --target ESNext; then
        echo "✅ Build completed successfully"
        echo "📦 Checking build artifacts..."
        if [ -d "dist" ]; then
            echo "✅ Build artifacts generated in dist/"
            echo "📊 Build statistics:"
            find dist -name "*.js" -o -name "*.d.ts" | wc -l | xargs echo "  Generated files:"
            du -sh dist 2>/dev/null | awk '{print "  Total size: " $1}' || echo "  Total size: unknown"
        else
            echo "⚠️  No dist/ directory found after compilation"
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
    #!/bin/bash
    set -euo pipefail
    echo "🧹 Cleaning build artifacts..."
    # Create dist directory if it doesn't exist, then clean it
    mkdir -p dist
    bun run clean
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
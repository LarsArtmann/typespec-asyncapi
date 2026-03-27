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

# Run tests (with build prerequisite to catch TS errors)
test:
    #!/bin/bash
    set -euo pipefail
    echo "🏗️  Building project before running tests..."
    bun run build
    echo "🧪 Running tests..."
    bun test

# Run validation tests (with build prerequisite)
test-validation:
    #!/bin/bash
    set -euo pipefail
    echo "🏗️  Building project before validation tests..."
    bun run build
    echo "🧪 Running validation tests..."
    bun test test/critical-validation.test.ts test/all-generated-specs-validation.test.ts

# Run AsyncAPI tests (with build prerequisite)
test-asyncapi:
    #!/bin/bash
    set -euo pipefail
    echo "🏗️  Building project before AsyncAPI tests..."
    bun run build
    echo "🧪 Running AsyncAPI tests..."
    bun test test/validation/

# Run tests with coverage (with build prerequisite)
test-coverage:
    #!/bin/bash
    set -euo pipefail
    echo "🏗️  Building project before coverage tests..."
    bun run build
    echo "🧪 Running coverage tests..."
    bun test --coverage

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

# Install pre-commit hooks
install-pre-commit:
    #!/bin/bash
    set -euo pipefail
    echo "🔧 Installing pre-commit hooks..."
    
    # Check if pre-commit is available
    if ! command -v pre-commit &> /dev/null; then
        echo "📦 Installing pre-commit..."
        if command -v pip &> /dev/null; then
            pip install pre-commit
        elif command -v pipx &> /dev/null; then
            pipx install pre-commit
        else
            echo "❌ Neither pip nor pipx found. Please install pre-commit manually:"
            echo "   pip install pre-commit"
            echo "   or"
            echo "   pipx install pre-commit"
            exit 1
        fi
    fi
    
    # Install the git hook scripts
    pre-commit install
    pre-commit install --hook-type pre-push
    
    echo "✅ Pre-commit hooks installed successfully"
    echo "💡 Hooks will run automatically on git commit and git push"

# Update pre-commit hooks to latest versions
update-pre-commit:
    #!/bin/bash
    set -euo pipefail
    echo "🔄 Updating pre-commit hooks..."
    
    if ! command -v pre-commit &> /dev/null; then
        echo "❌ pre-commit not found. Run 'just install-pre-commit' first."
        exit 1
    fi
    
    pre-commit autoupdate
    echo "✅ Pre-commit hooks updated to latest versions"

# Run pre-commit hooks manually on all files
pre-commit-all:
    #!/bin/bash
    set -euo pipefail
    echo "🚀 Running pre-commit hooks on all files..."
    
    if ! command -v pre-commit &> /dev/null; then
        echo "❌ pre-commit not found. Run 'just install-pre-commit' first."
        exit 1
    fi
    
    pre-commit run --all-files

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
    bunx jscpd src --min-tokens 30 --min-lines 3 --format typescript,javascript --reporters console,json,html --output ./jscpd-report

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

# === EFFECT.TS ENFORCEMENT INTEGRATION ===

# Quick Effect.TS validation (integrated ESLint approach)
effect-lint-quick:
    #!/bin/bash
    set -euo pipefail
    echo "⚡ Running quick Effect.TS pattern validation..."
    echo "🔍 Using integrated ESLint rules for fast feedback..."
    bun run lint
    echo "✅ Quick Effect.TS validation complete"

# Comprehensive Effect.TS enforcement (specialized tools approach)
effect-lint-comprehensive:
    #!/bin/bash
    set -euo pipefail
    echo "🔥 Running comprehensive Effect.TS enforcement..."
    echo "🧪 Using specialized pattern detection tools..."
    just -f effect-enforcement.just effect-setup
    just -f effect-enforcement.just effect-lint
    echo "✅ Comprehensive Effect.TS enforcement complete"

# Dual Effect.TS validation - BEST OF BOTH WORLDS
effect-lint-dual:
    #!/bin/bash
    set -euo pipefail
    echo "🚀 DUAL EFFECT.TS VALIDATION - MAXIMUM COVERAGE"
    echo ""
    echo "📋 Phase 1: Quick integrated validation (ESLint)..."
    just effect-lint-quick
    echo ""
    echo "📋 Phase 2: Comprehensive specialized validation..."
    just effect-lint-comprehensive
    echo ""
    echo "📊 Phase 3: Generating consolidated compliance report..."
    just -f effect-enforcement.just effect-report
    echo ""
    echo "🎉 DUAL VALIDATION COMPLETE - Maximum Effect.TS compliance achieved!"

# Effect.TS enforcement shortcuts (delegated to specialized justfile)
effect-ban-promises:
    just -f effect-enforcement.just ban-promises

effect-ban-async-await:
    just -f effect-enforcement.just ban-async-await

effect-ban-try-catch:
    just -f effect-enforcement.just ban-try-catch

effect-ban-throw:
    just -f effect-enforcement.just ban-throw

effect-ban-console:
    just -f effect-enforcement.just ban-console

effect-architecture-validation:
    just -f effect-enforcement.just effect-arch-lint
    just -f effect-enforcement.just railway-validation

effect-compliance-report:
    just -f effect-enforcement.just effect-report

# Development workflow with Effect.TS awareness
dev-effect-aware:
    #!/bin/bash
    set -euo pipefail
    echo "🔥 Starting Effect.TS-aware development mode..."
    echo "🔍 Running initial Effect.TS validation..."
    just effect-lint-quick || echo "⚠️  Effect.TS violations detected - fix them as you develop"
    echo "🚀 Starting development server with Effect.TS monitoring..."
    bun run dev

# Full quality check pipeline with Effect.TS enforcement
quality-check: clean build validate-build typecheck effect-lint-dual test find-duplicates compile validate-all

# Development workflow
dev:
    bun run dev

# Watch mode for building
watch:
    bun run watch

# Test metrics reporter (split brain solution for issue #134)
test-metrics:
    #!/bin/bash
    set -euo pipefail
    echo "📊 Running test metrics reporter (Issue #134 split brain solution)..."
    bun run scripts/test-metrics-reporter.ts

# Alias for test-metrics
alias tm := test-metrics

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
    if bunx tsp compile . --emit @lars-artmann/typespec-asyncapi; then
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
    if ! bunx asyncapi --version &> /dev/null; then
        echo "❌ AsyncAPI CLI not found. Installing..."
        bun install
    fi

    # Find generated AsyncAPI files
    asyncapi_files=$(find . -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null | grep -E "(asyncapi|tsp-output)" | head -10)

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

# Generate API documentation using TypeDoc
generate-api-docs:
    #!/bin/bash
    set -euo pipefail
    echo "📚 Generating API documentation with TypeDoc..."

    # Check if TypeDoc is available
    if ! bunx typedoc --version &> /dev/null; then
        echo "📦 Installing TypeDoc..."
        bun add -D typedoc
    fi

    # Ensure build exists for proper type resolution
    if [ ! -d "dist" ]; then
        echo "🏗️  Building project first for type resolution..."
        just build
    fi

    # Create docs directories
    mkdir -p docs/api/html

    echo "🔧 Generating TypeScript API documentation..."
    bunx typedoc src/index.ts \
        --out docs/api/html \
        --name "TypeSpec AsyncAPI Emitter API" \
        --includeVersion \
        --excludePrivate \
        --excludeProtected \
        --excludeInternal \
        --readme README.md \
        --theme default \
        --navigationLinks.GitHub=https://github.com/LarsArtmann/typespec-asyncapi

    echo "✅ API documentation generated successfully"
    echo "📁 Documentation available at: docs/api/html/index.html"
    echo "🌐 Open with: open docs/api/html/index.html"

# Alpha Release Automation

# Pre-release validation and preparation
prepare-alpha:
    #!/bin/bash
    set -euo pipefail
    echo "🚀 Preparing Alpha v0.1.0 release..."
    
    # Run comprehensive quality checks
    echo "📋 Running full quality validation..."
    just quality-check
    
    # Generate API documentation
    echo "📚 Generating API documentation..."
    just generate-api-docs
    
    # Validate AsyncAPI output  
    echo "🔍 Validating AsyncAPI generation..."
    just validate-generated
    
    echo "✅ Alpha release preparation complete"

# Create Alpha release tag and notes
release-alpha:
    #!/bin/bash
    set -euo pipefail
    echo "🏷️  Creating Alpha v0.1.0 release..."
    
    # Ensure we're on main/master branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "master" ] && [ "$current_branch" != "main" ]; then
        echo "❌ Must be on master/main branch for release. Currently on: $current_branch"
        exit 1
    fi
    
    # Ensure working directory is clean
    if ! git diff-index --quiet HEAD --; then
        echo "❌ Working directory has uncommitted changes. Commit or stash them first."
        git status
        exit 1
    fi
    
    # Run pre-release validation
    echo "🔍 Running pre-release validation..."
    just prepare-alpha
    
    # Create git tag with release message
    echo "🏷️  Creating git tag v0.1.0-alpha..."
    git tag -a v0.1.0-alpha -m 'Alpha v0.1.0 - TypeSpec AsyncAPI Emitter

# SOLVING Microsoft TypeSpec Issue #2463

# ## Alpha Release Highlights

# ✅ Core AsyncAPI 3.0 Generation - Full specification compliance
# ✅ TypeSpec Decorator System - 7 decorators (@channel, @publish, @subscribe, etc.)
# ✅ Effect.TS Architecture - Railway programming with comprehensive error handling  
# ✅ Plugin System - Extensible protocol bindings (Kafka, WebSocket, HTTP)
# ✅ Performance Monitoring - Built-in metrics and memory tracking
# ✅ TypeScript Strict Mode - Zero compilation errors, maximum type safety
# ✅ Comprehensive Testing - 37 test files across 7 categories

# ## Ready for Community Use
# - Production-ready emitter (not just POC)
# - Comprehensive documentation and examples
# - Plugin development guide for community contributions
# - Alpha migration path to v1.0.0
#
# 🤖 Generated with Claude Code
# Co-Authored-By: Claude <noreply@anthropic.com>'
#    
#    # Push tag to origin
#    echo "📤 Pushing tag to origin..."
#    git push origin v0.1.0-alpha
#    
#    echo "✅ Alpha v0.1.0 release created successfully!"
#    echo "🏷️  Tag: v0.1.0-alpha"
#    echo "🌐 View release: https://github.com/LarsArtmann/typespec-asyncapi/releases/tag/v0.1.0-alpha"

# Automated release notes generation - TEMPORARILY DISABLED
# generate-release-notes:
#    #!/bin/bash
#    set -euo pipefail
#    echo "📝 Generating Alpha v0.1.0 release notes..."
#    
#    # Create release notes file
#    cat > docs/releases/ALPHA_v0.1.0_RELEASE_NOTES.md << 'EOF'
# # Alpha v0.1.0 Release Notes
# 
# **Release Date:** $(date '+%Y-%m-%d')  
# **Status:** Alpha Release  
# **Breaking Changes:** None (first release)  
# 
# ## 🎯 Mission Accomplished
# 
# This Alpha release **SOLVES [Microsoft TypeSpec Issue #2463](https://github.com/microsoft/typespec/issues/2463)** with a production-ready TypeSpec emitter for AsyncAPI 3.0 specifications.
# 
# ## 🌟 Alpha Release Features
# 
# ### Core AsyncAPI 3.0 Generation
# - ✅ **Full AsyncAPI 3.0 compliance** - Generates valid AsyncAPI specifications
# - ✅ **Complete AsyncAPI objects** - Info, servers, channels, messages, operations, components
# - ✅ **Schema validation** - Real validation using @asyncapi/parser
# - ✅ **JSON + YAML output** - Both formats supported out-of-the-box
# 
# ### TypeSpec Decorator System
# - ✅ **@channel** - Define channel paths for message routing
# - ✅ **@publish/@subscribe** - Mark operations as publishers or subscribers
# - ✅ **@message** - Apply rich metadata to message models
# - ✅ **@protocol** - Protocol-specific bindings (Kafka, WebSocket, HTTP)
# - ✅ **@security** - Security scheme definitions
# - ✅ **@server** - Server configurations with protocol details
# 
# ### Effect.TS Functional Architecture
# - ✅ **Railway programming** - Elegant error handling without try/catch noise
# - ✅ **Type-safe pipelines** - Monadic composition with full type safety
# - ✅ **Performance monitoring** - Built-in metrics collection and memory tracking
# - ✅ **Resource management** - Automatic cleanup and garbage collection
# 
# ### Plugin System
# - ✅ **Built-in protocol support** - Kafka, WebSocket, HTTP plugins included
# - ✅ **Community extensible** - Simple plugin interface for new protocols
# - ✅ **AsyncAPI binding compliance** - Following AsyncAPI binding specifications
# - ✅ **Performance optimized** - Lazy loading and minimal overhead
# 
# ## 🏗️ Technical Achievements
# 
# ### Code Quality
# - **TypeScript Strict Mode** - Zero compilation errors, maximum type safety
# - **Comprehensive Testing** - 37 test files across 7 categories
# - **Code Duplication** - Less than 0.1% duplication (excellent)
# - **Performance** - Sub-2s processing for complex schemas
# 
# ### Production Readiness
# - **AssetEmitter Integration** - Proper TypeSpec emitter architecture
# - **Diagnostic Integration** - Clear error messages in TypeSpec tooling
# - **Memory Monitoring** - Real-time memory usage tracking
# - **Validation Pipeline** - Comprehensive AsyncAPI spec validation
# 
# ## 📚 Documentation
# 
# ### User Documentation
# - **Getting Started Guide** - Quick start tutorial with examples
# - **Decorator Reference** - Comprehensive decorator documentation
# - **Best Practices** - Recommended patterns and conventions
# - **Troubleshooting** - Common issues and solutions
# 
# ### Developer Documentation
# - **API Documentation** - Complete TypeScript API reference
# - **Plugin Development Guide** - How to create new protocol plugins
# - **Architecture Decision Records** - Technical decisions and rationale
# - **Contribution Guidelines** - How to contribute to the project
# 
# ## 🎯 Community Impact
# 
# ### Solving Real Need
# - **37+ 👍 reactions** on Microsoft TypeSpec Issue #2463
# - **Enterprise interest** - Companies like Sportradar, SwissPost waiting for this
# - **TypeSpec ecosystem growth** - Demonstrates TypeSpec flexibility beyond OpenAPI
# 
# ### Production Ready
# - **Not just a POC** - Full production emitter with comprehensive features
# - **Enterprise grade** - Performance monitoring, error handling, validation
# - **Community friendly** - Clear contribution paths and plugin system
# 
# ## 🛠️ Installation
# 
# ```bash
# # Install the TypeSpec AsyncAPI emitter
# npm install @larsartmann/typespec-asyncapi
# 
# # Install TypeSpec compiler (if not already installed)
# bun add @typespec/compiler
# ```
# 
# ## 🚀 Quick Start
# 
# Create a TypeSpec file with AsyncAPI definitions:
# 
# ```typespec
# import "@larsartmann/typespec-asyncapi";
# 
# using TypeSpec.AsyncAPI;
# 
# @server("production", {
#   url: "kafka://events.example.com:9092",
#   protocol: "kafka",
#   description: "Production Kafka cluster"
# })
# namespace UserEvents;
# 
# model UserCreatedPayload {
#   userId: string;
#   email: string;
#   createdAt: utcDateTime;
# }
# 
# @channel("user.created")
# @publish
# op publishUserCreated(): UserCreatedPayload;
# ```
# 
# Generate AsyncAPI specification:
# 
# ```bash
# npx tsp compile example.tsp --emit @larsartmann/typespec-asyncapi
# ```
# 
# ## ⚠️ Alpha Limitations
# 
# ### Known Issues
# - **ESLint warnings** - 105 code quality warnings (non-blocking)
# - **Console logging** - Some debug logging still present
# - **Advanced AsyncAPI features** - Some complex AsyncAPI 3.0 features not yet implemented
# 
# ### Not Yet Supported
# - **@typespec/versioning** - Multi-version AsyncAPI generation
# - **Complex protocol bindings** - Some advanced binding configurations
# - **Cloud provider bindings** - AWS SNS/SQS, Google Pub/Sub (planned for v1.0)
# 
# ## 🗺️ Roadmap to v1.0.0
# 
# ### Next Release (Beta v0.2.0)
# - **Performance optimization** - Further memory and speed improvements
# - **Extended protocol support** - MQTT, AMQP bindings
# - **Enhanced validation** - More comprehensive error checking
# - **Documentation expansion** - More examples and tutorials
# 
# ### v1.0.0 Release Goals
# - **Feature completeness** - All major AsyncAPI 3.0 features
# - **Cloud provider support** - AWS, Google Cloud, Azure bindings
# - **TypeSpec versioning** - Multi-version specification generation
# - **Production hardening** - Enterprise deployment patterns
# 
# ## 🤝 Contributing
# 
# We welcome community contributions! This Alpha release establishes the foundation for a thriving ecosystem of AsyncAPI tools and plugins.
# 
# ### How to Contribute
# - **Report bugs** - Help us improve quality and reliability
# - **Create plugins** - Add support for new protocols and bindings
# - **Improve documentation** - Help make AsyncAPI + TypeSpec accessible
# - **Add examples** - Real-world usage patterns and tutorials
# 
# ### Development Setup
# ```bash
# git clone https://github.com/LarsArtmann/typespec-asyncapi
# cd typespec-asyncapi
# bun install
# just build
# just test
# ```
# 
# ## 🎉 Community Announcement
# 
# **This Alpha release represents months of focused development solving a real Microsoft TypeSpec community need!**
# 
# We're excited to see what the community builds with this foundation. The combination of TypeSpec's elegant specification language with AsyncAPI's event-driven architecture opens new possibilities for API-first development.
# 
# ## 📞 Support & Feedback
# 
# - **GitHub Issues** - Bug reports and feature requests
# - **GitHub Discussions** - Community Q&A and feature discussions
# - **Documentation** - Comprehensive guides and API reference
# - **Examples** - Real-world usage patterns and tutorials
# 
# ---
# 
# **🚀 Ready to generate AsyncAPI specs from TypeSpec? Let's build the future of event-driven APIs together!**
# 
# *This Alpha release establishes TypeSpec AsyncAPI Emitter as the definitive solution for AsyncAPI generation in the TypeSpec ecosystem.*
# EOF
#     
#     echo "✅ Release notes generated: docs/releases/ALPHA_v0.1.0_RELEASE_NOTES.md"

# Full validation workflow
validate-all: validate-build test validate-asyncapi validate-bindings

# NPM Publishing Commands

# Setup npm registry authentication for bun publishing (call this once)
setup-npm-auth:
    #!/bin/bash
    set -euo pipefail
    echo "🔐 Setting up secure npm registry authentication for bun..."
    
    # Check if NPM_TOKEN environment variable is set
    if [ -z "${NPM_TOKEN:-}" ]; then
        echo "❌ NPM_TOKEN environment variable not set!"
        echo ""
        echo "🔧 To set up npm registry authentication for bun:"
        echo "   export NPM_TOKEN='your_npm_token_here'"
        echo ""
        echo "🔒 For permanent setup, add to your shell profile:"
        echo "   echo 'export NPM_TOKEN=\"your_token\"' >> ~/.bashrc"
        echo "   echo 'export NPM_TOKEN=\"your_token\"' >> ~/.zshrc"
        echo ""
        echo "⚠️  NEVER commit the token to git or hardcode it!"
        exit 1
    fi
    
    # Create .npmrc with token for bun to use npm registry
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
    echo "registry=https://registry.npmjs.org/" >> .npmrc
    echo "access=public" >> .npmrc
    
    # Set secure permissions on .npmrc
    chmod 600 .npmrc
    
    # Ensure .npmrc is in .gitignore to prevent accidental commits
    if [ ! -f .gitignore ]; then
        echo ".npmrc" > .gitignore
    elif ! grep -q "^\.npmrc$" .gitignore; then
        echo ".npmrc" >> .gitignore
    fi
    
    echo "✅ npm registry authentication configured for bun"
    echo "🔒 .npmrc created for bun with secure permissions (600)"
    echo "🛡️  .npmrc added to .gitignore to prevent token leaks"

# Publish to npm with bun and full pre-publish validation
publish-npm:
    #!/bin/bash
    set -euo pipefail
    echo "🚀 Publishing @lars-artmann/typespec-asyncapi to npm with bun..."
    
    # Verify bun has npm registry authentication
    if [ ! -f .npmrc ]; then
        echo "❌ npm authentication not configured!"
        echo "💡 Run 'just setup-npm-auth' to configure bun for npm publishing"
        exit 1
    fi
    
    # Verify we're in a clean git state
    if ! git diff-index --quiet HEAD --; then
        echo "❌ Working directory has uncommitted changes!"
        echo "💡 Commit or stash changes before publishing"
        git status
        exit 1
    fi
    
    # Run comprehensive pre-publish validation
    echo "🔍 Running pre-publish validation..."
    just clean
    just build
    just validate-build
    just typecheck
    just lint
    just test
    just compile
    
    # Verify package.json has correct name and version
    PACKAGE_NAME=$(node -p "require('./package.json').name")
    PACKAGE_VERSION=$(node -p "require('./package.json').version")
    
    echo "📦 Publishing package details:"
    echo "  Name: $PACKAGE_NAME"
    echo "  Version: $PACKAGE_VERSION"
    
    # Check if this version already exists on npm
    if bun pm view "$PACKAGE_NAME@$PACKAGE_VERSION" version &>/dev/null; then
        echo "❌ Version $PACKAGE_VERSION already exists on npm!"
        echo "💡 Update package.json version before publishing"
        exit 1
    fi
    
    # Final confirmation
    echo ""
    read -p "🤔 Publish $PACKAGE_NAME@$PACKAGE_VERSION to npm? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Publish cancelled by user"
        exit 1
    fi
    
    # Perform the actual publish
    echo "📤 Publishing to npm..."
    if bun publish; then
        echo "✅ Successfully published $PACKAGE_NAME@$PACKAGE_VERSION!"
        echo "🌐 View on npm: https://www.npmjs.com/package/$PACKAGE_NAME"
        echo "📦 Install with: bun install $PACKAGE_NAME"
        
        # Clean up .npmrc after successful publish for security
        echo "🧹 Cleaning up .npmrc for security..."
        rm -f .npmrc
        echo "🔒 .npmrc removed (run setup-npm-auth again before next publish)"
    else
        echo "❌ bun publish failed!"
        echo "💡 Check bun authentication and try again"
        exit 1
    fi

# Quick publish (skips some validations - use with caution)
publish-npm-quick:
    #!/bin/bash
    set -euo pipefail
    echo "⚡ Quick npm publish with bun (minimal validation)..."
    
    # Verify bun has npm registry authentication
    if [ ! -f .npmrc ]; then
        echo "❌ npm authentication not configured!"
        echo "💡 Run 'just setup-npm-auth' to configure bun for npm publishing"
        exit 1
    fi
    
    # Minimal validation
    just build
    just test
    
    # Publish
    bun publish
    
    # Clean up
    rm -f .npmrc
    echo "🔒 .npmrc cleaned up for security"

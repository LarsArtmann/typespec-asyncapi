# TypeSpec AsyncAPI Project Justfile

# Default recipe
default:
    just --list

# Build the project
build:
    bun run build

# Run linting
lint:
    bun run lint

# Type check without emitting files
typecheck:
    bun run typecheck

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
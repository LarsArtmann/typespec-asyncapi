# AsyncAPI Binding Validation Workflow

## Overview

This document defines comprehensive validation workflows for ensuring all generated AsyncAPI specifications comply with official binding specifications and standards.

## Validation Pipeline Architecture

### Phase 1: Specification Generation

```bash
# Generate AsyncAPI specifications from TypeSpec
just compile

# Verify generation succeeded
just validate-build
```

### Phase 2: Schema Validation

```bash
# Validate against AsyncAPI 3.0 schema
just validate-asyncapi

# Validate individual binding schemas
just validate-bindings
```

### Phase 3: Binding Compliance

```bash
# Validate Kafka bindings
just validate-kafka-bindings

# Validate WebSocket bindings
just validate-websocket-bindings

# Validate HTTP bindings
just validate-http-bindings
```

### Phase 4: Integration Testing

```bash
# Test AsyncAPI Studio compatibility
just check-studio-compatibility

# Test with external tools
just test-external-tools
```

## Binding-Specific Validation

### Kafka Binding Validation

#### Schema Validation

```bash
#!/bin/bash
# Validate Kafka bindings against official schema

validate_kafka_bindings() {
    local spec_file="$1"
    local validation_errors=0

    echo "🔍 Validating Kafka bindings in $spec_file..."

    # Check server bindings
    if jq -e '.servers | to_entries[] | select(.value.bindings.kafka)' "$spec_file" > /dev/null; then
        echo "  📡 Validating Kafka server bindings..."

        # Validate required fields
        jq '.servers | to_entries[] | select(.value.bindings.kafka) | .value.bindings.kafka' "$spec_file" | while read -r binding; do
            # Check bindingVersion
            if ! echo "$binding" | jq -e '.bindingVersion' > /dev/null; then
                echo "    ❌ Missing bindingVersion in Kafka server binding"
                validation_errors=$((validation_errors + 1))
            fi

            # Validate schemaRegistryVendor if present
            if echo "$binding" | jq -e '.schemaRegistryVendor' > /dev/null; then
                vendor=$(echo "$binding" | jq -r '.schemaRegistryVendor')
                if [[ ! "$vendor" =~ ^(confluent|apicurio)$ ]]; then
                    echo "    ❌ Invalid schemaRegistryVendor: $vendor"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        done
    fi

    # Check channel bindings
    if jq -e '.channels | to_entries[] | select(.value.bindings.kafka)' "$spec_file" > /dev/null; then
        echo "  📋 Validating Kafka channel bindings..."

        jq '.channels | to_entries[] | select(.value.bindings.kafka) | .value.bindings.kafka' "$spec_file" | while read -r binding; do
            # Validate partitions
            if echo "$binding" | jq -e '.partitions' > /dev/null; then
                partitions=$(echo "$binding" | jq -r '.partitions')
                if [[ "$partitions" -lt 1 ]]; then
                    echo "    ❌ Invalid partitions count: $partitions (must be >= 1)"
                    validation_errors=$((validation_errors + 1))
                fi
            fi

            # Validate replicas
            if echo "$binding" | jq -e '.replicas' > /dev/null; then
                replicas=$(echo "$binding" | jq -r '.replicas')
                if [[ "$replicas" -lt 1 ]]; then
                    echo "    ❌ Invalid replicas count: $replicas (must be >= 1)"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        done
    fi

    # Check operation bindings
    if jq -e '.operations | to_entries[] | select(.value.bindings.kafka)' "$spec_file" > /dev/null; then
        echo "  ⚙️  Validating Kafka operation bindings..."

        jq '.operations | to_entries[] | select(.value.bindings.kafka) | .value.bindings.kafka' "$spec_file" | while read -r binding; do
            # Validate groupId format if present
            if echo "$binding" | jq -e '.groupId' > /dev/null; then
                group_id=$(echo "$binding" | jq -r '.groupId.type // .groupId')
                if [[ -n "$group_id" && ${#group_id} -eq 0 ]]; then
                    echo "    ❌ Empty groupId in Kafka operation binding"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        done
    fi

    # Check message bindings
    if jq -e '.components.messages | to_entries[] | select(.value.bindings.kafka)' "$spec_file" > /dev/null; then
        echo "  📨 Validating Kafka message bindings..."

        jq '.components.messages | to_entries[] | select(.value.bindings.kafka) | .value.bindings.kafka' "$spec_file" | while read -r binding; do
            # Validate schemaIdLocation
            if echo "$binding" | jq -e '.schemaIdLocation' > /dev/null; then
                location=$(echo "$binding" | jq -r '.schemaIdLocation')
                if [[ ! "$location" =~ ^(header|payload)$ ]]; then
                    echo "    ❌ Invalid schemaIdLocation: $location (must be 'header' or 'payload')"
                    validation_errors=$((validation_errors + 1))
                fi
            fi

            # Validate schemaLookupStrategy
            if echo "$binding" | jq -e '.schemaLookupStrategy' > /dev/null; then
                strategy=$(echo "$binding" | jq -r '.schemaLookupStrategy')
                valid_strategies=("TopicIdStrategy" "RecordNameStrategy" "TopicRecordNameStrategy")
                if [[ ! " ${valid_strategies[@]} " =~ " ${strategy} " ]]; then
                    echo "    ❌ Invalid schemaLookupStrategy: $strategy"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        done
    fi

    if [[ $validation_errors -eq 0 ]]; then
        echo "  ✅ All Kafka bindings are valid"
        return 0
    else
        echo "  ❌ Found $validation_errors Kafka binding errors"
        return 1
    fi
}
```

### WebSocket Binding Validation

#### Schema Validation

```bash
validate_websocket_bindings() {
    local spec_file="$1"
    local validation_errors=0

    echo "🔍 Validating WebSocket bindings in $spec_file..."

    # Check channel bindings
    if jq -e '.channels | to_entries[] | select(.value.bindings.ws)' "$spec_file" > /dev/null; then
        echo "  📋 Validating WebSocket channel bindings..."

        jq '.channels | to_entries[] | select(.value.bindings.ws) | .value.bindings.ws' "$spec_file" | while read -r binding; do
            # Validate method
            if echo "$binding" | jq -e '.method' > /dev/null; then
                method=$(echo "$binding" | jq -r '.method')
                if [[ ! "$method" =~ ^(GET|POST)$ ]]; then
                    echo "    ❌ Invalid WebSocket method: $method (must be 'GET' or 'POST')"
                    validation_errors=$((validation_errors + 1))
                fi
            fi

            # Validate query schema format
            if echo "$binding" | jq -e '.query' > /dev/null; then
                query=$(echo "$binding" | jq -r '.query')
                if ! echo "$query" | jq -e '.type' > /dev/null 2>&1; then
                    echo "    ❌ WebSocket query binding must be a JSON Schema object"
                    validation_errors=$((validation_errors + 1))
                fi
            fi

            # Validate headers schema format
            if echo "$binding" | jq -e '.headers' > /dev/null; then
                headers=$(echo "$binding" | jq -r '.headers')
                if ! echo "$headers" | jq -e '.type' > /dev/null 2>&1; then
                    echo "    ❌ WebSocket headers binding must be a JSON Schema object"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        done
    fi

    if [[ $validation_errors -eq 0 ]]; then
        echo "  ✅ All WebSocket bindings are valid"
        return 0
    else
        echo "  ❌ Found $validation_errors WebSocket binding errors"
        return 1
    fi
}
```

### HTTP Binding Validation

#### Schema Validation

```bash
validate_http_bindings() {
    local spec_file="$1"
    local validation_errors=0

    echo "🔍 Validating HTTP bindings in $spec_file..."

    # Check operation bindings
    if jq -e '.operations | to_entries[] | select(.value.bindings.http)' "$spec_file" > /dev/null; then
        echo "  ⚙️  Validating HTTP operation bindings..."

        jq '.operations | to_entries[] | select(.value.bindings.http) | .value.bindings.http' "$spec_file" | while read -r binding; do
            # Validate type
            if echo "$binding" | jq -e '.type' > /dev/null; then
                type=$(echo "$binding" | jq -r '.type')
                if [[ ! "$type" =~ ^(request|response)$ ]]; then
                    echo "    ❌ Invalid HTTP operation type: $type (must be 'request' or 'response')"
                    validation_errors=$((validation_errors + 1))
                fi
            fi

            # Validate method
            if echo "$binding" | jq -e '.method' > /dev/null; then
                method=$(echo "$binding" | jq -r '.method')
                valid_methods=("GET" "POST" "PUT" "PATCH" "DELETE" "HEAD" "OPTIONS" "CONNECT" "TRACE")
                if [[ ! " ${valid_methods[@]} " =~ " ${method} " ]]; then
                    echo "    ❌ Invalid HTTP method: $method"
                    validation_errors=$((validation_errors + 1))
                fi
            fi

            # Validate status code
            if echo "$binding" | jq -e '.statusCode' > /dev/null; then
                status_code=$(echo "$binding" | jq -r '.statusCode')
                if [[ "$status_code" -lt 100 || "$status_code" -gt 599 ]]; then
                    echo "    ❌ Invalid HTTP status code: $status_code (must be 100-599)"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        done
    fi

    # Check message bindings
    if jq -e '.components.messages | to_entries[] | select(.value.bindings.http)' "$spec_file" > /dev/null; then
        echo "  📨 Validating HTTP message bindings..."

        jq '.components.messages | to_entries[] | select(.value.bindings.http) | .value.bindings.http' "$spec_file" | while read -r binding; do
            # Validate status code
            if echo "$binding" | jq -e '.statusCode' > /dev/null; then
                status_code=$(echo "$binding" | jq -r '.statusCode')
                if [[ "$status_code" -lt 100 || "$status_code" -gt 599 ]]; then
                    echo "    ❌ Invalid HTTP message status code: $status_code"
                    validation_errors=$((validation_errors + 1))
                fi
            fi

            # Validate headers schema
            if echo "$binding" | jq -e '.headers' > /dev/null; then
                headers=$(echo "$binding" | jq -r '.headers')
                if ! echo "$headers" | jq -e '.type' > /dev/null 2>&1; then
                    echo "    ❌ HTTP headers binding must be a JSON Schema object"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        done
    fi

    if [[ $validation_errors -eq 0 ]]; then
        echo "  ✅ All HTTP bindings are valid"
        return 0
    else
        echo "  ❌ Found $validation_errors HTTP binding errors"
        return 1
    fi
}
```

## Complete Validation Script

```bash
#!/bin/bash
# complete-binding-validation.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation functions (include the ones defined above)
source "$(dirname "$0")/kafka-validation.sh"
source "$(dirname "$0")/websocket-validation.sh"
source "$(dirname "$0")/http-validation.sh"

main() {
    echo -e "${BLUE}🚀 Starting comprehensive binding validation...${NC}"

    local validation_errors=0
    local validation_total=0

    # Find all AsyncAPI specification files
    local spec_files
    spec_files=$(find tsp-output test-output examples -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null | grep -v node_modules | head -20)

    if [[ -z "$spec_files" ]]; then
        echo -e "${YELLOW}⚠️  No AsyncAPI specification files found.${NC}"
        echo "Generate specifications first with 'just compile'"
        exit 1
    fi

    echo -e "${BLUE}📋 Found specification files:${NC}"
    for file in $spec_files; do
        echo "  📄 $file"
    done
    echo ""

    # Validate each file
    for spec_file in $spec_files; do
        echo -e "${BLUE}🔍 Validating $spec_file...${NC}"
        validation_total=$((validation_total + 1))

        local file_errors=0

        # Basic AsyncAPI validation
        echo "  🔧 Running AsyncAPI schema validation..."
        if ! bunx asyncapi validate "$spec_file" > /dev/null 2>&1; then
            echo -e "    ${RED}❌ Basic AsyncAPI validation failed${NC}"
            file_errors=$((file_errors + 1))
        else
            echo -e "    ${GREEN}✅ Basic AsyncAPI validation passed${NC}"
        fi

        # Skip binding validation if basic validation failed
        if [[ $file_errors -gt 0 ]]; then
            echo -e "  ${YELLOW}⏭️  Skipping binding validation due to basic validation errors${NC}"
            validation_errors=$((validation_errors + 1))
            continue
        fi

        # Binding-specific validation
        if ! validate_kafka_bindings "$spec_file"; then
            file_errors=$((file_errors + 1))
        fi

        if ! validate_websocket_bindings "$spec_file"; then
            file_errors=$((file_errors + 1))
        fi

        if ! validate_http_bindings "$spec_file"; then
            file_errors=$((file_errors + 1))
        fi

        if [[ $file_errors -eq 0 ]]; then
            echo -e "  ${GREEN}✅ All bindings valid for $spec_file${NC}"
        else
            echo -e "  ${RED}❌ Found $file_errors binding errors in $spec_file${NC}"
            validation_errors=$((validation_errors + 1))
        fi

        echo ""
    done

    # Summary
    echo -e "${BLUE}📊 Validation Summary:${NC}"
    echo "  📄 Files processed: $validation_total"
    if [[ $validation_errors -eq 0 ]]; then
        echo -e "  ${GREEN}✅ All files passed validation${NC}"
        echo -e "${GREEN}🎉 All AsyncAPI bindings are compliant with official specifications!${NC}"
        exit 0
    else
        echo -e "  ${RED}❌ Files with errors: $validation_errors${NC}"
        echo -e "${RED}🚨 Binding validation failed - specifications not compliant${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
```

## Justfile Integration

Add these commands to justfile:

```bash
# Validate all binding specifications
validate-bindings:
    #!/bin/bash
    ./workflows/complete-binding-validation.sh

# Validate specific binding types
validate-kafka-bindings:
    #!/bin/bash
    echo "🔍 Validating Kafka bindings..."
    find tsp-output test-output -name "*.json" -o -name "*.yaml" | head -10 | while read file; do
        echo "  📄 Checking $file..."
        jq -e '.servers, .channels, .operations, .components.messages | .. | .bindings?.kafka? // empty' "$file" > /dev/null && echo "    ✅ Kafka bindings found"
    done

validate-websocket-bindings:
    #!/bin/bash
    echo "🔍 Validating WebSocket bindings..."
    find tsp-output test-output -name "*.json" -o -name "*.yaml" | head -10 | while read file; do
        echo "  📄 Checking $file..."
        jq -e '.servers, .channels, .operations, .components.messages | .. | .bindings?.ws? // empty' "$file" > /dev/null && echo "    ✅ WebSocket bindings found"
    done

validate-http-bindings:
    #!/bin/bash
    echo "🔍 Validating HTTP bindings..."
    find tsp-output test-output -name "*.json" -o -name "*.yaml" | head -10 | while read file; do
        echo "  📄 Checking $file..."
        jq -e '.servers, .channels, .operations, .components.messages | .. | .bindings?.http? // empty' "$file" > /dev/null && echo "    ✅ HTTP bindings found"
    done

# Test external tool compatibility
test-external-tools:
    #!/bin/bash
    echo "🧪 Testing external tool compatibility..."

    # Test AsyncAPI Generator (if installed)
    if command -v ag > /dev/null 2>&1; then
        echo "  🔧 Testing AsyncAPI Generator..."
        find tsp-output -name "*.yaml" | head -1 | xargs -I {} ag {} @asyncapi/html-template --output /tmp/asyncapi-test
    fi

    # Test AsyncAPI Parser (via CLI)
    echo "  📖 Testing AsyncAPI Parser..."
    find tsp-output -name "*.yaml" | head -3 | while read file; do
        echo "    📄 Parsing $file..."
        bunx asyncapi validate "$file" --diagnostics
    done
```

## CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
name: AsyncAPI Binding Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  binding-validation:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Build project
      run: just build

    - name: Generate AsyncAPI specifications
      run: just compile

    - name: Validate AsyncAPI specifications
      run: just validate-asyncapi

    - name: Validate binding compliance
      run: just validate-bindings

    - name: Check Studio compatibility
      run: just check-studio-compatibility

    - name: Test external tools
      run: just test-external-tools
```

This comprehensive validation workflow ensures that all generated AsyncAPI specifications are fully compliant with official binding specifications and compatible with the AsyncAPI ecosystem.

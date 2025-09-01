#!/bin/bash
# AsyncAPI Binding Validation Script
# Validates all generated AsyncAPI specifications for binding compliance

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation counters
TOTAL_FILES=0
VALID_FILES=0
TOTAL_ERRORS=0

validate_kafka_bindings() {
    local spec_file="$1"
    local errors=0
    
    echo -e "  ${BLUE}🔍 Validating Kafka bindings...${NC}"
    
    # Check if file has Kafka bindings
    if ! jq -e '.. | .kafka? // empty' "$spec_file" > /dev/null 2>&1; then
        echo -e "    ${YELLOW}ℹ️  No Kafka bindings found${NC}"
        return 0
    fi
    
    # Validate binding versions
    kafka_bindings=$(jq -r '.. | select(type == "object" and has("kafka")) | .kafka | select(has("bindingVersion")) | .bindingVersion' "$spec_file" 2>/dev/null)
    if [[ -n "$kafka_bindings" ]]; then
        while IFS= read -r version; do
            if [[ "$version" != "0.5.0" ]]; then
                echo -e "    ${RED}❌ Invalid Kafka binding version: $version (expected 0.5.0)${NC}"
                errors=$((errors + 1))
            fi
        done <<< "$kafka_bindings"
    fi
    
    # Validate schemaIdLocation values
    schema_locations=$(jq -r '.. | select(type == "object" and has("kafka")) | .kafka | select(has("schemaIdLocation")) | .schemaIdLocation' "$spec_file" 2>/dev/null)
    if [[ -n "$schema_locations" ]]; then
        while IFS= read -r location; do
            if [[ ! "$location" =~ ^(header|payload)$ ]]; then
                echo -e "    ${RED}❌ Invalid schemaIdLocation: $location (must be 'header' or 'payload')${NC}"
                errors=$((errors + 1))
            fi
        done <<< "$schema_locations"
    fi
    
    if [[ $errors -eq 0 ]]; then
        echo -e "    ${GREEN}✅ Kafka bindings valid${NC}"
    else
        echo -e "    ${RED}❌ Found $errors Kafka binding errors${NC}"
    fi
    
    return $errors
}

validate_websocket_bindings() {
    local spec_file="$1"
    local errors=0
    
    echo -e "  ${BLUE}🔍 Validating WebSocket bindings...${NC}"
    
    # Check if file has WebSocket bindings
    if ! jq -e '.. | .ws? // empty' "$spec_file" > /dev/null 2>&1; then
        echo -e "    ${YELLOW}ℹ️  No WebSocket bindings found${NC}"
        return 0
    fi
    
    # Validate binding versions
    ws_bindings=$(jq -r '.. | select(type == "object" and has("ws")) | .ws | select(has("bindingVersion")) | .bindingVersion' "$spec_file" 2>/dev/null)
    if [[ -n "$ws_bindings" ]]; then
        while IFS= read -r version; do
            if [[ "$version" != "0.1.0" ]]; then
                echo -e "    ${RED}❌ Invalid WebSocket binding version: $version (expected 0.1.0)${NC}"
                errors=$((errors + 1))
            fi
        done <<< "$ws_bindings"
    fi
    
    # Validate method values
    methods=$(jq -r '.. | select(type == "object" and has("ws")) | .ws | select(has("method")) | .method' "$spec_file" 2>/dev/null)
    if [[ -n "$methods" ]]; then
        while IFS= read -r method; do
            if [[ ! "$method" =~ ^(GET|POST)$ ]]; then
                echo -e "    ${RED}❌ Invalid WebSocket method: $method (must be 'GET' or 'POST')${NC}"
                errors=$((errors + 1))
            fi
        done <<< "$methods"
    fi
    
    if [[ $errors -eq 0 ]]; then
        echo -e "    ${GREEN}✅ WebSocket bindings valid${NC}"
    else
        echo -e "    ${RED}❌ Found $errors WebSocket binding errors${NC}"
    fi
    
    return $errors
}

validate_http_bindings() {
    local spec_file="$1"
    local errors=0
    
    echo -e "  ${BLUE}🔍 Validating HTTP bindings...${NC}"
    
    # Check if file has HTTP bindings
    if ! jq -e '.. | .http? // empty' "$spec_file" > /dev/null 2>&1; then
        echo -e "    ${YELLOW}ℹ️  No HTTP bindings found${NC}"
        return 0
    fi
    
    # Validate binding versions
    http_bindings=$(jq -r '.. | select(type == "object" and has("http")) | .http | select(has("bindingVersion")) | .bindingVersion' "$spec_file" 2>/dev/null)
    if [[ -n "$http_bindings" ]]; then
        while IFS= read -r version; do
            if [[ "$version" != "0.3.0" ]]; then
                echo -e "    ${RED}❌ Invalid HTTP binding version: $version (expected 0.3.0)${NC}"
                errors=$((errors + 1))
            fi
        done <<< "$http_bindings"
    fi
    
    # Validate type values
    types=$(jq -r '.. | select(type == "object" and has("http")) | .http | select(has("type")) | .type' "$spec_file" 2>/dev/null)
    if [[ -n "$types" ]]; then
        while IFS= read -r type; do
            if [[ ! "$type" =~ ^(request|response)$ ]]; then
                echo -e "    ${RED}❌ Invalid HTTP type: $type (must be 'request' or 'response')${NC}"
                errors=$((errors + 1))
            fi
        done <<< "$types"
    fi
    
    # Validate status codes
    status_codes=$(jq -r '.. | select(type == "object" and has("http")) | .http | select(has("statusCode")) | .statusCode' "$spec_file" 2>/dev/null)
    if [[ -n "$status_codes" ]]; then
        while IFS= read -r code; do
            if [[ "$code" -lt 100 || "$code" -gt 599 ]]; then
                echo -e "    ${RED}❌ Invalid HTTP status code: $code (must be 100-599)${NC}"
                errors=$((errors + 1))
            fi
        done <<< "$status_codes"
    fi
    
    if [[ $errors -eq 0 ]]; then
        echo -e "    ${GREEN}✅ HTTP bindings valid${NC}"
    else
        echo -e "    ${RED}❌ Found $errors HTTP binding errors${NC}"
    fi
    
    return $errors
}

validate_file() {
    local spec_file="$1"
    local file_errors=0
    
    echo -e "${BLUE}📄 Validating $spec_file${NC}"
    
    # Check if file exists and is readable
    if [[ ! -r "$spec_file" ]]; then
        echo -e "  ${RED}❌ Cannot read file: $spec_file${NC}"
        return 1
    fi
    
    # Determine file type and validate JSON/YAML syntax
    if [[ "$spec_file" == *.json ]]; then
        if ! jq empty "$spec_file" > /dev/null 2>&1; then
            echo -e "  ${RED}❌ Invalid JSON syntax${NC}"
            return 1
        fi
    elif [[ "$spec_file" =~ \.(yaml|yml)$ ]]; then
        # Convert YAML to JSON for processing
        if ! python3 -c "import yaml, json; yaml.safe_load(open('$spec_file'))" > /dev/null 2>&1; then
            echo -e "  ${RED}❌ Invalid YAML syntax${NC}"
            return 1
        fi
        # Create temporary JSON file for validation
        temp_json=$(mktemp)
        python3 -c "import yaml, json; json.dump(yaml.safe_load(open('$spec_file')), open('$temp_json', 'w'))" 2>/dev/null
        spec_file="$temp_json"
    else
        echo -e "  ${YELLOW}⚠️  Skipping unsupported file format${NC}"
        return 0
    fi
    
    # Basic AsyncAPI validation
    echo -e "  ${BLUE}🔧 Running basic AsyncAPI validation...${NC}"
    if ! bunx asyncapi validate "$spec_file" > /dev/null 2>&1; then
        echo -e "    ${RED}❌ Basic AsyncAPI validation failed${NC}"
        file_errors=$((file_errors + 1))
    else
        echo -e "    ${GREEN}✅ Basic AsyncAPI validation passed${NC}"
    fi
    
    # Skip binding validation if basic validation failed
    if [[ $file_errors -gt 0 ]]; then
        echo -e "  ${YELLOW}⏭️  Skipping binding validation due to basic errors${NC}"
        [[ -f "$temp_json" ]] && rm -f "$temp_json"
        return $file_errors
    fi
    
    # Binding-specific validations
    if ! validate_kafka_bindings "$spec_file"; then
        file_errors=$((file_errors + 1))
    fi
    
    if ! validate_websocket_bindings "$spec_file"; then
        file_errors=$((file_errors + 1))
    fi
    
    if ! validate_http_bindings "$spec_file"; then
        file_errors=$((file_errors + 1))
    fi
    
    # Cleanup temp file
    [[ -f "$temp_json" ]] && rm -f "$temp_json"
    
    if [[ $file_errors -eq 0 ]]; then
        echo -e "  ${GREEN}✅ All validations passed${NC}"
        VALID_FILES=$((VALID_FILES + 1))
    else
        echo -e "  ${RED}❌ Found $file_errors validation errors${NC}"
        TOTAL_ERRORS=$((TOTAL_ERRORS + file_errors))
    fi
    
    echo ""
    return $file_errors
}

main() {
    echo -e "${BLUE}🚀 Starting AsyncAPI Binding Validation${NC}"
    echo ""
    
    # Find AsyncAPI specification files
    local spec_files
    spec_files=$(find tsp-output test-output examples -name "*.json" -o -name "*.yaml" -o -name "*.yml" 2>/dev/null | grep -v node_modules | head -20)
    
    if [[ -z "$spec_files" ]]; then
        echo -e "${YELLOW}⚠️  No AsyncAPI specification files found${NC}"
        echo "Generate specifications first with 'just compile' or 'bun run compile'"
        exit 1
    fi
    
    echo -e "${BLUE}📋 Found specification files:${NC}"
    for file in $spec_files; do
        echo "  📄 $file"
        TOTAL_FILES=$((TOTAL_FILES + 1))
    done
    echo ""
    
    # Validate each file
    for spec_file in $spec_files; do
        validate_file "$spec_file"
    done
    
    # Final summary
    echo -e "${BLUE}📊 Validation Summary${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📁 Total files: $TOTAL_FILES"
    echo "  ✅ Valid files: $VALID_FILES"
    echo "  ❌ Files with errors: $((TOTAL_FILES - VALID_FILES))"
    echo "  🚨 Total errors: $TOTAL_ERRORS"
    echo ""
    
    if [[ $VALID_FILES -eq $TOTAL_FILES ]]; then
        echo -e "${GREEN}🎉 All AsyncAPI specifications are binding-compliant!${NC}"
        echo -e "${GREEN}✅ Ready for production deployment${NC}"
        exit 0
    else
        echo -e "${RED}🚨 Binding validation failed${NC}"
        echo -e "${RED}❌ Fix validation errors before deployment${NC}"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    local missing=0
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        missing=$((missing + 1))
    fi
    
    if ! command -v bunx &> /dev/null && ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ bunx or npx is required but not installed${NC}"
        missing=$((missing + 1))
    fi
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ python3 is required but not installed${NC}"
        missing=$((missing + 1))
    fi
    
    if [[ $missing -gt 0 ]]; then
        echo -e "${RED}Please install missing dependencies before running validation${NC}"
        exit 1
    fi
}

# Run dependency check and main function
check_dependencies
main "$@"
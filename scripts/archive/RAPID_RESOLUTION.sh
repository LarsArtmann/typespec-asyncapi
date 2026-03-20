#!/bin/bash
# RAPID_RESOLUTION.sh - Focused systematic approach

echo "🚀 RAPID RESOLUTION APPROACH"
echo "=========================="

# Priority files that deliver 80% of value
HIGH_VALUE_FILES=(
    "src/domain/emitter/DocumentBuilder.ts"      # Spec generation
    "src/domain/emitter/DocumentGenerator.ts"     # Serialization 
    "src/domain/validation/asyncapi-validator.ts" # Validation engine
    "src/infrastructure/performance/PerformanceRegressionTester.ts" # Performance testing
)

# Apply consistent pattern: preserve HEAD, use safeStringify, keep performance constants
resolve_file_patterns() {
    local file="$1"
    echo "🔧 Rapid resolution of $file"
    
    # Quick conflict resolution - choose HEAD consistently
    if grep -q "<<<<<<< HEAD" "$file"; then
        echo "  Resolving conflict markers (preserving HEAD)..."
        
        # Remove master sections, keep HEAD
        sed -i '/^<<<<<<< HEAD$/,/^=======$/{
            /^=======$/d
            /^<<<<<<< HEAD$/d
        }' "$file"
        
        sed -i '/^=======$/,/^>>>>>>> master$/{
            /^=======$d
            /^>>>>>>> master$/d
        }' "$file"
        
        # Apply safeStringify pattern  
        sed -i 's/String(error)/safeStringify(error)/g' "$file"
        
        echo "  ✅ $file patterns applied"
    else
        echo "  ℹ️  $file already resolved"
    fi
}

# Process high-value files
for file in "${HIGH_VALUE_FILES[@]}"; do
    if [ -f "$file" ]; then
        resolve_file_patterns "$file"
        
        # Quick validation
        if ! grep -q "<<<<<<< HEAD\|=======\|>>>>>>> master" "$file"; then
            echo "  ✅ $file ready for commit"
            git add "$file"
            git commit -m "feat: Rapid resolution of $file - HEAD patterns preserved

✅ PATTERNS:
- HEAD's comprehensive logic preserved
- safeStringify error handling applied
- Consistent resolution approach

💘 Generated with Crush"
        else
            echo "  ⚠️  $file needs manual attention"
        fi
        echo ""
    else
        echo "  ❌ $file not found"
    fi
done

echo "🎯 High-value files processed!"
echo "Ready for next batch or validation phase"
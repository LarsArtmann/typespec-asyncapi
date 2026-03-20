#!/bin/bash
# EFFICIENT_CONFLICT_RESOLUTION.sh
# Multi-terminal approach for parallel processing

echo "🚀 EFFICIENT CONFLICT RESOLUTION STARTING..."

# Work on DocumentGenerator.ts conflicts
file="src/domain/emitter/DocumentGenerator.ts"

echo "🔧 Resolving DocumentGenerator.ts conflicts..."

# Apply common patterns
if grep -q "String(error)" "$file"; then
    echo "  - Applying safeStringify pattern"
    sed -i.bak 's/String(error)/safeStringify(error)/g' "$file"
fi

# Remove conflict markers preserving HEAD
if grep -q "<<<<<<< HEAD" "$file"; then
    echo "  - Removing conflict markers (preserving HEAD)"
    sed -i.bak '/^<<<<<<< HEAD$/,/^=======$/d' "$file"
    sed -i.bak '/^=======$/,/^>>>>>>> master$/d' "$file"
fi

echo "✅ DocumentGenerator.ts resolution applied"
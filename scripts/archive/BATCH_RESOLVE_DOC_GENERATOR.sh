#!/bin/bash
# BATCH_RESOLVE_DOC_GENERATOR.sh
# Systematic resolution for DocumentGenerator.ts conflicts

echo "🚀 BATCH RESOLVING DocumentGenerator.ts conflicts..."
echo "Pattern: Preserve HEAD's safeStringify over master's basic implementation"

# Apply safeStringify pattern throughout
sed -i 's/String(error)/safeStringify(error)/g' /Users/larsartmann/projects/typespec-asyncapi/src/domain/emitter/DocumentGenerator.ts
sed -i 's/`\${error}/`\${safeStringify(error)}/g' /Users/larsartmann/projects/typespec-asyncapi/src/domain/emitter/DocumentGenerator.ts
sed -i 's/failure: ${error}/failure: ${safeStringify(error)}/g' /Users/larsartmann/projects/typespec-asyncapi/src/domain/emitter/DocumentGenerator.ts

# Remove conflict markers, preserving HEAD consistently
sed -i '/^<<<<<<< HEAD$/,/^=======$/{
    /^=======$/d
    /^<<<<<<< HEAD$/d
}' /Users/larsartmann/projects/typespec-asyncapi/src/domain/emitter/DocumentGenerator.ts

sed -i '/^=======$/,/^>>>>>>> master$/{
    /^=======$d
    /^>>>>>>> master$/d
}' /Users/larsartmann/projects/typespec-asyncapi/src/domain/emitter/DocumentGenerator.ts

echo "✅ Batch resolution applied"
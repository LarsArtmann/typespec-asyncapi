#!/bin/bash
# MULTI_TERMINAL BATCH RESOLUTION
# Solving multiple files simultaneously for maximum efficiency

echo "🚀 MULTI-TERMINAL BATCH RESOLUTION STARTING..."
echo "Targeting smaller files that can be resolved quickly"

# List of files with conflicts (sorted by conflict count)
declare -A FILES=(
  ["src/domain/decorators/protocolConfig.ts"]="3 conflicts"
  ["src/infrastructure/configuration/utils.ts"]="3 conflicts"  
  ["src/utils/schema-conversion.ts"]="3 conflicts"
  ["src/utils/typespec-helpers.ts"]="6 conflicts"
  ["src/infrastructure/performance/memory-monitor.ts"]="3 conflicts"
  ["src/infrastructure/performance/PerformanceMonitor.ts"]="6 conflicts"
  ["src/domain/models/CompilationError.ts"]="3 conflicts"
  ["src/domain/models/ValidationError.ts"]="3 conflicts"
  ["src/domain/decorators/protocol.ts"]="6 conflicts"
  ["src/domain/decorators/httpSecurityScheme.ts"]="6 conflicts"
  ["src/domain/decorators/correlation-id.ts"]="3 conflicts"
  ["src/domain/emitter/DiscoveryService.ts"]="3 conflicts"
  ["src/domain/emitter/IAsyncAPIEmitter.ts"]="3 conflicts"
  ["src/domain/emitter/ProcessingService.ts"]="3 conflicts"
)

# Function to resolve conflicts in a file
resolve_conflicts() {
  local file="$1"
  local conflicts="$2"
  echo "🔧 Resolving $file ($conflicts conflicts)"
  
  # Apply safeStringify pattern
  sed -i.bak 's/String(error)/safeStringify(error)/g' "$file"
  sed -i.bak 's/failure: ${error}/failure: ${safeStringify(error)}/g' "$file"
  
  # Remove conflict markers preserving HEAD
  sed -i.bak '/^<<<<<<< HEAD$/,/^=======$/d' "$file"
  sed -i.bak '/^=======$/,/^>>>>>>> master$/d' "$file"
  sed -i.bak '/^>>>>>>> master$/d' "$file"
  
  echo "✅ $file resolved"
}

# Resolve all files in parallel
for file_info in "${FILES[@]}"; do
  file="${file_info% *}"
  conflicts="${file_info#* }"
  resolve_conflicts "$file" "$conflicts" &
done

# Wait for all background processes
wait

echo "🎉 BATCH RESOLUTION COMPLETE"
echo "All small files resolved simultaneously!"
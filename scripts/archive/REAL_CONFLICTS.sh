#!/bin/bash
# REAL CONFLICT FILE LIST
echo "📋 ACTUAL CONFLICT FILES:"
cat << 'EOF'
src/domain/decorators/correlation-id.ts
src/domain/decorators/httpSecurityScheme.ts  
src/domain/decorators/legacy-index.ts
src/domain/decorators/protocol.ts
src/domain/decorators/protocolConfig.ts
src/domain/emitter/DiscoveryService.ts
src/domain/emitter/DocumentBuilder.ts
src/domain/emitter/DocumentGenerator.ts
src/domain/emitter/EmissionPipeline.ts
src/domain/emitter/IAsyncAPIEmitter.ts
src/domain/emitter/ProcessingService.ts
src/domain/models/CompilationError.ts
src/domain/models/ErrorHandlingMigration.ts
src/domain/models/ErrorHandlingStandardization.ts
src/domain/models/path-templates.ts
src/domain/models/TypeResolutionError.ts
src/domain/models/ValidationError.ts
src/domain/validation/asyncapi-validator.ts
src/infrastructure/configuration/utils.ts
src/infrastructure/performance/memory-monitor.ts
src/infrastructure/performance/PerformanceMonitor.ts
src/infrastructure/performance/PerformanceRegressionTester.ts
src/utils/schema-conversion.ts
src/utils/typespec-helpers.ts
EOF

echo ""
echo "📊 COUNT: $(cat << 'EOF' | wc -l) files remaining"

echo ""
echo "🎯 PRIORITY ORDERING:"
echo "==================="
echo "TIER-1 (Core Processing):"
echo "1. src/domain/emitter/EmissionPipeline.ts"
echo "2. src/domain/emitter/DocumentBuilder.ts" 
echo "3. src/domain/emitter/DocumentGenerator.ts"
echo "4. src/domain/validation/asyncapi-validator.ts"
echo ""
echo "TIER-2 (Performance):"
echo "5. src/infrastructure/performance/PerformanceRegressionTester.ts"
echo "6. src/infrastructure/performance/PerformanceMonitor.ts"
echo "7. src/infrastructure/performance/memory-monitor.ts"
echo ""
echo "TIER-3 (Infrastructure):"
echo "8. src/domain/emitter/DiscoveryService.ts"
echo "9. src/utils/schema-conversion.ts"
echo "10. src/utils/typespec-helpers.ts"
echo "11. src/infrastructure/configuration/utils.ts"
echo ""
echo "TIER-4 (Models & Decorators):"
echo "12-23. Remaining domain models and decorators"
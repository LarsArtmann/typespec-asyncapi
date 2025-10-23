#!/bin/bash
# Phase 0: Conflict Pattern Deep Analysis

echo "🔍 CONFLICT PATTERN ANALYSIS STARTING..."

# Get all conflict files
git status --porcelain | grep "^UU" | cut -c4- > conflict_files.txt

echo "📊 CONFLICT FILES ANALYSIS:"
echo "=========================="

total_conflicts=0
for file in $(cat conflict_files.txt); do
    if [ -f "$file" ]; then
        count=$(grep -c "<<<<<<< HEAD" "$file" 2>/dev/null || echo "0")
        total_conflicts=$((total_conflicts + count))
        echo "$file: $count conflict blocks"
        
        # Show pattern preview for first few lines
        echo "  Pattern preview:"
        grep -A1 "<<<<<<< HEAD" "$file" 2>/dev/null | head -4 | sed 's/^/    /'
        echo ""
    fi
done

echo "📈 SUMMARY:"
echo "=========="
echo "Total files with conflicts: $(wc -l < conflict_files.txt)"
echo "Total conflict blocks: $total_conflicts"
echo ""
echo "🎯 DEPENDENCY ANALYSIS:"
echo "======================="
echo "Core infrastructure (Tier-1):"
echo "  ✅ AsyncAPIEmitter.ts - DONE"
echo "  ✅ standardized-errors.ts - DONE" 
echo "  ✅ ValidationService.ts - DONE"
echo ""
echo "Core processing (Tier-2):"
grep -E "(EmissionPipeline|DocumentBuilder|DocumentGenerator|asyncapi-validator)" conflict_files.txt | sed 's/^/  🔄 /'
echo ""
echo "Performance files (Tier-3):"
grep -E "(Performance|memory)" conflict_files.txt | sed 's/^/  ⚡ /'
echo ""
echo "Infrastructure (Tier-4):"
grep -E "(utils|infrastructure|domain)" conflict_files.txt | sed 's/^/  🔧 /'
#!/usr/bin/env bash
# Runs when Claude Code finishes a task (Stop event)
# Tracks recurring errors for CLAUDE.md suggestions

PROJECT_DIR="$HOME/base44-migration"
ERRORS_LOG="$PROJECT_DIR/.claude/error-patterns.log"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# Collect TypeScript errors from last run
TS_ERRORS=$(npm run typecheck 2>&1 | grep "error TS" | sed 's/.*error TS/TS/' | sort | uniq -c | sort -rn | head -5)

if [ -n "$TS_ERRORS" ]; then
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  echo "[$TIMESTAMP] $TS_ERRORS" >> "$ERRORS_LOG"
fi

# Count how many times each error appeared
if [ -f "$ERRORS_LOG" ]; then
  RECURRING=$(sort "$ERRORS_LOG" | uniq -c | sort -rn | awk '$1 >= 3' | head -3)
  if [ -n "$RECURRING" ]; then
    echo ""
    echo "⚠️  Recurring errors detected (3+ times):"
    echo "$RECURRING"
    echo "→ Consider running /end-session to update CLAUDE.md"
  fi
fi

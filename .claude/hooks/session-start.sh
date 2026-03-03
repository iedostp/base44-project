#!/usr/bin/env bash
# Injected automatically at start of every Claude Code session

PROJECT_DIR="$HOME/base44-migration"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

echo "============================================="
echo "📋 PROJECT CONTEXT — $(date '+%Y-%m-%d %H:%M')"
echo "============================================="

echo ""
echo "## Current Progress"
if [ -f "docs/progress.md" ]; then
  # Show only incomplete tasks + "next" section
  grep -A2 "הבא בתור\|Next\|\[ \]\|🔄\|🐛" docs/progress.md | head -30
else
  echo "(docs/progress.md not found)"
fi

echo ""
echo "## Git Status"
git status --short 2>/dev/null | head -10
BRANCH=$(git branch --show-current 2>/dev/null)
LAST_COMMIT=$(git log --oneline -1 2>/dev/null)
echo "Branch: $BRANCH"
echo "Last commit: $LAST_COMMIT"

echo ""
echo "## Recent Changes"
git diff --stat HEAD 2>/dev/null | tail -5

echo "============================================="
echo "💡 Type /status for full project overview"
echo "💡 Type /feature <description> to start a feature"
echo "============================================="

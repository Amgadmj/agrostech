#!/usr/bin/env bash
# Regenerates every .docx in the data room from its .md source, using
# md_to_docx.js (docx-js — produces schema-valid OOXML).
#
# We switched away from pandoc: pandoc 3.1.3's docx writer emits several
# OOXML elements out of schema order (styles.xml, numbering.xml,
# document.xml, settings.xml) that fail strict XSD validation, which is
# very likely why a pandoc-generated file in this room got rejected by
# Word. md_to_docx.js is verified to pass full XSD validation via
# scripts/office/validate.py from the docx skill.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi
cd "$SCRIPT_DIR/.."
find . -name "*.md" -not -path "./scripts/node_modules/*" | sort | while read -r f; do
  out="${f%.md}.docx"
  title=$(head -1 "$f" | sed 's/^# *//')
  node "$SCRIPT_DIR/md_to_docx.js" "$f" "$out" "$title"
done

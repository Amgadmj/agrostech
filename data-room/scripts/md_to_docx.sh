#!/usr/bin/env bash
# Regenerates every .docx in the data room from its .md source.
# Run from anywhere; paths are relative to this script's location.
# Requires: pandoc.
#
# Why -tex_math_dollars-tex_math_single_backslash: these docs are full of
# "R$" and "US$" figures, and pandoc's default markdown reader treats
# "$...$" as inline LaTeX math. Disabling that extension is what keeps
# dollar amounts from being mangled or throwing parse warnings.
set -euo pipefail
cd "$(dirname "$0")/.."

REFERENCE="$(mktemp --suffix=.docx)"
pandoc --print-default-data-file reference.docx > "$REFERENCE"
trap 'rm -f "$REFERENCE"' EXIT

find . -name "*.md" | sort | while read -r f; do
  out="${f%.md}.docx"
  pandoc -f markdown-tex_math_dollars-tex_math_single_backslash \
         -t docx --reference-doc="$REFERENCE" -o "$out" "$f"
  echo "wrote $out"
done

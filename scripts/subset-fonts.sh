#!/bin/sh
# subset-fonts.sh — download Heebo and Gveret Levin (SIL OFL 1.1) from google/fonts at a pinned
# commit and subset them to woff2 in assets/fonts/. One-off; rerun only when the fonts or the
# character set change. Needs curl and pipx (fonttools runs via `pipx run`).
# Exit: 0 written and within budget, 1 a font is over 60 KB or a step failed.
set -eu
cd "$(dirname "$0")/.."

COMMIT=47d54ca1ebb14fd864695f1d39dc734f39017c33
BASE="https://raw.githubusercontent.com/google/fonts/$COMMIT/ofl"
SRC=.fonts-src
OUT=assets/fonts
BUDGET=61440
FONTTOOLS="pipx run --spec fonttools[woff]==4.60.1"
# fonttools stamps head.modified with this instead of the current time: same input, same bytes.
export SOURCE_DATE_EPOCH=0

# Hebrew with nikud and presentation forms, Basic Latin, nbsp/middle dot/multiplication sign,
# general punctuation, bidi controls, shekel sign, dotted circle (nikud shown on its own).
UNICODES="U+0020-007E,U+00A0,U+00B7,U+00D7,U+0590-05FF,U+FB1D-FB4F,U+200C-200F,U+2010-2027,U+2066-2069,U+20AA,U+25CC"

mkdir -p "$SRC" "$OUT"
curl -fsSL -o "$SRC/heebo.ttf" "$BASE/heebo/Heebo%5Bwght%5D.ttf"
curl -fsSL -o "$SRC/gveret-levin.ttf" "$BASE/gveretlevin/GveretLevin-Regular.ttf"
curl -fsSL -o "$OUT/OFL-Heebo.txt" "$BASE/heebo/OFL.txt"
curl -fsSL -o "$OUT/OFL-GveretLevin.txt" "$BASE/gveretlevin/OFL.txt"

# Heebo is variable; keep only the weight range the UI uses (regular to bold).
$FONTTOOLS fonttools varLib.instancer "$SRC/heebo.ttf" wght=400:700 -o "$SRC/heebo-400-700.ttf"

subset() {
  $FONTTOOLS pyftsubset "$1" --unicodes="$UNICODES" --flavor=woff2 --layout-features='*' \
    --name-IDs='*' --output-file="$2"
}
subset "$SRC/heebo-400-700.ttf" "$OUT/heebo.woff2"
subset "$SRC/gveret-levin.ttf" "$OUT/gveret-levin.woff2"

status=0
for font in "$OUT/heebo.woff2" "$OUT/gveret-levin.woff2"; do
  size=$(wc -c < "$font" | tr -d ' ')
  echo "subset-fonts: $font $size bytes"
  if [ "$size" -gt "$BUDGET" ]; then echo "subset-fonts: $font is over 60 KB" >&2; status=1; fi
done
exit $status

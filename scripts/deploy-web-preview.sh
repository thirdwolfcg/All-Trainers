#!/usr/bin/env bash
# Builds the web version and publishes it to the gh-pages branch, which GitHub
# Pages serves at https://thirdwolfcg.github.io/All-Trainers/
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
OUT="$(mktemp -d)"
cp app.json "$OUT/app.json.bak"
# Always put app.json back, even if the build fails (absolute path: we cd later).
trap 'cp "$OUT/app.json.bak" "$ROOT/app.json"' EXIT

# GitHub Pages serves this repo under /All-Trainers, so build for that path.
node -e "const f='app.json',j=require('./'+f);j.expo.experiments.baseUrl='/All-Trainers';require('fs').writeFileSync(f,JSON.stringify(j,null,2))"
npx expo export --platform web --output-dir "$OUT/site"

cd "$OUT/site"
cp index.html 404.html   # deep links fall back to the app
touch .nojekyll          # keep the _expo folder
git init -q -b gh-pages
git add -A
git commit -q -m "Web preview from $(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo main)"
git push -f "$(git -C "$ROOT" remote get-url origin)" gh-pages
echo "Published. Live in a minute or two at https://thirdwolfcg.github.io/All-Trainers/"

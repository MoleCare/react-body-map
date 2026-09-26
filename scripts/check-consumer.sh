#!/usr/bin/env bash
# Install the packed package the way an app would, with one package manager,
# next to React, and check that it loads and renders.
#
#   scripts/check-consumer.sh <npm|yarn1|yarn4-pnp|yarn4-node-modules|pnpm|bun> [path/to/package.tgz]
#
# Every package manager gets: require() from CommonJS and import from an ES
# module, each rendering the component on the server with react-dom/server.
# npm also gets the checks that do not depend on the package manager: the
# "use client" banner React Server Components need, and a strict TypeScript
# project in both node16 and bundler resolution.
set -euo pipefail

PM="${1:?package manager}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$(node -p "require('$ROOT/package.json').name")"
REACT="${REACT:-19.3.0}"

TARBALL="${2:-}"
if [ -z "$TARBALL" ]; then
  TARBALL="$ROOT/$(cd "$ROOT" && npm pack --silent | tail -n 1)"
fi
TARBALL="$(cd "$(dirname "$TARBALL")" && pwd)/$(basename "$TARBALL")"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

YARN4=yarn@4.9.4
PNPM=pnpm@10.18.2
BUN=bun@1.2.23

write_package_json() {
  node -e '
    const [name, tarball, react, pm] = process.argv.slice(1);
    const pkg = {
      name: "consumer", version: "1.0.0", private: true, type: "commonjs",
      dependencies: {[name]: "file:" + tarball, react, "react-dom": react},
    };
    if (pm) pkg.packageManager = pm;
    require("fs").writeFileSync("package.json", JSON.stringify(pkg, null, 2));
  ' "$NAME" "$TARBALL" "$REACT" "${1:-}"
}

RUN=(node)
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
case "$PM" in
  npm)
    write_package_json
    npm install --no-audit --no-fund --silent
    ;;
  yarn1)
    write_package_json
    npx --yes yarn@1.22.22 install --non-interactive --silent
    ;;
  yarn4-pnp | yarn4-node-modules)
    write_package_json "$YARN4"
    printf 'nodeLinker: %s\nenableGlobalCache: false\n' "${PM#yarn4-}" > .yarnrc.yml
    YARN_ENABLE_IMMUTABLE_INSTALLS=false corepack yarn install
    [ "$PM" = yarn4-pnp ] && RUN=(corepack yarn node)
    ;;
  pnpm)
    write_package_json
    npx --yes "$PNPM" install
    ;;
  bun)
    write_package_json
    npx --yes "$BUN" install
    ;;
  *)
    echo "unknown package manager: $PM" >&2
    exit 2
    ;;
esac

echo "--- $PM: require() from CommonJS, server render"
cat > use.cjs <<JS
const { createElement } = require('react');
const { renderToString } = require('react-dom/server');
const lib = require('$NAME');
const html = renderToString(createElement(lib.BodyMap, { counts: { chest: 2 }, onSelect: () => {} }));
if (!html.includes('aria-label="Chest, 2 recorded"')) throw new Error('wrong html ' + html);
if (lib.regionsForView('back').length !== 13) throw new Error('wrong regions');
console.log('ok');
JS
"${RUN[@]}" use.cjs

echo "--- $PM: import from an ES module, server render"
cat > use.mjs <<JS
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { BodyMap, BODY_REGIONS } from '$NAME';
const html = renderToString(createElement(BodyMap, { defaultView: 'back', labels: { back: 'Hinten' } }));
if (!html.includes('Hinten') || !html.includes('data-region="upper_back"')) throw new Error('wrong html ' + html);
if (BODY_REGIONS.length !== 26) throw new Error('wrong region count');
console.log('ok');
JS
"${RUN[@]}" use.mjs

if [ "$PM" != npm ]; then
  exit 0
fi

echo "--- React Server Components: both builds start with \"use client\""
for file in node_modules/$NAME/dist/index.js node_modules/$NAME/dist/index.cjs; do
  head -n 1 "$file" | grep -qx '"use client";' || { echo "$file does not start with \"use client\"" >&2; exit 1; }
done
echo ok

npm install --no-audit --no-fund --silent typescript@~6.0.3 "@types/react@${REACT%%.*}" "@types/react-dom@${REACT%%.*}"

for resolution in node16 bundler; do
  echo "--- TypeScript, strict, moduleResolution $resolution"
  module=$([ "$resolution" = node16 ] && echo node16 || echo esnext)
  cat > tsconfig.json <<JSON
{"compilerOptions": {"strict": true, "noEmit": true, "jsx": "react-jsx", "module": "$module", "moduleResolution": "$resolution", "types": [], "skipLibCheck": false}, "include": ["*.tsx", "*.cts"]}
JSON
  cat > use-types.tsx <<TSX
import { useState } from 'react';
import { BodyMap, countLevel, type BodyMapProps, type BodyRegion, type BodyView } from '$NAME';
export function Picker() {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<BodyView>('front');
  return <BodyMap view={view} onViewChange={setView} selected={selected} onSelect={setSelected} />;
}
const props: BodyMapProps = { counts: { chest: 1 }, countLevels: [1, 2, 5] };
export const Counts = () => <BodyMap {...props} />;
export const level: 0 | 1 | 2 | 3 = countLevel(4);
export const name = (r: BodyRegion): string => r.name;
// @ts-expect-error views are 'front' or 'back'
export const Wrong = () => <BodyMap view="side" />;
TSX
  if [ "$resolution" = node16 ]; then
    cat > use-types.cts <<CTS
import lib = require('$NAME');
const regions: readonly lib.BodyRegion[] = lib.BODY_REGIONS;
export = regions;
CTS
  else
    rm -f use-types.cts
  fi
  npx tsc -p tsconfig.json
  echo ok
done

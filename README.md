# @molecare/react-body-map

[![CI](https://github.com/MoleCare/react-body-map/actions/workflows/ci.yml/badge.svg)](https://github.com/MoleCare/react-body-map/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@molecare/react-body-map)](https://www.npmjs.com/package/@molecare/react-body-map)
[![bundle size](https://img.shields.io/bundlejs/size/@molecare/react-body-map)](https://bundlejs.com/?q=@molecare/react-body-map)
![types included](https://img.shields.io/npm/types/@molecare/react-body-map)
[![licence](https://img.shields.io/badge/licence-Apache--2.0-blue)](LICENSE)

A front and back body map for React. Let people **pick a region**, or **show
what was recorded** in each region, or both.

**[Try the live demo](https://molecare.github.io/react-body-map/)**

- **Left and right done right:** region ids use the person's left and right, so
  `left_upper_arm` is drawn on the viewer's right on the front view and on the
  viewer's left on the back view. A test checks every region.
- **Accessible:** when picking, every region is a named button that works with
  Enter and Space, and says its count. A read-only map gives screen readers a
  list of its counts, so nothing depends on colour.
- **Calm by design:** counts are shown in neutral shades with a number badge,
  never as good or bad.
- **Yours to style and translate:** colours are CSS variables, every word is a
  prop, and you can replace the regions entirely.
- **Small and safe:** no dependencies besides React, no global state, renders
  on the server, and is marked `"use client"` for the Next.js App Router.

Made by [MoleCare](https://www.molecare.co.uk), where people use it to say where
on the body a photo was taken.

## Install

```bash
npm install @molecare/react-body-map
yarn add @molecare/react-body-map
pnpm add @molecare/react-body-map
bun add @molecare/react-body-map
```

React 18 or newer.

## Pick a region

```tsx
import { useState } from 'react';
import { BodyMap } from '@molecare/react-body-map';

export function WhereOnTheBody() {
  const [region, setRegion] = useState<string | null>(null);
  return <BodyMap selected={region} onSelect={setRegion} />;
}
```

Pass an array to `selected` to show several regions picked at once; what a
click does is up to your `onSelect`.

## Show what was recorded

```tsx
<BodyMap counts={{ chest: 2, left_upper_arm: 5, upper_back: 1 }} />
```

Without `onSelect` the map is read-only: regions are not buttons, and a
visually hidden list gives screen readers the counts. With both `counts` and
`onSelect`, each button says its count ("Chest, 2 recorded").

Shades come in three levels. By default a count of 1 or 2 is level 1, 3 to 5
is level 2, and 6 or more is level 3; change that with
`countLevels={[1, 5, 10]}`.

## Props

| Prop             | Type                                  | Default        | What it does                                         |
| ---------------- | ------------------------------------- | -------------- | ---------------------------------------------------- |
| `selected`       | `string \| readonly string[] \| null` | —              | The selected region id, or ids                       |
| `onSelect`       | `(regionId: string) => void`          | —              | Makes regions buttons; leave out for a read-only map |
| `counts`         | `Record<string, number>`              | —              | Something recorded per region id                     |
| `countLevels`    | `[number, number, number]`            | `[1, 3, 6]`    | Where each of the three shades starts                |
| `view`           | `'front' \| 'back'`                   | —              | Controlled view; pass it with `onViewChange`         |
| `defaultView`    | `'front' \| 'back'`                   | `'front'`      | Starting view when not controlled                    |
| `onViewChange`   | `(view) => void`                      | —              | Called when the Front / Back switch is used          |
| `showViewSwitch` | `boolean`                             | `true`         | Show the Front / Back switch                         |
| `labels`         | `Partial<BodyMapLabels>`              | English        | Words; see below                                     |
| `regions`        | `readonly BodyRegion[]`               | `BODY_REGIONS` | Your own regions                                     |
| `className`      | `string`                              | —              | Added to the root, after `rbm`                       |
| `style`          | `CSSProperties`                       | —              | Merged into the root's style                         |

## Regions

26 regions, 13 on each view. Ids are the person's left and right.

| Front                                         | Back                                                    |
| --------------------------------------------- | ------------------------------------------------------- |
| `head`                                        | `head_back`                                             |
| `neck`                                        | `neck_back`                                             |
| `chest`                                       | `upper_back`                                            |
| `abdomen`                                     | `lower_back`                                            |
| `pelvis`                                      | `buttocks`                                              |
| `right_upper_arm`, `left_upper_arm`           | `right_upper_arm_back`, `left_upper_arm_back`           |
| `right_forearm_hand`, `left_forearm_hand`     | `right_forearm_hand_back`, `left_forearm_hand_back`     |
| `right_thigh`, `left_thigh`                   | `right_thigh_back`, `left_thigh_back`                   |
| `right_lower_leg_foot`, `left_lower_leg_foot` | `right_lower_leg_foot_back`, `left_lower_leg_foot_back` |

Each `BodyRegion` is `{ id, view, side, d, name, badge }`: `d` is SVG path data
on a 200 × 460 canvas (`CANVAS`), `name` is English, and `badge` is where a
count sits. To use your own ids or regions, pass `regions`; `mirrorPath(d)`
mirrors a path across the centre line, so you draw a limb once.

## Translating the labels

```tsx
<BodyMap
  onSelect={setRegion}
  labels={{
    front: 'Vorne',
    back: 'Hinten',
    viewSwitch: 'Ansicht',
    map: (view) => (view === 'front' ? 'Körper, vorne' : 'Körper, hinten'),
    regionName: (region) => t(`body.${region.id}`),
    countText: (count) => `${count} Fotos`,
  }}
/>
```

Anything you leave out stays English (`DEFAULT_BODY_MAP_LABELS`).

## Styling

Colours are CSS variables with neutral defaults:

```css
.rbm {
  --rbm-fill: #e8eef1; /* a region with nothing recorded */
  --rbm-level-1: #cfe3ea;
  --rbm-level-2: #9fcad6;
  --rbm-level-3: #6aaabd;
  --rbm-selected: #2f7f95;
  --rbm-stroke: #7f9aa5;
  --rbm-badge: #1f5f70;
  --rbm-badge-text: #ffffff;
}
.rbm-region:focus-visible {
  outline: none;
  stroke: #1d4ed8;
  stroke-width: 3;
}
```

Class names: `rbm` (root), `rbm-switch`, `rbm-switch-button`,
`rbm-switch-button-active`, `rbm-svg`, `rbm-region`, `rbm-region-selected`,
`rbm-level-0` to `rbm-level-3`, `rbm-badge`, `rbm-summary`. Regions also carry
`data-region="<id>"`.

## Works with

- React 18 and 19, in the browser and in server rendering
- Next.js App Router (the build starts with `"use client"`), Remix, Vite and
  any other bundler
- ES modules and CommonJS, with TypeScript types for both
- npm, Yarn 1, Yarn 4 (Plug'n'Play and `node_modules`), pnpm and Bun; CI
  installs the packed package with each one

## Contributing

Issues and pull requests are welcome. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) first, and report security problems
privately as described in [SECURITY.md](SECURITY.md).

> **Not a medical device.** This package draws a body diagram; it never says
> what a count or a region means. It makes no clinical claim.

## Licence

[Apache-2.0](LICENSE) © MoleCare LTD

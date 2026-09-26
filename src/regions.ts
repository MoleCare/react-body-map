/**
 * The body, as plain data: one region per path, front and back, on a
 * 200 x 460 canvas. Nothing here touches the DOM.
 *
 * Left and right are the person's, not the viewer's. On the front view the
 * person's left arm is drawn on the viewer's right; on the back view it is on
 * the viewer's left, as when you look at someone's back.
 */

export type BodyView = 'front' | 'back';
export type BodySide = 'left' | 'right' | 'centre';

export interface BodyRegion {
  /** Stable id, for your data. Anatomical side: `left_upper_arm` is the person's left. */
  readonly id: string;
  readonly view: BodyView;
  readonly side: BodySide;
  /** SVG path data on the 200 x 460 canvas. */
  readonly d: string;
  /** English name; pass your own with the `regionName` label. */
  readonly name: string;
  /** Where a count badge sits. */
  readonly badge: { readonly x: number; readonly y: number };
}

export const CANVAS = Object.freeze({ width: 200, height: 460 });

const CENTRE_X = CANVAS.width / 2;

/**
 * Mirrors path data across the vertical centre line. Handles the absolute
 * commands this file uses (M, L, Q, C, Z), where every number pair is x y.
 */
export function mirrorPath(d: string): string {
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+/g) ?? [];
  let isX = true;
  return tokens
    .map((token) => {
      if (/^[MLQCZ]$/.test(token)) {
        isX = true;
        return token;
      }
      const value = Number(token);
      const out = isX ? CANVAS.width - value : value;
      isX = !isX;
      return String(Math.round(out * 100) / 100);
    })
    .join(' ');
}

/** An ellipse as four cubic curves, so it mirrors like any other path. */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const k = 0.5523;
  const ox = rx * k;
  const oy = ry * k;
  const n = (v: number) => String(Math.round(v * 100) / 100);
  return [
    `M ${n(cx - rx)} ${n(cy)}`,
    `C ${n(cx - rx)} ${n(cy - oy)} ${n(cx - ox)} ${n(cy - ry)} ${n(cx)} ${n(cy - ry)}`,
    `C ${n(cx + ox)} ${n(cy - ry)} ${n(cx + rx)} ${n(cy - oy)} ${n(cx + rx)} ${n(cy)}`,
    `C ${n(cx + rx)} ${n(cy + oy)} ${n(cx + ox)} ${n(cy + ry)} ${n(cx)} ${n(cy + ry)}`,
    `C ${n(cx - ox)} ${n(cy + ry)} ${n(cx - rx)} ${n(cy + oy)} ${n(cx - rx)} ${n(cy)}`,
    'Z',
  ].join(' ');
}

// Shapes drawn once. Limbs are drawn on the viewer's left and mirrored.
const SHAPES = {
  head: ellipsePath(CENTRE_X, 34, 20, 25),
  neck: 'M 91 56 L 109 56 L 111 70 L 89 70 Z',
  upperTorso:
    'M 89 70 L 111 70 Q 128 70 140 74 L 146 112 L 144 150 L 56 150 L 54 112 L 60 74 Q 72 70 89 70 Z',
  lowerTorso: 'M 56 150 L 144 150 L 142 196 Q 100 206 58 196 Z',
  // The lower edge is the two thighs' top edges, so hips and thighs meet exactly.
  pelvis: 'M 58 196 Q 100 206 142 196 L 141 224 Q 120 232 101 234 L 99 234 Q 80 232 59 224 Z',
  upperArm: 'M 60 74 Q 47 76 41 88 L 31 132 L 46 136 L 54 112 Z',
  forearmHand: 'M 31 132 L 24 172 L 20 202 Q 17 216 24 219 Q 32 217 33 206 L 38 174 L 46 136 Z',
  thigh: 'M 59 224 Q 80 232 99 234 L 97 302 L 96 332 L 66 332 L 64 302 Z',
  lowerLegFoot:
    'M 66 332 L 68 382 L 69 430 Q 64 444 74 447 L 90 447 Q 94 440 91 430 L 93 382 L 96 332 Z',
};

const region = (
  id: string,
  view: BodyView,
  side: BodySide,
  d: string,
  name: string,
  badge: [number, number]
): BodyRegion =>
  Object.freeze({ id, view, side, d, name, badge: Object.freeze({ x: badge[0], y: badge[1] }) });

/**
 * A limb region on one side. `onViewerLeft` says where it is drawn: the
 * person's right on the front view, the person's left on the back view.
 */
function limb(
  id: string,
  view: BodyView,
  side: 'left' | 'right',
  shape: string,
  name: string,
  badge: [number, number]
): BodyRegion {
  const onViewerLeft = (view === 'front') === (side === 'right');
  return region(
    id,
    view,
    side,
    onViewerLeft ? shape : mirrorPath(shape),
    name,
    onViewerLeft ? badge : [CANVAS.width - badge[0], badge[1]]
  );
}

function limbs(view: BodyView, suffix: string): BodyRegion[] {
  const parts: [string, string, string, [number, number]][] = [
    ['upper_arm', SHAPES.upperArm, 'upper arm', [36, 100]],
    ['forearm_hand', SHAPES.forearmHand, 'forearm and hand', [20, 176]],
    ['thigh', SHAPES.thigh, 'thigh', [74, 270]],
    ['lower_leg_foot', SHAPES.lowerLegFoot, 'lower leg and foot', [72, 380]],
  ];
  return (['right', 'left'] as const).flatMap((side) =>
    parts.map(([part, shape, name, badge]) =>
      limb(
        `${side}_${part}${suffix}`,
        view,
        side,
        shape,
        `${side === 'left' ? 'Left' : 'Right'} ${name}${suffix ? ' (back)' : ''}`,
        badge
      )
    )
  );
}

/** The default regions: 13 on the front, 13 on the back. Frozen. */
export const BODY_REGIONS: readonly BodyRegion[] = Object.freeze([
  region('head', 'front', 'centre', SHAPES.head, 'Head and face', [128, 22]),
  region('neck', 'front', 'centre', SHAPES.neck, 'Neck', [120, 62]),
  region('chest', 'front', 'centre', SHAPES.upperTorso, 'Chest', [100, 112]),
  region('abdomen', 'front', 'centre', SHAPES.lowerTorso, 'Abdomen', [100, 174]),
  region('pelvis', 'front', 'centre', SHAPES.pelvis, 'Hips and groin', [100, 212]),
  ...limbs('front', ''),
  region('head_back', 'back', 'centre', SHAPES.head, 'Back of the head', [128, 22]),
  region('neck_back', 'back', 'centre', SHAPES.neck, 'Back of the neck', [120, 62]),
  region('upper_back', 'back', 'centre', SHAPES.upperTorso, 'Upper back', [100, 112]),
  region('lower_back', 'back', 'centre', SHAPES.lowerTorso, 'Lower back', [100, 174]),
  region('buttocks', 'back', 'centre', SHAPES.pelvis, 'Buttocks', [100, 212]),
  ...limbs('back', '_back'),
]);

export const regionsForView = (
  view: BodyView,
  regions: readonly BodyRegion[] = BODY_REGIONS
): readonly BodyRegion[] => regions.filter((r) => r.view === view);

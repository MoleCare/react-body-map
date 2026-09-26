import { BODY_REGIONS, CANVAS, mirrorPath, regionsForView } from '../src/regions';

// The middle of a path's horizontal extent: which half of the canvas it is in.
const midX = (d: string) => {
  const numbers = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const xs = numbers.filter((_, i) => i % 2 === 0);
  return (Math.min(...xs) + Math.max(...xs)) / 2;
};

describe('BODY_REGIONS', () => {
  it('has 13 regions on each side of the body, with unique ids', () => {
    expect(regionsForView('front')).toHaveLength(13);
    expect(regionsForView('back')).toHaveLength(13);
    expect(new Set(BODY_REGIONS.map((r) => r.id)).size).toBe(26);
  });

  it("puts the person's left on the viewer's right on the front, and on the viewer's left on the back", () => {
    BODY_REGIONS.filter((r) => r.side !== 'centre').forEach((r) => {
      const onViewerRight = midX(r.d) > CANVAS.width / 2;
      const expected = (r.view === 'front') === (r.side === 'left');
      expect({ id: r.id, onViewerRight }).toEqual({ id: r.id, onViewerRight: expected });
      // The badge sits on the same side as its region.
      expect(r.badge.x > CANVAS.width / 2).toBe(expected);
    });
  });

  it('keeps centre regions centred', () => {
    BODY_REGIONS.filter((r) => r.side === 'centre').forEach((r) => {
      expect(Math.abs(midX(r.d) - CANVAS.width / 2)).toBeLessThan(1);
    });
  });

  it('names each side in English', () => {
    const byId = new Map(BODY_REGIONS.map((r) => [r.id, r]));
    expect(byId.get('left_upper_arm')?.name).toBe('Left upper arm');
    expect(byId.get('right_thigh_back')?.name).toBe('Right thigh (back)');
    expect(byId.get('pelvis')?.name).toBe('Hips and groin');
  });

  it('is frozen, down to the badges', () => {
    expect(Object.isFrozen(BODY_REGIONS)).toBe(true);
    expect(Object.isFrozen(BODY_REGIONS[0])).toBe(true);
    expect(Object.isFrozen(BODY_REGIONS[0]?.badge)).toBe(true);
  });

  it('keeps every point inside the canvas', () => {
    BODY_REGIONS.forEach((r) => {
      const n = (r.d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
      n.forEach((v, i) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(i % 2 === 0 ? CANVAS.width : CANVAS.height);
      });
    });
  });
});

describe('mirrorPath', () => {
  it('mirrors x and keeps y and commands', () => {
    expect(mirrorPath('M 10 20 L 30.5 40 Q 0 5 200 6 C 1 2 3 4 5 6 Z')).toBe(
      'M 190 20 L 169.5 40 Q 200 5 0 6 C 199 2 197 4 195 6 Z'
    );
  });

  it('is its own inverse', () => {
    const d = 'M 60 74 Q 47 76 41 88 L 31 132 Z';
    expect(mirrorPath(mirrorPath(d))).toBe(d);
  });

  it('returns nothing for nothing', () => {
    expect(mirrorPath('')).toBe('');
  });
});

describe('regionsForView', () => {
  it('filters any region list', () => {
    const own = [
      { ...BODY_REGIONS[0]!, id: 'a', view: 'front' as const },
      { ...BODY_REGIONS[0]!, id: 'b', view: 'back' as const },
    ];
    expect(regionsForView('back', own).map((r) => r.id)).toEqual(['b']);
  });
});

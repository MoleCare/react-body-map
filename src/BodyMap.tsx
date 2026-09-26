import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { BODY_REGIONS, CANVAS, regionsForView, type BodyRegion, type BodyView } from './regions';

export interface BodyMapLabels {
  front: string;
  back: string;
  /** Names the front/back switch for screen readers. */
  viewSwitch: string;
  /** Names the drawing for screen readers. */
  map: (view: BodyView) => string;
  /** A region's name; default is the English `region.name`. */
  regionName: (region: BodyRegion) => string;
  /** How a count is said, e.g. "3 photos". */
  countText: (count: number) => string;
}

export const DEFAULT_BODY_MAP_LABELS: BodyMapLabels = Object.freeze({
  front: 'Front',
  back: 'Back',
  viewSwitch: 'Body view',
  map: (view: BodyView) => (view === 'front' ? 'Body, front view' : 'Body, back view'),
  regionName: (region: BodyRegion) => region.name,
  countText: (count: number) => `${String(count)} recorded`,
});

/** Count thresholds for the three shades: at or above each value. Default [1, 3, 6]. */
export type CountLevels = readonly [number, number, number];

export const DEFAULT_COUNT_LEVELS: CountLevels = Object.freeze([1, 3, 6] as const);

/** 0 for no count, then 1 to 3 by `levels`. */
export function countLevel(
  count: number | undefined,
  levels: CountLevels = DEFAULT_COUNT_LEVELS
): 0 | 1 | 2 | 3 {
  if (count === undefined || !Number.isFinite(count) || count < levels[0]) return 0;
  if (count >= levels[2]) return 3;
  if (count >= levels[1]) return 2;
  return 1;
}

export interface BodyMapProps {
  /** Controlled view. Pass it with `onViewChange`, or leave both out. */
  view?: BodyView;
  /** Starting view when uncontrolled. Default `'front'`. */
  defaultView?: BodyView;
  onViewChange?: (view: BodyView) => void;
  /** Show the Front / Back switch. Default true. */
  showViewSwitch?: boolean;
  /** Selected region id, or ids. */
  selected?: string | readonly string[] | null;
  /** Makes regions buttons. Leave out for a read-only map. */
  onSelect?: (regionId: string) => void;
  /** Something recorded per region id, shown as a shade and a badge. */
  counts?: Readonly<Record<string, number>>;
  countLevels?: CountLevels;
  /** Words; pass your translations. Missing keys use English. */
  labels?: Partial<BodyMapLabels>;
  /** Your own regions. Default `BODY_REGIONS`. */
  regions?: readonly BodyRegion[];
  className?: string;
  style?: CSSProperties;
}

const FILL = [
  'var(--rbm-fill, #e8eef1)',
  'var(--rbm-level-1, #cfe3ea)',
  'var(--rbm-level-2, #9fcad6)',
  'var(--rbm-level-3, #6aaabd)',
];

const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * A front and back body map. Pick a region (`onSelect`), show what was
 * recorded per region (`counts`), or both. Shades are neutral: a count is
 * what someone recorded, never a judgement about it.
 */
export function BodyMap(props: BodyMapProps) {
  const {
    view: controlledView,
    defaultView = 'front',
    onViewChange,
    showViewSwitch = true,
    selected,
    onSelect,
    counts,
    countLevels = DEFAULT_COUNT_LEVELS,
    labels: labelOverrides,
    regions = BODY_REGIONS,
    className,
    style,
  } = props;
  const labels: BodyMapLabels = { ...DEFAULT_BODY_MAP_LABELS, ...labelOverrides };
  const [uncontrolledView, setUncontrolledView] = useState<BodyView>(defaultView);
  const view = controlledView ?? uncontrolledView;
  const selectedIds = new Set(
    selected == null ? [] : typeof selected === 'string' ? [selected] : selected
  );
  const shown = regionsForView(view, regions);
  const interactive = onSelect !== undefined;

  const changeView = (next: BodyView) => {
    if (next === view) return;
    if (controlledView === undefined) setUncontrolledView(next);
    onViewChange?.(next);
  };

  const describe = (region: BodyRegion) => {
    const count = counts?.[region.id];
    const name = labels.regionName(region);
    return count !== undefined && count > 0 ? `${name}, ${labels.countText(count)}` : name;
  };

  const onKeyDown = (event: KeyboardEvent<SVGPathElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <div
      className={className ? `rbm ${className}` : 'rbm'}
      style={{ position: 'relative', ...style }}
    >
      {showViewSwitch && (
        <div className="rbm-switch" role="group" aria-label={labels.viewSwitch}>
          {(['front', 'back'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`rbm-switch-button${option === view ? ' rbm-switch-button-active' : ''}`}
              aria-pressed={option === view}
              onClick={() => {
                changeView(option);
              }}
            >
              {labels[option]}
            </button>
          ))}
        </div>
      )}
      <svg
        className="rbm-svg"
        viewBox={`0 0 ${String(CANVAS.width)} ${String(CANVAS.height)}`}
        role="group"
        aria-label={labels.map(view)}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        {shown.map((region) => {
          const isSelected = selectedIds.has(region.id);
          const level = countLevel(counts?.[region.id], countLevels);
          return (
            <path
              key={region.id}
              className={`rbm-region${isSelected ? ' rbm-region-selected' : ''} rbm-level-${String(level)}`}
              data-region={region.id}
              d={region.d}
              fill={isSelected ? 'var(--rbm-selected, #2f7f95)' : FILL[level]}
              stroke="var(--rbm-stroke, #7f9aa5)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              {...(interactive
                ? {
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': describe(region),
                    'aria-pressed': isSelected,
                    onClick: () => {
                      onSelect(region.id);
                    },
                    onKeyDown: (event: KeyboardEvent<SVGPathElement>) => {
                      onKeyDown(event, region.id);
                    },
                    style: { cursor: 'pointer' },
                  }
                : { 'aria-hidden': true })}
            />
          );
        })}
        {shown.map((region) => {
          const count = counts?.[region.id];
          if (count === undefined || count <= 0) return null;
          return (
            <g
              key={`${region.id}-badge`}
              className="rbm-badge"
              aria-hidden="true"
              pointerEvents="none"
            >
              <circle
                cx={region.badge.x}
                cy={region.badge.y}
                r={9}
                fill="var(--rbm-badge, #1f5f70)"
              />
              <text
                x={region.badge.x}
                y={region.badge.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={600}
                fill="var(--rbm-badge-text, #ffffff)"
              >
                {count > 99 ? '99+' : String(count)}
              </text>
            </g>
          );
        })}
      </svg>
      {!interactive && counts && (
        <ul className="rbm-summary" style={VISUALLY_HIDDEN}>
          {shown
            .filter((region) => (counts[region.id] ?? 0) > 0)
            .map((region) => (
              <li key={region.id}>{describe(region)}</li>
            ))}
        </ul>
      )}
    </div>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { BODY_REGIONS, BodyMap, type BodyMapLabels, type BodyView } from '../src';

const REPO = 'https://github.com/MoleCare/react-body-map';
const NPM = 'https://www.npmjs.com/package/@molecare/react-body-map';

const nameOf = (id: string | null) => BODY_REGIONS.find((r) => r.id === id)?.name ?? 'nothing yet';

function Example(props: {
  id: string;
  title: string;
  intro: ReactNode;
  code: string;
  children: ReactNode;
}) {
  return (
    <section className="example" aria-labelledby={`${props.id}-title`}>
      <h2 id={`${props.id}-title`}>{props.title}</h2>
      <p className="intro">{props.intro}</p>
      <div className="stage">{props.children}</div>
      <details>
        <summary>Show the code</summary>
        <pre>
          <code>{props.code.trim()}</code>
        </pre>
      </details>
    </section>
  );
}

function Pick() {
  const [region, setRegion] = useState<string | null>(null);
  return (
    <Example
      id="pick"
      title="Pick a region"
      intro={
        <>
          Click or tap a region. On a keyboard, press Tab to reach one and Enter or Space to pick
          it. Try the left arm: it is on your right, because this is the person facing you.
        </>
      }
      code={`
const [region, setRegion] = useState<string | null>(null);

<BodyMap selected={region} onSelect={setRegion} />`}
    >
      <div className="maps">
        <div className="map">
          <BodyMap selected={region} onSelect={setRegion} />
        </div>
        <p className="readout" aria-live="polite">
          Picked: <strong>{nameOf(region)}</strong>
          {region && (
            <>
              {' '}
              (<code>{region}</code>)
            </>
          )}
        </p>
      </div>
    </Example>
  );
}

const RECORDED = {
  chest: 2,
  left_upper_arm: 4,
  right_thigh: 7,
  upper_back: 3,
  left_lower_leg_foot_back: 1,
};

function Counts() {
  return (
    <Example
      id="counts"
      title="Show what was recorded"
      intro="Without onSelect the map is read-only. Counts are neutral shades with a badge, and screen readers get a list of them, so nothing depends on colour."
      code={`
<BodyMap counts={{ chest: 2, left_upper_arm: 4, right_thigh: 7, upper_back: 3 }} />`}
    >
      <div className="maps">
        <div className="map">
          <BodyMap counts={RECORDED} />
        </div>
        <div className="map">
          <BodyMap counts={RECORDED} defaultView="back" />
        </div>
      </div>
    </Example>
  );
}

function Both() {
  const [region, setRegion] = useState<string | null>('chest');
  const [view, setView] = useState<BodyView>('front');
  return (
    <Example
      id="both"
      title="Pick and show together"
      intro="Give it both, and each region button also says its count. Here the view is controlled too, so the page knows which side is showing."
      code={`
const [region, setRegion] = useState<string | null>('chest');
const [view, setView] = useState<BodyView>('front');

<BodyMap
  counts={recorded}
  selected={region}
  onSelect={setRegion}
  view={view}
  onViewChange={setView}
/>`}
    >
      <div className="maps">
        <div className="map">
          <BodyMap
            counts={RECORDED}
            selected={region}
            onSelect={setRegion}
            view={view}
            onViewChange={setView}
          />
        </div>
        <p className="readout" aria-live="polite">
          Showing the {view}. Picked: <strong>{nameOf(region)}</strong>
          {region && RECORDED[region as keyof typeof RECORDED]
            ? `, ${String(RECORDED[region as keyof typeof RECORDED])} recorded`
            : ''}
          .
        </p>
      </div>
    </Example>
  );
}

const GERMAN: Partial<BodyMapLabels> = {
  front: 'Vorne',
  back: 'Hinten',
  viewSwitch: 'Ansicht',
  map: (view) => (view === 'front' ? 'Körper, vorne' : 'Körper, hinten'),
  countText: (n) => `${String(n)} Fotos`,
  regionName: (region) =>
    (
      ({
        head: 'Kopf und Gesicht',
        neck: 'Hals',
        chest: 'Brust',
        abdomen: 'Bauch',
        pelvis: 'Hüfte und Leiste',
      }) as Record<string, string>
    )[region.id] ?? region.name,
};

function Translated() {
  const [region, setRegion] = useState<string | null>(null);
  return (
    <Example
      id="labels"
      title="Every word is a prop"
      intro="Pass your own words, including a name for each region from your translation files. Anything you leave out stays English: here only the centre regions are translated."
      code={`
<BodyMap
  onSelect={setRegion}
  labels={{
    front: 'Vorne',
    back: 'Hinten',
    regionName: (region) => t(\`body.\${region.id}\`),
    countText: (n) => \`\${n} Fotos\`,
  }}
/>`}
    >
      <div className="maps" lang="de">
        <div className="map">
          <BodyMap labels={GERMAN} counts={{ chest: 2 }} selected={region} onSelect={setRegion} />
        </div>
      </div>
    </Example>
  );
}

const STYLE_CODE = `
.rbm {
  --rbm-level-1: #1e4d5a;
  --rbm-level-2: #2b6f82;
  --rbm-level-3: #3f93aa;
  --rbm-selected: #60a5fa;
  --rbm-badge: #e0f2fe;
  --rbm-badge-text: #0c4a6e;
}
.rbm-region:focus-visible { outline: none; stroke: #60a5fa; stroke-width: 3; }`;

type Theme = 'system' | 'light' | 'dark';

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('rbm-demo-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function App() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('rbm-demo-theme', theme);
    } catch {
      // Private windows may block storage; the theme still applies.
    }
  }, [theme]);

  const install = 'npm install @molecare/react-body-map';

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="top">
            <span className="brand">react-body-map</span>
            <nav aria-label="Project links">
              <a href={REPO}>GitHub</a>
              <a href={NPM}>npm</a>
              <button
                type="button"
                className="theme"
                onClick={() => {
                  setTheme(theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system');
                }}
                aria-label={`Colour theme: ${theme}. Change theme`}
              >
                {theme === 'system' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </nav>
          </div>
          <h1>Where on the body?</h1>
          <p className="lead">
            A front and back body map for React. Pick a region, or show what was recorded in each
            one. Accessible, left and right done right, and every word is yours. No dependencies.
          </p>
          <div className="install">
            <code>{install}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  .writeText(install)
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => {
                      setCopied(false);
                    }, 1500);
                  })
                  .catch(() => {
                    // Clipboard blocked: the command is still there to select.
                  });
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </header>
      <main className="wrap">
        <Pick />
        <Counts />
        <Both />
        <Translated />
        <Example
          id="style"
          title="Your colours"
          intro="Colours are CSS variables with neutral defaults. This one uses a dark palette; switch the theme at the top to see the whole page follow."
          code={STYLE_CODE}
        >
          <div className="maps dark-map">
            <div className="map">
              <BodyMap counts={RECORDED} selected="abdomen" onSelect={() => undefined} />
            </div>
          </div>
        </Example>
      </main>
      <footer className="wrap footer">
        <p>
          Apache-2.0 · made by <a href="https://www.molecare.co.uk">MoleCare</a> ·{' '}
          <a href={REPO}>source and docs</a>
        </p>
        <p className="small">
          Not a medical device: this package draws a body diagram and never says what a count or a
          region means.
        </p>
      </footer>
    </>
  );
}

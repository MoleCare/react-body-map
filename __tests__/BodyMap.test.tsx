import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { BODY_REGIONS, BodyMap, countLevel, type BodyView } from '../src';

const regionButtons = () => screen.getAllByRole('button').filter((b) => b.tagName === 'path');
const region = (container: HTMLElement, id: string) =>
  container.querySelector(`[data-region="${id}"]`) as SVGPathElement;

describe('countLevel', () => {
  it('buckets counts into three shades', () => {
    expect([undefined, Number.NaN, 0, 1, 2, 3, 5, 6, 40].map((c) => countLevel(c))).toEqual([
      0, 0, 0, 1, 1, 2, 2, 3, 3,
    ]);
    expect(countLevel(2, [2, 4, 8])).toBe(1);
  });
});

describe('BodyMap as a picker', () => {
  it('makes every front region a named button', () => {
    render(<BodyMap onSelect={() => undefined} />);
    expect(regionButtons()).toHaveLength(13);
    expect(screen.getByRole('button', { name: 'Left upper arm' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Body, front view' })).toBeTruthy();
  });

  it('selects by click, Enter and Space, and shows the selection', () => {
    const picked: string[] = [];
    function Picker() {
      const [selected, setSelected] = useState<string | null>(null);
      return (
        <BodyMap
          selected={selected}
          onSelect={(id) => {
            picked.push(id);
            setSelected(id);
          }}
        />
      );
    }
    const { container } = render(<Picker />);
    fireEvent.click(screen.getByRole('button', { name: 'Chest' }));
    expect(region(container, 'chest').getAttribute('aria-pressed')).toBe('true');
    expect(region(container, 'chest').getAttribute('fill')).toBe('var(--rbm-selected, #2f7f95)');
    expect(region(container, 'chest').getAttribute('class')).toContain('rbm-region-selected');

    fireEvent.keyDown(screen.getByRole('button', { name: 'Neck' }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Abdomen' }), { key: ' ' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Abdomen' }), { key: 'a' });
    expect(picked).toEqual(['chest', 'neck', 'abdomen']);
    expect(region(container, 'chest').getAttribute('aria-pressed')).toBe('false');
  });

  it('shows several selected regions', () => {
    const { container } = render(
      <BodyMap selected={['chest', 'neck']} onSelect={() => undefined} />
    );
    expect(region(container, 'chest').getAttribute('aria-pressed')).toBe('true');
    expect(region(container, 'neck').getAttribute('aria-pressed')).toBe('true');
    expect(region(container, 'head').getAttribute('aria-pressed')).toBe('false');
  });

  it('says the count in the button name', () => {
    render(<BodyMap counts={{ chest: 3, neck: 0 }} onSelect={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Chest, 3 recorded' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Neck' })).toBeTruthy();
  });
});

describe('BodyMap views', () => {
  it('switches between front and back', () => {
    const { container } = render(<BodyMap onSelect={() => undefined} />);
    const back = screen.getByRole('button', { name: 'Back' });
    expect(back.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(back);
    expect(back.getAttribute('aria-pressed')).toBe('true');
    expect(region(container, 'upper_back')).toBeTruthy();
    expect(region(container, 'chest')).toBeNull();
    // Pressing the current view changes nothing.
    fireEvent.click(back);
    expect(region(container, 'upper_back')).toBeTruthy();
  });

  it('can be controlled', () => {
    const changes: BodyView[] = [];
    function Controlled() {
      const [view, setView] = useState<BodyView>('back');
      return (
        <BodyMap
          view={view}
          onViewChange={(next) => {
            changes.push(next);
            setView(next);
          }}
        />
      );
    }
    const { container } = render(<Controlled />);
    expect(region(container, 'buttocks')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Front' }));
    expect(changes).toEqual(['front']);
    expect(region(container, 'pelvis')).toBeTruthy();
  });

  it('stays put when the parent ignores a controlled change', () => {
    const onViewChange = jest.fn();
    const { container } = render(<BodyMap view="front" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onViewChange).toHaveBeenCalledWith('back');
    expect(region(container, 'chest')).toBeTruthy();
  });

  it('can hide the switch and start on the back', () => {
    const { container } = render(<BodyMap defaultView="back" showViewSwitch={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(region(container, 'lower_back')).toBeTruthy();
  });
});

describe('BodyMap as a read-only map of counts', () => {
  it('shades by count, shows badges, and lists counts for screen readers', () => {
    const { container } = render(
      <BodyMap counts={{ chest: 2, abdomen: 4, pelvis: 150, neck: 0 }} />
    );
    expect(regionButtons()).toHaveLength(0);
    expect(region(container, 'chest').getAttribute('aria-hidden')).toBe('true');
    expect(region(container, 'chest').getAttribute('class')).toContain('rbm-level-1');
    expect(region(container, 'abdomen').getAttribute('class')).toContain('rbm-level-2');
    expect(region(container, 'pelvis').getAttribute('class')).toContain('rbm-level-3');
    expect(region(container, 'head').getAttribute('class')).toContain('rbm-level-0');
    const badges = [...container.querySelectorAll('.rbm-badge text')].map((t) => t.textContent);
    expect(badges).toEqual(['2', '4', '99+']);
    const list = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(list).toEqual([
      'Chest, 2 recorded',
      'Abdomen, 4 recorded',
      'Hips and groin, 150 recorded',
    ]);
  });

  it('has no list without counts', () => {
    render(<BodyMap />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('BodyMap words, regions and style', () => {
  it('takes translations', () => {
    render(
      <BodyMap
        counts={{ chest: 1 }}
        onSelect={() => undefined}
        labels={{
          front: 'Vorne',
          back: 'Hinten',
          viewSwitch: 'Ansicht',
          map: (view) => (view === 'front' ? 'Körper, vorne' : 'Körper, hinten'),
          regionName: (r) => (r.id === 'chest' ? 'Brust' : r.name),
          countText: (n) => `${String(n)} Fotos`,
        }}
      />
    );
    expect(screen.getByRole('group', { name: 'Ansicht' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hinten' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Körper, vorne' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Brust, 1 Fotos' })).toBeTruthy();
  });

  it('draws your own regions', () => {
    const [head] = BODY_REGIONS;
    const own = [{ ...head!, id: 'scalp', name: 'Scalp' }];
    render(<BodyMap regions={own} onSelect={() => undefined} />);
    expect(regionButtons().map((b) => b.getAttribute('aria-label'))).toEqual(['Scalp']);
  });

  it('takes a class name and style', () => {
    const { container } = render(<BodyMap className="mine" style={{ maxWidth: 240 }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe('rbm mine');
    expect(root.style.maxWidth).toBe('240px');
  });
});

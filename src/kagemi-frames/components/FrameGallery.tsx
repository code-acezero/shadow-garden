'use client';
import { useMemo, useState } from 'react';
import { catalog } from '../frames/engine';
import ProfileFrame from './ProfileFrame';

/** Demo / store grid. Thumbnails are still until hovered; the big preview animates. */
export default function FrameGallery({ avatar }: { avatar?: string }) {
  const [group, setGroup] = useState<string>('store');
  const [pick, setPick] = useState<string | null>(null);
  const list = useMemo(() => catalog.filter((c) => c.group === group || (group === 'titles' && c.group.startsWith('title'))), [group]);
  const sel = catalog.find((c) => c.id === pick);
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['store', 'Store'], ['level', 'Level'], ['titles', 'Titles']].map(([k, v]) => (
          <button key={k} onClick={() => setGroup(k)} aria-pressed={group === k}>{v}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
        {list.map((c) => (
          <button key={c.id} onClick={() => setPick(c.id)} style={{ textAlign: 'center' }}>
            <ProfileFrame frame={c.id} src={avatar} size={132} animate="hover" />
            <div>{c.name}</div>
            {c.price ? <small>{c.price.toLocaleString()} coins</small> : <small>{c.collection}</small>}
          </button>
        ))}
      </div>
      {sel && (
        <div role="dialog" aria-label={sel.name} style={{ position: 'fixed', inset: 0, background: '#000b', display: 'grid', placeItems: 'center' }} onClick={() => setPick(null)}>
          <ProfileFrame frame={sel.id} src={avatar} size={320} animate="always" parallax />
        </div>
      )}
    </div>
  );
}

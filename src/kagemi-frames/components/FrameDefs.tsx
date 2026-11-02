import { DEFS_HTML } from '../frames/engine';

/** Mount ONCE in app/layout.tsx. Holds the shared gradients, filters and motif shapes. */
export default function FrameDefs() {
  return (
    <svg
      width="0" height="0" aria-hidden="true" focusable="false"
      style={{ position: 'absolute', pointerEvents: 'none' }}
      dangerouslySetInnerHTML={{ __html: `<defs>${DEFS_HTML}</defs>` }}
    />
  );
}

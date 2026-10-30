'use client';

import { useRef, useLayoutEffect } from 'react';

/**
 * Ultra-lightweight GPU-composited Jelly FLIP hook for high-performance layout morphing.
 * Completely eliminates Framer Motion's JS projection loops and layout thrashing across 50+ elements.
 * Runs 100% on the browser's hardware-accelerated compositor thread with a relaxed, silky-smooth spring curve.
 */
export function useJellyFlip(
    dependency: any,
    containerRef: React.RefObject<HTMLElement | null>
) {
    const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
    const isFirstMount = useRef(true);

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const items = Array.from(container.querySelectorAll<HTMLElement>('[data-flip-id]'));

        // On first mount, just record positions without animating
        if (isFirstMount.current) {
            isFirstMount.current = false;
            items.forEach(el => {
                const id = el.dataset.flipId;
                if (id) prevRectsRef.current.set(id, el.getBoundingClientRect());
            });
            return;
        }

        const prevRects = prevRectsRef.current;
        const newRects = new Map<string, DOMRect>();
        const toAnimate: Array<{ el: HTMLElement; dx: number; dy: number; sx: number; sy: number }> = [];

        // Step 1: Batch read all new geometry
        items.forEach(el => {
            const id = el.dataset.flipId;
            if (!id) return;
            const newRect = el.getBoundingClientRect();
            newRects.set(id, newRect);

            const prevRect = prevRects.get(id);
            if (prevRect) {
                const dx = prevRect.left - newRect.left;
                const dy = prevRect.top - newRect.top;
                const rawSx = newRect.width > 0 ? prevRect.width / newRect.width : 1;
                const rawSy = newRect.height > 0 ? prevRect.height / newRect.height : 1;

                // Clamp scale between 0.6 and 2.2 to prevent 10x raster distortion & GPU layer explosions when morphing list <-> pill
                const sx = Math.min(Math.max(rawSx, 0.6), 2.2);
                const sy = Math.min(Math.max(rawSy, 0.6), 2.2);

                if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(rawSx - 1) > 0.02 || Math.abs(rawSy - 1) > 0.02) {
                    toAnimate.push({ el, dx, dy, sx, sy });
                }
            }
        });

        if (toAnimate.length === 0) {
            prevRectsRef.current = newRects;
            return;
        }

        // Step 2: Batch invert using GPU transforms
        toAnimate.forEach(({ el, dx, dy, sx, sy }) => {
            el.style.transformOrigin = 'center center';
            el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
            el.style.transition = 'none';
            el.style.willChange = 'transform';
        });

        // Force single micro-reflow so the inverted matrix is synchronously committed
        void container.offsetHeight;

        // Step 3: Play via native CSS transition with relaxed, silky smooth spring curve
        let rafId: number;
        let safetyTimer: any;
        rafId = requestAnimationFrame(() => {
            toAnimate.forEach(({ el }) => {
                // Relaxed speed (420ms) with gentle, cushioned cubic-bezier to avoid lag
                el.style.transition = 'transform 420ms cubic-bezier(0.2, 0.9, 0.3, 1)';
                el.style.transform = 'translate3d(0, 0, 0) scale(1, 1)';

                const onEnd = () => {
                    el.style.transform = '';
                    el.style.transition = '';
                    el.style.willChange = '';
                    el.removeEventListener('transitionend', onEnd);
                };
                el.addEventListener('transitionend', onEnd, { once: true });
            });
        });

        safetyTimer = setTimeout(() => {
            toAnimate.forEach(({ el }) => {
                el.style.transform = '';
                el.style.transition = '';
                el.style.willChange = '';
            });
        }, 460);

        prevRectsRef.current = newRects;

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(safetyTimer);
        };
    }, [dependency, containerRef]);
}

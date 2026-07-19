"use client";

import { useCallback, useRef, useState } from 'react';

export type DownloadStatus = 'queued' | 'downloading' | 'done' | 'error' | 'cancelled';

export interface DownloadItem {
  id: string;
  label: string;
  filename: string;
  url: string;                 // the engine endpoint to fetch (already built)
  totalBytes: number | null;   // null when unknown (e.g. HLS concat streams)
  receivedBytes: number;
  speedBps: number;
  status: DownloadStatus;
  error?: string;
}

declare global {
  interface Window {
    showSaveFilePicker?: (opts?: any) => Promise<any>;
  }
}

const supportsFsAccess = () => typeof window !== 'undefined' && !!window.showSaveFilePicker;

export function useDownloadEngine() {
  const [items, setItems] = useState<Record<string, DownloadItem>>({});
  const controllers = useRef<Record<string, AbortController>>({});

  const update = useCallback((id: string, patch: Partial<DownloadItem>) => {
    setItems(prev => ({ ...prev, [id]: { ...prev[id], ...patch } as DownloadItem }));
  }, []);

  const start = useCallback(async (opts: { id: string; label: string; filename: string; url: string }) => {
    const controller = new AbortController();
    controllers.current[opts.id] = controller;

    setItems(prev => ({
      ...prev,
      [opts.id]: {
        id: opts.id,
        label: opts.label,
        filename: opts.filename,
        url: opts.url,
        totalBytes: null,
        receivedBytes: 0,
        speedBps: 0,
        status: 'downloading',
      },
    }));

    try {
      const res = await fetch(opts.url, { signal: controller.signal });
      if (!res.ok || !res.body) throw new Error(`Server responded ${res.status}`);

      const totalHeader = res.headers.get('Content-Length');
      const totalBytes = totalHeader ? parseInt(totalHeader) : null;
      update(opts.id, { totalBytes });

      const reader = res.body.getReader();

      // Prefer streaming straight to disk so multi-GB files never sit in memory.
      let fileHandle: any = null;
      let writable: any = null;
      if (supportsFsAccess()) {
        try {
          fileHandle = await window.showSaveFilePicker!({ suggestedName: opts.filename });
          writable = await fileHandle.createWritable();
        } catch {
          // user cancelled the save dialog, or API unsupported at runtime -> fall back to blob
          fileHandle = null;
        }
      }
      const chunks: Uint8Array[] = [];

      let received = 0;
      let lastTick = performance.now();
      let lastBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        received += value.byteLength;
        if (writable) {
          await writable.write(value);
        } else {
          chunks.push(value);
        }

        const now = performance.now();
        if (now - lastTick > 250) {
          const speedBps = ((received - lastBytes) / ((now - lastTick) / 1000));
          update(opts.id, { receivedBytes: received, speedBps });
          lastTick = now;
          lastBytes = received;
        }
      }

      if (writable) {
        await writable.close();
      } else {
        const blob = new Blob(chunks as BlobPart[]);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = opts.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }

      update(opts.id, { status: 'done', receivedBytes: received, speedBps: 0 });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        update(opts.id, { status: 'cancelled' });
      } else {
        update(opts.id, { status: 'error', error: err?.message || 'Download failed' });
      }
    } finally {
      delete controllers.current[opts.id];
    }
  }, [update]);

  const cancel = useCallback((id: string) => {
    controllers.current[id]?.abort();
  }, []);

  return { items, start, cancel };
}

export function formatBytes(n: number | null) {
  if (n === null || Number.isNaN(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatSpeed(bps: number) {
  return `${formatBytes(bps)}/s`;
}

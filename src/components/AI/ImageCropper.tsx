"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Crop, X, Check, RotateCcw, Maximize2, Square, RectangleHorizontal, 
  Tv, Smartphone, Loader2, ZoomIn, ZoomOut, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface DetectedScene {
  x: number;
  y: number;
  w: number;
  h: number;
  detectedRatio?: string;
  hasLetterbox: boolean;
}

export interface ImageCropperProps {
  imageSrc: string;
  initialCropBox?: { x: number; y: number; w: number; h: number } | null;
  embedded?: boolean;
  className?: string;
  onCropComplete: (croppedFile: File, croppedUrl: string) => void;
  onCancel: () => void;
}

type ResizeAction = 'drag' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'se' | 'sw';

const RATIO_PRESETS = [
  { id: '16:9', label: '16:9 Anime', icon: <RectangleHorizontal size={13} className="text-orange-400" /> },
  { id: '4:3', label: '4:3 Classic', icon: <Tv size={13} className="text-amber-400" /> },
  { id: '1:1', label: '1:1 Square', icon: <Square size={13} className="text-zinc-300" /> },
  { id: '9:16', label: '9:16 Vertical', icon: <Smartphone size={13} className="text-purple-400" /> },
  { id: 'full', label: 'Full Image', icon: <Maximize2 size={13} className="text-zinc-300" /> },
] as const;

/**
 * High precision Auto Crop algorithm for Anime Scene Viewports (16:9, 19:9, 21:9, 9:16, 4:3, 1:1, etc.)
 * Detects letterbox/pillarbox borders, anime cel line gradients, and reframes to active scene viewport.
 */
export function detectAnimeScene(img: HTMLImageElement): DetectedScene | null {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  if (!origW || !origH || origW < 30 || origH < 30) return null;

  // Downsample to max 360px for quick and noise-resistant pixel analysis
  const maxDim = 360;
  const scale = Math.min(1, maxDim / Math.max(origW, origH));
  const sw = Math.max(30, Math.round(origW * scale));
  const sh = Math.max(30, Math.round(origH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, sw, sh);
  const imgData = ctx.getImageData(0, 0, sw, sh);
  const data = imgData.data;

  // 1. Calculate luminance and global statistics
  const totalPixels = sw * sh;
  const luma = new Float32Array(totalPixels);
  let totalLuma = 0;
  let totalLumaSq = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const a = data[idx + 3];
    if (a < 20) {
      luma[i] = 0;
      continue;
    }
    const yVal = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    luma[i] = yVal;
    totalLuma += yVal;
    totalLumaSq += yVal * yVal;
  }

  const globalMean = totalLuma / totalPixels;
  const globalVar = (totalLumaSq / totalPixels) - (globalMean * globalMean);
  const globalStdDev = Math.sqrt(Math.max(0, globalVar));

  // If the entire image has virtually no variance (< 6), it's flat/solid color - not an anime scene
  if (globalStdDev < 6.0) {
    return null;
  }

  // 2. Measure row-by-row and column-by-column metrics:
  // - edge energy (sum of horizontal diffs in row)
  // - luminance mean and stdDev
  const rowMetrics = new Array(sh);
  for (let y = 0; y < sh; y++) {
    let rSum = 0;
    let rSqSum = 0;
    let edgeSum = 0;
    const yOffset = y * sw;

    for (let x = 0; x < sw; x++) {
      const val = luma[yOffset + x];
      rSum += val;
      rSqSum += val * val;

      if (x > 0) {
        edgeSum += Math.abs(val - luma[yOffset + x - 1]);
      }
    }

    const mean = rSum / sw;
    const variance = (rSqSum / sw) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));
    const avgEdge = edgeSum / Math.max(1, sw - 1);

    rowMetrics[y] = { mean, stdDev, avgEdge };
  }

  const colMetrics = new Array(sw);
  for (let x = 0; x < sw; x++) {
    let cSum = 0;
    let cSqSum = 0;
    let edgeSum = 0;

    for (let y = 0; y < sh; y++) {
      const val = luma[y * sw + x];
      cSum += val;
      cSqSum += val * val;

      if (y > 0) {
        edgeSum += Math.abs(val - luma[(y - 1) * sw + x]);
      }
    }

    const mean = cSum / sh;
    const variance = (cSqSum / sh) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));
    const avgEdge = edgeSum / Math.max(1, sh - 1);

    colMetrics[x] = { mean, stdDev, avgEdge };
  }

  // Helper: Detect whether a line belongs to an anime scene or letterbox/border
  const isSceneLine = (m: { mean: number; stdDev: number; avgEdge: number }) => {
    // If it has anime drawing edges (character outlines, cel shading)
    if (m.avgEdge >= 3.6 && m.stdDev >= 5.0) return true;
    // If it has moderate variance and is not near-black letterbox (video noise can have mean up to 35)
    if (m.stdDev >= 9.0 && m.mean >= 35) return true;
    // Bright colored background with content
    if (m.mean >= 45 && m.avgEdge >= 2.5) return true;
    return false;
  };

  // 3. Scan boundaries from edges inward (up to 46% of dimension)
  let top = 0;
  const maxScanY = Math.floor(sh * 0.46);
  for (let y = 0; y < maxScanY; y++) {
    if (isSceneLine(rowMetrics[y])) {
      top = y;
      break;
    }
  }

  let bottom = sh - 1;
  const minScanY = Math.ceil(sh * 0.54);
  for (let y = sh - 1; y >= minScanY; y--) {
    if (isSceneLine(rowMetrics[y])) {
      bottom = y;
      break;
    }
  }

  let left = 0;
  const maxScanX = Math.floor(sw * 0.46);
  for (let x = 0; x < maxScanX; x++) {
    if (isSceneLine(colMetrics[x])) {
      left = x;
      break;
    }
  }

  let right = sw - 1;
  const minScanX = Math.ceil(sw * 0.54);
  for (let x = sw - 1; x >= minScanX; x--) {
    if (isSceneLine(colMetrics[x])) {
      right = x;
      break;
    }
  }

  const detectedW = right - left + 1;
  const detectedH = bottom - top + 1;

  // Viewport must be at least 15% in each dimension
  if (detectedW < sw * 0.15 || detectedH < sh * 0.15) {
    return null;
  }

  // 4. Verify interior has active anime detail
  let interiorEdgeSum = 0;
  let interiorPixels = 0;
  for (let y = top; y <= bottom; y += 2) {
    const yOffset = y * sw;
    for (let x = left; x <= right; x += 2) {
      if (x > left) {
        interiorEdgeSum += Math.abs(luma[yOffset + x] - luma[yOffset + x - 1]);
      }
      interiorPixels++;
    }
  }
  const interiorAvgEdge = interiorEdgeSum / Math.max(1, interiorPixels);
  if (interiorAvgEdge < 2.0 && globalStdDev < 12.0) {
    return null;
  }

  let pctX = (left / sw) * 100;
  let pctY = (top / sh) * 100;
  let pctW = (detectedW / sw) * 100;
  let pctH = (detectedH / sh) * 100;

  // If borders are negligible (< 2.5% on each side), snap to full scene
  const hasLetterbox = (pctX >= 2.5 || pctY >= 2.5 || pctW <= 97 || pctH <= 97);
  if (!hasLetterbox) {
    pctX = 0;
    pctY = 0;
    pctW = 100;
    pctH = 100;
  }

  // Determine aspect ratio label
  const pixelW = (pctW / 100) * origW;
  const pixelH = (pctH / 100) * origH;
  const actualRatio = pixelW / pixelH;

  let ratioLabel = '';
  if (Math.abs(actualRatio - 16 / 9) < 0.12) ratioLabel = '16:9 Anime Frame';
  else if (Math.abs(actualRatio - 19 / 9) < 0.18 || Math.abs(actualRatio - 21 / 9) < 0.22) ratioLabel = 'Cinematic Viewport';
  else if (Math.abs(actualRatio - 9 / 16) < 0.12) ratioLabel = '9:16 Vertical Scene';
  else if (Math.abs(actualRatio - 4 / 3) < 0.12) ratioLabel = '4:3 Classic Anime';
  else if (Math.abs(actualRatio - 1) < 0.12) ratioLabel = '1:1 Square Scene';
  else ratioLabel = `${actualRatio.toFixed(1)}:1 Viewport`;

  return {
    x: Math.round(pctX * 10) / 10,
    y: Math.round(pctY * 10) / 10,
    w: Math.round(pctW * 10) / 10,
    h: Math.round(pctH * 10) / 10,
    detectedRatio: ratioLabel,
    hasLetterbox
  };
}

/**
 * Crops an HTMLImageElement using canvas and returns a File and object URL
 */
export async function createCroppedImage(
  img: HTMLImageElement,
  cropBox: { x: number; y: number; w: number; h: number },
  fileName: string = 'cropped_scan.jpg'
): Promise<{ croppedFile: File; croppedUrl: string }> {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const cropPixelX = Math.round((cropBox.x / 100) * origW);
  const cropPixelY = Math.round((cropBox.y / 100) * origH);
  const cropPixelW = Math.max(10, Math.round((cropBox.w / 100) * origW));
  const cropPixelH = Math.max(10, Math.round((cropBox.h / 100) * origH));

  const canvas = document.createElement('canvas');
  canvas.width = cropPixelW;
  canvas.height = cropPixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2d context');

  ctx.drawImage(img, cropPixelX, cropPixelY, cropPixelW, cropPixelH, 0, 0, cropPixelW, cropPixelH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed'));
          return;
        }
        const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
        const croppedUrl = URL.createObjectURL(blob);
        resolve({ croppedFile, croppedUrl });
      },
      'image/jpeg',
      0.95
    );
  });
}

export default function ImageCropper({ 
  imageSrc, 
  initialCropBox,
  embedded = false,
  className,
  onCropComplete, 
  onCancel 
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Selection box state in percentages (0 - 100)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>(() => 
    initialCropBox || { x: 5, y: 5, w: 90, h: 90 }
  );
  const [selectedRatio, setSelectedRatio] = useState<string>('custom');
  const [zoom, setZoom] = useState(1);
  const [activeAction, setActiveAction] = useState<ResizeAction | null>(null);
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  // Auto-Crop states
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [noSceneFound, setNoSceneFound] = useState(false);
  const [detectedFeedback, setDetectedFeedback] = useState<string | null>(null);

  // Reset or apply initialCropBox when imageSrc changes
  useEffect(() => {
    if (initialCropBox) {
      setCropBox(initialCropBox);
    } else {
      setCropBox({ x: 5, y: 5, w: 90, h: 90 });
    }
    setZoom(1);
    setNoSceneFound(false);
    setDetectedFeedback(null);
  }, [imageSrc, initialCropBox]);

  // Pointer Down handler (Works seamlessly for Mouse, Touch, & Stylus)
  const handlePointerDown = (e: React.PointerEvent, action: ResizeAction) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    setActiveAction(action);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.w,
      boxH: cropBox.h
    });
  };

  // Pointer Move handler
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!activeAction || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Convert pixel delta into percentage relative to the image container
    const deltaXPct = ((e.clientX - dragStart.clientX) / rect.width) * 100;
    const deltaYPct = ((e.clientY - dragStart.clientY) / rect.height) * 100;

    const MIN_SIZE_PCT = 5;

    if (activeAction === 'drag') {
      let newX = dragStart.boxX + deltaXPct;
      let newY = dragStart.boxY + deltaYPct;

      newX = Math.max(0, Math.min(100 - dragStart.boxW, newX));
      newY = Math.max(0, Math.min(100 - dragStart.boxH, newY));

      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
      return;
    }

    let newX = dragStart.boxX;
    let newY = dragStart.boxY;
    let newW = dragStart.boxW;
    let newH = dragStart.boxH;

    // Horizontal adjustments (Left 'w', Right 'e')
    if (activeAction.includes('w')) {
      const rightEdge = dragStart.boxX + dragStart.boxW;
      newX = Math.max(0, Math.min(rightEdge - MIN_SIZE_PCT, dragStart.boxX + deltaXPct));
      newW = rightEdge - newX;
    } else if (activeAction.includes('e')) {
      newW = Math.max(MIN_SIZE_PCT, Math.min(100 - dragStart.boxX, dragStart.boxW + deltaXPct));
    }

    // Vertical adjustments (Top 'n', Bottom 's')
    if (activeAction.includes('n')) {
      const bottomEdge = dragStart.boxY + dragStart.boxH;
      newY = Math.max(0, Math.min(bottomEdge - MIN_SIZE_PCT, dragStart.boxY + deltaYPct));
      newH = bottomEdge - newY;
    } else if (activeAction.includes('s')) {
      newH = Math.max(MIN_SIZE_PCT, Math.min(100 - dragStart.boxY, dragStart.boxH + deltaYPct));
    }

    setCropBox({
      x: Math.round(newX * 100) / 100,
      y: Math.round(newY * 100) / 100,
      w: Math.round(newW * 100) / 100,
      h: Math.round(newH * 100) / 100,
    });
  }, [activeAction, dragStart]);

  // Pointer Up handler
  const handlePointerUp = useCallback(() => {
    setActiveAction(null);
  }, []);

  useEffect(() => {
    if (activeAction) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeAction, handlePointerMove, handlePointerUp]);

  // Quick preset ratios (16:9, 4:3, 1:1, 9:16, full)
  const applyPreset = (ratio: 'full' | '16:9' | '4:3' | '1:1' | '9:16') => {
    setSelectedRatio(ratio);
    if (ratio === 'full') {
      setCropBox({ x: 0, y: 0, w: 100, h: 100 });
      return;
    }

    if (!imageRef.current) return;
    const imgW = imageRef.current.naturalWidth || 100;
    const imgH = imageRef.current.naturalHeight || 100;

    let targetRatio = 16 / 9;
    if (ratio === '4:3') targetRatio = 4 / 3;
    if (ratio === '1:1') targetRatio = 1 / 1;
    if (ratio === '9:16') targetRatio = 9 / 16;

    const imgRatio = imgW / imgH;

    let newWPct = 80;
    let newHPct = 80;

    if (imgRatio > targetRatio) {
      newHPct = 80;
      const targetPixelW = (imgH * 0.8) * targetRatio;
      newWPct = (targetPixelW / imgW) * 100;
    } else {
      newWPct = 80;
      const targetPixelH = (imgW * 0.8) / targetRatio;
      newHPct = (targetPixelH / imgH) * 100;
    }

    newWPct = Math.min(100, Math.max(10, newWPct));
    newHPct = Math.min(100, Math.max(10, newHPct));

    const newX = (100 - newWPct) / 2;
    const newY = (100 - newHPct) / 2;

    setCropBox({
      x: Math.round(newX * 100) / 100,
      y: Math.round(newY * 100) / 100,
      w: Math.round(newWPct * 100) / 100,
      h: Math.round(newHPct * 100) / 100,
    });
  };

  // Trigger Auto Crop Handler
  const handleAutoCrop = () => {
    if (!imageRef.current) return;
    setIsAutoDetecting(true);
    setNoSceneFound(false);
    setDetectedFeedback(null);

    setTimeout(() => {
      try {
        if (!imageRef.current) return;
        const result = detectAnimeScene(imageRef.current);

        if (result) {
          setCropBox({
            x: result.x,
            y: result.y,
            w: result.w,
            h: result.h
          });
          setDetectedFeedback(result.detectedRatio || 'Detected Viewport');
          setTimeout(() => setDetectedFeedback(null), 3500);
        } else {
          setNoSceneFound(true);
          setTimeout(() => setNoSceneFound(false), 8000);
        }
      } catch (err) {
        setNoSceneFound(true);
      } finally {
        setIsAutoDetecting(false);
      }
    }, 150);
  };

  // High precision crop execution to original canvas
  const executeCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    if (!originalWidth || !originalHeight) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropPixelX = Math.round((cropBox.x / 100) * originalWidth);
    const cropPixelY = Math.round((cropBox.y / 100) * originalHeight);
    const cropPixelW = Math.max(10, Math.round((cropBox.w / 100) * originalWidth));
    const cropPixelH = Math.max(10, Math.round((cropBox.h / 100) * originalHeight));

    canvas.width = cropPixelW;
    canvas.height = cropPixelH;

    ctx.drawImage(
      img,
      cropPixelX,
      cropPixelY,
      cropPixelW,
      cropPixelH,
      0,
      0,
      cropPixelW,
      cropPixelH
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'cropped-scan.jpg', { type: 'image/jpeg' });
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(croppedFile, croppedUrl);
      }
    }, 'image/jpeg', 0.95);
  };

  const activePreset = RATIO_PRESETS.find(p => p.id === selectedRatio);

  return (
    <div className={cn(
      "w-full flex flex-col gap-3 relative",
      !embedded && "bg-zinc-950/90 p-4 sm:p-5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl",
      className
    )}>
      
      {/* Header toolbar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-orange-600/15 border border-orange-500/20 text-orange-500">
            <Crop size={14} strokeWidth={2} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Precision Crop Frame
          </span>
          {detectedFeedback && (
            <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in duration-200">
              <Check size={10} /> {detectedFeedback}
            </span>
          )}
        </div>
        <button 
          onClick={onCancel} 
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Cancel crop"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Controls Row: Auto Crop + Aspect Ratio Dropdown on Left | Zoom controls on Right */}
      <div className="flex items-center justify-between gap-2 w-full">
        {/* Left Side: Auto Crop + Dropdown + Reset */}
        <div className="flex items-center gap-2">
          {/* 1. AUTO CROP BUTTON (TEXT ONLY, NO ICON) */}
          <button
            type="button"
            onClick={handleAutoCrop}
            disabled={isAutoDetecting}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-orange-600/25 hover:bg-orange-600/40 text-orange-400 hover:text-orange-300 border border-orange-500/40 hover:border-orange-500/60 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(234,88,12,0.2)] active:scale-95 shrink-0"
            title="Auto-detect and crop anime scene viewport"
          >
            {isAutoDetecting && (
              <Loader2 size={12} className="animate-spin text-orange-400" />
            )}
            <span>Auto Crop</span>
          </button>

          {/* 2. ASPECT RATIO DROPDOWN MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                title="Select aspect ratio preset"
              >
                {activePreset ? activePreset.icon : <RectangleHorizontal size={13} className="text-zinc-400" />}
                <span>{activePreset ? activePreset.label : 'Ratio'}</span>
                <ChevronDown size={12} className="text-zinc-400 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-44 bg-[#121214]/95 border border-white/10 backdrop-blur-2xl text-zinc-300 shadow-2xl rounded-xl p-1 z-[100]"
            >
              {RATIO_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors
                    ${selectedRatio === preset.id ? 'bg-orange-500/20 text-orange-400 font-bold' : 'hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2">
                    {preset.icon}
                    <span>{preset.label}</span>
                  </div>
                  {selectedRatio === preset.id && (
                    <Check size={12} className="text-orange-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. RESET CROP BOX BUTTON */}
          <button
            type="button"
            onClick={() => {
              setSelectedRatio('full');
              applyPreset('full');
            }}
            className="p-1.5 text-zinc-400 hover:text-orange-400 hover:bg-white/5 rounded-xl transition-colors shrink-0"
            title="Reset crop to full image"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Right Side: Zoom Controls in the Same Row */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))}
            disabled={zoom <= 1}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-16 sm:w-20 md:w-24 h-1 accent-orange-500 bg-white/20 rounded cursor-pointer"
            title="Zoom image preview"
          />
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
            disabled={zoom >= 3}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <span className="text-[10px] font-mono text-orange-400 font-bold w-7 text-center select-none">
            {zoom.toFixed(1)}x
          </span>
          {zoom > 1 && (
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="text-[9px] font-mono text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10 transition-colors"
              title="Reset Zoom to 1x"
            >
              1x
            </button>
          )}
        </div>
      </div>

      {/* Interactive crop canvas container */}
      <div 
        className="w-full flex justify-center items-center bg-black/90 rounded-xl overflow-hidden border border-white/10 relative p-3 max-h-[55vh] custom-scrollbar min-h-[220px]"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            setZoom(z => Math.max(1, Math.min(3, +(z + delta).toFixed(2))));
          }
        }}
      >
        {/* Tiny Alert with illustration when No Anime Scene is found */}
        <AnimatePresence>
          {noSceneFound && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            >
              <div className="flex flex-col items-center text-center gap-2.5 bg-zinc-900/95 border border-red-500/40 p-4 sm:p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(239,68,68,0.2)] max-w-[320px]">
                {/* Tiny image illustration: minimal anime scanner with eyes and crosshair */}
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shadow-inner">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="26" height="22" rx="4" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Minimal anime eyes */}
                    <path d="M9 14C9 14 11 12 13 14" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="11" cy="15" r="1.2" fill="#F87171" />
                    <path d="M19 14C19 14 21 12 23 14" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="21" cy="15" r="1.2" fill="#F87171" />
                    {/* Slanted scanner beam line */}
                    <line x1="6" y1="23" x2="26" y2="9" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    no anime scene is found in this image
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Please upload an anime screenshot or drag the crop handles manually.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoSceneFound(false)}
                  className="mt-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Viewport Container */}
        <div 
          ref={containerRef} 
          className="relative select-none max-w-full max-h-full inline-block transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Target Image */}
          <img 
            ref={imageRef}
            src={imageSrc} 
            alt="To crop" 
            className="max-h-[48vh] max-w-full object-contain pointer-events-none block rounded-sm opacity-90 shadow-2xl"
            crossOrigin="anonymous"
          />

          {/* Semi-transparent dark overlay outside crop box */}
          <div 
            className="absolute inset-0 bg-black/75 pointer-events-none transition-opacity duration-300"
            style={{
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                ${cropBox.x}% ${cropBox.y}%, 
                ${cropBox.x}% ${cropBox.y + cropBox.h}%, 
                ${cropBox.x + cropBox.w}% ${cropBox.y + cropBox.h}%, 
                ${cropBox.x + cropBox.w}% ${cropBox.y}%, 
                ${cropBox.x}% ${cropBox.y}%
              )`
            }}
          />

          {/* ACTIVE CROP BOX */}
          <div 
            className="absolute border-2 border-orange-500 shadow-[0_0_0_1px_rgba(0,0,0,0.8),0_0_20px_rgba(234,88,12,0.4)] z-30"
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.w}%`,
              height: `${cropBox.h}%`,
            }}
          >
            {/* Rule of Thirds Guide Grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-orange-400/40" />
              <div className="border-r border-b border-orange-400/40" />
              <div className="border-b border-orange-400/40" />
              <div className="border-r border-b border-orange-400/40" />
              <div className="border-r border-b border-orange-400/40" />
              <div className="border-b border-orange-400/40" />
              <div className="border-r border-orange-400/40" />
              <div className="border-r border-orange-400/40" />
              <div />
            </div>

            {/* Draggable Body */}
            <div 
              className="absolute inset-0 cursor-move z-30 active:cursor-grabbing hover:bg-orange-500/10 transition-colors touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'drag')}
              title="Click and drag to reposition frame"
            />

            {/* ============================================================== */}
            {/* 1. EDGE RESIZE HANDLES (TOP, BOTTOM, LEFT, RIGHT)              */}
            {/* ============================================================== */}
            {/* Top Edge Handle (Vertical resize) */}
            <div 
              className="absolute -top-3 left-0 right-0 h-6 flex items-center justify-center cursor-ns-resize z-40 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'n')}
              title="Drag vertically to adjust top border"
            >
              <div className="w-10 h-1.5 bg-orange-500 rounded-full border border-white/80 shadow-[0_0_8px_rgba(234,88,12,0.8)] group-hover:scale-125 group-hover:bg-orange-400 transition-transform" />
            </div>

            {/* Bottom Edge Handle (Vertical resize) */}
            <div 
              className="absolute -bottom-3 left-0 right-0 h-6 flex items-center justify-center cursor-ns-resize z-40 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 's')}
              title="Drag vertically to adjust bottom border"
            >
              <div className="w-10 h-1.5 bg-orange-500 rounded-full border border-white/80 shadow-[0_0_8px_rgba(234,88,12,0.8)] group-hover:scale-125 group-hover:bg-orange-400 transition-transform" />
            </div>

            {/* Left Edge Handle (Horizontal resize) */}
            <div 
              className="absolute top-0 bottom-0 -left-3 w-6 flex items-center justify-center cursor-ew-resize z-40 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'w')}
              title="Drag horizontally to adjust left border"
            >
              <div className="h-10 w-1.5 bg-orange-500 rounded-full border border-white/80 shadow-[0_0_8px_rgba(234,88,12,0.8)] group-hover:scale-125 group-hover:bg-orange-400 transition-transform" />
            </div>

            {/* Right Edge Handle (Horizontal resize) */}
            <div 
              className="absolute top-0 bottom-0 -right-3 w-6 flex items-center justify-center cursor-ew-resize z-40 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'e')}
              title="Drag horizontally to adjust right border"
            >
              <div className="h-10 w-1.5 bg-orange-500 rounded-full border border-white/80 shadow-[0_0_8px_rgba(234,88,12,0.8)] group-hover:scale-125 group-hover:bg-orange-400 transition-transform" />
            </div>

            {/* ============================================================== */}
            {/* 2. CORNER RESIZE HANDLES (NW, NE, SE, SW)                     */}
            {/* ============================================================== */}
            {/* Top-Left */}
            <div 
              className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center cursor-nwse-resize z-50 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'nw')}
              title="Drag corner to resize diagonally"
            >
              <div className="w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(234,88,12,0.9)] group-hover:scale-125 transition-transform" />
            </div>

            {/* Top-Right */}
            <div 
              className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center cursor-nesw-resize z-50 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'ne')}
              title="Drag corner to resize diagonally"
            >
              <div className="w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(234,88,12,0.9)] group-hover:scale-125 transition-transform" />
            </div>

            {/* Bottom-Right */}
            <div 
              className="absolute -bottom-2 -right-2 w-5 h-5 flex items-center justify-center cursor-nwse-resize z-50 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'se')}
              title="Drag corner to resize diagonally"
            >
              <div className="w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(234,88,12,0.9)] group-hover:scale-125 transition-transform" />
            </div>

            {/* Bottom-Left */}
            <div 
              className="absolute -bottom-2 -left-2 w-5 h-5 flex items-center justify-center cursor-nesw-resize z-50 group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'sw')}
              title="Drag corner to resize diagonally"
            >
              <div className="w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(234,88,12,0.9)] group-hover:scale-125 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={executeCrop}
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_25px_rgba(234,88,12,0.6)]"
        >
          <Check size={16} strokeWidth={2.5} /> Apply Precision Crop
        </button>
      </div>
    </div>
  );
}

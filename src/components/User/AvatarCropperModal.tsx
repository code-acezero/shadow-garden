"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FantasyFrame from './FantasyFrame';

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  activeFrameId?: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export default function AvatarCropperModal({
  isOpen,
  imageSrc,
  activeFrameId = 'default',
  onClose,
  onCropComplete,
}: AvatarCropperModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset controls when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    try {
      let img = new Image();
      let isCorsOk = false;

      // Try loading with CORS first
      try {
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        await new Promise((resolve, reject) => {
          img.onload = () => { isCorsOk = true; resolve(true); };
          img.onerror = reject;
        });
      } catch (corsErr) {
        // If CORS fails, load standard image without crossOrigin
        img = new Image();
        img.src = imageSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }

      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      // Draw circular mask background
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Compute display bounds inside 240px container
      const containerSize = 240;
      const scaleFactor = size / containerSize;

      const drawWidth = (img.width || size) * (containerSize / (img.width || size)) * zoom * scaleFactor;
      const drawHeight = (img.height || size) * (containerSize / (img.height || size)) * zoom * scaleFactor;

      const drawX = (size / 2) - (drawWidth / 2) + (position.x * scaleFactor);
      const drawY = (size / 2) - (drawHeight / 2) + (position.y * scaleFactor);

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      let croppedDataUrl = imageSrc;
      try {
        croppedDataUrl = canvas.toDataURL('image/png', 0.95);
      } catch (taintedErr) {
        console.warn('Canvas tainted by CORS, returning original imageSrc:', taintedErr);
      }

      onCropComplete(croppedDataUrl);
    } catch (err) {
      console.error('Failed to crop image:', err);
      onCropComplete(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#0a0a12]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden mx-auto text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10 shrink-0">
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <Crop size={16} className="text-primary" /> Reposition & Crop Avatar
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Drag to adjust position, slider to zoom</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Interactive Viewport */}
          <div className="p-6 flex flex-col items-center justify-center bg-black/40">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="relative w-[240px] h-[240px] rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] cursor-grab active:cursor-grabbing select-none group touch-none bg-zinc-950"
            >
              {/* Image element */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                }}
              >
                <img
                  ref={imageRef}
                  src={imageSrc || 'https://cdn.myanimelist.net/images/characters/9/310307.jpg'}
                  alt="Avatar Crop Preview"
                  referrerPolicy="no-referrer"
                  className="max-w-none max-h-none w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              {/* Grid Lines Overlay */}
              <div className="absolute inset-0 border border-white/10 rounded-full pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30 group-hover:opacity-60 transition-opacity">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>

              {/* Drag Hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/20">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white shadow-lg">
                  <Move size={12} /> Drag to Reposition
                </span>
              </div>

              {/* Equipped Fantasy Frame Preview */}
              {activeFrameId && activeFrameId !== 'default' && activeFrameId !== 'none' && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <FantasyFrame frameId={activeFrameId} transparentBg className="w-full h-full scale-[1.15]">
                    <div className="w-full h-full" />
                  </FantasyFrame>
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="w-full mt-6 space-y-3 px-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ZoomIn size={14} className="text-primary" /> Zoom Level: {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors"
                >
                  <ZoomOut size={14} />
                </button>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-primary h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />

                <button
                  onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-primary/25 flex items-center gap-1.5 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Check size={14} strokeWidth={3} /> Save Avatar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}

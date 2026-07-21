"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Crop, X, Check } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File, croppedUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Selection box state (percentages relative to image container size)
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw', 'ne', 'se', 'sw'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  // Reset crop box when image changes
  useEffect(() => {
    setCropBox({ x: 0, y: 0, w: 100, h: 100 });
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      boxX: cropBox.x,
      boxY: cropBox.y,
      boxW: cropBox.w,
      boxH: cropBox.h
    });

    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(action);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const deltaXPct = ((currentX - dragStart.x) / rect.width) * 100;
      const deltaYPct = ((currentY - dragStart.y) / rect.height) * 100;

      if (isDragging) {
        let newX = dragStart.boxX + deltaXPct;
        let newY = dragStart.boxY + deltaYPct;

        // Boundary checks
        newX = Math.max(0, Math.min(100 - cropBox.w, newX));
        newY = Math.max(0, Math.min(100 - cropBox.h, newY));

        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        let newX = cropBox.x;
        let newY = cropBox.y;
        let newW = cropBox.w;
        let newH = cropBox.h;

        if (isResizing.includes('w')) {
          const rightPct = dragStart.boxX + dragStart.boxW;
          newX = Math.max(0, Math.min(rightPct - 10, dragStart.boxX + deltaXPct));
          newW = rightPct - newX;
        }
        if (isResizing.includes('e')) {
          newW = Math.max(10, Math.min(100 - dragStart.boxX, dragStart.boxW + deltaXPct));
        }
        if (isResizing.includes('n')) {
          const bottomPct = dragStart.boxY + dragStart.boxH;
          newY = Math.max(0, Math.min(bottomPct - 10, dragStart.boxY + deltaYPct));
          newH = bottomPct - newY;
        }
        if (isResizing.includes('s')) {
          newH = Math.max(10, Math.min(100 - dragStart.boxY, dragStart.boxH + deltaYPct));
        }

        setCropBox({ x: newX, y: newY, w: newW, h: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, cropBox]);

  const executeCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    // Load original image to extract clean original coordinates
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Original image dimensions
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;

    // Calculate crop box coordinates in pixels relative to original image size
    const cropPixelX = (cropBox.x / 100) * originalWidth;
    const cropPixelY = (cropBox.y / 100) * originalHeight;
    const cropPixelW = (cropBox.w / 100) * originalWidth;
    const cropPixelH = (cropBox.h / 100) * originalHeight;

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

  return (
    <div className="w-full flex flex-col gap-4 bg-zinc-950/80 p-4 border border-white/10 rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
          <Crop size={14} className="text-orange-500" /> Adjust Scan Frame
        </span>
        <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="w-full flex justify-center bg-black/50 rounded-xl overflow-hidden border border-white/5 relative max-h-[60vh]">
        <div 
          ref={containerRef}
          className="relative select-none cursor-crosshair inline-block max-w-full max-h-[60vh]"
        >
          <img 
            ref={imageRef}
            src={imageSrc} 
            alt="Original preview" 
            className="block max-w-full max-h-[60vh] w-auto h-auto pointer-events-none opacity-50"
          />

        {/* Drag/Crop overlay selector box */}
        <div 
          className="absolute border-2 border-orange-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] cursor-move"
          style={{
            left: `${cropBox.x}%`,
            top: `${cropBox.y}%`,
            width: `${cropBox.w}%`,
            height: `${cropBox.h}%`
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          {/* Corner resize handles */}
          <div 
            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-orange-500 border border-white rounded-full cursor-nwse-resize z-50"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div 
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-orange-500 border border-white rounded-full cursor-nesw-resize z-50"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div 
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-orange-500 border border-white rounded-full cursor-nwse-resize z-50"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />
          <div 
            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-orange-500 border border-white rounded-full cursor-nesw-resize z-50"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />

          {/* Grid visual lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
            <div className="border-r border-dashed border-white"></div>
            <div className="border-r border-dashed border-white"></div>
            <div></div>
            <div className="border-b border-dashed border-white col-span-3"></div>
            <div className="border-b border-dashed border-white col-span-3"></div>
          </div>
        </div>
      </div>
    </div>

      <div className="flex gap-2">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={executeCrop}
          className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]"
        >
          <Check size={14} /> Apply Crop
        </button>
      </div>
    </div>
  );
}

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface LightboxProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ src, isOpen, onClose }: LightboxProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out"
        onClick={onClose}
      >
        <motion.div 
          className="absolute top-6 right-6 flex gap-4 z-[310]"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" onClick={(e) => { e.stopPropagation(); window.open(src, '_blank'); }}>
            <Download size={20} />
          </button>
          <button className="p-2 bg-primary-600 rounded-full hover:bg-primary-700 text-white transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </motion.div>

        <motion.img
          src={src}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
}
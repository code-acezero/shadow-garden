"use client";

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class LandingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[LandingPage] Client error caught by boundary:", error, errorInfo);
  }

  handleReset = async () => {
    if (typeof window !== 'undefined') {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch (_) {}
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#050508] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full flex flex-col items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-400 bg-primary-950/50 border border-primary-500/30 px-3 py-1 rounded-full mb-4">
              Sanctuary Gateway
            </span>
            <h1 className="text-3xl font-extrabold font-lemon mb-2 text-white tracking-widest">SHADOW GARDEN</h1>
            <p className="text-zinc-400 text-sm mb-6 max-w-xs leading-relaxed">
              Encountered a gateway transition anomaly. Enter the sanctuary directly or reload.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReset}
                className="py-2.5 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wide border border-white/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw size={14} /> Reload
              </button>
              <Link
                href="/home"
                className="py-2.5 px-6 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Enter Home</span> <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

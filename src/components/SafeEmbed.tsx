"use client";
import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import IframeAdShield from "@/components/Player/IframeAdShield";

interface SafeEmbedProps {
  url: string;
}

export default function SafeEmbed({ url }: SafeEmbedProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // No sandbox attribute = No restrictions.
  // The player has full control, so ads will show, but the video will definitely play.
  // IframeAdShield handles popup/redirect blocking from the parent window side.

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">

      {hasStarted && iframeLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-[2px] p-4 rounded-full shadow-xl animate-in fade-in zoom-in-90 duration-300">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>
      )}

      {hasStarted && (
        <IframeAdShield
          className="absolute inset-0 w-full h-full"
        >
          <iframe
            src={url}
            onLoad={() => setIframeLoading(false)}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="Embed Player"
          />
        </IframeAdShield>
      )}

      {/* ── Click-to-Play screen (acts as first-click ad absorber) ── */}
      {!hasStarted && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 cursor-pointer"
          onClick={() => setHasStarted(true)}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-primary-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            <div className="relative bg-white text-black p-5 rounded-full shadow-2xl transform group-hover:scale-110 transition-transform duration-200">
              <Play fill="currentColor" className="w-8 h-8 ml-1" />
            </div>
          </div>
          <p className="mt-6 text-gray-200 font-medium text-lg tracking-wide">Click to Play</p>
        </div>
      )}
    </div>
  );
}
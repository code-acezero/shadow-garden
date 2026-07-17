"use client";
import { useState } from "react";
import { Play } from "lucide-react";

interface SafeEmbedProps {
  url: string;
}

export default function SafeEmbed({ url }: SafeEmbedProps) {
  const [hasStarted, setHasStarted] = useState(false);

  // No sandbox attribute = No restrictions.
  // The player has full control, so ads will show, but the video will definitely play.

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
      
      <iframe
        src={url}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
           hasStarted ? "opacity-100" : "opacity-0"
        }`}
        allowFullScreen
        loading="lazy"
        // 'allow' ensures modern browser features like fullscreen and encrypted media work
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />

      {/* --- START OVERLAY --- */}
      {/* We keep this just to make the UI look clean until the user is ready */}
      {!hasStarted && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 cursor-pointer"
          onClick={() => setHasStarted(true)}
        >
            <div className="relative group">
                <div className="absolute inset-0 bg-primary-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
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
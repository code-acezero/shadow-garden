"use client";

import React, { useEffect, useState, useRef } from 'react';
import { X, Trash2, Pause, Play } from 'lucide-react';

interface Log {
  id: number;
  timestamp: string;
  stage: string;
  message: string;
  data?: string;
}

export default function AuthDebugger() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLog = (e: any) => {
      if (isPaused) return;
      setLogs(prev => [...prev, e.detail]);
    };

    window.addEventListener('shadow-auth-debug', handleLog);
    return () => window.removeEventListener('shadow-auth-debug', handleLog);
  }, [isPaused]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-[600px] h-[300px] bg-black/95 border-t-2 border-red-600 z-[9999] flex flex-col shadow-2xl font-mono text-xs">
      <div className="flex items-center justify-between p-2 bg-red-900/20 border-b border-white/10">
        <span className="text-red-500 font-bold uppercase tracking-widest">Shadow Auth Trace</span>
        <div className="flex gap-2">
          <button onClick={() => setIsPaused(!isPaused)} className="p-1 hover:bg-white/10 rounded text-zinc-400">
            {isPaused ? <Play size={14}/> : <Pause size={14}/>}
          </button>
          <button onClick={() => setLogs([])} className="p-1 hover:bg-white/10 rounded text-red-400">
            <Trash2 size={14}/>
          </button>
          <button onClick={() => setLogs([])} className="p-1 hover:bg-white/10 rounded text-zinc-400">
            <X size={14}/>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="border-b border-white/5 pb-1">
            <div className="flex gap-2">
              <span className="text-zinc-500">[{log.timestamp}]</span>
              <span className="text-yellow-500 font-bold">[{log.stage}]</span>
              <span className="text-white">{log.message}</span>
            </div>
            {log.data && (
              <pre className="mt-1 bg-white/5 p-1 rounded text-green-400 overflow-x-auto">
                {log.data}
              </pre>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
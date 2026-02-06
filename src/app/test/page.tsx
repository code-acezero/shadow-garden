"use client";

import { useState, useEffect, useRef } from 'react';
import SimpleHLSPlayer from '@/components/Player/SimpleHLSPlayer';
import { 
  Activity, 
  Server, 
  ShieldCheck, 
  ShieldAlert, 
  Terminal, 
  Play, 
  RefreshCw, 
  Code,
  Clock,
  Wifi
} from 'lucide-react';

// ==========================================
// CONFIGURATION & TEST DATA
// ==========================================

const DEFAULT_STREAM = {
  name: "HiAnime / StormShade (Requires Proxy)",
  // Use the specific URL that was failing for you before
  url: "https://stormshade84.live/_v7/d8e56d406f04d29b74b4e03042fca324d71f0cd196c65f1fcb9c6d27377df7bd17b6ce13536ee8f21bbfe92902b58f639455ccab8671ba0aa00782c152a6b8084cc518d7e32b2415bbe87dad7d55eb0736a3a15011d0533eceafe7a5841fde57bf868c98b776c63a5d23bbb687bf37df7365905359f738d51b40f6138f9e5d77/master.m3u8",
  type: "hls",
  requiresProxy: true
};

const PUBLIC_STREAMS = [
  {
    name: "Big Buck Bunny (No Proxy Needed)",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    requiresProxy: false
  },
  {
    name: "Apple BipBop (No Proxy Needed)",
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8",
    requiresProxy: false
  }
];

// ==========================================
// COMPONENT
// ==========================================

export default function TestPage() {
  // State
  const [targetUrl, setTargetUrl] = useState(DEFAULT_STREAM.url);
  const [proxyUrl, setProxyUrl] = useState('');
  const [useProxy, setUseProxy] = useState(true);
  
  // Diagnostics
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [logs, setLogs] = useState<Array<{time: string, type: 'info'|'success'|'error'|'warn', msg: string}>>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<string>('');

  // Auto-update proxy URL
  useEffect(() => {
    if (useProxy) {
      setProxyUrl(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
    } else {
      setProxyUrl(targetUrl);
    }
  }, [targetUrl, useProxy]);

  // Logger Helper
  const addLog = (msg: string, type: 'info'|'success'|'error'|'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
    setLogs(prev => [...prev, { time, type, msg }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setAnalysis(null);
    setRawResponse('');
  };

  // ------------------------------------------
  // THE DIAGNOSTIC ENGINE
  // ------------------------------------------
  const runDiagnostics = async () => {
    setIsRunningTests(true);
    clearLogs();
    
    addLog(`🚀 STARTING DIAGNOSTICS FOR:`, 'info');
    addLog(`Target: ${targetUrl.substring(0, 60)}...`, 'info');
    
    const testUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    const startTime = performance.now();

    try {
      // 1. Connection Test
      addLog(`📡 Initiating Fetch to Proxy...`, 'info');
      const response = await fetch(testUrl);
      const latency = Math.round(performance.now() - startTime);
      
      addLog(`✅ Response received in ${latency}ms`, 'success');
      addLog(`HTTP Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');

      // 2. Header Analysis
      const contentType = response.headers.get('content-type');
      const accessControl = response.headers.get('access-control-allow-origin');
      
      addLog(`Headers detected:`, 'info');
      addLog(`- Content-Type: ${contentType}`, 'info');
      addLog(`- CORS (Access-Control): ${accessControl || 'MISSING'}`, accessControl ? 'success' : 'warn');

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      // 3. Payload Analysis
      let bodyText = '';
      const isPlaylist = contentType?.includes('mpegurl') || contentType?.includes('text');

      if (isPlaylist) {
        bodyText = await response.text();
        setRawResponse(bodyText);
        addLog(`📂 Payload is Text/Playlist (${bodyText.length} chars)`, 'info');

        // 4. Rewriting Logic Check
        const rewriteCheck = bodyText.includes('/api/proxy?url=');
        const count = (bodyText.match(/\/api\/proxy\?url=/g) || []).length;

        if (rewriteCheck) {
          addLog(`✅ REWRITING SUCCESSFUL! Found ${count} proxied links.`, 'success');
        } else {
          addLog(`❌ CRITICAL: No rewritten links found. Proxy is in Pass-Through mode?`, 'error');
        }

        // 5. Origin Lock Check (Heuristic)
        const hasExtKey = bodyText.includes('#EXT-X-KEY');
        if (hasExtKey) {
           addLog(`🔐 Encryption detected (#EXT-X-KEY). Checking key rewriting...`, 'warn');
           if(bodyText.includes('URI="/api/proxy')) {
             addLog(`✅ Key URIs are correctly proxied.`, 'success');
           } else {
             addLog(`❌ Keys are NOT proxied. Playback will fail.`, 'error');
           }
        }

        setAnalysis({
          status: response.status,
          latency,
          isRewritten: rewriteCheck,
          rewriteCount: count,
          contentType
        });

      } else {
        // Binary content
        const blob = await response.blob();
        addLog(`📦 Payload is Binary/Video (${blob.size} bytes)`, 'info');
        setAnalysis({
          status: response.status,
          latency,
          isRewritten: false,
          contentType,
          size: blob.size
        });
      }

    } catch (error: any) {
      addLog(`🔥 FATAL ERROR: ${error.message}`, 'error');
    } finally {
      setIsRunningTests(false);
      addLog(`🏁 Diagnostics Complete.`, 'info');
    }
  };

  // ------------------------------------------
  // UI RENDER
  // ------------------------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* HEADER */}
        <div className="lg:col-span-12 flex justify-between items-end border-b border-gray-800 pb-6 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Activity className="text-primary-500" /> 
              Shadow Garden <span className="text-gray-600">Diagnostics</span>
            </h1>
            <p className="text-sm text-gray-400 mt-2">Advanced HLS Proxy Debugger & Signal Analyzer</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setTargetUrl(DEFAULT_STREAM.url); setUseProxy(true); }}
              className="px-4 py-2 bg-primary-900/20 border border-primary-800 text-primary-400 rounded hover:bg-primary-900/40 transition-colors text-xs font-medium"
            >
              Load HiAnime Stream
            </button>
            <button 
              onClick={() => { setTargetUrl(PUBLIC_STREAMS[0].url); setUseProxy(false); }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded hover:bg-gray-700 transition-colors text-xs font-medium"
            >
              Load Public Test
            </button>
          </div>
        </div>

        {/* LEFT COLUMN: Controls & Logs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CONFIG PANEL */}
          <div className="bg-[#111] rounded-lg border border-gray-800 p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" /> Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Target M3U8 URL</label>
                <input 
                  type="text" 
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between bg-black/30 p-3 rounded border border-gray-800">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${useProxy ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
                   <span className="text-sm font-medium">Route through Proxy</span>
                </div>
                <button 
                  onClick={() => setUseProxy(!useProxy)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${useProxy ? 'bg-green-900' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useProxy ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <button 
                onClick={runDiagnostics}
                disabled={isRunningTests}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:opacity-50 text-white font-medium rounded shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all"
              >
                {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Run Full Diagnostics
              </button>
            </div>
          </div>

          {/* LIVE LOGS TERMINAL */}
          <div className="bg-[#0f0f0f] rounded-lg border border-gray-800 shadow-xl flex flex-col h-[400px]">
            <div className="p-3 border-b border-gray-800 bg-[#161616] flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Live Terminal
              </h3>
              <button onClick={clearLogs} className="text-[10px] text-gray-500 hover:text-white uppercase">Clear</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar">
              {logs.length === 0 && (
                <div className="text-gray-700 text-center mt-20 italic">
                  Ready to analyze network traffic...
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-gray-600 shrink-0">[{log.time}]</span>
                  <span className={`${
                    log.type === 'error' ? 'text-primary-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'warn' ? 'text-yellow-400' : 'text-blue-300'
                  }`}>
                    {log.type === 'success' && '✓ '}
                    {log.type === 'error' && '✕ '}
                    {log.type === 'warn' && '⚠ '}
                    {log.msg}
                  </span>
                </div>
              ))}
              {/* Dummy div to scroll to bottom */}
              <div />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Player & Analysis */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PLAYER */}
          <div className="bg-black rounded-lg border border-gray-800 overflow-hidden shadow-2xl relative">
             <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur px-3 py-1 rounded text-[10px] font-mono border border-gray-700 text-gray-300">
               {useProxy ? 'PROXY MODE' : 'DIRECT MODE'}
             </div>
             
             {/* Use the SimpleHLSPlayer we created earlier */}
             <SimpleHLSPlayer url={proxyUrl} />
          </div>

          {/* ANALYSIS GRID */}
          {analysis && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111] p-4 rounded border border-gray-800">
                 <div className="text-gray-500 text-[10px] uppercase mb-1 flex items-center gap-1"><Wifi className="w-3 h-3"/> Latency</div>
                 <div className={`text-xl font-mono ${analysis.latency < 500 ? 'text-green-400' : 'text-yellow-400'}`}>
                   {analysis.latency}ms
                 </div>
              </div>
              <div className="bg-[#111] p-4 rounded border border-gray-800">
                 <div className="text-gray-500 text-[10px] uppercase mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Rewriter</div>
                 <div className={`text-xl font-mono ${analysis.isRewritten ? 'text-green-400' : 'text-primary-400'}`}>
                   {analysis.isRewritten ? 'ACTIVE' : 'INACTIVE'}
                 </div>
              </div>
              <div className="bg-[#111] p-4 rounded border border-gray-800">
                 <div className="text-gray-500 text-[10px] uppercase mb-1 flex items-center gap-1"><Code className="w-3 h-3"/> Links Found</div>
                 <div className="text-xl font-mono text-blue-400">
                   {analysis.rewriteCount || 0}
                 </div>
              </div>
            </div>
          )}

          {/* RAW RESPONSE VIEWER */}
          {rawResponse && (
            <div className="bg-[#111] rounded-lg border border-gray-800 overflow-hidden">
               <div className="p-3 border-b border-gray-800 bg-[#161616] flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Code className="w-4 h-4" /> Raw Output Preview
                </h3>
              </div>
              <pre className="p-4 overflow-x-auto text-[10px] font-mono text-gray-400 leading-relaxed max-h-[300px] custom-scrollbar">
                {rawResponse}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
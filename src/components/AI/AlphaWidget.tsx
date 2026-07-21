"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, X, ScanSearch, Upload, Search, Play, Crop } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { cn } from '@/lib/utils';
import { AnimeService } from '@/lib/api';
import { MoeAPI } from '@/lib/moeApi';
import ImageCropper from '@/components/AI/ImageCropper';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

const GIF_DICTIONARY: Record<string, string> = {
    happy: 'https://media.tenor.com/1vHg3ktQUWAAAAAM/anime-alpha.gif',
    angry: 'https://media.tenor.com/zcJsktSHd28AAAAM/anime-alpha.gif',
    sad: 'https://media.tenor.com/NJXqfuIys3cAAAAM/kagejitsu-kage-no-jitsuryokusha.gif',
    think: 'https://media.tenor.com/wQ6dAx9kne8AAAAM/the-eminence-in-shadow-teis.gif',
    laugh: 'https://media.tenor.com/QOvRXPjYT8QAAAAM/the-emience-in-shadow-shadow-garden.gif',
    shock: 'https://media.tenor.com/15DPtw1X1GsAAAAM/eminence-in-shadow-alpha-eminence-in-shadow.gif',
    nod: 'https://media.tenor.com/A4DlVvtejMYAAAAM/anime-alpha.gif',
    bow: 'https://media.tenor.com/l54ao_3RxWkAAAAM/anime-alpha.gif',
    combat: 'https://media.tenor.com/TN5HWx681wsAAAAM/anime-shadow-alpha.gif',
    smug: 'https://media.tenor.com/hy564OjfONgAAAAM/eminence-in-shadow-alpha.gif'
};

const STICKER_DICTIONARY: Record<string, string> = {
    cute: 'https://media.tenor.com/1vHg3ktQUWAAAAAM/anime-alpha.gif',
    smile: 'https://media.tenor.com/QOvRXPjYT8QAAAAM/the-emience-in-shadow-shadow-garden.gif',
    pout: 'https://media.tenor.com/zcJsktSHd28AAAAM/anime-alpha.gif',
    salute: 'https://media.tenor.com/l54ao_3RxWkAAAAM/anime-alpha.gif',
    wink: 'https://media.tenor.com/hy564OjfONgAAAAM/eminence-in-shadow-alpha.gif'
};

function extractStateAndContent(text: string, currentState: string) {
    const stateRegex = /\[state:\s*([a-zA-Z0-9_-]+)\]/i;
    const actionRegex = /\[action:\s*([a-zA-Z0-9_-]+)\]/i;
    const gifRegex = /\[gif:\s*([a-zA-Z0-9_-]+)\]/i;
    const stickerRegex = /\[sticker:\s*([a-zA-Z0-9_-]+)\]/i;

    let match = text.match(stateRegex);
    let actionMatch = text.match(actionRegex);
    let gifMatch = text.match(gifRegex);
    let stickerMatch = text.match(stickerRegex);

    let cleanText = text;
    let newState = currentState;
    let action = null;
    let detectedMedia: { type: 'gif' | 'sticker', url: string } | null = null;

    if (match) {
        newState = match[1].toLowerCase().trim();
        cleanText = cleanText.replace(stateRegex, '').trim();
    }

    if (actionMatch) {
        action = actionMatch[1].toLowerCase();
        cleanText = cleanText.replace(actionRegex, '').trim();
    }

    const validStates = ['bow', 'error', 'explain', 'greet', 'guard', 'relax', 'success', 'surprise', 'think', 'whisper'];
    if (!validStates.includes(newState)) {
        newState = 'relax';
    }

    if (stickerMatch) {
        const s = stickerMatch[1].toLowerCase().trim();
        if (STICKER_DICTIONARY[s]) {
            detectedMedia = { type: 'sticker', url: STICKER_DICTIONARY[s] };
        }
        cleanText = cleanText.replace(stickerRegex, '').trim();
    } else if (gifMatch) {
        const g = gifMatch[1].toLowerCase().trim();
        if (GIF_DICTIONARY[g]) {
            detectedMedia = { type: 'gif', url: GIF_DICTIONARY[g] };
        }
        cleanText = cleanText.replace(gifRegex, '').trim();
    }

    return { cleanText, newState, action, detectedMedia };
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function ImageSearchPanel({ onClose, onResultFound }: { onClose: () => void, onResultFound: (text: string) => void }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file.');
            return;
        }
        const url = URL.createObjectURL(file);
        setRawImageSrc(url);
        setPreviewUrl(url);
        setSelectedFile(file);
        setIsCropping(false);
        setError(null);
    };

    const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
        setSelectedFile(croppedFile);
        setPreviewUrl(croppedUrl);
        setIsCropping(false);
        setResults([]);
    };

    const doSearch = async () => {
        if (!selectedFile) return;
        setLoading(true);
        setError(null);
        try {
            const moeRes = await MoeAPI.searchByImage(selectedFile, { anilistInfo: true });
            if (moeRes.error) throw new Error(moeRes.error);
            if (!moeRes.result || moeRes.result.length === 0) throw new Error("No matches found.");

            const uniqueResults = moeRes.result.filter((r: any, idx: number, arr: any[]) =>
                arr.findIndex((x: any) => (x.anilist as any)?.id === (r.anilist as any)?.id) === idx
            ).slice(0, 3);

            const mappedResults = await Promise.all(uniqueResults.map(async (res: any) => {
                const anilistInfo = res.anilist as any;
                const title = anilistInfo?.title?.romaji || anilistInfo?.title?.english || anilistInfo?.title?.native || "Unknown";

                let matchedId = null;
                let displayTitle = title;
                let image = res.image;
                let ep = res.episode;
                let targetUrl = '';

                try {
                    const anikotoRes = await AnimeService.search(title, 1);
                    if (anikotoRes && anikotoRes.results && anikotoRes.results.length > 0) {
                        matchedId = anikotoRes.results[0].id;
                        displayTitle = anikotoRes.results[0].title || title;
                        image = anikotoRes.results[0].poster || res.image;
                        targetUrl = `/watch/${matchedId}?ep=${res.episode}&t=${Math.floor(res.from)}`;
                    }
                } catch (err) { console.error("Anikoto align failed", err); }

                return {
                    id: matchedId || (res.anilist as any).id,
                    title: displayTitle,
                    image: image,
                    episode: ep,
                    similarity: Math.round(res.similarity * 100),
                    videoPreview: res.video,
                    targetUrl: targetUrl,
                    timeStr: formatTime(res.from)
                };
            }));

            setResults(mappedResults.slice(0, 1));
            if (mappedResults.length > 0) {
                const best = mappedResults[0];
                onResultFound(`[System Instruction: Visual scan complete. Match found: "${best.title}" with ${best.similarity}% accuracy, Episode ${best.episode || '1'}, Timestamp ${best.timeStr}. You MUST immediately explain this match in full detail to Master Shadow: state the title, match percentage, episode, timestamp, and give a brief overview/synopsis of the anime. Do NOT ask for email or credentials.]`);
            }
        } catch (err: any) {
            setError(err.message || 'Image search failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col p-4 lg:p-6 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-black text-lg uppercase tracking-widest flex items-center gap-2">
                    <ScanSearch className="text-orange-500" /> Visual Scanner
                </h3>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 relative z-10">
                {isCropping && rawImageSrc ? (
                    <ImageCropper
                        imageSrc={rawImageSrc}
                        onCropComplete={handleCropComplete}
                        onCancel={() => setIsCropping(false)}
                    />
                ) : (
                    <>
                        {!previewUrl ? (
                            <div
                                className={`w-full h-48 lg:h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${dragActive ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/20 hover:border-white/40 hover:bg-white/5 text-zinc-400'}`}
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Upload size={24} />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-wider text-center px-4">
                                    Drop image here or click to browse
                                </p>
                            </div>
                        ) : (
                            <div className="w-full relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video flex-shrink-0 group/preview">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => setIsCropping(true)} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold text-xs uppercase flex items-center gap-1 transition-all">
                                        <Crop size={12} /> Crop
                                    </button>
                                    <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); setResults([]); }} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold text-xs uppercase flex items-center gap-1 transition-all">
                                        <X size={12} /> Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        {previewUrl && !results.length && !loading && (
                            <button onClick={doSearch} className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(234,88,12,0.3)] shrink-0">
                                <Search size={18} /> Initiate Scan
                            </button>
                        )}
                    </>
                )}

                {loading && (
                    <div className="w-full py-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 animate-pulse">Analyzing visual data...</p>
                    </div>
                )}

                {error && (
                    <div className="w-full p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-400 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                {results.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mt-2">Scan Results</h4>
                        {results.map((res, i) => (
                            <div key={i} className="flex gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
                                <img src={res.image} className="w-20 h-24 object-cover rounded-lg border border-white/10" alt="match" />
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h5 className="text-white font-bold text-sm truncate">{res.title}</h5>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400 font-medium">
                                            <span className="text-green-400 font-black">{res.similarity}% Match</span>
                                            {res.episode && <span>Ep {res.episode}</span>}
                                            {res.timeStr && <span>at {res.timeStr}</span>}
                                        </div>
                                    </div>
                                    {res.targetUrl ? (
                                        <button onClick={() => router.push(res.targetUrl)} className="w-full py-2 bg-white/10 hover:bg-primary-600 text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
                                            <Play size={12} fill="currentColor" /> Watch Now
                                        </button>
                                    ) : (
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mt-2 bg-black/30 p-1.5 rounded text-center">
                                            Not in database
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const FIREFLIES = Array.from({ length: 14 }).map((_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 4) + 3,
    initialX: `${(i * 7 + 10) % 90}%`,
    initialY: `${(i * 11 + 15) % 85}%`,
    deltaX: [0, (i % 2 === 0 ? 40 : -40), (i % 3 === 0 ? -30 : 30), 0],
    deltaY: [0, (i % 3 === 0 ? -50 : 50), (i % 2 === 0 ? 30 : -30), 0],
    duration: (i % 5) + 7,
    delay: (i % 4) * 0.8,
    glowColor: i % 2 === 0 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(234, 88, 12, 0.9)',
}));

function DesktopFireflies() {
    return (
        <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden z-20">
            {FIREFLIES.map((ff) => (
                <motion.div
                    key={ff.id}
                    className="absolute rounded-full"
                    style={{
                        width: ff.size,
                        height: ff.size,
                        left: ff.initialX,
                        top: ff.initialY,
                        backgroundColor: '#fbbf24',
                        boxShadow: `0 0 ${ff.size * 2.5}px ${ff.glowColor}, 0 0 ${ff.size * 5}px ${ff.glowColor}`,
                    }}
                    animate={{
                        x: ff.deltaX,
                        y: ff.deltaY,
                        opacity: [0.1, 0.85, 0.3, 0.9, 0.1],
                        scale: [0.8, 1.25, 0.85, 1.3, 0.8],
                    }}
                    transition={{
                        duration: ff.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: ff.delay,
                    }}
                />
            ))}
        </div>
    );
}

export default function AlphaWidget() {
    const { profile } = useAuth();
    const { library } = useUserData();
    const pathname = usePathname();
    const userName = profile?.username || 'Shadow';
    const displayName = profile?.username || 'TRAVELLER';

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState('greet');
    const [activeMedia, setActiveMedia] = useState<{ type: 'gif' | 'sticker'; url: string } | null>(null);
    const [showImageSearch, setShowImageSearch] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const PLACEHOLDER_PROMPTS = [
        "Awaiting orders, Lord Shadow...",
        "Ask Alpha for anime recommendations...",
        "Search by image or upload a screenshot...",
        "Request dark fantasy or trending movies...",
        "Ask to find episodes, seasons, or series...",
        "Command Shadow Garden AI..."
    ];

    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [currentPlaceholder, setCurrentPlaceholder] = useState("");
    const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(true);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const targetText = PLACEHOLDER_PROMPTS[placeholderIndex];

        if (isTypingPlaceholder) {
            if (currentPlaceholder.length < targetText.length) {
                timeout = setTimeout(() => {
                    setCurrentPlaceholder(targetText.slice(0, currentPlaceholder.length + 1));
                }, 55);
            } else {
                timeout = setTimeout(() => {
                    setIsTypingPlaceholder(false);
                }, 2200);
            }
        } else {
            if (currentPlaceholder.length > 0) {
                timeout = setTimeout(() => {
                    setCurrentPlaceholder(currentPlaceholder.slice(0, currentPlaceholder.length - 1));
                }, 25);
            } else {
                setIsTypingPlaceholder(true);
                setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
            }
        }

        return () => clearTimeout(timeout);
    }, [currentPlaceholder, isTypingPlaceholder, placeholderIndex]);

    useEffect(() => {
        if (messages.length === 0 && isOpen) {
            setMessages([
                {
                    role: 'model',
                    content: `[state: greet] Welcome, integration candidate. I am Alpha, your primary guide through the Shadow Garden systems.\n\nGive me an order below, and let us commence.`,
                },
            ]);
        }
    }, [userName, messages.length, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current && !showImageSearch) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, showImageSearch]);

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        if (typeof window !== 'undefined') {
            window.addEventListener('shadow-toggle-alpha', handleToggle);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('shadow-toggle-alpha', handleToggle);
            }
        };
    }, []);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const watchlistContext = library.slice(0, 15).map(i => `${i.title} (${i.status})`).join(', ');

            const res = await fetch('/api/alpha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    context: {
                        url: pathname,
                        watchlist: (watchlistContext || 'Empty').slice(0, 1000),
                        userName: profile?.username || 'Guest',
                        email: profile?.email || ''
                    }
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'API Error');

            const rawReply = data.reply || '[state: error] I have nothing to report.';

            const { cleanText, newState, action, detectedMedia } = extractStateAndContent(rawReply, state);

            setMessages([...newMessages, { role: 'model', content: `[state: ${newState}] ${cleanText}` }]);
            setState(newState);
            setActiveMedia(detectedMedia);

            if (action === 'open_imagesearch') {
                setShowImageSearch(true);
            }

        } catch (err: any) {
            setMessages([
                ...newMessages,
                {
                    role: 'model',
                    content: `[state: error] Error: ${err.message || 'An error occurred in our communications network.'}`,
                },
            ]);
            setState('error');
        } finally {
            setLoading(false);
        }
    };

    const displayMessages = messages.filter(m => !m.content.startsWith('[System:'));
    const lastModelMessage = [...displayMessages].reverse().find(m => m.role === 'model');
    const currentMessageData = lastModelMessage ? extractStateAndContent(lastModelMessage.content, state) : { cleanText: '', detectedMedia: null };
    const currentMessageContent = currentMessageData.cleanText;
    const currentMedia = currentMessageData.detectedMedia;

    const ALL_STATES = ['bow', 'error', 'explain', 'greet', 'guard', 'relax', 'success', 'surprise', 'think', 'whisper'];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center font-sans overflow-hidden"
                >
                    <div
                        className="absolute inset-0 bg-[#050505]/70 backdrop-blur-[4px] cursor-pointer"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute left-0 top-0 bottom-0 w-full lg:w-[60%] pointer-events-none overflow-hidden mix-blend-screen opacity-50 lg:opacity-70">
                        <motion.div animate={{ x: ['-20%', '0%', '-20%'], y: ['-10%', '5%', '-10%'], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -left-[20%] top-[20%] w-[80vh] h-[80vh] bg-indigo-900/40 rounded-full blur-[120px]" />
                        <motion.div animate={{ x: ['0%', '-15%', '0%'], y: ['10%', '-5%', '10%'], scale: [1.1, 1, 1.1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute -left-[10%] bottom-[10%] w-[60vh] h-[60vh] bg-blue-900/30 rounded-full blur-[100px]" />
                    </div>

                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 lg:top-6 lg:right-6 p-3 bg-black/50 border border-white/10 hover:bg-white/10 hover:text-white rounded-md text-zinc-400 transition-all z-50 backdrop-blur-md active:scale-90">
                        <X size={24} />
                    </button>

                    <div className="relative w-full h-full pointer-events-none pt-2 sm:pt-4 lg:pt-0">

                        {/* Desktop Ambient Fireflies (Hidden on mobile for performance) */}
                        <DesktopFireflies />

                        {/* Character Sprite (Mobile & Desktop: 2nd highest z-index z-[60], below input box z-[70]) */}
                        <div className="absolute bottom-0 sm:bottom-0 lg:bottom-0 left-0 sm:left-2 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto h-[45vh] sm:h-[50vh] lg:h-[95vh] xl:h-[100vh] z-[60] flex items-end justify-start lg:justify-center scale-[0.95] lg:scale-[0.95] origin-bottom-left lg:origin-bottom pointer-events-none">
                            {ALL_STATES.map(st => (
                                <img
                                    key={st}
                                    src={`/images/alpha/alpha-${st}.png`}
                                    alt={`Alpha ${st}`}
                                    className={`absolute bottom-0 left-0 lg:left-1/2 lg:-translate-x-1/2 h-full w-auto max-w-none object-contain object-left-bottom lg:object-bottom drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-opacity duration-500 ease-in-out ${state === st ? 'opacity-100 z-20' : 'opacity-0 z-10'}`}
                                    onError={(e) => {
                                        if (st === state) (e.currentTarget.src = `/images/alpha/alpha-relax.png`);
                                    }}
                                />
                            ))}
                        </div>

                        {/* Responsive Content Columns (Left: Image Search Panel, Right: Speech Bubble & Input Box) */}
                        <div className="w-full h-full flex flex-col lg:flex-row">

                            {/* Left Side (Desktop: Image Search on Left of Centered Alpha / Mobile: Image Search on Top) */}
                            <div className="w-full lg:w-1/2 h-auto max-h-[50vh] sm:max-h-[55vh] lg:max-h-none lg:h-full flex items-start lg:items-center justify-center lg:justify-end p-1 sm:p-3 lg:p-6 lg:pr-40 xl:pr-48 pointer-events-auto z-30 order-1 lg:order-1 shrink-0">
                                <AnimatePresence>
                                    {showImageSearch && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                            className="w-full max-w-full sm:max-w-md lg:max-w-[38vw] xl:max-w-[440px] h-[45vh] sm:h-[50vh] lg:h-[70vh] z-30"
                                        >
                                            <ImageSearchPanel
                                                onClose={() => setShowImageSearch(false)}
                                                onResultFound={(sysMsg) => {
                                                    const userMessage: ChatMessage = { role: 'user', content: sysMsg };
                                                    const newMessages = [...messages, userMessage];
                                                    setMessages(newMessages);
                                                    setLoading(true);

                                                    fetch('/api/alpha', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            messages: newMessages,
                                                            context: { url: pathname, userName: profile?.username || 'Guest', email: profile?.email || '' }
                                                        }),
                                                    }).then(res => res.json()).then(data => {
                                                        const rawReply = data.reply || '[state: explain] I have analyzed the scan results.';
                                                        const { cleanText, newState, detectedMedia } = extractStateAndContent(rawReply, state);
                                                        setMessages([...newMessages, { role: 'model', content: `[state: ${newState}] ${cleanText}` }]);
                                                        setState(newState);
                                                        setActiveMedia(detectedMedia);
                                                        setLoading(false);
                                                    }).catch(() => setLoading(false));
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right Side (Desktop: Speech Bubble & Input Box on Right of Centered Alpha) */}
                            <div className="w-full lg:w-1/2 flex-1 min-h-0 h-auto lg:h-full relative order-2 lg:order-2 flex flex-col justify-end lg:pl-40 xl:pl-48">

                                {/* Speech Bubble */}
                                <div className="w-full px-2 sm:px-4 lg:px-0 flex justify-end lg:justify-start pb-4 sm:pb-6 lg:pb-4 mb-4 sm:mb-6 lg:mb-4 z-30 pointer-events-auto shrink-0 relative mt-auto lg:mt-0">
                                    {/* Spacer for mobile character on left */}
                                    <div className="w-[42%] sm:w-[45%] lg:hidden shrink-0" />

                                    {/* Adaptive Mobile & Responsive Desktop Speech Bubble */}
                                    <div className="w-[58%] sm:w-[55%] lg:w-full max-w-[calc(100vw-120px)] md:max-w-[480px] lg:max-w-[38vw] xl:max-w-[440px] shrink-0 ml-auto lg:ml-0">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentMessageContent}
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="relative w-full"
                                            >
                                                <div className="absolute -top-5 left-6 z-30 drop-shadow-md">
                                                    <div
                                                        className="bg-orange-600 text-white px-8 py-1 font-black tracking-[0.2em] uppercase flex items-center justify-center border border-orange-400 text-sm shadow-[0_0_15px_rgba(234,88,12,0.5)]"
                                                        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
                                                    >
                                                        Alpha
                                                    </div>
                                                </div>

                                                <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md border-[2px] border-orange-600/50 rounded-2xl p-4 lg:p-6 min-h-[190px] lg:min-h-[170px] max-h-[300px] overflow-y-auto custom-scrollbar shadow-[0_10px_40px_rgba(0,0,0,0.8)] shadow-orange-900/20">
                                                    {loading ? (
                                                        <div className="flex items-center gap-3 text-orange-500 font-bold h-full">
                                                            <Loader2 className="w-5 h-5 animate-spin" /> Typing...
                                                        </div>
                                                    ) : (
                                                        <div className="text-zinc-200 font-medium text-xs sm:text-sm lg:text-base leading-relaxed whitespace-pre-wrap font-sans min-h-[60px] max-h-[30vh] lg:max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                                            <motion.div initial="hidden" animate="visible" variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}>
                                                                {currentMessageContent.split("").map((char, index) => (
                                                                    <motion.span key={`${index}-${char}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                                                                        {char}
                                                                    </motion.span>
                                                                ))}
                                                            </motion.div>
                                                            {currentMedia && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.85, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.85, y: -5 }}
                                                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                                    className={cn(
                                                                        "mt-4 inline-block transform-gpu",
                                                                        currentMedia.type === 'sticker'
                                                                            ? "p-2 bg-white/5 border border-white/20 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.15)] backdrop-blur-md max-w-[140px]"
                                                                            : "rounded-xl overflow-hidden shadow-xl shadow-orange-900/30 border border-orange-500/30 max-w-[200px]"
                                                                    )}
                                                                >
                                                                    <img
                                                                        src={currentMedia.url}
                                                                        alt={`Alpha ${currentMedia.type}`}
                                                                        className={cn(
                                                                            "w-full h-auto object-contain",
                                                                            currentMedia.type === 'sticker' && "drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                                                                        )}
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="absolute top-1/2 -left-[14px] transform -translate-y-1/2 w-0 h-0 border-t-[12px] lg:border-t-[14px] border-t-transparent border-b-[12px] lg:border-b-[14px] border-b-transparent border-r-[14px] lg:border-r-[16px] border-r-orange-600/50">
                                                        <div className="absolute -top-[10px] lg:-top-[12px] -right-[16px] lg:-right-[18px] w-0 h-0 border-t-[10px] lg:border-t-[12px] border-t-transparent border-b-[10px] lg:border-b-[12px] border-b-transparent border-r-[12px] lg:border-r-[14px] border-r-[#0a0a0a]" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Bottom Input Area (Very top Z-Index z-[70]) */}
                                <div className="w-full px-2 sm:px-4 lg:px-0 pb-2 sm:pb-4 lg:pb-6 mb-2 sm:mb-3 lg:mb-6 z-[70] pointer-events-auto shrink-0 flex justify-end lg:justify-start">
                                    <div className="w-full max-w-full lg:max-w-[38vw] xl:max-w-[440px] bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 border-t-orange-500/30 rounded-xl p-3 pt-5 shadow-[0_0_30px_rgba(234,88,12,0.1)] relative">

                                        <div className="absolute -top-4 right-6 z-30 drop-shadow-md">
                                            <div className="bg-zinc-800 text-zinc-200 px-6 py-0.5 font-black tracking-[0.1em] uppercase flex items-center justify-center border border-zinc-600 text-[10px] shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                                                {displayName}
                                            </div>
                                        </div>

                                        <form onSubmit={handleSendMessage} className="relative flex mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowImageSearch(!showImageSearch)}
                                                className={`absolute left-1 top-1/2 -translate-y-1/2 p-2 transition-colors active:scale-90 ${showImageSearch ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                <ScanSearch size={16} />
                                            </button>
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 pl-10 pr-12 text-white text-sm outline-none focus:border-orange-500/50 transition-colors shadow-inner"
                                                disabled={loading}
                                                autoComplete="off"
                                                placeholder={currentPlaceholder ? `${currentPlaceholder}│` : "Awaiting orders..."}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!input.trim() || loading}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:text-white disabled:opacity-30 transition-colors active:scale-90"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

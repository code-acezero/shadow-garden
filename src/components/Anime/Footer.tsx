"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageCircle, Send, ArrowUp, Share2, 
  Shield, Crown, Facebook, Disc, 
  BookOpen, Copyright, Sword, Scroll, 
  Flame, HelpCircle, FileSignature
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function Footer() {
  const pathname = usePathname();
  const [origin, setOrigin] = useState('');
  
  // Detect if we are currently watching something
  const isWatchPage = pathname?.startsWith('/watch/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    const urlToShare = isWatchPage ? window.location.href : origin;
    navigator.clipboard.writeText(urlToShare);
    toast.success("Coordinates Transmitted", {
        description: "The channel is open. Recruit them to the Garden.",
        action: { label: "Dismiss", onClick: () => {} }
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[#020202] border-t border-white/5 mt-12 overflow-hidden font-sans">
      
      {/* --- INJECT FONT & ANIMATION --- */}
      <style jsx global>{`
        @font-face {
          font-family: 'Demoness';
          src: url('/fonts/Demoness-1GlYj.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        /* Red Reflection Shimmer Animation */
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>

      {/* --- ATMOSPHERIC EFFECTS --- */}
      <div className="absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-red-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-red-600/10 blur-[60px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[900px] mx-auto px-6 py-8 relative z-10 flex flex-col items-center text-center">
        
        {/* --- BRANDING --- */}
        <Link href="/" className="group flex flex-col items-center gap-2 mb-6">
           <Crown size={24} className="text-red-600 fill-red-950/50" />
           {/* UPDATED H2:
               1. Added font-[Demoness]
               2. Set text to transparent and bg-clip-text
               3. Added a linear gradient background (white -> red -> white)
               4. Set background size larger than text (250%)
               5. Applied the custom 'shimmer' animation defined in styles above
           */}
           <h2 className={cn(
             "text-3xl md:text-4xl font-[Demoness] tracking-widest drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]",
             "bg-clip-text text-transparent bg-[length:250%_100%]",
             "bg-[linear-gradient(110deg,#ffffff_45%,#dc2626_50%,#ffffff_55%)]",
             "animate-[shimmer_6s_linear_infinite]"
           )}>
             SHADOW GARDEN
           </h2>
           <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] group-hover:text-red-800 transition-colors">
             We are the Eminence in Shadows.
           </p>
        </Link>

        {/* --- SPECIAL CHANNELS (Socials) --- */}
        <div className="flex flex-col items-center gap-3 mb-8">
            <span className="text-[8px] font-black text-red-800 uppercase tracking-[0.3em]">SPECIAL</span>
            <div className="flex items-center gap-3">
                <SocialLink 
                    href="https://web.facebook.com/share/g/16oWLqBoL9/" 
                    icon={<Facebook size={16} />} 
                    label="Facebook Group" 
                />
                <SocialLink 
                    href="https://m.me/j/Abb1dc0UPqm6oVLU/" 
                    icon={<MessageCircle size={16} />} 
                    label="Messenger Group" 
                />
                <SocialLink 
                    href="#" 
                    icon={<Send size={16} />} 
                    label="Telegram" 
                />
                <SocialLink 
                    href="https://discord.gg" 
                    icon={<Disc size={16} />} 
                    label="Discord" 
                />
            </div>
        </div>

        {/* --- ACTIONS --- */}
        <div className="flex items-center gap-3 mb-8">
            <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-600/30 transition-all active:scale-95 group"
            >
                <Share2 size={10} className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-white">
                    {isWatchPage ? "SHARE THIS ANIME" : "SHARE THIS APP"}
                </span>
            </button>

            <GuildArchivesDialog />
        </div>

        {/* --- FOOTER BOTTOM --- */}
        <div className="w-full border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-4">
          
          {/* LEFT: Copyright */}
          <div className="flex justify-center md:justify-start items-center gap-2 text-[9px] font-bold text-zinc-700 uppercase tracking-widest order-3 md:order-1">
            <span className="flex items-center gap-1"><Copyright size={10}/> {currentYear} Shadow Garden</span>
          </div>

          {/* CENTER: Back to Top */}
          <div className="flex justify-center order-1 md:order-2">
             <button 
               onClick={scrollToTop}
               className="w-8 h-8 rounded-full bg-red-600/5 border border-red-600/10 flex items-center justify-center text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 group shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
             >
                <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform stroke-[3]" />
             </button>
          </div>

          {/* RIGHT: Guild Master */}
          <div className="flex justify-center md:justify-end items-center gap-2 order-2 md:order-3">
             <Link 
                href="https://www.facebook.com/codeacezero.azim"
                target="_blank"
                className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 group hover:text-white transition-colors"
             >
                <Sword size={12} className="text-red-900 group-hover:text-red-600 transition-colors rotate-45" />
                Guild Master: <span className="border-b border-red-600/0 group-hover:border-red-600 transition-all text-zinc-400 group-hover:text-white">Ace Zero</span>
             </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}

// --- SUB COMPONENTS ---

const SocialLink = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => (
    <Link 
        href={href} 
        target="_blank"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#080808] border border-white/5 text-zinc-500 hover:text-white hover:border-red-600/40 hover:bg-red-950/10 hover:shadow-[0_0_15px_rgba(220,38,38,0.1)] transition-all duration-300 group"
        title={label}
    >
        <div className="transform group-hover:scale-110 transition-transform">
            {icon}
        </div>
    </Link>
);

// --- GUILD ARCHIVES DIALOG ---
const GuildArchivesDialog = () => {
    const [activeTab, setActiveTab] = useState<'code' | 'ambition' | 'pact' | 'purge' | 'truths'>('code');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/5 border border-red-600/20 hover:bg-red-600/10 hover:border-red-600/40 transition-all active:scale-95 group">
                    <BookOpen size={10} className="text-red-800 group-hover:text-red-500 transition-colors" />
                    <span className="text-[9px] font-black text-red-800 uppercase tracking-widest group-hover:text-red-500 transition-colors">GUILD ARCHIVES</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-[#050505] border-red-900/30 text-white max-w-2xl w-[95vw] h-[75vh] md:h-[550px] rounded-3xl shadow-[0_0_50px_-10px_rgba(220,38,38,0.2)] p-0 overflow-hidden flex flex-col md:flex-row">
                
                {/* SIDEBAR NAVIGATION */}
                <div className="w-full md:w-48 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
                    <div className="hidden md:flex items-center gap-2 mb-6 px-2">
                        <Shield size={16} className="text-red-600" />
                        <span className="text-xs font-black font-[Cinzel] text-white">RECORDS</span>
                    </div>
                    
                    <ArchiveTab active={activeTab === 'code'} onClick={() => setActiveTab('code')} icon={<Shield size={12}/>} label="The Shadow Code" />
                    <ArchiveTab active={activeTab === 'ambition'} onClick={() => setActiveTab('ambition')} icon={<Scroll size={12}/>} label="Our Ambition" />
                    <ArchiveTab active={activeTab === 'pact'} onClick={() => setActiveTab('pact')} icon={<FileSignature size={12}/>} label="Blood Pact" />
                    <ArchiveTab active={activeTab === 'purge'} onClick={() => setActiveTab('purge')} icon={<Flame size={12}/>} label="Purge Orders" />
                    <ArchiveTab active={activeTab === 'truths'} onClick={() => setActiveTab('truths')} icon={<HelpCircle size={12}/>} label="Hidden Truths" />
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#080808]">
                    <DialogHeader className="p-6 pb-2 shrink-0">
                        <DialogTitle className="text-lg font-black font-[Cinzel] text-red-600 tracking-tighter flex items-center gap-2">
                            {activeTab === 'code' && "THE SHADOW CODE"}
                            {activeTab === 'ambition' && "THE GARDEN'S AMBITION"}
                            {activeTab === 'pact' && "PACT OF BLOOD (TERMS)"}
                            {activeTab === 'purge' && "PURGE REQUESTS (DMCA)"}
                            {activeTab === 'truths' && "FORBIDDEN KNOWLEDGE"}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1 p-6 pt-2">
                        {activeTab === 'code' && <CodeContent />}
                        {activeTab === 'ambition' && <AmbitionContent />}
                        {activeTab === 'pact' && <PactContent />}
                        {activeTab === 'purge' && <PurgeContent />}
                        {activeTab === 'truths' && <TruthsContent />}
                    </ScrollArea>

                    <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        <span>System: V.2.5.0</span>
                        <div className="flex items-center gap-2">
                            <span>Signed:</span>
                            <span className="text-red-600">Ace Zero</span>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
};

// --- TAB COMPONENT ---
const ArchiveTab = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all w-full text-left whitespace-nowrap shrink-0 md:shrink",
            active ? "bg-red-600/10 text-red-500 border border-red-600/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
        )}
    >
        {icon}
        {label}
    </button>
);

// --- CONTENT SECTIONS ---

const CodeContent = () => (
    <div className="space-y-4">
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            By entering the Shadow Garden, you accept the contract. Failure to comply results in immediate excommunication from the order.
        </p>
        <div className="space-y-2">
            <RuleItem num="I" text="Conceal your presence. Do not expose the Garden to the light." />
            <RuleItem num="II" text="Absolute loyalty. The Guild Master's word is absolute law." />
            <RuleItem num="III" text="No internal conflict. Shadows do not fight shadows." />
            <RuleItem num="IV" text="Knowledge is power. Contain spoilers within the void." />
        </div>
    </div>
);

const AmbitionContent = () => (
    <div className="space-y-4 text-xs text-zinc-400 leading-relaxed font-medium">
        <p><strong className="text-white">We are Shadow Garden.</strong> We lurk in the shadows to hunt the shadows.</p>
        <p>This digital sanctuary was forged to preserve the chronicles of the animated realm. We do not seek fame, nor do we seek the light. We exist solely to provide the highest quality archives to the worthy.</p>
        <p>Our mission is absolute: To curate, preserve, and transmit the Eminence in Shadow and other artifacts to our agents across the globe.</p>
    </div>
);

const PactContent = () => (
    <div className="space-y-4 text-xs text-zinc-400 leading-relaxed">
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <h4 className="text-white font-bold mb-1">1. Acceptance of the Pact</h4>
            <p>By accessing this terminal, you agree to be bound by these Terms. If you do not agree, sever your connection immediately.</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <h4 className="text-white font-bold mb-1">2. Usage License</h4>
            <p>Permission is granted to stream materials for personal viewing only. You may not modify, copy, or sell the artifacts found within.</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <h4 className="text-white font-bold mb-1">3. Disclaimer</h4>
            <p>The materials are provided "as is". Shadow Garden makes no warranties. We host no files; we merely provide the map to find them.</p>
        </div>
    </div>
);

const PurgeContent = () => (
    <div className="space-y-4 text-xs text-zinc-400 leading-relaxed">
        <div className="flex items-center gap-2 text-red-500 mb-2">
            <Scale size={16} />
            <span className="font-bold">COPYRIGHT PURGE</span>
        </div>
        <p>Shadow Garden respects intellectual property. We do not host any files on our own servers. All content is provided by non-affiliated third parties.</p>
        <p>If you believe that your work has been copied in a way that constitutes infringement, please provide our Council with:</p>
        <ul className="list-disc pl-4 space-y-1 text-zinc-500">
            <li>A description of the copyrighted work.</li>
            <li>The coordinates (URL) where the material is located.</li>
            <li>Your contact protocol (Email).</li>
        </ul>
        <div className="mt-4">
            <p className="text-zinc-300 font-bold">Contact Protocol:</p>
            <a href="mailto:dmca@shadowgarden.io" className="text-red-500 hover:underline">dmca@shadowgarden.io</a>
        </div>
    </div>
);

const TruthsContent = () => (
    <div className="space-y-4">
        <QnAItem q="Who is the Guild Master?" a="The Architect known as Ace Zero. He forged this realm from the void." />
        <QnAItem q="Is this service free?" a="Yes. The Shadow Garden requires no gold, only your loyalty." />
        <QnAItem q="How do I join the Guild?" a="Follow the social links in the footer. Join the Facebook or Discord stronghold." />
        <QnAItem q="Why is the screen black?" a="Because we dwell in the shadows. Also, it saves battery." />
    </div>
);

// --- HELPER ITEMS ---

const RuleItem = ({ num, text }: { num: string, text: string }) => (
    <div className="flex gap-4 items-start p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
        <span className="text-xs font-black text-red-800 mt-0.5 font-[Cinzel]">{num}</span>
        <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">{text}</p>
    </div>
);

const QnAItem = ({ q, a }: { q: string, a: string }) => (
    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
        <h4 className="text-[11px] font-black text-white mb-1 flex items-center gap-2">
            <span className="text-red-600">Q:</span> {q}
        </h4>
        <p className="text-[10px] text-zinc-400 pl-4 border-l border-white/10">
            <span className="text-zinc-600 font-bold mr-1">A:</span> {a}
        </p>
    </div>
);
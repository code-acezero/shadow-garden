"use client";

import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import RoleGuard from '@/components/Auth/RoleGuard';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ImageAPI } from '@/lib/api'; 
import { SITE_CONFIG } from '@/lib/site-config'; 
import { 
  Shield, Activity, Search, AlertTriangle, 
  Trash2, Megaphone, Lock, Unlock, 
  Image as ImageIcon, Mic2, Play, Pause,
  AlertCircle, MessageSquareWarning, BookOpen, 
  Scroll, Sword, Feather, 
  Bold, Italic, Type, UserCheck, LayoutDashboard,
  Filter, ArrowDownCircle, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- NOTIFICATION HELPER ---
const notify = (title: string, message: string, type: 'success' | 'error' | 'system' = 'system') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: { id: Date.now(), type, title, message }
        }));
    }
};

type Tab = 'GUILD_DESK' | 'GUILD_INFO' | 'ADVENTURERS' | 'VOICES' | 'NOTICE';

export default function GuildManagerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('GUILD_DESK');
  const { user } = useAuth();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('guild_manager_tab');
        if (saved) setActiveTab(saved as Tab);
    }
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('guild_manager_tab', tab);
  };

  return (
    <RoleGuard allowedRoles={['moderator']}>
      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; outline: none !important; -webkit-tap-highlight-color: transparent; }
        input:focus, textarea:focus, select:focus, button:focus { box-shadow: none !important; ring: 0 !important; border-color: rgba(192, 38, 211, 0.5) !important; }
        .font-hunters { font-family: var(--font-hunters), sans-serif; }
      `}</style>

      <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-y-auto pb-8 transform-gpu will-change-transform">
        
        {/* Ambient Background (Red-Violet) */}
        <div className="fixed top-0 left-0 w-full h-96 bg-fuchsia-900/10 blur-[100px] pointer-events-none translate-z-0" />
        <div className="h-24 w-full" />

        <div className="w-full max-w-[1350px] mx-auto px-4 md:px-8 pb-4 relative z-10">
          
          {/* --- HEADER --- */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="relative p-2 bg-zinc-900/50 border border-white/10 rounded-xl group overflow-hidden shadow-lg shadow-fuchsia-900/10">
                 <div className="absolute inset-0 bg-fuchsia-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 {/* Icon: Sword (Manager) */}
                 <div className="relative z-10 flex items-center justify-center w-12 h-12">
                    <Sword className="w-8 h-8 text-fuchsia-500 drop-shadow-md" strokeWidth={2} />
                 </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-hunters tracking-wider text-white leading-none drop-shadow-md">
                  GUILD MANAGER
                </h1>
                <p className="text-[10px] text-fuchsia-500 font-mono tracking-[0.3em] uppercase mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse"/> Level 2 Clearance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 md:gap-8 bg-zinc-900/40 p-3 md:p-4 rounded-full border border-white/5 backdrop-blur-sm px-6 md:px-8 shadow-inner shadow-white/5">
               <div className="flex flex-col items-center gap-1.5 group cursor-pointer opacity-50">
                  <Shield size={20} className="text-zinc-500" />
                  <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold">MASTERS</span>
               </div>
               <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <Sword size={20} className="text-fuchsia-500 scale-110" />
                  <span className="text-[9px] md:text-[10px] text-white font-bold">MANAGER</span>
               </div>
               <div className="flex flex-col items-center gap-1.5 group cursor-pointer opacity-50">
                  <Lock size={14} className="text-zinc-500" />
                  <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold">VAULT</span>
               </div>
            </div>
          </header>

          {/* --- NAVIGATION TABS --- */}
          <div className="mb-8 sticky top-4 z-50">
            <div className="flex overflow-x-auto py-2 gap-2 no-scrollbar bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-2 md:px-4 w-full md:w-fit mx-auto md:mx-0 shadow-2xl">
               <TabBtn id="GUILD_DESK" icon={LayoutDashboard} label="Desk" active={activeTab} onClick={switchTab} />
               <TabBtn id="GUILD_INFO" icon={BookOpen} label="Info" active={activeTab} onClick={switchTab} />
               <TabBtn id="ADVENTURERS" icon={Sword} label="Adventurers" active={activeTab} onClick={switchTab} />
               <TabBtn id="VOICES" icon={Mic2} label="Echoes" active={activeTab} onClick={switchTab} />
               <TabBtn id="NOTICE" icon={Feather} label="Notices" active={activeTab} onClick={switchTab} />
            </div>
          </div>

          {/* --- CONTENT PANELS --- */}
          <main className="animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-[500px]">
              <div className={activeTab === 'GUILD_DESK' ? 'block' : 'hidden'}><OverviewTab changeTab={switchTab} /></div>
              <div className={activeTab === 'GUILD_INFO' ? 'block' : 'hidden'}><IdentityTab /></div>
              <div className={activeTab === 'ADVENTURERS' ? 'block' : 'hidden'}><RosterTab /></div>
              <div className={activeTab === 'VOICES' ? 'block' : 'hidden'}><VoiceTab /></div>
              <div className={activeTab === 'NOTICE' ? 'block' : 'hidden'}><BroadcastTab /></div>
          </main>
        </div>

        {/* --- FOOTER --- */}
        <footer className="w-full border-t border-white/5 bg-zinc-900/20 py-8 mt-8">
          <div className="max-w-[1350px] mx-auto px-4 text-center space-y-4">
            <div className="flex justify-center items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
               <img src="/icon.svg" className="w-8 h-8 drop-shadow-lg" alt="Guild Seal"/>
               <h4 className="font-hunters font-bold text-lg text-white tracking-widest">SHADOW GARDEN</h4>
            </div>
            <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
              Manager Console • V0.1.2 (Beta) • {user?.email}
            </p>
          </div>
        </footer>

        <div className="h-8 w-full" />
      </div>
    </RoleGuard>
  );
}

// ==========================================
//  TAB 1: GUILD DESK (Read Only Status)
// ==========================================
const OverviewTab = memo(({ changeTab }: { changeTab: (t: Tab) => void }) => {
  const { settings, isLoaded } = useSettings();
  
  // ✅ FIX: Cast settings to 'any' to bypass missing property definition in AppSettings type
  const isLocked = isLoaded && String((settings as any)?.maintenanceMode) === 'true'; 

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* ✅ VIOLET-GREEN OPEN STATE LOGIC */}
      <div className={`col-span-1 p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 ${
        isLocked 
          ? 'bg-primary-950/20 border-primary-500/30 shadow-[0_0_30px_-10px_rgba(220,38,38,0.2)]' 
          : 'bg-gradient-to-br from-violet-900/20 via-black/20 to-emerald-900/20 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]'
      }`}>
        <div className={`absolute inset-0 opacity-10 transition-opacity duration-500 ${isLocked ? 'bg-primary-600' : 'bg-gradient-to-r from-violet-600 to-emerald-600'}`} />
        <div className="relative z-10">
           <div className="flex justify-between items-start mb-6">
             <div className={`p-3 rounded-2xl transition-colors ${isLocked ? 'bg-primary-500/20 text-primary-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
               <Shield size={24} />
             </div>
             <Badge variant="outline" className={`backdrop-blur-md rounded-full px-3 ${isLocked ? 'border-primary-500 text-primary-400' : 'border-emerald-500 text-emerald-400 bg-emerald-500/10'}`}>
               {isLocked ? 'GATES CLOSED' : 'GATES OPEN'}
             </Badge>
           </div>
           <h3 className={`text-2xl font-bold mb-2 ${isLocked ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-emerald-200'}`}>Guild Status</h3>
           <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
             {isLocked ? "Lockdown Protocol Active. Contact Grandmaster for access." : "The Guild Hall is open to all adventurers."}
           </p>
           {/* DISABLED BUTTON FOR MANAGERS */}
           <Button disabled className={`w-full border rounded-full h-12 cursor-not-allowed ${
             isLocked
               ? 'bg-white/5 border-white/10 text-zinc-500'
               : 'bg-emerald-900/10 border-emerald-500/10 text-emerald-500/50'
           }`}>Protocol Controls: Restricted</Button>
        </div>
      </div>
      
      <div className="col-span-1 md:col-span-2 bg-zinc-900/20 border border-white/5 rounded-[2rem] p-6 md:p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-white"><Scroll size={20} className="text-fuchsia-500" /> Guild Administration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CmdTile label="Adventurers" icon={Sword} onClick={() => changeTab('ADVENTURERS')} color="fuchsia" />
          <CmdTile label="Echoes" icon={Mic2} onClick={() => changeTab('VOICES')} color="fuchsia" />
          <CmdTile label="Notices" icon={Feather} onClick={() => changeTab('NOTICE')} color="fuchsia" />
          <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-black/20 border border-white/5 opacity-50 cursor-not-allowed">
             <div className="p-3 rounded-2xl bg-white/5 text-zinc-500"><Lock size={24} /></div>
             <span className="text-sm font-bold text-zinc-500">Grimoire (Locked)</span>
          </div>
        </div>
      </div>
    </div>
  );
});
OverviewTab.displayName = 'OverviewTab';

// ==========================================
//  TAB 2: GUILD INFO (Read Only + Shared Config)
// ==========================================
const IdentityTab = memo(() => {
  const { settings, isLoaded } = useSettings();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => { 
    if (isLoaded) setFormData({ ...settings }); 
  }, [settings, isLoaded]);

  // ✅ FULL SEO DISPLAY (Read-Only for Managers)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-1 space-y-6">
          <div className="bg-zinc-900/20 border border-white/5 p-6 rounded-[2rem] h-full">
              <div className="flex items-center gap-3 mb-4 text-zinc-400"><BookOpen size={18} /><h3 className="font-bold text-sm uppercase">Active Metadata</h3></div>
              
              <div className="space-y-6 text-xs text-zinc-500 font-mono bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-2">
                      <p className="text-zinc-400 font-bold border-b border-white/5 pb-1">Basic Metadata</p>
                      <p><span className="text-zinc-600 block mb-1">Title:</span> {formData.seoTitle || SITE_CONFIG.title}</p>
                      <p><span className="text-zinc-600 block mb-1">Desc:</span> {formData.seoDesc || SITE_CONFIG.description.substring(0, 100) + '...'}</p>
                  </div>

                  {/* ✅ Navigation Schema (from Shared Config) */}
                  <div className="space-y-2">
                      <p className="text-zinc-400 font-bold border-b border-white/5 pb-1">Navigation Schema (JSON-LD)</p>
                      <ul className="list-disc pl-4 space-y-1 opacity-70">
                          {SITE_CONFIG.navigation.map((nav, i) => (
                              <li key={i}><span className="text-zinc-400">{nav.name}</span> ({nav.url.replace('https://shadow-garden.site', '')})</li>
                          ))}
                      </ul>
                  </div>

                  {/* ✅ Locales (from Shared Config) */}
                  <div className="space-y-2">
                      <p className="text-zinc-400 font-bold border-b border-white/5 pb-1">Locale Alternates</p>
                      <p className="opacity-70 leading-relaxed">{SITE_CONFIG.locales.join(', ')}</p>
                  </div>

                  <div className="pt-2">
                      <p className="text-zinc-400 font-bold mb-2">Social Card</p>
                      <div className="aspect-video bg-black rounded-lg border border-white/10 overflow-hidden relative">
                          <img src={formData.seoImage || SITE_CONFIG.ogImage} className="w-full h-full object-cover opacity-80" alt="OG Preview"/>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="xl:col-span-2 space-y-8">
        {/* READ ONLY SECTION */}
        <div className="bg-zinc-900/20 border border-white/5 p-6 md:p-8 rounded-[2rem]">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5"><Shield className="text-zinc-400" /><h3 className="text-xl font-bold text-white">Guild Identity (Read-Only)</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                <InputGroup label="Guild Name" value={formData.siteName} disabled />
                <InputGroup label="Logo Text" value={formData.logoText} disabled font="font-hunters" />
                <InputGroup label="Emblem URL" value={formData.logoUrl} disabled className="md:col-span-2" />
            </div>
        </div>
        
        <div className="bg-zinc-900/20 border border-white/5 p-6 md:p-8 rounded-[2rem]">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5"><Search className="text-zinc-400" /><h3 className="text-xl font-bold text-white">Grimoire Config (Read-Only)</h3></div>
            <div className="space-y-6 opacity-60">
                <InputGroup label="Page Title Override" value={formData.seoTitle} disabled />
                <div className="space-y-2"><label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Meta Description</label><Textarea value={formData.seoDesc} disabled className="bg-black/40 border-white/10 min-h-[100px] rounded-2xl cursor-not-allowed" /></div>
            </div>
        </div>
      </div>
    </div>
  );
});
IdentityTab.displayName = 'IdentityTab';

// ==========================================
//  TAB 3: ADVENTURERS (Manager Restricted)
// ==========================================
const RosterTab = memo(() => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL'|'BANNED'>('ALL');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnTarget, setWarnTarget] = useState<string | null>(null);
  const [warnMsg, setWarnMsg] = useState('');

  const fetchUsers = async () => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
    const { data } = await query;
    if (data) {
        const sorted = data.sort((a: any, b: any) => {
            if (a.id === currentUser?.id) return -1;
            if (b.id === currentUser?.id) return 1;
            const roleWeight = (r: string) => r === 'admin' ? 3 : r === 'moderator' ? 2 : 1;
            return roleWeight(b.role) - roleWeight(a.role);
        });
        setUsers(sorted);
    }
  };
  
  useEffect(() => { fetchUsers(); }, [currentUser]);

  const handleBan = async (uid: string, banned: boolean) => { 
      const { error } = await supabase.from('profiles').update({ is_banned: !banned }).eq('id', uid); 
      if (error) notify("Error", "Action failed", 'error');
      else { notify("Status Updated", banned ? "Reinstated" : "Banned", 'success'); fetchUsers(); }
  };
  
  const sendWarning = async () => {
      if (!warnTarget || !warnMsg) return;
      await supabase.from('notifications').insert({ user_id: warnTarget, type: 'GUILD_WARNING', content: warnMsg });
      notify("Sent", "Warning dispatched via WhisperIsland", 'success');
      setWarnOpen(false); setWarnMsg('');
  };

  const filteredUsers = useMemo(() => users.filter(u => {
      const matchesSearch = u.username?.toLowerCase().includes(search.toLowerCase());
      if (filter === 'ALL') return matchesSearch;
      if (filter === 'BANNED') return matchesSearch && u.is_banned;
      return matchesSearch;
  }), [users, search, filter]);

  const displayedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 rounded-2xl border border-white/5">
          <div className="relative w-full md:w-96"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><Input placeholder="Find adventurer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 bg-black/40 border-white/10 rounded-full h-12" /></div>
          <div className="flex gap-2 p-1 bg-black/40 rounded-full border border-white/5">{(['ALL', 'BANNED'] as const).map(f => (<button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === f ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:text-white'}`}>{f}</button>))}</div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedUsers.map(user => {
             const isMe = user.id === currentUser?.id;
             const isAdmin = user.role === 'admin';
             const isMod = user.role === 'moderator';
             
             // Manager Logic: Can only touch 'user' role
             const canInteract = !isMe && !isAdmin && !isMod;

             return (
             <div key={user.id} className={`bg-zinc-900/30 border p-4 rounded-2xl flex flex-col gap-4 group transition-all ${isMe ? 'border-fuchsia-500/50 bg-fuchsia-950/10' : isAdmin ? 'border-yellow-500/30' : isMod ? 'border-fuchsia-500/30' : 'border-white/5 hover:border-white/10'}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-white/5"><AvatarImage src={user.avatar_url} /><AvatarFallback className="bg-zinc-800">{user.username?.[0]}</AvatarFallback></Avatar>
                        <div>
                            <h4 className="font-bold text-white flex items-center gap-2">{user.username} {isMe && <Badge className="text-[8px] bg-fuchsia-600 h-4 px-1 rounded-sm">YOU</Badge>}</h4>
                            <div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-400 border-none rounded-full">{user.role.toUpperCase()}</Badge>{user.is_banned && <Badge variant="destructive" className="text-[10px] h-5 rounded-full">EXILED</Badge>}</div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {canInteract && <>
                            <Button size="icon" variant="ghost" className={`h-8 w-8 rounded-full ${user.is_banned ? 'text-green-500' : 'text-primary-500'}`} onClick={() => handleBan(user.id, user.is_banned)}>{user.is_banned ? <Unlock size={14} /> : <Lock size={14} />}</Button>
                        </>}
                        {(isAdmin || isMod) && !isMe && <Lock size={14} className="text-zinc-600 mt-2 mr-2" />}
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    {canInteract ? (
                        <Button size="sm" variant="ghost" className="flex-1 text-[10px] h-8 text-zinc-400 hover:text-white rounded-full" onClick={() => { setWarnTarget(user.id); setWarnOpen(true); }}><MessageSquareWarning size={14} className="mr-2 text-yellow-500" /> Warn</Button>
                    ) : (
                        <span className="flex-1 text-[10px] text-zinc-600 text-center py-1">Protected Status</span>
                    )}
                    <Dialog><DialogTrigger asChild><Button size="sm" variant="ghost" className="flex-1 text-[10px] h-8 text-zinc-400 hover:text-primary-400 rounded-full"><AlertCircle size={14} className="mr-2" /> Reports</Button></DialogTrigger><DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl"><DialogHeader><DialogTitle>Reports</DialogTitle></DialogHeader><p className="text-zinc-500 text-sm">No active reports.</p></DialogContent></Dialog>
                </div>
             </div>
          )})}
       </div>
       {totalPages > 1 && (<div className="flex justify-center gap-2 mt-6">{Array.from({length: totalPages}, (_, i) => (<button key={i} onClick={() => setPage(i+1)} className={`w-8 h-8 rounded-full text-xs font-bold ${page === i+1 ? 'bg-fuchsia-600 text-white' : 'bg-white/10 text-zinc-400'}`}>{i+1}</button>))}</div>)}
       <Dialog open={warnOpen} onOpenChange={setWarnOpen}><DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl"><DialogHeader><DialogTitle>Issue Warning</DialogTitle></DialogHeader><Input placeholder="Reason for warning..." value={warnMsg} onChange={e => setWarnMsg(e.target.value)} className="bg-black/40 border-white/10 rounded-xl"/><DialogFooter><Button onClick={sendWarning} className="bg-fuchsia-600 rounded-full">Transmit</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
});
RosterTab.displayName = 'RosterTab';

// ==========================================
//  TAB 4: VOICES (Read Only)
// ==========================================
const VoiceTab = memo(() => {
  const [voices, setVoices] = useState<any[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchVoices = async () => { 
      const { data } = await supabase.from('voice_packs').select('*').order('created_at', { ascending: false }); 
      let staticData = [];
      try {
          const res = await fetch('/api/system/voices');
          const json = await res.json();
          staticData = json.staticVoices || [];
      } catch(e) { console.error("Scanner failed", e); }
      setVoices([...(data || []), ...staticData]);
  };
  
  useEffect(() => { fetchVoices(); }, []);

  const toggleAudio = (url: string, id: string) => {
      if (playing === id) { audioRef.current?.pause(); setPlaying(null); } 
      else {
          if (audioRef.current) audioRef.current.pause();
          audioRef.current = new Audio(url);
          audioRef.current.onended = () => setPlaying(null);
          audioRef.current.play();
          setPlaying(id);
      }
  };

  const grouped = useMemo(() => voices.reduce((acc: any, v: any) => {
      const lang = v.language || 'en';
      if (!acc[lang]) acc[lang] = {};
      const char = v.character || v.name; 
      if (!acc[lang][char]) acc[lang][char] = [];
      acc[lang][char].push(v);
      return acc;
  }, {}), [voices]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-3 space-y-6">
           <Tabs defaultValue="en" className="w-full">
               <TabsList className="bg-zinc-900/50 p-1 rounded-full border border-white/5 mb-4 h-auto flex flex-wrap gap-1">
                   {Object.keys(grouped).concat(['en']).filter((v,i,a)=>a.indexOf(v)===i).map(lang => (
                       <TabsTrigger key={lang} value={lang} className="rounded-full px-4 py-2 data-[state=active]:bg-fuchsia-600 text-xs font-bold uppercase">{lang}</TabsTrigger>
                   ))}
               </TabsList>
               {Object.entries(grouped).map(([lang, chars]: any) => (
                   <TabsContent key={lang} value={lang} className="space-y-2">
                       <Accordion type="single" collapsible>
                           {Object.entries(chars).map(([charName, list]: any) => (
                               <AccordionItem key={charName} value={charName} className="border border-white/5 rounded-2xl bg-zinc-900/20 px-4 mb-2">
                                   <AccordionTrigger className="hover:no-underline py-4">
                                       <div className="flex items-center gap-3">
                                           <div className="p-2 bg-fuchsia-900/20 rounded-full text-fuchsia-500"><Mic2 size={16}/></div>
                                           <span className="font-bold text-white capitalize">{charName}</span>
                                           <Badge variant="outline" className="ml-2 text-[10px] rounded-full">{list.length} Echoes</Badge>
                                       </div>
                                   </AccordionTrigger>
                                   <AccordionContent className="pb-4 pt-2 border-t border-white/5 space-y-2">
                                           {(list as any[]).map(v => (
                                               <div key={v.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                                                   <span className="text-xs text-zinc-400 font-mono uppercase flex items-center gap-2">{v.event_trigger || v.type} {v.source === 'FILE' && <Badge variant="secondary" className="text-[8px] h-4">FILE</Badge>}</span>
                                                   <div className="flex gap-2">
                                                       <Button size="icon" variant="ghost" onClick={() => toggleAudio(v.file_url || v.path, v.id)} className={`h-6 w-6 rounded-full ${playing === v.id ? 'text-fuchsia-500' : 'text-green-400'}`}>{playing === v.id ? <Pause size={10}/> : <Play size={10}/>}</Button>
                                                   </div>
                                               </div>
                                           ))}
                                   </AccordionContent>
                               </AccordionItem>
                           ))}
                       </Accordion>
                   </TabsContent>
               ))}
           </Tabs>
       </div>
    </div>
  );
});
VoiceTab.displayName = 'VoiceTab';

// ==========================================
//  TAB 5: NOTICE (Identical to Master)
// ==========================================
const BroadcastTab = memo(() => {
  const [msg, setMsg] = useState('');
  const [header, setHeader] = useState('');
  const [notices, setNotices] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);

  const fetchNotices = async () => { const { data } = await supabase.from('guild_notices').select('*').order('created_at', { ascending: false }); if(data) setNotices(data); };
  useEffect(() => { fetchNotices(); }, []);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return; setUploading(true);
      try { const url = await ImageAPI.uploadImage(file); setImageUrl(url); notify("Success", "Image Attached", 'success'); } 
      catch { notify("Error", "Upload failed", 'error'); } setUploading(false);
  };

  const handlePost = async () => { 
      if (!msg) return; 
      const { error } = await supabase.from('guild_notices').insert({ header, content: msg, image_url: imageUrl });
      if (error) notify("Error", error.message, 'error');
      else { notify("Posted", "Guild Notice Live", 'success'); setMsg(''); setHeader(''); setImageUrl(''); fetchNotices(); }
  };

  const deleteNotice = async (id: string) => { await supabase.from('guild_notices').delete().eq('id', id); notify("Removed", "Notice Deleted", 'success'); fetchNotices(); };
  const insertFormat = (tag: string) => setMsg(prev => `${prev}${tag}`);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-1 space-y-6">
           <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] text-left space-y-4 shadow-2xl h-fit">
              <div className="flex items-center gap-3 mb-2 text-fuchsia-500"><Megaphone size={20} /><h3 className="font-bold text-white">Post Notice</h3></div>
              <InputGroup label="Header" value={header} onChange={setHeader} placeholder="Notice Title..." />
              <div className="space-y-2">
                <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase text-zinc-400 tracking-wider ml-1">Content</label><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={()=>insertFormat('**Bold**')} className="h-6 w-6 p-0 rounded-full hover:bg-white/10"><Bold size={12}/></Button><Button size="sm" variant="ghost" onClick={()=>insertFormat('*Italic*')} className="h-6 w-6 p-0 rounded-full hover:bg-white/10"><Italic size={12}/></Button><Button size="sm" variant="ghost" onClick={()=>insertFormat('`Code`')} className="h-6 w-6 p-0 rounded-full hover:bg-white/10"><Type size={12}/></Button></div></div>
                <Textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Enter guild announcement..." className="bg-black/40 border-white/10 min-h-[140px] rounded-2xl text-lg resize-none focus:border-fuchsia-500/30"/>
              </div>
              <div className="border border-dashed border-white/10 rounded-xl p-4 text-center text-xs text-zinc-500 hover:bg-white/5 cursor-pointer relative" onClick={() => imgInput.current?.click()}>
                  {imageUrl ? <img src={imageUrl} className="h-20 mx-auto object-cover rounded-md"/> : <><ImageIcon className="mx-auto mb-1 w-4 h-4"/> {uploading ? "Uploading..." : "Add Image (Optional)"}</>}
              </div>
              <input type="file" ref={imgInput} className="hidden" accept="image/*" onChange={handleImage} />
              <Button onClick={handlePost} disabled={uploading} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold h-14 rounded-full shadow-lg shadow-fuchsia-900/20 text-lg">POST</Button>
           </div>
       </div>
       <div className="lg:col-span-2 space-y-4"><div className="grid gap-4">{notices.map(n => (<div key={n.id} className="bg-zinc-900/20 border border-white/5 p-6 rounded-[2rem] flex gap-6 items-start group">{n.image_url && <img src={n.image_url} className="w-24 h-24 object-cover rounded-xl border border-white/10" />}<div className="flex-1">{n.header && <h4 className="text-fuchsia-400 font-bold mb-1 text-lg">{n.header}</h4>}<p className="text-zinc-300 text-base leading-relaxed">{n.content}</p><span className="text-xs text-zinc-600 mt-3 block">{new Date(n.created_at).toLocaleDateString()}</span></div><Button size="icon" variant="ghost" onClick={() => deleteNotice(n.id)} className="text-zinc-600 hover:text-primary-500 rounded-full"><Trash2 size={16}/></Button></div>))}</div></div>
    </div>
  );
});
BroadcastTab.displayName = 'BroadcastTab';

// --- HELPERS ---
const TabBtn = memo(({ id, icon: Icon, label, active, onClick }: any) => { return (<button onClick={() => onClick(id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${active === id ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20 scale-105' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><Icon size={16} />{label}</button>); });
TabBtn.displayName = 'TabBtn';
const InputGroup = ({ label, value, onChange, placeholder, className, font, disabled }: any) => (<div className={`space-y-2 ${className}`}><label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">{label}</label><Input value={value || ''} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={`bg-black/40 border-white/10 h-12 rounded-xl focus:border-fuchsia-500/30 ${font} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} /></div>);
const CmdTile = ({ label, icon: Icon, onClick, color }: any) => (<button onClick={onClick} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-black/20 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group"><div className={`p-3 rounded-2xl bg-white/5 transition-colors text-${color}-500 group-hover:bg-${color}-500/20`}><Icon size={24} /></div><span className="text-sm font-bold text-zinc-300">{label}</span></button>);
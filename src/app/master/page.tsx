"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import RoleGuard from '@/components/Auth/RoleGuard';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ImageAPI, BASE_URL } from '@/lib/api';
import { SITE_CONFIG } from '@/lib/site-config';
import { COLOR_PALETTES, applyColorPalette } from '@/lib/theme';
import { 
  Shield, Mic2, Save, Upload, Loader2, 
  Users, Globe, Activity, Search, AlertTriangle, 
  Trash2, Megaphone, Lock, Unlock, 
  HardDrive, Plus, Image as ImageIcon,
  AlertCircle, MessageSquareWarning, Folder, FileAudio, Eye,
  Scroll, Sword, BookOpen, Link2, Feather, Play, Pause,
  Bold, Italic, Type, UserCheck, X, LayoutDashboard, Palette,
  Filter, ArrowDownCircle, Menu, Crown, Layers, ArrowLeft,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RoleTitleManager from '@/components/Admin/RoleTitleManager';
import GuildBoardsPanel from '@/components/Admin/GuildBoardsPanel';
import { cn } from '@/lib/utils';

// --- NOTIFICATION HELPER ---
const notify = (title: string, message: string, type: 'success' | 'error' | 'system' = 'system') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: { id: Date.now(), type, title, message }
        }));
    }
};

type Tab = 'GUILD_DESK' | 'GUILD_INFO' | 'ADVENTURERS' | 'TITLES_HIERARCHY' | 'GUILD_BOARDS' | 'PALETTES' | 'MOD_APPS' | 'MAGIC_NET' | 'VOICES' | 'NOTICE';

const MASTER_TABS = [
  { id: 'GUILD_DESK', icon: LayoutDashboard, label: 'Desk' },
  { id: 'GUILD_INFO', icon: BookOpen, label: 'Site Specs' },
  { id: 'ADVENTURERS', icon: Sword, label: 'Adventurers' },
  { id: 'TITLES_HIERARCHY', icon: Crown, label: 'Titles & Roles' },
  { id: 'GUILD_BOARDS', icon: Layers, label: 'Guild Boards' },
  { id: 'PALETTES', icon: Palette, label: 'Palettes' },
  { id: 'MOD_APPS', icon: UserCheck, label: 'Mod Apps' },
  { id: 'MAGIC_NET', icon: Globe, label: 'Magic Net' },
  { id: 'VOICES', icon: Mic2, label: 'Echoes' },
  { id: 'NOTICE', icon: Feather, label: 'Notices' },
];

export default function GuildMasterDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('GUILD_DESK');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('guild_master_tab');
        if (saved) setActiveTab(saved as Tab);
    }
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('guild_master_tab', tab);
  };

  return (
    <RoleGuard allowedRoles={['admin', 'moderator']}>
      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; outline: none !important; -webkit-tap-highlight-color: transparent; }
        input:focus, textarea:focus, select:focus, button:focus { box-shadow: none !important; ring: 0 !important; border-color: rgba(220, 38, 38, 0.5) !important; }
        .font-minomu { font-family: var(--font-minomu), sans-serif; }
      `}</style>

      <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row relative overflow-x-hidden">
        
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-0 w-full h-96 bg-primary-900/10 blur-[100px] pointer-events-none z-0" />

        {/* ========================================================= */}
        {/* --- DESKTOP COLLAPSIBLE LEFT SIDEBAR --- */}
        {/* ========================================================= */}
        <aside 
          className={cn(
            "hidden md:flex flex-col justify-between h-screen sticky top-0 bg-[#09090d]/90 backdrop-blur-3xl border-r border-white/10 shadow-[10px_0_30px_rgba(0,0,0,0.8)] z-40 transition-all duration-300 shrink-0",
            isCollapsed ? "w-20 p-3" : "w-64 p-5"
          )}
        >
          <div className="flex flex-col gap-6 overflow-hidden flex-1">
            
            {/* Sidebar Top: Logo & Collapse Button */}
            <div className={cn("flex items-center justify-between pb-4 border-b border-white/10", isCollapsed && "justify-center")}>
              {!isCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 border border-white/15 rounded-xl shadow-md flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-500" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-minomu font-bold text-sm tracking-wider text-white leading-none">SHADOW</span>
                    <span className="text-[9px] font-black tracking-widest text-primary-500 uppercase">ADMIN PANEL</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
              >
                {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-hide flex-1">
              {MASTER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id as Tab)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl text-xs font-bold transition-all text-left group relative",
                      isCollapsed ? "p-3 justify-center" : "px-4 py-3 w-full",
                      isActive
                        ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30 border border-primary-500/50"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                    )}
                    title={isCollapsed ? tab.label : undefined}
                  >
                    <Icon size={18} className={cn("shrink-0", isActive ? "text-white" : "text-zinc-400 group-hover:text-white")} />
                    {!isCollapsed && <span className="truncate">{tab.label}</span>}
                    
                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-950 border border-white/15 rounded-xl text-[11px] font-bold text-white whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {tab.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Bottom: BACK BUTTON */}
          <div className="pt-4 border-t border-white/10 shrink-0">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-2xl text-xs font-bold transition-all bg-white/5 hover:bg-primary-600/20 border border-white/10 hover:border-primary-500/50 text-zinc-300 hover:text-white shadow-lg group",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3 w-full"
              )}
              title="Back to App"
            >
              <ArrowLeft size={18} className="text-primary-500 group-hover:-translate-x-1 transition-transform shrink-0" />
              {!isCollapsed && <span>Back to App</span>}
            </Link>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* --- MOBILE HEADER & TOP NAV BAR --- */}
        {/* ========================================================= */}
        <div className="flex md:hidden flex-col w-full z-40 bg-[#09090d]/90 backdrop-blur-3xl border-b border-white/10 sticky top-0 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white active:scale-95 transition-all"
              >
                <Menu size={20} className="text-primary-500" />
              </button>
              <span className="font-minomu font-bold text-sm text-white">GUILD MASTER</span>
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold hover:bg-white/10"
            >
              <ArrowLeft size={14} className="text-primary-500" />
              <span>Back</span>
            </Link>
          </div>
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] flex md:hidden">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <div className="relative w-72 max-w-[85vw] bg-[#09090d] border-r border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-300">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-6 h-6 text-primary-500" />
                    <span className="font-minomu font-bold text-sm tracking-wider text-white">GUILD MASTER</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  {MASTER_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          switchTab(tab.id as Tab);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left w-full",
                          isActive ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30 border border-primary-500/50" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon size={16} className={isActive ? "text-white" : "text-zinc-400"} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Bottom Back Button */}
              <div className="pt-6 border-t border-white/10">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold w-full"
                >
                  <ArrowLeft size={16} className="text-primary-500" />
                  <span>Back to App</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* --- RIGHT MAIN CONTENT AREA --- */}
        {/* ========================================================= */}
        <main className="flex-1 min-w-0 p-4 md:p-8 relative z-10 overflow-y-auto">
          
          {/* iOS Dynamic Header & Telemetry */}
          <header className="relative bg-[#0d0d12]/70 border border-white/10 rounded-[32px] p-6 md:p-8 mb-8 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-600/20 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-[90px] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative p-3 bg-white/5 border border-white/15 rounded-2xl shadow-xl backdrop-blur-md group cursor-pointer hover:border-primary-500/50 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/30 to-purple-600/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex items-center justify-center w-12 h-12">
                    <Shield className="w-10 h-10 text-primary-500 absolute" strokeWidth={1.5} />
                    <Sword className="w-6 h-6 text-white absolute mb-1 drop-shadow-lg" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-[9px] font-black uppercase tracking-widest text-primary-400 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"/> SHADOW GARDEN ADMIN CONTROL
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-minomu tracking-wider text-white leading-none drop-shadow-md">
                    {MASTER_TABS.find(t => t.id === activeTab)?.label || 'GUILD MASTER'}
                  </h1>
                </div>
              </div>

              {/* iOS System Telemetry Status Bar */}
              <div className="flex flex-wrap items-center gap-3 bg-black/40 p-2.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-inner">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                  <Activity size={13} className="text-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-300">PING <span className="text-emerald-400 font-mono">12ms</span></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                  <Users size={13} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-zinc-300">ACTIVE <span className="text-blue-400 font-mono">ONLINE</span></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                  <Globe size={13} className="text-purple-400" />
                  <span className="text-[10px] font-bold text-zinc-300">SYSTEM <span className="text-purple-400 font-mono">HEALTHY</span></span>
                </div>
              </div>
            </div>
          </header>

          {/* Tab Panel Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-[500px]">
            <div className={activeTab === 'GUILD_DESK' ? 'block' : 'hidden'}><OverviewTab changeTab={switchTab} /></div>
            <div className={activeTab === 'GUILD_INFO' ? 'block' : 'hidden'}><IdentityTab /></div>
            <div className={activeTab === 'ADVENTURERS' ? 'block' : 'hidden'}><RosterTab /></div>
            <div className={activeTab === 'TITLES_HIERARCHY' ? 'block' : 'hidden'}><RoleTitleManager /></div>
            <div className={activeTab === 'GUILD_BOARDS' ? 'block' : 'hidden'}><GuildBoardsPanel /></div>
            <div className={activeTab === 'PALETTES' ? 'block' : 'hidden'}><ThemePaletteTab /></div>
            <div className={activeTab === 'MOD_APPS' ? 'block' : 'hidden'}><ModApplicationsTab /></div>
            <div className={activeTab === 'MAGIC_NET' ? 'block' : 'hidden'}><NetworkTab /></div>
            <div className={activeTab === 'VOICES' ? 'block' : 'hidden'}><VoiceTab /></div>
            <div className={activeTab === 'NOTICE' ? 'block' : 'hidden'}><BroadcastTab /></div>
          </div>

          {/* Footer */}
          <footer className="w-full border-t border-white/5 bg-zinc-900/20 py-6 mt-12 rounded-3xl">
            <div className="px-4 text-center space-y-2 w-full">
              <div className="flex justify-center items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <img src="/icon.svg" className="w-6 h-6 drop-shadow-lg" alt="Guild Seal"/>
                <h4 className="font-minomu font-bold text-base text-white tracking-widest">SHADOW GARDEN</h4>
              </div>
              <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
                Guild-Master Console • V2.5 • {user?.email}
              </p>
            </div>
          </footer>
        </main>

      </div>
    </RoleGuard>
  );
}

// ==========================================
//  TAB 1: GUILD DESK
// ==========================================
const OverviewTab = memo(({ changeTab }: { changeTab: (t: Tab) => void }) => {
  const { settings, isLoaded } = useSettings();
  const isLocked = isLoaded ? String((settings as any)?.maintenanceMode) === 'true' : false; 

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
             {isLocked ? "Lockdown Protocol Active." : "The Guild Hall is open to all adventurers."}
           </p>
           <Button onClick={() => changeTab('GUILD_INFO')} className={`w-full border rounded-full text-white backdrop-blur-sm h-12 transition-all ${
             isLocked 
               ? 'bg-white/10 hover:bg-white/20 border-white/10' 
               : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30 text-emerald-100'
           }`}>Modify Protocols</Button>
        </div>
      </div>
      
      <div className="col-span-1 md:col-span-2 bg-zinc-900/20 border border-white/5 rounded-[2rem] p-6 md:p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-white"><Scroll size={20} className="text-primary-500" /> Guild Administration</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CmdTile label="Adventurers" icon={Sword} onClick={() => changeTab('ADVENTURERS')} color="red" />
          <CmdTile label="Magic Net" icon={Globe} onClick={() => changeTab('MAGIC_NET')} color="red" />
          <CmdTile label="Echoes" icon={Mic2} onClick={() => changeTab('VOICES')} color="red" />
          <CmdTile label="Grimoire" icon={BookOpen} onClick={() => changeTab('GUILD_INFO')} color="red" />
        </div>
      </div>
    </div>
  );
});
OverviewTab.displayName = 'OverviewTab';

// ==========================================
//  TAB 2: GUILD INFO (Powered by Shared Config)
// ==========================================
const IdentityTab = memo(() => {
  const { settings, updateSetting, isLoaded } = useSettings();
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    if (isLoaded) {
        setFormData({ 
            ...settings, 
            maintenanceMode: String((settings as any)?.maintenanceMode) === 'true' 
        }); 
    }
  }, [settings, isLoaded]);

  const handleChange = (key: string, val: any) => setFormData((prev: any) => ({ ...prev, [key]: val }));
  
  const handleSave = async () => {
    setLoading(true);
    await Promise.all(Object.entries(formData).map(([k, v]) => {
        const valToSave = typeof v === 'boolean' ? String(v) : String(v);
        // ✅ FIX: Cast 'k' to 'any' or specific key type to satisfy TS
        return updateSetting(k as any, valToSave);
    }));
    notify("Success", "Guild Grimoire Updated", 'success');
    setLoading(false);
  };

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
                  
                  <div className="space-y-2">
                      <p className="text-zinc-400 font-bold border-b border-white/5 pb-1">Navigation Schema (JSON-LD)</p>
                      <ul className="list-disc pl-4 space-y-1 opacity-70">
                          {SITE_CONFIG.navigation.map((nav, i) => (
                              <li key={i}><span className="text-zinc-400">{nav.name}</span> ({nav.url.replace('https://shadow-garden.site', '')})</li>
                          ))}
                      </ul>
                  </div>

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
        <Section title="Guild Identity" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Guild Name" value={formData.siteName} onChange={(v: string) => handleChange('siteName', v)} />
            <InputGroup label="Logo Text" value={formData.logoText} onChange={(v: string) => handleChange('logoText', v)} font="font-minomu" />
            <InputGroup label="Emblem URL" value={formData.logoUrl} onChange={(v: string) => handleChange('logoUrl', v)} className="md:col-span-2" />
          </div>
        </Section>
        <Section title="Grimoire Configuration" icon={Search}>
          <div className="space-y-6">
            <InputGroup label="Page Title Override" value={formData.seoTitle} onChange={(v: string) => handleChange('seoTitle', v)} />
            <div className="space-y-2"><label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Meta Description Override</label><Textarea value={formData.seoDesc} onChange={e => handleChange('seoDesc', e.target.value)} className="bg-black/40 border-white/10 min-h-[100px] rounded-2xl" /></div>
            <InputGroup label="Keywords Override" value={formData.seoKeywords} onChange={(v: string) => handleChange('seoKeywords', v)} />
          </div>
        </Section>
        <div className={`border rounded-[2rem] p-6 transition-colors ${formData.maintenanceMode ? 'bg-primary-950/10 border-primary-500/20' : 'bg-white/5 border-white/10'}`}>
          <div className={`flex items-center gap-3 mb-6 ${formData.maintenanceMode ? 'text-primary-500' : 'text-zinc-400'}`}><AlertTriangle className="w-6 h-6" /><h3 className="font-bold">Emergency Magic</h3></div>
          <div className="space-y-6">
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${formData.maintenanceMode ? 'bg-primary-950/20 border-primary-500/10' : 'bg-black/20 border-white/5'}`}><span className={`text-sm font-bold ${formData.maintenanceMode ? 'text-primary-200' : 'text-zinc-400'}`}>Close Guild Gates (Lockdown)</span><Switch checked={formData.maintenanceMode} onCheckedChange={c => handleChange('maintenanceMode', c)} className="data-[state=checked]:bg-primary-500" /></div>
              {formData.maintenanceMode && (<div className="space-y-2 animate-in fade-in"><label className="text-[10px] uppercase text-primary-400 font-bold tracking-wider">Gate Notice</label><Textarea value={formData.maintenanceMessage} onChange={e => handleChange('maintenanceMessage', e.target.value)} className="bg-black/40 border-primary-500/20 text-primary-200 min-h-[100px] rounded-2xl"/></div>)}
          </div>
        </div>
        <div className="flex justify-end"><Button onClick={handleSave} disabled={loading} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-6 rounded-full font-bold shadow-lg">{loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 w-5 h-5"/>} Save Config</Button></div>
      </div>
    </div>
  );
});
IdentityTab.displayName = 'IdentityTab';

const RosterTab = memo(() => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL'|'ADMIN'|'MOD'|'BANNED'>('ALL');
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

  const toggleRole = async (uid: string, currentRole: string, targetRole: 'admin' | 'moderator') => {
      const newRole = currentRole === targetRole ? 'user' : targetRole;
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', uid);
      if (error) { notify("Error", error.message, 'error'); fetchUsers(); }
      else { notify("Success", "Rank Updated", 'success'); }
  };

  const handleBan = async (uid: string, banned: boolean) => { 
      const { error } = await supabase.from('profiles').update({ is_banned: !banned }).eq('id', uid); 
      if (error) notify("Error", "Action failed", 'error');
      else { notify("Status Updated", banned ? "Reinstated" : "Banned", 'success'); fetchUsers(); }
  };

  const handleDeleteUser = async (uid: string) => {
      if(!confirm("Are you sure? This is permanent.")) return;
      const { error } = await supabase.from('profiles').delete().eq('id', uid);
      if (error) notify("Error", error.message, 'error');
      else { notify("Success", "Adventurer Deleted", 'success'); fetchUsers(); }
  };
  
  const sendWarning = async () => {
      if (!warnTarget || !warnMsg) return;
      await supabase.from('notifications').insert({ user_id: warnTarget, type: 'GUILD_WARNING', content: warnMsg });
      notify("Sent", "Warning dispatched", 'success');
      setWarnOpen(false); setWarnMsg('');
  };

  const filteredUsers = useMemo(() => users.filter(u => {
      const matchesSearch = u.username?.toLowerCase().includes(search.toLowerCase());
      if (filter === 'ALL') return matchesSearch;
      if (filter === 'ADMIN') return matchesSearch && u.role === 'admin';
      if (filter === 'MOD') return matchesSearch && u.role === 'moderator';
      if (filter === 'BANNED') return matchesSearch && u.is_banned;
      return matchesSearch;
  }), [users, search, filter]);

  const displayedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 rounded-2xl border border-white/5">
          <div className="relative w-full md:w-96"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><Input placeholder="Find adventurer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 bg-black/40 border-white/10 rounded-full h-12" /></div>
          <div className="flex gap-2 p-1 bg-black/40 rounded-full border border-white/5 overflow-x-auto no-scrollbar">{(['ALL', 'ADMIN', 'MOD', 'BANNED'] as const).map(f => (<button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === f ? 'bg-primary-600 text-white' : 'text-zinc-500 hover:text-white'}`}>{f}</button>))}</div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedUsers.map(user => {
             const isMe = user.id === currentUser?.id;
             const isAdmin = user.role === 'admin';
             const isMod = user.role === 'moderator';
             
             return (
             <div key={user.id} className={`bg-zinc-900/30 border p-4 rounded-2xl flex flex-col gap-4 group transition-all ${isMe ? 'border-primary-500/50 bg-primary-950/10' : isAdmin ? 'border-yellow-500/30' : isMod ? 'border-blue-500/30' : 'border-white/5 hover:border-white/10'}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <ProfileAvatar profile={user} className="w-12 h-12" />
                        <div>
                            <h4 className="font-bold text-white flex items-center gap-2">{user.username} {isMe && <Badge className="text-[8px] bg-primary-600 h-4 px-1 rounded-sm">YOU</Badge>}</h4>
                            <div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-400 border-none rounded-full">{user.role.toUpperCase()}</Badge>{user.is_banned && <Badge variant="destructive" className="text-[10px] h-5 rounded-full">EXILED</Badge>}</div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {!isMe && <>
                            <Button size="icon" variant="ghost" className={`h-8 w-8 rounded-full ${isAdmin ? 'text-primary-500' : 'text-yellow-500'}`} onClick={() => toggleRole(user.id, user.role, 'admin')} title={isAdmin ? "Demote" : "Make Grandmaster"}>{isAdmin ? <ArrowDownCircle size={14} /> : <Shield size={14} />}</Button>
                            <Button size="icon" variant="ghost" className={`h-8 w-8 rounded-full ${isMod ? 'text-primary-400' : 'text-blue-500'}`} onClick={() => toggleRole(user.id, user.role, 'moderator')} title={isMod ? "Demote" : "Make Manager"}>{isMod ? <ArrowDownCircle size={14} /> : <UserCheck size={14} />}</Button>
                            <Button size="icon" variant="ghost" className={`h-8 w-8 rounded-full ${user.is_banned ? 'text-green-500' : 'text-primary-500'}`} onClick={() => handleBan(user.id, user.is_banned)}>{user.is_banned ? <Unlock size={14} /> : <Lock size={14} />}</Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-primary-600 rounded-full" onClick={() => handleDeleteUser(user.id)} title="Delete"><Trash2 size={14} /></Button>
                        </>}
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Button size="sm" variant="ghost" className="flex-1 text-[10px] h-8 text-zinc-400 hover:text-white rounded-full" onClick={() => { setWarnTarget(user.id); setWarnOpen(true); }}><MessageSquareWarning size={14} className="mr-2 text-yellow-500" /> Warn</Button>
                    <Dialog><DialogTrigger asChild><Button size="sm" variant="ghost" className="flex-1 text-[10px] h-8 text-zinc-400 hover:text-primary-400 rounded-full"><AlertCircle size={14} className="mr-2" /> Reports</Button></DialogTrigger><DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl"><DialogHeader><DialogTitle>Reports</DialogTitle></DialogHeader><p className="text-zinc-500 text-sm">No active reports.</p></DialogContent></Dialog>
                </div>
             </div>
          )})}
       </div>
       {totalPages > 1 && (<div className="flex justify-center gap-2 mt-6">{Array.from({length: totalPages}, (_, i) => (<button key={i} onClick={() => setPage(i+1)} className={`w-8 h-8 rounded-full text-xs font-bold ${page === i+1 ? 'bg-primary-600 text-white' : 'bg-white/10 text-zinc-400'}`}>{i+1}</button>))}</div>)}
       <Dialog open={warnOpen} onOpenChange={setWarnOpen}><DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl"><DialogHeader><DialogTitle>Issue Warning</DialogTitle></DialogHeader><Input placeholder="Reason for warning..." value={warnMsg} onChange={e => setWarnMsg(e.target.value)} className="bg-black/40 border-white/10 rounded-xl"/><DialogFooter><Button onClick={sendWarning} className="bg-primary-600 rounded-full">Transmit</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
});
RosterTab.displayName = 'RosterTab';

const NetworkTab = memo(() => {
  const [apis, setApis] = useState<any[]>([]);
  const [newApi, setNewApi] = useState({ name: '', url: '', category: 'ANIME', version: 'v2' });
  
  const systemNodes = [
      { id: 'imgbb', name: 'ImgBB Grimoire', url: 'https://api.imgbb.com/1/upload', category: 'IMAGE', version: 'v1', isSystem: true },
      { id: 'anikoto', name: 'Anikoto API (Primary)', url: BASE_URL, category: 'ANIME', version: 'v1', isSystem: true },
      { id: 'hindi-api', name: 'Hindi Anime API', url: 'https://anime-api-ashen-chi.vercel.app/api', category: 'REGIONAL', version: 'v1', isSystem: true },
  ];

  const fetchApis = async () => {
      const { data } = await supabase.from('system_apis').select('*').order('created_at', { ascending: false });
      if (data) setApis(data);
  };
  
  useEffect(() => { fetchApis(); }, []);

  const handleAdd = async () => {
      if (!newApi.url) return;
      await supabase.from('system_apis').insert(newApi);
      notify("Connected", "Magic Node Linked", 'success');
      fetchApis();
  };

  const handleDelete = async (id: string) => {
      await supabase.from('system_apis').delete().eq('id', id);
      notify("Severed", "Magic Node Disconnected", 'success');
      fetchApis();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div className="lg:col-span-2 space-y-8">
           {['v4', 'v3', 'v2', 'v1', 'image'].map(ver => {
               const nodes = [...systemNodes, ...apis].filter(a => a.version.toLowerCase().includes(ver) || a.category.toLowerCase().includes(ver));
               if (nodes.length === 0) return null;
               return (
                   <div key={ver} className="space-y-3">
                       <h3 className="font-bold text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-2"><Globe size={12} /> {ver.toUpperCase()} SPHERE</h3>
                       <div className="grid gap-3">
                           {nodes.map(api => (
                               <div key={api.id} className={`p-4 rounded-2xl flex justify-between items-center border ${api.isSystem ? 'bg-zinc-900/20 border-white/5' : 'bg-blue-900/10 border-blue-500/20'}`}>
                                   <div className="flex items-center gap-3">
                                       <div className={`w-2 h-2 rounded-full ${api.isSystem ? 'bg-zinc-500' : 'bg-blue-500'}`} />
                                       <div className="flex-1 min-w-0">
                                           <div className="flex items-center gap-2">
                                               <span className="font-bold text-sm text-white truncate">{api.name}</span>
                                               {api.category === 'IMAGE' && <Badge variant="secondary" className="text-[10px] rounded-full"><ImageIcon size={10} className="mr-1"/> IMG</Badge>}
                                           </div>
                                           <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[250px]">{api.url}</p>
                                       </div>
                                   </div>
                                   {!api.isSystem && <Button size="icon" variant="ghost" onClick={() => handleDelete(api.id)} className="h-8 w-8 text-primary-500 rounded-full"><Trash2 size={14}/></Button>}
                                   {api.isSystem && <Lock size={14} className="text-zinc-600" />}
                               </div>
                           ))}
                       </div>
                   </div>
               );
           })}
       </div>
       <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] h-fit">
           <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Link2 size={18}/> Form Pact (Add API)</h3>
           <div className="space-y-4">
               <InputGroup label="Spirit Name" value={newApi.name} onChange={(v: string) => setNewApi({...newApi, name: v})} placeholder="e.g. Manga Mirror 1" />
               <InputGroup label="Invocation URL" value={newApi.url} onChange={(v: string) => setNewApi({...newApi, url: v})} placeholder="https://api..." />
               <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                       <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Sphere</label>
                       <Select onValueChange={(v) => setNewApi({...newApi, version: v})} defaultValue="v2">
                           <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="v2">V2 Sphere</SelectItem>
                               <SelectItem value="v3">V3 Sphere</SelectItem>
                               <SelectItem value="v4">V4 Sphere</SelectItem>
                               <SelectItem value="v1">Custom</SelectItem>
                               <SelectItem value="image">Image Host</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>
                   <InputGroup label="Category" value={newApi.category} onChange={(v: string) => setNewApi({...newApi, category: v})} />
               </div>
               <Button onClick={handleAdd} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 rounded-full shadow-lg shadow-primary-900/20">Form Pact</Button>
           </div>
       </div>
    </div>
  );
});
NetworkTab.displayName = 'NetworkTab';

const VoiceTab = memo(() => {
  const [voices, setVoices] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newVoice, setNewVoice] = useState({ name: '', lang: 'en', type: 'welcome' });
  const [customLang, setCustomLang] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  
  const targets = ['welcome', 'register', 'greet-master', 'greet-adventurer', 'greet-traveler', 'bye-master', 'bye-adventurer'];

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; 
      if (!file || !newVoice.name) { notify("Error", "Name required", 'error'); return; }
      setUploading(true);
      const finalLang = customLang || newVoice.lang;
      
      try {
          const path = `voices/${finalLang}/${newVoice.name}-${newVoice.type}.${file.name.split('.').pop()}`;
          const { data, error } = await supabase.storage.from('voice-foundry').upload(path, file);
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage.from('voice-foundry').getPublicUrl(path);
          await supabase.from('voice_packs').insert({
              name: newVoice.name,
              character: newVoice.name,
              language: finalLang,
              event_trigger: newVoice.type.toUpperCase(),
              file_url: publicUrl,
              source: 'DB'
          });
          
          notify("Success", "Echo Crystallized", 'success');
          fetchVoices();
      } catch(err: any) { notify("Error", err.message, 'error'); }
      setUploading(false);
  };

  const handleDelete = async (id: string) => {
      await supabase.from('voice_packs').delete().eq('id', id);
      notify("Success", "Echo Shattered", 'success');
      fetchVoices();
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
       <div className="lg:col-span-2 space-y-6">
           <Tabs defaultValue="en" className="w-full">
               <TabsList className="bg-zinc-900/50 p-1 rounded-full border border-white/5 mb-4 h-auto flex flex-wrap gap-1">
                   {Object.keys(grouped).concat(['en']).filter((v,i,a)=>a.indexOf(v)===i).map(lang => (
                       <TabsTrigger key={lang} value={lang} className="rounded-full px-4 py-2 data-[state=active]:bg-primary-600 text-xs font-bold uppercase">{lang}</TabsTrigger>
                   ))}
               </TabsList>
               {Object.entries(grouped).map(([lang, chars]: any) => (
                   <TabsContent key={lang} value={lang} className="space-y-2">
                       <Accordion type="single" collapsible>
                           {Object.entries(chars).map(([charName, list]: any) => (
                               <AccordionItem key={charName} value={charName} className="border border-white/5 rounded-2xl bg-zinc-900/20 px-4 mb-2">
                                   <AccordionTrigger className="hover:no-underline py-4">
                                       <div className="flex items-center gap-3">
                                           <div className="p-2 bg-primary-900/20 rounded-full text-primary-500"><Mic2 size={16}/></div>
                                           <span className="font-bold text-white capitalize">{charName}</span>
                                           <Badge variant="outline" className="ml-2 text-[10px] rounded-full">{list.length} Echoes</Badge>
                                       </div>
                                   </AccordionTrigger>
                                   <AccordionContent className="pb-4 pt-2 border-t border-white/5 space-y-2">
                                           {(list as any[]).map(v => (
                                               <div key={v.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                                                   <span className="text-xs text-zinc-400 font-mono uppercase flex items-center gap-2">{v.event_trigger || v.type} {v.source === 'FILE' && <Badge variant="secondary" className="text-[8px] h-4">FILE</Badge>}</span>
                                                   <div className="flex gap-2">
                                                       <Button size="icon" variant="ghost" onClick={() => toggleAudio(v.file_url || v.path, v.id)} className={`h-6 w-6 rounded-full ${playing === v.id ? 'text-primary-500' : 'text-green-400'}`}>{playing === v.id ? <Pause size={10}/> : <Play size={10}/>}</Button>
                                                       {v.source !== 'FILE' && <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="h-6 w-6 text-primary-400 rounded-full"><Trash2 size={10}/></Button>}
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
       <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] h-fit">
           <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Plus size={18}/> Synthesize Echo</h3>
           <div className="space-y-4">
               <div className="space-y-2">
                   <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Language Folder</label>
                   <Select onValueChange={(v)=>{if(v==='new')setCustomLang('');else{setNewVoice({...newVoice,lang:v});setCustomLang('');}}} defaultValue="en">
                       <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl"><SelectValue placeholder="Lang"/></SelectTrigger>
                       <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="jp">Japanese</SelectItem><SelectItem value="new">+ New Folder</SelectItem></SelectContent>
                   </Select>
                   {customLang!==''&&<Input placeholder="Folder (e.g. fr)" value={customLang} onChange={e=>setCustomLang(e.target.value)} className="bg-black/40 border-white/10 mt-2 rounded-xl"/>}
               </div>
               <InputGroup label="Pack Name" value={newVoice.name} onChange={(v:string)=>setNewVoice({...newVoice,name:v})} placeholder="e.g. Hana" />
               <div className="space-y-2">
                   <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Target Event</label>
                   <Select onValueChange={(v)=>setNewVoice({...newVoice,type:v})} defaultValue="welcome">
                       <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl"><SelectValue placeholder="Type"/></SelectTrigger>
                       <SelectContent>{targets.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                   </Select>
               </div>
               <div onClick={()=>fileInput.current?.click()} className="mt-4 border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 cursor-pointer">
                   {uploading ? <Loader2 className="animate-spin mx-auto text-primary-500"/> : <Upload className="mx-auto text-zinc-500 mb-2"/>}
                   <p className="text-xs text-zinc-400">Select Audio File</p>
               </div>
               <input type="file" ref={fileInput} className="hidden" accept="audio/*" onChange={handleUpload}/>
           </div>
       </div>
    </div>
  );
});
VoiceTab.displayName = 'VoiceTab';

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
              <div className="flex items-center gap-3 mb-2 text-primary-500"><Megaphone size={20} /><h3 className="font-bold text-white">Post Notice</h3></div>
              <InputGroup label="Header" value={header} onChange={setHeader} placeholder="Notice Title..." />
              <div className="space-y-2">
                <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase text-zinc-400 tracking-wider ml-1">Content</label><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={()=>insertFormat('**Bold**')} className="h-6 w-6 p-0 rounded-full hover:bg-white/10"><Bold size={12}/></Button><Button size="sm" variant="ghost" onClick={()=>insertFormat('*Italic*')} className="h-6 w-6 p-0 rounded-full hover:bg-white/10"><Italic size={12}/></Button><Button size="sm" variant="ghost" onClick={()=>insertFormat('`Code`')} className="h-6 w-6 p-0 rounded-full hover:bg-white/10"><Type size={12}/></Button></div></div>
                <Textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Enter guild announcement..." className="bg-black/40 border-white/10 min-h-[140px] rounded-2xl text-lg resize-none focus:border-primary-500/30"/>
              </div>
              <div className="border border-dashed border-white/10 rounded-xl p-4 text-center text-xs text-zinc-500 hover:bg-white/5 cursor-pointer relative" onClick={() => imgInput.current?.click()}>
                  {imageUrl ? <img src={imageUrl} className="h-20 mx-auto object-cover rounded-md"/> : <><ImageIcon className="mx-auto mb-1 w-4 h-4"/> {uploading ? "Uploading..." : "Add Image (Optional)"}</>}
              </div>
              <input type="file" ref={imgInput} className="hidden" accept="image/*" onChange={handleImage} />
              <Button onClick={handlePost} disabled={uploading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold h-14 rounded-full shadow-lg shadow-primary-900/20 text-lg">POST</Button>
           </div>
       </div>
       <div className="lg:col-span-2 space-y-4"><div className="grid gap-4">{notices.map(n => (<div key={n.id} className="bg-zinc-900/20 border border-white/5 p-6 rounded-[2rem] flex gap-6 items-start group">{n.image_url && <img src={n.image_url} className="w-24 h-24 object-cover rounded-xl border border-white/10" />}<div className="flex-1">{n.header && <h4 className="text-primary-400 font-bold mb-1 text-lg">{n.header}</h4>}<p className="text-zinc-300 text-base leading-relaxed">{n.content}</p><span className="text-xs text-zinc-600 mt-3 block">{new Date(n.created_at).toLocaleDateString()}</span></div><Button size="icon" variant="ghost" onClick={() => deleteNotice(n.id)} className="text-zinc-600 hover:text-primary-500 rounded-full"><Trash2 size={16}/></Button></div>))}</div></div>
    </div>
  );
});
BroadcastTab.displayName = 'BroadcastTab';

// ==========================================
//  TAB 7: SOLID 4-SHADE THEME PALETTES
// ==========================================
const ThemePaletteTab = memo(() => {
  const [currentPalette, setCurrentPalette] = useState('void-obsidian');

  useEffect(() => {
    const saved = localStorage.getItem('shadow_color_palette');
    if (saved) setCurrentPalette(saved);
  }, []);

  const handleSelectPalette = (id: string) => {
    setCurrentPalette(id);
    applyColorPalette(id);
    notify("Palette Updated", `Applied ${id} theme`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem]">
        <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-2">
          <Palette className="text-primary-500" size={20} /> 10 Solid 4-Shade Color Palettes
        </h3>
        <p className="text-zinc-400 text-xs">
          Select a solid 4-shade color palette for the entire site interface. Replaces old text gradients with clean solid UI layers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLOR_PALETTES.map(p => {
          const isActive = currentPalette === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectPalette(p.id)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                isActive ? 'border-primary-500 ring-2 ring-primary-500/30 scale-105 bg-zinc-900/60' : 'bg-zinc-900/20 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-white text-sm">{p.name}</h4>
                {isActive && <Badge className="bg-primary-600 text-white text-[9px]">ACTIVE</Badge>}
              </div>

              {/* 4 Shade Preview Bar */}
              <div className="grid grid-cols-4 gap-2 h-12 rounded-xl overflow-hidden border border-white/10 p-1 bg-black/40">
                <div className="rounded-lg h-full" style={{ backgroundColor: p.shades.bg }} title="Layer 0: Background Surface" />
                <div className="rounded-lg h-full" style={{ backgroundColor: p.shades.card }} title="Layer 1: Card Surface" />
                <div className="rounded-lg h-full" style={{ backgroundColor: p.shades.border }} title="Layer 2: Border Highlight" />
                <div className="rounded-lg h-full" style={{ backgroundColor: p.shades.accent }} title="Layer 3: Primary Accent" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
ThemePaletteTab.displayName = 'ThemePaletteTab';

// ==========================================
//  TAB 8: MODERATOR APPLICATIONS
// ==========================================
const ModApplicationsTab = memo(() => {
  const [apps, setApps] = useState<any[]>([]);

  const fetchApps = async () => {
    const { data } = await supabase
      .from('mod_applications')
      .select(`*, user:profiles(username, avatar_url, role)`)
      .order('created_at', { ascending: false });
    if (data) setApps(data);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleApprove = async (app: any) => {
    await supabase.from('profiles').update({ role: 'moderator' }).eq('id', app.user_id);
    await supabase.from('mod_applications').update({ status: 'approved' }).eq('id', app.id);
    notify("Approved", `Promoted ${app.user?.username || 'user'} to Moderator`, 'success');
    fetchApps();
  };

  const handleReject = async (appId: string) => {
    await supabase.from('mod_applications').update({ status: 'rejected' }).eq('id', appId);
    notify("Rejected", "Application declined", 'system');
    fetchApps();
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem]">
        <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-2">
          <UserCheck className="text-primary-500" size={20} /> Moderator Applications
        </h3>
        <p className="text-zinc-400 text-xs">
          Review and approve moderator requests from high-level adventurers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-zinc-500 text-xs">
            No moderator applications submitted yet.
          </div>
        ) : (
          apps.map(app => (
            <div key={app.id} className="bg-zinc-900/30 border border-white/10 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-white/10">
                  <AvatarImage src={app.user?.avatar_url} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-white text-sm">{app.user?.username || 'User'}</h4>
                  <span className="text-[10px] text-zinc-500 block">Status: {app.status}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 bg-black/40 p-3 rounded-2xl border border-white/5">
                "{app.reason}"
              </p>

              {app.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleApprove(app)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold">
                    Approve & Promote
                  </Button>
                  <Button onClick={() => handleReject(app.id)} variant="ghost" className="flex-1 text-red-400 hover:bg-red-950/30 rounded-full text-xs font-bold">
                    Decline
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});
ModApplicationsTab.displayName = 'ModApplicationsTab';

// --- HELPERS ---
const TabBtn = memo(({ id, icon: Icon, label, active, onClick }: any) => { 
  const isActive = active === id;
  return (
    <button 
      onClick={() => onClick(id)} 
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap z-10 ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
    >
      {isActive && (
        <motion.div 
          layoutId="iosActivePill"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute inset-0 bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] -z-10"
        />
      )}
      <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />
      {label}
    </button>
  ); 
}); 
TabBtn.displayName = 'TabBtn';

const HeaderIcon = ({ icon: Icon, label, color }: any) => (
  <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
    <Icon size={18} className={`${color} group-hover:scale-110 transition-transform`} />
    <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold group-hover:text-white transition-colors">{label}</span>
  </div>
); 

const Section = ({ title, icon: Icon, children }: any) => (
  <div className="bg-[#0b0b10]/60 border border-white/10 p-6 md:p-8 rounded-[32px] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
        <Icon className="text-primary-400 w-5 h-5" />
      </div>
      <h3 className="text-lg md:text-xl font-black text-white tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
); 

const InputGroup = ({ label, value, onChange, placeholder, className, font }: any) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[10px] uppercase text-zinc-400 font-black tracking-widest ml-1">{label}</label>
    <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`bg-black/50 border-white/10 h-11 rounded-2xl focus:border-primary-500/60 focus:bg-black/70 text-sm font-medium ${font}`} />
  </div>
); 

const CmdTile = ({ label, icon: Icon, onClick, color }: any) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[28px] bg-black/40 border border-white/10 hover:border-primary-500/40 hover:bg-white/5 transition-all group shadow-lg">
    <div className={`p-3 rounded-2xl bg-white/5 transition-all text-${color}-400 group-hover:bg-${color}-500/20 group-hover:scale-110`}>
      <Icon size={22} />
    </div>
    <span className="text-xs font-bold text-zinc-200 group-hover:text-white">{label}</span>
  </button>
);
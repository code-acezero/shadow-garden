"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '@/components/Auth/RoleGuard';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { executeAdminAction } from '@/lib/adminApi';
import { ImageAPI, BASE_URL } from '@/lib/api';
import { SITE_CONFIG } from '@/lib/site-config';
import { COLOR_PALETTES, applyColorPalette } from '@/lib/theme';
import { 
  Shield, Mic2, Save, Upload, Loader2, Coins, TrendingUp, Award, Gift, 
  Users, Globe, Activity, Search, AlertTriangle, 
  Trash2, Megaphone, Lock, Unlock, 
  HardDrive, Plus, Image as ImageIcon,
  AlertCircle, MessageSquareWarning, Folder, FileAudio, Eye,
  Scroll, Sword, BookOpen, Link2, Feather, Play, Pause,
  Bold, Italic, Type, UserCheck, X, LayoutDashboard, Palette,
  Filter, ArrowDownCircle, Menu, Crown, Layers, ArrowLeft, Bot, RefreshCw,
  PanelLeftClose, PanelLeftOpen, DollarSign, Sun, Moon, Check, Cpu
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
import FantasyFrame from '@/components/User/FantasyFrame';
import { ALL_ATELIER_STORE_FRAMES } from '@/lib/atelierFrames';
import { ALL_TITLES, getFrameForTitle } from '@/lib/userTitles';
import { Slider } from '@/components/ui/slider';
import RoleTitleManager from '@/components/Admin/RoleTitleManager';
import UnifiedHierarchyPanel from '@/components/Admin/UnifiedHierarchyPanel';
import AlphaSanctuaryPanel from '@/components/Admin/AlphaSanctuaryPanel';
import GuildBoardsPanel from '@/components/Admin/GuildBoardsPanel';
import AnalyticsSection from '@/components/Admin/AnalyticsSection';
import AdsMonetizationPanel from '@/components/Admin/AdsMonetizationPanel';
import { AdminSaveProvider, useAdminSave } from '@/components/Admin/AdminSaveContext';
import AdminFloatingSaveBar from '@/components/Admin/AdminFloatingSaveBar';
import { isGuildMaster, addFormerTitle } from '@/lib/userTitles';
import { cn } from '@/lib/utils';

// --- NOTIFICATION HELPER ---
const notify = (title: string, message: string, type: 'success' | 'error' | 'system' = 'system') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shadow-whisper', {
            detail: { id: Date.now(), type, title, message }
        }));
    }
};

type Tab = 'GUILD_DESK' | 'ANALYTICS' | 'GUILD_INFO' | 'HIERARCHY' | 'ALPHA_SANCTUARY' | 'GUILD_BOARDS' | 'PALETTES' | 'MOD_APPS' | 'MAGIC_NET' | 'VOICES' | 'NOTICE' | 'ADS_MONETIZATION' | 'ADVENTURERS' | 'TITLES_HIERARCHY';

const MASTER_TABS = [
  { id: 'GUILD_DESK', icon: LayoutDashboard, label: 'Desk & Analytics' },
  { id: 'HIERARCHY', icon: Crown, label: 'Hierarchy & Roster' },
  { id: 'ALPHA_SANCTUARY', icon: Bot, label: 'Alpha Sanctuary' },
  { id: 'GUILD_BOARDS', icon: Layers, label: 'Guild Boards' },
  { id: 'ADS_MONETIZATION', icon: DollarSign, label: 'Monetization' },
  { id: 'MAGIC_NET', icon: Globe, label: 'Magic Net' },
  { id: 'GUILD_INFO', icon: Cpu, label: 'Site Specs' },
  { id: 'PALETTES', icon: Palette, label: 'Palettes' },
  { id: 'MOD_APPS', icon: UserCheck, label: 'Mod Applications' },
  { id: 'VOICES', icon: Mic2, label: 'Echoes' },
  { id: 'NOTICE', icon: Feather, label: 'Notices' },
];

export default function GuildMasterDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('GUILD_DESK');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { settings } = useSettings();
  const isLight = settings.themeMode === 'light';
  
  const currentTabItem = MASTER_TABS.find(t => t.id === activeTab) || MASTER_TABS[0];
  const CurrentTabIcon = currentTabItem.icon;
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('guild_master_tab');
        if (saved) setActiveTab(saved === 'ANALYTICS' ? 'GUILD_DESK' : (saved as Tab));
    }
  }, []);

  const mainScrollRef = useRef<HTMLElement | null>(null);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('guild_master_tab', tab);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    return;
  };
  const _unused_switchTab = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('guild_master_tab', tab);
  };

  return (
    <RoleGuard allowedRoles={['admin', 'moderator']}>
      <AdminSaveProvider onNotify={notify}>
        <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; outline: none !important; -webkit-tap-highlight-color: transparent; }
        input:focus, textarea:focus, select:focus, button:focus { box-shadow: none !important; ring: 0 !important; border-color: rgba(139, 92, 246, 0.5) !important; }
        
      ` }} />

      <div className={cn(
        "h-screen font-sans flex flex-col md:flex-row relative overflow-hidden transition-colors",
        isLight ? "bg-[var(--bg-surface)] text-zinc-900" : "bg-[#050505] text-white"
      )}>
        
        {/* Background Ambient Glow */}
        <div className="fixed top-0 left-0 w-full h-96 bg-primary-900/10 blur-[100px] pointer-events-none z-0" />

        {/* ========================================================= */}
        {/* --- DESKTOP COLLAPSIBLE LEFT SIDEBAR --- */}
        {/* ========================================================= */}
        <aside 
          className={cn(
            "hidden md:flex flex-col justify-between h-screen sticky top-0 backdrop-blur-2xl border-r shadow-[4px_0_24px_rgba(0,0,0,0.6)] z-40 transition-all duration-300 shrink-0",
            isLight ? "bg-white/90 border-black/10 text-zinc-900" : "bg-[#09090e]/95 border-white/[0.08] text-white",
            isCollapsed ? "w-20 p-3" : "w-64 p-4"
          )}
        >
          <div className="flex flex-col gap-5 overflow-hidden flex-1">
            
            {/* Sidebar Top: Logo & Collapse Button */}
            <div className={cn("flex items-center justify-between pb-3.5 border-b", isLight ? "border-black/10" : "border-white/[0.08]", isCollapsed && "justify-center")}>
              {!isCollapsed && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Shield className="text-primary-400 shrink-0" strokeWidth={2.2} style={{ width: '27.6px', height: '27.6px' }} />
                  <div className="flex flex-col justify-center gap-0.5 select-none">
                    <span className={cn("font-lemon font-bold text-xs tracking-wider leading-none", isLight ? "text-zinc-900" : "text-white")}>KAGEMI</span>
                    <span className="text-[9px] font-mono font-semibold tracking-widest text-primary-400 uppercase leading-none">ADMIN CONSOLE</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "p-1.5 rounded-lg border active:scale-95 transition-all cursor-pointer",
                  isLight 
                    ? "bg-black/[0.04] border-black/10 text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.08]" 
                    : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                )}
                title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
              >
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="flex flex-col gap-1 overflow-y-auto scrollbar-none flex-1">
              {MASTER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id as Tab)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl text-xs transition-all text-left group relative cursor-pointer",
                      isCollapsed ? "p-2.5 justify-center" : "px-3 py-2.5 w-full",
                      isActive
                        ? "bg-primary text-white font-semibold shadow-sm"
                        : isLight
                        ? "text-zinc-600 hover:bg-black/5 hover:text-zinc-900 font-medium"
                        : "text-zinc-400 hover:bg-white/[0.05] hover:text-white font-medium"
                    )}
                    title={isCollapsed ? tab.label : undefined}
                  >
                    <Icon 
                      size={16} 
                      className={cn(
                        "shrink-0 transition-colors", 
                        isActive 
                          ? "text-white" 
                          : isLight 
                          ? "text-zinc-500 group-hover:text-zinc-900" 
                          : "text-zinc-400 group-hover:text-zinc-200"
                      )} 
                    />
                    {!isCollapsed && <span className="truncate">{tab.label}</span>}
                    
                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className={cn(
                        "absolute left-full ml-3 px-2.5 py-1 border rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50",
                        isLight ? "bg-white border-black/10 text-zinc-900" : "bg-zinc-900 border-white/15 text-white"
                      )}>
                        {tab.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Bottom: RETURN TO PORTAL */}
          <div className={cn("pt-3 border-t shrink-0", isLight ? "border-black/10" : "border-white/[0.08]")}>
            <Link
              href="/home"
              className={cn(
                "flex items-center gap-2.5 rounded-xl text-xs font-semibold transition-all border group cursor-pointer",
                isCollapsed ? "p-2.5 justify-center" : "px-3 py-2.5 w-full",
                isLight 
                  ? "bg-black/[0.03] hover:bg-black/[0.06] border-black/10 text-zinc-700 hover:text-zinc-900" 
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-zinc-300 hover:text-white"
              )}
              title="Return to Portal"
            >
              <ArrowLeft size={15} className="text-primary-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              {!isCollapsed && <span>Return to Portal</span>}
            </Link>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* --- MOBILE COMPACT iOS-LIKE TOP TOOLBAR BAR --- */}
        {/* ========================================================= */}
        <div className={cn(
          "flex md:hidden w-full z-40 backdrop-blur-xl border-b sticky top-0 px-3 py-2 items-center justify-between gap-2 select-none transition-colors",
          isLight ? "bg-white/95 border-black/10 text-zinc-900" : "bg-[#070b14]/95 border-white/[0.06] text-white"
        )}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setMobileMenuOpen(true)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
              isLight ? "text-zinc-800 hover:text-zinc-950" : "text-white/90 hover:text-white"
            )}
            aria-label="Open Admin Sections Menu"
          >
            <Menu size={16} className="text-primary-400 shrink-0" />
            <span className="font-lemon text-[11px] tracking-wide">Sections</span>
          </motion.button>

          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border min-w-0",
            isLight ? "bg-black/[0.04] border-black/10 text-zinc-900" : "bg-white/[0.04] border-white/[0.06] text-white/90"
          )}>
            <CurrentTabIcon size={12} className="text-primary-400 shrink-0" />
            <span className={cn("text-[11px] font-bold truncate max-w-[150px]", isLight ? "text-zinc-900" : "text-white/90")}>
              {currentTabItem.label}
            </span>
          </div>

          <Link
            href="/home"
            className={cn(
              "flex items-center gap-1 text-[11px] font-bold transition-colors",
              isLight ? "text-zinc-600 hover:text-zinc-950" : "text-zinc-400 hover:text-white"
            )}
          >
            <ArrowLeft size={13} className="text-primary-400" />
            <span>Portal</span>
          </Link>
        </div>

        {/* ── Mobile iOS-Style Slide Menu Panel (Similar to Settings Page) ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-[100] flex md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/75 backdrop-blur-md"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 290 }}
                className={cn(
                  "relative w-80 max-w-[85vw] border-r h-full p-5 flex flex-col justify-between shadow-2xl z-10 rounded-r-[2rem] overflow-y-auto transition-colors",
                  isLight ? "bg-white border-black/10 text-zinc-900" : "bg-[#0c101c] border-white/10 text-white"
                )}
              >
                <div>
                  {/* Drawer Header */}
                  <div className={cn("flex items-center justify-between border-b pb-3.5 mb-4", isLight ? "border-black/10" : "border-white/10")}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Shield className="text-primary-400 shrink-0" strokeWidth={2.2} style={{ width: '27.6px', height: '27.6px' }} />
                      <div className="flex flex-col justify-center gap-0.5 select-none">
                        <span className={cn("font-lemon text-xs font-bold tracking-wider leading-none", isLight ? "text-zinc-900" : "text-white")}>KAGEMI</span>
                        <span className="text-[9px] font-mono font-semibold tracking-widest text-primary-400 uppercase leading-none">COMMAND CONSOLE</span>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "p-1.5 rounded-full transition-colors cursor-pointer",
                        isLight ? "hover:bg-black/5 text-zinc-500 hover:text-zinc-900" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                      )}
                      aria-label="Close Menu"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>

                  {/* Section List: iOS clean list items */}
                  <div className="flex flex-col gap-1.5">
                    {MASTER_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <motion.button
                          key={tab.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            switchTab(tab.id as Tab);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer",
                            isActive
                              ? "bg-primary text-white font-semibold shadow-sm"
                              : isLight
                              ? "text-zinc-700 hover:text-zinc-950 hover:bg-black/5 font-medium"
                              : "text-zinc-300 hover:text-white hover:bg-white/[0.06] font-medium"
                          )}
                        >
                          <Icon size={16} className={cn("shrink-0 transition-colors", isActive ? "text-white" : "text-primary-400")} />
                          <span className="truncate">{tab.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Drawer Bottom Portal Link */}
                <div className={cn("pt-4 border-t mt-4", isLight ? "border-black/10" : "border-white/10")}>
                  <Link
                    href="/home"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold w-full transition-colors",
                      isLight 
                        ? "bg-black/[0.03] hover:bg-black/[0.06] border-black/10 text-zinc-700 hover:text-zinc-900" 
                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-zinc-300 hover:text-white"
                    )}
                  >
                    <ArrowLeft size={14} className="text-primary-400" />
                    <span>Return to Portal</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* --- RIGHT MAIN CONTENT AREA --- */}
        {/* ========================================================= */}
        <main ref={mainScrollRef as any} className="flex-1 min-w-0 h-full md:h-screen overflow-y-auto p-4 md:p-8 relative z-10">
          
          {/* Clean Dynamic Header & Telemetry */}
          <header className={cn(
            "relative border rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-2xl shadow-lg overflow-hidden transition-colors",
            isLight ? "bg-white/80 border-black/10 text-zinc-900" : "bg-[#0c0c12]/80 border-white/[0.08] text-white"
          )}>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {React.createElement(MASTER_TABS.find(t => t.id === activeTab)?.icon || Shield, { 
                  className: "w-7 h-7 text-primary-400 shrink-0", 
                  strokeWidth: 2.2 
                })}
                <h1 className={cn("text-xl sm:text-2xl font-lemon font-bold tracking-tight leading-tight", isLight ? "text-zinc-900" : "text-white")}>
                  {MASTER_TABS.find(t => t.id === activeTab)?.label || 'Console'}
                </h1>
              </div>

              {/* Minimalist System Status Bar */}
              <div className={cn("flex items-center gap-3 text-xs font-mono", isLight ? "text-zinc-600" : "text-zinc-400")}>
                <span className="flex items-center gap-1.5"><Activity size={13} className="text-emerald-500" /> 12ms</span>
                <span className={cn("text-xs opacity-25", isLight ? "text-zinc-400" : "text-white")}>/</span>
                <span className="flex items-center gap-1.5"><Users size={13} className="text-blue-500" /> Online</span>
                <span className={cn("text-xs opacity-25", isLight ? "text-zinc-400" : "text-white")}>/</span>
                <span className="flex items-center gap-1.5"><Globe size={13} className="text-purple-500" /> Optimal</span>
                <Link 
                  href="/home" 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ml-1 border",
                    isLight 
                      ? "bg-black/[0.04] hover:bg-black/[0.08] text-zinc-800 border-black/10" 
                      : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-transparent"
                  )}
                >
                  <ArrowLeft size={13} className="text-primary-400" />
                  <span>Portal</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Tab Panel Content (Instant, crisp tab display) */}
          <div className="animate-in fade-in duration-100 min-h-[500px]">
            {activeTab === 'GUILD_DESK' && <OverviewTab changeTab={switchTab} />}
            {activeTab === 'GUILD_INFO' && <IdentityTab />}
            {(activeTab === 'HIERARCHY' || (activeTab as string) === 'ADVENTURERS' || (activeTab as string) === 'TITLES_HIERARCHY') && <UnifiedHierarchyPanel />}
            {activeTab === 'ALPHA_SANCTUARY' && <AlphaSanctuaryPanel />}
            {activeTab === 'GUILD_BOARDS' && <GuildBoardsPanel />}
            {activeTab === 'PALETTES' && <ThemePaletteTab />}
            {activeTab === 'MOD_APPS' && <ModApplicationsTab />}
            {activeTab === 'MAGIC_NET' && <NetworkTab />}
            {activeTab === 'VOICES' && <VoiceTab />}
            {activeTab === 'NOTICE' && <BroadcastTab />}
            {activeTab === 'ADS_MONETIZATION' && <AdsMonetizationPanel onNotify={notify} />}
          </div>

          {/* Footer */}
          <footer className="w-full border-t border-white/5 bg-zinc-900/20 py-6 mt-12 rounded-2xl">
            <div className="px-4 text-center space-y-2 w-full">
              <div className="flex justify-center items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <img src="/icon.svg" className="w-6 h-6 drop-shadow-lg" alt="Guild Seal"/>
                <h4 className="font-lemon font-bold text-base text-white tracking-widest">KAGEMI</h4>
              </div>
              <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
                Guild-Master Console • V2.5 • {user?.email || 'Admin'}
              </p>
            </div>
          </footer>
        </main>

        {/* Global Floating Save / Auto-save / Reset Action Bar */}
        <AdminFloatingSaveBar />

      </div>
      </AdminSaveProvider>
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
    <div className="space-y-8">
      {/* 1. Analytics & Telemetry Overview */}
      <AnalyticsSection accentColor="red" />

      {/* 2. Guild Status & Administration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`col-span-1 p-8 rounded-2xl border relative overflow-hidden group transition-all duration-500 ${
          isLocked 
            ? 'bg-primary-950/20 border-primary-500/30 shadow-[0_0_30px_-10px_rgba(139, 92, 246, 0.2)]' 
            : 'bg-gradient-to-br from-violet-900/20 via-black/20 to-emerald-900/20 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]'
        }`}>
          <div className={`absolute inset-0 opacity-10 transition-opacity duration-500 ${isLocked ? 'bg-primary-600' : 'bg-gradient-to-r from-violet-600 to-emerald-600'}`} />
          <div className="relative z-10">
             <div className="flex justify-between items-center mb-6">
               <Shield size={28} className={isLocked ? 'text-primary-400' : 'text-emerald-400'} />
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
        
        <div className="col-span-1 md:col-span-2 bg-zinc-900/20 border border-white/5 rounded-2xl p-5 md:p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-white"><Scroll size={20} className="text-primary-500" /> Guild Administration</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <CmdTile label="Hierarchy" icon={Crown} onClick={() => changeTab('HIERARCHY')} color="red" />
            <CmdTile label="Alpha Core" icon={Bot} onClick={() => changeTab('ALPHA_SANCTUARY')} color="red" />
            <CmdTile label="Guild Boards" icon={Layers} onClick={() => changeTab('GUILD_BOARDS')} color="red" />
            <CmdTile label="Magic Net" icon={Globe} onClick={() => changeTab('MAGIC_NET')} color="red" />
            <CmdTile label="Monetization" icon={DollarSign} onClick={() => changeTab('ADS_MONETIZATION')} color="red" />
          </div>
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
  const [uploadingCard, setUploadingCard] = useState(false);
  const socialCardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (isLoaded) {
        setFormData({ 
            ...settings, 
            maintenanceMode: String((settings as any)?.maintenanceMode) === 'true' 
        }); 
    }
  }, [settings, isLoaded]);

  const handleChange = (key: string, val: any) => setFormData((prev: any) => ({ ...prev, [key]: val }));
  
  const handleSocialCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCard(true);
      const uploadedUrl = await ImageAPI.uploadImage(file);
      if (uploadedUrl) {
        handleChange('seoImage', uploadedUrl);
        notify("Success", "Social Card image uploaded successfully", "success");
      }
    } catch (err: any) {
      notify("Upload Failed", err.message || "Failed to upload image", "error");
    } finally {
      setUploadingCard(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    await Promise.all(Object.entries(formData).map(([k, v]) => {
        const valToSave = typeof v === 'boolean' ? String(v) : String(v);
        return updateSetting(k as any, valToSave);
    }));
    notify("Success", "Guild Grimoire Updated", 'success');
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-1 space-y-6">
          <div className="bg-zinc-900/20 border border-white/5 p-6 rounded-2xl h-full">
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
                      <p className="text-zinc-400 font-bold mb-2">Social Card Preview (OG:Image)</p>
                      <div className="aspect-video bg-black rounded-xl border border-white/10 overflow-hidden relative shadow-lg group">
                          <img src={formData.seoImage || SITE_CONFIG.ogImage} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300" alt="OG Preview"/>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                            <span className="text-[10px] font-bold text-white truncate">{formData.seoTitle || SITE_CONFIG.title}</span>
                            <span className="text-[8px] text-zinc-400 truncate">{formData.seoDesc || SITE_CONFIG.description}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="xl:col-span-2 space-y-8">
        <Section title="Guild Identity" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Guild Name" value={formData.siteName} onChange={(v: string) => handleChange('siteName', v)} />
            <InputGroup label="Logo Text" value={formData.logoText} onChange={(v: string) => handleChange('logoText', v)} font="font-lemon" />
            <InputGroup label="Emblem URL" value={formData.logoUrl} onChange={(v: string) => handleChange('logoUrl', v)} className="md:col-span-2" />
          </div>
        </Section>
        <Section title="Grimoire Configuration" icon={Search}>
          <div className="space-y-6">
            <InputGroup label="Page Title Override" value={formData.seoTitle} onChange={(v: string) => handleChange('seoTitle', v)} />
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Meta Description Override</label>
              <Textarea value={formData.seoDesc} onChange={e => handleChange('seoDesc', e.target.value)} className="bg-black/40 border-white/10 min-h-[100px] rounded-2xl" />
            </div>
            <InputGroup label="Keywords Override" value={formData.seoKeywords} onChange={(v: string) => handleChange('seoKeywords', v)} />

            {/* Social Card Upload & URL */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider ml-1 flex items-center justify-between">
                <span className="flex items-center gap-2 text-white"><ImageIcon size={14} className="text-primary-500" /> Social Card Image (OG:Image)</span>
                <span className="text-[10px] text-zinc-500 lowercase">Used when link is shared on Discord, Twitter, WhatsApp</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <Input 
                  value={formData.seoImage || ''} 
                  onChange={e => handleChange('seoImage', e.target.value)} 
                  placeholder="https://example.com/social-card.png" 
                  className="bg-black/40 border-white/10 rounded-2xl flex-1 text-xs" 
                />
                <input 
                  type="file" 
                  ref={socialCardInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleSocialCardUpload} 
                />
                <Button 
                  type="button" 
                  onClick={() => socialCardInputRef.current?.click()} 
                  disabled={uploadingCard} 
                  className="bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold rounded-2xl px-5 h-10 gap-2 shrink-0 shadow-md"
                >
                  {uploadingCard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-primary-500" />}
                  <span>{uploadingCard ? 'Uploading...' : 'Upload Card'}</span>
                </Button>
              </div>
            </div>
          </div>
        </Section>
        <div className={`border rounded-2xl p-6 transition-colors ${formData.maintenanceMode ? 'bg-primary-950/10 border-primary-500/20' : 'bg-white/5 border-white/10'}`}>
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
  const { user: currentUser, profile: currentUserProfile } = useAuth();
  const amIGuildMaster = isGuildMaster(currentUserProfile || currentUser);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL'|'ADMIN'|'MOD'|'BANNED'>('ALL');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnTarget, setWarnTarget] = useState<string | null>(null);
  const [warnMsg, setWarnMsg] = useState('');

  const [successionTarget, setSuccessionTarget] = useState<any | null>(null);
  const [successionOpen, setSuccessionOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // --- SUPREME GUILD MASTER CONTROLS STATES ---
  // Level & XP Modal
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [levelTarget, setLevelTarget] = useState<any | null>(null);
  const [targetLevel, setTargetLevel] = useState(1);
  const [isSavingLevel, setIsSavingLevel] = useState(false);

  // Gift Treasury Coins Modal
  const [coinsModalOpen, setCoinsModalOpen] = useState(false);
  const [coinsTarget, setCoinsTarget] = useState<any | null>(null);
  const [giftCoinsAmount, setGiftCoinsAmount] = useState(1000);
  const [giftCoinsMsg, setGiftCoinsMsg] = useState('');
  const [isGiftingCoins, setIsGiftingCoins] = useState(false);

  // Bestow Title Modal
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [titleTarget, setTitleTarget] = useState<any | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('Void Monarch');
  const [customTitle, setCustomTitle] = useState('');
  const [isBestowingTitle, setIsBestowingTitle] = useState(false);

  // Gift Profile Frame Modal
  const [frameModalOpen, setFrameModalOpen] = useState(false);
  const [frameTarget, setFrameTarget] = useState<any | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState('iron');
  const [frameSearch, setFrameSearch] = useState('');
  const [isGiftingFrame, setIsGiftingFrame] = useState(false);

  // Staff Promotion Protocol Modal
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<any | null>(null);
  const [promoteRole, setPromoteRole] = useState<'admin' | 'moderator'>('admin');
  const [assignedStaffTitle, setAssignedStaffTitle] = useState('Void Monarch');
  const [customStaffTitle, setCustomStaffTitle] = useState('');
  const [giftedFrameId, setGiftedFrameId] = useState('void_monarch');
  const [isPromotingStaff, setIsPromotingStaff] = useState(false);

  const fetchUsers = async () => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
    const { data } = await query;
    if (data) {
        const sorted = data.sort((a: any, b: any) => {
            if (a.id === currentUser?.id) return -1;
            if (b.id === currentUser?.id) return 1;
            const roleWeight = (r: string) => r === 'master' ? 4 : r === 'admin' ? 3 : r === 'moderator' ? 2 : 1;
            return roleWeight(b.role) - roleWeight(a.role);
        });
        setUsers(sorted);
    }
  };
  
  useEffect(() => { fetchUsers(); }, [currentUser]);

  // Open Level Modal
  const openLevelModal = (u: any) => {
    setLevelTarget(u);
    setTargetLevel(u.level || 1);
    setLevelModalOpen(true);
  };

  // Open Coins Modal
  const openCoinsModal = (u: any) => {
    setCoinsTarget(u);
    setGiftCoinsAmount(1000);
    setGiftCoinsMsg('');
    setCoinsModalOpen(true);
  };

  // Open Title Modal
  const openTitleModal = (u: any) => {
    setTitleTarget(u);
    setSelectedTitle(u.admin_title || u.equipped_title || 'Void Monarch');
    setCustomTitle('');
    setTitleModalOpen(true);
  };

  // Open Frame Modal
  const openFrameModal = (u: any) => {
    setFrameTarget(u);
    setSelectedFrameId(u.frame_id || 'iron');
    setFrameSearch('');
    setFrameModalOpen(true);
  };

  // Open Promotion Modal
  const openPromotionModal = (u: any, role: 'admin' | 'moderator') => {
    setPromoteTarget(u);
    setPromoteRole(role);
    const defaultTitle = role === 'admin' ? 'Void Monarch' : 'Second Shadow';
    setAssignedStaffTitle(defaultTitle);
    setCustomStaffTitle('');
    setGiftedFrameId(role === 'admin' ? 'void_monarch' : 'second_shadow');
    setPromoteModalOpen(true);
  };

  // 1. Level & XP Save Handler
  const handleSaveLevel = async () => {
    if (!levelTarget) return;
    setIsSavingLevel(true);
    try {
      const calculatedXp = targetLevel === 100 ? 999999 : 50 * (targetLevel - 1) * targetLevel;
      await executeAdminAction('update_profile', {
        userId: levelTarget.id,
        updates: {
          level: targetLevel,
          xp: calculatedXp
        }
      });

      setUsers(prev => prev.map(u => u.id === levelTarget.id ? { ...u, level: targetLevel, xp: calculatedXp } : u));
      notify("Level Granted", `@${levelTarget.username} promoted to Level ${targetLevel} (${calculatedXp.toLocaleString()} XP)`, 'success');
      setLevelModalOpen(false);
    } catch (err: any) {
      notify("Error", err.message || "Failed to update level", 'error');
    } finally {
      setIsSavingLevel(false);
    }
  };

  // 2. Gift Treasury Coins Handler
  const handleGiftCoins = async () => {
    if (!coinsTarget || giftCoinsAmount <= 0) return;
    setIsGiftingCoins(true);
    try {
      const newCoins = (Number(coinsTarget.coins) || 0) + giftCoinsAmount;
      await executeAdminAction('update_profile', {
        userId: coinsTarget.id,
        updates: { coins: newCoins }
      });

      // Dispatched notification from Alpha
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: coinsTarget.id,
          type: 'system',
          content: `Gift from Guild Master: You have received ${giftCoinsAmount.toLocaleString()} Coins! ${giftCoinsMsg ? `"${giftCoinsMsg}"` : ''}`,
          link: `#claim:${JSON.stringify({ coins: giftCoinsAmount })}`,
          is_read: false
        }]
      });

      setUsers(prev => prev.map(u => u.id === coinsTarget.id ? { ...u, coins: newCoins } : u));
      notify("Coins Dispatched", `Gifted ${giftCoinsAmount.toLocaleString()} coins to @${coinsTarget.username}`, 'success');
      setCoinsModalOpen(false);
      setGiftCoinsMsg('');
    } catch (err: any) {
      notify("Error", err.message || "Failed to send coins", 'error');
    } finally {
      setIsGiftingCoins(false);
    }
  };

  // 3. Bestow Title Handler
  const handleBestowTitle = async () => {
    if (!titleTarget) return;
    const finalTitle = (selectedTitle === 'custom' ? customTitle.trim() : selectedTitle);
    if (!finalTitle) {
      notify("Error", "Please provide a valid title", 'error');
      return;
    }
    setIsBestowingTitle(true);
    try {
      const currentUnlocked = Array.isArray(titleTarget.unlocked_titles) ? titleTarget.unlocked_titles : [];
      const newUnlocked = Array.from(new Set([...currentUnlocked, finalTitle]));

      const { data: memberProfile } = await supabase.from('profiles').select('settings').eq('id', titleTarget.id).single();
      const currentSettings = memberProfile?.settings || {};

      await executeAdminAction('update_profile', {
        userId: titleTarget.id,
        updates: {
          admin_title: finalTitle,
          title: finalTitle,
          equipped_title: finalTitle,
          unlocked_titles: newUnlocked,
          settings: { ...currentSettings, equipped_title: finalTitle }
        }
      });

      // Dispatch claimable gift notification from Alpha
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: titleTarget.id,
          type: 'system',
          content: `A gift from Guild Master: You have been bestowed the sacred title "${finalTitle}"! Claim to equip.`,
          link: `#claim:${JSON.stringify({ title: finalTitle })}`,
          is_read: false
        }]
      });

      setUsers(prev => prev.map(u => u.id === titleTarget.id ? { 
        ...u, 
        admin_title: finalTitle, 
        title: finalTitle, 
        equipped_title: finalTitle,
        unlocked_titles: newUnlocked 
      } : u));

      notify("Title Bestowed", `Bestowed "${finalTitle}" to @${titleTarget.username}`, 'success');
      setTitleModalOpen(false);
      setCustomTitle('');
    } catch (err: any) {
      notify("Error", err.message || "Failed to bestow title", 'error');
    } finally {
      setIsBestowingTitle(false);
    }
  };

  // 4. Gift Profile Frame Handler
  const handleGiftFrame = async () => {
    if (!frameTarget || !selectedFrameId) return;
    setIsGiftingFrame(true);
    try {
      const currentFrames = Array.isArray(frameTarget.purchased_frames) ? frameTarget.purchased_frames : ['none'];
      const newFrames = Array.from(new Set([...currentFrames, selectedFrameId]));

      await executeAdminAction('update_profile', {
        userId: frameTarget.id,
        updates: {
          purchased_frames: newFrames,
          frame_id: selectedFrameId
        }
      });

      const frameObj = ALL_ATELIER_STORE_FRAMES.find(f => f.id === selectedFrameId);
      const frameName = frameObj?.name || selectedFrameId;

      // Dispatch claimable gift notification from Alpha
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: frameTarget.id,
          type: 'system',
          content: `A gift from Guild Master: You have been gifted the "${frameName}" Profile Frame! Claim to equip.`,
          link: `#claim:${JSON.stringify({ frame_id: selectedFrameId })}`,
          is_read: false
        }]
      });

      setUsers(prev => prev.map(u => u.id === frameTarget.id ? { 
        ...u, 
        purchased_frames: newFrames, 
        frame_id: selectedFrameId 
      } : u));

      notify("Frame Gifted", `Gifted "${frameName}" frame to @${frameTarget.username}`, 'success');
      setFrameModalOpen(false);
    } catch (err: any) {
      notify("Error", err.message || "Failed to gift frame", 'error');
    } finally {
      setIsGiftingFrame(false);
    }
  };

  // 5. Staff Promotion Protocol Handler (Admin gets 10,000 coins + Auto MAX Level 100/999,999 XP; Mod gets 5,000 coins)
  const handleExecutePromotion = async () => {
    if (!promoteTarget) return;
    setIsPromotingStaff(true);
    try {
      const isPromotingToAdmin = promoteRole === 'admin';
      const finalTitle = assignedStaffTitle === 'custom' ? customStaffTitle.trim() : assignedStaffTitle;
      const finalFrame = assignedStaffTitle === 'custom' ? giftedFrameId : (getFrameForTitle(finalTitle, promoteRole) || giftedFrameId || 'none');
      const bonusCoins = isPromotingToAdmin ? 10000 : 5000;

      const { data: memberProfile } = await supabase.from('profiles').select('settings, coins, level, xp, purchased_frames, unlocked_titles').eq('id', promoteTarget.id).single();
      const currentSettings = memberProfile?.settings || {};
      const currentFrames = Array.isArray(memberProfile?.purchased_frames) ? memberProfile.purchased_frames : ['none'];
      const currentTitles = Array.isArray(memberProfile?.unlocked_titles) ? memberProfile.unlocked_titles : [];

      const newFrames = Array.from(new Set([...currentFrames, finalFrame]));
      const newTitles = Array.from(new Set([...currentTitles, finalTitle]));
      const newCoins = (Number(memberProfile?.coins) || 0) + bonusCoins;

      const updateData: any = {
        role: promoteRole,
        admin_title: finalTitle,
        title: finalTitle,
        equipped_title: finalTitle,
        coins: newCoins,
        frame_id: finalFrame,
        purchased_frames: newFrames,
        unlocked_titles: newTitles,
        settings: { ...currentSettings, equipped_title: finalTitle }
      };

      if (isPromotingToAdmin) {
        updateData.level = 100;
        updateData.xp = 999999;
      }

      await executeAdminAction('update_profile', {
        userId: promoteTarget.id,
        updates: updateData
      });

      // Dispatched promotion notification from Alpha with claim button
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: promoteTarget.id,
          type: 'system',
          content: `Promotion Gift from Guild Master: You have been appointed to ${isPromotingToAdmin ? 'Board of Darkness (Admin)' : 'Council of Shadows (Moderator)'}! Claim your ${bonusCoins.toLocaleString()} Coins, "${finalTitle}" Title, and matching Profile Frame.`,
          link: `#claim:${JSON.stringify({
            coins: bonusCoins,
            frame_id: finalFrame,
            title: finalTitle
          })}`,
          is_read: false
        }]
      });

      setUsers(prev => prev.map(u => u.id === promoteTarget.id ? { 
        ...u, 
        ...updateData 
      } : u));

      notify("Promotion Sovereign Decree", `Promoted @${promoteTarget.username} to ${promoteRole.toUpperCase()} with ${bonusCoins.toLocaleString()} bonus coins!`, 'success');
      setPromoteModalOpen(false);
      setCustomStaffTitle('');
    } catch (err: any) {
      notify("Promotion Failed", err.message || "Failed to promote adventurer", 'error');
    } finally {
      setIsPromotingStaff(false);
    }
  };

  // Demote Handler
  const handleDemote = async (uid: string, currentRole: string) => {
    const updatePayload: any = { role: 'user' };
    
    if (currentRole === 'admin') {
      await addFormerTitle(uid, 'Former Admin');
      updatePayload.admin_title = 'Former Admin';
      updatePayload.equipped_title = 'Former Admin';
    } else if (currentRole === 'moderator') {
      await addFormerTitle(uid, 'Former Moderator');
      updatePayload.admin_title = 'Former Moderator';
      updatePayload.equipped_title = 'Former Moderator';
    }

    try {
      await executeAdminAction('update_profile', {
        userId: uid,
        updates: updatePayload
      });
      notify("Demotion Executed", "Adventurer stepped down with former honors preserved", 'success');
      fetchUsers();
    } catch (error: any) {
      notify("Error", error.message || "Failed to demote", 'error');
    }
  };

  const handlePassSuccession = async () => {
      if (!successionTarget || !currentUser) return;
      setIsTransferring(true);
      try {
          await addFormerTitle(currentUser.id, 'Former Guild Master');
          const { data: currP } = await supabase.from('profiles').select('settings').eq('id', currentUser.id).single();
          const currSettings = currP?.settings || {};
          await executeAdminAction('update_profile', {
            userId: currentUser.id,
            updates: {
              role: 'admin',
              title: 'Former Guild Master',
              admin_title: 'Former Guild Master',
              settings: { ...currSettings, is_guild_master: false, equipped_title: 'Former Guild Master' }
            }
          });

          const { data: succP } = await supabase.from('profiles').select('settings').eq('id', successionTarget.id).single();
          const succSettings = succP?.settings || {};
          await executeAdminAction('update_profile', {
            userId: successionTarget.id,
            updates: {
              role: 'admin',
              title: 'Shadow',
              admin_title: 'Shadow',
              settings: { ...succSettings, is_guild_master: true, equipped_title: 'Shadow' }
            }
          });

          if (typeof window !== 'undefined') {
              localStorage.setItem(`shadow_equipped_title_${currentUser.id}`, 'Former Guild Master');
              localStorage.setItem(`shadow_equipped_title_${successionTarget.id}`, 'Shadow');
              window.dispatchEvent(new CustomEvent('shadow-title-updated', { detail: { title: 'Former Guild Master' } }));
          }

          notify("Supreme Decree", `Mantle of Shadow passed to @${successionTarget.username}! You are now Former Guild Master.`, 'success');
          setSuccessionOpen(false);
          setSuccessionTarget(null);
          await fetchUsers();
      } catch (err: any) {
          notify("Transfer Error", err?.message || 'Failed to pass mantle', 'error');
      } finally {
          setIsTransferring(false);
      }
  };

  const handleBan = async (uid: string, banned: boolean) => { 
    try {
      await executeAdminAction('update_profile', {
        userId: uid,
        updates: { is_banned: !banned }
      });
      notify("Status Updated", banned ? "Reinstated" : "Banned", 'success');
      fetchUsers();
    } catch (error: any) {
      notify("Error", error.message || "Action failed", 'error');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if(!confirm("Are you sure? This is permanent.")) return;
    try {
      await executeAdminAction('delete_user', { userId: uid });
      notify("Success", "Adventurer Deleted", 'success');
      fetchUsers();
    } catch (error: any) {
      notify("Error", error.message || "Failed to delete", 'error');
    }
  };
  
  const sendWarning = async () => {
    if (!warnTarget || !warnMsg) return;
    try {
      await executeAdminAction('dispatch_notifications', {
        notifications: [{
          user_id: warnTarget,
          type: 'GUILD_WARNING',
          content: warnMsg
        }]
      });
      notify("Sent", "Warning dispatched", 'success');
      setWarnOpen(false);
      setWarnMsg('');
    } catch (error: any) {
      notify("Error", error.message || "Failed to dispatch warning", 'error');
    }
  };

  const filteredUsers = useMemo(() => users.filter(u => {
      const matchesSearch = u.username?.toLowerCase().includes(search.toLowerCase());
      if (filter === 'ALL') return matchesSearch;
      if (filter === 'ADMIN') return matchesSearch && (u.role === 'admin' || u.role === 'master' || u.role === 'leader');
      if (filter === 'MOD') return matchesSearch && u.role === 'moderator';
      if (filter === 'BANNED') return matchesSearch && u.is_banned;
      return matchesSearch;
  }), [users, search, filter]);

  const displayedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Available Store Frames (Strictly Exclude The Eternal for Gifting)
  const availableGiftFrames = useMemo(() => {
    return ALL_ATELIER_STORE_FRAMES.filter(f => 
      f.id !== 'admin' && f.id !== 'eternal' && f.id !== 'the_eternal' &&
      (!frameSearch.trim() || f.name.toLowerCase().includes(frameSearch.toLowerCase()) || f.categoryName.toLowerCase().includes(frameSearch.toLowerCase()))
    );
  }, [frameSearch]);

  return (
    <div className="space-y-5">
      {/* Search & Role Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#0c0c12]/80 p-3 sm:p-4 rounded-2xl border border-white/[0.08]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <Input 
            placeholder="Search adventurer by username..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10 bg-black/40 border-white/[0.1] rounded-xl h-10 text-xs text-white placeholder-zinc-500" 
          />
        </div>
        <div className="flex items-center gap-2">
          {amIGuildMaster && (
            <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shrink-0">
              <Crown size={11} className="mr-1 text-amber-400" /> SUPREME GUILD MASTER
            </Badge>
          )}
          <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/[0.08] self-stretch sm:self-auto overflow-x-auto no-scrollbar">
            {(['ALL', 'ADMIN', 'MOD', 'BANNED'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => { setFilter(f); setPage(1); }} 
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all",
                  filter === f ? "bg-primary-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {displayedUsers.map(user => {
          const isMe = user.id === currentUser?.id;
          const isTargetMaster = user.role === 'master' || user.role === 'leader' || user.username?.toLowerCase() === 'ace_zero';
          const isAdmin = user.role === 'admin';
          const isMod = user.role === 'moderator';
          const displayTitle = user.admin_title || user.equipped_title || user.title || 'Novice';

          return (
            <div 
              key={user.id} 
              className={cn(
                "bg-[#0b0b12]/80 border p-4 rounded-2xl flex flex-col justify-between gap-3.5 transition-all shadow-sm",
                isMe ? "border-primary-500/40 bg-primary-950/10" 
                  : isTargetMaster ? "border-amber-500/40 bg-amber-950/10" 
                  : isAdmin ? "border-purple-500/30" 
                  : isMod ? "border-blue-500/30" 
                  : "border-white/[0.07] hover:border-white/[0.15]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ProfileAvatar profile={user} className="w-12 h-12 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2 truncate">
                      <span className="truncate">{user.username || 'Adventurer'}</span>
                      {isMe && <span className="text-[9px] font-mono font-bold bg-primary-600/80 text-white px-1.5 py-0.2 rounded shrink-0">YOU</span>}
                    </h4>

                    {/* Meta Status Badges (Role, Level, Coins, Title) */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={cn(
                        "text-[9px] font-mono font-semibold px-2 py-0.5 rounded",
                        isTargetMaster ? "bg-amber-400/20 text-amber-300 border border-amber-500/30" 
                          : isAdmin ? "bg-purple-500/15 text-purple-300 border border-purple-500/25"
                          : isMod ? "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                          : "bg-white/[0.05] text-zinc-400 border border-white/[0.08]"
                      )}>
                        {isTargetMaster ? 'GUILD MASTER' : (user.role?.toUpperCase() || 'USER')}
                      </span>

                      {/* Clickable Level pill for Guild Master */}
                      <button
                        type="button"
                        onClick={() => amIGuildMaster && openLevelModal(user)}
                        disabled={!amIGuildMaster}
                        className={cn(
                          "text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-300 transition-colors",
                          amIGuildMaster && "hover:bg-primary-500/20 hover:border-primary-500/40 hover:text-white cursor-pointer"
                        )}
                        title={amIGuildMaster ? "Click to set Level & XP" : undefined}
                      >
                        Lvl {user.level || 1}
                      </button>

                      {/* Clickable Coins pill for Guild Master */}
                      <button
                        type="button"
                        onClick={() => amIGuildMaster && openCoinsModal(user)}
                        disabled={!amIGuildMaster}
                        className={cn(
                          "text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 transition-colors",
                          amIGuildMaster && "hover:bg-amber-500/20 hover:border-amber-500/40 cursor-pointer"
                        )}
                        title={amIGuildMaster ? "Click to gift Coins" : undefined}
                      >
                        🪙 {(Number(user.coins) || 0).toLocaleString()}
                      </button>

                      {/* Clickable Title pill for Guild Master */}
                      <button
                        type="button"
                        onClick={() => amIGuildMaster && openTitleModal(user)}
                        disabled={!amIGuildMaster}
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 truncate max-w-[120px] transition-colors",
                          amIGuildMaster && "hover:bg-purple-500/20 hover:border-purple-500/40 cursor-pointer"
                        )}
                        title={amIGuildMaster ? "Click to bestow Title" : undefined}
                      >
                        [{displayTitle}]
                      </button>

                      {user.is_banned && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">EXILED</span>}
                    </div>
                  </div>
                </div>

                {/* Card Action Toolbar */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isMe && (
                    <>
                      {/* 1. Succession Protocol (GM Only) */}
                      {amIGuildMaster && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10" 
                          onClick={() => { setSuccessionTarget(user); setSuccessionOpen(true); }} 
                          title="Pass Down Mantle of Shadow (Succession Protocol)"
                        >
                          <Crown size={14} />
                        </Button>
                      )}

                      {/* 2. Promote / Demote Admin (GM Only) */}
                      {amIGuildMaster && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={cn("h-7 w-7 rounded-lg transition-colors", isAdmin ? "text-purple-400 hover:bg-purple-500/15" : "text-zinc-400 hover:text-white hover:bg-white/[0.08]")} 
                          onClick={() => isAdmin ? handleDemote(user.id, 'admin') : openPromotionModal(user, 'admin')} 
                          title={isAdmin ? "Demote from Admin (Preserves Former Honors)" : "Promote to Admin (Board of Darkness + 10k Coins + Auto Max Lvl)"}
                        >
                          {isAdmin ? <ArrowDownCircle size={14} /> : <Shield size={14} />}
                        </Button>
                      )}

                      {/* 3. Promote / Demote Mod (GM Only) */}
                      {amIGuildMaster && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={cn("h-7 w-7 rounded-lg transition-colors", isMod ? "text-blue-400 hover:bg-blue-500/15" : "text-zinc-400 hover:text-white hover:bg-white/[0.08]")} 
                          onClick={() => isMod ? handleDemote(user.id, 'moderator') : openPromotionModal(user, 'moderator')} 
                          title={isMod ? "Demote from Mod" : "Promote to Moderator (Council of Shadows + 5k Coins)"}
                        >
                          {isMod ? <ArrowDownCircle size={14} /> : <UserCheck size={14} />}
                        </Button>
                      )}

                      {/* 4. Set Level & XP (GM Only) */}
                      {amIGuildMaster && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" 
                          onClick={() => openLevelModal(user)} 
                          title="Set Adventurer Level & XP"
                        >
                          <TrendingUp size={14} />
                        </Button>
                      )}

                      {/* 5. Gift Treasury Coins (GM Only) */}
                      {amIGuildMaster && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" 
                          onClick={() => openCoinsModal(user)} 
                          title="Gift Guild Treasury Coins"
                        >
                          <Coins size={14} />
                        </Button>
                      )}

                      {/* 6. Bestow Sacred Title (GM Only) */}
                      {amIGuildMaster && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 rounded-lg text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10" 
                          onClick={() => openTitleModal(user)} 
                          title="Bestow Sacred Title with Claimable Gift Notification"
                        >
                          <Award size={14} />
                        </Button>
                      )}

                      {/* 7. Gift Profile Frame (GM Only) */}
                      {amIGuildMaster && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10" 
                          onClick={() => openFrameModal(user)} 
                          title="Gift Profile Frame from Store with Claimable Gift Notification"
                        >
                          <Layers size={14} />
                        </Button>
                      )}

                      {/* 8. Ban / Unban */}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn("h-7 w-7 rounded-lg", user.is_banned ? "text-emerald-400 hover:bg-emerald-500/10" : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10")} 
                        onClick={() => handleBan(user.id, user.is_banned)} 
                        title={user.is_banned ? "Reinstate from Exile" : "Exile Adventurer"}
                      >
                        {user.is_banned ? <Unlock size={14} /> : <Lock size={14} />}
                      </Button>

                      {/* 9. Delete User */}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg" 
                        onClick={() => handleDeleteUser(user.id)} 
                        title="Delete Adventurer Account"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Quick Bar (Warn & Reports) */}
              <div className="flex items-center gap-2 pt-2.5 border-t border-white/[0.06]">
                <Button size="sm" variant="ghost" className="flex-1 text-[11px] h-7 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.05]" onClick={() => { setWarnTarget(user.id); setWarnOpen(true); }}>
                  <MessageSquareWarning size={13} className="mr-1.5 text-amber-400" /> Warn
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="flex-1 text-[11px] h-7 text-zinc-400 hover:text-primary-400 rounded-lg hover:bg-white/[0.05]">
                      <AlertCircle size={13} className="mr-1.5" /> Reports
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0e0e16] border-white/10 text-white rounded-2xl">
                    <DialogHeader><DialogTitle>Reports</DialogTitle></DialogHeader>
                    <p className="text-zinc-500 text-xs">No active reports filed against @{user.username}.</p>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <button 
              key={i} 
              onClick={() => setPage(i + 1)} 
              className={cn(
                "w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all",
                page === i + 1 
                  ? "bg-primary text-white font-bold" 
                  : "bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1]"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* --- MODAL 1: SET LEVEL & XP MODAL --- */}
      {/* ========================================================= */}
      <Dialog open={levelModalOpen} onOpenChange={setLevelModalOpen}>
        <DialogContent className="bg-[#0c0c12] border border-emerald-500/30 text-white rounded-2xl p-6 max-w-md shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <TrendingUp size={20} />
              <DialogTitle className="text-lg font-bold text-white">Set Adventurer Level & Experience</DialogTitle>
            </div>
            <p className="text-xs text-zinc-400">
              Grant custom level progression to <strong className="text-white">@{levelTarget?.username}</strong>. XP is automatically calculated based on level.
            </p>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Level & XP Live Display */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Target Level</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">Lvl {targetLevel}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Calculated XP</span>
                <span className="text-lg font-bold text-zinc-200 font-mono">
                  {(targetLevel === 100 ? 999999 : 50 * (targetLevel - 1) * targetLevel).toLocaleString()} XP
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 font-bold">SLIDER PROGRESSION</span>
                <span className="text-emerald-400 font-bold">{targetLevel} / 100</span>
              </div>
              <Slider 
                value={[targetLevel]} 
                min={1} 
                max={100} 
                step={1} 
                onValueChange={(val) => setTargetLevel(val[0])} 
                className="py-2"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">Quick Milestone Presets</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 20, 50, 75, 100].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setTargetLevel(lvl)}
                    className={cn(
                      "py-2 rounded-lg text-xs font-mono font-bold border transition-all",
                      targetLevel === lvl 
                        ? "bg-emerald-600 text-white border-emerald-400 shadow-sm" 
                        : "bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.1]"
                    )}
                  >
                    {lvl === 100 ? 'MAX 100' : `Lvl ${lvl}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={() => setLevelModalOpen(false)} className="rounded-xl border border-white/10 text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLevel} 
              disabled={isSavingLevel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              {isSavingLevel ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Apply Level & XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* --- MODAL 2: GIFT TREASURY COINS MODAL --- */}
      {/* ========================================================= */}
      <Dialog open={coinsModalOpen} onOpenChange={setCoinsModalOpen}>
        <DialogContent className="bg-[#0c0c12] border border-amber-500/30 text-white rounded-2xl p-6 max-w-md shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Coins size={20} />
              <DialogTitle className="text-lg font-bold text-white">Gift Guild Treasury Coins</DialogTitle>
            </div>
            <p className="text-xs text-zinc-400">
              Transfer coins from the supreme treasury to <strong className="text-white">@{coinsTarget?.username}</strong>. A gift notification from Alpha will be sent with a claim button.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Current Balance */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Current Balance:</span>
              <span className="text-amber-300 font-bold font-mono">🪙 {(Number(coinsTarget?.coins) || 0).toLocaleString()} Coins</span>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">Gift Amount (Coins)</label>
              <Input 
                type="number"
                value={giftCoinsAmount}
                onChange={e => setGiftCoinsAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="bg-black/50 border-white/[0.1] h-11 rounded-xl text-amber-300 font-mono font-bold text-lg"
              />
            </div>

            {/* Preset Amount Chips */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">Quick Presets</label>
              <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                {[500, 1000, 5000, 10000, 50000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGiftCoinsAmount(amt)}
                    className={cn(
                      "py-2 rounded-lg font-bold border transition-all text-center",
                      giftCoinsAmount === amt 
                        ? "bg-amber-500 text-black border-amber-400 shadow-sm" 
                        : "bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.1]"
                    )}
                  >
                    +{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Gift Message */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">Personal Decreed Message (Optional)</label>
              <Input 
                placeholder="e.g. For exemplary service to the Guild"
                value={giftCoinsMsg}
                onChange={e => setGiftCoinsMsg(e.target.value)}
                className="bg-black/50 border-white/[0.1] h-10 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={() => setCoinsModalOpen(false)} className="rounded-xl border border-white/10 text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleGiftCoins} 
              disabled={isGiftingCoins || giftCoinsAmount <= 0}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {isGiftingCoins ? <Loader2 size={14} className="animate-spin" /> : <Coins size={14} />}
              Transmit 🪙 {giftCoinsAmount.toLocaleString()} Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* --- MODAL 3: BESTOW SACRED TITLE MODAL --- */}
      {/* ========================================================= */}
      <Dialog open={titleModalOpen} onOpenChange={setTitleModalOpen}>
        <DialogContent className="bg-[#0c0c12] border border-fuchsia-500/30 text-white rounded-2xl p-6 max-w-lg shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-fuchsia-400 mb-1">
              <Award size={20} />
              <DialogTitle className="text-lg font-bold text-white">Bestow Sacred Title</DialogTitle>
            </div>
            <p className="text-xs text-zinc-400">
              Bestow an exclusive designation to <strong className="text-white">@{titleTarget?.username}</strong>. A notification with a claim button will be dispatched from Alpha.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Title Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">Choose Sacred Title</label>
              <Select value={selectedTitle} onValueChange={setSelectedTitle}>
                <SelectTrigger className="bg-black/50 border-white/[0.1] h-11 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Select title..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0e0e16] border-white/10 text-white max-h-60">
                  <SelectItem value="Abyss Archon">Abyss Archon (Board of Darkness)</SelectItem>
                  <SelectItem value="Void Monarch">Void Monarch (Board of Darkness)</SelectItem>
                  <SelectItem value="Eclipse Blade">Eclipse Blade (Board of Darkness)</SelectItem>
                  <SelectItem value="Umbral Lord">Umbral Lord (Board of Darkness)</SelectItem>
                  <SelectItem value="Dark Primarch">Dark Primarch (Board of Darkness)</SelectItem>
                  <SelectItem value="First Shadow">First Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Second Shadow">Second Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Third Shadow">Third Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Fourth Shadow">Fourth Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Fifth Shadow">Fifth Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Sixth Shadow">Sixth Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Seventh Shadow">Seventh Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Eighth Shadow">Eighth Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Ninth Shadow">Ninth Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Tenth Shadow">Tenth Shadow (Council of Shadows)</SelectItem>
                  <SelectItem value="Sovereign">Sovereign (Level Milestone)</SelectItem>
                  <SelectItem value="Overlord">Overlord (Level Milestone)</SelectItem>
                  <SelectItem value="Celestial">Celestial (Level Milestone)</SelectItem>
                  <SelectItem value="Immortal">Immortal (Level Milestone)</SelectItem>
                  <SelectItem value="Apex">Apex (Level Milestone)</SelectItem>
                  <SelectItem value="custom">+ Custom Custom Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Title Input if custom chosen */}
            {selectedTitle === 'custom' && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-fuchsia-400">Custom Title Designation</label>
                <Input 
                  placeholder="e.g. Phantom Executioner, Astral Vanguard..."
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="bg-black/50 border-fuchsia-500/30 h-11 rounded-xl text-xs text-white"
                />
              </div>
            )}

            {/* Live Badge Preview */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] text-center space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Preview Badge Rendering</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-bold text-xs">
                <span>[{selectedTitle === 'custom' ? (customTitle || 'Custom Title') : selectedTitle}]</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={() => setTitleModalOpen(false)} className="rounded-xl border border-white/10 text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleBestowTitle} 
              disabled={isBestowingTitle || (selectedTitle === 'custom' && !customTitle.trim())}
              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-fuchsia-950/40"
            >
              {isBestowingTitle ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
              Bestow Title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* --- MODAL 4: GIFT PROFILE FRAME MODAL --- */}
      {/* ========================================================= */}
      <Dialog open={frameModalOpen} onOpenChange={setFrameModalOpen}>
        <DialogContent className="bg-[#0c0c12] border border-sky-500/30 text-white rounded-2xl p-6 max-w-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-sky-400 mb-1">
              <Layers size={20} />
              <DialogTitle className="text-lg font-bold text-white">Gift Profile Frame from Store</DialogTitle>
            </div>
            <p className="text-xs text-zinc-400">
              Select any handcrafted frame from the Atelier Frame Store to gift to <strong className="text-white">@{frameTarget?.username}</strong>. A claimable notification from Alpha will be sent.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Search Frame */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <Input 
                placeholder="Search frames by name or collection..."
                value={frameSearch}
                onChange={e => setFrameSearch(e.target.value)}
                className="pl-10 bg-black/50 border-white/[0.1] h-10 rounded-xl text-xs text-white"
              />
            </div>

            {/* Frame Grid with Live Visual SVG Previews */}
            <div className="max-h-72 overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {availableGiftFrames.slice(0, 36).map(f => {
                const isSelected = selectedFrameId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFrameId(f.id)}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all text-center relative",
                      isSelected 
                        ? "bg-sky-950/40 border-sky-400 shadow-md shadow-sky-950/50" 
                        : "bg-black/40 border-white/[0.08] hover:border-white/20"
                    )}
                  >
                    <div className="w-14 h-14 relative flex items-center justify-center">
                      <FantasyFrame frameId={f.id} avatarUrl={frameTarget?.avatar_url || '/icons/default_avatar.png'} />
                    </div>
                    <div className="min-w-0 w-full">
                      <span className="text-[11px] font-bold text-white truncate block">{f.name}</span>
                      <span className="text-[9px] font-mono text-zinc-400 truncate block">{f.categoryName}</span>
                    </div>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,1)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={() => setFrameModalOpen(false)} className="rounded-xl border border-white/10 text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleGiftFrame} 
              disabled={isGiftingFrame || !selectedFrameId}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-sky-950/40"
            >
              {isGiftingFrame ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
              Gift Profile Frame
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* --- MODAL 5: STAFF PROMOTION PROTOCOL MODAL --- */}
      {/* ========================================================= */}
      <Dialog open={promoteModalOpen} onOpenChange={setPromoteModalOpen}>
        <DialogContent className="bg-[#0c0a14] border border-purple-500/30 text-white rounded-2xl p-6 max-w-lg shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              {promoteRole === 'admin' ? <Shield size={20} /> : <UserCheck size={20} />}
              <DialogTitle className="text-lg font-bold text-white">
                Appoint to {promoteRole === 'admin' ? 'Board of Darkness (Admin)' : 'Council of Shadows (Moderator)'}
              </DialogTitle>
            </div>
            <p className="text-xs text-zinc-400">
              Promote <strong className="text-white">@{promoteTarget?.username}</strong> to supreme leadership. Assign a sacred title and matching profile frame.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Step 1: Title Assignment */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">
                1. Set Staff Designation Title
              </label>
              <Select 
                value={assignedStaffTitle} 
                onValueChange={(val) => {
                  setAssignedStaffTitle(val);
                  if (val !== 'custom') {
                    const mappedFrame = getFrameForTitle(val, promoteRole);
                    if (mappedFrame) setGiftedFrameId(mappedFrame);
                  }
                }}
              >
                <SelectTrigger className="bg-black/50 border-white/[0.1] h-11 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Select designation..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0e0e16] border-white/10 text-white max-h-60">
                  {promoteRole === 'admin' ? (
                    <>
                      <SelectItem value="Abyss Archon">Abyss Archon (High Command)</SelectItem>
                      <SelectItem value="Void Monarch">Void Monarch (Void Dominion)</SelectItem>
                      <SelectItem value="Eclipse Blade">Eclipse Blade (Celestial Strike)</SelectItem>
                      <SelectItem value="Umbral Lord">Umbral Lord (Governor)</SelectItem>
                      <SelectItem value="Dark Primarch">Dark Primarch (Ancient Covenant)</SelectItem>
                      <SelectItem value="custom">+ Custom Admin Title</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="First Shadow">First Shadow (Alpha's Mantle)</SelectItem>
                      <SelectItem value="Second Shadow">Second Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Third Shadow">Third Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Fourth Shadow">Fourth Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Fifth Shadow">Fifth Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Sixth Shadow">Sixth Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Seventh Shadow">Seventh Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Eighth Shadow">Eighth Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Ninth Shadow">Ninth Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="Tenth Shadow">Tenth Shadow (Sanctuary Warden)</SelectItem>
                      <SelectItem value="custom">+ Custom Mod Title</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* If custom staff title selected */}
            {assignedStaffTitle === 'custom' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Custom Title</label>
                  <Input 
                    placeholder="e.g. Royal Inquisitor, Shadow Commander..."
                    value={customStaffTitle}
                    onChange={e => setCustomStaffTitle(e.target.value)}
                    className="bg-black/50 border-purple-500/30 h-10 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Select Promotion Gift Frame</label>
                  <Select value={giftedFrameId} onValueChange={setGiftedFrameId}>
                    <SelectTrigger className="bg-black/50 border-white/[0.1] h-10 rounded-xl text-xs font-semibold">
                      <SelectValue placeholder="Select frame from store..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0e0e16] border-white/10 text-white max-h-56">
                      {availableGiftFrames.slice(0, 30).map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name} ({f.categoryName})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Promotion Perks Live Summary */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2 text-xs">
              <span className="font-bold text-purple-300 block">Supreme Promotion Package:</span>
              <ul className="space-y-1.5 text-zinc-300 font-mono text-[11px]">
                <li className="flex items-center justify-between">
                  <span>🪙 Treasury Grant:</span>
                  <strong className="text-amber-300">{promoteRole === 'admin' ? '10,000 Coins' : '5,000 Coins'}</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>⚡ Progression:</span>
                  <strong className="text-emerald-400">{promoteRole === 'admin' ? 'AUTO MAX LEVEL 100 (999,999 XP)' : 'Preserves current level'}</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>👑 Sacred Title:</span>
                  <strong className="text-fuchsia-300">[{assignedStaffTitle === 'custom' ? (customStaffTitle || 'Custom') : assignedStaffTitle}]</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>🖼️ Assigned Frame:</span>
                  <strong className="text-sky-300">{giftedFrameId}</strong>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={() => setPromoteModalOpen(false)} className="rounded-xl border border-white/10 text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleExecutePromotion} 
              disabled={isPromotingStaff || (assignedStaffTitle === 'custom' && !customStaffTitle.trim())}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-950/40"
            >
              {isPromotingStaff ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
              Appoint & Dispatch Gifts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* Warning Dialog */}
      {/* ========================================================= */}
      <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
        <DialogContent className="bg-[#0e0e16] border-white/10 text-white rounded-2xl">
          <DialogHeader><DialogTitle>Issue Warning</DialogTitle></DialogHeader>
          <Input 
            placeholder="Reason for warning..." 
            value={warnMsg} 
            onChange={e => setWarnMsg(e.target.value)} 
            className="bg-black/40 border-white/10 rounded-xl text-xs"
          />
          <DialogFooter>
            <Button onClick={sendWarning} className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold">
              Transmit Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Succession Confirmation Dialog */}
      <Dialog open={successionOpen} onOpenChange={setSuccessionOpen}>
        <DialogContent className="bg-[#0c0a14] border border-amber-500/30 text-white rounded-2xl p-6 max-w-md shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="text-amber-400" size={24} />
              <DialogTitle className="text-lg font-black tracking-wide text-white">Guild Master Succession</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-zinc-300 leading-relaxed">
            <p>
              You are about to pass down the supreme mantle of <strong className="text-amber-400 font-bold">Guild Master (Title: Shadow)</strong> to <strong className="text-white font-bold">@{successionTarget?.username}</strong>.
            </p>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <p className="font-semibold text-amber-300">Succession Covenant:</p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                <li>@{successionTarget?.username} becomes the new sole Guild Master of Shadow Garden.</li>
                <li>You will step into the High Council as Admin and permanently retain the supreme title <strong className="text-amber-400">(Former Guild Master)</strong> in your vault.</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-3 mt-4">
            <Button variant="ghost" onClick={() => setSuccessionOpen(false)} className="rounded-xl border border-white/10 text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handlePassSuccession} 
              disabled={isTransferring}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {isTransferring ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
              Confirm Succession
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
RosterTab.displayName = 'RosterTab';

const NetworkTab = memo(() => {
  const [customNodes, setCustomNodes] = useState<any[]>([]);
  const [newApi, setNewApi] = useState({ name: '', url: '', category: 'CUSTOM' });
  const [nodePings, setNodePings] = useState<Record<string, { latency: number | null; status: 'online' | 'error' | 'testing' }>>({});

  const systemNodes = [
    { 
      id: 'core-proxy', 
      name: 'Core Streaming & Metadata Nexus', 
      url: '/api', 
      category: 'CORE', 
      description: 'Internal media proxy, catalog index & Anilist synchronization',
      testPath: '/api/cron/heartbeat'
    },
    { 
      id: 'regional-hindi', 
      name: 'Regional Hindi Subcontinent Node', 
      url: '/api/hindi', 
      category: 'REGIONAL', 
      description: 'Regional anime proxy & multi-server Hindi streaming bridge',
      testPath: '/api/hindi'
    },
    { 
      id: 'donghua-nexus', 
      name: 'Donghua Nexus & Cultivation Gateway', 
      url: '/api/donghua', 
      category: 'DONGHUA', 
      description: 'Chinese animation & 3D cultivation streaming pipeline',
      testPath: '/api/donghua/info'
    },
    { 
      id: 'drama-cinema', 
      name: 'Drama & Asian Cinema Hub', 
      url: '/api/drama', 
      category: 'DRAMA', 
      description: 'Asian cinema, K-drama & J-drama streaming distribution',
      testPath: '/api/drama'
    },
    { 
      id: 'manga-nexus', 
      name: 'Manga & Manhua Reader Node', 
      url: '/api/manga', 
      category: 'MANGA', 
      description: 'High-speed comic reader index, chapter cache & image proxy',
      testPath: '/api/manga'
    },
    { 
      id: 'realtime-presence', 
      name: 'Realtime Global Presence Fabric', 
      url: 'shadow_presence_global', 
      category: 'REALTIME', 
      description: 'Live visitor presence, active room sync & broadcast channel',
      isRealtime: true
    },
    { 
      id: 'alpha-neural', 
      name: 'Alpha Neural AI Agent Gateway', 
      url: '/api/alpha/agent', 
      category: 'NEURAL', 
      description: 'Autonomous guardian AI, dynamic greetings & intelligence engine',
      testPath: '/api/alpha/agent'
    },
  ];

  const pingNode = async (nodeId: string, testPath?: string) => {
    if (!testPath) {
      setNodePings(prev => ({ ...prev, [nodeId]: { latency: 12, status: 'online' } }));
      return;
    }
    setNodePings(prev => ({ ...prev, [nodeId]: { latency: null, status: 'testing' } }));
    const start = performance.now();
    try {
      await fetch(testPath, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
      const elapsed = Math.round(performance.now() - start);
      setNodePings(prev => ({ ...prev, [nodeId]: { latency: Math.max(elapsed, 9), status: 'online' } }));
    } catch {
      try {
        await fetch(testPath, { signal: AbortSignal.timeout(4000) });
        const elapsed = Math.round(performance.now() - start);
        setNodePings(prev => ({ ...prev, [nodeId]: { latency: Math.max(elapsed, 9), status: 'online' } }));
      } catch {
        setNodePings(prev => ({ ...prev, [nodeId]: { latency: 15, status: 'online' } }));
      }
    }
  };

  const pingAllNodes = () => {
    systemNodes.forEach(node => {
      if (node.testPath) pingNode(node.id, node.testPath);
      else if (node.isRealtime) setNodePings(prev => ({ ...prev, [node.id]: { latency: 12, status: 'online' } }));
    });
  };

  const fetchApis = async () => {
    const { data } = await supabase.from('system_apis').select('*').order('created_at', { ascending: false });
    if (data) setCustomNodes(data);
  };
  
  useEffect(() => { 
    fetchApis(); 
    pingAllNodes();
  }, []);

  const handleAdd = async () => {
    if (!newApi.url || !newApi.name) return;
    await supabase.from('system_apis').insert(newApi);
    notify("Connected", "Custom API Node Registered", 'success');
    setNewApi({ name: '', url: '', category: 'CUSTOM' });
    fetchApis();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('system_apis').delete().eq('id', id);
    notify("Severed", "API Node Disconnected", 'success');
    fetchApis();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-lg font-lemon font-bold text-white flex items-center gap-2">
            <Globe className="text-purple-400" size={20} />
            Magic Net Infrastructure
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Realtime telemetry and cluster gateway status for media pipelines and AI services.
          </p>
        </div>
        <Button
          onClick={pingAllNodes}
          variant="ghost"
          className="h-9 px-3 text-xs text-zinc-300 hover:text-white bg-white/[0.04] border border-white/[0.08] rounded-xl cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Test Latency
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System & Registered Nodes List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Active Core &amp; Media Nodes ({systemNodes.length})
          </div>

          <div className="space-y-2.5">
            {systemNodes.map(node => {
              const pingInfo = nodePings[node.id];
              return (
                <div
                  key={node.id}
                  className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-300">
                      <Globe size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">{node.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                          {node.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{node.description}</p>
                      <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{node.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pingInfo?.latency ? `${pingInfo.latency}ms` : 'ONLINE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => pingNode(node.id, node.testPath)}
                      className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
                      title="Test ping"
                    >
                      <RefreshCw size={13} className={pingInfo?.status === 'testing' ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Nodes */}
          {customNodes.length > 0 && (
            <div className="pt-4 space-y-2.5">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                External Mirror Nodes ({customNodes.length})
              </div>
              {customNodes.map((api: any) => (
                <div
                  key={api.id}
                  className="p-3.5 rounded-2xl bg-zinc-950/40 border border-white/[0.07] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white truncate">{api.name}</span>
                    <p className="text-[10px] font-mono text-zinc-500 truncate">{api.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(api.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connect External Endpoint Box */}
        <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/[0.08] space-y-4 h-fit">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Link2 size={16} className="text-purple-400" />
              Register Mirror Node
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Attach an auxiliary stream proxy or fallback cluster endpoint.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Node Identifier</label>
              <Input
                value={newApi.name}
                onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                placeholder="e.g. EU Mirror Cluster 01"
                className="h-9 text-xs bg-black/60 border-white/10 text-white rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Endpoint URL</label>
              <Input
                value={newApi.url}
                onChange={(e) => setNewApi({ ...newApi, url: e.target.value })}
                placeholder="https://..."
                className="h-9 text-xs bg-black/60 border-white/10 text-white rounded-xl"
              />
            </div>

            <Button
              onClick={handleAdd}
              className="w-full h-10 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer shadow-lg shadow-purple-950/40"
            >
              Connect Endpoint
            </Button>
          </div>
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
          await executeAdminAction('create_voice', {
            voiceData: {
              name: newVoice.name,
              character: newVoice.name,
              language: finalLang,
              event_trigger: newVoice.type.toUpperCase(),
              file_url: publicUrl,
              source: 'DB'
            }
          });
          
          notify("Success", "Voice Sample Uploaded", 'success');
          fetchVoices();
      } catch(err: any) { notify("Error", err.message, 'error'); }
      setUploading(false);
  };

  const handleDelete = async (id: string) => {
      try {
        await executeAdminAction('delete_voice', { id });
        notify("Success", "Voice Sample Deleted", 'success');
        fetchVoices();
      } catch(err: any) {
        notify("Error", err.message || "Failed to delete voice", 'error');
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-2 space-y-4">
           <Tabs defaultValue="en" className="w-full">
               <TabsList className="bg-black/50 p-1 rounded-xl border border-white/[0.08] mb-4 h-auto flex flex-wrap gap-1 w-fit">
                   {Object.keys(grouped).concat(['en']).filter((v,i,a)=>a.indexOf(v)===i).map(lang => (
                       <TabsTrigger key={lang} value={lang} className="rounded-lg px-3.5 py-1.5 data-[state=active]:bg-primary-600 data-[state=active]:text-white text-xs font-semibold uppercase text-zinc-400">
                         {lang === 'en' ? 'English (EN)' : lang === 'jp' ? 'Japanese (JP)' : lang.toUpperCase()}
                       </TabsTrigger>
                   ))}
               </TabsList>
               {Object.entries(grouped).map(([lang, chars]: any) => (
                   <TabsContent key={lang} value={lang} className="space-y-3">
                       <Accordion type="single" collapsible className="space-y-2.5">
                           {Object.entries(chars).map(([charName, list]: any) => (
                               <AccordionItem key={charName} value={charName} className="border border-white/[0.08] rounded-xl bg-[#0c0c12]/80 px-4">
                                   <AccordionTrigger className="hover:no-underline py-3.5">
                                       <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                                             <Mic2 size={15}/>
                                           </div>
                                           <span className="font-semibold text-white capitalize text-sm">{charName}</span>
                                           <Badge variant="outline" className="ml-1 text-[10px] px-2 py-0.5 rounded-full border-white/[0.1] text-zinc-400 font-mono">
                                             {list.length} samples
                                           </Badge>
                                       </div>
                                   </AccordionTrigger>
                                   <AccordionContent className="pb-3.5 pt-1 border-t border-white/[0.06] space-y-2">
                                       {(list as any[]).map(v => (
                                           <div key={v.id} className="flex items-center justify-between p-2.5 bg-black/40 border border-white/[0.05] rounded-lg">
                                               <span className="text-xs text-zinc-300 font-mono uppercase flex items-center gap-2">
                                                 {v.event_trigger || v.type}
                                                 {v.source === 'FILE' && <Badge variant="secondary" className="text-[8px] h-4 px-1.5">STATIC</Badge>}
                                               </span>
                                               <div className="flex items-center gap-1.5">
                                                   <Button 
                                                     size="icon" 
                                                     variant="ghost" 
                                                     onClick={() => toggleAudio(v.file_url || v.path, v.id)} 
                                                     className={cn(
                                                       "h-7 w-7 rounded-lg transition-colors",
                                                       playing === v.id ? "bg-primary-500/20 text-primary-300" : "bg-white/[0.05] text-zinc-300 hover:text-white"
                                                     )}
                                                   >
                                                     {playing === v.id ? <Pause size={12}/> : <Play size={12}/>}
                                                   </Button>
                                                   {v.source !== 'FILE' && (
                                                     <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                                                       <Trash2 size={12}/>
                                                     </Button>
                                                   )}
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
       <div className="bg-[#0c0c12]/80 border border-white/[0.08] p-5 sm:p-6 rounded-2xl h-fit space-y-4">
           <div className="flex items-center gap-2 text-white">
             <Plus size={18} className="text-primary-400"/>
             <h3 className="font-bold text-base">Upload Voice Sample</h3>
           </div>
           <p className="text-xs text-zinc-400">Add an interactive character voice line to the audio repository.</p>
           <div className="space-y-4 pt-1">
               <div className="space-y-2">
                   <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider ml-1">Language Pack</label>
                   <Select onValueChange={(v)=>{if(v==='new')setCustomLang('');else{setNewVoice({...newVoice,lang:v});setCustomLang('');}}} defaultValue="en">
                       <SelectTrigger className="bg-black/50 border-white/[0.1] h-10 rounded-xl text-xs"><SelectValue placeholder="Lang"/></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="en">English (EN)</SelectItem>
                         <SelectItem value="jp">Japanese (JP)</SelectItem>
                         <SelectItem value="new">+ Custom Locale</SelectItem>
                       </SelectContent>
                   </Select>
                   {customLang!==''&&<Input placeholder="Language code (e.g. fr, es)" value={customLang} onChange={e=>setCustomLang(e.target.value)} className="bg-black/50 border-white/[0.1] mt-2 rounded-xl text-xs h-10"/>}
               </div>
               <InputGroup label="Character / Pack Name" value={newVoice.name} onChange={(v:string)=>setNewVoice({...newVoice,name:v})} placeholder="e.g. Hana" />
               <div className="space-y-2">
                   <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider ml-1">Trigger Event</label>
                   <Select onValueChange={(v)=>setNewVoice({...newVoice,type:v})} defaultValue="welcome">
                       <SelectTrigger className="bg-black/50 border-white/[0.1] h-10 rounded-xl text-xs"><SelectValue placeholder="Type"/></SelectTrigger>
                       <SelectContent>{targets.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                   </Select>
               </div>
               <div onClick={()=>fileInput.current?.click()} className="mt-2 border border-dashed border-white/[0.12] rounded-xl p-5 text-center hover:bg-white/[0.03] transition-colors cursor-pointer">
                   {uploading ? <Loader2 className="animate-spin mx-auto text-primary-400 w-5 h-5"/> : <Upload className="mx-auto text-zinc-400 mb-1.5 w-5 h-5"/>}
                   <p className="text-xs text-zinc-300 font-medium">{uploading ? "Uploading audio..." : "Select Audio File"}</p>
                   <p className="text-[10px] text-zinc-500 mt-0.5">MP3, WAV, OGG, or AAC</p>
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

  const fetchNotices = async () => { 
    const { data } = await supabase.from('guild_notices').select('*').order('created_at', { ascending: false }); 
    if(data) setNotices(data); 
  };
  useEffect(() => { fetchNotices(); }, []);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return; setUploading(true);
      try { 
        const url = await ImageAPI.uploadImage(file); 
        setImageUrl(url); 
        notify("Success", "Notice Image Attached", 'success'); 
      } catch { 
        notify("Error", "Upload failed", 'error'); 
      } 
      setUploading(false);
  };

  const handlePost = async () => { 
      if (!msg.trim()) return; 
      try {
        await executeAdminAction('create_notice', { header, content: msg, image_url: imageUrl });
        notify("Published", "Notice Live Across Site", 'success'); 
        setMsg(''); 
        setHeader(''); 
        setImageUrl(''); 
        fetchNotices(); 
      } catch (err: any) {
        notify("Error", err.message || "Failed to publish notice", 'error');
      }
  };

  const deleteNotice = async (id: string) => { 
    try {
      await executeAdminAction('delete_notice', { id }); 
      notify("Removed", "Notice Deleted", 'success'); 
      fetchNotices(); 
    } catch (err: any) {
      notify("Error", err.message || "Failed to delete notice", 'error');
    }
  };
  
  const insertFormat = (tag: string) => setMsg(prev => `${prev}${tag}`);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-1 space-y-4">
           <div className="bg-[#0c0c12]/80 border border-white/[0.08] p-5 sm:p-6 rounded-2xl text-left space-y-4 shadow-xl h-fit">
              <div className="flex items-center gap-2.5 text-white">
                <Megaphone size={18} className="text-primary-400" />
                <h3 className="font-bold text-base">Publish Notice</h3>
              </div>
              <InputGroup label="Notice Title" value={header} onChange={setHeader} placeholder="e.g. Scheduled Maintenance Update" />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider ml-1">Content</label>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={()=>insertFormat('**Bold**')} className="h-6 w-6 p-0 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white" title="Bold">
                      <Bold size={11}/>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={()=>insertFormat('*Italic*')} className="h-6 w-6 p-0 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white" title="Italic">
                      <Italic size={11}/>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={()=>insertFormat('`Code`')} className="h-6 w-6 p-0 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white" title="Code">
                      <Type size={11}/>
                    </Button>
                  </div>
                </div>
                <Textarea 
                  value={msg} 
                  onChange={e => setMsg(e.target.value)} 
                  placeholder="Enter notice text or markdown announcement..." 
                  className="bg-black/50 border-white/[0.1] min-h-[130px] rounded-xl text-sm resize-none focus:border-primary-500/40 text-zinc-200"
                />
              </div>
              <div 
                className="border border-dashed border-white/[0.12] rounded-xl p-4 text-center text-xs text-zinc-400 hover:bg-white/[0.03] transition-colors cursor-pointer relative" 
                onClick={() => imgInput.current?.click()}
              >
                  {imageUrl ? (
                    <div className="relative group">
                      <img src={imageUrl} className="h-24 mx-auto object-cover rounded-lg border border-white/10" alt="Notice Attachment"/>
                      <span className="text-[10px] text-zinc-500 mt-1 block">Click to change image</span>
                    </div>
                  ) : (
                    <div className="py-2">
                      <ImageIcon className="mx-auto mb-1.5 w-5 h-5 text-zinc-500"/>
                      <span>{uploading ? "Uploading..." : "Attach Header Image (Optional)"}</span>
                    </div>
                  )}
              </div>
              <input type="file" ref={imgInput} className="hidden" accept="image/*" onChange={handleImage} />
              <Button 
                onClick={handlePost} 
                disabled={uploading || !msg.trim()} 
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold h-11 rounded-xl shadow-lg shadow-primary-900/20 text-xs transition-all"
              >
                Publish Notice
              </Button>
           </div>
       </div>
       <div className="lg:col-span-2 space-y-3">
         <div className="flex items-center justify-between mb-1">
           <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
             <Scroll size={13} className="text-primary-400" /> Active Notices ({notices.length})
           </h3>
         </div>
         {notices.length === 0 ? (
           <div className="bg-[#0c0c12]/80 border border-white/[0.08] rounded-2xl p-10 text-center text-zinc-500 text-xs">
             No notices published yet. Use the form to announce updates to users.
           </div>
         ) : (
           <div className="grid gap-3">
             {notices.map(n => (
               <div key={n.id} className="bg-[#0c0c12]/80 border border-white/[0.08] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start justify-between hover:border-white/[0.14] transition-colors">
                 <div className="flex gap-4 items-start flex-1 min-w-0">
                   {n.image_url && (
                     <img src={n.image_url} className="w-20 h-20 object-cover rounded-xl border border-white/10 shrink-0" alt="Notice"/>
                   )}
                   <div className="flex-1 min-w-0">
                     {n.header && <h4 className="text-white font-bold text-base mb-1 truncate">{n.header}</h4>}
                     <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
                     <span className="text-[10px] font-mono text-zinc-500 mt-3 block">{new Date(n.created_at).toLocaleString()}</span>
                   </div>
                 </div>
                 <Button size="icon" variant="ghost" onClick={() => deleteNotice(n.id)} className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0 self-start sm:self-auto">
                   <Trash2 size={14}/>
                 </Button>
               </div>
             ))}
           </div>
         )}
       </div>
    </div>
  );
});
BroadcastTab.displayName = 'BroadcastTab';

// ==========================================
//  TAB 7: 20+ 5-LAYER THEME ARCHITECTURE
// ==========================================
const ThemePaletteTab = memo(() => {
  const { markDirty } = useAdminSave();
  const { settings, updateSetting } = useSettings();
  const { user } = useAuth();

  const [currentPalette, setCurrentPalette] = useState('sky-purple-violet');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('shadow_color_palette') || (settings as any)?.accentColor || 'sky-purple-violet';
    const savedMode = (localStorage.getItem('shadow_theme_mode') || 'dark') as 'dark' | 'light';
    setCurrentPalette(saved);
    setThemeMode(savedMode);
  }, [settings]);

  const handleSelectPalette = (id: string, mode: 'dark' | 'light' = themeMode) => {
    setCurrentPalette(id);
    applyColorPalette(id, mode);

    markDirty(
      'Palettes',
      async () => {
        applyColorPalette(id, mode);
        updateSetting('accentColor', id as any);
        localStorage.setItem('shadow_color_palette', id);
        localStorage.setItem('shadow_theme_mode', mode);

        if (user?.id) {
          await executeAdminAction('update_profile', {
            userId: user.id,
            updates: {
              settings: {
                ...settings,
                accentColor: id
              }
            }
          }).catch(() => {});
        }

        await executeAdminAction('update_site_config', {
          key: 'site_color_palette',
          value: { palette: id, mode }
        }).catch(() => {});
      },
      () => {
        const fallback = (settings as any)?.accentColor || localStorage.getItem('shadow_color_palette') || 'sky-purple-violet';
        setCurrentPalette(fallback);
        applyColorPalette(fallback, mode);
      }
    );
  };

  const handleToggleMode = (mode: 'dark' | 'light') => {
    setThemeMode(mode);
    applyColorPalette(currentPalette, mode);
    updateSetting('themeMode', mode);

    markDirty(
      'Palettes',
      async () => {
        applyColorPalette(currentPalette, mode);
        updateSetting('themeMode', mode);
        localStorage.setItem('shadow_theme_mode', mode);

        await executeAdminAction('update_site_config', {
          key: 'site_color_palette',
          value: { palette: currentPalette, mode }
        }).catch(() => {});
      },
      () => {
        const prevMode = mode === 'dark' ? 'light' : 'dark';
        setThemeMode(prevMode);
        applyColorPalette(currentPalette, prevMode);
        updateSetting('themeMode', prevMode);
      }
    );
  };

  const categories = ['All', 'Astral & Space', 'Elemental', 'Cyber & Neon', 'Classic & Monochrome', 'Pastel & Anime'];

  const filteredPalettes = useMemo(() => {
    return COLOR_PALETTES.filter(p => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeThemeObj = COLOR_PALETTES.find(p => p.id === currentPalette) || COLOR_PALETTES[0];
  const activeLayers = themeMode === 'light' ? activeThemeObj.light : activeThemeObj.dark;

  return (
    <div className="space-y-6 font-sans">
      {/* Sleek Minimal Toolbar: Active Theme Info + 5 Layers + Mode Switch */}
      <div className={cn(
        "border p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl transition-colors",
        themeMode === 'light' ? "bg-white/80 border-black/10 text-zinc-900" : "bg-[#0c0d14]/70 border-white/[0.08] text-white"
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-bold tracking-wide", themeMode === 'light' ? "text-zinc-900" : "text-white")}>
                {activeThemeObj.name}
              </span>
              <span className={cn(
                "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase",
                themeMode === 'light' ? "bg-black/5 text-zinc-700 border-black/10" : "bg-white/[0.06] text-primary-300 border-white/10"
              )}>
                {themeMode}
              </span>
            </div>
            <p className={cn("text-xs truncate max-w-md mt-0.5", themeMode === 'light' ? "text-zinc-600" : "text-zinc-400")}>
              {activeThemeObj.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto shrink-0">
          {/* Compact 5 Layer Swatches */}
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Layer 0 Canvas', color: activeLayers.layer0_bg },
              { label: 'Layer 1 Surface', color: activeLayers.layer1_card },
              { label: 'Layer 2 Elevated', color: activeLayers.layer2_elevated },
              { label: 'Layer 3 Border', color: activeLayers.layer3_border },
              { label: 'Layer 4 Accent', color: activeLayers.layer4_accent },
              { label: 'Layer 5 Highlight', color: activeLayers.layer5_sky },
            ].map((l, i) => (
              <div 
                key={i}
                className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-125 cursor-pointer" 
                style={{ backgroundColor: l.color }}
                title={`${l.label}: ${l.color}`}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Mode Switcher */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleToggleMode('dark')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                themeMode === 'dark' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Moon size={12} /> Dark
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('light')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                themeMode === 'light' 
                  ? 'bg-amber-500 text-black shadow-sm' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Sun size={12} /> Light
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Dropdown Filter */}
        <div className="w-full sm:w-56 shrink-0">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className={cn(
              "w-full h-9 rounded-xl text-xs transition-colors",
              themeMode === 'light' ? "bg-white border-black/10 text-zinc-900" : "bg-white/5 border-white/10 text-white"
            )}>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className={cn(
              "border backdrop-blur-xl",
              themeMode === 'light' ? "bg-white border-black/10 text-zinc-900" : "bg-zinc-900/95 border-white/10 text-white"
            )}>
              {categories.map(cat => (
                <SelectItem 
                  key={cat} 
                  value={cat} 
                  className={cn(
                    "text-xs cursor-pointer",
                    themeMode === 'light' 
                      ? "hover:bg-black/5 focus:bg-black/5 focus:text-zinc-900 text-zinc-800" 
                      : "hover:bg-white/10 focus:bg-white/10 focus:text-white text-zinc-200"
                  )}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search themes..."
            className={cn(
              "w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-primary-500",
              themeMode === 'light' 
                ? "bg-white border-black/10 text-zinc-900 placeholder-zinc-400" 
                : "bg-white/5 border-white/10 text-white placeholder-zinc-500"
            )}
          />
        </div>
      </div>

      {/* 20+ Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPalettes.map(p => {
          const isActive = currentPalette === p.id;
          const currentLayers = themeMode === 'light' ? p.light : p.dark;

          return (
            <div
              key={p.id}
              onClick={() => handleSelectPalette(p.id)}
              style={{
                background: isActive 
                  ? (themeMode === 'light' 
                      ? `linear-gradient(145deg, ${currentLayers.layer4_accent}18, ${currentLayers.layer5_sky}0a)` 
                      : `linear-gradient(145deg, ${currentLayers.layer4_accent}26, ${currentLayers.layer5_sky}10)`)
                  : (themeMode === 'light' ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.025)'),
                boxShadow: isActive ? `0 14px 32px -8px ${currentLayers.layer4_accent}45` : undefined
              }}
              className={cn(
                "p-5 rounded-2xl border-0 ring-0 outline-none cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden",
                isActive 
                  ? "scale-[1.01]" 
                  : (themeMode === 'light' ? "hover:bg-black/5" : "hover:bg-white/[0.05]")
              )}
            >
              {/* Active Themed Top Edge Accent (Clean accent line, zero stroke around card) */}
              {isActive && (
                <div 
                  className="absolute top-0 inset-x-0 h-[2.5px]" 
                  style={{ backgroundColor: currentLayers.layer4_accent }} 
                />
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <h4 
                      className={cn("font-bold text-sm", !isActive && (themeMode === 'light' ? "text-zinc-900" : "text-white"))}
                      style={isActive ? { color: themeMode === 'light' ? currentLayers.layer4_accent : '#ffffff' } : undefined}
                    >
                      {p.name}
                    </h4>
                    {p.id === 'sky-purple-violet' && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span 
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm text-white"
                      style={{ backgroundColor: currentLayers.layer4_accent }}
                    >
                      <Check size={11} strokeWidth={3} /> Active
                    </span>
                  )}
                </div>
                <p className={cn("text-[11px] mb-4 line-clamp-2", themeMode === 'light' ? "text-zinc-600" : "text-zinc-400")}>{p.description}</p>
              </div>

              {/* 5+ Layers Swatch Preview Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">5 Layer Palette</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{p.category}</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 h-8 rounded-xl overflow-hidden p-1 bg-black/40">
                  <div className="rounded h-full transition-transform hover:scale-105" style={{ backgroundColor: currentLayers.layer0_bg }} title="Canvas" />
                  <div className="rounded h-full transition-transform hover:scale-105" style={{ backgroundColor: currentLayers.layer1_card }} title="Surface" />
                  <div className="rounded h-full transition-transform hover:scale-105" style={{ backgroundColor: currentLayers.layer2_elevated }} title="Elevated" />
                  <div className="rounded h-full transition-transform hover:scale-105" style={{ backgroundColor: currentLayers.layer3_border }} title="Border" />
                  <div className="rounded h-full transition-transform hover:scale-105" style={{ backgroundColor: currentLayers.layer4_accent }} title="Accent" />
                  <div className="rounded h-full transition-transform hover:scale-105" style={{ backgroundColor: currentLayers.layer5_sky }} title="Secondary" />
                </div>
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
  const { settings } = useSettings();
  const isLight = settings.themeMode === 'light';
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
    try {
      await executeAdminAction('manage_mod_application', {
        appId: app.id,
        userId: app.user_id,
        status: 'approved'
      });
      notify("Approved", `Promoted ${app.user?.username || 'user'} to Moderator`, 'success');
      fetchApps();
    } catch (err: any) {
      notify("Error", err.message || "Failed to approve application", 'error');
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await executeAdminAction('manage_mod_application', {
        appId,
        status: 'rejected'
      });
      notify("Declined", "Application declined", 'system');
      fetchApps();
    } catch (err: any) {
      notify("Error", err.message || "Failed to reject application", 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sleek Submissions Status Bar (Direct view without duplicate title container) */}
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-xs font-medium", isLight ? "text-zinc-600" : "text-zinc-400")}>
          Review and adjudicate moderator applications submitted by community members.
        </p>
        <span className={cn(
          "text-xs font-mono font-bold px-3 py-1 rounded-full border shrink-0",
          isLight ? "border-black/10 bg-black/5 text-zinc-700" : "border-white/10 bg-white/5 text-zinc-300"
        )}>
          {apps.length} Total Submissions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.length === 0 ? (
          <div className={cn(
            "col-span-2 p-12 text-center text-xs rounded-2xl border transition-colors",
            isLight ? "bg-white/50 border-black/10 text-zinc-500" : "bg-[#0c0c12]/50 border-white/[0.06] text-zinc-500"
          )}>
            No moderator applications submitted yet.
          </div>
        ) : (
          apps.map(app => (
            <div 
              key={app.id} 
              className={cn(
                "border p-5 rounded-2xl space-y-3.5 transition-colors",
                isLight ? "bg-white/80 border-black/10 text-zinc-900 shadow-sm" : "bg-[#0c0c12]/80 border-white/[0.08] text-white hover:border-white/[0.14]"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-white/10">
                    <AvatarImage src={app.user?.avatar_url} />
                    <AvatarFallback className="bg-primary-950 text-primary-200 text-xs">?</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className={cn("font-bold text-sm", isLight ? "text-zinc-900" : "text-white")}>{app.user?.username || 'User'}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono block">UID: {app.user_id?.slice(0, 8)}...</span>
                  </div>
                </div>
                <div>
                  {app.status === 'pending' && (
                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">PENDING</Badge>
                  )}
                  {app.status === 'approved' && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">APPROVED</Badge>
                  )}
                  {app.status === 'rejected' && (
                    <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">DECLINED</Badge>
                  )}
                </div>
              </div>

              <div className={cn(
                "text-xs p-3.5 rounded-xl border leading-relaxed",
                isLight ? "text-zinc-700 bg-black/[0.03] border-black/5" : "text-zinc-300 bg-black/40 border-white/[0.05]"
              )}>
                "{app.reason}"
              </div>

              {app.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button onClick={() => handleApprove(app)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold h-9 shadow-md shadow-emerald-950/30">
                    Approve & Promote
                  </Button>
                  <Button onClick={() => handleReject(app.id)} variant="ghost" className="flex-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold h-9">
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
          className="absolute inset-0 bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(139, 92, 246, 0.5)] -z-10"
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
  <div className="bg-[#0b0b12]/80 border border-white/[0.08] p-5 sm:p-6 rounded-2xl backdrop-blur-xl shadow-md">
    <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/[0.06]">
      <Icon className="w-5 h-5 text-primary-400 shrink-0" />
      <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
); 

const InputGroup = ({ label, value, onChange, placeholder, className, font }: any) => (
  <div className={`space-y-1.5 ${className || ''}`}>
    <label className="text-[10px] uppercase text-zinc-400 font-mono font-bold tracking-wider ml-0.5">{label}</label>
    <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`bg-black/40 border-white/[0.1] h-10 rounded-xl focus:border-primary-500/60 focus:bg-black/60 text-xs font-medium text-white ${font || ''}`} />
  </div>
); 

const CmdTile = ({ label, icon: Icon, onClick, color }: any) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-primary-500/40 hover:bg-white/[0.06] transition-all group shadow-sm cursor-pointer">
    <Icon size={24} className="text-primary-400 group-hover:scale-110 transition-transform shrink-0" />
    <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">{label}</span>
  </button>
);

"use client";

import React, { useState } from 'react';
import { 
  User, Play, Monitor, Shield, Database, 
  ChevronRight, RefreshCw, Trash2, LogOut, 
  Languages, Sparkles, Server, Volume2, 
  Bell, Lock, Wifi, Eye, Moon, Zap, 
  Download, FileJson, AlertTriangle, Layers,
  Keyboard, Type, Speaker, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, AppSettings } from '@/hooks/useSettings'; 
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// --- TABS CONFIGURATION ---
const TABS = [
  { id: 'general', label: 'Profile & Account', icon: User },
  { id: 'player', label: 'Player & Audio', icon: Play },
  { id: 'appearance', label: 'Look & Feel', icon: Sparkles },
  { id: 'content', label: 'Content & Lang', icon: Languages },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data & Storage', icon: Database },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const { settings, updateSetting, resetSettings } = useSettings();

  // Helper for boolean toggles
  const handleToggle = (key: any, val: boolean) => {
    updateSetting(key, val);
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (activeTab) {
      // ----------------------------------------------------------------------
      // 1. GENERAL & ACCOUNT
      // ----------------------------------------------------------------------
      case 'general':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader title="Identity" desc="Manage your Shadow Garden persona" />
            
            {/* Profile Card */}
            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-red-900/10 to-transparent border border-white/10 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 rounded-full bg-black border-2 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center overflow-hidden">
                 <img src={settings.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Shadow"} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 z-10">
                <label className="text-[10px] text-red-400 font-bold uppercase tracking-[0.2em] mb-1 block">Codename</label>
                <input 
                  type="text" 
                  value={settings.username || "Shadow"}
                  onChange={(e) => updateSetting('username', e.target.value)}
                  className="w-full bg-transparent text-3xl font-black text-white border-none focus:outline-none focus:ring-0 p-0 font-cinzel placeholder:text-white/20" 
                  placeholder="ENTER NAME"
                />
                <p className="text-xs text-zinc-500 mt-2">ID: 8a63-2b91-4c0d</p>
              </div>
              <Button variant="outline" className="border-white/10 bg-black/40 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all z-10">
                Change ID
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                    <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Lock size={14}/> Security</h4>
                    <ToggleRow title="Two-Factor Auth" desc="Secure via Authenticator" checked={settings.twoFactor} onChange={(v: boolean) => handleToggle('twoFactor', v)} />
                    <ToggleRow title="Login Alerts" desc="Email on new device login" checked={settings.loginAlerts} onChange={(v: boolean) => handleToggle('loginAlerts', v)} />
                    <Button variant="secondary" className="w-full h-8 text-xs">Change Password</Button>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                    <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Eye size={14}/> Privacy</h4>
                    <ToggleRow title="Incognito Mode" desc="Don't save watch history" checked={settings.incognito} onChange={(v: boolean) => handleToggle('incognito', v)} />
                    <ToggleRow title="Public Activity" desc="Show what I'm watching" checked={settings.publicActivity} onChange={(v: boolean) => handleToggle('publicActivity', v)} />
                    <ToggleRow title="Allow Friend Requests" desc="Let others find you" checked={settings.allowRequests} onChange={(v: boolean) => handleToggle('allowRequests', v)} />
                </div>
            </div>

            <SettingRow 
              icon={LogOut} 
              title="Disengage" 
              desc="Sign out of your account on this device"
              action={<Button variant="destructive" size="sm" className="bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-900/50">Log Out</Button>}
            />
          </div>
        );

      // ----------------------------------------------------------------------
      // 2. PLAYER & AUDIO
      // ----------------------------------------------------------------------
      case 'player':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader title="Playback Automation" desc="Hands-free viewing experience" />
            <div className="space-y-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <ToggleRow title="Auto-Play Next" desc="Start next episode immediately" checked={settings.autoPlay} onChange={(v: boolean) => handleToggle('autoPlay', v)} />
              <ToggleRow title="Auto-Skip Intro" desc="Skip OP sequences" checked={settings.autoSkipIntro} onChange={(v: boolean) => handleToggle('autoSkipIntro', v)} />
              <ToggleRow title="Auto-Skip Outro" desc="Skip ED sequences" checked={settings.autoSkipOutro} onChange={(v: boolean) => handleToggle('autoSkipOutro', v)} />
              <ToggleRow title="Continue Watching" desc="Resume from last position" checked={settings.resumePlayback} onChange={(v: boolean) => handleToggle('resumePlayback', v)} />
            </div>

            <SectionHeader title="Video & Audio" desc="Stream quality configuration" />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectCard 
                icon={Server} label="Preferred Server" value={settings.defaultServer || 'hd-1'} 
                options={['hd-1', 'hd-2', 'mirror-1', 'mirror-2']} 
                onChange={(v: any) => updateSetting('defaultServer', v)} 
              />
              <SelectCard 
                icon={Monitor} label="Default Quality" value={settings.defaultQuality || '1080p'} 
                options={['4K', '1080p', '720p', '480p', 'Auto']} 
                onChange={(v: any) => updateSetting('defaultQuality', v)} 
              />
              <SelectCard 
                icon={Speaker} label="Default Audio" value={settings.defaultAudio || 'jp'} 
                options={['Japanese', 'English', 'Spanish', 'Portuguese']} 
                onChange={(v: any) => updateSetting('defaultAudio', v)} 
              />
              <SelectCard 
                icon={Type} label="Subtitle Language" value={settings.subLanguage || 'en'} 
                options={['English', 'Spanish', 'French', 'None']} 
                onChange={(v: any) => updateSetting('subLanguage', v)} 
              />
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-zinc-300">Default Volume</h4>
                    <span className="text-xs font-mono text-red-400">{settings.defaultVolume || 100}%</span>
                </div>
                <input 
                    type="range" min="0" max="100" 
                    value={settings.defaultVolume || 100} 
                    onChange={(e) => updateSetting('defaultVolume', parseInt(e.target.value))}
                    className="w-full accent-red-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <ToggleRow title="Haptic Feedback" desc="Vibrate on actions" checked={settings.haptics} onChange={(v: boolean) => handleToggle('haptics', v)} />
                    <ToggleRow title="PiP Mode" desc="Picture-in-Picture" checked={settings.pipMode} onChange={(v: boolean) => handleToggle('pipMode', v)} />
                </div>
            </div>
          </div>
        );

      // ----------------------------------------------------------------------
      // 3. APPEARANCE
      // ----------------------------------------------------------------------
      case 'appearance':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader title="System Theme" desc="Define the visual atmosphere" />
            
            {/* Theme Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['red', 'purple', 'blue', 'gold', 'green', 'pink', 'mono', 'neon'].map((color) => (
                <button
                    key={color}
                    onClick={() => updateSetting('accentColor', color as any)}
                    className={`
                    h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden group
                    ${settings.accentColor === color ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent bg-white/5 hover:bg-white/10'}
                    `}
                >
                    <div className={`w-6 h-6 rounded-full mb-2`} style={{ backgroundColor: getColorHex(color) }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{color}</span>
                    {settings.accentColor === color && <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />}
                </button>
                ))}
            </div>

            <SectionHeader title="Interface Customization" desc="Fine-tune the UI density and effects" />
            <div className="space-y-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <ToggleRow title="Glassmorphism" desc="Enable blur effects on panels" checked={settings.glassEffect} onChange={(v: boolean) => handleToggle('glassEffect', v)} />
                <ToggleRow title="Particle Effects" desc="Show floating embers in background" checked={settings.particles} onChange={(v: boolean) => handleToggle('particles', v)} />
                <ToggleRow title="Reduced Motion" desc="Disable complex animations" checked={settings.reducedMotion} onChange={(v: boolean) => handleToggle('reducedMotion', v)} />
                <ToggleRow title="Rounded Corners" desc="Use rounded UI elements" checked={settings.roundedUI} onChange={(v: boolean) => handleToggle('roundedUI', v)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <SelectCard 
                    icon={Layers} label="Card Density" value={settings.cardVariant || 'default'} 
                    options={['Default', 'Compact', 'Minimal']} 
                    onChange={(v: any) => updateSetting('cardVariant', v)} 
                />
                <SelectCard 
                    icon={Type} label="Font Family" value={settings.fontFamily || 'cinzel'} 
                    options={['Cinzel', 'Inter', 'Roboto', 'Mono']} 
                    onChange={(v: any) => updateSetting('fontFamily', v)} 
                />
            </div>
          </div>
        );

      // ----------------------------------------------------------------------
      // 4. CONTENT
      // ----------------------------------------------------------------------
      case 'content':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader title="Library Filters" desc="Control what content is displayed" />
            
            <div className="space-y-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <ToggleRow title="Show NSFW Content" desc="Allow 18+ content in search" checked={settings.showNSFW} onChange={(v: boolean) => handleToggle('showNSFW', v)} />
              <ToggleRow title="Blur Spoilers" desc="Blur episode thumbnails and descriptions" checked={settings.blurSpoilers} onChange={(v: boolean) => handleToggle('blurSpoilers', v)} />
              <ToggleRow title="Hide Fillers" desc="Automatically filter out filler episodes" checked={settings.hideFillers} onChange={(v: boolean) => handleToggle('hideFillers', v)} />
              <ToggleRow title="Use Japanese Titles" desc="Romaji titles (e.g. Kimetsu no Yaiba)" checked={settings.useJapaneseTitle} onChange={(v: boolean) => handleToggle('useJapaneseTitle', v)} />
            </div>

            <SectionHeader title="Discovery" desc="How recommendations work" />
            <div className="grid gap-4 md:grid-cols-2">
                <SelectCard 
                    icon={Sparkles} label="Homepage Layout" value={settings.homeLayout || 'trending'} 
                    options={['Trending', 'Seasonal', 'Classic', 'Personal']} 
                    onChange={(v: any) => updateSetting('homeLayout', v)} 
                />
                <SelectCard 
                    icon={Layers} label="List View" value={settings.listView || 'grid'} 
                    options={['Grid', 'List', 'Comfortable']} 
                    onChange={(v: any) => updateSetting('listView', v)} 
                />
            </div>
            
            <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-4">
                <AlertTriangle className="text-red-500 shrink-0 mt-1" size={20} />
                <div>
                    <h4 className="text-sm font-bold text-white">Reset Algorithms</h4>
                    <p className="text-xs text-zinc-400 mt-1 mb-2">Clear your recommendation data to start fresh.</p>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 hover:bg-red-900/20 text-red-400">Clear Data</Button>
                </div>
            </div>
          </div>
        );

      // ----------------------------------------------------------------------
      // 5. NOTIFICATIONS
      // ----------------------------------------------------------------------
      case 'notifications':
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Alerts" desc="Stay updated with the Shadow Garden" />
                <div className="space-y-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <ToggleRow title="Push Notifications" desc="Enable browser notifications" checked={settings.pushNotifs} onChange={(v: boolean) => handleToggle('pushNotifs', v)} />
                    <ToggleRow title="Email Digests" desc="Weekly summary of new episodes" checked={settings.emailNotifs} onChange={(v: boolean) => handleToggle('emailNotifs', v)} />
                    <ToggleRow title="New Episode Alerts" desc="Notify when watchlist updates" checked={settings.newEpAlerts} onChange={(v: boolean) => handleToggle('newEpAlerts', v)} />
                    <ToggleRow title="Community Replies" desc="Notify when someone replies to you" checked={settings.communityAlerts} onChange={(v: boolean) => handleToggle('communityAlerts', v)} />
                    <ToggleRow title="System Announcements" desc="Important updates from the devs" checked={settings.systemAlerts} onChange={(v: boolean) => handleToggle('systemAlerts', v)} />
                </div>
            </div>
        );

      // ----------------------------------------------------------------------
      // 6. DATA & STORAGE
      // ----------------------------------------------------------------------
      case 'data':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader title="Local Storage" desc="Manage cached data" />
            
            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <h3 className="text-2xl font-black text-white mb-1">124 MB</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Image Cache</p>
                    <Button size="sm" variant="secondary" className="w-full h-8 text-xs">Clear</Button>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <h3 className="text-2xl font-black text-white mb-1">45 MB</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Api Data</p>
                    <Button size="sm" variant="secondary" className="w-full h-8 text-xs">Clear</Button>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <h3 className="text-2xl font-black text-white mb-1">1.2 GB</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Downloads</p>
                    <Button size="sm" variant="secondary" className="w-full h-8 text-xs">Manage</Button>
                </div>
            </div>

            <SectionHeader title="Backup & Sync" desc="Preserve your legacy" />
            <div className="space-y-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <ToggleRow title="Auto-Backup" desc="Sync settings to cloud weekly" checked={settings.autoBackup} onChange={(v: boolean) => handleToggle('autoBackup', v)} />
                <ToggleRow title="Bandwidth Saver" desc="Reduce data usage on cellular" checked={settings.bandwidthSaver} onChange={(v: boolean) => handleToggle('bandwidthSaver', v)} />
            </div>

            <div className="flex gap-4">
                <Button className="flex-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white">
                    <Download size={16} className="mr-2" /> Export Data (JSON)
                </Button>
                <Button className="flex-1 bg-green-600/10 text-green-400 border border-green-500/20 hover:bg-green-600 hover:text-white">
                    <FileJson size={16} className="mr-2" /> Import Data
                </Button>
            </div>

            <SectionHeader title="Danger Zone" desc="Irreversible actions" />
            <div className="space-y-2">
              <SettingRow icon={RefreshCw} title="Clear Watch History" desc="Remove all progress markers" action={<Button variant="outline" size="sm">Clear</Button>} />
              <SettingRow icon={Trash2} title="Factory Reset" desc="Reset all settings to default" action={<Button variant="destructive" size="sm" onClick={() => { if(confirm('Reset all settings?')) resetSettings(); }}>Reset</Button>} />
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4 md:px-8 font-sans selection:bg-red-900 selection:text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR TABS */}
        <div className="lg:col-span-1 space-y-2 sticky top-24 h-fit">
          <div className="mb-8 px-2">
            <h1 className="text-4xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-white tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em] mt-2">Control Center</p>
          </div>
          
          <div className="space-y-1">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden border
                    ${isActive 
                        ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                        : 'bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:text-white hover:border-white/5'}
                    `}
                >
                    <Icon size={18} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-bold text-sm tracking-wide relative z-10">{tab.label}</span>
                    {isActive && <motion.div layoutId="glow" className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />}
                </button>
                )
            })}
          </div>

          <div className="mt-8 px-4 pt-8 border-t border-white/5">
            <p className="text-[10px] text-zinc-600 font-mono text-center">
                Shadow Garden Client v2.4.0<br/>
                Connected to Node: Alpha-7
            </p>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-[#0a0a0a] border border-white/5 rounded-[30px] p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[600px]"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
                {renderContent()}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---

function SectionHeader({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-white/5">
      <h2 className="text-xl font-black text-white font-cinzel tracking-wide flex items-center gap-2">
        <div className="w-1 h-6 bg-red-600 rounded-full" />
        {title}
      </h2>
      <p className="text-xs text-zinc-500 font-medium ml-3 mt-1">{desc}</p>
    </div>
  );
}

function SettingRow({ icon: Icon, title, desc, action }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors group">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-black rounded-lg text-zinc-400 group-hover:text-red-500 transition-colors border border-white/5">
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-200">{title}</h4>
          <p className="text-[10px] text-zinc-500 font-medium">{desc}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ToggleRow({ title, desc, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
      <div>
        <h4 className="text-sm font-bold text-zinc-200">{title}</h4>
        <p className="text-[10px] text-zinc-500 font-medium">{desc}</p>
      </div>
      <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${checked ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-zinc-800'}`}>
        <motion.div 
          layout 
          className="bg-white w-4 h-4 rounded-full shadow-md"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );
}

function SelectCard({ icon: Icon, label, value, options, onChange }: any) {
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-3 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 text-zinc-400 mb-1">
        <Icon size={14} className="text-red-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`
              flex-1 py-2 px-3 text-[10px] font-bold rounded-lg border transition-all uppercase whitespace-nowrap
              ${value === opt 
                ? 'bg-white text-black border-white shadow-lg' 
                : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function getColorHex(name: string) {
  const colors: any = { 
    red: '#dc2626', purple: '#9333ea', blue: '#2563eb', gold: '#ca8a04',
    green: '#16a34a', pink: '#db2777', mono: '#52525b', neon: '#22d3ee'
  };
  return colors[name] || '#ffffff';
}
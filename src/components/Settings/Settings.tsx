import React, { useState } from 'react';
import { 
  User, Play, Monitor, Shield, Database, 
  ChevronRight, RefreshCw, Trash2, LogOut, 
  Languages, Sparkles, Server, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, AppSettings } from '@/hooks/useSettings'; // Import the hook we just made
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Assuming you have shadcn switch, or standard input
import { toast } from 'sonner';

// --- TABS CONFIGURATION ---
const TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'player', label: 'Player', icon: Play },
  { id: 'appearance', label: 'Appearance', icon: Sparkles },
  { id: 'content', label: 'Content', icon: Languages },
  { id: 'data', label: 'Data', icon: Database },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const { settings, updateSetting, resetSettings } = useSettings();

  // Helper to trigger save toast
  const handleToggle = (key: keyof AppSettings, val: boolean) => {
    updateSetting(key, val);
    // toast.success(`Setting updated`); // Optional feedback
  };

  // --- RENDER CONTENT BASED ON TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <SectionHeader title="Profile" desc="Manage your Shadow Garden identity" />
            
            {/* Profile Card */}
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-black border-2 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]" />
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  value={settings.username}
                  onChange={(e) => updateSetting('username', e.target.value)}
                  className="w-full bg-transparent text-xl font-bold text-white border-none focus:outline-none focus:ring-0 p-0" 
                />
              </div>
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-900/20">
                Edit
              </Button>
            </div>

            <div className="grid gap-2">
              <SettingRow 
                icon={LogOut} 
                title="Log Out" 
                desc="Sign out of your account on this device"
                action={<Button variant="destructive" size="sm">Sign Out</Button>}
              />
            </div>
          </div>
        );

      case 'player':
        return (
          <div className="space-y-6">
            <SectionHeader title="Playback" desc="Customize your viewing experience" />
            
            <div className="space-y-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <ToggleRow 
                title="Auto-Play Next Episode" 
                desc="Automatically start the next episode when one finishes"
                checked={settings.autoPlay}
                onChange={(v) => handleToggle('autoPlay', v)}
              />
              <ToggleRow 
                title="Auto-Skip Intro" 
                desc="Skip opening songs automatically (if available)"
                checked={settings.autoSkipIntro}
                onChange={(v) => handleToggle('autoSkipIntro', v)}
              />
            </div>

            <SectionHeader title="Preferences" desc="Default streaming behavior" />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectCard 
                icon={Server}
                label="Default Server"
                value={settings.defaultServer}
                options={['hd-1', 'hd-2']}
                onChange={(v) => updateSetting('defaultServer', v as any)}
              />
              <SelectCard 
                icon={Monitor}
                label="Quality"
                value={settings.defaultQuality}
                options={['1080p', '720p', '360p']}
                onChange={(v) => updateSetting('defaultQuality', v as any)}
              />
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <SectionHeader title="Language & Titles" desc="How anime info is displayed" />
            
            <div className="space-y-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <ToggleRow 
                title="Use Japanese Titles" 
                desc="Display 'Kimetsu no Yaiba' instead of 'Demon Slayer'"
                checked={settings.useJapaneseTitle}
                onChange={(v) => handleToggle('useJapaneseTitle', v)}
              />
              <ToggleRow 
                title="Show NSFW Content" 
                desc="Allow 18+ content to appear in search and lists"
                checked={settings.showNSFW}
                onChange={(v) => handleToggle('showNSFW', v)}
              />
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <SectionHeader title="Theme" desc="Customize the interface look" />
            
            <div className="grid grid-cols-4 gap-4">
              {['red', 'purple', 'blue', 'gold'].map((color) => (
                <button
                  key={color}
                  onClick={() => updateSetting('accentColor', color as any)}
                  className={`
                    h-12 rounded-lg border-2 transition-all flex items-center justify-center relative overflow-hidden
                    ${settings.accentColor === color ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}
                  `}
                  style={{ backgroundColor: `var(--color-${color}-600, ${getColorHex(color)})` }}
                >
                  {settings.accentColor === color && <Sparkles className="w-4 h-4 text-white animate-pulse" />}
                </button>
              ))}
            </div>

            <SectionHeader title="Layout" desc="Density of anime cards" />
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              {['default', 'compact'].map((variant) => (
                <button
                  key={variant}
                  onClick={() => updateSetting('cardVariant', variant as any)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all capitalize ${
                    settings.cardVariant === variant ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <SectionHeader title="Storage" desc="Manage your local data" />
            
            <div className="space-y-2">
              <SettingRow 
                icon={RefreshCw} 
                title="Clear Watch History" 
                desc="Remove all progress markers from episodes"
                action={<Button variant="outline" size="sm">Clear</Button>}
              />
              <SettingRow 
                icon={Trash2} 
                title="Factory Reset" 
                desc="Reset all settings to default"
                action={
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      if(confirm('Are you sure?')) {
                        resetSettings();
                        toast.success("Settings reset to default");
                      }
                    }}
                  >
                    Reset
                  </Button>
                }
              />
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* SIDEBAR TABS */}
        <div className="md:col-span-1 space-y-2">
          <h1 className="text-3xl font-black mb-6 px-2 font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">
            Settings
          </h1>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                  ${isActive ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                {isActive && (
                  <motion.div layoutId="active-pill" className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
            
            {renderContent()}
          </motion.div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

function SectionHeader({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}

function SettingRow({ icon: Icon, title, desc, action }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-black rounded-lg text-gray-400">
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <p className="text-[10px] text-gray-400">{desc}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ToggleRow({ title, desc, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
      <div>
        <h4 className="text-sm font-bold text-gray-200">{title}</h4>
        <p className="text-[10px] text-gray-500">{desc}</p>
      </div>
      {/* Custom Switch using raw HTML/CSS if Shadcn switch is missing, else use <Switch /> */}
      <div 
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? 'bg-red-600' : 'bg-gray-700'}`}
      >
        <motion.div 
          layout 
          className="bg-white w-4 h-4 rounded-full shadow-md"
          animate={{ x: checked ? 20 : 0 }}
        />
      </div>
    </div>
  );
}

function SelectCard({ icon: Icon, label, value, options, onChange }: any) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon size={14} />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`
              flex-1 py-2 text-xs font-bold rounded border transition-all uppercase
              ${value === opt ? 'bg-red-600 border-red-600 text-white' : 'border-white/20 text-gray-500 hover:border-white/40'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// Fallback colors for accent picker
function getColorHex(name: string) {
  const colors: any = { red: '#dc2626', purple: '#9333ea', blue: '#2563eb', gold: '#ca8a04' };
  return colors[name];
}
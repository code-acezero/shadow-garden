"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Shield, Zap, Sliders, Play, RotateCcw, 
  ExternalLink, CheckCircle2, AlertTriangle, Radio, 
  Layers, Bell, Globe, Save, Loader2, Info, Eye, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { adManager, AdsConfig, DEFAULT_ADS_CONFIG } from '@/lib/adManager';

interface AdsMonetizationPanelProps {
  onNotify?: (title: string, message: string, type: 'success' | 'error' | 'system') => void;
}

export default function AdsMonetizationPanel({ onNotify }: AdsMonetizationPanelProps) {
  const [config, setConfig] = useState<AdsConfig>(adManager.getConfig());
  const [loading, setLoading] = useState(false);
  const [remainingCooldown, setRemainingCooldown] = useState(0);

  // Revenue Estimator State
  const [estVisitors, setEstVisitors] = useState(5000);
  const [trafficTier, setTrafficTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier2');

  useEffect(() => {
    // Initial load and sync
    setConfig(adManager.getConfig());
    adManager.syncFromDatabase().then((synced) => setConfig(synced));

    const interval = setInterval(() => {
      setRemainingCooldown(adManager.getRemainingCooldown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = <K extends keyof AdsConfig>(key: K, value: AdsConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const success = await adManager.saveConfig(config);
    setLoading(false);
    if (success) {
      onNotify?.("Monetization Saved", "Adsterra and ad configurations updated across the realm", "success");
    } else {
      onNotify?.("Save Failed", "Failed to update configuration in database", "error");
    }
  };

  const handleTestSmartlink = () => {
    adManager.resetCooldowns();
    const opened = adManager.triggerSmartlink('admin_test');
    if (opened) {
      onNotify?.("Smartlink Opened", "Opened in background tab. Cooldown timer started.", "success");
    } else {
      onNotify?.("Trigger Blocked", "Popup might be blocked by browser or exempt.", "error");
    }
    setRemainingCooldown(adManager.getRemainingCooldown());
  };

  const handleResetCooldown = () => {
    adManager.resetCooldowns();
    setRemainingCooldown(0);
    onNotify?.("Cooldown Reset", "Local browser ad cooldown has been reset to 0.", "system");
  };

  // Calculations for Revenue Estimator (Adsterra Global Rates)
  // Tier 1 (US/UK/CA/AU): CPM ~$5-12; Tier 2 (EU/SEA/BR): CPM ~$2-4; Tier 3 (Global): CPM ~$0.8-1.5
  const cpmMultiplier = trafficTier === 'tier1' ? 7.5 : trafficTier === 'tier2' ? 3.0 : 1.2;
  
  // Video streams: Average anime viewer watches 1.8 episodes per visit
  // With 2 ads per episode (First Play + Mid-roll), plus episode switches (~0.8 per visit)
  const episodesPerVisitor = 1.8;
  const videoAdsPerEpisode = (config.smartlinkOnFirstPlay ? 1 : 0) + (config.smartlinkOnMidRoll ? 1 : 0);
  const videoAdImpressions = estVisitors * episodesPerVisitor * videoAdsPerEpisode;
  const epSwitchImpressions = config.smartlinkOnEpisodeClick ? estVisitors * 0.8 : 0;
  const downloadImpressions = config.smartlinkOnDownload ? estVisitors * 0.35 : 0;

  const totalSmartlinkImpressions = (videoAdImpressions + epSwitchImpressions + downloadImpressions);
  // Smartlink direct links command high Adsterra eCPM (~1.5x of standard tier)
  const smartlinkMonthly = ((totalSmartlinkImpressions * cpmMultiplier * 1.4) / 1000) * 30;
  const socialBarMonthly = config.socialBarEnabled ? ((estVisitors * (cpmMultiplier * 0.7)) / 1000) * 30 : 0;
  const bannerMonthly = config.nativeBannerEnabled ? ((estVisitors * 2.5 * (cpmMultiplier * 0.35)) / 1000) * 30 : 0;
  const totalMonthly = smartlinkMonthly + socialBarMonthly + bannerMonthly;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-950/40 via-zinc-900/40 to-black/60 border border-white/10 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white font-lemon tracking-wide">
                  ADSTERRA MONETIZATION
                </h2>
                <Badge className={config.enabled ? "bg-emerald-600/80 text-white border-emerald-500" : "bg-zinc-800 text-zinc-400 border-white/10"}>
                  {config.enabled ? "ACTIVE" : "PAUSED"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Manage Anti-AdBlock links, Social Bar, Smartlink frequency capping, and placements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2 rounded-2xl">
            <span className="text-xs font-bold text-zinc-300">Master Switch</span>
            <Switch 
              checked={config.enabled} 
              onCheckedChange={(val) => handleChange('enabled', val)}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl px-6 h-11 gap-2 shadow-lg shadow-emerald-900/30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            <span>Save Settings</span>
          </Button>
        </div>
      </div>

      {/* Grid: Credentials & Unit Identifiers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Globe className="text-primary-500" size={18} /> Adsterra Credentials &amp; Anti-Adblock Scripts
            </h3>

            {/* 1. Smartlink */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <Zap size={14} className="text-amber-400" /> 1. Smartlink / Anti-Adblock Direct Link
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">High eCPM</span>
              </label>
              <Input
                value={config.smartlinkUrl}
                onChange={(e) => handleChange('smartlinkUrl', e.target.value)}
                placeholder="https://divinglibrary.com/xp6sjxn0?key=..."
                className="bg-black/40 border-white/10 rounded-2xl text-xs font-mono text-emerald-400"
              />
              <p className="text-[10px] text-zinc-500">
                Triggered on high-converting actions (first episode play, mid-roll break, episode switch tile, downloads). Opens in background tab.
              </p>
            </div>

            {/* 2. Native Banner Script */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <Radio size={14} className="text-primary-400" /> 2. Native Banner Script (invoke.js)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">In-Page Display</span>
              </label>
              <Input
                value={config.nativeBannerScriptUrl}
                onChange={(e) => handleChange('nativeBannerScriptUrl', e.target.value)}
                placeholder="https://divinglibrary.com/.../invoke.js"
                className="bg-black/40 border-white/10 rounded-2xl text-xs font-mono text-primary-300"
              />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-zinc-400 font-mono shrink-0">Container ID:</span>
                <Input
                  value={config.nativeBannerUnitId}
                  onChange={(e) => handleChange('nativeBannerUnitId', e.target.value)}
                  placeholder="d0b85e11abfe70f8bf477f8ec122a128"
                  className="bg-black/30 border-white/5 rounded-xl text-[11px] font-mono text-zinc-300 h-7 px-2.5"
                />
              </div>
            </div>

            {/* 3. Social Bar Script */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <Bell size={14} className="text-teal-400" /> 3. Social Bar Script (In-Page Push)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Floating Push</span>
              </label>
              <Input
                value={config.socialBarScriptUrl}
                onChange={(e) => handleChange('socialBarScriptUrl', e.target.value)}
                placeholder="https://divinglibrary.com/c3/9b/d7/....js"
                className="bg-black/40 border-white/10 rounded-2xl text-xs font-mono text-teal-300"
              />
              <p className="text-[10px] text-zinc-500">
                Injected with a non-intrusive 15s delay to protect user experience and page speed.
              </p>
            </div>

            {/* 4. Popunder Script */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400 font-bold tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <ExternalLink size={14} className="text-rose-400" /> 4. Popunder Script (Under-Tab Click)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">On Click</span>
              </label>
              <Input
                value={config.popunderScriptUrl}
                onChange={(e) => handleChange('popunderScriptUrl', e.target.value)}
                placeholder="https://divinglibrary.com/70/10/05/....js"
                className="bg-black/40 border-white/10 rounded-2xl text-xs font-mono text-rose-300"
              />
              <p className="text-[10px] text-zinc-500">
                Adsterra click-handler popunder script. Kept disabled by default to maintain clean experience.
              </p>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Domain ID</span>
                <Input
                  value={config.domainId}
                  onChange={(e) => handleChange('domainId', e.target.value)}
                  className="bg-transparent border-0 p-0 text-xs font-mono text-white h-auto"
                />
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Popunder Unit</span>
                <Input
                  value={config.popunderUnitId}
                  onChange={(e) => handleChange('popunderUnitId', e.target.value)}
                  className="bg-transparent border-0 p-0 text-xs font-mono text-white h-auto"
                />
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Native Banner Unit</span>
                <Input
                  value={config.nativeBannerUnitId}
                  onChange={(e) => handleChange('nativeBannerUnitId', e.target.value)}
                  className="bg-transparent border-0 p-0 text-xs font-mono text-white h-auto"
                />
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Social Bar Unit</span>
                <Input
                  value={config.socialBarUnitId}
                  onChange={(e) => handleChange('socialBarUnitId', e.target.value)}
                  className="bg-transparent border-0 p-0 text-xs font-mono text-white h-auto"
                />
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Smartlink Unit</span>
                <Input
                  value={config.smartlinkUnitId}
                  onChange={(e) => handleChange('smartlinkUnitId', e.target.value)}
                  className="bg-transparent border-0 p-0 text-xs font-mono text-white h-auto"
                />
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Network</span>
                <span className="text-xs font-bold text-emerald-400 block pt-0.5">Adsterra Global</span>
              </div>
            </div>
          </div>

          {/* Smartlink Frequency & Experience Control */}
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="text-emerald-400" size={18} /> Smartlink Experience &amp; Cooldown
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">Smartlink on Downloads</h4>
                  <p className="text-[10px] text-zinc-500">Trigger direct link when user reveals download links or downloads an episode.</p>
                </div>
                <Switch 
                  checked={config.smartlinkOnDownload} 
                  onCheckedChange={(v) => handleChange('smartlinkOnDownload', v)} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {/* Cooldown Slider */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">User Cooldown Timer</h4>
                    <p className="text-[10px] text-zinc-500">A user will see at most 1 smartlink per this interval.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                    {config.smartlinkCooldownMinutes} minutes
                  </span>
                </div>
                <Slider
                  min={5}
                  max={120}
                  step={5}
                  value={[config.smartlinkCooldownMinutes]}
                  onValueChange={(val) => handleChange('smartlinkCooldownMinutes', val[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                  <span>5 mins (Aggressive)</span>
                  <span>20 mins (Balanced)</span>
                  <span>60+ mins (Gentle)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-white">VIP &amp; Moderator Exemption</h4>
                  <p className="text-[10px] text-zinc-500">Admins, Moderators, Donators and VIP role holders see 0 ads.</p>
                </div>
                <Switch 
                  checked={config.vipExempt} 
                  onCheckedChange={(v) => handleChange('vipExempt', v)} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Episode Video Ads (2 Ads / Episode + Episode Switch) */}
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Play className="text-primary-500" size={18} /> Episode &amp; Video Monetization (2 Ads / Ep)
              </h3>
              <Badge className="bg-primary-950/60 text-primary-400 border border-primary-500/30 text-[10px]">
                High Revenue
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Trigger 1: First Play */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-600/30 border border-primary-500/40 text-[10px] font-mono font-bold text-primary-300 flex items-center justify-center">1</span>
                    <h4 className="text-xs font-bold text-white">First Play Trigger</h4>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Fires Adsterra Smartlink in a background tab on the initial episode play click. Capped to 1 per episode.
                  </p>
                </div>
                <Switch 
                  checked={config.smartlinkOnFirstPlay} 
                  onCheckedChange={(v) => handleChange('smartlinkOnFirstPlay', v)} 
                  className="data-[state=checked]:bg-primary-600"
                />
              </div>

              {/* Trigger 2: Mid-Roll */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-600/30 border border-primary-500/40 text-[10px] font-mono font-bold text-primary-300 flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-white">Mid-Roll Intermission (Middle Part)</h4>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Pauses playback after the middle part with a sleek glassmorphic intermission prompt. Resumes immediately on click.
                  </p>
                </div>
                <Switch 
                  checked={config.smartlinkOnMidRoll} 
                  onCheckedChange={(v) => handleChange('smartlinkOnMidRoll', v)} 
                  className="data-[state=checked]:bg-primary-600"
                />
              </div>

              {/* Mid-Roll Percent Slider */}
              {config.smartlinkOnMidRoll && (
                <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Mid-Roll Timing</h4>
                      <p className="text-[10px] text-zinc-500">Trigger at this percentage of the episode duration.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary-400 bg-primary-950/40 px-3 py-1 rounded-full border border-primary-500/30">
                      {config.midRollPercent || 50}% duration
                    </span>
                  </div>
                  <Slider
                    min={30}
                    max={70}
                    step={5}
                    value={[config.midRollPercent || 50]}
                    onValueChange={(val) => handleChange('midRollPercent', val[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                    <span>30% (Early)</span>
                    <span>50% (Exact Middle)</span>
                    <span>70% (Late)</span>
                  </div>
                </div>
              )}

              {/* Trigger 3: Episode Tile Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 flex items-center justify-center">3</span>
                    <h4 className="text-xs font-bold text-white">Episode Tile Switch Ad</h4>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Fires direct link in background tab when user clicks an episode tile to switch episodes or anime.
                  </p>
                </div>
                <Switch 
                  checked={config.smartlinkOnEpisodeClick} 
                  onCheckedChange={(v) => handleChange('smartlinkOnEpisodeClick', v)} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {/* Episode Switch Debounce Slider */}
              {config.smartlinkOnEpisodeClick && (
                <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Episode Switch Debounce</h4>
                      <p className="text-[10px] text-zinc-500">Minimum seconds required between tile click ads to prevent spam.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                      {config.episodeSwitchCooldownSeconds || 30}s debounce
                    </span>
                  </div>
                  <Slider
                    min={10}
                    max={120}
                    step={10}
                    value={[config.episodeSwitchCooldownSeconds || 30]}
                    onValueChange={(val) => handleChange('episodeSwitchCooldownSeconds', val[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                    <span>10s (High Monetization)</span>
                    <span>30s (Recommended)</span>
                    <span>60s+ (Relaxed)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Placements, Social Bar & Live Test */}
        <div className="lg:col-span-5 space-y-6">
          {/* Placements Card */}
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] space-y-5">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="text-primary-500" size={18} /> Ad Unit Placements
            </h3>

            {/* Social Bar */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Social Bar (In-Page Push)</h4>
                  <p className="text-[10px] text-zinc-500">Floating notification banner with high CTR.</p>
                </div>
                <Switch 
                  checked={config.socialBarEnabled} 
                  onCheckedChange={(v) => handleChange('socialBarEnabled', v)} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              {config.socialBarEnabled && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">Delay before displaying:</span>
                  <span className="text-xs font-mono font-bold text-teal-400">{config.socialBarDelaySeconds}s delay</span>
                </div>
              )}
            </div>

            {/* Native Banner Placements */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Native Banners</h4>
                  <p className="text-[10px] text-zinc-500">Integrated dark glassmorphic cards.</p>
                </div>
                <Switch 
                  checked={config.nativeBannerEnabled} 
                  onCheckedChange={(v) => handleChange('nativeBannerEnabled', v)} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {config.nativeBannerEnabled && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Below Video Player (Watch Page)</span>
                    <Switch 
                      checked={config.showOnWatchPage} 
                      onCheckedChange={(v) => handleChange('showOnWatchPage', v)} 
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Download Gateway Page</span>
                    <Switch 
                      checked={config.showOnDownloadPage} 
                      onCheckedChange={(v) => handleChange('showOnDownloadPage', v)} 
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">OtakuVerse Community</span>
                    <Switch 
                      checked={config.showOnOtakuVerse} 
                      onCheckedChange={(v) => handleChange('showOnOtakuVerse', v)} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Popunder (Capped) */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Popunder (On Click)</h4>
                  <p className="text-[10px] text-zinc-500">Highest revenue, but potentially disruptive.</p>
                </div>
                <Switch 
                  checked={config.popunderEnabled} 
                  onCheckedChange={(v) => handleChange('popunderEnabled', v)} 
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              {config.popunderEnabled && (
                <div className="text-[10px] text-amber-400/90 bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>Strictly capped at max 1 popunder per 12 hours per visitor.</span>
                </div>
              )}
            </div>
          </div>

          {/* Testing Console */}
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Play className="text-emerald-400" size={18} /> Testing &amp; Diagnostics
            </h3>

            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Browser Cooldown:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {remainingCooldown > 0 ? `${remainingCooldown}s remaining` : 'Ready to trigger'}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleTestSmartlink} 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold h-9 gap-1.5"
                >
                  <ExternalLink size={12} /> Test Smartlink
                </Button>
                <Button 
                  onClick={handleResetCooldown} 
                  variant="ghost" 
                  className="bg-black/40 hover:bg-white/5 text-zinc-300 rounded-xl text-xs font-bold h-9 gap-1.5"
                >
                  <RotateCcw size={12} /> Reset Cooldown
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Estimator Calculator */}
      <div className="bg-zinc-900/30 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-emerald-400" size={20} /> Revenue Potential Calculator
            </h3>
            <p className="text-xs text-zinc-400">
              Estimated Adsterra earnings based on your current unit setup and traffic distribution.
            </p>
          </div>

          {/* Traffic Tier Tabs */}
          <div className="flex items-center bg-black/50 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setTrafficTier('tier1')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                trafficTier === 'tier1' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tier 1 (US/UK/CA)
            </button>
            <button
              onClick={() => setTrafficTier('tier2')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                trafficTier === 'tier2' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tier 2 (Europe/Global)
            </button>
            <button
              onClick={() => setTrafficTier('tier3')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                trafficTier === 'tier3' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tier 3 (Asia/LatAm)
            </button>
          </div>
        </div>

        {/* Slider for Daily Visitors */}
        <div className="space-y-3 bg-black/30 p-5 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider">Estimated Daily Visitors:</span>
            <span className="text-base font-mono font-black text-white">{estVisitors.toLocaleString()} visitors/day</span>
          </div>
          <Slider
            min={500}
            max={50000}
            step={500}
            value={[estVisitors]}
            onValueChange={(v) => setEstVisitors(v[0])}
            className="w-full"
          />
        </div>

        {/* Projection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Smartlink Revenue</span>
            <p className="text-xl font-black text-emerald-400 font-mono">
              ${smartlinkMonthly.toFixed(0)} <span className="text-[10px] text-zinc-500 font-sans font-normal">/mo</span>
            </p>
            <p className="text-[10px] text-zinc-400">High-converting download clicks</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Social Bar Revenue</span>
            <p className="text-xl font-black text-teal-400 font-mono">
              ${socialBarMonthly.toFixed(0)} <span className="text-[10px] text-zinc-500 font-sans font-normal">/mo</span>
            </p>
            <p className="text-[10px] text-zinc-400">Passive in-page push alerts</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Native Banner Revenue</span>
            <p className="text-xl font-black text-amber-400 font-mono">
              ${bannerMonthly.toFixed(0)} <span className="text-[10px] text-zinc-500 font-sans font-normal">/mo</span>
            </p>
            <p className="text-[10px] text-zinc-400">Watch &amp; Gateway card slots</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-black/60 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">Total Estimated Earnings</span>
            <p className="text-2xl font-black text-white font-mono">
              ${totalMonthly.toFixed(0)} <span className="text-xs text-emerald-400 font-sans font-normal">/month</span>
            </p>
            <p className="text-[10px] text-zinc-400">~${(totalMonthly / 30).toFixed(2)}/day</p>
          </div>
        </div>
      </div>
    </div>
  );
}

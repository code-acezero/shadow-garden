"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShortsCategoryTab } from '@/lib/shorts/types';
import { ATRAX_CAPSULE_SPRING, atraxChipTapVariants } from '@/lib/atraxMotion';
import { Flame, Sparkles, Languages, Shield, LockOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortsCategoryBarProps {
  activeTab: ShortsCategoryTab;
  onChangeTab: (tab: ShortsCategoryTab) => void;
  isLoading?: boolean;
}

const TABS: { id: ShortsCategoryTab; label: string; icon: any; countBadge?: string }[] = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'hindi', label: 'Hindi Dubbed', icon: Languages, countBadge: '🇮🇳 Hot' },
  { id: 'english', label: 'English Dub', icon: Sparkles, countBadge: '🇺🇸 West' },
  { id: 'western_ceo', label: 'CEO & Werewolf', icon: Shield },
  { id: 'unlocked_67k', label: '67k+ Unlocked', icon: LockOpen, countBadge: 'Free' },
];

export default function ShortsCategoryBar({
  activeTab,
  onChangeTab,
  isLoading = false
}: ShortsCategoryBarProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2.5 min-w-max px-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              variants={atraxChipTapVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              disabled={isLoading}
              onClick={() => onChangeTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 select-none border",
                isActive
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                  : "bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/20 hover:bg-slate-850"
              )}
            >
              {/* Active animated pill background */}
              {isActive && (
                <motion.div
                  layoutId="activeShortsTab"
                  transition={ATRAX_CAPSULE_SPRING}
                  className="absolute inset-0 rounded-full bg-primary -z-10"
                />
              )}

              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-400")} />
              <span>{tab.label}</span>

              {tab.countBadge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-primary"
                  )}
                >
                  {tab.countBadge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

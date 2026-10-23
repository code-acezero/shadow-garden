"use client";

import React from 'react';
import { ShortsCategoryTab } from '@/lib/shorts/types';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ShortsNavTab = ShortsCategoryTab | 'saved';

interface ShortsCategoryBarProps {
  activeTab: ShortsNavTab;
  onChangeTab: (tab: ShortsNavTab) => void;
  isLoading?: boolean;
  savedCount?: number;
  rightAction?: React.ReactNode;
}

const TABS: { id: ShortsNavTab; label: string }[] = [
  { id: 'trending', label: 'All' },
  { id: 'hindi', label: 'Hindi Dub' },
  { id: 'english', label: 'English Dub' },
  { id: 'western_ceo', label: 'Romance' },
  { id: 'unlocked_67k', label: 'Unlocked' },
  { id: 'saved', label: 'Watchlist' },
];

export default function ShortsCategoryBar({
  activeTab,
  onChangeTab,
  isLoading = false,
  savedCount = 0,
  rightAction
}: ShortsCategoryBarProps) {
  const activeTabObj = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="sticky top-[52px] sm:top-[56px] z-30 bg-[#0a0a0a]/85 backdrop-blur-md py-2 -mx-2 sm:-mx-4 px-2 sm:px-4 border-b border-white/5 mb-3 transition-all">
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Desktop / Tablet: Static Non-Scrollable Inline Pills Row (No Arrows) */}
        <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                disabled={isLoading}
                onClick={() => onChangeTab(tab.id)}
                className={cn(
                  "relative shrink-0 flex items-center px-3.5 py-1.5 rounded-full text-xs transition-all select-none whitespace-nowrap active:scale-95",
                  isActive
                    ? "bg-white/10 text-white font-medium border border-white/15 backdrop-blur-sm shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium border border-transparent"
                )}
              >
                <span>{tab.label}</span>

                {tab.id === 'saved' && savedCount > 0 && (
                  <span
                    className={cn(
                      "text-[10px] ml-1.5 font-normal",
                      isActive ? "text-zinc-300" : "text-zinc-500"
                    )}
                  >
                    ({savedCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile: Single Button Dropdown Menu */}
        <div className="sm:hidden flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isLoading}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium border border-white/15 backdrop-blur-sm active:scale-95 transition-all"
              >
                <span>{activeTabObj.label}</span>
                {activeTabObj.id === 'saved' && savedCount > 0 && (
                  <span className="text-zinc-400 font-normal">({savedCount})</span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 text-zinc-200 rounded-2xl p-1.5 shadow-2xl min-w-[150px] z-[100]"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => onChangeTab(tab.id)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors",
                      isActive
                        ? "bg-white/15 text-white font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.id === 'saved' && savedCount > 0 && (
                      <span className="text-[10px] text-zinc-400">({savedCount})</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Action Slot (e.g. Search) */}
        {rightAction && (
          <div className="shrink-0 flex items-center gap-2">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  );
}

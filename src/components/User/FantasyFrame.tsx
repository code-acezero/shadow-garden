"use client";

import React, { useId, useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import {
  getAtelierFrame,
  generateShowcaseFrameSvg,
  generateSpecialFrameSvg,
  ATELIER_GLOBAL_DEFS_SVG,
  ATELIER_GLOBAL_CSS,
} from '@/lib/atelierFrames';

// ─── Frame Tier Config ────────────────────────────────────────────────────────
export const FRAME_TIERS = {
  none:             { tier: 0,  name: 'No Frame',            label: 'Free',      stars: 0 },
  iron:             { tier: 1,  name: 'Iron Seal',           label: 'Common',    stars: 1 },
  bronze:           { tier: 2,  name: 'Bronze Crest',        label: 'Uncommon',  stars: 1 },
  silver:           { tier: 3,  name: 'Silver Knight',       label: 'Uncommon',  stars: 2 },
  crimson:          { tier: 4,  name: 'Crimson Blade',       label: 'Rare',      stars: 3 },
  sapphire:         { tier: 5,  name: 'Sapphire Arc',        label: 'Rare',      stars: 3 },
  emerald:          { tier: 6,  name: 'Emerald Wilds',       label: 'Epic',      stars: 4 },
  golden:           { tier: 7,  name: 'Golden Realm',        label: 'Epic',      stars: 4 },
  shadow:           { tier: 8,  name: 'Shadow Void',         label: 'Legendary', stars: 5 },
  celestial:        { tier: 9,  name: 'Celestial Rift',      label: 'Legendary', stars: 5 },
  divine:           { tier: 10, name: 'Divine Archon',       label: 'Mythic',    stars: 5 },
  admin:            { tier: 11, name: 'The Eternal',         label: 'Exclusive', stars: 5 },
  moderator:        { tier: 12, name: 'The Warden',          label: 'Exclusive', stars: 5 },
  // Mana / Coin Store Frames (Anikoto & Anime Inspirations)

  // Supreme Godly Tier (3,000 - 5,000 Coins)
  shadow_sovereign_supreme: { tier: 10, name: 'Shadow Sovereign Omnipotence', label: 'Supreme', stars: 5 },
  celestia_divine_throne:   { tier: 10, name: 'Throne of Heavenly Principles', label: 'Supreme', stars: 5 },
  infinite_tsukuyomi:       { tier: 10, name: 'Infinite Tsukuyomi Red Moon',   label: 'Supreme', stars: 5 },
  primordial_dragon:        { tier: 10, name: 'Genesis Star Dragon',           label: 'Supreme', stars: 5, special: 'genesis_dragon' },
  god_hand_eclipse:         { tier: 10, name: 'Eclipse of the God Hand',       label: 'Supreme', stars: 5 },
  celestial_emperor:        { tier: 10, name: 'Emperor of Infinite Cosmos',    label: 'Supreme', stars: 5 },
  bleach_mugetsu:           { tier: 9,  name: 'Final Getsuga Tensho Mugetsu',  label: 'Mythic',  stars: 5 },
  solo_shadow_arise:        { tier: 9,  name: 'Igris Blood-Red Knight',        label: 'Mythic',  stars: 5 },
  // Cute & Kawaii Tier (150 - 450 Coins)
  strawberry_bunny:         { tier: 8,  name: 'Strawberry Bunny Ears',         label: 'Cute',    stars: 3, special: 'cute_accents' },
  cute_neko_paws:           { tier: 8,  name: 'Neko Kawaii Whiskers',          label: 'Cute',    stars: 3, special: 'cute_accents' },
  sakura_bloom:             { tier: 8,  name: 'Cherry Blossom Spirit',        label: 'Cute',    stars: 3, special: 'cute_accents' },
  pastel_dream:             { tier: 8,  name: 'Cotton Candy Dream',            label: 'Cute',    stars: 3, special: 'cute_accents' },
  slime_bouncy:             { tier: 8,  name: 'Bouncy Slime Companion',        label: 'Cute',    stars: 2, special: 'cute_accents' },
  chibi_boba_milk_tea:      { tier: 8,  name: 'Boba Milk Tea Chibi',           label: 'Cute',    stars: 3, special: 'cute_accents' },
  kawaii_ghost_boo:         { tier: 8,  name: 'Spooky Cute Ghost',             label: 'Cute',    stars: 3, special: 'cute_accents' },
  magic_star_wand:          { tier: 8,  name: 'Mahou Shoujo Star Wand',        label: 'Cute',    stars: 4, special: 'cute_accents' },
  starlight_kitsune:        { tier: 8,  name: 'Baby Kitsune Fox Ears',         label: 'Cute',    stars: 4, special: 'cute_accents' },
  fluffy_hamster_bread:     { tier: 8,  name: 'Pecan Hamster Bakery',          label: 'Cute',    stars: 2, special: 'cute_accents' },
  sleepy_cloud_moon:        { tier: 8,  name: 'Sleepy Cloud & Moon',           label: 'Cute',    stars: 3, special: 'cute_accents' },

  magic_circle:     { tier: 8,  name: 'Arcane Runic Circle', label: 'Store',     stars: 5 , special: 'tesla_arcs'},
  cosmic_ring:      { tier: 8,  name: 'Celestial Supernova', label: 'Store',     stars: 5 , special: 'supreme'},
  shadow_monarch:   { tier: 9,  name: 'Shadow Monarch',     label: 'Store',     stars: 5 , special: 'tesla_arcs'},
  super_saiyan:     { tier: 9,  name: 'Super Saiyan Aura',  label: 'Store',     stars: 5 , special: 'saiyan_ki'},
  domain_expansion: { tier: 10, name: 'Malevolent Shrine',  label: 'Store',     stars: 5 , special: 'curse_slashes'},
  bankai_ice:       { tier: 9,  name: 'Bankai Daiguren',    label: 'Store',     stars: 5 , special: 'frost_blizzard'},
  cyber_matrix:     { tier: 8,  name: 'Cyberpunk Neon',     label: 'Store',     stars: 4 },
  sun_breathing:    { tier: 9,  name: 'Hinokami Kagura',    label: 'Store',     stars: 5 , special: 'hinokami_kagura'},
  susanoo:          { tier: 10, name: 'Susanoo Flame',      label: 'Store',     stars: 5 , special: 'susanoo_spirit'},
  rinnegan:         { tier: 10, name: 'Six Paths Rinnegan', label: 'Store',     stars: 5 , special: 'truth_seeker_orbs'},
  phoenix_blaze:    { tier: 8,  name: "Phoenix Rebirth Flame", label: 'Store', stars: 5 , special: 'phoenix_blaze'},
  blood_moon: { tier: 8, name: "Blood Moon Eclipse", label: 'Store', stars: 5 },
  frost_nova: { tier: 8, name: "Glacial Frost Nova", label: 'Store', stars: 5 , special: 'frost_blizzard'},
  abyssal_kraken: { tier: 8, name: "Abyssal Void Depth", label: 'Store', stars: 5 },
  storm_bringer: { tier: 8, name: "Tempest Thunder Gale", label: 'Store', stars: 5 , special: 'tesla_arcs'},
  celestial_starlight: { tier: 8, name: "Astral Starlight Crown", label: 'Store', stars: 5 },
  solar_flare: { tier: 8, name: "Solar Corona Flare", label: 'Store', stars: 5 },
  radiant_angel: { tier: 8, name: "Seraphic Angelic Wings", label: 'Store', stars: 5 , special: 'divine_rays'},
  demon_lord: { tier: 8, name: "Abyssal Demon Crest", label: 'Store', stars: 5 },
  valkyrie: { tier: 8, name: "Valkyrie Einherjar Aura", label: 'Store', stars: 5 },
  chaos_singularity: { tier: 8, name: "Dark Matter Singularity", label: 'Store', stars: 5 },
  genshin_pyro: { tier: 8, name: "Vision: Blazing Agate", label: 'Store', stars: 5 },
  genshin_hydro: { tier: 8, name: "Vision: Ocean Pearl", label: 'Store', stars: 5 },
  genshin_anemo: { tier: 8, name: "Vision: Vayuda Windward", label: 'Store', stars: 5 },
  genshin_electro: { tier: 8, name: "Vision: Vajrada Thunder", label: 'Store', stars: 5 , special: 'tesla_arcs'},
  genshin_dendro: { tier: 8, name: "Vision: Nagadus Emerald", label: 'Store', stars: 5 },
  genshin_cryo: { tier: 8, name: "Vision: Shivada Glacial", label: 'Store', stars: 5 , special: 'frost_blizzard'},
  genshin_geo: { tier: 8, name: "Vision: Prithiva Pillar", label: 'Store', stars: 5 },
  celestia_pillar: { tier: 8, name: "Celestia Pillar of Gods", label: 'Store', stars: 5 },
  raiden_shogun: { tier: 8, name: "Musou no Hitotachi", label: 'Store', stars: 5 , special: 'raiden_storm'},
  zhongli_shield: { tier: 8, name: "Jade Shield Dominance", label: 'Store', stars: 5 },
  hsr_astral: { tier: 8, name: "Astral Express Warp Track", label: 'Store', stars: 5 },
  hsr_acheron: { tier: 8, name: "Nihility Rain Blossom", label: 'Store', stars: 5 , special: 'nihility_petals'},
  hsr_danheng: { tier: 8, name: "Imbibitor Lunae Dragon", label: 'Store', stars: 5 },
  hsr_jingyuan: { tier: 8, name: "Lightning-Lord Sovereign", label: 'Store', stars: 5 , special: 'divine_rays'},
  hsr_firefly: { tier: 8, name: "SAM Armor Ignition Core", label: 'Store', stars: 5 , special: 'fire_aura'},
  hsr_kafka: { tier: 8, name: "Spirit Whisper Web", label: 'Store', stars: 5 },
  hsr_blackswan: { tier: 8, name: "Tarot Fable of Stars", label: 'Store', stars: 5 },
  hsr_sunday: { tier: 8, name: "Harmonic Order Cage", label: 'Store', stars: 5 },
  hsr_blade: { tier: 8, name: "Hellscape Shiku Petals", label: 'Store', stars: 5 },
  hsr_stellaron: { tier: 8, name: "Cancer of All Worlds", label: 'Store', stars: 5 , special: 'stellaron_shock'},
  fgo_excalibur: { tier: 8, name: "Excalibur Holy Radiance", label: 'Store', stars: 5 },
  fgo_morgan: { tier: 8, name: "Excalibur Morgan Corrupted", label: 'Store', stars: 5 },
  fgo_babylon: { tier: 8, name: "Gate of Babylon Treasury", label: 'Store', stars: 5 , special: 'divine_rays'},
  fgo_ubw: { tier: 8, name: "Unlimited Blade Works", label: 'Store', stars: 5 },
  fgo_ea: { tier: 8, name: "Enuma Elish Star of End", label: 'Store', stars: 5 , special: 'tesla_arcs'},
  fgo_camelot: { tier: 8, name: "Lord Camelot Pure Wall", label: 'Store', stars: 5 },
  fgo_merlin: { tier: 8, name: "Garden of Avalon Paradise", label: 'Store', stars: 5 },
  fgo_rhongomyniad: { tier: 8, name: "Rhongomyniad World Lance", label: 'Store', stars: 5 },
  fgo_tiamat: { tier: 8, name: "Sea of Life Chaos Mud", label: 'Store', stars: 5 },
  fgo_tsukihime: { tier: 8, name: "Crimson Moon Arcueid", label: 'Store', stars: 5 },
  sl_igris: { tier: 8, name: "Blood-Red Knight Igris", label: 'Store', stars: 5 },
  sl_beru: { tier: 8, name: "Ant King Beru Carapace", label: 'Store', stars: 5 },
  sl_kamish: { tier: 8, name: "Dragon King Kamish Wrath", label: 'Store', stars: 5 },
  sl_tusk: { tier: 8, name: "High Orc Hymn of Fire", label: 'Store', stars: 5 },
  sl_bellion: { tier: 8, name: "Grand Marshal Bellion", label: 'Store', stars: 5 },
  sl_baruka: { tier: 8, name: "Snow Elf Frost Dagger", label: 'Store', stars: 5 },
  sl_shadow_extraction: { tier: 8, name: "Arise: Shadow Extraction", label: 'Store', stars: 5 },
  sl_sovereign_gate: { tier: 8, name: "Monarch Dimensional Gate", label: 'Store', stars: 5 },
  bleach_senbonzakura: { tier: 8, name: "Senbonzakura Kageyoshi", label: 'Store', stars: 5 },
  bleach_minazuki: { tier: 8, name: "Minazuki Acid Bloodbath", label: 'Store', stars: 5 },
  bleach_zanka: { tier: 8, name: "Zanka no Tachi Sun Flame", label: 'Store', stars: 5 , special: 'zanka_sun'},
  bleach_kyoka: { tier: 8, name: "Kyoka Suigetsu Illusion", label: 'Store', stars: 5 },
  bleach_katen: { tier: 8, name: "Karamatsu Shinju Theater", label: 'Store', stars: 5 },
  bleach_grimmjow: { tier: 8, name: "Pantera Claw Desgarron", label: 'Store', stars: 5 },
  bleach_ulquiorra: { tier: 8, name: "Cero Oscuras Segundas", label: 'Store', stars: 5 },
  jjk_unlimited_void: { tier: 8, name: "Unlimited Void Horizon", label: 'Store', stars: 5 },
  jjk_hollow_purple: { tier: 8, name: "Hollow Purple Singularity", label: 'Store', stars: 5 },
  jjk_cleave_dismantle: { tier: 8, name: "World-Cutting Slash Grid", label: 'Store', stars: 5 },
  jjk_black_flash: { tier: 8, name: "Black Flash Spatial Spark", label: 'Store', stars: 5 },
  jjk_blood_manipulation: { tier: 8, name: "Piercing Blood Vector", label: 'Store', stars: 5 },
  jjk_idle_transfig: { tier: 8, name: "Idle Transfiguration Flesh", label: 'Store', stars: 5 },
  jjk_coffin_volcano: { tier: 8, name: "Coffin of Volcano Chamber", label: 'Store', stars: 5 },
  jjk_jackpot: { tier: 8, name: "Idle Death Gamble 777", label: 'Store', stars: 5 },
  kny_water_calm: { tier: 8, name: "11th Form: Dead Calm", label: 'Store', stars: 5 },
  kny_thunder_flash: { tier: 8, name: "Thunderclap and Flash", label: 'Store', stars: 5 },
  kny_flame_rengoku: { tier: 8, name: "9th Form: Rengoku Flare", label: 'Store', stars: 5 , special: 'rengoku_dragon'},
  kny_mist_haze: { tier: 8, name: "7th Form: Obscuring Clouds", label: 'Store', stars: 5 },
  kny_moon_breathing: { tier: 8, name: "Moon Breathing Catastrophe", label: 'Store', stars: 5 },
  kny_compass_needle: { tier: 8, name: "Destructive Death Compass", label: 'Store', stars: 5 },
  p5_arsene: { tier: 8, name: "Arsene Azure Rebellion", label: 'Store', stars: 5 },
  p5_satanael: { tier: 8, name: "Satanael Sinful Shell", label: 'Store', stars: 5 },
  p5_calling_card: { tier: 8, name: "Phantom Calling Card", label: 'Store', stars: 5 },
  p5_all_out: { tier: 8, name: "All-Out Attack Finisher", label: 'Store', stars: 5 },
  er_erdtree: { tier: 8, name: "Erdtree Incandescent Grace", label: 'Store', stars: 5 },
  er_frenzied_flame: { tier: 8, name: "Lord of Frenzied Flame", label: 'Store', stars: 5 , special: 'frenzied_flame'},
  er_ranni_moon: { tier: 8, name: "Dark Moon of Nokstella", label: 'Store', stars: 5 },
  er_malenia_rot: { tier: 8, name: "Scarlet Rot Goddess", label: 'Store', stars: 5 },
} as const;

export type FrameId = keyof typeof FRAME_TIERS;

// Kept for legacy import compat
export const FRAMES: Record<string, any> = Object.fromEntries(
  Object.keys(FRAME_TIERS).map(k => [k, { css: '', effects: '' }])
);

// ─── Level Color Palette ──────────────────────────────────────────────────────
export function getLevelColors(lvl: number) {
  if (lvl < 10)  return { stroke: '#71717a', from: '#52525b', via: '#3f3f46', to: '#27272a', shadow: 'rgba(113,113,122,0.7)',  stars: 1, gem: '#71717a', textFill: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' };
  if (lvl < 25)  return { stroke: '#4ade80', from: '#22c55e', via: '#16a34a', to: '#14532d', shadow: 'rgba(74,222,128,0.8)',   stars: 1, gem: '#4ade80', textFill: '#f0fdf4', textShadow: '0 0 4px rgba(34,197,94,0.8)' };
  if (lvl < 50)  return { stroke: '#60a5fa', from: '#3b82f6', via: '#2563eb', to: '#1e3a8a', shadow: 'rgba(96,165,250,0.8)',   stars: 2, gem: '#60a5fa', textFill: '#eff6ff', textShadow: '0 0 5px rgba(59,130,246,0.8)' };
  if (lvl < 75)  return { stroke: '#c084fc', from: '#a855f7', via: '#7e22ce', to: '#3b0764', shadow: 'rgba(192,132,252,0.8)', stars: 3, gem: '#c084fc', textFill: '#faf5ff', textShadow: '0 0 6px rgba(168,85,247,0.8)' };
  if (lvl < 100) return { stroke: '#fbbf24', from: '#f59e0b', via: '#d97706', to: '#78350f', shadow: 'rgba(251,191,36,0.9)',   stars: 4, gem: '#fbbf24', textFill: '#fffbeb', textShadow: '0 0 6px rgba(245,158,11,0.9)' };
  return         { stroke: '#f87171', from: '#ef4444', via: '#b91c1c', to: '#450a0a', shadow: 'rgba(248,113,113,1)',    stars: 5, gem: '#ff6b6b', textFill: '#fef2f2', textShadow: '0 0 8px rgba(239,68,68,1)' };
}

export function getFrameColors(frameId: string = 'none', lvl: number = 1) {
  if (!frameId || frameId === 'none') {
    return getLevelColors(lvl);
  }

  switch (frameId) {
    case 'iron':
      return { stroke: '#a1a1aa', from: '#52525b', via: '#3f3f46', to: '#27272a', shadow: 'rgba(161,161,170,0.85)', gem: '#a1a1aa', textFill: '#f4f4f5', textShadow: '0 1px 3px rgba(0,0,0,0.9)' };
    case 'bronze':
      return { stroke: '#fb923c', from: '#ea580c', via: '#c2410c', to: '#7c2d12', shadow: 'rgba(251,146,60,0.9)', gem: '#fdba74', textFill: '#fff7ed', textShadow: '0 1px 3px rgba(124,45,18,0.9)' };
    case 'silver':
      return { stroke: '#cbd5e1', from: '#94a3b8', via: '#64748b', to: '#334155', shadow: 'rgba(203,213,225,0.95)', gem: '#e2e8f0', textFill: '#ffffff', textShadow: '0 0 5px rgba(255,255,255,0.8)' };
    case 'crimson':
      return { stroke: '#f87171', from: '#ef4444', via: '#dc2626', to: '#7f1d1d', shadow: 'rgba(248,113,113,0.95)', gem: '#fca5a5', textFill: '#fef2f2', textShadow: '0 0 6px rgba(220,38,38,0.9)' };
    case 'sapphire':
      return { stroke: '#60a5fa', from: '#3b82f6', via: '#1d4ed8', to: '#1e3a8a', shadow: 'rgba(96,165,250,0.95)', gem: '#93c5fd', textFill: '#eff6ff', textShadow: '0 0 6px rgba(29,78,216,0.9)' };
    case 'emerald':
      return { stroke: '#4ade80', from: '#22c55e', via: '#15803d', to: '#14532d', shadow: 'rgba(74,222,128,0.95)', gem: '#86efac', textFill: '#f0fdf4', textShadow: '0 0 6px rgba(21,128,61,0.9)' };
    case 'golden':
      return { stroke: '#fbbf24', from: '#f59e0b', via: '#b45309', to: '#78350f', shadow: 'rgba(251,191,36,1)', gem: '#fde047', textFill: '#fffbeb', textShadow: '0 0 8px rgba(245,158,11,0.9)' };
    case 'shadow':
      return { stroke: '#c084fc', from: '#a855f7', via: '#7e22ce', to: '#3b0764', shadow: 'rgba(192,132,252,1)', gem: '#e9d5ff', textFill: '#faf5ff', textShadow: '0 0 8px rgba(168,85,247,0.9)' };
    case 'celestial':
      return { stroke: '#38bdf8', from: '#0ea5e9', via: '#0284c7', to: '#0c4a6e', shadow: 'rgba(56,189,248,1)', gem: '#bae6fd', textFill: '#f0f9ff', textShadow: '0 0 10px rgba(14,165,233,1)' };
    case 'divine':
      return { stroke: '#fef08a', from: '#eab308', via: '#ca8a04', to: '#713f12', shadow: 'rgba(254,240,138,1)', gem: '#fef08a', textFill: '#ffffff', textShadow: '0 0 12px rgba(234,179,8,1)' };
    case 'admin':
      return { stroke: '#f59e0b', from: '#ef4444', via: '#d97706', to: '#450a0a', shadow: 'rgba(245,158,11,1)', gem: '#fbbf24', textFill: '#fffbeb', textShadow: '0 0 12px rgba(245,158,11,1)' };
    case 'moderator':
      return { stroke: '#f87171', from: '#dc2626', via: '#991b1b', to: '#450a0a', shadow: 'rgba(248,113,113,1)', gem: '#fca5a5', textFill: '#fef2f2', textShadow: '0 0 12px rgba(220,38,38,1)' };
    case 'magic_circle':
      return { stroke: '#22d3ee', from: '#06b6d4', via: '#0891b2', to: '#0e7490', shadow: 'rgba(34,211,238,0.95)', gem: '#67e8f9', textFill: '#ecfeff', textShadow: '0 0 10px rgba(6,182,212,1)' };
    case 'cosmic_ring':
      return { stroke: '#f472b6', from: '#ec4899', via: '#fb7185', to: '#be185d', shadow: 'rgba(244,114,182,0.95)', gem: '#fbcfe8', textFill: '#fdf2f8', textShadow: '0 0 10px rgba(236,72,153,1)' };
    case 'shadow_monarch':
      return { stroke: '#c084fc', from: '#a855f7', via: '#7e22ce', to: '#3b0764', shadow: 'rgba(192,132,252,1)', gem: '#e9d5ff', textFill: '#faf5ff', textShadow: '0 0 12px rgba(168,85,247,1)' };
    case 'super_saiyan':
      return { stroke: '#fbbf24', from: '#f59e0b', via: '#eab308', to: '#b45309', shadow: 'rgba(251,191,36,1)', gem: '#fef08a', textFill: '#fffbeb', textShadow: '0 0 12px rgba(245,158,11,1)' };
    case 'domain_expansion':
      return { stroke: '#ef4444', from: '#dc2626', via: '#991b1b', to: '#450a0a', shadow: 'rgba(239,68,68,1)', gem: '#fca5a5', textFill: '#fef2f2', textShadow: '0 0 12px rgba(220,38,38,1)' };
    case 'bankai_ice':
      return { stroke: '#67e8f9', from: '#38bdf8', via: '#0284c7', to: '#0c4a6e', shadow: 'rgba(103,232,249,0.95)', gem: '#bae6fd', textFill: '#f0fdfa', textShadow: '0 0 10px rgba(56,189,248,1)' };
    case 'cyber_matrix':
      return { stroke: '#06b6d4', from: '#06b6d4', via: '#d946ef', to: '#4f46e5', shadow: 'rgba(6,182,212,0.95)', gem: '#f0abfc', textFill: '#ffffff', textShadow: '0 0 10px rgba(6,182,212,1)' };
    case 'sun_breathing':
      return { stroke: '#f97316', from: '#ea580c', via: '#dc2626', to: '#7c2d12', shadow: 'rgba(249,115,22,1)', gem: '#fdba74', textFill: '#fff7ed', textShadow: '0 0 12px rgba(234,88,12,1)' };
    case 'susanoo':
      return { stroke: '#818cf8', from: '#6366f1', via: '#4f46e5', to: '#312e81', shadow: 'rgba(129,140,248,1)', gem: '#c7d2fe', textFill: '#eef2ff', textShadow: '0 0 12px rgba(99,102,241,1)' };
    case 'rinnegan':
      return { stroke: '#a78bfa', from: '#8b5cf6', via: '#6d28d9', to: '#2e1065', shadow: 'rgba(167,139,250,1)', gem: '#ddd6fe', textFill: '#f5f3ff', textShadow: '0 0 12px rgba(139,92,246,1)' };
    case 'shadow_sovereign_supreme':
      return { stroke: '#c084fc', from: '#1e1b4b', via: '#8b5cf6', to: '#c084fc', shadow: 'rgba(192,132,252,1)', gem: '#f3e8ff', textFill: '#ffffff', textShadow: '0 0 12px rgba(168,85,247,1)' };
    case 'celestia_divine_throne':
      return { stroke: '#fef08a', from: '#713f12', via: '#fbbf24', to: '#fef08a', shadow: 'rgba(254,240,138,1)', gem: '#ffffff', textFill: '#ffffff', textShadow: '0 0 12px rgba(251,191,36,1)' };
    case 'infinite_tsukuyomi':
      return { stroke: '#ef4444', from: '#450a0a', via: '#dc2626', to: '#ef4444', shadow: 'rgba(239,68,68,1)', gem: '#fca5a5', textFill: '#fef2f2', textShadow: '0 0 12px rgba(220,38,38,1)' };
    case 'primordial_dragon':
      return { stroke: '#f59e0b', from: '#78350f', via: '#f59e0b', to: '#38bdf8', shadow: 'rgba(245,158,11,1)', gem: '#fef08a', textFill: '#fffbeb', textShadow: '0 0 12px rgba(245,158,11,1)' };
    case 'god_hand_eclipse':
      return { stroke: '#e11d48', from: '#000000', via: '#991b1b', to: '#e11d48', shadow: 'rgba(225,29,72,1)', gem: '#fda4af', textFill: '#ffffff', textShadow: '0 0 12px rgba(225,29,72,1)' };
    case 'celestial_emperor':
      return { stroke: '#a855f7', from: '#3b0764', via: '#a855f7', to: '#38bdf8', shadow: 'rgba(168,85,247,1)', gem: '#f3e8ff', textFill: '#ffffff', textShadow: '0 0 12px rgba(168,85,247,1)' };
    case 'solo_shadow_arise':
      return { stroke: '#dc2626', from: '#450a0a', via: '#dc2626', to: '#18181b', shadow: 'rgba(220,38,38,1)', gem: '#fca5a5', textFill: '#fef2f2', textShadow: '0 0 12px rgba(220,38,38,1)' };
    case 'strawberry_bunny':
      return { stroke: '#fb7185', from: '#881337', via: '#fb7185', to: '#fecdd3', shadow: 'rgba(251,113,133,0.9)', gem: '#ffe4e6', textFill: '#fff1f2', textShadow: '0 0 8px rgba(251,113,133,0.8)' };
    case 'cute_neko_paws':
      return { stroke: '#f472b6', from: '#831843', via: '#f472b6', to: '#fbcfe8', shadow: 'rgba(244,114,182,0.9)', gem: '#fdf2f8', textFill: '#fdf2f8', textShadow: '0 0 8px rgba(244,114,182,0.8)' };
    case 'pastel_dream':
      return { stroke: '#c084fc', from: '#38bdf8', via: '#f472b6', to: '#c084fc', shadow: 'rgba(192,132,252,0.9)', gem: '#f3e8ff', textFill: '#faf5ff', textShadow: '0 0 8px rgba(192,132,252,0.8)' };
    case 'slime_bouncy':
      return { stroke: '#22d3ee', from: '#0891b2', via: '#22d3ee', to: '#a5f3fc', shadow: 'rgba(34,211,238,0.9)', gem: '#cffafe', textFill: '#ecfeff', textShadow: '0 0 8px rgba(34,211,238,0.8)' };
    case 'chibi_boba_milk_tea':
      return { stroke: '#d97706', from: '#78350f', via: '#d97706', to: '#fed7aa', shadow: 'rgba(217,119,6,0.9)', gem: '#ffedd5', textFill: '#fff7ed', textShadow: '0 0 8px rgba(217,119,6,0.8)' };
    case 'kawaii_ghost_boo':
      return { stroke: '#a855f7', from: '#3b0764', via: '#a855f7', to: '#e9d5ff', shadow: 'rgba(168,85,247,0.9)', gem: '#f3e8ff', textFill: '#faf5ff', textShadow: '0 0 8px rgba(168,85,247,0.8)' };
    case 'magic_star_wand':
      return { stroke: '#f43f5e', from: '#fb7185', via: '#fbbf24', to: '#f472b6', shadow: 'rgba(244,63,94,0.9)', gem: '#fef08a', textFill: '#fff1f2', textShadow: '0 0 8px rgba(244,63,94,0.8)' };
    case 'starlight_kitsune':
      return { stroke: '#fb923c', from: '#7c2d12', via: '#fb923c', to: '#fef08a', shadow: 'rgba(251,146,60,0.9)', gem: '#ffedd5', textFill: '#fff7ed', textShadow: '0 0 8px rgba(251,146,60,0.8)' };
    case 'fluffy_hamster_bread':
      return { stroke: '#eab308', from: '#854d0e', via: '#eab308', to: '#fef9c3', shadow: 'rgba(234,179,8,0.9)', gem: '#fef3c7', textFill: '#fefce8', textShadow: '0 0 8px rgba(234,179,8,0.8)' };
    case 'sleepy_cloud_moon':
      return { stroke: '#818cf8', from: '#1e1b4b', via: '#818cf8', to: '#fbcfe8', shadow: 'rgba(129,140,248,0.9)', gem: '#e0e7ff', textFill: '#eef2ff', textShadow: '0 0 8px rgba(129,140,248,0.8)' };
    default: {
      const def = typeof FRAME_DEFS !== 'undefined' ? FRAME_DEFS[frameId] : undefined;
      if (def && def.border && def.border !== 'transparent') {
        const border = def.border;
        const corner = def.corner || border;
        return {
          stroke: border,
          from: border,
          via: corner,
          to: border,
          shadow: `${border}cc`,
          gem: corner,
          textFill: '#ffffff',
          textShadow: `0 0 8px ${border}`
        };
      }
      return getLevelColors(lvl);
    }
  }
}

// ─── User Level Badge (Inverted Pyramid / Chevron) ────────────────────────────
export function UserLevelBadge({ level, frameId = 'none', className = 'w-full h-full' }: { level: number | string; frameId?: string; className?: string }) {
  const numLvl   = typeof level === 'string' ? parseInt(level) || 1 : level;
  const colors   = getFrameColors(frameId, numLvl);
  const reactId  = useId();
  const gradId   = `ulb_${numLvl}_${frameId}_${reactId.replace(/:/g, '_')}`;
  const hasGlow  = numLvl >= 10 || frameId !== 'none';
  const hasGem   = numLvl >= 25 || frameId !== 'none';
  const hasWings = numLvl >= 50 || ['shadow', 'celestial', 'divine', 'admin', 'moderator', 'magic_circle', 'cosmic_ring', 'shadow_monarch', 'super_saiyan', 'domain_expansion', 'bankai_ice', 'sun_breathing', 'susanoo', 'rinnegan'].includes(frameId);
  const hasCrown = numLvl >= 75 || ['divine', 'admin', 'shadow_monarch', 'domain_expansion', 'rinnegan'].includes(frameId);
  const isGod    = numLvl >= 100 || ['divine', 'admin', 'shadow_monarch', 'domain_expansion', 'rinnegan'].includes(frameId);

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible" style={{ filter: hasGlow ? `drop-shadow(0 0 ${isGod ? '8px' : '5px'} ${colors.shadow})` : 'none' }}>
        <defs>
          <linearGradient id={gradId} x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.from} />
            <stop offset="0.5" stopColor={colors.via} />
            <stop offset="1" stopColor={colors.to} />
          </linearGradient>
          <linearGradient id={`${gradId}_gem`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffffff80" />
            <stop offset="1" stopColor={colors.gem} />
          </linearGradient>
        </defs>

        {/* Wing ornaments for lv50+ */}
        {hasWings && (
          <>
            <path d="M2 10 C4 8 7 9 6 13 L4 12 Z"  fill={colors.from} opacity="0.7" />
            <path d="M30 10 C28 8 25 9 26 13 L28 12 Z" fill={colors.from} opacity="0.7" />
          </>
        )}
        
        {/* Extra Wings for lv100+ */}
        {isGod && (
          <>
            <path d="M0 14 C3 11 8 13 7 18 L4 16 Z"  fill={colors.via} opacity="0.9" />
            <path d="M32 14 C29 11 24 13 25 18 L28 16 Z" fill={colors.via} opacity="0.9" />
          </>
        )}

        {/* Crown tips for lv75+ */}
        {hasCrown && (
          <>
            <path d="M16 0 L13 6 L16 5 L19 6 Z" fill={colors.stroke} />
            <path d="M10 2 L9 7 L11 6.5 Z"      fill={colors.stroke} opacity="0.7" />
            <path d="M22 2 L23 7 L21 6.5 Z"     fill={colors.stroke} opacity="0.7" />
          </>
        )}

        {/* Main inverted pyramid body */}
        <path
          d="M2 6 L30 6 L16 28 Z"
          fill={`url(#${gradId})`}
          stroke={colors.stroke}
          strokeWidth={isGod ? "2" : "1.5"}
          strokeLinejoin="round"
        />

        {/* Horizontal bands (engrave lines) */}
        {numLvl >= 10 && <line x1="7"  y1="12" x2="25" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />}
        {numLvl >= 25 && <line x1="10" y1="17" x2="22" y2="17" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />}
        {numLvl >= 50 && <line x1="13" y1="22" x2="19" y2="22" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />}

        {/* Center gem for lv25+ */}
        {hasGem && (
          <polygon points="16,9 18,12 16,15 14,12" fill={`url(#${gradId}_gem)`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        )}
        
        {/* Extra bottom gem for lv100+ */}
        {isGod && (
          <polygon points="16,18 17.5,21 16,24 14.5,21" fill={`url(#${gradId}_gem)`} stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
        )}

        {/* Level number */}
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill={colors.textFill || "rgba(255,255,255,1)"}
          fontSize={isGod ? "18" : "22"}
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="-0.5"
          style={{ textShadow: colors.textShadow || (hasGlow ? '0 2px 4px rgba(0,0,0,0.8)' : '0 1px 2px rgba(0,0,0,0.8)') }}
        >
          {numLvl}
        </text>
      </svg>
    </div>
  );
}

// ─── Frame Corner Ornament SVG ────────────────────────────────────────────────
function CornerOrnament({ tier, color, size = 12, opacity = 0.9 }: { tier: number; color: string; size?: number; opacity?: number }) {
  if (tier >= 11) {
    // Admin / Mod: Extra large ornate corners
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ opacity }}>
        <path d="M0 0 L16 0 L16 2 L4 2 L4 16 L0 16 Z" fill={color} />
        <path d="M6 6 L12 6 L12 8 L8 8 L8 12 L6 12 Z" fill={color} opacity="0.6" />
        <circle cx="4" cy="4" r="2.5" fill={color} />
        <circle cx="12" cy="4" r="1.5" fill={color} />
        <circle cx="4" cy="12" r="1.5" fill={color} />
      </svg>
    );
  } else if (tier >= 7) {
    // Tiers 7-10: Complex jeweled corners
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ opacity }}>
        <path d="M0 0 L14 0 L14 3 L3 3 L3 14 L0 14 Z" fill={color} />
        <circle cx="3" cy="3" r="2" fill={color} />
        <circle cx="9" cy="1.5" r="1" fill={color} opacity="0.8" />
        <circle cx="1.5" cy="9" r="1" fill={color} opacity="0.8" />
        <path d="M5 5 L8 5 L5 8 Z" fill={color} opacity="0.5" />
      </svg>
    );
  } else if (tier >= 4) {
    // Tiers 4-6: Flared diagonal flair
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ opacity }}>
        <path d="M0 0 L12 0 L10 2 L2 2 L2 10 L0 12 Z" fill={color} />
        <path d="M3 3 L7 3 L3 7 Z" fill={color} opacity="0.7" />
      </svg>
    );
  } else {
    // Tiers 1-3: Simple L-bracket
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ opacity }}>
        <path d="M0 0 L12 0 L12 3 L3 3 L3 12 L0 12 Z" fill={color} />
        <circle cx="3" cy="3" r="1.5" fill={color} opacity="0.8" />
      </svg>
    );
  }
}

// ─── Frame Definitions ────────────────────────────────────────────────────────
interface FrameDef {
  border: string;           // CSS color
  glow: string;             // box-shadow color
  bg: string;               // ring bg gradient
  corner: string;           // corner ornament color
  cornerOpacity?: number;
  animate?: 'pulse' | 'spin' | 'spinReverse' | 'aurora' | 'divine' | 'eternal' | 'warden' | 'breathe' | 'orbit' | 'spin-fast' | 'celestial-burst';
  rings?: number;           // extra spinning rings
  particles?: boolean;
  assetUrl?: string;        // Path to the high-end PNG texture
  assetBlend?: React.CSSProperties['mixBlendMode']; // e.g. 'screen' to hide black background
  assetScale?: number;      // scale factor for the asset image
  special?: 'supreme' | 'divine_rays' | 'eclipse_storm' | 'dragon_stars' | 'crimson_void' | 'quasar' | 'stellaron_shock' | 'curse_slashes' | 'truth_seeker_orbs' | 'tesla_arcs' | 'nihility_petals' | 'raiden_storm' | 'saiyan_ki' | 'fire_aura' | 'frost_blizzard' | 'cute_accents' | 'hinokami_kagura' | 'frenzied_flame' | 'rengoku_dragon' | 'phoenix_blaze' | 'genesis_dragon' | 'susanoo_spirit';
}

const FRAME_DEFS: Record<string, FrameDef> = {
  none:      { border: 'transparent', glow: 'none', bg: 'transparent', corner: 'transparent' },
  iron:      { border: '#71717a', glow: 'none', bg: '#52525b', corner: '#71717a', assetUrl: '/frames/frame_magic.png', assetBlend: 'screen', assetScale: 1.15, animate: 'breathe' },
  bronze:    { border: '#b45309', glow: '0 0 5px rgba(180,83,9,0.35)', bg: 'conic-gradient(#92400e, #d97706, #b45309, #d97706, #92400e)', corner: '#d97706', assetUrl: '/frames/frame_steampunk.png', assetBlend: 'screen', assetScale: 1.2, animate: 'spinReverse' },
  silver:    { border: '#94a3b8', glow: '0 0 5px rgba(148,163,184,0.35)', bg: 'conic-gradient(#64748b, #cbd5e1, #94a3b8, #cbd5e1, #64748b)', corner: '#cbd5e1', assetUrl: '/frames/frame_vines.png', assetBlend: 'screen', assetScale: 1.2, animate: 'breathe' },
  sapphire:  { border: '#3b82f6', glow: '0 0 6px rgba(59,130,246,0.4)', bg: 'conic-gradient(#1e3a8a, #60a5fa, #2563eb, #60a5fa, #1e3a8a)', corner: '#93c5fd', assetUrl: '/frames/frame_magic.png', assetBlend: 'screen', assetScale: 1.25, animate: 'breathe' },
  crimson:   { border: '#dc2626', glow: '0 0 6px rgba(220,38,38,0.4)', bg: 'conic-gradient(#7f1d1d, #ef4444, #b91c1c, #ef4444, #7f1d1d)', corner: '#f87171', assetUrl: '/frames/frame_blades.png', assetBlend: 'screen', assetScale: 1.3, animate: 'spin-fast' },
  emerald:   { border: '#10b981', glow: '0 0 6px rgba(16,185,129,0.4)', bg: 'conic-gradient(#064e3b, #34d399, #059669, #34d399, #064e3b)', corner: '#6ee7b7', assetUrl: '/frames/frame_vines.png', assetBlend: 'screen', assetScale: 1.25, animate: 'breathe' },
  golden:    { border: '#f59e0b', glow: '0 0 7px rgba(245,158,11,0.45)', bg: 'conic-gradient(#78350f, #fbbf24, #d97706, #fbbf24, #78350f)', corner: '#fde68a', animate: 'spin', rings: 1 },
  shadow:    { border: '#7c3aed', glow: '0 0 8px rgba(124,58,237,0.45)', bg: 'conic-gradient(#1e1b4b, #8b5cf6, #4c1d95, #8b5cf6, #1e1b4b)', corner: '#c4b5fd', animate: 'spinReverse', rings: 1, particles: true },
  celestial: { border: '#38bdf8', glow: '0 0 8px rgba(56,189,248,0.45)', bg: 'conic-gradient(#0284c7, #38bdf8, #a855f7, #ec4899, #38bdf8, #0284c7)', corner: '#bae6fd', assetUrl: '/frames/frame_gyro.png', assetBlend: 'screen', assetScale: 1.4, animate: 'orbit', rings: 2 },
  divine:    { border: '#fbbf24', glow: '0 0 8px rgba(251,191,36,0.45)', bg: 'conic-gradient(#fbbf24, #f9a8d4, #fbbf24, #c084fc, #fbbf24)', corner: '#fff7ed', animate: 'aurora', rings: 2, particles: true },
  admin:     { border: '#a855f7', glow: '0 0 10px rgba(168,85,247,0.5)', bg: 'conic-gradient(#581c87, #a855f7, #dc2626, #7e22ce, #ef4444, #a855f7, #581c87)', corner: '#e9d5ff', assetUrl: '/frames/frame_celestial.png', assetBlend: 'screen', assetScale: 1.5, animate: 'celestial-burst', rings: 3, particles: true },
  moderator: { border: '#0ea5e9', glow: '0 0 8px rgba(14,165,233,0.45)', bg: 'conic-gradient(#0c4a6e, #38bdf8, #0369a1, #38bdf8, #0c4a6e)', corner: '#bae6fd', assetUrl: '/frames/frame_gyro.png', assetBlend: 'screen', assetScale: 1.5, animate: 'warden', rings: 2, particles: true },
  // Mana / Coin Store Exclusive Anime Frames
  // Supreme Godly Tier (3,000 - 5,000 Coins)
  shadow_sovereign_supreme: { border: '#c084fc', glow: '0 0 12px rgba(192,132,252,0.8)', bg: 'conic-gradient(#1e1b4b, #8b5cf6, #c084fc, #3b0764, #1e1b4b)', corner: '#f3e8ff', rings: 3, animate: 'celestial-burst', particles: true, special: 'supreme', assetUrl: '/frames/frame_celestial.png', assetScale: 1.35 },
  celestia_divine_throne:   { border: '#fef08a', glow: '0 0 12px rgba(254,240,138,0.85)', bg: 'conic-gradient(#713f12, #fbbf24, #ffffff, #fef08a, #713f12)', corner: '#ffffff', rings: 3, animate: 'divine', particles: true, special: 'divine_rays' },
  infinite_tsukuyomi:       { border: '#ef4444', glow: '0 0 12px rgba(239,68,68,0.85)', bg: 'conic-gradient(#450a0a, #dc2626, #7f1d1d, #ef4444, #450a0a)', corner: '#fca5a5', rings: 3, animate: 'orbit', particles: true, special: 'truth_seeker_orbs', assetUrl: '/frames/frame_gyro.png', assetScale: 1.35 },
  primordial_dragon:        { border: '#f59e0b', glow: '0 0 10px rgba(245,158,11,0.7)', bg: 'conic-gradient(#78350f, #f59e0b, #38bdf8, #fbbf24, #78350f)', corner: '#fef08a', rings: 1, animate: 'aurora', particles: true, special: 'genesis_dragon' },
  god_hand_eclipse:         { border: '#e11d48', glow: '0 0 12px rgba(225,29,72,0.85)', bg: 'conic-gradient(#000000, #991b1b, #e11d48, #000000)', corner: '#fda4af', rings: 2, animate: 'spinReverse', particles: true, special: 'fire_aura', assetUrl: '/frames/frame_blades.png', assetScale: 1.3 },
  celestial_emperor:        { border: '#a855f7', glow: '0 0 12px rgba(168,85,247,0.8)', bg: 'conic-gradient(#3b0764, #a855f7, #38bdf8, #fbbf24, #3b0764)', corner: '#f3e8ff', rings: 3, animate: 'celestial-burst', particles: true, special: 'divine_rays', assetUrl: '/frames/frame_gyro.png', assetScale: 1.35 },
  solo_shadow_arise:        { border: '#dc2626', glow: '0 0 12px rgba(220,38,38,0.8)', bg: 'conic-gradient(#450a0a, #dc2626, #18181b, #dc2626, #450a0a)', corner: '#fca5a5', rings: 2, animate: 'spinReverse', particles: true, assetUrl: '/frames/frame_blades.png', assetScale: 1.3 },

  // Cute & Kawaii Tier (150 - 450 Coins)
  strawberry_bunny:         { border: '#fb7185', glow: '0 0 10px rgba(251,113,133,0.7)', bg: 'conic-gradient(#881337, #fb7185, #fecdd3, #fb7185, #881337)', corner: '#ffe4e6', rings: 1, animate: 'breathe', special: 'cute_accents' },
  cute_neko_paws:           { border: '#f472b6', glow: '0 0 10px rgba(244,114,182,0.7)', bg: 'conic-gradient(#831843, #f472b6, #fbcfe8, #f472b6, #831843)', corner: '#fdf2f8', rings: 1, animate: 'breathe', special: 'cute_accents' },
  sakura_bloom:             { border: '#f9a8d4', glow: '0 0 10px rgba(249,168,212,0.7)', bg: 'conic-gradient(#9d174d, #f472b6, #fce7f3, #f472b6, #9d174d)', corner: '#fdf2f8', animate: 'breathe', rings: 1, particles: true, special: 'cute_accents' },
  pastel_dream:             { border: '#c084fc', glow: '0 0 10px rgba(192,132,252,0.7)', bg: 'conic-gradient(#38bdf8, #f472b6, #c084fc, #38bdf8)', corner: '#f3e8ff', rings: 1, animate: 'aurora', special: 'cute_accents' },
  slime_bouncy:             { border: '#22d3ee', glow: '0 0 10px rgba(34,211,238,0.7)', bg: 'conic-gradient(#0891b2, #22d3ee, #a5f3fc, #22d3ee, #0891b2)', corner: '#cffafe', rings: 1, animate: 'breathe', special: 'cute_accents' },
  chibi_boba_milk_tea:      { border: '#d97706', glow: '0 0 10px rgba(217,119,6,0.7)', bg: 'conic-gradient(#78350f, #d97706, #fed7aa, #d97706, #78350f)', corner: '#ffedd5', rings: 1, animate: 'breathe', special: 'cute_accents' },
  kawaii_ghost_boo:         { border: '#a855f7', glow: '0 0 10px rgba(168,85,247,0.7)', bg: 'conic-gradient(#3b0764, #a855f7, #e9d5ff, #a855f7, #3b0764)', corner: '#f3e8ff', rings: 1, animate: 'breathe', special: 'cute_accents' },
  magic_star_wand:          { border: '#f43f5e', glow: '0 0 12px rgba(244,63,94,0.75)', bg: 'conic-gradient(#fb7185, #fbbf24, #f472b6, #38bdf8, #fb7185)', corner: '#fef08a', rings: 2, animate: 'aurora', special: 'cute_accents' },
  starlight_kitsune:        { border: '#fb923c', glow: '0 0 12px rgba(251,146,60,0.75)', bg: 'conic-gradient(#7c2d12, #fb923c, #fef08a, #fb923c, #7c2d12)', corner: '#ffedd5', rings: 1, animate: 'breathe', special: 'cute_accents' },
  fluffy_hamster_bread:     { border: '#eab308', glow: '0 0 10px rgba(234,179,8,0.7)', bg: 'conic-gradient(#854d0e, #eab308, #fef9c3, #eab308, #854d0e)', corner: '#fef3c7', rings: 1, animate: 'breathe', special: 'cute_accents' },
  sleepy_cloud_moon:        { border: '#818cf8', glow: '0 0 10px rgba(129,140,248,0.7)', bg: 'conic-gradient(#1e1b4b, #818cf8, #fbcfe8, #818cf8, #1e1b4b)', corner: '#e0e7ff', rings: 1, animate: 'aurora', special: 'cute_accents' },

  magic_circle:     { border: '#06b6d4', glow: '0 0 10px rgba(6,182,212,0.5)', bg: 'conic-gradient(#0891b2, #22d3ee, #10b981, #22d3ee, #0891b2)', corner: '#67e8f9', assetUrl: '/frames/frame_magic.png', assetBlend: 'screen', assetScale: 1.25, animate: 'spin', rings: 2 },
  cosmic_ring:      { border: '#f472b6', glow: '0 0 10px rgba(244,114,182,0.6)', bg: 'conic-gradient(#db2777, #f472b6, #fbbf24, #f472b6, #db2777)', corner: '#fbcfe8', animate: 'aurora', rings: 2, particles: true },
  shadow_monarch:   { border: '#a855f7', glow: '0 0 12px rgba(168,85,247,0.6)', bg: 'conic-gradient(#3b0764, #a855f7, #1e1b4b, #7e22ce, #3b0764)', corner: '#c084fc', assetUrl: '/frames/frame_celestial.png', assetBlend: 'screen', assetScale: 1.35, animate: 'celestial-burst', rings: 2, particles: true },
  super_saiyan:     { border: '#fbbf24', glow: '0 0 12px rgba(251,191,36,0.7)', bg: 'conic-gradient(#78350f, #fbbf24, #fef08a, #f59e0b, #78350f)', corner: '#fde047', assetUrl: '/frames/frame_fire.png', assetBlend: 'screen', assetScale: 1.3, animate: 'spin-fast', rings: 2 },
  domain_expansion: { border: '#dc2626', glow: '0 0 12px rgba(220,38,38,0.7)', bg: 'conic-gradient(#450a0a, #dc2626, #000000, #b91c1c, #450a0a)', corner: '#f87171', assetUrl: '/frames/frame_blades.png', assetBlend: 'screen', assetScale: 1.35, animate: 'pulse', rings: 2, particles: true },
  bankai_ice:       { border: '#38bdf8', glow: '0 0 10px rgba(56,189,248,0.6)', bg: 'conic-gradient(#0369a1, #38bdf8, #e0f2fe, #0284c7, #0369a1)', corner: '#bae6fd', assetUrl: '/frames/frame_gyro.png', assetBlend: 'screen', assetScale: 1.25, animate: 'breathe', rings: 1 },
  cyber_matrix:     { border: '#06b6d4', glow: '0 0 10px rgba(6,182,212,0.7)', bg: 'conic-gradient(#d946ef, #06b6d4, #4f46e5, #06b6d4, #d946ef)', corner: '#f0abfc', assetUrl: '/frames/frame_steampunk.png', assetBlend: 'screen', assetScale: 1.25, animate: 'spin', rings: 1 },
  sun_breathing:    { border: '#ea580c', glow: '0 0 8px rgba(234,88,12,0.6)', bg: 'linear-gradient(135deg, #7f1d1d, #ef4444, #f97316, #fbbf24)', corner: '#fdba74', animate: 'spin-fast', rings: 1, particles: false, special: 'hinokami_kagura' },
  susanoo:          { border: '#6366f1', glow: '0 0 12px rgba(99,102,241,0.7)', bg: 'conic-gradient(#1e1b4b, #6366f1, #818cf8, #4338ca, #1e1b4b)', corner: '#c7d2fe', animate: 'aurora', rings: 2, particles: true, special: 'susanoo_spirit' },
  rinnegan:         { border: '#8b5cf6', glow: '0 0 12px rgba(139,92,246,0.7)', bg: 'conic-gradient(#2e1065, #8b5cf6, #c084fc, #581c87, #2e1065)', corner: '#ddd6fe', assetUrl: '/frames/frame_gyro.png', assetBlend: 'screen', assetScale: 1.35, animate: 'orbit', rings: 3, particles: true },
  phoenix_blaze:    { border: '#06b6d4', glow: '0 0 8px rgba(6,182,212,0.6)', bg: 'linear-gradient(135deg, #ea580c, #38bdf8, #f59e0b, #06b6d4)', corner: '#38bdf8', animate: 'spin-fast', rings: 1, particles: false, special: 'phoenix_blaze' },
  blood_moon: { border: '#dc2626', glow: '0 0 10px rgba(220,38,38,0.7)', bg: 'conic-gradient(#450a0a, #dc2626, #991b1b, #dc2626, #450a0a)', corner: '#fca5a5', animate: 'spinReverse', rings: 2, particles: false },
  frost_nova: { border: '#38bdf8', glow: '0 0 10px rgba(56,189,248,0.6)', bg: 'conic-gradient(#082f49, #38bdf8, #e0f2fe, #38bdf8, #082f49)', corner: '#bae6fd', animate: 'breathe', rings: 2, particles: false },
  abyssal_kraken: { border: '#6366f1', glow: '0 0 12px rgba(99,102,241,0.7)', bg: 'conic-gradient(#1e1b4b, #6366f1, #312e81, #6366f1, #1e1b4b)', corner: '#a5b4fc', animate: 'orbit', rings: 2, particles: true },
  storm_bringer: { border: '#06b6d4', glow: '0 0 12px rgba(6,182,212,0.7)', bg: 'conic-gradient(#164e63, #06b6d4, #a5f3fc, #06b6d4, #164e63)', corner: '#67e8f9', animate: 'spin-fast', rings: 2, particles: false },
  celestial_starlight: { border: '#e879f9', glow: '0 0 12px rgba(232,121,249,0.7)', bg: 'conic-gradient(#701a75, #e879f9, #fdf4ff, #c084fc, #701a75)', corner: '#f5d0fe', animate: 'aurora', rings: 3, particles: true },
  solar_flare: { border: '#f59e0b', glow: '0 0 12px rgba(245,158,11,0.7)', bg: 'conic-gradient(#78350f, #f59e0b, #fef3c7, #f59e0b, #78350f)', corner: '#fde68a', animate: 'spin', rings: 1, particles: false },
  radiant_angel: { border: '#fef08a', glow: '0 0 12px rgba(254,240,138,0.8)', bg: 'conic-gradient(#713f12, #fef08a, #ffffff, #fef08a, #713f12)', corner: '#ffffff', animate: 'divine', rings: 2, particles: true },
  demon_lord: { border: '#991b1b', glow: '0 0 12px rgba(153,27,27,0.8)', bg: 'conic-gradient(#450a0a, #991b1b, #000000, #b91c1c, #450a0a)', corner: '#f87171', animate: 'spinReverse', rings: 2, particles: false },
  valkyrie: { border: '#a78bfa', glow: '0 0 12px rgba(167,139,250,0.7)', bg: 'conic-gradient(#3b0764, #a78bfa, #38bdf8, #a78bfa, #3b0764)', corner: '#c4b5fd', animate: 'aurora', rings: 2, particles: false },
  chaos_singularity: { border: '#7c3aed', glow: '0 0 14px rgba(124,58,237,0.8)', bg: 'conic-gradient(#09090b, #7c3aed, #000000, #a855f7, #09090b)', corner: '#e9d5ff', animate: 'orbit', rings: 3, particles: true },
  genshin_pyro: { border: '#ef4444', glow: '0 0 10px rgba(239,68,68,0.7)', bg: 'conic-gradient(#7f1d1d, #ef4444, #f97316, #ef4444, #7f1d1d)', corner: '#fca5a5', animate: 'spin-fast', rings: 1, particles: false },
  genshin_hydro: { border: '#0284c7', glow: '0 0 10px rgba(2,132,199,0.7)', bg: 'conic-gradient(#082f49, #0284c7, #38bdf8, #0284c7, #082f49)', corner: '#7dd3fc', animate: 'breathe', rings: 2, particles: false },
  genshin_anemo: { border: '#10b981', glow: '0 0 10px rgba(16,185,129,0.7)', bg: 'conic-gradient(#064e3b, #10b981, #6ee7b7, #10b981, #064e3b)', corner: '#a7f3d0', animate: 'spin', rings: 2, particles: false },
  genshin_electro: { border: '#a855f7', glow: '0 0 12px rgba(168,85,247,0.75)', bg: 'conic-gradient(#3b0764, #a855f7, #c084fc, #a855f7, #3b0764)', corner: '#e9d5ff', animate: 'spin-fast', rings: 2, particles: true },
  genshin_dendro: { border: '#84cc16', glow: '0 0 10px rgba(132,204,22,0.7)', bg: 'conic-gradient(#365314, #84cc16, #bef264, #84cc16, #365314)', corner: '#d9f99d', animate: 'breathe', rings: 1, particles: false },
  genshin_cryo: { border: '#67e8f9', glow: '0 0 10px rgba(103,232,249,0.7)', bg: 'conic-gradient(#164e63, #67e8f9, #ffffff, #67e8f9, #164e63)', corner: '#cffafe', animate: 'spinReverse', rings: 1, particles: false },
  genshin_geo: { border: '#eab308', glow: '0 0 10px rgba(234,179,8,0.7)', bg: 'conic-gradient(#713f12, #eab308, #fef08a, #eab308, #713f12)', corner: '#fef9c3', animate: 'spin', rings: 1, particles: false },
  celestia_pillar: { border: '#fde047', glow: '0 0 12px rgba(253,224,71,0.8)', bg: 'conic-gradient(#854d0e, #fde047, #f472b6, #60a5fa, #854d0e)', corner: '#ffffff', animate: 'celestial-burst', rings: 3, particles: true },
  raiden_shogun: { border: '#9333ea', glow: '0 0 14px rgba(147,51,234,0.85)', bg: 'conic-gradient(#2e1065, #9333ea, #f43f5e, #9333ea, #2e1065)', corner: '#d8b4fe', animate: 'spin-fast', rings: 2, particles: true },
  zhongli_shield: { border: '#d97706', glow: '0 0 12px rgba(217,119,6,0.75)', bg: 'conic-gradient(#451a03, #d97706, #fbbf24, #d97706, #451a03)', corner: '#fde68a', animate: 'spin', rings: 2, particles: false },
  hsr_astral: { border: '#38bdf8', glow: '0 0 12px rgba(56,189,248,0.7)', bg: 'conic-gradient(#0c4a6e, #38bdf8, #fbbf24, #38bdf8, #0c4a6e)', corner: '#bae6fd', animate: 'orbit', rings: 2, particles: false },
  hsr_acheron: { border: '#e11d48', glow: '0 0 14px rgba(225,29,72,0.85)', bg: 'conic-gradient(#000000, #e11d48, #ffffff, #881337, #000000)', corner: '#fda4af', animate: 'celestial-burst', rings: 2, particles: true },
  hsr_danheng: { border: '#14b8a6', glow: '0 0 12px rgba(20,184,166,0.75)', bg: 'conic-gradient(#134e4a, #14b8a6, #99f6e4, #14b8a6, #134e4a)', corner: '#5eead4', animate: 'aurora', rings: 2, particles: false },
  hsr_jingyuan: { border: '#f59e0b', glow: '0 0 12px rgba(245,158,11,0.75)', bg: 'conic-gradient(#78350f, #f59e0b, #fef08a, #f59e0b, #78350f)', corner: '#fde047', animate: 'spin', rings: 2, particles: false },
  hsr_firefly: { border: '#10b981', glow: '0 0 14px rgba(16,185,129,0.8)', bg: 'conic-gradient(#064e3b, #10b981, #f97316, #10b981, #064e3b)', corner: '#6ee7b7', animate: 'spin-fast', rings: 2, particles: true },
  hsr_kafka: { border: '#d946ef', glow: '0 0 12px rgba(217,70,239,0.7)', bg: 'conic-gradient(#701a75, #d946ef, #4a044e, #d946ef, #701a75)', corner: '#f0abfc', animate: 'breathe', rings: 2, particles: false },
  hsr_blackswan: { border: '#8b5cf6', glow: '0 0 12px rgba(139,92,246,0.7)', bg: 'conic-gradient(#2e1065, #8b5cf6, #c084fc, #8b5cf6, #2e1065)', corner: '#ddd6fe', animate: 'orbit', rings: 2, particles: true },
  hsr_sunday: { border: '#fbbf24', glow: '0 0 12px rgba(251,191,36,0.75)', bg: 'conic-gradient(#78350f, #fbbf24, #ffffff, #fbbf24, #78350f)', corner: '#fef08a', animate: 'divine', rings: 2, particles: false },
  hsr_blade: { border: '#b91c1c', glow: '0 0 12px rgba(185,28,28,0.7)', bg: 'conic-gradient(#450a0a, #b91c1c, #134e4a, #b91c1c, #450a0a)', corner: '#fca5a5', animate: 'spinReverse', rings: 2, particles: false },
  hsr_stellaron: { border: '#ec4899', glow: '0 0 14px rgba(236,72,153,0.8)', bg: 'conic-gradient(#500724, #ec4899, #38bdf8, #ec4899, #500724)', corner: '#fbcfe8', animate: 'celestial-burst', rings: 3, particles: true },
  fgo_excalibur: { border: '#38bdf8', glow: '0 0 12px rgba(56,189,248,0.75)', bg: 'conic-gradient(#075985, #38bdf8, #fbbf24, #38bdf8, #075985)', corner: '#bae6fd', animate: 'divine', rings: 2, particles: false },
  fgo_morgan: { border: '#dc2626', glow: '0 0 12px rgba(220,38,38,0.75)', bg: 'conic-gradient(#000000, #dc2626, #450a0a, #dc2626, #000000)', corner: '#f87171', animate: 'spinReverse', rings: 2, particles: false },
  fgo_babylon: { border: '#f59e0b', glow: '0 0 14px rgba(245,158,11,0.8)', bg: 'conic-gradient(#78350f, #f59e0b, #fef08a, #f59e0b, #78350f)', corner: '#fde047', animate: 'orbit', rings: 3, particles: false },
  fgo_ubw: { border: '#ea580c', glow: '0 0 12px rgba(234,88,12,0.75)', bg: 'conic-gradient(#7c2d12, #ea580c, #78716c, #ea580c, #7c2d12)', corner: '#fdba74', animate: 'spin', rings: 2, particles: false },
  fgo_ea: { border: '#b91c1c', glow: '0 0 14px rgba(185,28,28,0.85)', bg: 'conic-gradient(#450a0a, #b91c1c, #fbbf24, #b91c1c, #450a0a)', corner: '#fca5a5', animate: 'spin-fast', rings: 3, particles: true },
  fgo_camelot: { border: '#94a3b8', glow: '0 0 12px rgba(148,163,184,0.7)', bg: 'conic-gradient(#334155, #94a3b8, #e2e8f0, #94a3b8, #334155)', corner: '#f1f5f9', animate: 'breathe', rings: 1, particles: false },
  fgo_merlin: { border: '#ec4899', glow: '0 0 12px rgba(236,72,153,0.7)', bg: 'conic-gradient(#831843, #ec4899, #34d399, #ec4899, #831843)', corner: '#fbcfe8', animate: 'aurora', rings: 2, particles: true },
  fgo_rhongomyniad: { border: '#38bdf8', glow: '0 0 14px rgba(56,189,248,0.8)', bg: 'conic-gradient(#075985, #38bdf8, #ffffff, #38bdf8, #075985)', corner: '#bae6fd', animate: 'divine', rings: 2, particles: false },
  fgo_tiamat: { border: '#701a75', glow: '0 0 12px rgba(112,26,117,0.75)', bg: 'conic-gradient(#000000, #701a75, #f43f5e, #701a75, #000000)', corner: '#f0abfc', animate: 'spinReverse', rings: 2, particles: false },
  fgo_tsukihime: { border: '#e11d48', glow: '0 0 14px rgba(225,29,72,0.8)', bg: 'conic-gradient(#4c0519, #e11d48, #ffffff, #e11d48, #4c0519)', corner: '#fda4af', animate: 'aurora', rings: 2, particles: false },
  sl_igris: { border: '#dc2626', glow: '0 0 12px rgba(220,38,38,0.75)', bg: 'conic-gradient(#450a0a, #dc2626, #18181b, #dc2626, #450a0a)', corner: '#fca5a5', animate: 'spinReverse', rings: 2, particles: false },
  sl_beru: { border: '#7c3aed', glow: '0 0 12px rgba(124,58,237,0.75)', bg: 'conic-gradient(#2e1065, #7c3aed, #a855f7, #7c3aed, #2e1065)', corner: '#c4b5fd', animate: 'spin-fast', rings: 2, particles: false },
  sl_kamish: { border: '#f97316', glow: '0 0 14px rgba(249,115,22,0.8)', bg: 'conic-gradient(#7c2d12, #f97316, #ef4444, #f97316, #7c2d12)', corner: '#fdba74', animate: 'spin', rings: 2, particles: true },
  sl_tusk: { border: '#ef4444', glow: '0 0 12px rgba(239,68,68,0.7)', bg: 'conic-gradient(#7f1d1d, #ef4444, #b91c1c, #ef4444, #7f1d1d)', corner: '#fca5a5', animate: 'breathe', rings: 1, particles: false },
  sl_bellion: { border: '#8b5cf6', glow: '0 0 14px rgba(139,92,246,0.8)', bg: 'conic-gradient(#1e1b4b, #8b5cf6, #3b0764, #8b5cf6, #1e1b4b)', corner: '#ddd6fe', animate: 'celestial-burst', rings: 3, particles: true },
  sl_baruka: { border: '#38bdf8', glow: '0 0 10px rgba(56,189,248,0.65)', bg: 'conic-gradient(#075985, #38bdf8, #e0f2fe, #38bdf8, #075985)', corner: '#bae6fd', animate: 'breathe', rings: 1, particles: false },
  sl_shadow_extraction: { border: '#0284c7', glow: '0 0 12px rgba(2,132,199,0.75)', bg: 'conic-gradient(#082f49, #0284c7, #38bdf8, #0284c7, #082f49)', corner: '#7dd3fc', animate: 'spin', rings: 2, particles: false },
  sl_sovereign_gate: { border: '#a21caf', glow: '0 0 12px rgba(162,28,175,0.75)', bg: 'conic-gradient(#4a044e, #a21caf, #ec4899, #a21caf, #4a044e)', corner: '#f0abfc', animate: 'orbit', rings: 2, particles: false },
  bleach_mugetsu: { border: '#18181b', glow: '0 0 14px rgba(0,0,0,0.95)', bg: 'conic-gradient(#000000, #3f3f46, #000000, #52525b, #000000)', corner: '#ffffff', animate: 'celestial-burst', rings: 3, particles: true },
  bleach_senbonzakura: { border: '#f472b6', glow: '0 0 12px rgba(244,114,182,0.7)', bg: 'conic-gradient(#831843, #f472b6, #fbcfe8, #f472b6, #831843)', corner: '#fbcfe8', animate: 'spin-fast', rings: 2, particles: false },
  bleach_minazuki: { border: '#991b1b', glow: '0 0 12px rgba(153,27,27,0.75)', bg: 'conic-gradient(#450a0a, #991b1b, #000000, #991b1b, #450a0a)', corner: '#f87171', animate: 'breathe', rings: 2, particles: false },
  bleach_zanka: { border: '#ea580c', glow: '0 0 14px rgba(234,88,12,0.85)', bg: 'conic-gradient(#7c2d12, #ea580c, #fbbf24, #ea580c, #7c2d12)', corner: '#fdba74', animate: 'spin', rings: 3, particles: true },
  bleach_kyoka: { border: '#38bdf8', glow: '0 0 12px rgba(56,189,248,0.75)', bg: 'conic-gradient(#075985, #38bdf8, #a855f7, #38bdf8, #075985)', corner: '#bae6fd', animate: 'aurora', rings: 2, particles: false },
  bleach_katen: { border: '#4c1d95', glow: '0 0 14px rgba(76,29,149,0.8)', bg: 'conic-gradient(#1e1b4b, #4c1d95, #f472b6, #4c1d95, #1e1b4b)', corner: '#c4b5fd', animate: 'spinReverse', rings: 2, particles: false },
  bleach_grimmjow: { border: '#06b6d4', glow: '0 0 12px rgba(6,182,212,0.75)', bg: 'conic-gradient(#164e63, #06b6d4, #67e8f9, #06b6d4, #164e63)', corner: '#a5f3fc', animate: 'spin-fast', rings: 1, particles: false },
  bleach_ulquiorra: { border: '#10b981', glow: '0 0 14px rgba(16,185,129,0.8)', bg: 'conic-gradient(#064e3b, #10b981, #000000, #10b981, #064e3b)', corner: '#6ee7b7', animate: 'spin', rings: 2, particles: true },
  jjk_unlimited_void: { border: '#38bdf8', glow: '0 0 16px rgba(56,189,248,0.9)', bg: 'conic-gradient(#000000, #38bdf8, #a855f7, #38bdf8, #000000)', corner: '#bae6fd', animate: 'celestial-burst', rings: 3, particles: true },
  jjk_hollow_purple: { border: '#c084fc', glow: '0 0 14px rgba(192,132,252,0.8)', bg: 'conic-gradient(#ef4444, #3b82f6, #a855f7, #c084fc, #ef4444)', corner: '#f3e8ff', animate: 'spin-fast', rings: 2, particles: false },
  jjk_cleave_dismantle: { border: '#dc2626', glow: '0 0 14px rgba(220,38,38,0.8)', bg: 'conic-gradient(#450a0a, #dc2626, #18181b, #dc2626, #450a0a)', corner: '#fca5a5', animate: 'spin', rings: 2, particles: false },
  jjk_black_flash: { border: '#18181b', glow: '0 0 12px rgba(220,38,38,0.75)', bg: 'conic-gradient(#000000, #dc2626, #000000, #ef4444, #000000)', corner: '#ef4444', animate: 'spin-fast', rings: 2, particles: false },
  jjk_blood_manipulation: { border: '#b91c1c', glow: '0 0 12px rgba(185,28,28,0.7)', bg: 'conic-gradient(#450a0a, #b91c1c, #7f1d1d, #b91c1c, #450a0a)', corner: '#fca5a5', animate: 'spinReverse', rings: 1, particles: false },
  jjk_idle_transfig: { border: '#6366f1', glow: '0 0 12px rgba(99,102,241,0.7)', bg: 'conic-gradient(#1e1b4b, #6366f1, #93c5fd, #6366f1, #1e1b4b)', corner: '#c7d2fe', animate: 'breathe', rings: 2, particles: false },
  jjk_coffin_volcano: { border: '#ea580c', glow: '0 0 12px rgba(234,88,12,0.75)', bg: 'conic-gradient(#7c2d12, #ea580c, #f97316, #ea580c, #7c2d12)', corner: '#fdba74', animate: 'spin', rings: 1, particles: false },
  jjk_jackpot: { border: '#eab308', glow: '0 0 14px rgba(234,179,8,0.8)', bg: 'conic-gradient(#713f12, #eab308, #ec4899, #eab308, #713f12)', corner: '#fef08a', animate: 'spin-fast', rings: 2, particles: false },
  kny_water_calm: { border: '#0284c7', glow: '0 0 12px rgba(2,132,199,0.75)', bg: 'conic-gradient(#082f49, #0284c7, #7dd3fc, #0284c7, #082f49)', corner: '#bae6fd', animate: 'breathe', rings: 2, particles: false },
  kny_thunder_flash: { border: '#facc15', glow: '0 0 12px rgba(250,204,21,0.8)', bg: 'conic-gradient(#713f12, #facc15, #fef08a, #facc15, #713f12)', corner: '#fef9c3', animate: 'spin-fast', rings: 2, particles: false },
  kny_flame_rengoku: { border: '#ef4444', glow: '0 0 8px rgba(239,68,68,0.6)', bg: 'linear-gradient(135deg, #7f1d1d, #ef4444, #fbbf24, #7f1d1d)', corner: '#fde047', animate: 'spin-fast', rings: 1, particles: false, special: 'rengoku_dragon' },
  kny_mist_haze: { border: '#2dd4bf', glow: '0 0 10px rgba(45,212,191,0.65)', bg: 'conic-gradient(#134e4a, #2dd4bf, #f0fdfa, #2dd4bf, #134e4a)', corner: '#99f6e4', animate: 'breathe', rings: 1, particles: false },
  kny_moon_breathing: { border: '#818cf8', glow: '0 0 14px rgba(129,140,248,0.8)', bg: 'conic-gradient(#1e1b4b, #818cf8, #fbbf24, #818cf8, #1e1b4b)', corner: '#c7d2fe', animate: 'orbit', rings: 2, particles: false },
  kny_compass_needle: { border: '#38bdf8', glow: '0 0 12px rgba(56,189,248,0.75)', bg: 'conic-gradient(#075985, #38bdf8, #f472b6, #38bdf8, #075985)', corner: '#bae6fd', animate: 'spinReverse', rings: 2, particles: false },
  p5_arsene: { border: '#3b82f6', glow: '0 0 12px rgba(59,130,246,0.75)', bg: 'conic-gradient(#1e3a8a, #3b82f6, #ef4444, #3b82f6, #1e3a8a)', corner: '#93c5fd', animate: 'spin', rings: 2, particles: false },
  p5_satanael: { border: '#fbbf24', glow: '0 0 14px rgba(251,191,36,0.8)', bg: 'conic-gradient(#78350f, #fbbf24, #ef4444, #fbbf24, #78350f)', corner: '#fef08a', animate: 'divine', rings: 2, particles: false },
  p5_calling_card: { border: '#dc2626', glow: '0 0 12px rgba(220,38,38,0.75)', bg: 'conic-gradient(#000000, #dc2626, #ffffff, #dc2626, #000000)', corner: '#f87171', animate: 'spinReverse', rings: 1, particles: false },
  p5_all_out: { border: '#ef4444', glow: '0 0 12px rgba(239,68,68,0.75)', bg: 'conic-gradient(#7f1d1d, #ef4444, #fbbf24, #ef4444, #7f1d1d)', corner: '#fca5a5', animate: 'spin-fast', rings: 2, particles: false },
  er_erdtree: { border: '#fbbf24', glow: '0 0 12px rgba(251,191,36,0.75)', bg: 'conic-gradient(#78350f, #fbbf24, #fde68a, #fbbf24, #78350f)', corner: '#fef08a', animate: 'divine', rings: 2, particles: true },
  er_frenzied_flame: { border: '#fbbf24', glow: '0 0 8px rgba(251,191,36,0.6)', bg: 'linear-gradient(135deg, #451a03, #d97706, #fef08a, #451a03)', corner: '#fde047', animate: 'spin', rings: 1, particles: false, special: 'frenzied_flame' },
  er_ranni_moon: { border: '#60a5fa', glow: '0 0 16px rgba(96,165,250,0.9)', bg: 'conic-gradient(#1e3a8a, #60a5fa, #c084fc, #60a5fa, #1e3a8a)', corner: '#93c5fd', animate: 'aurora', rings: 2, particles: false },
  er_malenia_rot: { border: '#f43f5e', glow: '0 0 16px rgba(244,63,94,0.9)', bg: 'conic-gradient(#881337, #f43f5e, #fb923c, #f43f5e, #881337)', corner: '#fda4af', animate: 'breathe', rings: 2, particles: true },
};

// Aliases for frame IDs mapped from natural language / DB values
FRAME_DEFS['warden'] = FRAME_DEFS.moderator;
FRAME_DEFS['the_warden'] = FRAME_DEFS.moderator;
FRAME_DEFS['celestial_nebula'] = FRAME_DEFS.celestial;
FRAME_DEFS['shadow_portal'] = FRAME_DEFS.shadow;
FRAME_DEFS['akatsuki'] = FRAME_DEFS.admin;
FRAME_DEFS['demon_slayer'] = FRAME_DEFS.crimson;
FRAME_DEFS['wings_of_freedom'] = FRAME_DEFS.celestial;

// ─── Main Frame Component ─────────────────────────────────────────────────────
export interface FantasyFrameProps {
  frameId?: string | null;
  level?: number;
  showLevelTag?: boolean;
  children?: React.ReactNode;
  className?: string;
  size?: number; // diameter in px, default 64
  avatarUrl?: string | null;
  transparentBg?: boolean;
  previewMode?: boolean; // When true, animations stay frozen and run only on hover (desktop) or in-view / tap (mobile)
}


const FF_GLOBAL_CSS = `
/* Optimization: Freeze frame previews until hovered (desktop) or in-view / tapped (mobile) */
.ff-preview,
.ff-preview *,
.ff-preview [class*="animate-"] {
  animation-play-state: paused !important;
}

.group:hover .ff-preview,
.group:hover .ff-preview *,
.group:hover .ff-preview [class*="animate-"],
.ff-preview:hover,
.ff-preview:hover *,
.ff-preview:hover [class*="animate-"],
.ff-preview.ff-active,
.ff-preview.ff-active *,
.ff-preview.ff-active [class*="animate-"],
.ff-preview.ff-in-view,
.ff-preview.ff-in-view *,
.ff-preview.ff-in-view [class*="animate-"] {
  animation-play-state: running !important;
}

@keyframes ff-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ff-spin-fast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ff-spin-r { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
@keyframes ff-pulse-glow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes ff-breathe { 0%,100% { transform: scale(1) rotate(0deg); opacity: 0.85; } 50% { transform: scale(1.05) rotate(2deg); opacity: 1; } }
@keyframes ff-aurora { 0% { filter: hue-rotate(0deg); transform: rotate(0deg) scale(1); } 50% { filter: hue-rotate(180deg); transform: rotate(180deg) scale(1.05); } 100% { filter: hue-rotate(360deg); transform: rotate(360deg) scale(1); } }
@keyframes ff-divine { 0% { filter: hue-rotate(0deg) brightness(1); transform: scale(1); } 50% { filter: hue-rotate(180deg) brightness(1.4); transform: scale(1.08); } 100% { filter: hue-rotate(360deg) brightness(1); transform: scale(1); } }
@keyframes ff-eternal { 0% { filter: brightness(1) hue-rotate(0deg); } 33% { filter: brightness(1.8) hue-rotate(60deg); } 66% { filter: brightness(1.2) hue-rotate(-60deg); } 100% { filter: brightness(1) hue-rotate(0deg); } }
@keyframes ff-orbit { 0% { transform: rotateZ(0deg) rotateX(15deg) rotateY(15deg); } 100% { transform: rotateZ(360deg) rotateX(15deg) rotateY(15deg); } }
@keyframes ff-warden-spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.03); } 100% { transform: rotate(360deg) scale(1); } }
@keyframes ff-celestial-burst { 0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg) drop-shadow(0 0 10px rgba(168,85,247,0.5)); } 50% { transform: scale(1.04) rotate(180deg); filter: hue-rotate(240deg) drop-shadow(0 0 16px rgba(220,38,38,0.6)); } }
@keyframes ff-purple-shock { 0%, 100% { opacity: 0.7; transform: scale(1); filter: drop-shadow(0 0 6px #a855f7); } 50% { opacity: 1; transform: scale(1.03) rotate(3deg); filter: drop-shadow(0 0 12px #dc2626); } }
@keyframes ff-sunwave { 0%, 100% { filter: drop-shadow(0 0 10px rgba(245,158,11,0.6)); transform: scale(1); } 50% { filter: drop-shadow(0 0 18px rgba(251,191,36,0.7)); transform: scale(1.03); } }
@keyframes ff-particle { 0%,100% { transform: translate(0,0) scale(1); opacity: 0; } 30% { opacity: 0.9; } 70% { transform: translate(var(--dx), var(--dy)) scale(0.6); opacity: 0.6; } 100% { opacity: 0; } }
@keyframes ff-aura-wave { 0%, 100% { opacity: 0.2; transform: scale(0.95); } 50% { opacity: 0.6; transform: scale(1.05); } }
@keyframes ff-firefly-1 { 0% { transform: translate(0, 0) scale(0.5); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 0; } 100% { transform: translate(25px, -35px) scale(1.2); opacity: 0; } }
@keyframes ff-firefly-2 { 0% { transform: translate(0, 0) scale(0.8); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 0; } 100% { transform: translate(-30px, -45px) scale(0.5); opacity: 0; } }

@keyframes ff-shock-jitter {
  0% { opacity: 0.6; transform: scale(1) translate(0px, 0px); }
  25% { opacity: 0.9; transform: scale(1.02) translate(1px, -1px); }
  50% { opacity: 0.5; transform: scale(0.98) translate(-1px, 1px); }
  75% { opacity: 1; transform: scale(1.01) translate(-1px, -1px); }
  100% { opacity: 0.7; transform: scale(1) translate(1px, 1px); }
}
@keyframes ff-lightning-flash-1 {
  0%, 90% { opacity: 0; transform: rotate(0deg) scale(1); }
  92% { opacity: 1; transform: rotate(10deg) scale(1.1); }
  95% { opacity: 0.3; transform: rotate(-5deg) scale(0.9); }
  98% { opacity: 1; transform: rotate(5deg) scale(1.05); }
  100% { opacity: 0; transform: rotate(0deg) scale(1); }
}
@keyframes ff-lightning-flash-2 {
  0%, 85% { opacity: 0; transform: rotate(0deg) scale(1) scaleX(1); }
  87% { opacity: 1; transform: rotate(-15deg) scale(1.1) scaleX(-1); }
  91% { opacity: 0.2; transform: rotate(10deg) scale(0.9) scaleX(-1); }
  95% { opacity: 1; transform: rotate(-5deg) scale(1.05) scaleX(-1); }
  100% { opacity: 0; transform: rotate(0deg) scale(1) scaleX(1); }
}
@keyframes ff-lightning-flash-3 {
  0%, 80% { opacity: 0; transform: rotate(0deg) scale(1) scaleY(1); }
  82% { opacity: 1; transform: rotate(20deg) scale(1.2) scaleY(-1); }
  86% { opacity: 0.4; transform: rotate(-15deg) scale(0.8) scaleY(-1); }
  90% { opacity: 1; transform: rotate(15deg) scale(1.1) scaleY(-1); }
  100% { opacity: 0; transform: rotate(0deg) scale(1) scaleY(1); }
}
@keyframes ff-storm-flash {
  0%, 90%, 100% { opacity: 0; }
  92% { opacity: 0.6; }
  94% { opacity: 0.1; }
  96% { opacity: 0.8; }
}
@keyframes ff-sunfire-spin {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.05) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}
@keyframes ff-cute-bounce {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.06) translateY(-2px); }
}
@keyframes ff-god-rays {
  0% { transform: rotate(0deg) scale(1); opacity: 0.5; }
  50% { transform: rotate(180deg) scale(1.08); opacity: 0.8; }
  100% { transform: rotate(360deg) scale(1); opacity: 0.5; }
}
@keyframes ff-ice-shimmer {
  0%, 100% { filter: drop-shadow(0 0 6px #67e8f9); opacity: 0.8; }
  50% { filter: drop-shadow(0 0 14px #a5f3fc); opacity: 1; }
}
`;

let atelierStylesInjected = false;
let atelierDefsInjected = false;

function useFantasyFrameOptimizations() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!atelierStylesInjected && !document.getElementById('atelier-global-styles')) {
      const style = document.createElement('style');
      style.id = 'atelier-global-styles';
      style.textContent = ATELIER_GLOBAL_CSS;
      document.head.appendChild(style);
      atelierStylesInjected = true;
    }

    if (!atelierDefsInjected && !document.getElementById('atelier-global-defs')) {
      const container = document.createElement('div');
      container.id = 'atelier-global-defs';
      container.innerHTML = ATELIER_GLOBAL_DEFS_SVG;
      document.body.appendChild(container);
      atelierDefsInjected = true;
    }
  }, []);
}

function FantasyFrame({
  frameId = 'none',
  level,
  showLevelTag = true,
  children,
  className = '',
  size,
  avatarUrl,
  transparentBg = false,
  previewMode = false,
}: FantasyFrameProps) {
  useFantasyFrameOptimizations();
  const settingsContext = useSettings();
  const isHidden = settingsContext?.settings?.hideLevelBadge;
  const shouldShowTag = level !== undefined && showLevelTag && !isHidden;

  const [isHovered, setIsHovered] = useState(false);
  const [isMobileInView, setIsMobileInView] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPlaying = !previewMode || isHovered || isMobileInView || isTapped;

  // Desktop Card Hover Listener
  useEffect(() => {
    if (!previewMode || !containerRef.current) return;
    const cardParent = containerRef.current.closest('.group') || containerRef.current;

    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);

    cardParent.addEventListener('mouseenter', onEnter);
    cardParent.addEventListener('mouseleave', onLeave);

    return () => {
      cardParent.removeEventListener('mouseenter', onEnter);
      cardParent.removeEventListener('mouseleave', onLeave);
    };
  }, [previewMode]);

  // Mobile Viewport In-View Observer (strictly coarse touch devices like smartphones/tablets)
  useEffect(() => {
    if (!previewMode || !containerRef.current) return;

    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!isTouch) return;

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsMobileInView(entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [previewMode]);

  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '_');
  const atelier = useMemo(() => (!frameId || frameId === 'none' ? { type: 'none' as const } : getAtelierFrame(frameId)), [frameId]);

  // Frame SVG is generated with a transparent center so the real avatar DOM element renders at full size
  const svgHtml = useMemo(() => {
    if (atelier.type === 'showcase' && atelier.showcase) {
      return generateShowcaseFrameSvg(atelier.showcase, {
        avatarUrl: undefined,
        uniqueId: reactId,
        transparentCenter: true,
      });
    }
    if (atelier.type === 'special' && atelier.special) {
      return generateSpecialFrameSvg(atelier.special, {
        avatarUrl: undefined,
        uniqueId: reactId,
        transparentCenter: true,
      });
    }
    return null;
  }, [atelier, reactId]);

  // Stable memoized object to prevent React DOM from re-setting innerHTML and destroying the SMIL timeline
  const innerHtmlProp = useMemo(() => (svgHtml ? { __html: svgHtml } : undefined), [svgHtml]);

  // SVG SMIL Animation Engine Freeze / Unfreeze Controller
  useEffect(() => {
    if (!previewMode || !containerRef.current) return;
    const svgs = containerRef.current.querySelectorAll('svg');
    svgs.forEach((svgEl) => {
      try {
        if (isPlaying) {
          svgEl.unpauseAnimations();
        } else {
          svgEl.pauseAnimations();
        }
      } catch (e) {}
    });
  }, [previewMode, isPlaying, svgHtml]);

  // Fallback avatar constant (Ace Zero Google Profile Picture)
  const FALLBACK_AVATAR = 'https://lh3.googleusercontent.com/a/ACg8ocLnpRFtv4bK_qXzuqBG4vBF6UzrdAwPBOCPYofJ0tSYCc5RyKz4=s96-c';

  const isDeadUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string') return true;
    return url.includes('ibb.co') || url.includes('imgbb.com');
  };

  // Extract avatar URL if provided or available in React element children
  const resolvedAvatarUrl = useMemo(() => {
    let srcCandidate = avatarUrl;
    if (isDeadUrl(srcCandidate) && React.isValidElement(children)) {
      const src = (children.props as any)?.src;
      if (src && !isDeadUrl(src)) srcCandidate = src;
      else {
        const childElem = (children.props as any)?.children;
        if (React.isValidElement(childElem) && (childElem.props as any)?.src && !isDeadUrl((childElem.props as any)?.src)) {
          srcCandidate = (childElem.props as any)?.src;
        }
      }
    }
    // Automatically intercept dead imgbb 503 URL and fall back to Google profile avatar
    if (isDeadUrl(srcCandidate)) {
      return FALLBACK_AVATAR;
    }
    return srcCandidate || FALLBACK_AVATAR;
  }, [avatarUrl, children]);

  return (
    <div 
      ref={containerRef}
      onClick={() => {
        if (previewMode) setIsTapped(prev => !prev);
      }}
      className={`relative flex items-center justify-center shrink-0 ${
        previewMode ? `ff-preview ${isPlaying ? 'ff-playing ff-in-view' : 'ff-frozen'}` : ''
      } ${className}`}
      style={size ? { width: size, height: size } : {}}
    >
      {/* ── 1. AVATAR CIRCLE: 100% Full Original Size with Fallback Error Handler ── */}
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10 bg-zinc-950">
        {children ? (
          children
        ) : (
          <img
            src={resolvedAvatarUrl || FALLBACK_AVATAR}
            alt="Avatar"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
            }}
          />
        )}
      </div>

      {/* ── 2. ATELIER FANTASY FRAME SVG OVERLAY: Mathematically Snapped to Outer Rim ── */}
      {svgHtml && (
        <div 
          className="absolute pointer-events-none flex items-center justify-center overflow-visible z-20"
          style={{
            width: '215.38%',
            height: '215.38%',
            top: '-57.69%',
            left: '-57.69%',
          }}
          dangerouslySetInnerHTML={innerHtmlProp}
        />
      )}

      {/* ── 3. LEVEL BADGE: Centered right on the bottom rim of the avatar ── */}
      {shouldShowTag && (
        <div 
          className="absolute left-1/2 z-30 pointer-events-none flex items-center justify-center"
          style={{ 
            width: '40%',
            height: '40%',
            bottom: '0%', 
            transform: 'translate(-50%, 50%)'
          }}
        >
          <UserLevelBadge level={level!} frameId={frameId || 'none'} className="w-full h-full overflow-visible" />
        </div>
      )}
    </div>
  );
}

export default React.memo(FantasyFrame);

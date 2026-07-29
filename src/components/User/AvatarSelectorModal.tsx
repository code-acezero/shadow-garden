"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, UserCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AvatarItem {
  id: string;
  name: string;
  category: string;
  url: string;
  isFunny?: boolean;
  gender?: 'boy' | 'girl' | 'neutral';
}

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onBack?: () => void;
  currentUrl?: string;
  isGuest?: boolean;
}

// ─── TRAVELLER AVATARS (Guests) ────────────────────────────────────────────────
const FUNNY_AVATARS: AvatarItem[] = [
  { id: 'al-136837', name: "Cid Kagenou", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136837-3WR22FYet8Hv.jpg", gender: 'boy', isFunny: true },
  { id: 'al-162246', name: "Alpha", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162246-IbbxkhNJFDN5.png", gender: 'girl', isFunny: true },
  { id: 'al-162247', name: "Beta", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162247-R6OrAuT1FwL4.png", gender: 'girl', isFunny: true },
  { id: 'al-162245', name: "Gamma", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162245-x86QMM6nOj75.png", gender: 'girl', isFunny: true },
  { id: 'al-162248', name: "Delta", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162248-57Xgk6EmwKRQ.png", gender: 'girl', isFunny: true },
  { id: 'al-162249', name: "Epsilon", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162249-eJRpBIC5lAZX.png", gender: 'girl', isFunny: true },
  { id: 'al-168798', name: "Claire Kagenou", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168798-IrHBKh5xbRsr.png", gender: 'girl', isFunny: true },
  { id: 'al-168799', name: "Alexia Midgar", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168799-uAsWFrrfqxTN.png", gender: 'girl', isFunny: true },
  { id: 'al-168800', name: "Rose Oriana", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168800-eb3FqWq0IdyV.png", gender: 'girl', isFunny: true },
  { id: 'al-168968', name: "Nu", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168968-kiFqnWfpCLUE.png", gender: 'girl', isFunny: true },
  { id: 'al-197922', name: "Sherry Barnett", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b197922-zq7eT5LTjvoj.png", gender: 'girl', isFunny: true },
  { id: 'al-204202', name: "Annerose Nichtsehen", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b204202-bvSbKDSSGg7J.png", gender: 'girl', isFunny: true },
  { id: 'al-204203', name: "Olivier", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b204203-AUa5RQad7eC7.png", gender: 'girl', isFunny: true },
  { id: 'al-204204', name: "Iris  Midgar", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b204204-wsPvzUwfdUwJ.jpg", gender: 'girl', isFunny: true },
  { id: 'al-215409', name: "Aurora", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b215409-Y1Ti42451ivg.png", gender: 'girl', isFunny: true },
  { id: 'al-229652', name: "Akane Nishino", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b229652-JE0EUB5nfONo.png", gender: 'girl', isFunny: true },
  { id: 'al-264565', name: "Zeta", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b264565-acUMiD3pz2ZU.png", gender: 'girl', isFunny: true },
  { id: 'al-2951', name: "Shinnosuke Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2951-Bs571jmT5Xym.png", gender: 'boy', isFunny: true },
  { id: 'al-7854', name: "Misae Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7854.jpg", gender: 'girl', isFunny: true },
  { id: 'al-7855', name: "Himawari Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7855.jpg", gender: 'girl', isFunny: true },
  { id: 'al-33466', name: "Hiroshi Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/33466.jpg", gender: 'boy', isFunny: true },
  { id: 'al-7853', name: "Bou-chan", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7853-dQihKEkfF8Hk.png", gender: 'boy', isFunny: true },
  { id: 'al-7856', name: "Shiro", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7856.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7858', name: "Action Kamen", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7858-sNAVairhN9zU.png", gender: 'boy', isFunny: true },
  { id: 'al-7860', name: "Moeko Sakurada", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7860.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7861', name: "Nene Sakurada", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7861-J50MV4iGXl5U.png", gender: 'girl', isFunny: true },
  { id: 'al-7862', name: "Tooru Kazama", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7862-knP9WiZVuaVN.png", gender: 'neutral', isFunny: true },
  { id: 'al-7863', name: "Masao Sato", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7863.jpg", gender: 'boy', isFunny: true },
  { id: 'al-7865', name: "Nanako Oohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7865.jpg", gender: 'girl', isFunny: true },
  { id: 'al-7867', name: "Midori Yoshinaga", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7867.jpg", gender: 'girl', isFunny: true },
  { id: 'al-7870', name: "Ume Matsuzaka", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7870.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7872', name: "Masumi Ageo", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7872.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7875', name: "Mimiko Sakura", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7875.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7877', name: "Ai Suotome", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7877.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7880', name: "Bunta Takakura", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7880.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-4303', name: "Nobita Nobi", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/4303.jpg", gender: 'boy', isFunny: true },
  { id: 'al-4304', name: "Doraemon", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b4304-4eXX8C1O4Pda.png", gender: 'boy', isFunny: true },
  { id: 'al-8260', name: "Shizuka Minamoto", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8260-Hz17eZuElZ7U.png", gender: 'girl', isFunny: true },
  { id: 'al-8261', name: "Suneo Honekawa", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8261-qGxKWau5iZrf.png", gender: 'boy', isFunny: true },
  { id: 'al-8262', name: "Takeshi Gouda", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8262-N2Lsf46EjZBf.png", gender: 'boy', isFunny: true },
  { id: 'al-31870', name: "Hidetoshi Dekisugi", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b31870-GGFedy239Ddk.png", gender: 'boy', isFunny: true },
  { id: 'al-40', name: "Luffy Monkey", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png", gender: 'boy', isFunny: true },
  { id: 'al-61', name: "Robin Nico", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b61-ywXUyyocEEqt.png", gender: 'girl', isFunny: true },
  { id: 'al-62', name: "Zoro Roronoa", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b62-S7oAeA9WInjV.png", gender: 'boy', isFunny: true },
  { id: 'al-64', name: "Franky", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/n64-ChX6ZzHHjXqA.png", gender: 'boy', isFunny: true },
];

// ─── FULL PRISTINE AVATAR LIBRARY (100% Live AniList CDN Images) ─────────────────
export const ANIME_AVATARS: AvatarItem[] = [
  { id: 'al-136837', name: "Cid Kagenou", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136837-3WR22FYet8Hv.jpg", gender: 'boy', isFunny: true },
  { id: 'al-162246', name: "Alpha", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162246-IbbxkhNJFDN5.png", gender: 'girl', isFunny: true },
  { id: 'al-162247', name: "Beta", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162247-R6OrAuT1FwL4.png", gender: 'girl', isFunny: true },
  { id: 'al-162245', name: "Gamma", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162245-x86QMM6nOj75.png", gender: 'girl', isFunny: true },
  { id: 'al-162248', name: "Delta", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162248-57Xgk6EmwKRQ.png", gender: 'girl', isFunny: true },
  { id: 'al-162249', name: "Epsilon", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b162249-eJRpBIC5lAZX.png", gender: 'girl', isFunny: true },
  { id: 'al-168798', name: "Claire Kagenou", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168798-IrHBKh5xbRsr.png", gender: 'girl', isFunny: true },
  { id: 'al-168799', name: "Alexia Midgar", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168799-uAsWFrrfqxTN.png", gender: 'girl', isFunny: true },
  { id: 'al-168800', name: "Rose Oriana", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168800-eb3FqWq0IdyV.png", gender: 'girl', isFunny: true },
  { id: 'al-168968', name: "Nu", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168968-kiFqnWfpCLUE.png", gender: 'girl', isFunny: true },
  { id: 'al-197922', name: "Sherry Barnett", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b197922-zq7eT5LTjvoj.png", gender: 'girl', isFunny: true },
  { id: 'al-204202', name: "Annerose Nichtsehen", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b204202-bvSbKDSSGg7J.png", gender: 'girl', isFunny: true },
  { id: 'al-204203', name: "Olivier", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b204203-AUa5RQad7eC7.png", gender: 'girl', isFunny: true },
  { id: 'al-204204', name: "Iris  Midgar", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b204204-wsPvzUwfdUwJ.jpg", gender: 'girl', isFunny: true },
  { id: 'al-215409', name: "Aurora", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b215409-Y1Ti42451ivg.png", gender: 'girl', isFunny: true },
  { id: 'al-229652', name: "Akane Nishino", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b229652-JE0EUB5nfONo.png", gender: 'girl', isFunny: true },
  { id: 'al-264565', name: "Zeta", category: "The Eminence in Shadow", url: "https://s4.anilist.co/file/anilistcdn/character/large/b264565-acUMiD3pz2ZU.png", gender: 'girl', isFunny: true },
  { id: 'al-2951', name: "Shinnosuke Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2951-Bs571jmT5Xym.png", gender: 'boy', isFunny: true },
  { id: 'al-7854', name: "Misae Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7854.jpg", gender: 'girl', isFunny: true },
  { id: 'al-7855', name: "Himawari Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7855.jpg", gender: 'girl', isFunny: true },
  { id: 'al-33466', name: "Hiroshi Nohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/33466.jpg", gender: 'boy', isFunny: true },
  { id: 'al-7853', name: "Bou-chan", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7853-dQihKEkfF8Hk.png", gender: 'boy', isFunny: true },
  { id: 'al-7856', name: "Shiro", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7856.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7858', name: "Action Kamen", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7858-sNAVairhN9zU.png", gender: 'boy', isFunny: true },
  { id: 'al-7860', name: "Moeko Sakurada", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7860.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7861', name: "Nene Sakurada", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7861-J50MV4iGXl5U.png", gender: 'girl', isFunny: true },
  { id: 'al-7862', name: "Tooru Kazama", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7862-knP9WiZVuaVN.png", gender: 'neutral', isFunny: true },
  { id: 'al-7863', name: "Masao Sato", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7863.jpg", gender: 'boy', isFunny: true },
  { id: 'al-7865', name: "Nanako Oohara", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7865.jpg", gender: 'girl', isFunny: true },
  { id: 'al-7867', name: "Midori Yoshinaga", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7867.jpg", gender: 'girl', isFunny: true },
  { id: 'al-7870', name: "Ume Matsuzaka", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7870.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7872', name: "Masumi Ageo", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7872.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7875', name: "Mimiko Sakura", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7875.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7877', name: "Ai Suotome", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7877.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-7880', name: "Bunta Takakura", category: "Crayon Shin-chan", url: "https://s4.anilist.co/file/anilistcdn/character/large/7880.jpg", gender: 'neutral', isFunny: true },
  { id: 'al-4303', name: "Nobita Nobi", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/4303.jpg", gender: 'boy', isFunny: true },
  { id: 'al-4304', name: "Doraemon", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b4304-4eXX8C1O4Pda.png", gender: 'boy', isFunny: true },
  { id: 'al-8260', name: "Shizuka Minamoto", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8260-Hz17eZuElZ7U.png", gender: 'girl', isFunny: true },
  { id: 'al-8261', name: "Suneo Honekawa", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8261-qGxKWau5iZrf.png", gender: 'boy', isFunny: true },
  { id: 'al-8262', name: "Takeshi Gouda", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8262-N2Lsf46EjZBf.png", gender: 'boy', isFunny: true },
  { id: 'al-31870', name: "Hidetoshi Dekisugi", category: "Doraemon", url: "https://s4.anilist.co/file/anilistcdn/character/large/b31870-GGFedy239Ddk.png", gender: 'boy', isFunny: true },
  { id: 'al-40', name: "Luffy Monkey", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png", gender: 'boy', isFunny: true },
  { id: 'al-61', name: "Robin Nico", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b61-ywXUyyocEEqt.png", gender: 'girl', isFunny: true },
  { id: 'al-62', name: "Zoro Roronoa", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b62-S7oAeA9WInjV.png", gender: 'boy', isFunny: true },
  { id: 'al-64', name: "Franky", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/n64-ChX6ZzHHjXqA.png", gender: 'boy', isFunny: true },
  { id: 'al-305', name: "Sanji", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b305-6lisPmHtCnLT.png", gender: 'boy' },
  { id: 'al-309', name: "Chopper Tony Tony", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b309-H64NhbJ2ywIQ.jpg", gender: 'boy' },
  { id: 'al-723', name: "Nami", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b723-vp5hPptgnNEC.png", gender: 'girl' },
  { id: 'al-724', name: "Usopp", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b724-GFGgI9AJQkfy.jpg", gender: 'boy' },
  { id: 'al-5627', name: "Brook", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5627-av8oD3zhKvDl.png", gender: 'boy' },
  { id: 'al-18938', name: "Jinbe", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b18938-yZANEfjsVhW4.png", gender: 'boy' },
  { id: 'al-725', name: "Buggy", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/n725-g04AaiaK5f9B.png", gender: 'boy' },
  { id: 'al-726', name: "Vivi Nefertari", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b726-DqAIpscMuYYx.png", gender: 'girl' },
  { id: 'al-727', name: "Shanks", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b727-wUJx7M1z5xON.png", gender: 'boy' },
  { id: 'al-1541', name: "Enel", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1541-6c8RouunoL88.jpg", gender: 'boy' },
  { id: 'al-2064', name: "Dracule Mihawk", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/n2064-OpnF4nLi6bvL.png", gender: 'boy' },
  { id: 'al-2072', name: "Ace Portgas", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2072-Lc6jEdsueJUK.jpg", gender: 'boy' },
  { id: 'al-2519', name: "Kuro", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2519-OfgRt6mP6Ae8.jpg", gender: 'boy' },
  { id: 'al-2748', name: "Bellamy", category: "One Piece", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2748-vnCKira7yjrp.jpg", gender: 'boy' },
  { id: 'al-17', name: "Naruto Uzumaki", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png", gender: 'boy' },
  { id: 'al-13', name: "Sasuke Uchiha", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png", gender: 'boy' },
  { id: 'al-145', name: "Sakura Haruno", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b145-IorfpI8arxeX.png", gender: 'girl' },
  { id: 'al-85', name: "Kakashi Hatake", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b85-mkVBh2yjxjmx.png", gender: 'boy' },
  { id: 'al-14', name: "Itachi Uchiha", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png", gender: 'boy' },
  { id: 'al-306', name: "Rock Lee", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b306-oUTOO45xInXt.png", gender: 'boy' },
  { id: 'al-307', name: "Guy Might", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b307-xieUEdhdTVwQ.png", gender: 'boy' },
  { id: 'al-728', name: "Zabuza Momochi", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b728-zHw77BzLzQKT.jpg", gender: 'boy' },
  { id: 'al-809', name: "Anko Mitarashi", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b809-FhWTN0LFVzRa.png", gender: 'girl' },
  { id: 'al-1555', name: "Hinata Hyuuga", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1555-Q41GLTV3FvYF.png", gender: 'girl' },
  { id: 'al-1662', name: "Gaara", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1662-4E5J0LX9jZKZ.png", gender: 'boy' },
  { id: 'al-1694', name: "Neji Hyuuga", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1694-TL4obouDwJ7k.jpg", gender: 'boy' },
  { id: 'al-1900', name: "Sasori", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1900-Dpd9wVWtlvIx.png", gender: 'boy' },
  { id: 'al-1901', name: "Sai", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1901-vJRGRONNpaiG.jpg", gender: 'boy' },
  { id: 'al-1902', name: "Deidara", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1902-JsEFRFwjmtZJ.png", gender: 'boy' },
  { id: 'al-1903', name: "Suigetsu Houzuki", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/1903.jpg", gender: 'boy' },
  { id: 'al-2006', name: "Yamato", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2006-FTCz2Eu3cXsI.png", gender: 'boy' },
  { id: 'al-2007', name: "Shikamaru Nara", category: "Naruto", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2007-QaesJlIZDifj.jpg", gender: 'boy' },
  { id: 'al-246', name: "Gokuu Son", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/246-wsRRr6z1kii8.png", gender: 'boy' },
  { id: 'al-913', name: "Vegeta", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/b913-NIFkKazWM8VO.png", gender: 'boy' },
  { id: 'al-914', name: "Piccolo", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/b914-KuS8AWjqBrqa.jpg", gender: 'boy' },
  { id: 'al-2093', name: "Gohan Son", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2093-kdFZhqcNSsqW.png", gender: 'boy' },
  { id: 'al-2159', name: "Kuririn", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2159-qtEuMYyOUkwY.jpg", gender: 'boy' },
  { id: 'al-677', name: "Pu'ar", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/b677-PTNZaPeuV1Dx.jpg", gender: 'girl' },
  { id: 'al-678', name: "Bulma", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/b678-2YCe13F0tFos.jpg", gender: 'girl' },
  { id: 'al-1012', name: "Majin Boo", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/1012.jpg", gender: 'neutral' },
  { id: 'al-2094', name: "Gyuumaou", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2094.jpg", gender: 'neutral' },
  { id: 'al-2095', name: "Suno", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2095.jpg", gender: 'neutral' },
  { id: 'al-2096', name: "Upa", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2096.jpg", gender: 'neutral' },
  { id: 'al-2097', name: "Yajirobe", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2097.jpg", gender: 'neutral' },
  { id: 'al-2099', name: "Jinzouningen 16-gou", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2099.jpg", gender: 'boy' },
  { id: 'al-2100', name: "Bee", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2100.jpg", gender: 'neutral' },
  { id: 'al-2101', name: "Bora", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2101-VF2lGo5GXtkT.png", gender: 'boy' },
  { id: 'al-2102', name: "Chi-Chi", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2102.jpg", gender: 'girl' },
  { id: 'al-2103', name: "Briefs Hakase", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2103.jpg", gender: 'boy' },
  { id: 'al-2104', name: "Gohan Son", category: "Dragon Ball", url: "https://s4.anilist.co/file/anilistcdn/character/large/2104.jpg", gender: 'neutral' },
  { id: 'al-126071', name: "Tanjirou Kamado", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b126071-BTNEc1nRIv68.png", gender: 'boy' },
  { id: 'al-127518', name: "Nezuko Kamado", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b127518-NRlq1CQ1v1ro.png", gender: 'girl' },
  { id: 'al-129130', name: "Inosuke Hashibira", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/n129130-SJC0Kn1DU39E.jpg", gender: 'boy' },
  { id: 'al-129131', name: "Zenitsu Agatsuma", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b129131-FZrQ7lSlxmEr.png", gender: 'boy' },
  { id: 'al-129132', name: "Muzan Kibutsuji", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b129132-4nIZakUZ1o8W.jpg", gender: 'boy' },
  { id: 'al-129133', name: "Kyoujurou Rengoku", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b129133-VlTPowwt68rJ.png", gender: 'boy' },
  { id: 'al-130050', name: "Giyuu Tomioka", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b130050-qsLThJs5VIbz.png", gender: 'boy' },
  { id: 'al-136069', name: "Muichirou Tokitou", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136069-6PLglx4tETUX.png", gender: 'boy' },
  { id: 'al-136070', name: "Shinobu Kochou", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136070-MC9LLxJsHyHE.png", gender: 'girl' },
  { id: 'al-136071', name: "Tengen Uzui", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136071-99Kexnnn2PiV.png", gender: 'boy' },
  { id: 'al-136072', name: "Mitsuri Kanroji", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136072-xVwyRUKdpybi.png", gender: 'girl' },
  { id: 'al-137773', name: "Sakonji Urokodaki", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137773-N4O52f73dJKZ.png", gender: 'boy' },
  { id: 'al-137774', name: "Sanemi Shinazugawa", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137774-O1iYrnGLB71l.png", gender: 'boy' },
  { id: 'al-137775', name: "Jigorou Kuwajima", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137775-WVj9nyVaYo45.png", gender: 'boy' },
  { id: 'al-137776', name: "Genya Shinazugawa", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137776-E0QuFD7y19OQ.jpg", gender: 'boy' },
  { id: 'al-137777', name: "Obanai Iguro", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137777-kGViiNyx0wa7.jpg", gender: 'boy' },
  { id: 'al-137778', name: "Gyoumei Himejima", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137778-H4Uzb9cSCvZ6.jpg", gender: 'boy' },
  { id: 'al-137806', name: "Makomo", category: "Demon Slayer", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137806-43Lqae34Vzqu.png", gender: 'neutral' },
  { id: 'al-126635', name: "Megumi Fushiguro", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b126635-L0y3I92JSUkN.png", gender: 'boy' },
  { id: 'al-127212', name: "Yuuji Itadori", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b127212-FVm2tD0erQ5B.png", gender: 'boy' },
  { id: 'al-127691', name: "Satoru Gojou", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png", gender: 'boy' },
  { id: 'al-133700', name: "Nobara Kugisaki", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b133700-f6sOO3TcgLV6.png", gender: 'girl' },
  { id: 'al-133699', name: "Suguru Getou", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b133699-FCnXaISgazAi.png", gender: 'boy' },
  { id: 'al-133701', name: "Sukuna", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b133701-rCQuDpHr3UZL.png", gender: 'boy' },
  { id: 'al-133702', name: "Mahito", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b133702-Y7JRG5vAvjIL.png", gender: 'boy' },
  { id: 'al-133704', name: "Kento Nanami", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b133704-8wLTGjc234q2.png", gender: 'boy' },
  { id: 'al-134167', name: "Maki Zenin", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b134167-5TCytk45YByD.png", gender: 'girl' },
  { id: 'al-134168', name: "Mai Zenin", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b134168-FdWz5w2LqpeF.jpg", gender: 'girl' },
  { id: 'al-137974', name: "Panda", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137974-9qnK3DPrvLKh.jpg", gender: 'boy' },
  { id: 'al-137975', name: "Aoi Toudou", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137975-6TH7PiLWJaqy.png", gender: 'boy' },
  { id: 'al-156848', name: "Kasumi Miwa", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b156848-Rf0tuoQCNyZV.png", gender: 'girl' },
  { id: 'al-156991', name: "Jougo", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b156991-niYjdp9CxO4w.png", gender: 'boy' },
  { id: 'al-157115', name: "Toge Inumaki", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157115-kdhRYQdVhH95.png", gender: 'boy' },
  { id: 'al-157116', name: "Chousou", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157116-2jYQf3y8NeTZ.png", gender: 'boy' },
  { id: 'al-157214', name: "Junpei Yoshino", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157214-ROBNoXVEXRNy.jpg", gender: 'boy' },
  { id: 'al-157215', name: "Mei Mei", category: "Jujutsu Kaisen", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157215-I3TQJu8nkDwD.jpg", gender: 'girl' },
  { id: 'al-40882', name: "Eren Yeager", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b40882-dsj7IP943WFF.jpg", gender: 'boy' },
  { id: 'al-40881', name: "Mikasa Ackerman", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b40881-F3gr1PkreDvj.png", gender: 'girl' },
  { id: 'al-46494', name: "Armin Arlert", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b46494-g7xYYuBtYPnO.png", gender: 'boy' },
  { id: 'al-45627', name: "Levi", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b45627-CR68RyZmddGG.png", gender: 'boy' },
  { id: 'al-45887', name: "Sasha Blouse", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b45887-QPtJH0KwqthW.jpg", gender: 'girl' },
  { id: 'al-46484', name: "Reiner Braun", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b46484-P6A2GjNQn49F.png", gender: 'boy' },
  { id: 'al-46486', name: "Connie Springer", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/n46486-izhPjzut6WCZ.png", gender: 'boy' },
  { id: 'al-46488', name: "Bertolt Hoover", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b46488-wm6HvkdkHoZu.jpg", gender: 'boy' },
  { id: 'al-46490', name: "Annie Leonhart", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b46490-tan274Ifc1Jf.jpg", gender: 'girl' },
  { id: 'al-46492', name: "Hannes", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b46492-5kRaMLDCVD0B.jpg", gender: 'boy' },
  { id: 'al-46496', name: "Erwin Smith", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b46496-Mu86MENd5wNB.png", gender: 'boy' },
  { id: 'al-46498', name: "Jean Kirstein", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b46498-ritqAj9FW6jX.png", gender: 'boy' },
  { id: 'al-62475', name: "Carla Yeager", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/n62475-CExspVnLfweu.png", gender: 'girl' },
  { id: 'al-62477', name: "Grisha Yeager", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b62477-3AHBGul9bXK8.jpg", gender: 'boy' },
  { id: 'al-62479', name: "Marco Bott", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b62479-mYcTkU1RXymL.jpg", gender: 'boy' },
  { id: 'al-62481', name: "Krista Lenz", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b62481-ZZDa7vn17lMU.png", gender: 'girl' },
  { id: 'al-62483', name: "Thomas Wagner", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b62483-zpSlfucUEgwQ.png", gender: 'boy' },
  { id: 'al-62485', name: "Dot Pixis", category: "Attack on Titan", url: "https://s4.anilist.co/file/anilistcdn/character/large/b62485-I0U5Cat3z65K.png", gender: 'boy' },
  { id: 'al-89028', name: "Izuku Midoriya", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89028-8w1I9o1ISHMg.png", gender: 'boy' },
  { id: 'al-88892', name: "Katsuki Bakugou", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b88892-bdOha3lNcaN6.png", gender: 'boy' },
  { id: 'al-89221', name: "Ochako Uraraka", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89221-gSF2a4gPbG4m.png", gender: 'girl' },
  { id: 'al-89224', name: "Toshinori Yagi", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89224-K6KEuQAuYKzq.jpg", gender: 'boy' },
  { id: 'al-89220', name: "Shouto Todoroki", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89220-KNBwaVFAR8FD.png", gender: 'boy' },
  { id: 'al-89222', name: "Tenya Iida", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89222-TL8MQM3wJgEB.png", gender: 'boy' },
  { id: 'al-89223', name: "Tsuyu Asui", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89223-5762vburxnlz.png", gender: 'girl' },
  { id: 'al-89225', name: "Shouta Aizawa", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89225-XBgvUhI9naVI.png", gender: 'boy' },
  { id: 'al-89226', name: "Tomura Shigaraki", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89226-C1ZKm2U3bR4T.png", gender: 'boy' },
  { id: 'al-89240', name: "Nomu (U.S.J.)", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89240-OppJU1hLa2RM.png", gender: 'neutral' },
  { id: 'al-89241', name: "Momo Yaoyorozu", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89241-Q8KzAfX4Qe2y.png", gender: 'girl' },
  { id: 'al-89243', name: "Eijirou Kirishima", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89243-QLmUyyZk5K2l.png", gender: 'boy' },
  { id: 'al-89244', name: "Minoru Mineta", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89244-VVwK9loDHeTV.png", gender: 'boy' },
  { id: 'al-89247', name: "Mina Ashido", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89247-hu5MCqfoN82E.png", gender: 'girl' },
  { id: 'al-89249', name: "Denki Kaminari", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89249-Ygc30RlYoFta.png", gender: 'boy' },
  { id: 'al-89895', name: "Hanta Sero", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89895-DpFrgTelc9Qx.png", gender: 'boy' },
  { id: 'al-89896', name: "Mashirao Ojiro", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89896-3QzT5nSEPjcr.png", gender: 'boy' },
  { id: 'al-89897', name: "Kyouka Jirou", category: "My Hero Academia", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89897-5vU7N3ayiKRr.png", gender: 'girl' },
  { id: 'al-5', name: "Ichigo Kurosaki", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5-a7bkJgjhhigE.png", gender: 'boy' },
  { id: 'al-6', name: "Rukia Kuchiki", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b6-25WoBeWMZXBc.png", gender: 'girl' },
  { id: 'al-7', name: "Orihime Inoue", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b7-JdR4betokDjR.jpg", gender: 'girl' },
  { id: 'al-564', name: "Uryuu Ishida", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b564-a6LJitrjSfKC.jpg", gender: 'boy' },
  { id: 'al-575', name: "Yasutora Sado", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/575.jpg", gender: 'boy' },
  { id: 'al-906', name: "Renji Abarai", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b906-ImRjx5HFM8X6.png", gender: 'boy' },
  { id: 'al-210', name: "Kisuke Urahara", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b210-mw01NrQfRjzT.png", gender: 'boy' },
  { id: 'al-245', name: "Toushirou Hitsugaya", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b245-buy3Cfn6IFSB.jpg", gender: 'boy' },
  { id: 'al-904', name: "Rangiku Matsumoto", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b904-bdfi2xqHicCj.png", gender: 'girl' },
  { id: 'al-905', name: "Soi Fon", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b905-zKwCoIRiYJSr.png", gender: 'girl' },
  { id: 'al-907', name: "Byakuya Kuchiki", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b907-kgnDKeMtEN5y.png", gender: 'boy' },
  { id: 'al-908', name: "Yoruichi Shihouin", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b908-JSYUkJLCw1f0.png", gender: 'girl' },
  { id: 'al-909', name: "Kenpachi Zaraki", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b909-slhoFBon7oiH.jpg", gender: 'boy' },
  { id: 'al-910', name: "Yachiru Kusajishi", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b910-cAC9g4i208Ou.png", gender: 'girl' },
  { id: 'al-911', name: "Zangetsu", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b911-KgzOcvf4jhOh.png", gender: 'boy' },
  { id: 'al-1080', name: "Grimmjow Jaegerjaquez", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1080-JUNo2Or0UGZg.jpg", gender: 'boy' },
  { id: 'al-1081', name: "Ulquiorra Cifer", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1081-xLTqHfLL2I2W.png", gender: 'boy' },
  { id: 'al-1082', name: "Wonderweiss Margela", category: "Bleach", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1082-3wZlPgmoNW1j.png", gender: 'boy' },
  { id: 'al-30', name: "Gon Freecss", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b30-lyFExKyDhefc.jpg", gender: 'boy' },
  { id: 'al-27', name: "Killua Zoldyck", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b27-Z5O02kQUydpT.jpg", gender: 'boy' },
  { id: 'al-28', name: "Kurapika", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b28-ivA7UGnfE40a.png", gender: 'boy' },
  { id: 'al-29', name: "Leorio Paradinight", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b29-RgzoSeKmDYzl.jpg", gender: 'boy' },
  { id: 'al-31', name: "Hisoka Morow", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b31-FZckOuu7L1un.png", gender: 'boy' },
  { id: 'al-26', name: "Ging Freecss", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/26-VpZXIwOdcz8p.jpg", gender: 'boy' },
  { id: 'al-57', name: "Illumi Zoldyck", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b57-pTFguojSOQZW.png", gender: 'boy' },
  { id: 'al-58', name: "Chrollo Lucilfer", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b58-USOmsz3nursi.jpg", gender: 'boy' },
  { id: 'al-59', name: "Zeno Zoldyck", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/n59-6mnrlhnGe2mw.png", gender: 'boy' },
  { id: 'al-60', name: "Silva Zoldyck", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/60.jpg", gender: 'boy' },
  { id: 'al-3195', name: "Feitan Portor", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/3195.jpg", gender: 'boy' },
  { id: 'al-5827', name: "Bonolenov Ndongo", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/5827.jpg", gender: 'boy' },
  { id: 'al-5828', name: "Franklin Bordeaux", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/n5828-cMOh5ifgAEW1.png", gender: 'neutral' },
  { id: 'al-5829', name: "Kortopi", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/n5829-ubGjeYxlPnxL.png", gender: 'neutral' },
  { id: 'al-5830', name: "Machi Komacine", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5830-IEl8BCasHZvG.png", gender: 'girl' },
  { id: 'al-5831', name: "Nobunaga Hazama", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/n5831-COYqtVagw99J.png", gender: 'boy' },
  { id: 'al-5832', name: "Shalnark Ryuseih", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/5832.jpg", gender: 'boy' },
  { id: 'al-5833', name: "Shizuku Murasaki", category: "Hunter × Hunter", url: "https://s4.anilist.co/file/anilistcdn/character/large/5833.jpg", gender: 'neutral' },
  { id: 'al-11', name: "Edward Elric", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b11-TA5Nuk7EDUZG.jpg", gender: 'boy' },
  { id: 'al-12', name: "Alphonse Elric", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b12-tCKu8yK5kFL5.jpg", gender: 'boy' },
  { id: 'al-63', name: "Winry Rockbell", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/63-xloedtYxiJ2E.jpg", gender: 'girl' },
  { id: 'al-65', name: "Pinako Rockbell", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b65-Yw7j20Y9uewh.png", gender: 'girl' },
  { id: 'al-66', name: "Scar", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b66-bLbGWXrmDqfV.png", gender: 'boy' },
  { id: 'al-67', name: "Izumi Curtis", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b67-ggB3aC6DzQqB.png", gender: 'girl' },
  { id: 'al-68', name: "Roy Mustang", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b68-moBLY2WO2am3.png", gender: 'boy' },
  { id: 'al-69', name: "Maes Hughes", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b69-MRetSG8Qevvu.png", gender: 'boy' },
  { id: 'al-70', name: "Riza Hawkeye", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b70-k4bCgDspyOdI.png", gender: 'girl' },
  { id: 'al-351', name: "Greed", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b351-XMQzTuMy2Xtn.jpg", gender: 'neutral' },
  { id: 'al-650', name: "Lust", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b650-viEy6bOIcGiU.png", gender: 'girl' },
  { id: 'al-651', name: "Envy", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b651-S4mzVOTMzej6.png", gender: 'neutral' },
  { id: 'al-2079', name: "Alex Louis Armstrong", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2079-RnhPS44vyqpJ.jpg", gender: 'boy' },
  { id: 'al-2439', name: "Grand Basque", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2439-ETW3tuNekJ1w.jpg", gender: 'boy' },
  { id: 'al-3292', name: "Lan Fan", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b3292-aK72k3syf1qP.png", gender: 'girl' },
  { id: 'al-3293', name: "Ling Yao", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b3293-2GiFTmLQnBw8.jpg", gender: 'boy' },
  { id: 'al-3696', name: "Shou Tucker", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/b3696-FXnbdWQXziOr.jpg", gender: 'neutral' },
  { id: 'al-3934', name: "Olivier Mira Armstrong", category: "Fullmetal Alchemist", url: "https://s4.anilist.co/file/anilistcdn/character/large/n3934-MKTV6tQeP8T3.png", gender: 'girl' },
  { id: 'al-71', name: "L Lawliet", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/b71-1W4panC53vfs.png", gender: 'boy' },
  { id: 'al-75', name: "Ryuk", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/b75-IkEpzO21LgFy.jpg", gender: 'boy' },
  { id: 'al-80', name: "Light Yagami", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/b80-26EhwSsSqQ50.png", gender: 'boy' },
  { id: 'al-463', name: "Mihael Keehl", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/b463-QBLeLf6XxVg6.png", gender: 'boy' },
  { id: 'al-464', name: "Nate River", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n464-6KeJpU6g7Hwj.jpg", gender: 'boy' },
  { id: 'al-835', name: "Misa Amane", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/b835-CiZa8y2z2gCz.png", gender: 'girl' },
  { id: 'al-1904', name: "Teru Mikami", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1904-xKw2NgiE6VbU.jpg", gender: 'boy' },
  { id: 'al-1905', name: "Rem", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1905-9GfCvLFKNRLR.png", gender: 'girl' },
  { id: 'al-1906', name: "Touta Matsuda", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1906-JCWKEGGook3Z.png", gender: 'boy' },
  { id: 'al-1927', name: "Souichirou Yagami", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1927-iaIWrFITyeJw.jpg", gender: 'boy' },
  { id: 'al-1928', name: "Kyosuke Higuchi", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1928-u4ybFpwCKqg2.png", gender: 'boy' },
  { id: 'al-1929', name: "Reiji Namikawa", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1929-TYRt1UCHOS33.png", gender: 'boy' },
  { id: 'al-1930', name: "Arayoshi Hatori", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1930-1ILYLHyqkMQb.png", gender: 'boy' },
  { id: 'al-1931', name: "Masahiko Kida", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1931-kJH9pspSPKMJ.png", gender: 'boy' },
  { id: 'al-1932', name: "Tierry Morello", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1932-eeWL3KSOTlVx.jpg", gender: 'boy' },
  { id: 'al-1933', name: "Mary Kenwood", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1933-WNDtxqOr1d51.png", gender: 'girl' },
  { id: 'al-2179', name: "Quillsh Wammy", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/n2179-qF49l5qEurt5.png", gender: 'boy' },
  { id: 'al-2402', name: "Shidoh", category: "Death Note", url: "https://s4.anilist.co/file/anilistcdn/character/large/2402.jpg", gender: 'boy' },
  { id: 'al-130102', name: "Denji", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b130102-FO1VHNnEnLlB.png", gender: 'boy' },
  { id: 'al-137079', name: "Power", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137079-6yLEUYR3bmpr.png", gender: 'girl' },
  { id: 'al-137080', name: "Makima", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137080-UHcynYNjb5ZU.png", gender: 'girl' },
  { id: 'al-137081', name: "Aki Hayakawa", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137081-TSrUR3mUJL6r.png", gender: 'boy' },
  { id: 'al-170266', name: "Pochita", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b170266-bBXPkNJnd3mg.png", gender: 'boy' },
  { id: 'al-144596', name: "Himeno", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b144596-kvL6SD2litJu.png", gender: 'girl' },
  { id: 'al-144593', name: "Kishibe", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b144593-hdCTT9t54z0s.png", gender: 'boy' },
  { id: 'al-144594', name: "Kobeni Higashiyama", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b144594-0dbO1NSYeZ12.png", gender: 'girl' },
  { id: 'al-174263', name: "Hirokazu Arai ", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b174263-TTMWfBlU1k3f.png", gender: 'boy' },
  { id: 'al-157241', name: "Samurai Sword", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157241-GkgQVzkFrmUD.jpg", gender: 'boy' },
  { id: 'al-174264', name: "Akane Sawatari ", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b174264-dLiZkMXoltQ9.png", gender: 'girl' },
  { id: 'al-152231', name: "Tenshi no Akuma", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b152231-vHM4WlaYIVB5.jpg", gender: 'boy' },
  { id: 'al-157231', name: "Bouryoku no Majin", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157231-hV81SwGqxl2R.jpg", gender: 'boy' },
  { id: 'al-157232', name: "Beam", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157232-5GuWeqoFN9Kq.jpg", gender: 'boy' },
  { id: 'al-157277', name: "Prinz", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157277-h6M1umQ3N2ve.jpg", gender: 'girl' },
  { id: 'al-172887', name: "Mirai no Akuma", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b172887-qMCjXPXMSKRk.png", gender: 'neutral' },
  { id: 'al-290671', name: "Kitsune no Akuma", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b290671-YaauAZvHLnyo.png", gender: 'girl' },
  { id: 'al-174282', name: "Zombie no Akuma", category: "Chainsaw Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b174282-YFLwuvogHMod.png", gender: 'neutral' },
  { id: 'al-73935', name: "Saitama", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b73935-ON5d0mAcrItd.jpg", gender: 'boy' },
  { id: 'al-73979', name: "Genos", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b73979-tVi9maPID881.jpg", gender: 'boy' },
  { id: 'al-74167', name: "Onsoku no Sonic", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b74167-FE8EtGtHUM77.png", gender: 'boy' },
  { id: 'al-81141', name: "Bang ", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/n81141-1ml7Q6X2B508.png", gender: 'boy' },
  { id: 'al-81929', name: "Tatsumaki", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b81929-WPVp2LQoWgkc.png", gender: 'girl' },
  { id: 'al-75460', name: "Sneck", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b75460-ytg6vTtJNGOw.png", gender: 'boy' },
  { id: 'al-8060', name: "Genus Hakase", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8060-iDyX1I8DLArA.jpg", gender: 'boy' },
  { id: 'al-8061', name: "Juu Ou", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8061-ltzWf7jD25OV.jpg", gender: 'boy' },
  { id: 'al-8841', name: "Butagami", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8841-sm1m2mVez5IE.jpg", gender: 'boy' },
  { id: 'al-11830', name: "Zeniru", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b11830-CeIgdur4As61.jpg", gender: 'boy' },
  { id: 'al-12985', name: "Kanirante", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b12985-avf1uxHrcvLd.jpg", gender: 'boy' },
  { id: 'al-13124', name: "Kuseno Hakase", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b13124-AjG67JtCz0bK.jpg", gender: 'boy' },
  { id: 'al-13125', name: "Vaccine Man", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b13125-LU5mxTholX4R.jpg", gender: 'boy' },
  { id: 'al-81931', name: "Fubuki", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b81931-fmouMoprPVbV.png", gender: 'girl' },
  { id: 'al-81933', name: "Bofoi", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/81933.jpg", gender: 'boy' },
  { id: 'al-81935', name: "Satoru", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b81935-NGDgB9J4MMlF.png", gender: 'boy' },
  { id: 'al-81939', name: "Tanktop Tiger", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b81939-O5EORVRLJKne.jpg", gender: 'boy' },
  { id: 'al-81941', name: "Tanktop Black Hole", category: "One Punch Man", url: "https://s4.anilist.co/file/anilistcdn/character/large/b81941-RcCOvo4G42mY.jpg", gender: 'boy' },
  { id: 'al-88572', name: "Emilia", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b88572-IzTwXEHSobRs.jpg", gender: 'girl' },
  { id: 'al-88573', name: "Subaru Natsuki", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b88573-F8yMTK9GhnTA.png", gender: 'boy' },
  { id: 'al-88575', name: "Rem", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b88575-Ayu8UPDA8NS6.png", gender: 'girl' },
  { id: 'al-88576', name: "Ram", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b88576-NWkotUiJ3mK3.png", gender: 'girl' },
  { id: 'al-88574', name: "Felt", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b88574-Hau8t0GlMvhp.jpg", gender: 'girl' },
  { id: 'al-88577', name: "Reinhard van Astrea", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b88577-oKKnibqGgSSD.png", gender: 'boy' },
  { id: 'al-90170', name: "Petelgeuse Romanee-Conti", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90170-sHsO9ojQDLa3.jpg", gender: 'boy' },
  { id: 'al-90177', name: "Anastasia Hoshin", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90177-K1XztcZqHl3c.png", gender: 'girl' },
  { id: 'al-90178', name: "Aldebaran", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90178-olaN8k9RJRxo.png", gender: 'boy' },
  { id: 'al-90179', name: "Wilhelm van Astrea", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90179-dBqDPUn2i7dM.jpg", gender: 'boy' },
  { id: 'al-90180', name: "Elsa Granhiert", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90180-YXbXfcSlalav.png", gender: 'girl' },
  { id: 'al-90181', name: "Beatrice", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90181-wRPm0OEaucmw.png", gender: 'girl' },
  { id: 'al-90182', name: "Roswaal Mathers", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90182-Ho0NS06tc6NL.png", gender: 'boy' },
  { id: 'al-90183', name: "Julius Euclius", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90183-LWx59kSa5Vjl.png", gender: 'boy' },
  { id: 'al-90184', name: "Felix Argyle", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90184-o1ZFF6osCZX7.png", gender: 'boy' },
  { id: 'al-90185', name: "Crusch Karsten", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90185-FR9JHyNe5038.jpg", gender: 'girl' },
  { id: 'al-90186', name: "Priscilla Barielle", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90186-yr2PT4gI2qa3.png", gender: 'girl' },
  { id: 'al-90187', name: "Puck", category: "Re:Zero", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90187-xJXlD84KXl3t.jpg", gender: 'neutral' },
  { id: 'al-89103', name: "Momonga", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89103-ZsnA0r77GHsR.png", gender: 'boy' },
  { id: 'al-89121', name: "Shalltear Bloodfallen", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89121-N8hzLH4nfWna.png", gender: 'girl' },
  { id: 'al-89122', name: "Albedo", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89122-Gj7MBs7F5cMJ.png", gender: 'girl' },
  { id: 'al-89123', name: "Solution Epsilon", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89123-HyiNAMbKvj5E.png", gender: 'girl' },
  { id: 'al-89125', name: "Demiurge", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89125-pnLki4r5UyV5.png", gender: 'boy' },
  { id: 'al-89126', name: "Mare Bello Fiore", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89126-1WY1bWNYPg44.png", gender: 'boy' },
  { id: 'al-89129', name: "Aura Bella Fiora", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89129-2Qrm5TnoKYct.png", gender: 'girl' },
  { id: 'al-89138', name: "Cocytus", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89138-HUcvLWduh6Mc.png", gender: 'boy' },
  { id: 'al-89152', name: "Narberal Gamma", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89152-S3WrhOMakSCq.png", gender: 'girl' },
  { id: 'al-89154', name: "Pandora's Actor", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/89154-jbsFsEsjL3aS.jpg", gender: 'boy' },
  { id: 'al-89155', name: "Sebas Tian", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89155-yVyhseUF82s9.png", gender: 'boy' },
  { id: 'al-126281', name: "Entoma Vasilissa Zeta", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b126281-wjpp9rEaovPJ.jpg", gender: 'girl' },
  { id: 'al-126841', name: "Shizu Delta", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/126841-zO8B5EQgj2dj.jpg", gender: 'girl' },
  { id: 'al-126869', name: "Gazef Stronoff", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b126869-oKHjOvk80dD6.png", gender: 'boy' },
  { id: 'al-126870', name: "Lupusregina Beta", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/126870-DKc1B7cvoUu7.jpg", gender: 'girl' },
  { id: 'al-127437', name: "Touch Me", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/127437-HHvKoQEugGhN.jpg", gender: 'neutral' },
  { id: 'al-128263', name: "Brain Unglaus", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/b128263-CnJQGDZm6Wo1.png", gender: 'neutral' },
  { id: 'al-128288', name: "Yuri Alpha", category: "Overlord", url: "https://s4.anilist.co/file/anilistcdn/character/large/n128288-rxWuyLQkxYBL.jpg", gender: 'neutral' },
  { id: 'al-123285', name: "Asta", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b123285-tKijiuQErDS0.png", gender: 'boy' },
  { id: 'al-123283', name: "Noelle Silva", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b123283-7nJHtKha0LSm.png", gender: 'girl' },
  { id: 'al-123284', name: "Yuno", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b123284-w6kIFYnTclMd.png", gender: 'boy' },
  { id: 'al-124433', name: "Finral Roulacase", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124433-QyoZrgIUsSpd.png", gender: 'boy' },
  { id: 'al-124434', name: "Charlotte Roselei", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124434-ZmaDj2J5lSId.png", gender: 'girl' },
  { id: 'al-124435', name: "Julius Novachrono", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124435-gXFVXWrCcieK.jpg", gender: 'boy' },
  { id: 'al-124436', name: "Vanessa Enoteca", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124436-dES6CtprlZNy.png", gender: 'girl' },
  { id: 'al-124437', name: "Klaus Lunettes", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124437-3C1plJbD8jSn.png", gender: 'boy' },
  { id: 'al-124438', name: "Mimosa Vermillion", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124438-nTvKfJaMD4d5.jpg", gender: 'girl' },
  { id: 'al-124439', name: "Magna Swing", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124439-EqjbyC8GOKW0.jpg", gender: 'boy' },
  { id: 'al-124440', name: "Yami Sukehiro", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124440-Lpdo6y8cljV6.png", gender: 'boy' },
  { id: 'al-124441', name: "William Vangeance", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124441-nggzgZExhb1w.png", gender: 'boy' },
  { id: 'al-124442', name: "Nozel Silva", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124442-KpZhHmhjw2EG.png", gender: 'neutral' },
  { id: 'al-124443', name: "Lily Aquaria", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124443-T2JuU6c7Z9Tk.png", gender: 'girl' },
  { id: 'al-124444', name: "Grey", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124444-01PmRKd8Sned.jpg", gender: 'girl' },
  { id: 'al-124446', name: "Gauche Adlai", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124446-4YXFoCIllCKh.png", gender: 'boy' },
  { id: 'al-124447', name: "Charmy Pappitson", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124447-2J1PKMgWETNT.png", gender: 'girl' },
  { id: 'al-124448', name: "Gordon Agrippa", category: "Black Clover", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124448-YHRpWxJUhNnw.png", gender: 'boy' },
  { id: 'al-89364', name: "Kazuma Satou", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89364-7Th8Tv1XKJtt.png", gender: 'boy' },
  { id: 'al-89362', name: "Aqua", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89362-ibkc0eoECaW1.png", gender: 'girl' },
  { id: 'al-89361', name: "Megumin", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89361-tq8PQQ4MmF0M.png", gender: 'girl' },
  { id: 'al-89363', name: "Darkness", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89363-mm21Ll4NegUD.png", gender: 'girl' },
  { id: 'al-120655', name: "Wiz", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b120655-LfUD7Mb1Mncg.jpg", gender: 'girl' },
  { id: 'al-120657', name: "Luna", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b120657-xT7lUbz4uk0k.png", gender: 'girl' },
  { id: 'al-120658', name: "Eris", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b120658-SJ9YrXEluqaX.jpg", gender: 'girl' },
  { id: 'al-122424', name: "Sena", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/122424-hRsHYqmISnmG.png", gender: 'girl' },
  { id: 'al-126854', name: "Arakuremono", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/126854-AVwxFTMoGFMe.jpg", gender: 'neutral' },
  { id: 'al-136042', name: "Beldia", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136042-uqU81vphQIUY.jpg", gender: 'neutral' },
  { id: 'al-136043', name: "Keith", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136043-7R5IZmkW6MqE.png", gender: 'boy' },
  { id: 'al-136044', name: "Kyouya Mitsurugi", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136044-oWcFALodYp4n.jpg", gender: 'boy' },
  { id: 'al-136046', name: "Dust", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136046-lq9XrHBsalDn.png", gender: 'boy' },
  { id: 'al-203544', name: "Hakase", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b203544-VRqWI2UWx1SF.png", gender: 'boy' },
  { id: 'al-240105', name: "Rin", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b240105-qO8xrTa3Br8s.png", gender: 'girl' },
  { id: 'al-294249', name: "Lolisa", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b294249-RsTSbvKngm0z.png", gender: 'girl' },
  { id: 'al-307853', name: "Fio", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b307853-tMffbuM9RA0q.png", gender: 'girl' },
  { id: 'al-307854', name: "Cremea", category: "Konosuba", url: "https://s4.anilist.co/file/anilistcdn/character/large/b307854-DCNtKCNmTOIw.png", gender: 'girl' },
  { id: 'al-145342', name: "Takemichi Hanagaki", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b145342-GSUutL83jGgI.png", gender: 'boy' },
  { id: 'al-145341', name: "Manjirou Sano", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b145341-CuPldCLZMvvf.png", gender: 'boy' },
  { id: 'al-145345', name: "Ken Ryuuguji", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b145345-zyirrSsKIDCb.png", gender: 'boy' },
  { id: 'al-138453', name: "Hinata Tachibana", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138453-MFISjDiAEfiM.png", gender: 'girl' },
  { id: 'al-145343', name: "Keisuke Baji", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b145343-vRrkdWEUXwYM.jpg", gender: 'boy' },
  { id: 'al-145344', name: "Chifuyu Matsuno", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b145344-q4BqRljEBYNc.png", gender: 'boy' },
  { id: 'al-167841', name: "Takashi Mitsuya", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b167841-Pp08TBnzGhK4.jpg", gender: 'boy' },
  { id: 'al-167843', name: "Naoto Tachibana", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b167843-w9Lc6OWif5zy.jpg", gender: 'boy' },
  { id: 'al-167846', name: "Kazutora Hanemiya", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b167846-k6G44c97MOug.jpg", gender: 'boy' },
  { id: 'al-168679', name: "Nahoya Kawata", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b168679-CRZktzv0DvBl.jpg", gender: 'boy' },
  { id: 'al-170483', name: "Tetta Kisaki", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b170483-mXcSRDNqVwCP.png", gender: 'boy' },
  { id: 'al-171920', name: "Atsushi Sendou", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b171920-wHxBvF8giJC4.png", gender: 'boy' },
  { id: 'al-171921', name: "Masataka Kiyomizu", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b171921-XYszdVg9q8TU.jpg", gender: 'boy' },
  { id: 'al-171922', name: "Takuya Yamamoto", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b171922-GROQGd6RnCUv.png", gender: 'boy' },
  { id: 'al-171923', name: "Nobutaka Osanai", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b171923-7ledIbSoL5Jq.jpg", gender: 'neutral' },
  { id: 'al-171924', name: "Emma Sano", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b171924-fouXHPz9y5of.png", gender: 'girl' },
  { id: 'al-171925', name: "Haruki Hayashida", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b171925-l21FnUg2rgPa.png", gender: 'boy' },
  { id: 'al-171926', name: "Makoto Suzuki", category: "Tokyo Revengers", url: "https://s4.anilist.co/file/anilistcdn/character/large/b171926-i6THiD0O8B2W.jpg", gender: 'boy' },
  { id: 'al-36765', name: "Kazuto Kirigaya", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36765-BnLbXg0Tzzh9.png", gender: 'boy' },
  { id: 'al-36828', name: "Asuna Yuuki", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36828-j5ib0adAzGMx.png", gender: 'girl' },
  { id: 'al-36831', name: "Suguha Kirigaya", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36831-JfyFU7gPPVmr.png", gender: 'girl' },
  { id: 'al-36829', name: "Akihiko Kayaba", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36829-X5zITNEQ7xij.png", gender: 'boy' },
  { id: 'al-36830', name: "Ryoutarou Tsuboi", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36830-41SWIDvhqOo4.png", gender: 'boy' },
  { id: 'al-36832', name: "Shouzou Yuuki", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36832-q664R7PQXI0o.png", gender: 'boy' },
  { id: 'al-36833', name: "Midori Kirigaya", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36833-SeO3lEvZD9m5.png", gender: 'girl' },
  { id: 'al-37681', name: "Keiko Ayano", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b37681-GDtOAN6NiJ9M.jpg", gender: 'girl' },
  { id: 'al-43892', name: "Yui", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b43892-Ig6ZMdUbQDO2.jpg", gender: 'girl' },
  { id: 'al-43906', name: "Rika Shinozaki", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b43906-15QwTm2ZFDse.png", gender: 'girl' },
  { id: 'al-54099', name: "Andrew Gilbert Mills", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/54099.jpg", gender: 'boy' },
  { id: 'al-54777', name: "Sachi", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b54777-MduA5ck1lJUy.png", gender: 'girl' },
  { id: 'al-54779', name: "Keita", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b54779-1uCYd8WjboiM.png", gender: 'boy' },
  { id: 'al-65169', name: "Diavel", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b65169-1pgUxA6JjpeA.png", gender: 'boy' },
  { id: 'al-65171', name: "Kibaou", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b65171-4gM7UgGDU6H5.png", gender: 'boy' },
  { id: 'al-66327', name: "Kuradeel", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/66327.jpg", gender: 'neutral' },
  { id: 'al-66645', name: "Tomo Hosaka", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b66645-Np9FjjBajBkd.jpg", gender: 'girl' },
  { id: 'al-67149', name: "Caynz", category: "Sword Art Online", url: "https://s4.anilist.co/file/anilistcdn/character/large/b67149-UcNSv3YWMl26.png", gender: 'neutral' },
  { id: 'al-10138', name: "Thorfinn Karlsefni", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b10138-zOPrka0ddZOR.png", gender: 'boy' },
  { id: 'al-13020', name: "Askeladd", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b13020-ZdiYlNmpRUNS.png", gender: 'boy' },
  { id: 'al-17438', name: "Canute Svenson", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b17438-NwyOSMxycmck.png", gender: 'boy' },
  { id: 'al-13021', name: "Thors Snorresson", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b13021-XJAVDHwMWek2.png", gender: 'boy' },
  { id: 'al-17440', name: "Thorkell", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b17440-XvYe5JY862ZT.png", gender: 'boy' },
  { id: 'al-19485', name: "Bjorn", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b19485-GqL2A0NKp3Tf.png", gender: 'boy' },
  { id: 'al-19486', name: "Leif Erikson", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b19486-XRzBNqoLb5Le.png", gender: 'boy' },
  { id: 'al-20704', name: "Willibald", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b20704-N5pntGOae3F4.jpg", gender: 'neutral' },
  { id: 'al-27876', name: "Ylva", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b27876-Oji0y5oi88oc.jpg", gender: 'neutral' },
  { id: 'al-27957', name: "Sweyn", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b27957-1eAJeuybBavR.png", gender: 'boy' },
  { id: 'al-82533', name: "Ragnar", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b82533-EN57FGoTIHn3.png", gender: 'boy' },
  { id: 'al-82537', name: "Floki", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b82537-8WGHoXQcaKNI.jpg", gender: 'neutral' },
  { id: 'al-140356', name: "Halfdan", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b140356-GtF803Q3VytA.png", gender: 'neutral' },
  { id: 'al-140357', name: "Ari", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b140357-4RwRiP5fFFhl.png", gender: 'boy' },
  { id: 'al-141589', name: "Helga", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b141589-z9PsqosVAEpr.jpg", gender: 'neutral' },
  { id: 'al-141590', name: "Asgeir", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b141590-2XC1g81PDAnu.png", gender: 'boy' },
  { id: 'al-141591', name: "Torgrim", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b141591-N9phXav8yAv5.png", gender: 'boy' },
  { id: 'al-141592', name: "Atli", category: "Vinland Saga", url: "https://s4.anilist.co/file/anilistcdn/character/large/b141592-mCB6PhQSb0z0.png", gender: 'neutral' },
  { id: 'al-5186', name: "Lucy Heartfilia", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5186-izgXf2S86K9u.png", gender: 'girl' },
  { id: 'al-5187', name: "Natsu Dragneel", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5187-y1OEdRu9sPN2.png", gender: 'boy' },
  { id: 'al-5188', name: "Happy", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5188-1jTaic3aJ7Ds.jpg", gender: 'boy' },
  { id: 'al-4839', name: "Gray Fullbuster", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b4839-p2SBgjdTxHxk.png", gender: 'boy' },
  { id: 'al-5189', name: "Erza Scarlet", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5189-GR1xdok9SFsN.jpg", gender: 'girl' },
  { id: 'al-28886', name: "Wendy Marvell", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b28886-unO1rEi3zdyF.jpg", gender: 'girl' },
  { id: 'al-22723', name: "Charlés", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b22723-tAU59GCaf2H4.png", gender: 'girl' },
  { id: 'al-9719', name: "Juvia Lockser", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b9719-xh4xqTV6byNl.png", gender: 'girl' },
  { id: 'al-16893', name: "Gajeel Redfox", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b16893-l9HhHQ8j09H5.jpg", gender: 'boy' },
  { id: 'al-5190', name: "Mirajane Strauss", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5190-Xql1rGKUv1ql.png", gender: 'girl' },
  { id: 'al-5333', name: "Makarov Dreyar", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/5333.jpg", gender: 'boy' },
  { id: 'al-8296', name: "Cana Alberona", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8296-QdKicnM0gSGN.jpg", gender: 'girl' },
  { id: 'al-5334', name: "Elfman Strauss", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b5334-jJiCoq8kJAUB.png", gender: 'neutral' },
  { id: 'al-5879', name: "Plue", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/5879.jpg", gender: 'neutral' },
  { id: 'al-8293', name: "Ul", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/8293.jpg", gender: 'girl' },
  { id: 'al-8294', name: "Laxus Dreyar", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8294-24LS3f4VMrfs.jpg", gender: 'boy' },
  { id: 'al-8295', name: "Loke", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/b8295-pFDjOHun6jUr.jpg", gender: 'neutral' },
  { id: 'al-8297', name: "Mystogan", category: "Fairy Tail", url: "https://s4.anilist.co/file/anilistcdn/character/large/8297.jpg", gender: 'boy' },
  { id: 'al-129928', name: "Jin-U Seong", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b129928-BCEjVaP0AQSw.png", gender: 'boy' },
  { id: 'al-136074', name: "Ju-Hui Lee", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136074-pLyumEnxjL7P.png", gender: 'girl' },
  { id: 'al-136076', name: "Jin-Ho Yu", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136076-D7eiE3pA9U8g.jpg", gender: 'boy' },
  { id: 'al-138789', name: "Hae-In Cha", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138789-AhE8m0LWjE7E.png", gender: 'girl' },
  { id: 'al-136077', name: "Yun-Ho Baek", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136077-IIMqRmMK5Fgs.png", gender: 'boy' },
  { id: 'al-136819', name: "Jin-Cheol U", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136819-okbPuuFAefYX.png", gender: 'boy' },
  { id: 'al-138794', name: "Jong-In Choi", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138794-dZNdO0pvZ659.png", gender: 'boy' },
  { id: 'al-136073', name: "Chi-Yul Song", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b136073-0hZNgsWB9ZLH.png", gender: 'boy' },
  { id: 'al-138791', name: "Jin-A Seong", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138791-IngjgBQqGMWc.png", gender: 'girl' },
  { id: 'al-138792', name: "Geon-Hui Go", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138792-TXFrDA1wpbmo.png", gender: 'boy' },
  { id: 'al-148789', name: "Byeong-Gu Min", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b148789-HmGZf4RUzEFw.png", gender: 'boy' },
  { id: 'al-210102', name: "Sin Sang", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b210102-R479fvXo78Zn.png", gender: 'neutral' },
  { id: 'al-306673', name: "Beom-Shik Park", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b306673-eaq6may6XbTB.png", gender: 'boy' },
  { id: 'al-306674', name: "Sang-Sik Kim", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b306674-RaVc2MbWYjns.png", gender: 'boy' },
  { id: 'al-323043', name: "Eun-Seok", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b323043-1cRLO5gO0JSY.png", gender: 'boy' },
  { id: 'al-138793', name: "Song-I Han", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138793-eijpaPPkcipD.png", gender: 'girl' },
  { id: 'al-181155', name: "Tae-Shik Kang", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b181155-IkXnHuzG6he9.png", gender: 'boy' },
  { id: 'al-323582', name: "Seong-Chul Yun", category: "Solo Leveling", url: "https://s4.anilist.co/file/anilistcdn/character/large/b323582-7bCCR1xcTk1I.png", gender: 'neutral' },
  { id: 'al-90169', name: "Violet Evergarden", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b90169-4wr1Zehnsac8.png", gender: 'girl' },
  { id: 'al-124787', name: "Cattleya Baudelaire", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124787-1HuZGawvoejp.jpg", gender: 'girl' },
  { id: 'al-124788', name: "Benedict Blue", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124788-upZ5vtGwndzt.jpg", gender: 'neutral' },
  { id: 'al-124789', name: "Dietfried Bougainvillea", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124789-DLp0QEJZeiQ8.png", gender: 'neutral' },
  { id: 'al-124790', name: "Gilbert Bougainvillea", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124790-QR7zyemTK0zq.png", gender: 'neutral' },
  { id: 'al-124791', name: "Bridget", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124791-UZv7eQrf3b2J.jpg", gender: 'girl' },
  { id: 'al-124792', name: "Erica Brown", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124792-NWFK2r8zIxYX.jpg", gender: 'neutral' },
  { id: 'al-124793', name: "Iris Cannary", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/124793-dLsKOcQbMu85.png", gender: 'neutral' },
  { id: 'al-124794', name: "Iberis Conoway", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/124794-nNNzoCGufkAF.png", gender: 'neutral' },
  { id: 'al-124795', name: "Tiffany Evergarden", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/124795-TVTdrCVsDONn.jpg", gender: 'neutral' },
  { id: 'al-124798', name: "Dansei Kyaku", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124798-CKa1Jqfjm8nN.png", gender: 'boy' },
  { id: 'al-124799', name: "Claudia Hodgins", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124799-htaqVGZd83GW.jpg", gender: 'neutral' },
  { id: 'al-124801', name: "Lilian", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124801-RQQ3TxLi4d4y.jpg", gender: 'neutral' },
  { id: 'al-124803', name: "Iris no Mei", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124803-9qK35gh1KwkO.jpg", gender: 'neutral' },
  { id: 'al-124805', name: "Spencer Marlborough", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/124805-EouyBUScvHdi.png", gender: 'neutral' },
  { id: 'al-124806', name: "Bluebell Unoa", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/124806-s4r4rTM7JTwN.png", gender: 'neutral' },
  { id: 'al-124807', name: "Roland", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/124807-cTrQjEhuQC5e.jpg", gender: 'boy' },
  { id: 'al-124808', name: "Oliver", category: "Violet Evergarden", url: "https://s4.anilist.co/file/anilistcdn/character/large/b124808-zzb8RhH6z3LX.jpg", gender: 'neutral' },
  { id: 'al-121514', name: "Mitsuha Miyamizu", category: "Kimi no Na wa", url: "https://s4.anilist.co/file/anilistcdn/character/large/b121514-MGI7JRluscpz.png", gender: 'girl' },
  { id: 'al-121516', name: "Taki Tachibana", category: "Kimi no Na wa", url: "https://s4.anilist.co/file/anilistcdn/character/large/b121516-kuPVJLNsH5uE.png", gender: 'boy' },
  { id: 'al-672', name: "Gintoki Sakata", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b672-cP5VPriN67xJ.png", gender: 'boy' },
  { id: 'al-673', name: "Shinpachi Shimura", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b673-nScArSMt85kd.jpg", gender: 'boy' },
  { id: 'al-674', name: "Kagura", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b674-w8wCh0A5Qa8R.png", gender: 'girl' },
  { id: 'al-2651', name: "Sadaharu", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/n2651-e8BTqVZl8lK2.jpg", gender: 'boy' },
  { id: 'al-1533', name: "Kotarou Katsura", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1533-tSqUrj2DOK5p.png", gender: 'boy' },
  { id: 'al-1759', name: "Ayame Sarutobi", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/n1759-hbviRHbxGNmx.jpg", gender: 'girl' },
  { id: 'al-2282', name: "Sougo Okita", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2282-X0uYqwmwxiPo.png", gender: 'boy' },
  { id: 'al-2650', name: "Toushirou Hijikata", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2650-zgkj5l8mIOnn.png", gender: 'boy' },
  { id: 'al-2943', name: "Isao Kondou", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2943-QVEHBh0T6hPC.jpg", gender: 'boy' },
  { id: 'al-2944', name: "Tae Shimura", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/n2944-XzeaielhUwAV.jpg", gender: 'girl' },
  { id: 'al-2945', name: "Tatsuma Sakamoto", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2945-HS6t9u16Tdce.jpg", gender: 'boy' },
  { id: 'al-2946', name: "Elizabeth", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2946-Wr6RcgisCsbi.jpg", gender: 'neutral' },
  { id: 'al-2947', name: "Bansai Kawakami", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2947-sbdT3jDNmzS2.png", gender: 'boy' },
  { id: 'al-2948', name: "Shinsuke Takasugi", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2948-Er1xnL05k1oU.png", gender: 'boy' },
  { id: 'al-2949', name: "Matako Kijima", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/n2949-I6xXUlBaFuIh.jpg", gender: 'girl' },
  { id: 'al-2950', name: "Zenzou Hattori", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2950-MPIhNKfyJE2r.jpg", gender: 'boy' },
  { id: 'al-3760', name: "Taizou Hasegawa", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b3760-bxdyoPARX4Sx.png", gender: 'boy' },
  { id: 'al-4653', name: "Sagaru Yamazaki", category: "Gintama", url: "https://s4.anilist.co/file/anilistcdn/character/large/n4653-HTmFLlAViL0t.jpg", gender: 'boy' },
  { id: 'al-89', name: "Shinji Ikari", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b89-ZtZhXkh1rITn.png", gender: 'boy' },
  { id: 'al-1259', name: "Misato Katsuragi", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1259-afTQkZ5SVMOn.png", gender: 'girl' },
  { id: 'al-86', name: "Rei Ayanami", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/86-cA1zL7fyls8E.jpg", gender: 'girl' },
  { id: 'al-94', name: "Asuka Langley Souryuu", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b94-d631a3Z2KPvd.png", gender: 'girl' },
  { id: 'al-1250', name: "Kensuke Aida", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1250-GU74dqhQEaUN.png", gender: 'boy' },
  { id: 'al-1251', name: "Ritsuko Akagi", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/1251-gLa2Arv5E8a9.png", gender: 'girl' },
  { id: 'al-1252', name: "Shigeru Aoba", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/1252-gSQPK15PSOl9.png", gender: 'boy' },
  { id: 'al-1253', name: "Kohzou Fuyutsuki", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1253-4VmJuD5jUSvJ.png", gender: 'boy' },
  { id: 'al-1254', name: "Hikari Horaki", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1254-Ps0twCqNZZH2.png", gender: 'girl' },
  { id: 'al-1255', name: "Makoto Hyuuga", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1255-U6CSCHcOpUpS.png", gender: 'boy' },
  { id: 'al-1256', name: "Maya Ibuki", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/1256-7NjpwB5vSlPZ.png", gender: 'girl' },
  { id: 'al-1257', name: "Gendou Ikari", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1257-qByikcrE8KTG.png", gender: 'boy' },
  { id: 'al-1258', name: "Yui Ikari", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/1258-FiCAgSWsP2Xz.png", gender: 'girl' },
  { id: 'al-1260', name: "Ryouji Kaji", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1260-QCPCuARGDhqK.jpg", gender: 'boy' },
  { id: 'al-1261', name: "Kaworu Nagisa", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1261-HYRv3HpsSL92.jpg", gender: 'boy' },
  { id: 'al-1262', name: "Touji Suzuhara", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1262-srj1373Rz8dI.png", gender: 'boy' },
  { id: 'al-1892', name: "Pen Pen", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1892-sjqNrZpbddu8.png", gender: 'boy' },
  { id: 'al-3721', name: "Shiro Tokita", category: "Evangelion", url: "https://s4.anilist.co/file/anilistcdn/character/large/3721-247Ww1hFTqqS.png", gender: 'boy' },
  { id: 'al-1', name: "Spike Spiegel", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b1-ChxaldmieFlQ.png", gender: 'boy' },
  { id: 'al-2', name: "Faye Valentine", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2-0Iszg6Izgt4p.png", gender: 'girl' },
  { id: 'al-3', name: "Jet Black", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b3-JjH9Si9UM1NZ.png", gender: 'boy' },
  { id: 'al-16', name: "Edward Wong Hau Pepelu Tivrusky IV", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b16-80wd87nl1Rue.png", gender: 'girl' },
  { id: 'al-4', name: "Ein", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/4.jpg", gender: 'neutral' },
  { id: 'al-2734', name: "Vicious", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2734-aglO8RKNVxnn.jpg", gender: 'boy' },
  { id: 'al-2735', name: "Julia", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2735-0NRiXHK4PSWs.png", gender: 'neutral' },
  { id: 'al-2736', name: "Grencia Mars Elijah Guo Eckener", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b2736-0Eoluq9UxXu4.png", gender: 'neutral' },
  { id: 'al-6693', name: "Punch", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b6693-g9dxF2QkMkUZ.png", gender: 'neutral' },
  { id: 'al-6694', name: "Judy", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b6694-y0PmKzrcVa7A.png", gender: 'neutral' },
  { id: 'al-13249', name: "Appledelhi Siniz Hesap Lütfen", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b13249-cRGVNX7B9RRY.png", gender: 'neutral' },
  { id: 'al-15713', name: "Coffee", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b15713-UBG3R1CYJkYG.png", gender: 'neutral' },
  { id: 'al-18441', name: "Dr. Londez", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b18441-o4hphgnOerjz.png", gender: 'neutral' },
  { id: 'al-19117', name: "Bob", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b19117-h2JeUQavQxfz.png", gender: 'neutral' },
  { id: 'al-19118', name: "Bull", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b19118-5xDFbLvjIeLp.png", gender: 'neutral' },
  { id: 'al-19119', name: "Wen", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b19119-dTpS5sAhlTD2.jpg", gender: 'neutral' },
  { id: 'al-23611', name: "Udai Taxim", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b23611-mseTShkrE2H3.png", gender: 'neutral' },
  { id: 'al-23686', name: "Roco Bonnaro", category: "Cowboy Bebop", url: "https://s4.anilist.co/file/anilistcdn/character/large/b23686-kI8TJoYQ4G5v.png", gender: 'neutral' },
  { id: 'al-138101', name: "Loid Forger", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138101-7NCB0Md8zA6G.png", gender: 'boy' },
  { id: 'al-138102', name: "Yor Forger", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138102-ZOAu9jI2d5ke.png", gender: 'girl' },
  { id: 'al-138100', name: "Anya Forger", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b138100-4Li0tWRCa5bQ.png", gender: 'girl' },
  { id: 'al-150423', name: "Becky Blackbell", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b150423-RxXwrHzeLCss.jpg", gender: 'girl' },
  { id: 'al-150424', name: "Damian Desmond", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b150424-4B4psF6I4dgO.png", gender: 'boy' },
  { id: 'al-150425', name: "Yuuri Briar", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b150425-mP852peLh9eS.jpg", gender: 'boy' },
  { id: 'al-157887', name: "Sylvia Sherwood", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157887-P66pD0ilpmtZ.png", gender: 'girl' },
  { id: 'al-157888', name: "Franky Franklin", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b157888-zkSfIT5Z8y2S.png", gender: 'boy' },
  { id: 'al-180190', name: "Henry Henderson", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b180190-iQqPtTS182Et.jpg", gender: 'boy' },
  { id: 'al-180191', name: "Camilla", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b180191-peLZOpA3jmBO.png", gender: 'girl' },
  { id: 'al-180192', name: "Donovan Desmond", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b180192-nOvkTcotZyu0.png", gender: 'boy' },
  { id: 'al-213881', name: "Ewen Egeburg", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b213881-NrUwR51qHdkV.png", gender: 'boy' },
  { id: 'al-213882', name: "Emile Elman", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b213882-BoEgxd5783eU.png", gender: 'boy' },
  { id: 'al-270958', name: "Millie", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b270958-ByT3WQWfgQ17.png", gender: 'girl' },
  { id: 'al-270959', name: "Sharon", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b270959-LkuT2OdUE8qL.png", gender: 'girl' },
  { id: 'al-270960', name: "Dominic", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b270960-ZeCmPnuQp11T.png", gender: 'boy' },
  { id: 'al-270961', name: "Garden Tenchou", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b270961-npwGDaryVj6Q.png", gender: 'neutral' },
  { id: 'al-272642', name: "WISE Kyokuchou", category: "Spy x Family", url: "https://s4.anilist.co/file/anilistcdn/character/large/b272642-S4V3jLcHwzFx.jpg", gender: 'neutral' },
  { id: 'al-120649', name: "Kaguya Shinomiya", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b120649-NPaWaIpWy60E.png", gender: 'girl' },
  { id: 'al-121101', name: "Miyuki Shirogane", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b121101-Q8HzKP15At2d.png", gender: 'boy' },
  { id: 'al-121102', name: "Yuu Ishigami", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b121102-tiQFxnSEIAwm.png", gender: 'boy' },
  { id: 'al-121103', name: "Chika Fujiwara", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b121103-UGLxT8utLPnq.png", gender: 'girl' },
  { id: 'al-36309', name: "Narrator", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b36309-6KM0riV4lqfN.jpg", gender: 'neutral' },
  { id: 'al-121104', name: "Ai Hayasaka", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b121104-7TYRl3EEsDYU.png", gender: 'girl' },
  { id: 'al-126144', name: "Kei Shirogane", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b126144-4fc2sYUVFKOJ.png", gender: 'girl' },
  { id: 'al-134327', name: "Tsubasa Tanuma ", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b134327-5tqYKvBaqRe2.png", gender: 'boy' },
  { id: 'al-134329', name: "Moeha Fujiwara", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b134329-cRdrf5BqmIVk.png", gender: 'girl' },
  { id: 'al-134330', name: "Nagisa Kashiwagi", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b134330-2b7ad7GPw1Wl.png", gender: 'girl' },
  { id: 'al-134892', name: "Adolphe Pescarolo", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b134892-HSzCDOQagDJv.jpg", gender: 'boy' },
  { id: 'al-134893', name: "Shirogane no Chichi", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b134893-1dpk1sQ1pGRR.jpg", gender: 'boy' },
  { id: 'al-137169', name: "Saburo Odajima", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b137169-fQzfMsNROYyF.png", gender: 'boy' },
  { id: 'al-275597', name: "J Suzuki", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b275597-64W2GeSpgN5P.jpg", gender: 'boy' },
  { id: 'al-275598', name: "Miki", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b275598-Vc7wZ1e8WrXG.jpg", gender: 'girl' },
  { id: 'al-275602', name: "Shitsuji", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b275602-TmQDk1w5GGFV.jpg", gender: 'girl' },
  { id: 'al-125886', name: "Miko Iino", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b125886-TQbmqAaSgBLS.png", gender: 'girl' },
  { id: 'al-126986', name: "Erika Kose", category: "Kaguya-sama", url: "https://s4.anilist.co/file/anilistcdn/character/large/b126986-Pcspig2orfPq.png", gender: 'girl' },
  { id: 'al-176754', name: "Frieren", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b176754-PCnpqIOkjhFk.png", gender: 'girl' },
  { id: 'al-183965', name: "Fern", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b183965-uGFohBjlFoTp.png", gender: 'girl' },
  { id: 'al-184313', name: "Stark", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b184313-CQl6GSt4RSny.jpg", gender: 'boy' },
  { id: 'al-184310', name: "Heiter", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b184310-tiXvrq4FINXP.jpg", gender: 'boy' },
  { id: 'al-184311', name: "Himmel", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b184311-wQFySqYXEqf1.png", gender: 'boy' },
  { id: 'al-184312', name: "Eisen", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b184312-kxd5H6iOHIq4.png", gender: 'boy' },
  { id: 'al-205177', name: "Sein", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b205177-hLV4nVQjoBIC.png", gender: 'boy' },
  { id: 'al-391560', name: "Machi no Hito", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/default.jpg", gender: 'boy' },
  { id: 'al-391561', name: "Sakana Ani", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b391561-L3A58cYYOE4g.png", gender: 'neutral' },
  { id: 'al-391562', name: "Sakana Otouto", category: "Frieren", url: "https://s4.anilist.co/file/anilistcdn/character/large/b391562-Tvn6zn9g53gn.png", gender: 'neutral' },
];

export function getRandomAvatar(isGuest = false, gender?: 'boy' | 'girl' | 'neutral'): string {
  let options = isGuest ? FUNNY_AVATARS : ANIME_AVATARS;
  if (gender) {
    const filtered = options.filter(a => a.gender === gender);
    if (filtered.length > 0) options = filtered;
  }
  const pick = options[Math.floor(Math.random() * options.length)];
  return pick?.url ?? 'https://s4.anilist.co/file/anilistcdn/character/large/b136837-3WR22FYet8Hv.jpg';
}

export function getRandomGuestName(): string {
  const number = Math.floor(1000 + Math.random() * 9000);
  const titles = ['Traveller', 'Shadow Wanderer', 'Astral Traveller', 'Mystic Nomad', 'Drifting Soul', 'Wandering Spirit'];
  return `${titles[Math.floor(Math.random() * titles.length)]} #${number}`;
}

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentUrl?: string;
  isGuest?: boolean;
}

const FALLBACK_IMG = 'https://s4.anilist.co/file/anilistcdn/character/large/b136837-3WR22FYet8Hv.jpg';

const AvatarCard = React.memo(function AvatarCard({
  avatar,
  isSelected,
  onSelect,
  onClose,
}: {
  avatar: AvatarItem;
  isSelected: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  return (
    <button
      onClick={() => {
        onSelect(avatar.url);
        onClose();
      }}
      title={avatar.name}
      className="flex flex-col items-center gap-1.5 w-full focus:outline-none group transition-transform duration-150 active:scale-95 hover:scale-105"
    >
      <div
        className={`relative w-full aspect-square rounded-xl overflow-hidden border transition-colors duration-150 ${
          isSelected
            ? 'border-primary ring-1 ring-primary/40'
            : 'border-white/10 group-hover:border-white/30'
        }`}
      >
        <img
          src={avatar.url}
          alt={avatar.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
          loading="lazy"
          decoding="async"
        />
        <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 items-end p-1.5 pointer-events-none">
          <span className="text-[8px] font-bold text-white leading-tight line-clamp-2">
            {avatar.name}
          </span>
        </div>
        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-md">
            <Check size={9} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <span className="block sm:hidden text-[10px] font-bold text-zinc-300 line-clamp-1 w-full text-center px-0.5 mt-0.5 group-active:text-primary transition-colors">
        {avatar.name}
      </span>
    </button>
  );
});

export default function AvatarSelectorModal({
  isOpen,
  onClose,
  onSelect,
  onBack,
  currentUrl,
  isGuest = false,
}: AvatarSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [devAvatars, setDevAvatars] = useState<AvatarItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    
    fetch('/api/avatars')
      .then(res => res.json())
      .then(data => {
        if (data.images) {
          const fetchedAvatars: AvatarItem[] = data.images.map((url: string, index: number) => ({
            id: `dev-${index}`,
            name: (url.split('/').pop()?.split('.')[0] || `Dev Avatar ${index}`).replace(/_/g, ' '),
            category: 'from dev',
            url: url,
            isFunny: true,
            gender: 'neutral'
          }));
          setDevAvatars(fetchedAvatars);
        }
      })
      .catch(err => console.error("Failed to load dev avatars:", err));
  }, [isOpen]);

  const groupedAvatars = useMemo(() => {
    let list = isGuest ? [...FUNNY_AVATARS, ...devAvatars] : [...ANIME_AVATARS, ...devAvatars];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    }

    const groups: Record<string, typeof list> = {};
    
    list.forEach(avatar => {
      const cat = avatar.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(avatar);
    });

    const topOrder = ['The Eminence in Shadow', 'from dev', 'Crayon Shin-chan', 'Doraemon'];

    const sortedGroups: Record<string, typeof list> = {};
    
    topOrder.forEach(cat => {
      if (groups[cat]) {
        sortedGroups[cat] = groups[cat];
      }
    });

    Object.keys(groups).forEach(cat => {
      if (!topOrder.includes(cat)) {
        sortedGroups[cat] = groups[cat];
      }
    });

    return sortedGroups;
  }, [searchQuery, isGuest, devAvatars]);

  const hasResults = Object.keys(groupedAvatars).length > 0;

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg md:max-w-xl bg-[#0a0a12]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden mx-auto"
          style={{ maxHeight: 'min(82dvh, 580px)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2.5">
              {onBack && (
                <button
                  onClick={onBack}
                  title="Back to media panel"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/10"
                >
                  <ArrowLeft size={14} />
                </button>
              )}
              <UserCircle size={16} className="text-primary" />
              <span className="text-sm font-black text-white tracking-wide">
                {isGuest ? 'Choose Your Avatar' : 'Avatar Library'}
              </span>
              {isGuest && (
                <span className="flex items-center gap-1 text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                  <Sparkles size={8} /> TRAVELLER
                </span>
              )}
              {!isGuest && (
                <span className="text-[9px] bg-white/5 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                  {ANIME_AVATARS.length} chars • 33 Anime Series
                </span>
              )}
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* ── Search (Liquid Glass) ── */}
          <div className="px-4 pt-3.5 pb-2.5 shrink-0 space-y-2 border-b border-white/10 bg-white/[0.02]">
            <div className="relative group">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-300/60 group-focus-within:text-purple-400 transition-colors pointer-events-none z-10" />
              <input
                type="text"
                placeholder={isGuest ? 'Search funny avatars…' : 'Search character or anime…'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.08] backdrop-blur-2xl border border-white/20 focus:border-purple-400/70 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-400/60 outline-none shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300"
              />
            </div>
          </div>

          {/* ── Avatar Grid ── */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 min-h-0">
            {!hasResults ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
                <Search size={28} className="mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-wider">No results</p>
              </div>
            ) : (
              <div className="space-y-6 mt-2">
                {Object.entries(groupedAvatars).map(([category, avatars]) => (
                  <div key={category}>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                      {category === 'Funny Picks' ? '😄 Funny Picks' : category}
                      <span className="text-[9px] font-semibold text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded-md">
                        {avatars.length}
                      </span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {avatars.map((avatar) => (
                        <AvatarCard
                          key={avatar.id}
                          avatar={avatar}
                          isSelected={currentUrl === avatar.url}
                          onSelect={onSelect}
                          onClose={onClose}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer note for travellers ── */}
          {isGuest && (
            <div className="px-5 py-3 border-t border-white/5 shrink-0">
              <p className="text-[10px] text-zinc-600 text-center">
                Create an account to unlock <span className="text-zinc-400 font-bold">{ANIME_AVATARS.length}+</span> character avatars
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}

import React from 'react';
import { Instagram, Youtube, Github, Twitter, Globe, Music2, MessageCircle } from 'lucide-react';

export type SocialPlatform = 'instagram' | 'twitter' | 'discord' | 'youtube' | 'tiktok' | 'github' | 'website';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export const parseSocialLinks = (raw: any): SocialLink[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is SocialLink => 
      item && typeof item === 'object' && typeof item.url === 'string' && item.url.trim().length > 0
    );
  }
  if (typeof raw === 'string') {
    const clean = raw.trim();
    if (!clean) return [];
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is SocialLink => 
          item && typeof item === 'object' && typeof item.url === 'string' && item.url.trim().length > 0
        );
      }
    } catch (_) {}
    let platform: SocialPlatform = 'website';
    const lower = clean.toLowerCase();
    if (lower.includes('instagram.com')) platform = 'instagram';
    else if (lower.includes('twitter.com') || lower.includes('x.com')) platform = 'twitter';
    else if (lower.includes('discord.gg') || lower.includes('discord.com')) platform = 'discord';
    else if (lower.includes('youtube.com') || lower.includes('youtu.be')) platform = 'youtube';
    else if (lower.includes('tiktok.com')) platform = 'tiktok';
    else if (lower.includes('github.com')) platform = 'github';

    return [{ platform, url: clean }];
  }
  return [];
};

export const formatSocialHref = (link: SocialLink): string => {
  const val = link.url.trim();
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  if (link.platform === 'instagram') return `https://instagram.com/${val.replace(/^@/, '')}`;
  if (link.platform === 'twitter') return `https://x.com/${val.replace(/^@/, '')}`;
  if (link.platform === 'github') return `https://github.com/${val.replace(/^@/, '')}`;
  if (link.platform === 'youtube') return `https://youtube.com/@${val.replace(/^@/, '')}`;
  if (link.platform === 'tiktok') return `https://tiktok.com/@${val.replace(/^@/, '')}`;
  if (link.platform === 'discord') return val.startsWith('discord.gg') ? `https://${val}` : `https://discord.gg/${val}`;
  return `https://${val}`;
};

export const formatSocialLabel = (link: SocialLink): string => {
  const val = link.url.trim().replace(/^https?:\/\/(www\.)?/, '');
  if (link.platform === 'instagram') {
    const handle = val.replace(/^instagram\.com\/?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'Instagram';
  }
  if (link.platform === 'twitter') {
    const handle = val.replace(/^(x|twitter)\.com\/?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'X';
  }
  if (link.platform === 'github') {
    const handle = val.replace(/^github\.com\/?/, '').replace(/^@+/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'GitHub';
  }
  if (link.platform === 'youtube') {
    const handle = val.replace(/^youtube\.com\/?(@)?/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'YouTube';
  }
  if (link.platform === 'tiktok') {
    const handle = val.replace(/^tiktok\.com\/?(@)?/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : 'TikTok';
  }
  if (link.platform === 'discord') {
    return val.replace(/^discord\.(gg|com)\/(invite\/)?/, '') || 'Discord';
  }
  return val.replace(/\/$/, '') || 'Website';
};

export const renderSocialIcon = (platform: SocialPlatform, size = 13): React.ReactNode => {
  switch (platform) {
    case 'instagram':
      return <Instagram size={size} className="text-pink-400 shrink-0" />;
    case 'twitter':
      return <Twitter size={size} className="text-sky-400 shrink-0" />;
    case 'discord':
      return <MessageCircle size={size} className="text-indigo-400 shrink-0" />;
    case 'youtube':
      return <Youtube size={size} className="text-red-400 shrink-0" />;
    case 'tiktok':
      return <Music2 size={size} className="text-teal-300 shrink-0" />;
    case 'github':
      return <Github size={size} className="text-zinc-200 shrink-0" />;
    default:
      return <Globe size={size} className="text-blue-400 shrink-0" />;
  }
};


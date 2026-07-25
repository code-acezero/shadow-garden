"use client";
import { useState, useEffect } from 'react';
import { getRandomAvatar, getRandomGuestName } from '@/components/User/AvatarSelectorModal';

export interface TravellerProfile {
  name: string;
  avatar: string;
  gender?: 'boy' | 'girl';
}

const FALLBACK_AVATAR = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';

export function useTravellerProfile(): TravellerProfile {
  const [profile, setProfile] = useState<TravellerProfile>({ name: '', avatar: FALLBACK_AVATAR });

  useEffect(() => {
    const load = () => {
      let avatar = localStorage.getItem('shadow_traveller_avatar');
      let name = localStorage.getItem('shadow_traveller_name');
      let gender = localStorage.getItem('shadow_traveller_gender') as 'boy' | 'girl' | null;
      
      if (!avatar || !name) {
        avatar = avatar || getRandomAvatar(true, gender || undefined);
        name = name || getRandomGuestName();
        localStorage.setItem('shadow_traveller_avatar', avatar);
        localStorage.setItem('shadow_traveller_name', name);
      }
      setProfile({ name, avatar, gender: gender || undefined });
    };
    load();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TravellerProfile>).detail;
      if (detail?.avatar) setProfile(detail);
    };
    window.addEventListener('shadow-traveller-updated', handler);
    return () => window.removeEventListener('shadow-traveller-updated', handler);
  }, []);

  return profile;
}

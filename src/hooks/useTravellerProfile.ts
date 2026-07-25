"use client";
import { useState, useEffect } from 'react';
import { getRandomAvatar, getRandomGuestName } from '@/components/User/AvatarSelectorModal';

export interface TravellerProfile {
  name: string;
  avatar: string;
  gender?: 'boy' | 'girl';
}

const FALLBACK_AVATAR = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg';

export function getStoredTravellerProfile(): TravellerProfile {
  if (typeof window === 'undefined') return { name: 'Shadow Traveller', avatar: FALLBACK_AVATAR };
  
  let avatar = localStorage.getItem('shadow_traveller_avatar');
  let name = localStorage.getItem('shadow_traveller_name');
  let gender = localStorage.getItem('shadow_traveller_gender') as 'boy' | 'girl' | null;

  if (!name || !name.trim()) {
    name = getRandomGuestName();
    localStorage.setItem('shadow_traveller_name', name);
  }
  if (!avatar || !avatar.trim()) {
    avatar = getRandomAvatar(true, gender || undefined);
    localStorage.setItem('shadow_traveller_avatar', avatar);
  }

  return { name, avatar, gender: gender || undefined };
}

export function saveTravellerProfile(profile: Partial<TravellerProfile>): TravellerProfile | undefined {
  if (typeof window === 'undefined') return;
  
  const current = getStoredTravellerProfile();
  const updated: TravellerProfile = {
    name: profile.name !== undefined && profile.name.trim() !== '' ? profile.name.trim() : current.name,
    avatar: profile.avatar !== undefined && profile.avatar.trim() !== '' ? profile.avatar.trim() : current.avatar,
    gender: profile.gender !== undefined ? profile.gender : current.gender,
  };

  localStorage.setItem('shadow_traveller_name', updated.name);
  localStorage.setItem('shadow_traveller_avatar', updated.avatar);
  if (updated.gender) localStorage.setItem('shadow_traveller_gender', updated.gender);

  window.dispatchEvent(new CustomEvent('shadow-traveller-updated', { detail: updated }));
  return updated;
}

export function useTravellerProfile(): TravellerProfile {
  const [profile, setProfile] = useState<TravellerProfile>({ name: 'Shadow Traveller', avatar: FALLBACK_AVATAR });

  useEffect(() => {
    setProfile(getStoredTravellerProfile());

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TravellerProfile>).detail;
      if (detail) {
        setProfile(prev => ({
          name: detail.name || prev.name,
          avatar: detail.avatar || prev.avatar,
          gender: detail.gender || prev.gender,
        }));
      } else {
        setProfile(getStoredTravellerProfile());
      }
    };

    window.addEventListener('shadow-traveller-updated', handler);
    return () => window.removeEventListener('shadow-traveller-updated', handler);
  }, []);

  return profile;
}

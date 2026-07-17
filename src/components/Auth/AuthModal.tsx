"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, Mail, Lock, User as UserIcon, 
  ArrowLeft, Smartphone, CheckCircle2, Plus, LogIn, Trash2, LogOut, Loader2, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { AppUser, UserAPI } from '@/lib/api'; 
import { supabase } from '@/lib/supabase'; 
import { motion, AnimatePresence } from 'framer-motion';
import { hunters } from '@/lib/fonts'; 
import { playVoice, syncVoiceProfile } from '@/lib/voice'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import ShadowAvatar from '@/components/User/ShadowAvatar';

// --- TYPES & ICONS ---
interface AuthModalProps { isOpen: boolean; onClose: () => void; onAuthSuccess: (user: AppUser) => void; initialView?: string; }
type AuthView = 'ACCOUNTS' | 'ENTER' | 'REGISTER' | 'OTP' | 'FORGOT';

const GoogleIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>;
const DiscordIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 3.42 3.42 0 0 0-.68 1.405 18.355 18.355 0 0 0-5.344 0 3.42 3.42 0 0 0-.678-1.405.077.077 0 0 0-.08-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>;
const FacebookIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971 1.022-2.971 2.22v1.752h3.446l-.471 3.667h-2.975v7.98H9.101z"/></svg>;
const GithubIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
const AppleIcon = () => <svg viewBox="0 0 384 512" className="w-4 h-4"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/></svg>;

const YinYangIcon = () => (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0 bg-transparent">
        <style jsx>{`
            @keyframes breath-glow {
                0%, 100% { filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.4)); }
                50% { filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)); }
            }
        `}</style>
        <svg viewBox="0 0 24 24" className="w-10 h-10 animate-[spin_6s_linear_infinite]" style={{ animation: 'breath-glow 4s ease-in-out infinite, spin 6s linear infinite' }}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2c-2.761 0-5.261 1.119-7.071 2.929A9.969 9.969 0 0 0 2 12c0 5.523 4.477 10 10 10Z" fill="white"/>
            <path d="M12 2a10 10 0 0 0 0 20 5 5 0 0 1 0-10 5 5 0 0 0 0-10Z" fill="#dc2626"/>
            <circle cx="12" cy="7" r="1.5" fill="white" />
            <circle cx="12" cy="17" r="1.5" fill="#dc2626" />
            <circle cx="12" cy="12" r="10" fill="none" stroke="black" strokeWidth="0.5" strokeOpacity="0.3" />
        </svg>
    </div>
);

const SpotlightButton = ({ children, className, onClick, disabled, type = "button" }: any) => {
    const divRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    return (
        <button
            ref={divRef} type={type} onClick={onClick} disabled={disabled}
            onMouseMove={handleMouseMove} onMouseEnter={() => setOpacity(1)} onMouseLeave={() => setOpacity(0)}
            className={`relative overflow-hidden transition-all duration-200 outline-none focus:outline-none focus:ring-0 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="pointer-events-none absolute -inset-px transition-opacity duration-300" style={{ opacity, background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, rgba(220, 38, 38, 0.4), transparent 40%)` }} />
            <div className="relative z-10 flex items-center justify-center gap-2">{children}</div>
        </button>
    );
};

const notifyIsland = (title: string, message: string, type: 'system' | 'warning' | 'error' = 'system') => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow-whisper', { detail: { id: Date.now(), type, title, message } }));
};

const waitForAudio = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialView }: AuthModalProps) {
  const router = useRouter(); 
  const { savedAccounts, switchAccount, removeAccount, user: currentUser, signOut, profile: currentProfile } = useAuth();
  
  const [view, setView] = useState<AuthView>('ENTER');
  const [switchingToId, setSwitchingToId] = useState<string | null>(null);
  
  // Listen for the "Direct Leave" event from Dropdown
  useEffect(() => {
      const handleTriggerLeave = () => {
          handleSignOutActive();
      };
      if (typeof window !== 'undefined') {
          window.addEventListener('shadow-trigger-leave', handleTriggerLeave);
      }
      return () => {
          if (typeof window !== 'undefined') window.removeEventListener('shadow-trigger-leave', handleTriggerLeave);
      };
  }, [currentUser, savedAccounts]); 

  useEffect(() => {
      if (isOpen) {
          if (initialView) setView(initialView as AuthView);
          else if (savedAccounts.length > 0) setView('ACCOUNTS');
          else setView('ENTER');
      }
  }, [isOpen, savedAccounts.length, initialView]);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', username: '', confirmPassword: '', otp: '' });

  // ✅ DUPLICATE CHECK STATE
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
      const exists = savedAccounts.some(acc => acc.email.toLowerCase() === formData.email.toLowerCase());
      setIsDuplicate(exists);
  }, [formData.email, savedAccounts]);

  const checkUsername = async (username: string) => {
      if (username.length < 3) { setUsernameAvailable(null); return; }
      try {
          const { data } = await supabase.from('profiles').select('username').eq('username', username).single();
          setUsernameAvailable(!data); 
      } catch (e) { setUsernameAvailable(true); }
  };

  const checkPasswordStrength = (pass: string) => {
      let score = 0;
      if (pass.length >= 6) score += 30;
      if (pass.match(/[A-Z]/)) score += 20;
      if (pass.match(/[0-9]/)) score += 20;
      if (pass.match(/[^A-Za-z0-9]/)) score += 30;
      setPasswordStrength(score);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        if (field === 'password' || field === 'confirmPassword') setPasswordsMatch(newData.password === newData.confirmPassword && newData.password.length > 0);
        return newData;
    });
    if (field === 'username') checkUsername(value);
    if (field === 'password') checkPasswordStrength(value);
    if (field === 'email' && view === 'REGISTER' && value.includes('@') && !formData.username) handleInputChange('username', value.split('@')[0] + Math.floor(Math.random() * 100));
  };

  const suggestNewUsername = () => handleInputChange('username', `${formData.username}${Math.floor(Math.random() * 9999)}`);
  
  const isEnterValid = formData.email && formData.password.length >= 6 && !isDuplicate;
  const isRegisterValid = formData.email && usernameAvailable && passwordStrength >= 30 && passwordsMatch && !isDuplicate;
  const isOtpValid = formData.otp.length === 8;

  // --- ACTIONS ---
  
  // ✅ SWITCH ACCOUNT (Unstoppable Reload + Voice)
  const handleSwitchAccount = async (id: string) => {
      if (currentUser?.id === id) { onClose(); return; }

      setSwitchingToId(id); 
      setIsLoading(true);

      // 1. Play Goodbye Voice
      const role = currentProfile?.role;
      const isMaster = role === 'admin' || role === 'moderator';
      
      playVoice(isMaster ? 'BYE_MASTER' : 'BYE_ADVENTURER');
      notifyIsland('Guild Receptionist', isMaster 
        ? 'See you again, Master. Have a nice day. Goodbye.' 
        : 'See you again, Adventurer. Have a nice day. Goodbye.'
      );
      
      // 2. Suppress flags
      if (typeof window !== 'undefined') {
          sessionStorage.removeItem('shadow_welcome_shown');
          sessionStorage.setItem('shadow_suppress_welcome', 'true');
      }

      // 3. START UNSTOPPABLE TIMER (4s)
      setTimeout(() => {
          if (typeof window !== 'undefined') {
              sessionStorage.removeItem('shadow_suppress_welcome'); 
              window.location.assign('/home'); // Hard Reload
          }
      }, 4000);

      // 4. Run Logic (Fire and Forget)
      switchAccount(id).catch(() => {});
  };

  // ✅ LEAVE ACCOUNT (Corrected)
  const handleSignOutActive = async () => {
      setIsLoading(true);
      
      // 1. Play Voice First
      const role = currentProfile?.role;
      const isMaster = role === 'admin' || role === 'moderator';
      
      playVoice(isMaster ? 'BYE_MASTER' : 'BYE_ADVENTURER');
      notifyIsland('Guild Receptionist', isMaster 
        ? 'See you again, Master. Have a nice day. Goodbye.' 
        : 'See you again, Adventurer. Have a nice day. Goodbye.'
      );
      
      // 2. Flags
      if (typeof window !== 'undefined') {
          sessionStorage.removeItem('shadow_welcome_shown');
          sessionStorage.setItem('shadow_suppress_welcome', 'true');
      }
      
      // 3. START BACKGROUND REMOVAL NOW
      // We don't wait for voice to finish to start the removal/switch logic.
      // We let it happen in background so by the time 4s is up, it's ready.
      signOut().catch(() => {});

      // 4. START UNSTOPPABLE RELOAD TIMER (4s)
      setTimeout(() => {
          if (typeof window !== 'undefined') {
              sessionStorage.removeItem('shadow_suppress_welcome');
              window.location.assign('/home'); // Force Reload to clear state/load new account
          }
      }, 4000);
  };

  // ✅ ADD ACCOUNT / LOGIN (Voice on Success + Auto-Leave current)
  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate) return;
    setIsLoading(true);

    const isAddingAccount = !!currentUser;

    // --- 1. HANDLE ADDING ACCOUNT (Play Goodbye First) ---
    if (isAddingAccount) {
        const role = currentProfile?.role;
        const isMaster = role === 'admin' || role === 'moderator';
        
        playVoice(isMaster ? 'BYE_MASTER' : 'BYE_ADVENTURER');
        notifyIsland('Guild Receptionist', isMaster 
            ? 'See you again, Master. Have a nice day. Goodbye.' 
            : 'See you again, Adventurer. Have a nice day. Goodbye.'
        );

        // Wait for audio to finish before touching auth state
        await waitForAudio(4000);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
      });

      if (error) throw error;

      if (data?.user) {
        // ... (Session persistence check) ...
        let attempts = 0;
        let sessionConfirmed = false;
        while (attempts < 10 && !sessionConfirmed) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user) sessionConfirmed = true;
            else { await new Promise(r => setTimeout(r, 100)); attempts++; }
        }

        if (sessionConfirmed) {
            // ✅ Sync Profile 
            syncVoiceProfile(data.user.id).catch(() => {});
            
            // Fetch Role immediately to play correct voice
            const { data: profileData } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
            const role = profileData?.role || 'user';
            const isMaster = role === 'admin' || role === 'moderator';

            if (isAddingAccount) {
                // ✅ ADDING ACCOUNT:
                // No Welcome Voice (Prevent overlap). 
                // Hard reload triggers normal flow on next page load.
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('shadow_welcome_shown'); 
                    window.location.assign('/home'); 
                }
            } else {
                // ✅ FRESH LOGIN: Play Voice & SPA Push
                playVoice(isMaster ? 'GREET_MASTER' : 'GREET_ADVENTURER');
                notifyIsland('Guild Receptionist', isMaster 
                    ? `Welcome back Master, it is good to see you again.` 
                    : `Welcome back Adventurer, it is good to see you again.`
                );

                onAuthSuccess({ id: data.user.id, email: data.user.email });
                onClose();
                router.push('/home');
            }
        }
      }
    } catch (error: any) {
        notifyIsland('Guild Manager Alpha', error.message || "Access Denied.", 'error');
        setIsLoading(false);
    } 
  };

  // ... (Rest of handlers: Register, OTP, etc - Unchanged) ...
  const handleRegister = async (e: React.FormEvent) => { e.preventDefault(); if (isDuplicate) return; if (!usernameAvailable || formData.password.length < 6 || !passwordsMatch) return notifyIsland('Guild Manager Alpha', "Details invalid.", 'warning'); setIsLoading(true); try { const { data, error } = await UserAPI.signUp(formData.email, formData.password, formData.username); if (error) throw error; if (data?.user) { setView('OTP'); notifyIsland('Guild Manager Alpha', "Contract Sealed. Enter 8-digit token.", 'system'); } } catch (error: any) { notifyIsland('Guild Manager Alpha', error.message, 'error'); } finally { setIsLoading(false); } };
  const handleVerifyOTP = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); try { const { data, error } = await supabase.auth.verifyOtp({ email: formData.email, token: formData.otp, type: view === 'FORGOT' ? 'recovery' : 'signup' }); if (error) throw error; if (data.session) { notifyIsland('Guild Manager Alpha', view !== 'FORGOT' ? "Welcome to the Guild." : "Access Recovered."); if (typeof window !== 'undefined') window.location.href = '/home'; } } catch (err: any) { notifyIsland('Guild Manager Alpha', "Invalid Token.", 'error'); setIsLoading(false); } };
  const handleResendToken = async () => { if(!formData.email) return; setIsLoading(true); try { await supabase.auth.resend({ type: 'signup', email: formData.email }); notifyIsland('Guild Manager Alpha', 'Token resent. Check spam.', 'system'); } catch(e:any) { notifyIsland('Error', e.message, 'error'); } finally { setIsLoading(false); } };
  const handleForgotPass = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); try { await supabase.auth.resetPasswordForEmail(formData.email); notifyIsland('Guild Manager Alpha', "Recovery scroll sent.", 'system'); setView('OTP'); } catch (err: any) { notifyIsland('Error', err.message, 'error'); } finally { setIsLoading(false); } };
  const handleSocial = async (provider: any) => { try { await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } }); } catch (e: any) { notifyIsland('Guild Manager Alpha', "Link Failed: " + e.message, 'error'); } };

  // ... (Styles & UI) ...
  const inputClass = "h-11 pl-10 bg-zinc-800/50 border-white/5 rounded-full text-xs placeholder:text-zinc-600 focus:bg-zinc-800/80 focus:border-white/10 outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 transition-all";
  const tabClass = "rounded-full data-[state=active]:bg-zinc-700/80 data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest text-zinc-400 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0";
  const tabClassRed = "rounded-full data-[state=active]:bg-primary-900/60 data-[state=active]:text-primary-100 font-bold text-[10px] uppercase tracking-widest text-zinc-400 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0";

  const SocialBtn = ({ icon: Icon, onClick }: any) => (
    <button type="button" onClick={onClick} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/50 hover:bg-zinc-700 border border-white/5 hover:border-white/10 transition-all text-zinc-400 hover:text-white hover:scale-110 shadow-lg outline-none focus:outline-none focus:ring-0"><Icon /></button>
  );
  const LoaderIcon = () => (<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[340px] w-[90%] bg-black/40 backdrop-blur-xl border border-white/5 text-white p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] my-auto max-h-[85vh] outline-none focus:outline-none ring-0">
        <div className="relative p-6 pt-8">
            <div className="text-center space-y-2 mb-6">
                <div className="flex items-center justify-center gap-3"><YinYangIcon /><DialogTitle className={`text-2xl text-white ${hunters.className} tracking-wider pt-1 drop-shadow-md`}>SHADOW <span className="text-primary-600">GARDEN</span></DialogTitle></div>
                <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] font-bold">Official Guild Access</p>
            </div>
            
            <AnimatePresence mode="wait">
                {view === 'ACCOUNTS' && (
                    <motion.div key="accounts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            {savedAccounts.map((account) => (
                                <div 
                                    key={account.id} 
                                    className={`flex items-center justify-between p-2 rounded-xl border transition-all outline-none focus:outline-none ring-0 ${currentUser?.id === account.id ? 'bg-primary-900/20 border-primary-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-3 cursor-pointer flex-1 outline-none" onClick={() => handleSwitchAccount(account.id)}>
                                        <Avatar className="w-10 h-10 border border-white/10">
                                            {account.avatar_url ? <AvatarImage src={account.avatar_url} /> : <ShadowAvatar />}
                                        </Avatar>
                                        <div className="text-left">
                                            <div className={`text-xs font-bold ${currentUser?.id === account.id ? 'text-primary-400' : 'text-white'}`}>{account.username}</div>
                                            <div className="text-[9px] text-zinc-500 flex items-center gap-1">
                                                {switchingToId === account.id ? (
                                                    <><Loader2 className="w-3 h-3 animate-spin text-primary-500"/> Switching...</>
                                                ) : currentUser?.id === account.id ? (
                                                    <><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Active</>
                                                ) : 'Saved'}
                                            </div>
                                        </div>
                                    </div>
                                    {currentUser?.id !== account.id && (
                                        <button onClick={() => removeAccount(account.id)} className="p-2 text-zinc-500 hover:text-primary-500 transition-colors outline-none"><Trash2 size={14}/></button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {savedAccounts.length < 2 && (
                            <button onClick={() => setView('ENTER')} className="w-full h-11 flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider outline-none">
                                <Plus size={14} /> Add Account
                            </button>
                        )}
                        {savedAccounts.length >= 2 && (
                            <p className="text-center text-[9px] text-zinc-600">Max accounts reached. Remove one to add another.</p>
                        )}

                        {currentUser && (
                            <button onClick={handleSignOutActive} className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-primary-900/20 hover:bg-primary-900/40 text-primary-400 hover:text-primary-300 transition-all text-xs font-bold uppercase tracking-wider mt-2 border border-primary-500/20 outline-none focus:outline-none">
                                {isLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <><LogOut size={14} /> Leave {currentUser.email?.split('@')[0]}</>}
                            </button>
                        )}
                    </motion.div>
                )}

                {(view === 'ENTER' || view === 'REGISTER') && (
                    <motion.div key="auth-main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                        {savedAccounts.length > 0 && (
                            <div onClick={() => setView('ACCOUNTS')} className="flex items-center gap-2 text-zinc-500 hover:text-white cursor-pointer w-fit px-1 outline-none focus:outline-none mb-2"><ArrowLeft className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold uppercase tracking-widest">Accounts</span></div>
                        )}
                        <Tabs value={view} onValueChange={(v) => setView(v as AuthView)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-zinc-900/60 p-1 h-11 rounded-full border border-white/5">
                                <TabsTrigger value="ENTER" className={tabClass}>Enter</TabsTrigger>
                                <TabsTrigger value="REGISTER" className={tabClassRed}>Register</TabsTrigger>
                            </TabsList>
                            <TabsContent value="ENTER" className="space-y-4 mt-5 outline-none focus:outline-none">
                                <form onSubmit={handleEnter} className="space-y-3">
                                    <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 group-focus-within:text-white" /><Input type="email" placeholder="agent@shadow.garden" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass} required /></div>
                                    <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 group-focus-within:text-white" /><Input type={showPassword ? 'text' : 'password'} placeholder="••••••" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className={`${inputClass} pr-10`} required /><button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white outline-none focus:outline-none"><Eye className="w-3.5 h-3.5" /></button></div>
                                    
                                    {/* ✅ DUPLICATE WARNING */}
                                    {isDuplicate && (
                                        <div className="flex items-center gap-2 text-[9px] text-primary-400 px-2">
                                            <AlertCircle size={10} /> This profile is already available
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between px-2"><div className="flex items-center gap-2"><Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(!!c)} className="border-zinc-600 data-[state=checked]:bg-primary-600 border-primary-600 w-3.5 h-3.5 rounded-sm" /><label htmlFor="remember" className="text-[10px] text-zinc-500 cursor-pointer font-medium">Remember Pass</label></div><button type="button" onClick={() => setView('FORGOT')} className="text-[10px] text-zinc-500 hover:text-primary-400 font-medium outline-none focus:outline-none">Forget Pass?</button></div>
                                    <SpotlightButton type="submit" disabled={!isEnterValid || isLoading} className="w-full h-11 bg-zinc-200/90 hover:bg-white text-black font-extrabold text-[10px] uppercase tracking-widest rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">{isLoading ? <LoaderIcon /> : 'Enter Guild'}</SpotlightButton>
                                </form>
                            </TabsContent>
                            <TabsContent value="REGISTER" className="space-y-4 mt-5 outline-none focus:outline-none">
                                <form onSubmit={handleRegister} className="space-y-3">
                                    <div className="relative group"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 group-focus-within:text-white" /><Input placeholder="Codename" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} className={`${inputClass} ${usernameAvailable === false ? 'border-primary-500/30 text-primary-200' : ''}`} required />{usernameAvailable === false && <span onClick={suggestNewUsername} className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-primary-400 cursor-pointer hover:underline">Taken</span>}</div>
                                    <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 group-focus-within:text-white" /><Input type="email" placeholder="Email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass} required /></div>
                                    
                                    {/* ✅ DUPLICATE WARNING */}
                                    {isDuplicate && (
                                        <div className="flex items-start gap-2 text-[9px] text-primary-400 px-2 leading-tight">
                                            <AlertCircle size={10} className="shrink-0 mt-0.5" /> A guild card is already created with this email, try to use a different one or enter with this email.
                                        </div>
                                    )}

                                    <div className="space-y-2"><div className="flex justify-between items-center px-2"><Label className="text-[9px] uppercase font-bold text-zinc-600">Security Level</Label><div className="flex gap-1">{[1,2,3,4].map(i => (<div key={i} className={`h-1 w-3 rounded-full transition-all ${passwordStrength >= i*25 ? (passwordStrength > 75 ? 'bg-green-500' : 'bg-yellow-600') : 'bg-white/5'}`} />))}</div></div><div className="grid grid-cols-2 gap-2"><Input type="password" placeholder="Pass" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className={`${inputClass} px-4`} required /><div className="relative"><Input type="password" placeholder="Confirm" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className={`h-11 px-4 bg-zinc-800/50 border-white/5 rounded-full text-xs placeholder:text-zinc-600 focus:bg-zinc-800/80 outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 transition-all ${passwordsMatch ? 'border-green-500/30' : 'focus:border-white/10'}`} required />{passwordsMatch && formData.confirmPassword && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-3.5 h-3.5" />}</div></div></div>
                                    <SpotlightButton type="submit" disabled={!isRegisterValid || isLoading} className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]">{isLoading ? <LoaderIcon /> : 'Sign Contract'}</SpotlightButton>
                                </form>
                            </TabsContent>
                        </Tabs>
                        <div className="pt-1"><div className="relative mb-4"><Separator className="bg-white/5" /><span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] px-2 text-[9px] uppercase font-bold text-zinc-700 tracking-widest">Link Soul</span></div>
                            <div className="flex gap-3 justify-center">
                                <SocialBtn icon={GoogleIcon} onClick={() => handleSocial('google')} />
                                <SocialBtn icon={FacebookIcon} onClick={() => handleSocial('facebook')} />
                                <SocialBtn icon={DiscordIcon} onClick={() => handleSocial('discord')} />
                                <SocialBtn icon={GithubIcon} onClick={() => handleSocial('github')} />
                                <SocialBtn icon={AppleIcon} onClick={() => handleSocial('apple')} />
                            </div>
                        </div>
                    </motion.div>
                )}
                {(view === 'OTP' || view === 'FORGOT') && (
                    <motion.div key="auth-sub" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="space-y-5 py-2">
                        <div onClick={() => setView('ENTER')} className="flex items-center gap-2 text-zinc-500 hover:text-white cursor-pointer w-fit px-1 outline-none focus:outline-none"><ArrowLeft className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold uppercase tracking-widest">Back</span></div>
                        {view === 'OTP' ? (
                            <>
                                <div className="bg-zinc-900/50 border border-white/5 rounded-[1.5rem] p-4 flex gap-3 items-start"><Smartphone className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" /><div><h4 className="text-xs font-bold text-white">Verification Required</h4><p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">We sent an 8-digit Guild Token to <b>{formData.email}</b>. Check spam.</p></div></div>
                                <form onSubmit={handleVerifyOTP} className="space-y-4"><Input placeholder="12345678" value={formData.otp} onChange={(e) => handleInputChange('otp', e.target.value)} className="h-12 text-center text-xl tracking-[0.5em] font-mono bg-zinc-800/50 border-white/5 rounded-full focus:bg-zinc-800 focus:border-primary-500/50 text-white outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20" maxLength={8} required /><SpotlightButton type="submit" disabled={!isOtpValid || isLoading} className="w-full h-11 bg-white text-black font-extrabold text-[10px] uppercase tracking-widest rounded-full">{isLoading ? <LoaderIcon /> : 'Unseal Access'}</SpotlightButton></form>
                                <div className="text-center"><button onClick={handleResendToken} disabled={isLoading} className="text-[10px] text-zinc-600 hover:text-white underline decoration-zinc-700 underline-offset-4 outline-none focus:outline-none">Resend Token</button></div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1 px-1"><h3 className="text-sm font-bold text-white">Recover Guild Pass</h3><p className="text-[10px] text-zinc-500">Enter linked email to receive a recovery token.</p></div>
                                <form onSubmit={handleForgotPass} className="space-y-4"><div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5 group-focus-within:text-white" /><Input type="email" placeholder="agent@shadow.garden" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass} required /></div><SpotlightButton type="submit" disabled={!formData.email || isLoading} className="w-full h-11 bg-primary-600 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]">{isLoading ? <LoaderIcon /> : 'Send Scroll'}</SpotlightButton></form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            <p className="mt-6 text-center text-[9px] text-zinc-700 font-medium">By entering, you accept the <span className="text-zinc-500 hover:text-primary-500 cursor-pointer transition-colors">Shadow Laws</span>.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
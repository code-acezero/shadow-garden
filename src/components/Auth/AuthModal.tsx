"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Github, Chrome, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AppUser, supabase } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AppUser) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- 1. SIGN IN LOGIC (FIXED) ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return toast.error("Shadow Database connection not found.");
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) throw error;

      if (data?.user) {
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata
        };
        onAuthSuccess(appUser);
        toast.success('The shadows welcome you back.');
        onClose();
      }
    } catch (error: any) {
      // FIX: Ignore AbortError / Signal Aborted
      if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('signal')) {
        console.log('Login aborted safely.');
        return;
      }
      
      toast.error(error.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. SIGN UP LOGIC (FIXED) ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return toast.error("Shadow Database connection not found.");

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not align in the abyss.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.username,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.username}`
          }
        }
      });
      
      if (error) throw error;

      if (data?.user) {
        toast.success('Contract sealed. Verify your email to complete the ritual.');
        onClose();
      }
    } catch (error: any) {
      // FIX: Ignore AbortError
      if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('signal')) {
        return;
      }
      toast.error(error.message || 'Failed to seal the contract.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. SOCIAL LOGIN LOGIC (FIXED) ---
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (!supabase) return toast.error("Shadow Database connection not found.");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      // FIX: Ignore AbortError
      if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('signal')) {
        return;
      }
      toast.error(`Social link failed: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#050505] border-white/5 text-white p-0 overflow-hidden rounded-3xl shadow-2xl shadow-red-900/20">
        <div className="relative p-6 pt-10">
            {/* Background Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-red-600 blur-xl opacity-40" />
            
            <DialogHeader className="text-center space-y-2">
              <motion.div 
                className="mx-auto w-16 h-16 bg-gradient-to-t from-red-900 to-red-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-red-600/20 rotate-3"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 3 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Sparkles className="text-white w-8 h-8" />
              </motion.div>
              <DialogTitle className="text-3xl font-black text-white font-[Cinzel] tracking-tighter uppercase">
                Shadow <span className="text-red-600">Garden</span>
              </DialogTitle>
              <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                Join the ultimate community
              </p>
            </DialogHeader>

            <Tabs defaultValue="signin" className="w-full mt-8">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 h-12 rounded-full border border-white/5">
                <TabsTrigger value="signin" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">
                  Infiltrate
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold text-xs uppercase tracking-widest transition-all">
                  Join Order
                </TabsTrigger>
              </TabsList>

              {/* SIGN IN VIEW */}
              <TabsContent value="signin" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-4 tracking-widest">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                      <Input
                        type="email"
                        placeholder="shadow@garden.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="h-12 pl-12 bg-white/5 border-white/5 rounded-2xl focus:border-red-600 focus:ring-0 transition-all placeholder:text-zinc-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-4 tracking-widest">Secret Key</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="h-12 pl-12 pr-12 bg-white/5 border-white/5 rounded-2xl focus:border-red-600 focus:ring-0 transition-all placeholder:text-zinc-700"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoaderIcon /> : 'Begin Infiltration'}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGN UP VIEW */}
              <TabsContent value="signup" className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-4 tracking-widest">Codename</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                      <Input
                        placeholder="Chosen One"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="h-12 pl-12 bg-white/5 border-white/5 rounded-2xl focus:border-red-600 focus:ring-0 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-4 tracking-widest">Email</Label>
                    <Input
                      type="email"
                      placeholder="shadow@garden.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="h-12 px-6 bg-white/5 border-white/5 rounded-2xl focus:border-red-600 focus:ring-0 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-4 tracking-widest">Password</Label>
                        <Input
                            type="password"
                            placeholder="••••"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="h-12 px-6 bg-white/5 border-white/5 rounded-2xl focus:border-red-600 focus:ring-0 transition-all"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-4 tracking-widest">Confirm</Label>
                        <Input
                            type="password"
                            placeholder="••••"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className="h-12 px-6 bg-white/5 border-white/5 rounded-2xl focus:border-red-600 focus:ring-0 transition-all"
                            required
                        />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoaderIcon /> : 'Establish Contract'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-8">
              <Separator className="bg-white/5" />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-4 text-[10px] uppercase font-bold text-zinc-600 tracking-widest">
                Linked Souls
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                className="h-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 transition-all"
              >
                <Chrome className="w-4 h-4 mr-2 text-red-500" /> Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('github')}
                className="h-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 transition-all"
              >
                <Github className="w-4 h-4 mr-2" /> GitHub
              </Button>
            </div>

            <p className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-tighter leading-relaxed">
              By ascending, you agree to our{' '}
              <span className="text-red-900 cursor-pointer hover:text-red-600 transition-colors">Shadow Laws</span> and{' '}
              <span className="text-red-900 cursor-pointer hover:text-red-600 transition-colors">Privacy Cloak</span>
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LoaderIcon = () => (
    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);
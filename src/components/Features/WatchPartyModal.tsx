import React, { useState } from 'react';
import { Users, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function WatchPartyModal() {
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);

  const createRoom = () => {
    // In a real app, this would call your Socket.io / Backend
    const newId = Math.random().toString(36).substring(7).toUpperCase();
    setRoomId(newId);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://shadow-garden.com/watch/party/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full px-4 h-8 text-xs font-bold gap-2 bg-blue-600/10 text-blue-400 border-blue-600/20 hover:bg-blue-600/20">
          <Users size={12} /> WATCH PARTY
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/95 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-[Cinzel] text-2xl text-blue-400">Summon Friends</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!roomId ? (
            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-4">Create a synchronized room to watch anime together in real-time.</p>
              <Button onClick={createRoom} className="bg-blue-600 hover:bg-blue-700 w-full font-bold">
                Create Room
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input value={`https://shadow-garden.com/party/${roomId}`} readOnly className="bg-white/5 border-white/10 text-zinc-300" />
                <Button type="button" size="icon" onClick={copyLink} className="bg-white/10 hover:bg-white/20">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-center text-zinc-500">Share this link with your friends to join.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
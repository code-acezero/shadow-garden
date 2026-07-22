"use client";

import React, { useState } from 'react';
import { 
  Image as ImageIcon, BarChart2, HelpCircle, X, Plus, Check, Loader2 
} from 'lucide-react';
import ProfileAvatar from '@/components/User/ProfileAvatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import { ImageAPI } from '@/lib/api';
import { PollData } from './InstagramPostCard';

interface InstagramPostComposerProps {
  user: any;
  profile: any;
  onAuthRequired: () => void;
  onPostCreated: (postData: { content: string; images: string[]; pollData?: PollData }) => Promise<void>;
  clanThemeColor?: string;
}

export default function InstagramPostComposer({
  user,
  profile,
  onAuthRequired,
  onPostCreated,
  clanThemeColor
}: InstagramPostComposerProps) {
  const [activeTab, setActiveTab] = useState<'standard' | 'poll' | 'quiz'>('standard');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- POLL / QUIZ STATE ---
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [quizCorrectIdx, setQuizCorrectIdx] = useState<number>(0);

  // --- POST METADATA STATE ---
  const [postHeader, setPostHeader] = useState('');
  const [captionPos, setCaptionPos] = useState<'above' | 'below'>('below');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files].slice(0, 4));
  };

  const handleAddOption = () => {
    if (pollOptions.length >= 4) return toast.error("Maximum 4 options allowed");
    setPollOptions(prev => [...prev, '']);
  };

  const handleOptionChange = (index: number, val: string) => {
    setPollOptions(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) return toast.error("Minimum 2 options required");
    setPollOptions(prev => prev.filter((_, i) => i !== index));
    if (quizCorrectIdx >= pollOptions.length - 1) {
      setQuizCorrectIdx(0);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (activeTab === 'standard' && !content.trim() && selectedImages.length === 0) {
      return toast.error("Please enter a caption or attach an image");
    }

    if ((activeTab === 'poll' || activeTab === 'quiz') && !pollQuestion.trim()) {
      return toast.error("Please enter a question");
    }

    if (activeTab !== 'standard') {
      const validOptions = pollOptions.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) {
        return toast.error("Please provide at least 2 valid options");
      }
    }

    setIsPublishing(true);
    try {
      // 1. Upload Images
      const uploadedUrls: string[] = [];
      for (const file of selectedImages) {
        const url = await ImageAPI.uploadImage(file);
        uploadedUrls.push(url);
      }

      // 2. Build Poll/Quiz Object if applicable
      let pollData: PollData | undefined = undefined;
      let finalContent = content.trim();

      // Append Post Metadata if provided
      if (postHeader.trim() || captionPos !== 'below') {
        const meta = { header: postHeader.trim(), captionPos };
        const encodedMeta = `<!--POST_META:${JSON.stringify(meta)}-->`;
        finalContent = finalContent ? `${finalContent}\n\n${encodedMeta}` : encodedMeta;
      }

      if (activeTab === 'poll' || activeTab === 'quiz') {
        const validOpts = pollOptions.filter(o => o.trim().length > 0);
        pollData = {
          type: activeTab,
          question: pollQuestion.trim(),
          options: validOpts.map((text, idx) => ({ id: idx, text: text.trim(), votes: [] })),
          correctOptionIndex: activeTab === 'quiz' ? quizCorrectIdx : undefined
        };

        // Append fallback metadata comment to content for universal DB compatibility
        const encodedComment = `<!--POLL_DATA:${JSON.stringify(pollData)}-->`;
        finalContent = finalContent ? `${finalContent}\n\n${encodedComment}` : encodedComment;
      }

      await onPostCreated({
        content: finalContent,
        images: uploadedUrls,
        pollData
      });

      // Reset
      setContent('');
      setSelectedImages([]);
      setPollQuestion('');
      setPollOptions(['', '']);
      setActiveTab('standard');
      setPostHeader('');
      setCaptionPos('below');
      toast.success("Post published!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to publish post");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="w-full bg-[#0c0c12]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 shadow-2xl mb-4 transition-all hover:border-white/20 overflow-hidden">
      
      {/* Top Header & Rounded Glassmorphism Tab Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2.5">
          <ProfileAvatar profile={{ ...profile, show_level: false }} className="w-8 h-8 cursor-pointer" />
          <span className="text-xs font-bold text-white tracking-wide">Create Post</span>
        </div>

        {/* Glassmorphism Creator Mode Tabs */}
        <div className="flex gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'standard' 
                ? 'bg-primary-600/90 text-white shadow-md border border-primary-400/30' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('poll')}
            className={`px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'poll' 
                ? 'bg-primary-600/90 text-white shadow-md border border-primary-400/30' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 size={12} /> Poll
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quiz' 
                ? 'bg-purple-600/90 text-white shadow-md border border-purple-400/30' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HelpCircle size={12} /> Quiz
          </button>
        </div>
      </div>

      {/* Main Content Textarea */}
      <Textarea
        placeholder={
          activeTab === 'poll' 
            ? "Add caption or context for your poll..." 
            : activeTab === 'quiz' 
            ? "Add caption or context for your quiz..." 
            : "What's on your mind?"
        }
        value={content}
        onChange={e => setContent(e.target.value)}
        className="min-h-[65px] max-h-[200px] w-full bg-transparent border-none text-xs sm:text-sm text-white resize-none focus-visible:ring-0 placeholder:text-zinc-600 p-1"
      />

      {/* Image Previews */}
      {selectedImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2 my-2">
          {selectedImages.map((image, index) => (
            <div key={index} className="relative group rounded-2xl overflow-hidden border border-white/10 shrink-0 w-24 h-24">
              <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" alt="Preview" />
              <button 
                type="button"
                onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))} 
                className="absolute top-1 right-1 bg-black/80 backdrop-blur-md rounded-full text-white p-1 hover:bg-black transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* POST METADATA SETTINGS (Header & Caption Pos) */}
      {selectedImages.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/30 rounded-2xl p-3 mt-1 mb-2 border border-white/5">
          <input
            type="text"
            placeholder="Post Header (Optional)"
            value={postHeader}
            onChange={e => setPostHeader(e.target.value)}
            className="w-full sm:flex-1 bg-transparent border-none text-xs font-bold text-white placeholder-zinc-500 focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Caption:</span>
            <button
              onClick={() => setCaptionPos(prev => prev === 'above' ? 'below' : 'above')}
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
            >
              {captionPos === 'above' ? 'Above Media' : 'Below Media'}
            </button>
          </div>
        </div>
      )}

      {/* POLL OR QUIZ FORM BUILDER */}
      {(activeTab === 'poll' || activeTab === 'quiz') && (
        <div className="mt-3 p-4 bg-[#12121c]/80 backdrop-blur-md border border-white/10 rounded-3xl space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-400 flex items-center gap-1.5">
              {activeTab === 'quiz' ? <HelpCircle size={14} className="text-purple-400" /> : <BarChart2 size={14} className="text-primary-400" />}
              Setup {activeTab === 'quiz' ? 'Trivia Quiz' : 'Opinion Poll'}
            </span>
            {activeTab === 'quiz' && (
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Checkmark = Correct Answer
              </span>
            )}
          </div>

          <input
            type="text"
            placeholder={activeTab === 'quiz' ? "Ask your quiz question..." : "Ask your poll question..."}
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 transition-colors"
          />

          <div className="space-y-2.5">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {activeTab === 'quiz' && (
                  <button
                    type="button"
                    onClick={() => setQuizCorrectIdx(idx)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                      quizCorrectIdx === idx 
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30' 
                        : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                    }`}
                    title="Mark as correct answer"
                  >
                    <Check size={14} />
                  </button>
                )}

                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 transition-colors"
                />

                {pollOptions.length > 2 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveOption(idx)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {pollOptions.length < 4 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1.5 pt-1 cursor-pointer"
            >
              <Plus size={14} /> Add Option
            </button>
          )}
        </div>
      )}

      {/* Bottom Action Bar: Symmetrical Alignment & No Overflow Bleeding */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => document.getElementById('composer-file-input')?.click()}
            className="px-3 py-1.5 rounded-full text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Attach images"
          >
            <ImageIcon size={15} className="text-primary-400" />
            <span className="text-[11px] font-bold hidden sm:inline">Media</span>
          </button>
          
          {/* Mention & Tag Icons */}
          <button
            type="button"
            onClick={() => setContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '@' : ' @'))}
            className="w-8 h-8 rounded-full text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center text-xs font-bold"
            title="Mention someone"
          >
            @
          </button>
          <button
            type="button"
            onClick={() => setContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '#' : ' #'))}
            className="w-8 h-8 rounded-full text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center text-xs font-bold"
            title="Add a hashtag"
          >
            #
          </button>
          <input
            id="composer-file-input"
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        {/* Glassmorphism Symmetrical Post Pill Button */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-primary-600/90 hover:bg-primary-500 text-white font-extrabold rounded-full px-5 py-1.5 h-8 sm:h-8.5 text-[11px] uppercase tracking-wider shadow-[0_4px_15px_rgba(99,102,241,0.35)] backdrop-blur-md border border-primary-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40 shrink-0 self-center flex items-center justify-center gap-1.5"
          style={clanThemeColor ? { backgroundColor: clanThemeColor } : undefined}
        >
          {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post"}
        </button>
      </div>
    </div>
  );
}

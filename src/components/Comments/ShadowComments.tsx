"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ IMPORT SINGLETON
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
    Bold, Italic, EyeOff, Send, MoreVertical, Flag, ThumbsUp, ThumbsDown, 
    MessageSquare, CornerDownRight, AlertTriangle, Trash2, Edit2, User, X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import Link from 'next/link'; 
import { formatDistanceToNow } from 'date-fns';

// --- TYPES ---
interface UserProfile {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
}

interface Comment {
    id: string;
    content: string;
    user_id: string;
    parent_id: string | null;
    created_at: string;
    is_spoiler: boolean;
    is_edited: boolean;
    profiles?: UserProfile; 
    replies?: Comment[];
    likes_count?: number;
}

interface CommentInputProps {
    episodeId: string;
    focusOnMount?: boolean;
    replyingTo?: { id: string; username: string } | null;
    onCancelReply?: () => void;
    onPost: (text: string, isSpoiler: boolean, parentId?: string | null) => void;
}

// --- UTILS: Custom Parser ---
const formatText = (text: string) => {
    const parts = text.split(/(\|\|.*?\|\||\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('||') && part.endsWith('||')) {
            return <span key={i} className="bg-zinc-800 text-zinc-800 hover:text-zinc-200 cursor-pointer px-1 rounded transition-colors select-none" title="Click to reveal spoiler">{part.slice(2, -2)}</span>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-primary-400">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="text-zinc-300">{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

// --- SUB-COMPONENT: Single Comment Item ---
const CommentItem = ({ comment, currentUserId, onReply, onReport, onDelete, onEdit }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReply, setShowReply] = useState(false);

    const handleSaveEdit = () => {
        if (!editContent.trim()) return;
        onEdit(comment.id, editContent);
        setIsEditing(false);
    };

    const displayName = comment.profiles?.full_name || comment.profiles?.username || `User_${comment.user_id.slice(0,4)}`;
    const avatarUrl = comment.profiles?.avatar_url;

    return (
        <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Link href={`/profile/${comment.user_id}`} onClick={(e) => e.stopPropagation()}>
                <Avatar className="w-10 h-10 border-2 border-zinc-800 shrink-0 cursor-pointer hover:border-primary-500 transition-colors">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-zinc-900 text-zinc-500 text-xs font-black">{displayName[0]}</AvatarFallback>
                </Avatar>
            </Link>
            
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/profile/${comment.user_id}`} 
                            onClick={(e) => e.stopPropagation()}
                            className={cn("text-xs font-black uppercase tracking-wide hover:text-primary-500 transition-colors", comment.user_id === currentUserId ? "text-primary-400" : "text-zinc-200")}
                        >
                            {comment.user_id === currentUserId ? "You" : displayName}
                        </Link>
                        {comment.is_edited && <span className="text-[9px] text-zinc-600 italic">(edited)</span>}
                        <span className="text-[9px] text-zinc-600 font-mono">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={14} className="text-zinc-600 hover:text-white" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111] border-white/10">
                            {currentUserId === comment.user_id ? (
                                <>
                                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-xs gap-2 cursor-pointer text-zinc-300 focus:text-white"><Edit2 size={12}/> Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-xs text-primary-400 gap-2 cursor-pointer focus:text-primary-500"><Trash2 size={12}/> Delete</DropdownMenuItem>
                                </>
                            ) : (
                                <DropdownMenuItem onClick={() => onReport(comment.id, comment.user_id)} className="text-xs text-primary-400 gap-2 cursor-pointer focus:text-primary-500"><Flag size={12}/> Report</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <Textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)} 
                            className="bg-black/40 border-white/10 text-xs text-zinc-300 min-h-[80px]" 
                        />
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-6 text-[10px] text-zinc-400">Cancel</Button>
                            <Button size="sm" onClick={handleSaveEdit} className="h-6 text-[10px] bg-primary-600 hover:bg-primary-700 text-white">Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                        {comment.is_spoiler ? (
                            <span className="text-zinc-600 italic bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800 select-none">Spoiler Content (Hover to reveal)</span>
                        ) : formatText(comment.content)}
                    </p>
                )}

                <div className="flex items-center gap-4 pt-1">
                    <button className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-primary-500 transition-colors">
                        <ThumbsUp size={12}/> {comment.likes_count || 0}
                    </button>
                    <button className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors">
                        <ThumbsDown size={12}/>
                    </button>
                    <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-white transition-colors">
                        <MessageSquare size={12}/> Reply
                    </button>
                </div>

                {showReply && (
                    <div className="pl-4 border-l-2 border-white/5 mt-2">
                         <CommentInput 
                            episodeId={""} 
                            focusOnMount={true} 
                            replyingTo={{id: comment.id, username: displayName}}
                            onCancelReply={() => setShowReply(false)}
                            onPost={(text, spoiler, pid) => { onReply(text, spoiler, comment.id); setShowReply(false); }} 
                        />
                    </div>
                )}

                {/* Recursive Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-4 border-l-2 border-white/5 space-y-4 mt-4">
                        {comment.replies.map((reply: any) => (
                            <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} onReply={onReply} onReport={onReport} onDelete={onDelete} onEdit={onEdit} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Rich Input Box ---
const CommentInput = ({ episodeId, focusOnMount = false, replyingTo, onCancelReply, onPost }: CommentInputProps) => {
    const [text, setText] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (focusOnMount && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [focusOnMount, replyingTo]);

    const handleFormat = (type: 'bold' | 'italic' | 'spoiler') => {
        const wrap = type === 'bold' ? '**' : type === 'italic' ? '*' : '||';
        setText(prev => `${prev}${wrap}text${wrap}`);
    };

    return (
        <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-white/5 focus-within:border-primary-500/30 transition-all relative">
            {replyingTo && (
                <div className="flex items-center justify-between bg-primary-900/10 px-3 py-1.5 rounded-lg border border-primary-500/20 mb-1">
                    <span className="text-[10px] text-primary-400 font-bold">Replying to <span className="text-white">{replyingTo.username}</span></span>
                    <button onClick={onCancelReply} className="text-primary-400 hover:text-white"><X size={10}/></button>
                </div>
            )}
            
            <Textarea 
                ref={textareaRef}
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder={replyingTo ? "Write your reply..." : "Transmit your thoughts..."} 
                className="bg-transparent border-none text-xs focus-visible:ring-0 resize-none min-h-[60px] p-0 placeholder:text-zinc-600 text-zinc-300 leading-relaxed"
            />
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <div className="flex gap-1">
                    <button onClick={() => handleFormat('bold')} className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors" title="Bold"><Bold size={12}/></button>
                    <button onClick={() => handleFormat('italic')} className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors" title="Italic"><Italic size={12}/></button>
                    <button onClick={() => handleFormat('spoiler')} className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-primary-500 transition-colors" title="Spoiler Tag"><EyeOff size={12}/></button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsSpoiler(!isSpoiler)}>
                        <div className={cn("w-3 h-3 rounded-full border transition-colors", isSpoiler ? "bg-primary-600 border-primary-600" : "border-zinc-600")} />
                        <span className={cn("text-[9px] font-bold uppercase", isSpoiler ? "text-primary-500" : "text-zinc-600")}>Spoiler</span>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => { if(text.trim()) { onPost(text, isSpoiler, replyingTo ? replyingTo.id : null); setText(""); } }} 
                        className="h-6 px-4 bg-white/5 hover:bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all"
                    >
                        Send <Send size={10} className="ml-2"/>
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function ShadowComments({ episodeId }: { episodeId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    
    // Interaction State
    const [shouldFocusInput, setShouldFocusInput] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

    // FETCH COMMENTS
    const fetchComments = async () => {
        if (!supabase) return;

        // Fetch User (using shared client)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        // Fetch Comments with Joined Profile Data
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles (
                    username,
                    avatar_url,
                    full_name
                )
            `)
            .eq('episode_id', episodeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Comments Fetch Error:", error);
            return;
        }

        if (data) {
            const typedData = data as unknown as Comment[]; 
            
            const roots = typedData.filter((c) => !c.parent_id);
            const replies = typedData.filter((c) => c.parent_id);
            
            roots.forEach((root) => {
                root.replies = replies.filter((r) => r.parent_id === root.id);
            });
            
            setComments(roots);
        }
    };

    useEffect(() => { 
        fetchComments(); 
        
        if (!supabase) return;

        // Realtime Subscription
        const channel = supabase
            .channel('comments-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
                fetchComments();
            })
            .subscribe();

        return () => { supabase?.removeChannel(channel); };
    }, [episodeId]);

    // ACTIONS
    const handlePost = async (content: string, isSpoiler: boolean, parentId: string | null = null) => {
        if (!supabase) return;
        if (!userId) { toast.error("Log in to transmit."); return; }
        
        // ✅ Using Shared Client
        const { error } = await (supabase.from('comments') as any).insert({
            episode_id: episodeId,
            user_id: userId,
            content,
            is_spoiler: isSpoiler,
            parent_id: parentId
        });

        if (!error) {
            toast.success("Signal transmitted.");
            setReplyingTo(null);
            setShouldFocusInput(false); 
        } else {
            toast.error("Transmission failed.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!supabase) return;
        await supabase.from('comments').delete().eq('id', id);
        toast.success("Signal erased.");
    };

    const handleEdit = async (id: string, newContent: string) => {
        if (!supabase) return;
        const { error } = await (supabase.from('comments') as any).update({ content: newContent, is_edited: true }).eq('id', id);
        if(error) toast.error("Update failed.");
        else toast.success("Signal updated.");
    };

    const handleReport = async (commentId: string, reportedUserId: string) => {
        if (!supabase || !userId) return;
        const { error } = await (supabase.from('comment_reports') as any).insert({
            comment_id: commentId,
            reporter_id: userId,
            reported_user_id: reportedUserId,
            reason: "User Report" 
        });
        if (!error) toast.success("Report filed.");
        else toast.error("Already reported.");
    };

    // --- CLICK HANDLERS ---
    const handleContainerClick = () => {
        setReplyingTo(null);
        setShouldFocusInput(false); 
        setIsOpen(true);
    };

    const handlePreviewCommentClick = (e: React.MouseEvent, commentId: string, username: string) => {
        e.stopPropagation();
        setReplyingTo({ id: commentId, username: username });
        setShouldFocusInput(true);
        setIsOpen(true);
    };

    const handleInputTriggerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setReplyingTo(null);
        setShouldFocusInput(true);
        setIsOpen(true);
    };

    return (
        <div className="w-full">
            {/* PREVIEW CARD */}
            <div 
                onClick={handleContainerClick}
                className="bg-[#0a0a0a] rounded-[40px] border border-white/5 shadow-2xl shadow-primary-900/10 overflow-hidden mb-12 cursor-pointer hover:border-primary-500/20 hover:shadow-primary-900/20 transition-all duration-300 group/card"
            >
                 <div className="p-8 border-b border-white/5 bg-gradient-to-r from-primary-900/5 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={20} className="text-primary-600 group-hover/card:text-primary-500 transition-colors" />
                        <h3 className="font-black text-white text-[11px] font-[Cinzel] tracking-[0.4em] uppercase">Community Transmission</h3>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-primary-600/30 text-primary-500 font-bold">{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} Signals</Badge>
                 </div>

                 <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {comments.slice(0, 3).map((c) => {
                        const displayName = c.profiles?.username || c.user_id.slice(0,4);
                        return (
                            <div 
                                key={c.id} 
                                onClick={(e) => handlePreviewCommentClick(e, c.id, displayName)} 
                                className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover/card:bg-white/10 transition-colors shadow-sm relative overflow-hidden hover:border-primary-500/40"
                            >
                                <div className="flex items-center gap-3 mb-3 relative z-10">
                                    <Avatar className="w-8 h-8 border border-white/10">
                                            <AvatarImage src={c.profiles?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-zinc-800 text-[10px]">{displayName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-zinc-200">{displayName}</span>
                                            <span className="text-[8px] text-zinc-600">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mb-3 relative z-10">
                                    {c.is_spoiler ? <span className="text-primary-800 blur-sm select-none">SPOILER</span> : c.content}
                                </p>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-2"><CornerDownRight size={10}/> Reply</span>
                                </div>
                            </div>
                        );
                     })}
                     {comments.length === 0 && <div className="col-span-3 text-center text-zinc-600 text-[10px] font-mono py-4">No signals detected in this sector.</div>}
                 </div>
                 
                 <div className="px-8 pb-8">
                     <div 
                        onClick={handleInputTriggerClick}
                        className="flex items-center gap-4 bg-black/40 p-2 pl-4 rounded-full border border-white/10 cursor-text group-hover/card:border-primary-500/30 transition-all shadow-inner"
                    >
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center"><User size={12} className="text-white" /></div>
                        <span className="text-[10px] text-zinc-500 font-bold group-hover/card:text-zinc-400">Transmit your thoughts...</span>
                        <Button size="icon" className="rounded-full w-8 h-8 ml-auto bg-white/5 hover:bg-primary-600 text-white border border-white/5"><Send size={12} /></Button>
                    </div>
                 </div>
            </div>

            {/* FULL DIALOG OVERLAY */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-[#0a0a0a] border-primary-500/20 max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl shadow-primary-900/20 rounded-[30px] outline-none">
                    <DialogHeader className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-xl z-20">
                        <DialogTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white"><MessageSquare size={14} className="text-primary-600"/> Discussion Channel</DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">Share your theories, avoid spoilers, respect the code.</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                         {/* Comments Feed */}
                         <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-black/20 to-transparent">
                            <ScrollArea className="h-full w-full p-6">
                                <div className="space-y-6 pb-20">
                                    {comments.map(c => (
                                        <CommentItem key={c.id} comment={c} currentUserId={userId} onReply={(text:any, spoiler:any, pid:any) => handlePost(text, spoiler, pid)} onReport={handleReport} onDelete={handleDelete} onEdit={handleEdit} />
                                    ))}
                                    {comments.length === 0 && <div className="h-full flex items-center justify-center text-zinc-700 text-xs uppercase tracking-widest">Void Empty</div>}
                                </div>
                            </ScrollArea>
                         </div>

                         {/* Sidebar / Bottom Input */}
                         <div className="w-full md:w-96 border-l border-white/5 bg-[#050505] p-6 flex flex-col gap-6 z-20 shadow-xl">
                             <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider"><AlertTriangle size={12} className="text-primary-600"/> Posting Rules</div>
                             <ul className="text-[10px] text-zinc-500 space-y-2 list-disc pl-4 marker:text-primary-900">
                                 <li>Do not post direct download links.</li>
                                 <li>Use the <b>Spoiler</b> tool for plot details.</li>
                                 <li>Respect other agents in the field.</li>
                             </ul>
                             <div className="flex-1" />
                             
                             <CommentInput 
                                episodeId={episodeId} 
                                focusOnMount={shouldFocusInput}
                                replyingTo={replyingTo}
                                onCancelReply={() => setReplyingTo(null)}
                                onPost={handlePost} 
                             />
                         </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
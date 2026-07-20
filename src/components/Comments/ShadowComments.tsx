"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ IMPORT SINGLETON
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
    Bold, Italic, EyeOff, Send, MoreVertical, Flag, ThumbsUp, ThumbsDown, 
    MessageSquare, CornerDownRight, AlertTriangle, Trash2, Edit2, User, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// --- SUB-COMPONENT: Single Comment Item (Flat reply rendering - no pyramid nesting) ---
const CommentItem = ({ comment, currentUserId, onReply, onReport, onDelete, onEdit, isReply = false }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReply, setShowReply] = useState(false);
    const [showRepliesToggle, setShowRepliesToggle] = useState(false);

    const handleSaveEdit = () => {
        if (!editContent.trim()) return;
        onEdit(comment.id, editContent);
        setIsEditing(false);
    };

    const displayName = comment.profiles?.full_name || comment.profiles?.username || `User_${comment.user_id.slice(0,4)}`;
    const avatarUrl = comment.profiles?.avatar_url;

    // Flatten all nested replies into a single array, keeping track of who they replied to
    const flattenReplies = (replies: any[], parentName?: string): any[] => {
        if (!replies || replies.length === 0) return [];
        const result: any[] = [];
        for (const reply of replies) {
            const currentName = reply.profiles?.full_name || reply.profiles?.username || `User_${reply.user_id.slice(0,4)}`;
            result.push({...reply, replyingToName: parentName});
            if (reply.replies && reply.replies.length > 0) {
                result.push(...flattenReplies(reply.replies, currentName));
            }
        }
        return result;
    };

    // For root comments, we start flattening without a parent name
    const allReplies = !isReply ? flattenReplies(comment.replies || []) : [];
    const hasReplies = allReplies.length > 0;

    return (
        <div className="animate-in fade-in duration-300">
            <div className={cn("relative flex gap-4 group", isReply ? "mt-2" : "mt-4")}>
                {/* Avatar */}
                <Link href={`/profile/${comment.user_id}`} onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
                    <Avatar className={cn("cursor-pointer hover:opacity-80 transition-opacity", isReply ? "w-6 h-6" : "w-10 h-10")}>
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-zinc-800 text-white text-xs font-bold">{displayName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Link 
                            href={`/profile/${comment.user_id}`} 
                            onClick={(e) => e.stopPropagation()}
                            className={cn("text-[13px] font-medium hover:underline cursor-pointer truncate", comment.user_id === currentUserId ? "text-primary-500" : "text-zinc-100")}
                        >
                            {displayName}
                        </Link>
                        <span className="text-[12px] text-zinc-400 hover:text-zinc-300 cursor-pointer">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: false }).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd')}
                        </span>
                        {comment.is_edited && <span className="text-[11px] text-zinc-500 italic">(edited)</span>}
                        
                        {/* Options Menu */}
                        <div className="ml-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-full outline-none">
                                    <MoreVertical size={16} className="text-zinc-400" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#212121] border-none text-zinc-100 shadow-xl rounded-xl py-1 min-w-[120px]">
                                    {currentUserId === comment.user_id ? (
                                        <>
                                            <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-[13px] gap-3 cursor-pointer focus:bg-white/10 px-4 py-2"><Edit2 size={16}/> Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-[13px] gap-3 cursor-pointer focus:bg-white/10 px-4 py-2"><Trash2 size={16}/> Delete</DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem onClick={() => onReport(comment.id, comment.user_id)} className="text-[13px] gap-3 cursor-pointer focus:bg-white/10 px-4 py-2"><Flag size={16}/> Report</DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex flex-col gap-2 mt-1 mb-2">
                            <div className="relative">
                                <Textarea 
                                    value={editContent} 
                                    onChange={(e) => setEditContent(e.target.value)} 
                                    className="bg-transparent border-0 border-b border-zinc-600 rounded-none focus-visible:ring-0 focus-visible:border-white px-0 py-1 text-[14px] text-white min-h-[40px] resize-none overflow-hidden" 
                                />
                            </div>
                            <div className="flex gap-3 justify-end items-center mt-1">
                                <button onClick={() => setIsEditing(false)} className="text-[13px] font-medium text-white hover:bg-white/10 px-4 py-1.5 rounded-full transition-colors">Cancel</button>
                                <button onClick={handleSaveEdit} className={cn("text-[13px] font-medium px-4 py-1.5 rounded-full transition-colors", editContent.trim() ? "bg-primary-600 text-black hover:bg-primary-500" : "bg-zinc-800 text-zinc-500 cursor-not-allowed")}>Save</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[14px] text-zinc-100 leading-snug whitespace-pre-wrap break-words">
                            {comment.replyingToName && <span className="text-primary-500 font-medium mr-1">@{comment.replyingToName}</span>}
                            {comment.is_spoiler ? (
                                <span className="text-zinc-500 italic bg-zinc-900 px-1.5 py-0.5 rounded cursor-pointer hover:bg-zinc-800 select-none">Spoiler Content (Hover to reveal)</span>
                            ) : formatText(comment.content)}
                        </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 -ml-2 text-zinc-400">
                        <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-1.5 rounded-full transition-colors active:scale-95 group/btn">
                            <ThumbsUp size={16} className="group-hover/btn:text-white" />
                            {comment.likes_count > 0 && <span className="text-[12px]">{comment.likes_count}</span>}
                        </button>
                        <button className="flex items-center hover:bg-white/10 px-2 py-1.5 rounded-full transition-colors active:scale-95 group/btn">
                            <ThumbsDown size={16} className="group-hover/btn:text-white" />
                        </button>
                        <button onClick={() => setShowReply(!showReply)} className="text-[12px] font-medium hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors active:scale-95">
                            Reply
                        </button>
                    </div>

                    {showReply && (
                        <div className="mt-2 mb-4">
                             <CommentInput 
                                episodeId={""} 
                                focusOnMount={true} 
                                replyingTo={{id: comment.id, username: displayName}}
                                onCancelReply={() => setShowReply(false)}
                                onPost={(text, spoiler, pid) => { onReply(text, spoiler, comment.id); setShowReply(false); }} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Flat replies */}
            {!isReply && hasReplies && (
                <div className="ml-10 mt-1">
                    <button onClick={() => setShowRepliesToggle(!showRepliesToggle)} className="flex items-center gap-2 text-primary-500 hover:bg-primary-500/10 px-4 py-2 rounded-full transition-colors text-[14px] font-medium active:scale-95">
                        {showRepliesToggle ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                        {allReplies.length} {allReplies.length === 1 ? 'reply' : 'replies'}
                    </button>
                    {showRepliesToggle && (
                        <div className="mt-2 space-y-1 mb-4">
                            {allReplies.map((reply: any) => (
                                <CommentItem key={reply.id} comment={{...reply, replies: []}} currentUserId={currentUserId} onReply={onReply} onReport={onReport} onDelete={onDelete} onEdit={onEdit} isReply={true} />
                            ))}
                        </div>
                    )}
                </div>
            )}
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
        <div className="flex flex-col gap-2 w-full mt-2">
            {replyingTo && (
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] text-zinc-500 font-medium flex items-center gap-1">
                        <CornerDownRight size={14}/> Replying to <span className="text-zinc-300 font-medium">@{replyingTo.username}</span>
                    </span>
                    <button onClick={onCancelReply} className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"><X size={12}/></button>
                </div>
            )}
            
            <div className="relative">
                <Textarea 
                    ref={textareaRef}
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    placeholder={replyingTo ? "Add a reply..." : "Add a comment..."} 
                    className="bg-transparent border-0 border-b border-zinc-600 rounded-none focus-visible:ring-0 focus-visible:border-white px-0 py-2 text-[14px] placeholder:text-zinc-500 text-white min-h-[30px] overflow-hidden resize-none transition-colors"
                />
            </div>
            
            {/* Action Bar (shows formatting options and send button) */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                    <button onClick={() => handleFormat('bold')} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Bold"><Bold size={16}/></button>
                    <button onClick={() => handleFormat('italic')} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Italic"><Italic size={16}/></button>
                    <button onClick={() => handleFormat('spoiler')} className={cn("p-2 rounded-full transition-colors", isSpoiler ? "bg-primary-500/20 text-primary-500" : "hover:bg-white/10 text-zinc-400 hover:text-white")} onClickCapture={() => setIsSpoiler(!isSpoiler)} title="Spoiler Tag">
                        <EyeOff size={16}/>
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onCancelReply} 
                        className={cn("text-[13px] font-medium text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors", !replyingTo && !text.trim() && "hidden")}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => { if(text.trim()) { onPost(text, isSpoiler, replyingTo ? replyingTo.id : null); setText(""); setIsSpoiler(false); } }} 
                        className={cn("text-[13px] font-medium px-4 py-2 rounded-full transition-colors", text.trim() ? "bg-primary-600 hover:bg-primary-500 text-black" : "bg-zinc-800 text-zinc-500 cursor-not-allowed")}
                        disabled={!text.trim()}
                    >
                        {replyingTo ? "Reply" : "Comment"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function ShadowComments({ episodeId }: { episodeId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    
    // Interaction State
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
            const commentMap = new Map<string, Comment>();
            const roots: Comment[] = [];
            
            // First pass: add all comments to map and ensure replies array exists
            typedData.forEach(c => {
                c.replies = [];
                commentMap.set(c.id, c);
            });
            
            // Second pass: attach children to parents, or push to roots
            typedData.forEach(c => {
                if (c.parent_id) {
                    const parent = commentMap.get(c.parent_id);
                    if (parent) {
                        parent.replies!.push(c);
                    } else {
                        // Orphaned reply (parent deleted/missing)
                        roots.push(c);
                    }
                } else {
                    roots.push(c);
                }
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

    return (
        <div className="w-full mt-16 mb-12 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                <MessageSquare size={24} className="text-primary-600" />
                <h3 className="font-black text-white text-xl md:text-2xl font-[Cinzel] tracking-[0.2em] uppercase">Community Transmission</h3>
                <Badge variant="outline" className="text-[10px] md:text-xs border-primary-600/30 text-primary-500 font-bold ml-2">
                    {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} Signals
                </Badge>
            </div>

            {/* TWO-COLUMN LAYOUT */}
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] gap-10 items-start">
                
                {/* LEFT: Comments Feed */}
                <div className="w-full flex flex-col gap-6">
                    {comments.length === 0 ? (
                        <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 bg-black/20 rounded-3xl">
                            <span className="text-zinc-600 text-sm font-mono mb-2">No signals detected in this sector.</span>
                            <span className="text-zinc-700 text-xs uppercase tracking-widest font-black">Be the first to transmit</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {comments.map(c => (
                                <CommentItem 
                                    key={c.id} 
                                    comment={c} 
                                    currentUserId={userId} 
                                    onReply={(text:any, spoiler:any, pid:any) => handlePost(text, spoiler, pid)} 
                                    onReport={handleReport} 
                                    onDelete={handleDelete} 
                                    onEdit={handleEdit} 
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Sticky Sidebar */}
                <div className="flex flex-col gap-6 w-full lg:sticky lg:top-[120px] bg-[#0a0a0a] p-6 md:p-8 rounded-[32px] border border-white/5 shadow-2xl shadow-primary-900/5">
                    
                    {/* Rules */}
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-wider mb-2">
                        <AlertTriangle size={14} className="text-primary-600"/> Posting Rules
                    </div>
                    <ul className="text-xs text-zinc-500 space-y-3 list-disc pl-4 marker:text-primary-900 leading-relaxed font-medium">
                        <li>Do not post direct download links or malicious content.</li>
                        <li>Use the <span className="text-primary-500 font-bold bg-primary-900/20 px-1.5 py-0.5 rounded">Spoiler</span> tool for important plot details.</li>
                        <li>Respect other agents in the field. Violators will be purged.</li>
                    </ul>
                    
                    <div className="w-full h-px bg-white/5 my-2" />
                    
                    {/* Input */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-widest mb-1">New Transmission</span>
                        <CommentInput 
                            episodeId={episodeId} 
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                            onPost={handlePost} 
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
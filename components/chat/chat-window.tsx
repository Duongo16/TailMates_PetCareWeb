"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2, Image as ImageIcon, Smile, MoreVertical, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { pusherClient } from "@/lib/pusher"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { messagesAPI, conversationsAPI } from "@/lib/api"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"

interface ChatWindowProps {
    conversation: any
    currentUser: any
}

export function ChatWindow({ conversation, currentUser }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [isOtherOnline, setIsOtherOnline] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const otherParticipant = conversation.participants.find((p: any) => {
        const pId = p._id?.toString() || p.id?.toString() || p.toString()
        const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()
        return pId !== currentUserId
    })

    useEffect(() => {
        fetchMessages()
        markAsRead()

        const channel = pusherClient.subscribe(`conversation-${conversation._id}`)
        channel.bind("new-message", (message: any) => {
            setMessages((prev) => {
                // Prevent duplication
                if (prev.find(m => m._id === message._id)) return prev

                // Remove optimistic message if it was from me
                const senderId = message.senderId?._id?.toString() || message.senderId?.id?.toString() || message.senderId?.toString()
                const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()

                if (senderId === currentUserId) {
                    return prev.filter(m => !m.isOptimistic).concat(message)
                }

                return [...prev, message]
            })

            // Auto mark as read if message is from others
            const senderId = message.senderId?._id?.toString() || message.senderId?.id?.toString() || message.senderId?.toString()
            const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()
            if (senderId !== currentUserId) {
                markAsRead()
            }
        })

        return () => {
            pusherClient.unsubscribe(`conversation-${conversation._id}`)
        }
    }, [conversation._id])

    useEffect(() => {
        if (!pusherClient || !otherParticipant) return;

        const presenceChannel = pusherClient.subscribe('presence-online-users');

        const updatePresence = () => {
            const members = (presenceChannel as any).members;
            if (members) {
                const otherId = otherParticipant._id?.toString() || otherParticipant.id?.toString() || otherParticipant.toString();
                setIsOtherOnline(!!members.get(otherId));
            }
        };

        presenceChannel.bind('pusher:subscription_succeeded', updatePresence);
        presenceChannel.bind('pusher:member_added', updatePresence);
        presenceChannel.bind('pusher:member_removed', updatePresence);

        return () => {
            pusherClient.unsubscribe('presence-online-users');
        }
    }, [otherParticipant])

    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current;
            const { scrollTop, scrollHeight, clientHeight } = scrollArea;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

            const lastMessage = messages[messages.length - 1];
            const senderId = lastMessage?.senderId?._id?.toString() || lastMessage?.senderId?.id?.toString() || lastMessage?.senderId?.toString();
            const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString();

            if (isNearBottom || senderId === currentUserId) {
                setTimeout(() => {
                    scrollArea.scrollTop = scrollArea.scrollHeight;
                }, 50);
            }
        }
    }, [messages, currentUser])

    const fetchMessages = async () => {
        setIsLoading(true)
        try {
            const response = await messagesAPI.list(conversation._id)
            if (response.success && response.data) {
                setMessages(response.data || [])
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err)
        } finally {
            setIsLoading(false)
            // Force scroll to bottom after initial load
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        }
    }

    const markAsRead = async () => {
        try {
            await conversationsAPI.markAsRead(conversation._id)
        } catch (err) {
            console.error("Failed to mark as read:", err)
        }
    }

    // Subscribe to real-time messages
    useEffect(() => {
        if (!conversation?._id || !pusherClient) return

        const channel = pusherClient.subscribe(`conversation-${conversation._id}`)
        
        channel.bind("new-message", (data: any) => {
            const newMessage = data.message
            // Avoid adding if it's from the same user (handled by optimistic UI)
            // or if it's already in the list
            const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()
            const senderId = newMessage.senderId?._id?.toString() || newMessage.senderId?.id?.toString() || newMessage.senderId?.toString()
            
            if (senderId !== currentUserId) {
                setMessages(prev => {
                    if (prev.find(m => m._id === newMessage._id)) return prev
                    return [...prev, newMessage]
                })
            } else {
                // If it's our own message, find a matching optimistic message to replace
                setMessages(prev => {
                    const optimisticIndex = prev.findIndex(m => m.isOptimistic && m.content === newMessage.content)
                    if (optimisticIndex !== -1) {
                        const newMessages = [...prev]
                        newMessages[optimisticIndex] = newMessage
                        return newMessages
                    }
                    // If no optimistic message found (e.g. sent from another tab), just add it if not exists
                    if (prev.find(m => m._id === newMessage._id)) return prev
                    return [...prev, newMessage]
                })
            }
        })

        return () => {
            pusherClient.unsubscribe(`private-conversation-${conversation._id}`)
        }
    }, [conversation?._id, currentUser])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSending) return

        const content = newMessage.trim()
        setNewMessage("")

        // Optimistic Update
        const optimisticMsg = {
            _id: `temp-${Date.now()}`,
            content: content,
            senderId: {
                _id: currentUser.id || currentUser._id,
                full_name: currentUser.name,
                avatar: { url: currentUser.avatar }
            },
            created_at: new Date().toISOString(),
            isOptimistic: true
        }
        setMessages(prev => [...prev, optimisticMsg])

        // setIsSending(true) // Don't block for optimistic
        try {
            const response = await messagesAPI.send({
                conversationId: conversation._id,
                content: content,
            })
            if (!response.success) {
                // Remove optimistic message if failed
                setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id))
                console.error("Failed to send message:", response.message)
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id))
            console.error("Failed to send message:", err)
        } finally {
            // setIsSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full min-h-0 bg-[#FFF9F5] relative overflow-hidden">
            {/* Decorative Paw Prints Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M30,50 Q30,40 40,40 T50,50 T40,60 T30,50 M70,50 Q70,40 80,40 T90,50 T80,60 T70,50 M50,30 Q50,20 60,20 T70,30 T60,40 T50,30 M50,70 Q50,60 60,60 T70,70 T60,80 T50,70' fill='%23F97316' /%3E%3C/svg%3E")`, backgroundSize: '150px' }} />
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white/80 backdrop-blur-md z-10 shadow-sm rounded-t-[40px]">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border shadow-sm">
                        <AvatarImage src={otherParticipant?.avatar?.url || otherParticipant?.image || conversation.metadata?.image} />
                        <AvatarFallback>{(otherParticipant?.full_name || otherParticipant?.name)?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">{otherParticipant?.full_name || otherParticipant?.name || conversation.metadata?.title}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isOtherOnline ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                {isOtherOnline ? "Trực tuyến" : "Ngoại tuyến"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar"
                ref={scrollRef}
                style={{ scrollBehavior: 'smooth' }}
            >
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0,0,0,0.02);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0,0,0,0.15);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(0,0,0,0.25);
                    }
                `}</style>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg, i) => {
                            const senderId = msg.senderId?._id?.toString() || msg.senderId?.id?.toString() || msg.senderId?.toString()
                            const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()
                            const isMe = senderId === currentUserId

                            const prevSenderId = i > 0 ? (messages[i - 1].senderId?._id?.toString() || messages[i - 1].senderId?.id?.toString() || messages[i - 1].senderId?.toString()) : null
                            const showAvatar = i === 0 || prevSenderId !== senderId

                            return (
                                <div
                                    key={msg._id || i}
                                    className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    {!isMe && (
                                        <div className="w-8 h-8 flex-shrink-0">
                                            {showAvatar ? (
                                                <Avatar className="w-8 h-8 border">
                                                    <AvatarImage src={msg.senderId?.avatar?.url || msg.senderId?.image} />
                                                    <AvatarFallback>{(msg.senderId?.full_name || msg.senderId?.name)?.[0]}</AvatarFallback>
                                                </Avatar>
                                            ) : <div className="w-8 h-8" />}
                                        </div>
                                    )}
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                    >
                                        {!isMe && showAvatar && (
                                            <span className="text-[10px] font-bold text-muted-foreground mb-1 px-1">
                                                {msg.senderId?.full_name || msg.senderId?.name || (senderId === otherParticipant?._id?.toString() ? conversation.metadata?.title : "Người dùng")}
                                            </span>
                                        )}
                                        <div
                                            className={`max-w-[85%] sm:max-w-[400px] rounded-[24px] px-5 py-3 text-sm shadow-md transition-all ${isMe
                                                ? "bg-gradient-to-br from-primary to-orange-400 text-white rounded-br-[4px] font-medium"
                                                : "bg-white text-foreground rounded-bl-[4px] border border-orange-100"
                                                } ${msg.isOptimistic ? "opacity-70" : "opacity-100"}`}
                                        >
                                            {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                                            {msg.media && msg.media.length > 0 && (
                                                <div className={`mt-2 flex flex-wrap gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                                                    {msg.media.map((item: any, idx: number) => (
                                                        <div key={idx} className="relative w-40 h-40 rounded-lg overflow-hidden border shadow-sm bg-white">
                                                            {item.type === "image" ? (
                                                                <Image
                                                                    src={item.url}
                                                                    alt="Media"
                                                                    fill
                                                                    className="object-cover cursor-pointer hover:scale-110 transition-transform"
                                                                    onClick={() => window.open(item.url, "_blank")}
                                                                />
                                                            ) : (
                                                                <video src={item.url} className="w-full h-full object-cover" controls />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] mt-1 text-muted-foreground px-1">
                                            {format(new Date(msg.created_at), "HH:mm", { locale: vi })}
                                        </p>
                                    </motion.div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white/80 backdrop-blur-md rounded-b-[40px]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-muted/50 p-2 rounded-[30px] focus-within:ring-2 ring-primary/30 transition-all border border-orange-50">
                    <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-white">
                        <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-white">
                        <Smile className="w-5 h-5" />
                    </Button>
                    <Input
                        placeholder="Aa"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-transparent border-none focus-visible:ring-0 h-10 text-sm shadow-none"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className={`rounded-full shadow-lg transition-all ${newMessage.trim()
                            ? "bg-primary text-white scale-100"
                            : "bg-primary/20 text-primary scale-90"}`}
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}

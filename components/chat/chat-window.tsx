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
        <div className="flex flex-col h-full min-h-0 bg-white relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white z-10 shadow-sm">
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
                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        {!isMe && showAvatar && (
                                            <span className="text-[10px] font-bold text-muted-foreground mb-1 px-1">
                                                {msg.senderId?.full_name || msg.senderId?.name || (senderId === otherParticipant?._id?.toString() ? conversation.metadata?.title : "Người dùng")}
                                            </span>
                                        )}
                                        <div
                                            className={`max-w-[400px] rounded-2xl px-4 py-2 text-sm shadow-sm transition-opacity ${isMe
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-muted text-foreground rounded-bl-none"
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
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-[24px] focus-within:ring-2 ring-primary/20 transition-all">
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
        </div >
    )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2, Image as ImageIcon, Smile, MoreVertical, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { pusherClient } from "@/lib/pusher"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"

interface ChatWindowProps {
    conversation: any
    currentUser: any
}

export function ChatWindow({ conversation, currentUser }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const otherParticipant = conversation.participants.find((p: any) => (p._id || p.id) !== currentUser?.id)

    useEffect(() => {
        fetchMessages()

        const channel = pusherClient.subscribe(`conversation-${conversation._id}`)
        channel.bind("new-message", (message: any) => {
            setMessages((prev) => [...prev, message])
        })

        return () => {
            pusherClient.unsubscribe(`conversation-${conversation._id}`)
        }
    }, [conversation._id])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const fetchMessages = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/v1/messages?conversationId=${conversation._id}`)
            const data = await res.json()
            if (data.success) {
                setMessages(data.data || [])
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        try {
            const res = await fetch("/api/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: conversation._id,
                    content: newMessage.trim(),
                })
            })
            const data = await res.json()
            if (data.success) {
                setNewMessage("")
            }
        } catch (err) {
            console.error("Failed to send message:", err)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border shadow-sm">
                        <AvatarImage src={conversation.metadata?.image || otherParticipant?.image} />
                        <AvatarFallback>{otherParticipant?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">{conversation.metadata?.title || otherParticipant?.name}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Trực tuyến</span>
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
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg, i) => {
                            const isMe = (msg.senderId._id || msg.senderId.id || msg.senderId) === currentUser?.id
                            const showAvatar = i === 0 || messages[i - 1].senderId._id !== msg.senderId._id

                            return (
                                <div
                                    key={msg._id || i}
                                    className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    {!isMe && (
                                        <div className="w-8 h-8 flex-shrink-0">
                                            {showAvatar ? (
                                                <Avatar className="w-8 h-8 border">
                                                    <AvatarImage src={msg.senderId.image} />
                                                    <AvatarFallback>{msg.senderId.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                            ) : <div className="w-8 h-8" />}
                                        </div>
                                    )}
                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <div
                                            className={`max-w-[400px] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-muted text-foreground rounded-bl-none"
                                                }`}
                                        >
                                            <p className="leading-relaxed">{msg.content}</p>
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
            </ScrollArea>

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
                        disabled={!newMessage.trim() || isSending}
                        className={`rounded-full shadow-lg transition-all ${newMessage.trim() ? "bg-primary scale-100" : "bg-muted scale-90"}`}
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}

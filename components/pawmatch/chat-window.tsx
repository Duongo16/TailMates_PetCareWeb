"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2, User, PawPrint } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { pawmatchAPI } from "@/lib/api"
import { pusherClient } from "@/lib/pusher"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface ChatWindowProps {
    matchId: string
    currentPetId: string
    otherPet: any
}

export function ChatWindow({ matchId, currentPetId, otherPet }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchMessages()

        // Subscribe to pusher channel
        const channel = pusherClient.subscribe(`chat-${matchId}`)
        channel.bind("new-message", (message: any) => {
            setMessages((prev) => [...prev, message])
        })

        return () => {
            pusherClient.unsubscribe(`chat-${matchId}`)
        }
    }, [matchId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const fetchMessages = async () => {
        setIsLoading(true)
        try {
            const res = await pawmatchAPI.getMessages(matchId)
            if (res.success) {
                setMessages(res.data || [])
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
            const res = await pawmatchAPI.sendMessage({
                matchId,
                senderPetId: currentPetId,
                content: newMessage.trim(),
            })
            if (res.success) {
                setNewMessage("")
            }
        } catch (err) {
            console.error("Failed to send message:", err)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex flex-col h-[600px] bg-card rounded-[32px] border shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                    <AvatarImage src={otherPet.image?.url} />
                    <AvatarFallback><PawPrint className="w-5 h-5" /></AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-bold text-foreground">{otherPet.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                        {otherPet.breed || otherPet.species}
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-sm text-muted-foreground">Hãy bắt đầu cuộc trò chuyện!</p>
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isMe = msg.senderPetId === currentPetId
                            return (
                                <div
                                    key={msg._id || i}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-muted text-foreground rounded-tl-none"
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 opacity-70 ${isMe ? "text-right" : "text-left"}`}>
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
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/10 flex gap-2">
                <Input
                    placeholder="Viết tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="rounded-full bg-white border-muted focus-visible:ring-primary h-12 px-6"
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || isSending}
                    className="rounded-full w-12 h-12 flex-shrink-0"
                >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
            </form>
        </div>
    )
}

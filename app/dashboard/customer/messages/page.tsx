"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { pusherClient } from "@/lib/pusher"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import { Loader2, MessageSquare } from "lucide-react"

export default function GlobalMessagesPage() {
    const { user, isLoading: authLoading } = useAuth()
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchConversations()

            // Listen for global user chat updates (new conversations, last message updates)
            const channel = pusherClient.subscribe(`user-${user._id}-chats`)
            channel.bind("conversation-update", (data: any) => {
                fetchConversations() // Simple approach: refetch on update
            })

            return () => {
                pusherClient.unsubscribe(`user-${user._id}-chats`)
            }
        }
    }, [user])

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/v1/conversations")
            const data = await res.json()
            if (data.success) {
                setConversations(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (authLoading || (isLoading && conversations.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    const selectedConversation = conversations.find(c => c._id === selectedConversationId)

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-card border rounded-[40px] overflow-hidden shadow-2xl">
            <ChatSidebar
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                currentUser={user}
            />
            <div className="flex-1 flex flex-col bg-white">
                {selectedConversationId ? (
                    <ChatWindow
                        conversation={selectedConversation}
                        currentUser={user}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-muted/5">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare className="w-10 h-10 text-primary/40" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground/60">Tin nhắn của bạn</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs">
                            Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trò chuyện.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

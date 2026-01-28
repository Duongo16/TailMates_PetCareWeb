"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { pusherClient } from "@/lib/pusher"
import { useSearchParams, useRouter } from "next/navigation"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import { Loader2, MessageSquare } from "lucide-react"

export function GlobalChat() {
    const { user, isLoading: authLoading } = useAuth()
    const searchParams = useSearchParams()
    const router = useRouter()

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const typeParam = searchParams.get("type")
    const contextIdParam = searchParams.get("contextId")
    const participantIdParam = searchParams.get("participantId")

    useEffect(() => {
        if (user) {
            fetchConversations()

            // Listen for global user chat updates
            const channel = pusherClient.subscribe(`user-${user.id}-chats`)
            channel.bind("conversation-update", (data: any) => {
                fetchConversations()
            })

            return () => {
                pusherClient.unsubscribe(`user-${user.id}-chats`)
            }
        }
    }, [user])

    useEffect(() => {
        if (!isLoading) {
            // Handle URL params to auto-select or create
            if (typeParam && participantIdParam) {
                const existing = conversations.find((c: any) =>
                    c.type === typeParam &&
                    c.participants.some((p: any) => (p._id || p.id) === participantIdParam)
                )
                if (existing) {
                    setSelectedConversationId(existing._id)
                    // Clear search params after selecting
                    router.replace("/dashboard/customer?tab=messages", { scroll: false })
                } else {
                    // Trigger creation logic
                    handleStartNewConversation()
                }
            }
        }
    }, [isLoading, typeParam, participantIdParam, conversations])

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

    const handleStartNewConversation = async () => {
        if (!typeParam || !participantIdParam) return

        try {
            const res = await fetch("/api/v1/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: typeParam,
                    participantIds: [participantIdParam],
                    contextId: contextIdParam,
                })
            })
            const data = await res.json()
            if (data.success) {
                setConversations(prev => [data.data, ...prev])
                setSelectedConversationId(data.data._id)
                // Clear search params to avoid re-triggering
                router.push("/dashboard/customer?tab=messages", { scroll: false })
            }
        } catch (error) {
            console.error("Failed to start conversation:", error)
        }
    }

    if (authLoading || (isLoading && conversations.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    const selectedConversation = conversations.find((c: any) => c._id === selectedConversationId)

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

"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { pusherClient } from "@/lib/pusher"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import { Loader2, MessageSquare } from "lucide-react"
import { conversationsAPI } from "@/lib/api"

function MessagesContent() {
    const { user, isLoading: authLoading } = useAuth()
    const searchParams = useSearchParams()
    const targetUserId = searchParams.get("userId")
    
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchConversations = useCallback(async () => {
        try {
            const response = await conversationsAPI.list()
            if (response.success && response.data) {
                setConversations(response.data)
                return response.data
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error)
        } finally {
            setIsLoading(false)
        }
        return []
    }, [])

    useEffect(() => {
        if (!user) return

        const initialize = async () => {
            setIsLoading(true)
            const currentConvs = await fetchConversations()

            if (targetUserId) {
                // Search in the freshly fetched list
                const existing = currentConvs.find((c: any) => 
                    c.participants.some((p: any) => (p._id || p.id || p) === targetUserId) && 
                    c.type === "PAWMATCH"
                )

                if (existing) {
                    setSelectedConversationId(existing._id)
                } else {
                    try {
                        const response = await conversationsAPI.create({
                            type: "PAWMATCH",
                            participantIds: [targetUserId]
                        })
                        if (response.success && response.data) {
                            const newConv = response.data
                            setConversations(prev => {
                                if (prev.some(c => c._id === newConv._id)) return prev
                                return [newConv, ...prev]
                            })
                            setSelectedConversationId(newConv._id)
                        }
                    } catch (error) {
                        console.error("Failed to create conversation:", error)
                    }
                }
            }
        }

        initialize()

        // Pusher subscription
        const channelId = user.id
        const channel = pusherClient.subscribe(`user-${channelId}-chats`)
        channel.bind("conversation-update", () => {
            fetchConversations()
        })

        return () => {
            pusherClient.unsubscribe(`user-${channelId}-chats`)
        }
    }, [user, targetUserId, fetchConversations])

    if (authLoading || (isLoading && conversations.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50/50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    const selectedConversation = conversations.find(c => c._id === selectedConversationId)

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex h-[calc(100vh-140px)] bg-card border border-border/50 rounded-[40px] overflow-hidden shadow-2xl">
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
                            <h3 className="text-xl font-bold text-foreground/60">Tin nhắn mạng xã hội</h3>
                            <p className="text-muted-foreground mt-2 max-w-xs">
                                Chọn một người bạn hoặc bắt đầu nhắn tin từ trang cá nhân của họ.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function SocialMessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50/50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    )
}

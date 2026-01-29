"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { pusherClient } from "@/lib/pusher"
import { conversationsAPI } from "@/lib/api"
import { chatEvents, type StartConversationParams } from "@/lib/chat-events"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import { MessageCircle, X, Minimize2, Maximize2, Loader2, MessageSquare, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function GlobalChatOverlay() {
    const { user, isLoading: authLoading } = useAuth()

    // UI State
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [showChatWindow, setShowChatWindow] = useState(false) // For mobile: toggle between list and chat
    const [isStartingConversation, setIsStartingConversation] = useState(false)

    // Chat State
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [unreadTotal, setUnreadTotal] = useState(0)

    // Handle starting a new conversation from events
    const handleStartConversation = useCallback(async (params: StartConversationParams) => {
        if (!user) return

        setIsStartingConversation(true)
        setIsOpen(true)
        setIsMinimized(false)

        try {
            // Try to find existing conversation first
            const existing = conversations.find((c: any) => {
                const isSameType = c.type === params.type
                const hasParticipant = c.participants.some((p: any) => {
                    const pId = p._id?.toString() || p.id?.toString() || p.toString()
                    return pId === params.participantId
                })
                return isSameType && hasParticipant
            })

            if (existing) {
                setSelectedConversationId(existing._id)
                setShowChatWindow(true)
            } else {
                // Create new conversation
                const response = await conversationsAPI.create({
                    type: params.type,
                    participantIds: [params.participantId],
                    contextId: params.contextId,
                    metadata: params.metadata,
                })

                if (response.success && response.data) {
                    setConversations(prev => [response.data, ...prev])
                    setSelectedConversationId(response.data._id)
                    setShowChatWindow(true)
                }
            }
        } catch (error) {
            console.error("Failed to start conversation:", error)
        } finally {
            setIsStartingConversation(false)
        }
    }, [user, conversations])

    // Subscribe to chat events
    useEffect(() => {
        const unsubscribe = chatEvents.subscribe(handleStartConversation)
        return () => unsubscribe()
    }, [handleStartConversation])

    // Fetch conversations when user is logged in
    useEffect(() => {
        if (user) {
            fetchConversations()

            // Listen for global user chat updates
            const channel = pusherClient.subscribe(`user-${user.id}-chats`)
            channel.bind("conversation-update", (data: any) => {
                const isCurrentlySelected = selectedConversationId === data.conversationId;
                const currentUserId = user.id.toString();

                if (data?.lastMessage) {
                    const msgSenderId = data.lastMessage.senderId?._id?.toString() || data.lastMessage.senderId?.id?.toString() || data.lastMessage.senderId?.toString()
                    if (msgSenderId === currentUserId) {
                        // My own message - update last message and time
                        setConversations(prev => {
                            const updated = prev.map(c =>
                                c._id === data.conversationId
                                    ? { ...c, lastMessage: data.lastMessage, updated_at: new Date() }
                                    : c
                            );
                            return [...updated].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                        });
                        return
                    }
                }

                // If we have the updated unreadCount in the event, use it
                if (data.conversationId && data.unreadCount !== undefined) {
                    setConversations(prev => {
                        const exists = prev.find(c => c._id === data.conversationId);
                        if (exists) {
                            const updated = prev.map(c => c._id === data.conversationId
                                ? {
                                    ...c,
                                    lastMessage: data.lastMessage || c.lastMessage,
                                    unreadCount: {
                                        ...(c.unreadCount || {}),
                                        [currentUserId]: isCurrentlySelected ? 0 : data.unreadCount
                                    },
                                    updated_at: new Date()
                                }
                                : c
                            );
                            return [...updated].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                        } else {
                            // New conversation, must fetch
                            fetchConversations();
                            return prev;
                        }
                    });
                    return;
                }

                fetchConversations()
            })

            return () => {
                pusherClient.unsubscribe(`user-${user.id}-chats`)
            }
        }
    }, [user])

    // Calculate unread count
    useEffect(() => {
        if (user && conversations.length > 0) {
            const currentUserId = user.id.toString()
            const total = conversations.reduce((sum, conv) => {
                // Plane object access now
                const counts = conv.unreadCount || {}
                const count = Number(counts[currentUserId]) || 0
                return sum + count
            }, 0)
            setUnreadTotal(total)
        } else if (user) {
            setUnreadTotal(0)
        }
    }, [conversations, user])

    const fetchConversations = async () => {
        try {
            const response = await conversationsAPI.list()
            if (response.success && response.data) {
                setConversations(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectConversation = async (id: string) => {
        setSelectedConversationId(id)
        setShowChatWindow(true)

        // Mark as read locally
        setConversations(prev => prev.map(c => {
            if (c._id === id) {
                const currentUserId = user?.id
                return {
                    ...c,
                    unreadCount: { ...(c.unreadCount || {}), [currentUserId!]: 0 }
                }
            }
            return c
        }))

        // Call API
        try {
            await conversationsAPI.markAsRead(id)
        } catch (error) {
            console.error("Failed to mark as read:", error)
        }
    }

    const handleBackToList = () => {
        setShowChatWindow(false)
        setSelectedConversationId(null)
    }

    const handleClose = () => {
        setIsOpen(false)
        setIsMinimized(false)
        setShowChatWindow(false)
    }

    const handleToggle = () => {
        if (isMinimized) {
            setIsMinimized(false)
        } else {
            setIsOpen(!isOpen)
        }
    }

    // Don't render if not logged in
    if (authLoading || !user) {
        return null
    }

    const selectedConversation = conversations.find((c: any) => c._id === selectedConversationId)

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {(!isOpen || isMinimized) && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="fixed bottom-6 right-20 z-50"
                    >
                        <Button
                            onClick={handleToggle}
                            className={cn(
                                "relative w-14 h-14 rounded-full shadow-lg shadow-primary/30",
                                "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                                "transition-all duration-300 hover:scale-110"
                            )}
                        >
                            <MessageCircle className="w-6 h-6 text-white" />
                            {unreadTotal > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md"
                                >
                                    {unreadTotal > 9 ? "9+" : unreadTotal}
                                </motion.span>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Panel - Desktop */}
            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <>
                        {/* Desktop Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 100, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="hidden md:flex fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-card rounded-2xl shadow-2xl shadow-black/20 border border-border overflow-hidden flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5" />
                                    <h2 className="font-bold text-lg">Tin nhắn</h2>
                                    {unreadTotal > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {unreadTotal}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsMinimized(true)}
                                        className="w-8 h-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                                    >
                                        <Minimize2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClose}
                                        className="w-8 h-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex overflow-hidden">
                                {isLoading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : selectedConversationId ? (
                                    <div className="flex-1 min-h-0 flex flex-col">
                                        {/* Back button */}
                                        <button
                                            onClick={handleBackToList}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Quay lại
                                        </button>
                                        <div className="flex-1 min-h-0">
                                            <ChatWindow
                                                conversation={selectedConversation}
                                                currentUser={user}
                                            />
                                        </div>
                                    </div>
                                ) : conversations.length > 0 ? (
                                    <ChatSidebar
                                        conversations={conversations}
                                        selectedId={selectedConversationId}
                                        onSelect={handleSelectConversation}
                                        currentUser={user}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare className="w-8 h-8 text-primary/40" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground/60">Chưa có tin nhắn</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Bắt đầu cuộc trò chuyện mới từ trang sản phẩm hoặc dịch vụ
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Mobile Full Screen */}
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="md:hidden fixed inset-0 z-50 bg-background flex flex-col"
                        >
                            {/* Mobile Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground safe-area-inset-top">
                                <div className="flex items-center gap-2">
                                    {showChatWindow ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleBackToList}
                                            className="w-8 h-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                    ) : (
                                        <MessageCircle className="w-5 h-5" />
                                    )}
                                    <h2 className="font-bold text-lg">
                                        {showChatWindow ? (
                                            (() => {
                                                if (selectedConversation?.metadata?.title) return selectedConversation.metadata.title
                                                const currentUserId = user?.id
                                                const other = selectedConversation?.participants?.find((p: any) => {
                                                    const pId = p._id?.toString() || p.id?.toString() || p.toString()
                                                    return pId !== currentUserId
                                                })
                                                return other?.full_name || other?.name || selectedConversation?.metadata?.title || "Tin nhắn"
                                            })()
                                        ) : "Tin nhắn"}
                                    </h2>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClose}
                                    className="w-8 h-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Mobile Content */}
                            <div className="flex-1 overflow-hidden">
                                {isLoading ? (
                                    <div className="flex-1 flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : showChatWindow && selectedConversationId ? (
                                    <ChatWindow
                                        conversation={selectedConversation}
                                        currentUser={user}
                                    />
                                ) : conversations.length > 0 ? (
                                    <ChatSidebar
                                        conversations={conversations}
                                        selectedId={selectedConversationId}
                                        onSelect={handleSelectConversation}
                                        currentUser={user}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 h-full">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare className="w-8 h-8 text-primary/40" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground/60">Chưa có tin nhắn</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Bắt đầu cuộc trò chuyện mới từ trang sản phẩm hoặc dịch vụ
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, Filter, MessageCircle, ShoppingBag, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface ChatSidebarProps {
    conversations: any[]
    selectedId: string | null
    onSelect: (id: string) => void
    currentUser: any
}

export function ChatSidebar({ conversations, selectedId, onSelect, currentUser }: ChatSidebarProps) {
    const [filter, setFilter] = useState("ALL")
    const [search, setSearch] = useState("")

    const filteredConversations = conversations.filter(c => {
        const matchesFilter = filter === "ALL" || c.type === filter
        // Simple search logic
        const otherParticipant = c.participants.find((p: any) => (p._id || p.id) !== currentUser?.id)
        const matchesSearch = !search || otherParticipant?.name.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <div className="w-80 border-r flex flex-col bg-muted/10">
            <div className="p-6 space-y-4">
                <h2 className="text-2xl font-black text-foreground">Tin nhắn</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm..."
                        className="pl-9 rounded-xl bg-white border-muted h-10 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 flex gap-2 pb-4 overflow-x-auto no-scrollbar">
                {[
                    { id: "ALL", label: "Tất cả", icon: MessageCircle },
                    { id: "PAWMATCH", label: "PawMatch", icon: Sparkles },
                    { id: "COMMERCE", label: "Shop", icon: ShoppingBag },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === tab.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-white text-muted-foreground hover:bg-white/80"
                            }`}
                    >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-6">
                {filteredConversations.map((conv) => {
                    const otherParticipant = conv.participants.find((p: any) => (p._id || p.id) !== currentUser?.id)
                    const isActive = selectedId === conv._id
                    const unread = conv.unreadCount?.[currentUser?.id] || 0

                    return (
                        <button
                            key={conv._id}
                            onClick={() => onSelect(conv._id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${isActive
                                ? "bg-white shadow-sm ring-1 ring-primary/10"
                                : "hover:bg-white/50"
                                }`}
                        >
                            <div className="relative">
                                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={conv.metadata?.image || otherParticipant?.image} />
                                    <AvatarFallback>{otherParticipant?.name?.[0]}</AvatarFallback>
                                </Avatar>
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                        {unread}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <p className={`text-sm font-bold truncate ${unread > 0 ? "text-foreground" : "text-foreground/80"}`}>
                                        {conv.metadata?.title || otherParticipant?.name || "Người dùng"}
                                    </p>
                                    {conv.lastMessage && (
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {format(new Date(conv.updated_at), "HH:mm", { locale: vi })}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs truncate ${unread > 0 ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                                    {conv.lastMessage?.content || "Bắt đầu cuộc trò chuyện..."}
                                </p>
                            </div>
                        </button>
                    )
                })}

                {filteredConversations.length === 0 && (
                    <div className="py-10 text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Không tìm thấy hội thoại nào</p>
                    </div>
                )}
            </div>
        </div>
    )
}

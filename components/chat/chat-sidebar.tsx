"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, Filter, MessageCircle, ShoppingBag, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

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
        const otherParticipant = c.participants.find((p: any) => {
            const pId = p._id?.toString() || p.id?.toString() || p.toString()
            const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()
            return pId !== currentUserId
        })
        const searchLower = search.toLowerCase()
        const matchesSearch = !search ||
            otherParticipant?.full_name?.toLowerCase().includes(searchLower) ||
            otherParticipant?.name?.toLowerCase().includes(searchLower) ||
            c.metadata?.title?.toLowerCase().includes(searchLower)

        return matchesFilter && matchesSearch
    })

    return (
        <div className="w-full md:w-80 border-r flex flex-col bg-[#FFFBF9]">
            <div className="p-4 space-y-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Tìm kiếm hội thoại..."
                        className="pl-9 rounded-full bg-white/80 border-orange-50 h-9 text-xs focus-visible:ring-primary/20 transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 flex gap-2 pb-3 overflow-x-auto no-scrollbar">
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
                    const otherParticipant = conv.participants.find((p: any) => {
                        const pId = p._id?.toString() || p.id?.toString() || p.toString()
                        const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()
                        return pId !== currentUserId
                    })
                    const isActive = selectedId === conv._id
                    const currentUserId = currentUser?.id?.toString() || currentUser?._id?.toString()
                    const unread = Number((conv.unreadCount || {})[currentUserId!]) || 0

                    return (
                        <button
                            key={conv._id}
                            onClick={() => onSelect(conv._id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-[24px] transition-all relative group ${isActive
                                ? "bg-white shadow-lg ring-1 ring-primary/5 scale-[1.02]"
                                : "hover:bg-white/60 active:scale-95"
                                }`}
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="active-nav"
                                    className="absolute left-0 w-1.5 h-10 bg-primary rounded-r-full"
                                />
                            )}
                            <div className="relative">
                                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={otherParticipant?.avatar?.url || otherParticipant?.image || conv.metadata?.image} />
                                    <AvatarFallback>{(otherParticipant?.full_name || otherParticipant?.name)?.[0]}</AvatarFallback>
                                </Avatar>
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <p className={`text-sm font-bold truncate ${unread > 0 ? "text-foreground" : "text-foreground/80"}`}>
                                        {otherParticipant?.full_name || otherParticipant?.name || conv.metadata?.title || "Người dùng"}
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

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Heart, Loader2, Sparkles, SlidersHorizontal, ArrowRight } from "lucide-react"
import { pawmatchAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface MatchesTabProps {
  currentPetId: string
}

export function MatchesTab({ currentPetId }: MatchesTabProps) {
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true)
      try {
        const res = await pawmatchAPI.getMatches(currentPetId)
        if (res.success) {
          setMatches(res.data || [])
        }
      } catch (err) {
        console.error("Fetch matches failed:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (currentPetId) {
      fetchMatches()
    }
  }, [currentPetId])

  const handleChat = (match: any) => {
    // Navigate to chat with owner of the matched pet
    // Assuming the API returns the owner/user ID or a specific match/conversation ID
    if (match.conversation_id) {
        router.push(`/chat?conversationId=${match.conversation_id}`)
    } else {
        router.push(`/chat?recipientId=${match.pet?.owner_id || match.pet?.user_id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 font-black tracking-[0.3em] uppercase text-[10px] animate-pulse">Đang tìm bạn bè...</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col items-center justify-center space-y-8 text-center px-10"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-orange-500/10 rounded-[2.5rem] blur-3xl" />
          <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-slate-100 rotate-3">
            <Heart className="w-12 h-12 text-slate-200" />
          </div>
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Chưa có tương hợp nào</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            Mọi người vẫn đang chờ đợi bạn đấy! Hãy tiếp tục khám phá để tìm thấy những người bạn mới.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="h-full w-full max-w-5xl mx-auto px-6 py-8 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {matches.map((match, idx) => (
            <motion.div
              key={match._id || idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="group relative bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center"
            >
              <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden mb-4 ring-4 ring-slate-50 group-hover:ring-orange-50 transition-all duration-300">
                <img 
                  src={match.pet?.image?.url || match.pet?.image || "/placeholder.svg"} 
                  alt={match.pet?.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="space-y-1 mb-6">
                <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors">
                  {match.pet?.name}
                </h4>
                <p className="text-xs font-bold text-slate-400 flex items-center justify-center gap-1">
                  {match.pet?.breed || "Thú cưng"} 
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  {match.pet?.gender === 'MALE' ? 'Đực' : 'Cái'}
                </p>
              </div>

              <button
                onClick={() => handleChat(match)}
                className="w-full bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 font-black py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/btn active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest">Nhắn tin</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
              </button>

              {match.is_new && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-[8px] font-black text-white rounded-lg shadow-lg shadow-orange-500/20 uppercase tracking-tighter animate-pulse">
                  <Sparkles className="w-2 h-2" />
                  Mới
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

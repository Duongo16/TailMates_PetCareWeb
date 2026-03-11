"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { socialAPI } from "@/lib/api"
import { toast } from "sonner"

export const REACTION_EMOJIS: Record<string, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  HAHA: "😂",
  WOW: "😮",
  SAD: "😢",
  ANGRY: "😡",
}

interface ReactionBarProps {
  postId: string
  likeCount: number
  commentCount: number
  userReaction?: string | null
  onCommentClick?: () => void
  onReactionChange?: (delta: number, newReaction: string | null) => void
}

export function ReactionBar({
  postId,
  likeCount,
  commentCount,
  userReaction,
  onCommentClick,
  onReactionChange,
}: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [currentReaction, setCurrentReaction] = useState<string | null>(userReaction || null)
  const [isLoading, setIsLoading] = useState(false)
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})
  const [totalReactions, setTotalReactions] = useState(likeCount)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchReactionCounts = async () => {
    try {
      const res = await socialAPI.getPostReactions(postId)
      if (res.success && res.data) {
        const data = res.data as any
        setReactionCounts(data.counts || {})
        setTotalReactions(data.total || 0)
      }
    } catch (err) {
      console.error("Failed to fetch reaction counts:", err)
    }
  }

  // Fetch counts on mount
  useEffect(() => {
    fetchReactionCounts()
  }, [postId])

  // Sync with prop if parent updates
  useEffect(() => {
    setTotalReactions(likeCount)
  }, [likeCount])

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setShowPicker(true), 400)
  }
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setTimeout(() => setShowPicker(false), 300)
  }

  const handleReact = async (type: string) => {
    if (isLoading) return
    setIsLoading(true)
    setShowPicker(false)

    const prevReaction = currentReaction
    const prevTotal = totalReactions
    const prevCounts = { ...reactionCounts }

    // Optimistic update
    let newTotal = prevTotal
    const newCounts = { ...prevCounts }

    if (prevReaction === type) {
      // Removing reaction
      setCurrentReaction(null)
      newTotal = Math.max(0, prevTotal - 1)
      newCounts[type] = Math.max(0, (newCounts[type] || 0) - 1)
    } else {
      // Adding or changing reaction
      setCurrentReaction(type)
      if (!prevReaction) {
        // Just adding
        newTotal = prevTotal + 1
      } else {
        // Changing: decrement old type
        newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] || 0) - 1)
      }
      // Increment new type
      newCounts[type] = (newCounts[type] || 0) + 1
    }

    setTotalReactions(newTotal)
    setReactionCounts(newCounts)

    try {
      const res = await socialAPI.reactPost(postId, type)
      if (!res.success) {
        // Rollback
        setCurrentReaction(prevReaction)
        setTotalReactions(prevTotal)
        setReactionCounts(prevCounts)
        toast.error("Không thể thực hiện thao tác")
      } else {
        const responseData = res.data as any
        const action = responseData?.action
        const newReaction = responseData?.current_reaction
        
        setCurrentReaction(newReaction)
        
        // Calculate delta based on action for parent notification
        let delta = 0
        if (action === "created") delta = 1
        else if (action === "removed") delta = -1
        
        onReactionChange?.(delta, newReaction)
      }
    } catch {
      setCurrentReaction(prevReaction)
      setTotalReactions(prevTotal)
      setReactionCounts(prevCounts)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeClick = () => {
    // Simple like click => toggle LIKE, or remove if already liked
    handleReact("LIKE")
  }

  return (
    <div>
      {/* Counts */}
      <div className="flex items-center justify-between px-1 py-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {Object.entries(reactionCounts)
            .filter(([_, count]) => count > 0)
            .sort(([_, a], [__, b]) => b - a)
            .map(([type, count]) => (
              <div key={type} className="flex items-center gap-1 bg-secondary/40 px-2 py-0.5 rounded-full border border-border/50 transition-all hover:bg-secondary/60">
                <span className="text-sm leading-none">{REACTION_EMOJIS[type]}</span>
                <span className="text-[10px] font-bold text-foreground/80">{count}</span>
              </div>
            ))}
          
          {totalReactions === 0 && (
            <span className="text-xs text-muted-foreground/40 italic ml-1">Chưa có tương tác</span>
          )}
        </div>
        {commentCount > 0 && (
          <button onClick={onCommentClick} className="hover:underline text-xs font-medium">
            {commentCount} bình luận
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Action buttons */}
      <div className="flex items-center justify-around py-1">
        {/* Like button with reaction picker */}
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {/* Reaction picker */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 flex gap-1 bg-card rounded-2xl shadow-xl border border-border px-2 py-1.5 z-50"
              >
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.4, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReact(type)}
                    className="text-2xl leading-none hover:drop-shadow-md transition-all"
                    title={type}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-secondary ${
              currentReaction ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {currentReaction ? (
              <span className="text-lg leading-none">{REACTION_EMOJIS[currentReaction]}</span>
            ) : (
              <Heart className="w-5 h-5" />
            )}
            <span>{currentReaction ? currentReaction.charAt(0) + currentReaction.slice(1).toLowerCase() : "Thích"}</span>
          </button>
        </div>

        {/* Comment button */}
        <button
          onClick={onCommentClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Bình luận</span>
        </button>

        {/* Share button */}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href)
            toast.success("Đã sao chép liên kết!")
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Chia sẻ</span>
        </button>
      </div>
    </div>
  )
}

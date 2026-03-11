"use client"

import { useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { socialAPI } from "@/lib/api"
import { useComments, useReplies } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"

interface CommentItemProps {
  comment: any
  onDelete?: (id: string) => void
}

function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { user } = useAuth()
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [localLikes, setLocalLikes] = useState(comment.like_count || 0)
  const [liked, setLiked] = useState(!!comment.user_reaction)
  const { replies, setReplies, load: loadReplies, isLoading: repliesLoading } = useReplies(comment._id)

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      loadReplies()
    }
    setShowReplies(s => !s)
  }

  const handleLike = async () => {
    const prev = liked
    setLiked(!prev)
    setLocalLikes((c: number) => prev ? c - 1 : c + 1)
    try {
      await socialAPI.reactComment(comment._id, "LIKE")
    } catch {
      setLiked(prev)
      setLocalLikes((c: number) => prev ? c + 1 : c - 1)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setIsReplying(true)
    try {
      const res = await socialAPI.createReply(comment._id, { content: replyText.trim() })
      if (res.success) {
        setReplies(prev => [...prev, res.data])
        setReplyText("")
        setShowReplyInput(false)
        if (!showReplies) setShowReplies(true)
      }
    } catch {
      toast.error("Lỗi gửi reply")
    } finally {
      setIsReplying(false)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })
  const author = comment.author_id
  const authorName = author?.full_name || author?.name || "Người dùng"
  const authorAvatar = author?.avatar?.url || author?.avatar

  return (
    <div className="flex gap-2.5">
      <Avatar className="w-8 h-8 shrink-0 mt-0.5">
        <AvatarImage src={authorAvatar} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {authorName.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
          <p className="text-sm font-semibold text-foreground">{authorName}</p>
          <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
          {comment.image?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comment.image.url} alt="" className="mt-2 rounded-xl max-h-40 object-cover" />
          )}
        </div>

        {/* Meta actions */}
        <div className="flex items-center gap-3 mt-1 ml-1">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <button
            onClick={handleLike}
            className={`text-xs font-medium transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            {liked ? "❤️" : "❤"} {localLikes > 0 && `${localLikes} thích`}
          </button>
          {comment.depth === 0 && (
            <button
              onClick={() => setShowReplyInput(s => !s)}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Trả lời
            </button>
          )}
          {comment.author_id?._id === user?.id && (
            <button
              onClick={() => onDelete?.(comment._id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Reply input */}
        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex gap-2 items-center"
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {(user?.name || "U").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-2xl px-3 py-2">
                <input
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply() }}}
                  placeholder={`Trả lời ${authorName}...`}
                  className="flex-1 bg-transparent text-sm outline-none text-foreground"
                />
                <button
                  onClick={handleReply}
                  disabled={isReplying || !replyText.trim()}
                  className="text-xs font-semibold text-primary disabled:opacity-40"
                >
                  {isReplying ? "..." : "Gửi"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies toggle */}
        {comment.reply_count > 0 && comment.depth === 0 && (
          <button
            onClick={handleToggleReplies}
            className="flex items-center gap-1 mt-2 ml-1 text-xs font-medium text-primary hover:text-primary/80"
          >
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showReplies ? "Ẩn" : `Xem ${comment.reply_count} trả lời`}
          </button>
        )}

        {/* Replies list */}
        <AnimatePresence>
          {showReplies && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 space-y-2 pl-1"
            >
              {repliesLoading ? (
                <div className="text-xs text-gray-400 ml-3">Đang tải...</div>
              ) : (
                replies.map((reply: any) => (
                  <CommentItem key={reply._id} comment={reply} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface CommentSectionProps {
  postId: string
  initialVisible?: boolean
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
}

export function CommentSection({ 
  postId, 
  initialVisible = false,
  onCommentAdded,
  onCommentDeleted
}: CommentSectionProps) {
  const { user } = useAuth()
  const { comments, setComments, isLoading, hasMore, fetchMore: originalFetchMore, isFetchingMore, refetch } = useComments(postId)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const visibleComments = showAll ? comments : comments.slice(0, 2)
  const hasMoreThanTwo = comments.length > 2

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      const res = await socialAPI.createComment(postId, { content: newComment.trim() })
      if (res.success) {
        setComments(prev => [res.data, ...prev])
        setNewComment("")
        onCommentAdded?.()
      }
    } catch {
      toast.error("Lỗi gửi bình luận")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await socialAPI.deleteComment(id)
      setComments(prev => prev.filter((c: any) => c._id !== id))
      onCommentDeleted?.()
    } catch {
      toast.error("Lỗi xóa bình luận")
    }
  }

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Add comment input */}
      <div className="flex gap-2.5 items-center">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {(user?.name || "U").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-2.5">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() }}}
            placeholder="Thêm bình luận..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground"
          />
          {newComment.trim() && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="text-xs font-semibold text-primary disabled:opacity-40 whitespace-nowrap"
            >
              {isSubmitting ? "..." : "Gửi"}
            </button>
          )}
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-16 bg-gray-200 rounded-2xl" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleComments.map((comment: any) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Load more / Show all toggle */}
      {((!showAll && hasMoreThanTwo) || hasMore) && (
        <button
          onClick={() => {
            if (!showAll && hasMoreThanTwo) {
              setShowAll(true)
            } else {
              originalFetchMore()
              setShowAll(true)
            }
          }}
          disabled={isFetchingMore}
          className="text-xs text-primary font-medium hover:text-primary/80 ml-10"
        >
          {isFetchingMore ? "Đang tải..." : (!showAll && hasMoreThanTwo) ? `Xem tất cả ${comments.length} bình luận` : "Xem thêm bình luận cũ hơn"}
        </button>
      )}
    </div>
  )
}

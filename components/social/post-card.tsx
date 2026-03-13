"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Globe, Users, Lock, PawPrint, Pencil, X, ImageIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { ReactionBar } from "@/components/social/reaction-bar"
import { CommentSection } from "@/components/social/comment-section"
import { socialAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const PRIVACY_ICON: Record<string, React.ReactNode> = {
  PUBLIC: <Globe className="w-3 h-3" />,
  FRIENDS: <Users className="w-3 h-3" />,
  PRIVATE: <Lock className="w-3 h-3" />,
}

interface PostCardProps {
  post: any
  onDeleted?: (id: string) => void
  onUpdated?: (updatedPost: any) => void
}

export function PostCard({ post, onDeleted, onUpdated }: PostCardProps) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count || 0)
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count || 0)
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const [isContentClamped, setIsContentClamped] = useState(false)
  const contentRef = useRef<HTMLParagraphElement>(null)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || "")
  const [editImages, setEditImages] = useState<{ url: string; public_id: string }[]>(post.images || [])
  const [editPrivacy, setEditPrivacy] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">(post.privacy || "PUBLIC")
  const [isSaving, setIsSaving] = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (el) {
      setIsContentClamped(el.scrollHeight > el.clientHeight)
    }
  }, [post.content])

  const author = post.author_id
  const authorName = author?.full_name || "Người dùng"
  const authorAvatar = author?.avatar?.url
  const isOwn = user?.id === author?._id?.toString()
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })

  const handleDelete = async () => {
    if (!confirm("Xóa bài viết này?")) return
    setIsDeleting(true)
    try {
      const res = await socialAPI.deletePost(post._id)
      if (res.success) {
        onDeleted?.(post._id)
        toast.success("Đã xóa bài viết")
      }
    } catch {
      toast.error("Lỗi xóa bài viết")
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleStartEdit = () => {
    setEditContent(post.content || "")
    setEditImages(post.images || [])
    setEditPrivacy(post.privacy || "PUBLIC")
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (editImages.length + files.length > 10) {
      toast.error("Chỉ được đính kèm tối đa 10 ảnh")
      return
    }
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!)
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        )
        const data = await res.json()
        setEditImages(prev => [...prev, { url: data.secure_url, public_id: data.public_id }])
      } catch {
        toast.error("Lỗi tải ảnh lên")
      }
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() && editImages.length === 0) {
      toast.error("Bài viết phải có nội dung hoặc ít nhất 1 ảnh")
      return
    }
    setIsSaving(true)
    try {
      const res = await socialAPI.updatePost(post._id, {
        content: editContent,
        images: editImages,
        privacy: editPrivacy,
      })
      if (res.success) {
        toast.success("Đã cập nhật bài viết")
        setIsEditing(false)
        // Update local post data
        post.content = editContent
        post.images = editImages
        post.privacy = editPrivacy
        post.is_edited = true
        onUpdated?.(res.data)
      } else {
        toast.error(res.message || "Lỗi cập nhật bài viết")
      }
    } catch {
      toast.error("Lỗi cập nhật bài viết")
    } finally {
      setIsSaving(false)
    }
  }

  // Image grid layout
  const images = post.images || []
  const imageGrid = () => {
    if (images.length === 0) return null
    if (images.length === 1) {
      return (
        <div className="mt-3 -mx-4 cursor-pointer" onClick={() => setSelectedImageIdx(0)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0].url} alt="" className="w-full max-h-[600px] object-contain bg-black/5" />
        </div>
      )
    }
    if (images.length === 2) {
      return (
        <div className="mt-3 -mx-4 grid grid-cols-2 gap-0.5">
          {images.map((img: any, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt="" className="w-full h-72 object-contain bg-black/5 cursor-pointer" onClick={() => setSelectedImageIdx(i)} />
          ))}
        </div>
      )
    }
    if (images.length === 3) {
      return (
        <div className="mt-3 -mx-4 grid grid-cols-2 gap-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0].url} alt="" className="w-full h-64 object-contain bg-black/5 cursor-pointer row-span-2" onClick={() => setSelectedImageIdx(0)} />
          {images.slice(1).map((img: any, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt="" className="w-full h-32 object-contain bg-black/5 cursor-pointer" onClick={() => setSelectedImageIdx(i + 1)} />
          ))}
        </div>
      )
    }
    // 4+
    return (
      <div className="mt-3 -mx-4 grid grid-cols-2 gap-0.5">
        {images.slice(0, 4).map((img: any, i: number) => (
          <div key={i} className="relative cursor-pointer" onClick={() => setSelectedImageIdx(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="w-full h-40 object-cover" />
            {i === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-2xl">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Link href={`/social/profile/${author?._id}`}>
                <Avatar className="w-10 h-10 ring-2 ring-primary/5 hover:ring-primary/20 transition-all">
                  <AvatarImage src={authorAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link href={`/social/profile/${author?._id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                  {authorName}
                </Link>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{timeAgo}</span>
                  {post.is_edited && <span className="italic">· đã chỉnh sửa</span>}
                  <span>·</span>
                  <span className="flex items-center gap-0.5">{PRIVACY_ICON[post.privacy] || <Globe className="w-3 h-3" />}</span>
                </div>
              </div>
            </div>

            {/* Menu */}
            {isOwn && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(s => !s)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-9 z-50 bg-card rounded-xl shadow-lg border border-border py-1 min-w-32"
                    >
                      <button
                        onClick={handleStartEdit}
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        {isDeleting ? "Đang xóa..." : "Xóa bài viết"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Content - Edit mode or View mode */}
          {isEditing ? (
            <div className="mt-3 space-y-3">
              <Textarea
                autoFocus
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="Nội dung bài viết..."
                className="border border-border bg-secondary/30 rounded-xl p-3 resize-none min-h-[100px] text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                rows={4}
              />

              {/* Edit images */}
              {editImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {editImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => editFileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Thêm ảnh
                  </button>
                  <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditImageUpload} />

                  <select
                    value={editPrivacy}
                    onChange={e => setEditPrivacy(e.target.value as any)}
                    className="text-xs text-muted-foreground hover:text-primary bg-transparent border-none outline-none cursor-pointer px-2"
                  >
                    <option value="PUBLIC">🌍 Mọi người</option>
                    <option value="FRIENDS">👥 Bạn bè</option>
                    <option value="PRIVATE">🔒 Chỉ mình tôi</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-xs px-3 py-1.5 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || (!editContent.trim() && editImages.length === 0)}
                    className="text-xs px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            post.content && (
              <div className="mt-3 px-1">
                <p
                  ref={contentRef}
                  className={`text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed ${
                    !isContentExpanded ? "line-clamp-2" : ""
                  }`}
                >
                  {post.content}
                </p>
                {isContentClamped && (
                  <button
                    onClick={() => setIsContentExpanded(s => !s)}
                    className="text-xs font-medium text-primary hover:text-primary/80 mt-1 transition-colors"
                  >
                    {isContentExpanded ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </div>
            )
          )}

          {/* Pet tags */}
          {post.pet_tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.pet_tags.map((pet: any) => (
                <div key={pet._id} className="inline-flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-1.5 shadow-sm">
                  <PawPrint className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <span className="text-xs font-semibold text-primary">{pet.name}</span>
                    {pet.breed && (
                      <span className="text-xs text-muted-foreground ml-1">· {pet.breed}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Image grid */}
          {imageGrid()}
        </div>

        {/* Reaction bar */}
        <div className="px-4">
          <ReactionBar
            postId={post._id}
            likeCount={localLikeCount}
            commentCount={localCommentCount}
            userReaction={post.user_reaction}
            onCommentClick={() => setShowComments(s => !s)}
            onReactionChange={(delta, newReaction) => {
              setLocalLikeCount((c: number) => c + delta)
              // We could also update post.user_reaction here if we had a state for the post object
            }}
          />
        </div>

        {/* Comment section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="border-t border-gray-100 mt-1" />
              <CommentSection 
                postId={post._id} 
                onCommentAdded={() => setLocalCommentCount((c: number) => c + 1)}
                onCommentDeleted={() => setLocalCommentCount((c: number) => Math.max(0, c - 1))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Image lightbox */}
      <AnimatePresence>
        {selectedImageIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImageIdx(null)}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[selectedImageIdx]?.url}
              alt=""
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

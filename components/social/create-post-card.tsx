"use client"

import { useState, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Smile, X, PawPrint } from "lucide-react"
import { socialAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface CreatePostCardProps {
  onPostCreated?: (post: any) => void
}

export function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [images, setImages] = useState<{ url: string; public_id: string }[]>([])
  const [privacy, setPrivacy] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">("PUBLIC")
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (images.length + files.length > 10) {
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
        setImages(prev => [...prev, { url: data.secure_url, public_id: data.public_id }])
      } catch {
        toast.error("Lỗi tải ảnh lên")
      }
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error("Bài viết phải có nội dung hoặc ít nhất 1 ảnh")
      return
    }
    setIsLoading(true)
    try {
      const res = await socialAPI.createPost({ content, images, privacy })
      if (res.success) {
        setContent("")
        setImages([])
        setIsExpanded(false)
        onPostCreated?.(res.data)
        toast.success("Đã đăng bài viết!")
      } else {
        toast.error(res.message || "Lỗi đăng bài")
      }
    } catch {
      toast.error("Lỗi đăng bài")
    } finally {
      setIsLoading(false)
    }
  }

  const privacyOptions = [
    { value: "PUBLIC", label: "🌍 Mọi người" },
    { value: "FRIENDS", label: "👥 Bạn bè" },
    { value: "PRIVATE", label: "🔒 Chỉ mình tôi" },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm">
            {user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div
            className="bg-gray-50 rounded-2xl px-4 py-3 cursor-text min-h-[44px] flex items-center"
            onClick={() => setIsExpanded(true)}
          >
            {!isExpanded ? (
              <span className="text-gray-400 text-sm select-none">
                {user?.name ? `${user.name} ơi, bạn đang nghĩ gì vậy? 🐾` : "Bạn đang nghĩ gì vậy? 🐾"}
              </span>
            ) : (
              <Textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Bạn đang nghĩ gì vậy? 🐾"
                className="border-none bg-transparent p-0 resize-none min-h-[80px] text-sm focus-visible:ring-0 shadow-none"
                rows={3}
              />
            )}
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-1">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Ảnh</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

                {/* Privacy selector */}
                <select
                  value={privacy}
                  onChange={e => setPrivacy(e.target.value as any)}
                  className="text-xs text-gray-500 hover:text-green-600 bg-transparent border-none outline-none cursor-pointer px-2"
                >
                  {privacyOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsExpanded(false); setContent(""); setImages([]) }}
                  className="text-xs h-8 rounded-xl"
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isLoading || (!content.trim() && images.length === 0)}
                  className="text-xs h-8 rounded-xl bg-green-600 hover:bg-green-700 text-white px-5"
                >
                  {isLoading ? "Đang đăng..." : "Đăng"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

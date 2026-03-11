"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MapPin, Stethoscope, TrendingUp, UserPlus } from "lucide-react"
import { useFriendSuggestions } from "@/lib/hooks"
import { socialAPI } from "@/lib/api"
import { useState } from "react"
import { toast } from "sonner"

// Trending hashtags (static for now, can be made dynamic)
const TRENDING = [
  { tag: "DogLovers", posts: 2847 },
  { tag: "PetPhotography", posts: 5342 },
  { tag: "VetTips", posts: 1923 },
  { tag: "CatBreed", posts: 3456 },
  { tag: "PawsOfTailMates", posts: 891 },
]

// Nearby vets (can be made dynamic)
const NEARBY_VETS = [
  { name: "Happy Paws Clinic", location: "Hà Nội", rating: 4.8 },
  { name: "Petcare Center", location: "TP. Hồ Chí Minh", rating: 4.6 },
  { name: "Animal Hospital", location: "Đà Nẵng", rating: 4.7 },
]

function SuggestionCard({ suggestion, onFollowed }: { suggestion: any; onFollowed?: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [followed, setFollowed] = useState(false)

  const handleFollow = async () => {
    setLoading(true)
    try {
      const res = await socialAPI.sendFriendRequest(suggestion._id)
      if (res.success) {
        setFollowed(true)
        onFollowed?.(suggestion._id)
        toast.success(`Đã gửi lời mời kết bạn tới ${suggestion.full_name}`)
      } else {
        toast.error(res.message || "Lỗi gửi lời mời")
      }
    } catch {
      toast.error("Lỗi kết nối")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <Link href={`/social/profile/${suggestion._id}`} className="flex items-center gap-2.5 group">
        <Avatar className="w-9 h-9">
          <AvatarImage src={suggestion.avatar?.url} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {suggestion.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
            {suggestion.full_name}
          </p>
        </div>
      </Link>
      <Button
        size="sm"
        onClick={handleFollow}
        disabled={loading || followed}
        className={`h-7 text-xs rounded-lg px-3 font-semibold transition-all ${
          followed
            ? "bg-secondary text-muted-foreground hover:bg-secondary"
            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20"
        }`}
      >
        {followed ? "Đã gửi" : loading ? "..." : "Kết bạn"}
      </Button>
    </div>
  )
}

export function SocialSidebar() {
  const { data, isLoading } = useFriendSuggestions(5)
  const suggestions: any[] = data?.suggestions || []
  const [hiddenIds, setHiddenIds] = useState<string[]>([])

  const visibleSuggestions = suggestions.filter((s: any) => !hiddenIds.includes(s._id))

  return (
    <div className="space-y-4">
      {/* Suggest For You */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Gợi ý kết bạn</h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-secondary" />
                <div className="flex-1 h-4 bg-secondary rounded" />
                <div className="w-14 h-7 bg-secondary rounded-lg" />
              </div>
            ))}
          </div>
        ) : visibleSuggestions.length > 0 ? (
          <div className="space-y-3">
            {visibleSuggestions.map((s: any) => (
              <SuggestionCard
                key={s._id}
                suggestion={s}
                onFollowed={id => setHiddenIds(prev => [...prev, id])}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">Không có gợi ý nào</p>
        )}

        <Link href="/social/friends?tab=suggestions" className="block mt-4 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          Xem thêm →
        </Link>
      </div>

      {/* Trending */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Đang thịnh hành</h3>
        </div>
        <div className="space-y-2.5">
          {TRENDING.map(({ tag, posts }) => (
            <Link key={tag} href={`/social/hashtag/${tag}`} className="block group">
              <p className="text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors">
                #{tag}
              </p>
              <p className="text-xs text-muted-foreground">{posts.toLocaleString()} bài viết</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Nearby Vets */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Phòng khám gần bạn</h3>
        </div>
        <div className="space-y-3">
          {NEARBY_VETS.map((vet) => (
            <div key={vet.name} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{vet.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {vet.location}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                ⭐ {vet.rating}
              </div>
            </div>
          ))}
        </div>
        <Link href="/merchants" className="block mt-4 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          Xem tất cả đối tác →
        </Link>
      </div>

      {/* Footer links */}
      <div className="px-2">
        <p className="text-xs text-gray-400">
          © 2025 TailMates · <Link href="/privacy" className="hover:underline">Quyền riêng tư</Link> · <Link href="/terms" className="hover:underline">Điều khoản</Link>
        </p>
      </div>
    </div>
  )
}

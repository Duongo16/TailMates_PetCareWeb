"use client"

import { useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PostCard } from "@/components/social/post-card"
import { CreatePostCard } from "@/components/social/create-post-card"
import { SocialSidebar } from "@/components/social/social-sidebar"
import { useSocialFeed } from "@/lib/hooks"
import { Loader2, Rss } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInView } from "@/lib/hooks"

export default function SocialFeedPage() {
  const { posts, setPosts, isLoading, isFetchingMore, error, hasMore, fetchMore, refetch } = useSocialFeed()

  // Infinite scroll sentinel
  const { ref: sentinelRef } = useInView({
    onInView: fetchMore,
  })

  const handlePostCreated = useCallback((newPost: any) => {
    setPosts(prev => [newPost, ...prev])
  }, [setPosts])

  const handlePostDeleted = useCallback((id: string) => {
    setPosts(prev => prev.filter((p: any) => p._id !== id))
  }, [setPosts])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Feed column */}
          <div className="space-y-4">
            {/* Create post */}
            <CreatePostCard onPostCreated={handlePostCreated} />

            {/* Posts */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded w-full" />
                      <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                    </div>
                    <div className="h-48 bg-gray-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <p className="text-gray-500 mb-4">{error}</p>
                <Button onClick={refetch} variant="outline" className="rounded-xl">
                  Thử lại
                </Button>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <Rss className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Feed trống</p>
                <p className="text-gray-400 text-sm mt-1">Kết bạn với mọi người để xem bài viết của họ 🐾</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {posts.map((post: any) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDeleted={handlePostDeleted}
                  />
                ))}
              </AnimatePresence>
            )}

            {/* Infinite scroll sentinel */}
            {!isLoading && hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-6">
                {isFetchingMore && <Loader2 className="w-6 h-6 text-green-500 animate-spin" />}
              </div>
            )}

            {/* End of feed */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">🐾 Bạn đã xem hết tất cả bài viết rồi!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <SocialSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useProfile, useSocialFeed } from "@/lib/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, UserPlus, UserMinus, UserCheck, MessageCircle, PawPrint, Users, Image as ImageIcon, Grid3X3, Newspaper } from "lucide-react"
import { PostCard } from "@/components/social/post-card"
import { socialAPI } from "@/lib/api"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ProfileSettings } from "@/components/customer/profile-settings"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import BlogList from "@/components/customer/blog-list"

export default function UserProfilePage() {
  const { userId } = useParams() as { userId: string }
  const searchParams = useSearchParams()
  const { user: currentUser } = useAuth()
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile(userId)
  const { posts, isLoading: isPostsLoading, fetchMore, hasMore } = useSocialFeed(userId)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Auto-open edit dialog if URL has ?edit=true
  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setShowEditDialog(true)
    }
  }, [searchParams])

  if (isProfileLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <p className="text-gray-500">Không tìm thấy người dùng này.</p>
        <Link href="/social">
          <Button variant="outline">Quay lại mạng xã hội</Button>
        </Link>
      </div>
    )
  }

  const isOwn = currentUser?.id === userId
  const friendshipStatus = profile.friendshipStatus // PENDING_SENT, PENDING_RECEIVED, ACCEPTED, NONE

  const handleFriendAction = async () => {
    setIsActionLoading(true)
    try {
      if (friendshipStatus === "NONE") {
        const res = await socialAPI.sendFriendRequest(userId)
        if (res.success) toast.success("Đã gửi lời mời kết bạn")
      } else if (friendshipStatus === "PENDING_SENT") {
        const res = await socialAPI.unfriend(profile.friendship.id)
        if (res.success) toast.info("Đã hủy yêu cầu kết bạn")
      } else if (friendshipStatus === "PENDING_RECEIVED") {
        const res = await socialAPI.respondFriendRequest(profile.friendship.id, "accept")
        if (res.success) toast.success("Đã đồng ý kết bạn")
      } else if (friendshipStatus === "ACCEPTED") {
        if (confirm("Bạn có chắc chắn muốn hủy kết bạn?")) {
          const res = await socialAPI.unfriend(profile.friendship.id)
          if (res.success) toast.info("Đã hủy kết bạn")
        }
      }
      refetchProfile()
    } catch (error) {
      toast.error("Thao tác thất bại")
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Profile Header */}
      <div className="bg-card rounded-b-3xl shadow-sm border-x border-b border-border overflow-hidden mb-6">
        <div className="h-48 bg-gradient-to-br from-primary to-navy relative">
          <div className="absolute -bottom-16 left-8">
            <Avatar className="w-32 h-32 border-4 border-card shadow-lg ring-4 ring-primary/5">
              <AvatarImage src={profile.user.avatar?.url || profile.user.avatar} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {profile.user.full_name?.charAt(0) || profile.user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="pt-20 pb-8 px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {profile.user.full_name || profile.user.name}
            </h1>
            <p className="text-gray-500 mb-4 max-w-md">
              {profile.user.bio || "Yêu thú cưng, trân trọng cuộc sống. 🐾"}
            </p>
            <div className="flex gap-6">
              <div className="text-center">
                <span className="block font-bold text-foreground">{profile.stats.post_count || 0}</span>
                <span className="text-sm text-muted-foreground">Bài viết</span>
              </div>
              <div className="text-center border-x px-6 border-border">
                <span className="block font-bold text-foreground">{profile.stats.friend_count || 0}</span>
                <span className="text-sm text-muted-foreground">Bạn bè</span>
              </div>
              <div className="text-center">
                <span className="block font-bold text-foreground">{profile.stats.pet_count || 0}</span>
                <span className="text-sm text-muted-foreground">Thú cưng</span>
              </div>
            </div>
          </div>

          {!isOwn && (
            <div className="flex gap-3 w-full md:w-auto">
              <Button 
                onClick={handleFriendAction}
                disabled={isActionLoading}
                variant={friendshipStatus === "ACCEPTED" ? "outline" : "default"}
                className={friendshipStatus === "ACCEPTED" ? "border-primary/20 text-primary hover:bg-primary/5" : "bg-primary hover:bg-primary/90 text-primary-foreground"}
              >
                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    {friendshipStatus === "NONE" && <><UserPlus className="mr-2 h-4 w-4" /> Kết bạn</>}
                    {friendshipStatus === "PENDING_SENT" && <><UserMinus className="mr-2 h-4 w-4" /> Hủy yêu cầu</>}
                    {friendshipStatus === "PENDING_RECEIVED" && <><UserCheck className="mr-2 h-4 w-4" /> Chấp nhận</>}
                    {friendshipStatus === "ACCEPTED" && <><UserMinus className="mr-2 h-4 w-4" /> Hủy kết bạn</>}
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none">
                <MessageCircle className="mr-2 h-4 w-4" /> Nhắn tin
              </Button>
            </div>
          )}

          {isOwn && (
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">Chỉnh sửa cá nhân</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none bg-transparent shadow-none">
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                  <Card className="p-6 border-none">
                    <ProfileSettings 
                      user={{...currentUser, ...profile.user}} 
                      onUpdate={() => {
                        refetchProfile()
                        setShowEditDialog(false)
                        toast.success("Đã cập nhật trang cá nhân")
                      }} 
                    />
                  </Card>
                </Card>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 md:px-0">
        {/* Left Col: Info & Pets */}
        <div className="lg:col-span-4 space-y-6">
          {/* About */}
          <Card className="p-5 border-border shadow-sm bg-card">
            <h3 className="font-bold text-foreground mb-4 flex items-center">
              Giới thiệu
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Users className="w-4 h-4 mr-3 text-muted-foreground/60" />
                <span>Thành viên từ {new Date(profile.user.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
              </div>
              {profile.user.phone_number && (
                <div className="flex items-center text-gray-600">
                  <MessageCircle className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{profile.user.phone_number}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Pets */}
          <Card className="p-5 border-border shadow-sm bg-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground flex items-center">
                Thú cưng ({profile.pets.length})
              </h3>
              {isOwn && (
                <Link href="/dashboard/customer/pets" className="text-xs text-primary hover:underline font-medium">
                  Quản lý
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {profile.pets.slice(0, 4).map((pet: any) => (
                <Link key={pet._id} href={`/pets/${pet._id}`} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img 
                    src={pet.image?.url || pet.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400&auto=format&fit=crop"} 
                    alt={pet.name}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-300 flex items-end p-2">
                    <span className="text-white text-xs font-medium truncate">{pet.name}</span>
                  </div>
                </Link>
              ))}
              {profile.pets.length === 0 && (
                <div className="col-span-2 py-6 text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <PawPrint className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">Chưa có thú cưng nào</p>
                </div>
              )}
            </div>
            {profile.pets.length > 4 && (
              <Button variant="ghost" className="w-full mt-3 text-xs text-gray-500 hover:text-green-600" asChild>
                <Link href={`/social/profile/${userId}/pets`}>Xem tất cả</Link>
              </Button>
            )}
          </Card>
        </div>

        {/* Right Col: Feed */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full bg-card border border-border p-1 mb-6 h-12 rounded-xl sticky top-20 z-10 shadow-sm">
              <TabsTrigger value="posts" className="flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <ImageIcon className="w-4 h-4 mr-2" /> Bài viết
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Grid3X3 className="w-4 h-4 mr-2" /> Ảnh
              </TabsTrigger>
              {isOwn && (
                <TabsTrigger value="blog" className="flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Newspaper className="w-4 h-4 mr-2" /> Blog
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="posts" className="space-y-6 mt-0">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}

              {isPostsLoading && (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {!isPostsLoading && posts.length === 0 && (
                <Card className="p-12 text-center border-none shadow-sm">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                  <h4 className="text-gray-900 font-medium mb-1 line-clamp-1">Chưa có bài viết nào</h4>
                  <p className="text-sm text-gray-400">Người dùng này chưa đăng bài viết nào lên TailMates.</p>
                </Card>
              )}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="ghost" onClick={() => fetchMore()} className="text-gray-500">
                    Xem thêm bài viết
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-0">
              <Card className="p-6 border-none shadow-sm">
                <div className="grid grid-cols-3 gap-2">
                  {posts.flatMap(p => p.images || []).map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={img.url || img} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {posts.filter(p => p.images?.length > 0).length === 0 && (
                    <div className="col-span-3 py-12 text-center">
                      <ImageIcon className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Chưa có ảnh nào được chia sẻ</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {isOwn && (
              <TabsContent value="blog" className="mt-0">
                <BlogList />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

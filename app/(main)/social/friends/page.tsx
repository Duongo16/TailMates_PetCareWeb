"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { useFriends, useFriendRequests, useFriendSuggestions } from "@/lib/hooks"
import { Loader2, Users, UserPlus, Send, Sparkles, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { socialAPI } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function FriendsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "all"

  const { data: friendsData, isLoading: isFriendsLoading, refetch: refetchFriends } = useFriends()
  const { data: receivedRequests, isLoading: isReceivedLoading, refetch: refetchReceived } = useFriendRequests("received")
  const { data: sentRequests, isLoading: isSentLoading, refetch: refetchSent } = useFriendRequests("sent")
  const { data: suggestions, isLoading: isSuggestionsLoading, refetch: refetchSuggestions } = useFriendSuggestions(20)

  const friends = friendsData?.friends || []
  const received = receivedRequests?.requests || []
  const sent = sentRequests?.requests || []
  const suggestList = suggestions?.suggestions || []

  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", value)
    router.push(`/social/friends?${params.toString()}`)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bạn bè</h1>
          <p className="text-muted-foreground text-sm">Kết nối và mở rộng cộng đồng thú cưng của bạn</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full bg-card border border-border p-1 mb-8 h-12 rounded-xl shadow-sm">
          <TabsTrigger value="all" className="flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Tất cả ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Lời mời ({received.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Đã gửi ({sent.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex-1 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Gợi ý
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((item: any) => (
              <FriendCard 
                key={item.friendship_id} 
                user={item.friend} 
                friendshipId={item.friendship_id}
                onUpdate={refetchFriends}
                showUnfriend
              />
            ))}
            {!isFriendsLoading && friends.length === 0 && (
              <EmptyState 
                icon={<Users className="w-12 h-12" />}
                title="Chưa có bạn bè nào"
                description="Hãy bắt đầu kết nối với những người yêu thú cưng khác nhé!"
              />
            )}
            {isFriendsLoading && <LoadingSkeleton />}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {received.map((req: any) => (
              <FriendRequestCard 
                key={req._id} 
                req={req} 
                onUpdate={() => {
                  refetchReceived()
                  refetchFriends()
                }}
                isReceived
              />
            ))}
            {!isReceivedLoading && received.length === 0 && (
              <EmptyState 
                icon={<UserPlus className="w-12 h-12" />}
                title="Không có lời mời nào"
                description="Bạn hiện không có yêu cầu kết bạn nào đang chờ."
              />
            )}
            {isReceivedLoading && <LoadingSkeleton />}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sent.map((req: any) => (
              <FriendRequestCard 
                key={req._id} 
                req={req} 
                onUpdate={refetchSent}
              />
            ))}
            {!isSentLoading && sent.length === 0 && (
              <EmptyState 
                icon={<Send className="w-12 h-12" />}
                title="Chưa gửi lời mời nào"
                description="Khi bạn gửi lời mời kết bạn, chúng sẽ hiện ở đây."
              />
            )}
            {isSentLoading && <LoadingSkeleton />}
          </div>
        </TabsContent>

        <TabsContent value="suggestions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestList.map((item: any) => (
              <FriendCard 
                key={item.user._id} 
                user={item.user} 
                onUpdate={() => {
                  refetchSuggestions()
                  refetchSent()
                }}
                showAddFriend
                subtitle={item.mutualFriends > 0 ? `${item.mutualFriends} bạn chung` : 'Gợi ý cho bạn'}
              />
            ))}
            {!isSuggestionsLoading && suggestList.length === 0 && (
              <EmptyState 
                icon={<Sparkles className="w-12 h-12" />}
                title="Hết gợi ý rồi"
                description="Chúng tôi sẽ quay lại với những gợi ý mới sau."
              />
            )}
            {isSuggestionsLoading && <LoadingSkeleton />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FriendCard({ user, friendshipId, onUpdate, showUnfriend = false, showAddFriend = false, subtitle }: any) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      if (showUnfriend && friendshipId) {
        if (confirm(`Bạn có chắc muốn hủy kết bạn với ${user.full_name || user.name}?`)) {
          await socialAPI.unfriend(friendshipId)
          toast.info("Đã hủy kết bạn")
        }
      } else if (showAddFriend) {
        await socialAPI.sendFriendRequest(user.id || user._id)
        toast.success("Đã gửi lời mời kết bạn")
      }
      onUpdate()
    } catch (error) {
      toast.error("Thao tác thất bại")
    } finally {
      setLoading(false)
    }
  }

  const userId = user.id || user._id
  const userName = user.full_name || user.name
  const userAvatar = user.avatar?.url || user.avatar

  return (
    <Card className="p-4 border-none shadow-sm hover:shadow-md transition-shadow bg-card">
      <div className="flex items-center justify-between">
        <Link href={`/social/profile/${userId}`} className="flex items-center gap-3">
          <Avatar className="w-14 h-14 border-2 border-primary/5">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary">{userName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-foreground line-clamp-1">{userName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle || "Bắt đầu trò chuyện"}</p>
          </div>
        </Link>
        <div className="flex gap-2">
          {showUnfriend && (
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleAction} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
            </Button>
          )}
          {showAddFriend && (
            <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/5" onClick={handleAction} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" /> Thêm</>}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function FriendRequestCard({ req, onUpdate, isReceived = false }: any) {
  const [loading, setLoading] = useState(false)
  const user = isReceived ? req.requester : req.recipient

  const handleResponse = async (action: "accept" | "reject") => {
    setLoading(true)
    try {
      await socialAPI.respondFriendRequest(req._id, action)
      toast.success(action === "accept" ? "Đã chấp nhận kết bạn" : "Đã từ chối lời mời")
      onUpdate()
    } catch (error) {
      toast.error("Thao tác thất bại")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      await socialAPI.unfriend(req._id)
      toast.info("Đã hủy lời mời")
      onUpdate()
    } catch (error) {
      toast.error("Thao tác thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 border-none shadow-sm overflow-hidden relative bg-card">
      <div className="flex items-center gap-4">
        <Link href={`/social/profile/${user.id || user._id}`}>
          <Avatar className="w-16 h-16 rounded-xl">
            <AvatarImage src={user.avatar?.url || user.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary rounded-xl">{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/social/profile/${user.id || user._id}`}>
            <h3 className="font-bold text-foreground truncate">{user.name}</h3>
          </Link>
          <div className="flex gap-2 mt-3">
            {isReceived ? (
              <>
                <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleResponse("accept")} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Chấp nhận"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleResponse("reject")} disabled={loading}>
                  Từ chối
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="w-full text-muted-foreground" onClick={handleCancel} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hủy yêu cầu"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyState({ icon, title, description }: any) {
  return (
    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
      <div className="p-4 bg-secondary rounded-full text-muted-foreground/40 mb-4">
        {icon}
      </div>
      <h3 className="text-foreground font-bold mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs">{description}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4 border-none shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        </Card>
      ))}
    </>
  )
}

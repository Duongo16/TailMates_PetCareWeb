"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Heart, Send, Inbox, Sparkles } from "lucide-react"
import { pawmatchAPI } from "@/lib/api"
import { startConversation } from "@/lib/chat-events"
import { cn } from "@/lib/utils"
import { MatchDetailModal } from "./match-detail-modal"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MatchesTabProps {
  currentPetId: string
}

type TabType = 'matches' | 'sent' | 'received'

export function MatchesTab({ currentPetId }: MatchesTabProps) {
  const [matches, setMatches] = useState<any[]>([])
  const [sentLikes, setSentLikes] = useState<any[]>([])
  const [receivedLikes, setReceivedLikes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPet, setSelectedPet] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('matches')

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [matchesRes, sentRes, receivedRes] = await Promise.all([
        pawmatchAPI.getMatches(currentPetId),
        pawmatchAPI.getLiked(currentPetId),
        pawmatchAPI.getLikedMe(currentPetId)
      ])
      
      if (matchesRes.success) setMatches(matchesRes.data || [])
      if (sentRes.success) setSentLikes(sentRes.data || [])
      if (receivedRes.success) setReceivedLikes(receivedRes.data || [])
    } catch (error) {
      console.error("Failed to fetch matches data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentPetId) {
      fetchData()
    }
  }, [currentPetId])

  const handleChat = (pet: any) => {
    const recipientId = pet.owner_id?._id || pet.owner_id || pet.user_id;
    if (recipientId) {
        startConversation({
            type: 'PAWMATCH',
            participantId: recipientId,
            contextId: pet._id,
            metadata: {
                title: `Về bé ${pet.name}`,
                image: pet.image?.url
            }
        });
    }
  }

  const handleLikeBack = async (targetPetId: string) => {
    try {
        const res = await pawmatchAPI.swipe({
            swiperPetId: currentPetId,
            targetPetId,
            direction: 'like'
        });
        if (res.success) {
            fetchData();
        }
    } catch (error) {
        console.error("Failed to like back:", error);
    }
  }

  const PetGrid = ({ items, type }: { items: any[], type: TabType }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-8">
      {items.map((item, idx) => {
        const pet = type === 'matches' ? (item.pets?.find((p: any) => p._id !== currentPetId) || item.pet) : item;
        if (!pet) return null;

        return (
          <motion.div
            key={pet._id || idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                delay: idx * 0.05,
                type: "spring",
                stiffness: 100,
                damping: 20
            }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setSelectedPet(pet)}
            className="group relative bg-white rounded-[2rem] lg:rounded-[2.5rem] p-3 lg:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:border-orange-200"
          >
            {/* Image Container with Decorative Elements */}
            <div className="relative w-full aspect-square rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden mb-4 lg:mb-5 group-hover:shadow-2xl transition-all duration-500">
              <img 
                src={pet.image?.url || "/placeholder.svg"} 
                alt={pet.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Decorative Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Badges/Indicators */}
              <div className="absolute top-2 lg:top-3 left-2 lg:left-3 flex flex-col gap-1.5 lg:gap-2">
                {type === 'matches' && item.is_new && (
                  <Badge className="bg-orange-500 text-white border-none px-2 lg:px-3 py-0.5 lg:py-1 font-black text-[8px] lg:text-[9px] uppercase tracking-tighter shadow-lg shadow-orange-500/30">
                    Mới ✨
                  </Badge>
                )}
                {pet.gender && (
                   <div className={cn(
                       "w-6 h-6 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl backdrop-blur-md flex items-center justify-center shadow-lg",
                       pet.gender === 'MALE' ? "bg-blue-500/80 text-white" : "bg-pink-500/80 text-white"
                   )}>
                       <span className="text-xs lg:text-sm font-black">{pet.gender === 'MALE' ? '♂' : '♀'}</span>
                   </div>
                )}
              </div>

              {type === 'received' && (
                <div className="absolute top-2 lg:top-3 right-2 lg:right-3">
                   <div className="w-6 h-6 lg:w-8 lg:h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40">
                       <Heart className="w-3 h-3 lg:w-4 lg:h-4 text-white fill-white" />
                   </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="w-full space-y-0.5 lg:space-y-1 px-1 mb-4 lg:mb-5">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="font-black text-slate-900 text-base lg:text-lg tracking-tight truncate">
                  {pet.name}
                </h3>
              </div>
              <div className="flex items-center justify-center gap-1.5 opacity-60">
                 <span className="text-[#F26419] font-black text-[9px] lg:text-[10px] uppercase tracking-[0.1em] truncate">
                   {pet.breed || pet.species}
                 </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-auto">
              {type === 'matches' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChat(pet);
                  }}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-3 lg:py-4 px-3 lg:px-4 rounded-xl lg:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/btn active:scale-95 shadow-lg shadow-slate-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-orange-400 fill-orange-400" />
                  <span className="text-[10px] lg:text-sm tracking-tight">NHẮN TIN</span>
                </button>
              ) : type === 'received' ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleLikeBack(pet._id);
                    }}
                    className="w-full bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-black py-3 lg:py-4 px-3 lg:px-4 rounded-xl lg:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/btn active:scale-95 shadow-xl shadow-orange-200"
                >
                    <Heart className="w-3.5 h-3.5 lg:w-4 lg:h-4 fill-white" />
                    <span className="text-[10px] lg:text-sm tracking-tight">THÍCH LẠI</span>
                </button>
              ) : (
                <div className="w-full py-3 lg:py-4 px-3 lg:px-4 rounded-xl lg:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 group-hover:bg-slate-100 transition-colors">
                    <Send className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-400" />
                    <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">ĐÃ GỬI</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Đang tìm kiếm tương hợp...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 lg:py-8">
      <Tabs defaultValue="matches" className="w-full space-y-8 lg:space-y-12" onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="bg-slate-100/40 backdrop-blur-xl p-1 rounded-2xl lg:p-1.5 lg:rounded-[2.5rem] h-auto flex flex-wrap gap-1 lg:gap-1.5 w-fit mx-auto border border-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
          <TabsTrigger 
            value="matches" 
            className="rounded-xl lg:rounded-[2rem] px-4 lg:px-8 py-2.5 lg:py-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl data-[state=active]:shadow-slate-200/50 font-black text-[10px] lg:text-[11px] uppercase tracking-[0.1em] lg:tracking-[0.15em] transition-all duration-300"
          >
            <div className="flex items-center gap-1.5 lg:gap-2.5">
                <div className="p-1 rounded-lg bg-orange-100 text-orange-600 hidden xs:block">
                  <Sparkles className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                </div>
                <span>Tương thích ({matches.length})</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="received" 
            className="rounded-xl lg:rounded-[2rem] px-4 lg:px-8 py-2.5 lg:py-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl data-[state=active]:shadow-slate-200/50 font-black text-[10px] lg:text-[11px] uppercase tracking-[0.1em] lg:tracking-[0.15em] transition-all duration-300"
          >
            <div className="flex items-center gap-1.5 lg:gap-2.5">
                <div className="p-1 rounded-lg bg-red-100 text-red-600 hidden xs:block">
                  <Inbox className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                </div>
                <span>Thích mình ({receivedLikes.length})</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="sent" 
            className="rounded-xl lg:rounded-[2rem] px-4 lg:px-8 py-2.5 lg:py-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl data-[state=active]:shadow-slate-200/50 font-black text-[10px] lg:text-[11px] uppercase tracking-[0.1em] lg:tracking-[0.15em] transition-all duration-300"
          >
            <div className="flex items-center gap-1.5 lg:gap-2.5">
                <div className="p-1 rounded-lg bg-blue-100 text-blue-600 hidden xs:block">
                  <Send className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                </div>
                <span>Đã thích ({sentLikes.length})</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
            <TabsContent key="matches" value="matches">
                {matches.length > 0 ? (
                    <PetGrid items={matches} type="matches" />
                ) : (
                    <EmptyState 
                        title="Chưa có bé nào tương thích" 
                        desc="Hãy tiếp tục 'quẹt' để tìm kiếm người bạn đời hoàn hảo cho thú cưng của mình nhé!" 
                    />
                )}
            </TabsContent>

            <TabsContent key="received" value="received">
                {receivedLikes.length > 0 ? (
                    <PetGrid items={receivedLikes} type="received" />
                ) : (
                    <EmptyState 
                        title="Chưa có bé nào thích bạn" 
                        desc="Đừng nản lòng, hãy cập nhật hồ sơ thú cưng thêm lung linh để thu hút sự chú ý nhé!" 
                    />
                )}
            </TabsContent>

            <TabsContent key="sent" value="sent">
                {sentLikes.length > 0 ? (
                    <PetGrid items={sentLikes} type="sent" />
                ) : (
                    <EmptyState 
                        title="Bạn chưa thích bé nào" 
                        desc="Khám phá ngay danh sách các bé thú cưng đáng yêu xung quanh để bắt đầu thôi!" 
                    />
                )}
            </TabsContent>
        </AnimatePresence>
      </Tabs>

      <MatchDetailModal 
        isOpen={!!selectedPet}
        onClose={() => setSelectedPet(null)}
        match={null} 
        pet={selectedPet}
        currentPetId={currentPetId}
      />
    </div>
  )
}

function EmptyState({ title, desc }: { title: string, desc: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-4"
        >
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-orange-500/10 rounded-[2.5rem] animate-pulse" />
                <Heart className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">{title}</h3>
            <p className="text-slate-400 max-w-sm font-medium leading-relaxed">{desc}</p>
        </motion.div>
    )
}

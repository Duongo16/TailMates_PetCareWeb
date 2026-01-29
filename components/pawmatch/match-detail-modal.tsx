"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
    Heart, MessageSquare, MapPin, Calendar, User, 
    PawPrint, ChevronLeft, ChevronRight, Scale, 
    ShieldCheck, Sparkles, Target, Clock 
} from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { startConversation } from "@/lib/chat-events"
import { cn } from "@/lib/utils"

interface MatchDetailModalProps {
    isOpen: boolean
    onClose: () => void
    match?: any
    pet?: any
    currentPetId: string
}

export function MatchDetailModal({ isOpen, onClose, match, pet, currentPetId }: MatchDetailModalProps) {
    const [activeMediaIndex, setActiveMediaIndex] = useState(0)
    
    if (!match && !pet) return null

    const partnerPet = pet || (match.pets?.find((p: any) => p._id !== currentPetId) || match.pet)
    if (!partnerPet) return null

    const owner = partnerPet.owner_id || partnerPet.owner
    const mediaItems = partnerPet.mediaGallery && partnerPet.mediaGallery.length > 0
        ? partnerPet.mediaGallery
        : (partnerPet.image ? [{ url: partnerPet.image.url, type: "image" }] : [{ url: "/placeholder.svg", type: "image" }])

    const handleChat = () => {
        const recipientId = owner?._id || owner?.id || owner
        if (recipientId) {
            startConversation({
                type: 'PAWMATCH',
                participantId: recipientId,
                contextId: partnerPet._id,
                metadata: {
                    title: `Về bé ${partnerPet.name}`,
                    image: partnerPet.image?.url
                }
            })
            onClose()
        }
    }

    const ageDisplay = partnerPet.age_months 
        ? (partnerPet.age_months >= 12 
            ? `${Math.floor(partnerPet.age_months / 12)} tuổi` 
            : `${partnerPet.age_months} tháng`)
        : "N/A"

    const nextMedia = () => setActiveMediaIndex((prev) => (prev + 1) % mediaItems.length)
    const prevMedia = () => setActiveMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)

    const joinDate = owner?.created_at ? new Date(owner.created_at).toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric'
    }) : "Gần đây"

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white rounded-[2.5rem] border-none shadow-2xl">
                <div className="flex flex-col md:flex-row h-[90vh] md:h-[700px]">
                    {/* Media Section (Carousel) */}
                    <div className="md:w-1/2 relative bg-slate-900 border-r border-slate-100 h-1/2 md:h-full group">
                        <div className="absolute inset-0">
                            {mediaItems[activeMediaIndex].type === "video" ? (
                                <video 
                                    src={mediaItems[activeMediaIndex].url}
                                    autoPlay loop muted playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Image 
                                    src={mediaItems[activeMediaIndex].url} 
                                    alt={partnerPet.name}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {mediaItems.length > 1 && (
                            <>
                                <button 
                                    onClick={prevMedia}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-30"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={nextMedia}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-30"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Carousel Indicators */}
                        {mediaItems.length > 1 && (
                            <div className="absolute top-6 left-0 right-0 flex justify-center gap-1.5 z-30 px-8">
                                {mediaItems.map((_: any, i: number) => (
                                    <div 
                                        key={i}
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-300",
                                            i === activeMediaIndex ? "w-8 bg-white" : "w-4 bg-white/40"
                                        )}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Media Label overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6 md:p-8 text-white z-20">
                            <Badge className="w-fit bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 mb-2 md:mb-3 uppercase tracking-widest text-[9px] md:text-[10px] font-black border-none px-3 md:px-4 py-1.5 shadow-lg">
                                {partnerPet.species || "Thú cưng"} Tương hợp
                            </Badge>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-2xl">
                                {partnerPet.name}
                            </h2>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar bg-white">
                        <div className="p-6 md:p-10 space-y-8 md:space-y-10">
                            {/* Pet Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatItem 
                                    icon={Calendar} 
                                    label="Tuổi" 
                                    value={ageDisplay} 
                                    colorClass="bg-orange-50 border-orange-100 text-orange-600"
                                />
                                <StatItem 
                                    icon={PawPrint} 
                                    label="Giống" 
                                    value={partnerPet.breed || "Chưa rõ"} 
                                    colorClass="bg-blue-50 border-blue-100 text-blue-600"
                                />
                                <StatItem 
                                    icon={Scale} 
                                    label="Cân nặng" 
                                    value={partnerPet.weight_kg ? `${partnerPet.weight_kg}kg` : "---"} 
                                    colorClass="bg-pink-50 border-pink-100 text-pink-600"
                                />
                                <StatItem 
                                    icon={ShieldCheck} 
                                    label="Tiêm chủng" 
                                    value={partnerPet.sterilized ? "Đã tiêm" : "Chưa tiêm"} 
                                    colorClass="bg-green-50 border-green-100 text-green-600"
                                />
                            </div>

                            {/* AI Analysis Section */}
                            {partnerPet.ai_analysis?.personality && (
                                <div className="bg-gradient-to-br from-orange-50/80 to-pink-50/80 rounded-[2.5rem] p-8 border border-orange-100 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl group-hover:bg-orange-200/40 transition-all duration-500" />
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white rounded-2xl shadow-sm">
                                            <Sparkles className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest leading-none">Tính cách từ AI</h3>
                                    </div>
                                    <p className="text-slate-700 text-base leading-relaxed font-medium italic relative z-10">
                                        "{partnerPet.ai_analysis.personality}"
                                    </p>
                                </div>
                            )}

                            {/* Bio */}
                            <div className="space-y-6">
                                <SectionTitle title="Câu chuyện của bé" emoji="🐾" />
                                <div className="relative p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <p className="text-slate-700 text-lg leading-relaxed font-medium">
                                        {partnerPet.datingProfile?.bio || `${partnerPet.name} là một người bạn tuyệt vời đang chờ đợi bạn!`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-2 bg-slate-100 rounded-xl">
                                        <Target className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Mong muốn:</span>
                                    <Badge variant="outline" className="bg-white border-2 border-orange-500/20 text-orange-600 font-extrabold px-4 py-1.5 rounded-full shadow-sm">
                                        {partnerPet.datingProfile?.lookingFor === "Playdate" ? "Tìm bạn chơi 🎾" : 
                                         partnerPet.datingProfile?.lookingFor === "Breeding" ? "Phối giống 💞" : "Tìm bạn bốn phương ✨"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Owner Detailed Info */}
                            <div className="pt-10 border-t border-slate-100 space-y-8">
                                <SectionTitle title="Người nuôi thú cưng" emoji="🙋‍♂️" />
                                <div className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-8">
                                    <div className="flex items-center gap-5">
                                        <Avatar className="w-16 h-16 ring-4 ring-white shadow-xl">
                                            <AvatarImage src={owner?.avatar?.url || owner?.avatar || "/placeholder.svg"} />
                                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-black text-xl">
                                                {(owner?.full_name || owner?.name || "U").charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <h4 className="font-black text-lg text-slate-900 tracking-tight">{owner?.full_name || owner?.name || "Người dùng ẩn danh"}</h4>
                                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs mt-0.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                Đã xác minh danh tính
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khu vực</span>
                                                <span className="text-xs font-bold text-slate-700 leading-tight">
                                                    {owner?.address?.street ? `${owner.address.street}, ${owner.address.city}` : owner?.address?.city || "Gần bạn"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tham gia</span>
                                                <span className="text-xs font-bold text-slate-700">{joinDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Actions */}
                            <div className="pt-2 sticky bottom-0 bg-white pb-6">
                                <Button 
                                    onClick={handleChat}
                                    className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-black text-white font-black text-lg gap-3 shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <MessageSquare className="w-5 h-5 text-orange-500 fill-orange-500" />
                                    </div>
                                    TRÒ CHUYỆN VỚI CHỦ NUÔI
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function StatItem({ icon: Icon, label, value, colorClass }: any) {
    return (
        <div className={cn(
            "p-4 rounded-3xl border transition-all hover:scale-105 duration-300 flex flex-col gap-2 shadow-sm",
            colorClass
        )}>
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60 leading-none">{label}</span>
            </div>
            <span className="text-[13px] font-black leading-tight">{value}</span>
        </div>
    )
}

function SectionTitle({ title, emoji }: { title: string, emoji?: string }) {
    return (
        <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 whitespace-nowrap">{title}</h3>
                {emoji && <span className="text-xl leading-none">{emoji}</span>}
            </div>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-100 to-transparent rounded-full" />
        </div>
    )
}

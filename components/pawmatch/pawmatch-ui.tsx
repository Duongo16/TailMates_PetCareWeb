"use client"

import { useState, useEffect } from "react"
import { usePets } from "@/lib/hooks"
import { SwipeDeck } from "@/components/pawmatch/swipe-deck"
import { Sparkles, SlidersHorizontal, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PawMatchUIProps {
    onEditPet?: (petId: string) => void
    onAddPet?: () => void
}

export function PawMatchUI({ onEditPet, onAddPet }: PawMatchUIProps) {
    const { data: pets, isLoading } = usePets()
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"discovery" | "matches">("discovery")

    // List of ALL pets for selection
    const availablePets = pets || []
    
    // Check if a pet is ready for PawMatch (defensive checks for snake_case/camelCase)
    const isPetReady = (pet: any) => {
        const dp = pet?.datingProfile || pet?.dating_profile
        return !!(dp?.bio && dp.bio.trim().length > 0)
    }

    useEffect(() => {
        if (availablePets.length > 0 && !selectedPetId) {
            // Prefer choosing a ready pet first
            const readyPet = availablePets.find(isPetReady)
            setSelectedPetId(readyPet?._id || availablePets[0]._id)
        }
    }, [availablePets, selectedPetId])

    const currentPet = availablePets.find(p => p._id === selectedPetId)
    const isReady = currentPet ? isPetReady(currentPet) : false

    return (
        <div className="h-screen w-full bg-[#f8fafc] overflow-hidden flex flex-col">
            {/* Header / Title Area */}
            <header className="py-4 lg:pb-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-top duration-700 h-fit shrink-0">
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2 lg:gap-3">
                    <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">PAW MATCH</span>
                    <span className="text-slate-200">/</span>
                    <span className="text-lg lg:text-2xl text-slate-400 font-bold uppercase tracking-widest">
                        {activeTab === "discovery" ? "Khám phá" : "Tương hợp"}
                    </span>
                </h1>
                <p className="hidden lg:block text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                    Tìm kiếm người bạn bốn chân hoàn hảo
                </p>
            </header>

            <main className="flex-1 w-full relative">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Đang chuẩn bị...</p>
                    </div>
                ) : availablePets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-8 text-center px-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-orange-500/10 rounded-[2.5rem] blur-3xl animate-pulse" />
                            <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-slate-100 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                                <Sparkles className="w-12 h-12 text-slate-300" />
                            </div>
                        </div>
                        <div className="space-y-3 max-w-sm">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bạn chưa có thú cưng</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Hãy thêm thú cưng của bạn trước khi bắt đầu hành trình tìm kiếm bạn bè nhé!
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (onAddPet) {
                                    onAddPet()
                                } else {
                                    window.location.href = "/customer/pet-profile"
                                }
                            }}
                            className="group flex items-center gap-3 bg-slate-900 text-white font-black py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 text-xs tracking-widest uppercase"
                        >
                            Thêm thú cưng ngay
                        </button>
                    </div>
                ) : !isReady && activeTab === "discovery" ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-10 text-center px-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-orange-500/10 rounded-[2.5rem] blur-3xl" />
                            <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-slate-100 -rotate-3 overflow-hidden">
                                <img 
                                    src={currentPet?.image?.url || "/placeholder.svg"} 
                                    alt="" 
                                    className="w-full h-full object-cover grayscale opacity-50"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-3 max-w-md">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cần thêm thông tin</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Hồ sơ của <span className="text-orange-600 font-bold uppercase tracking-tight">{currentPet?.name}</span> vẫn chưa có phần giới thiệu (Bio). 
                                Hãy thêm Bio để mọi người có thể làm quen với bé nhé!
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <button 
                                onClick={() => {
                                    if (onEditPet && currentPet?._id) {
                                        onEditPet(currentPet._id)
                                    } else {
                                        window.location.href = "/customer/pet-profile"
                                    }
                                }}
                                className="group flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 transition-all active:scale-95 text-xs tracking-widest uppercase"
                            >
                                Cập nhật Profile ngay
                            </button>
                            
                            {/* Pet Selector for switching if user has multiple pets */}
                            <div className="flex items-center gap-3 justify-center">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hoặc chọn thú cưng khác:</p>
                                <Select value={selectedPetId || ""} onValueChange={setSelectedPetId}>
                                    <SelectTrigger className="w-fit h-auto p-1 bg-white border-none rounded-full shadow-md">
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            <img src={currentPet?.image?.url || "/placeholder.svg"} className="w-full h-full object-cover" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl">
                                        {availablePets.map(p => (
                                            <SelectItem key={p._id} value={p._id} className="rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                                                        <img src={p.image?.url || "/placeholder.svg"} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{p.name}</span>
                                                    {!isPetReady(p) && <Sparkles className="w-3 h-3 text-slate-300" />}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <SwipeDeck
                        currentPet={currentPet}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        availablePets={availablePets}
                        selectedPetId={selectedPetId}
                        setSelectedPetId={setSelectedPetId}
                    />
                )}
            </main>
        </div>
    )
}

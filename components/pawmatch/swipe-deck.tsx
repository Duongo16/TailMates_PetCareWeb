"use client"

import { useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PetCard } from "./pet-card"
import { RotateCcw, X, Heart, Sparkles, Loader2, SlidersHorizontal } from "lucide-react"
import { MatchCelebration } from "./match-celebration"
import { MatchesTab } from "./matches-tab"
import { pawmatchAPI } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SwipeDeckProps {
    currentPet: any
    activeTab: "discovery" | "matches"
    setActiveTab: (tab: "discovery" | "matches") => void
    availablePets: any[]
    selectedPetId: string | null
    setSelectedPetId: (id: string) => void
}

export function SwipeDeck({ 
    currentPet, 
    activeTab, 
    setActiveTab, 
    availablePets, 
    selectedPetId, 
    setSelectedPetId 
}: SwipeDeckProps) {
    const petId = currentPet?._id
    const [queue, setQueue] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMatching, setIsMatching] = useState(false)
    const [matchedPet, setMatchedPet] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])

    const fetchDiscovery = useCallback(async () => {
        if (!petId) return
        setIsLoading(true)
        try {
            const res = await pawmatchAPI.getDiscovery(petId)
            if (res.success) {
                setQueue(res.data || [])
            }
        } catch (err) {
            console.error("Fetch discovery failed:", err)
        } finally {
            setIsLoading(false)
        }
    }, [petId])

    useEffect(() => {
        if (petId && activeTab === "discovery") {
            fetchDiscovery()
        }
    }, [petId, activeTab, fetchDiscovery])

    const handleSwipe = useCallback(async (direction: "left" | "right") => {
        if (queue.length === 0 || !petId) return

        const targetPet = queue[0]
        setQueue(prev => prev.slice(1))
        setHistory(prev => [targetPet, ...prev])

        try {
            console.log(`[PawMatch] Swiping ${direction} on:`, targetPet.name);
            const res: any = await pawmatchAPI.swipe({
                swiperPetId: petId,
                targetPetId: targetPet._id,
                direction: direction === "right" ? "like" : "nope"
            })

            console.log("[PawMatch] Swipe Response:", res);

            if (res.success) {
                // Support both isMatch (camelCase) and is_match (snake_case)
                const isMatch = res.data?.isMatch || res.data?.is_match;
                
                if (isMatch) {
                    console.log("[PawMatch] IT'S A MATCH!", targetPet.name);
                    setMatchedPet(targetPet)
                    setIsMatching(true)
                }
            }
        } catch (err) {
            console.error("[PawMatch] Swipe failed:", err)
        }
    }, [petId, queue])

    const handleUndo = () => {
        if (history.length === 0) return
        const lastPet = history[0]
        setHistory(prev => prev.slice(1))
        setQueue(prev => [lastPet, ...prev])
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isMatching || queue.length === 0 || activeTab !== "discovery") return

            if (e.key === "ArrowLeft") {
                handleSwipe("left")
            } else if (e.key === "ArrowRight") {
                handleSwipe("right")
            } else if (e.key === " ") {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent("pawmatch:next-photo"))
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [queue, isMatching, activeTab, handleSwipe])

    const renderDiscovery = () => (
        <div className="relative w-full max-w-[380px] lg:max-w-[440px] h-[600px] lg:h-[720px] perspective-1000 flex items-center justify-center">
            {isLoading && queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-orange-500 animate-pulse" />
                    </div>
                    <p className="text-slate-400 font-black tracking-[0.3em] uppercase text-[10px] animate-pulse">Đang tìm cộng sự...</p>
                </div>
            ) : queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-10 text-center px-8 animate-in fade-in zoom-in duration-700">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-orange-500/10 rounded-[2.5rem] blur-3xl" />
                        <div className="relative w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center rotate-6 group-hover:rotate-0 transition-transform duration-500">
                            <Heart className="w-12 h-12 text-orange-200" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Hết lượt gợi ý!</h3>
                        <p className="text-slate-400 font-medium max-w-[280px] leading-relaxed">
                            Chưa tìm thấy bạn mới? Hãy làm mới hoặc chờ lượt quẹt tiếp theo nhé.
                        </p>
                    </div>
                    <button 
                        onClick={fetchDiscovery}
                        className="group relative bg-white text-slate-900 font-black py-4 px-10 rounded-2xl shadow-xl border-2 border-slate-100 hover:border-orange-500/20 transition-all active:scale-95 text-xs tracking-widest uppercase overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Làm mới
                        </span>
                    </button>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    {queue.slice(0, 3).reverse().map((pet, index) => {
                        const isTop = index === Math.min(queue.length, 3) - 1
                        const visualIndex = Math.min(queue.length, 3) - 1 - index
                        
                        return (
                            <motion.div
                                key={pet._id}
                                className="absolute inset-0"
                                style={{ zIndex: index }}
                                animate={{
                                    scale: 1 - visualIndex * 0.05,
                                    y: visualIndex * 15,
                                    rotate: visualIndex * (visualIndex % 2 === 0 ? 1 : -1),
                                    opacity: 1 - visualIndex * 0.25,
                                }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 300, 
                                    damping: 30,
                                    mass: 1
                                }}
                            >
                                <PetCard
                                    pet={pet}
                                    isTop={isTop}
                                    onSwipe={isTop ? handleSwipe : () => { }}
                                />
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            )}
        </div>
    )

    return (
        <div className="flex items-start justify-center w-full h-full gap-6 lg:gap-12 xl:gap-20 select-none pb-6 lg:pb-10 pt-4">
            {/* Left Column: Navigation & Tools */}
            <div className="flex flex-col gap-5 py-4 animate-in slide-in-from-left fade-in duration-700 sticky top-8">
                {/* Logo Floating Button */}
                <div className="group relative flex items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 shadow-2xl flex items-center justify-center transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 cursor-pointer shadow-orange-500/20">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-200/50 mx-auto" />

                <ActionButton 
                    icon={Sparkles} 
                    active={activeTab === "discovery"} 
                    onClick={() => setActiveTab("discovery")}
                    label="Khám phá"
                    color={activeTab === "discovery" ? "text-white bg-gradient-to-tr from-orange-500 to-red-600" : "text-slate-400"}
                />
                <ActionButton 
                    icon={Heart} 
                    active={activeTab === "matches"} 
                    onClick={() => setActiveTab("matches")}
                    label="Tương hợp"
                    color={activeTab === "matches" ? "text-white bg-gradient-to-tr from-orange-500 to-red-600" : "text-slate-400"}
                />
                
                <div className="w-px h-8 bg-slate-200/50 mx-auto" />

                {/* Pet Selector as a button */}
                <div className="group relative flex items-center">
                    <Select value={selectedPetId || ""} onValueChange={setSelectedPetId}>
                        <SelectTrigger className="w-14 h-14 p-0 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-center transition-all ring-0 focus:ring-0 shadow-xl group-hover:shadow-2xl hover:border-orange-500/20 overflow-hidden">
                            <img 
                                src={currentPet?.image?.url || "/placeholder.svg"} 
                                alt={currentPet?.name} 
                                className="w-full h-full object-cover" 
                            />
                        </SelectTrigger>
                        <SelectContent side="right" className="rounded-2xl border-slate-100 shadow-2xl ml-4">
                            {availablePets.map((pet) => (
                                <SelectItem key={pet._id} value={pet._id} className="rounded-xl capitalize">
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary">
                                            <img src={pet.image?.url || "/placeholder.svg"} alt="" className="object-cover w-full h-full" />
                                        </div>
                                        <span className="font-bold text-slate-700">{pet.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap uppercase tracking-widest z-50">
                        Đổi thú cưng
                    </div>
                </div>

                <ActionButton 
                    icon={SlidersHorizontal} 
                    onClick={() => {}} 
                    label="Bộ lọc"
                    color="text-slate-400"
                />
            </div>

            {/* Middle Column: Discovery or Matches */}
            <div className="flex-1 w-full max-w-5xl h-full flex flex-col items-center">
                {activeTab === "discovery" ? renderDiscovery() : <MatchesTab currentPetId={petId} />}
            </div>

            {/* Right Column: Actions (Only for Discovery) */}
            <div className="flex flex-col gap-6 py-4 animate-in slide-in-from-right fade-in duration-700 sticky top-8">
                {activeTab === "discovery" && queue.length > 0 ? (
                    <>
                        <ActionButton 
                            icon={RotateCcw} 
                            color="text-yellow-500" 
                            size="w-14 h-14"
                            onClick={handleUndo}
                            disabled={history.length === 0}
                            label="Hoàn tác (←)"
                        />
                        <ActionButton 
                            icon={X} 
                            color="text-red-500" 
                            size="w-20 h-20" 
                            iconSize="w-10 h-10"
                            onClick={() => handleSwipe("left")}
                            label="Bỏ qua (←)"
                            priority
                        />
                        <ActionButton 
                            icon={Heart} 
                            color="text-emerald-500" 
                            size="w-20 h-20" 
                            iconSize="w-10 h-10"
                            fill
                            onClick={() => handleSwipe("right")}
                            label="Yêu thích (→)"
                            priority
                        />
                        <ActionButton 
                            icon={Sparkles} 
                            color="text-sky-500" 
                            size="w-14 h-14"
                            onClick={() => handleSwipe("right")}
                            label="Super Like"
                        />
                    </>
                ) : (
                    <div className="w-20" /> // Spacer for Matches tab or empty state
                )}
            </div>

            <MatchCelebration
                isOpen={isMatching}
                onClose={() => setIsMatching(false)}
                matchedPet={matchedPet}
                userPet={currentPet}
            />
        </div>
    )
}

function ActionButton({ 
    icon: Icon, 
    color, 
    size = "w-14 h-14", 
    iconSize = "w-6 h-6", 
    fill = false, 
    onClick,
    disabled = false,
    label,
    priority = false,
    active = false
}: any) {
    return (
        <div className="group relative flex items-center">
            <motion.button
                whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
                whileTap={!disabled ? { scale: 0.9 } : {}}
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    size,
                    "rounded-[1.75rem] shadow-xl flex items-center justify-center transition-all bg-white border border-slate-100",
                    active ? "" : (disabled ? "opacity-20 cursor-not-allowed grayscale" : `${color} hover:shadow-orange-500/10`),
                    priority && "border-2",
                    active && "shadow-2xl"
                )}
            >
                <Icon className={cn(iconSize, fill && "fill-current")} strokeWidth={3} />
            </motion.button>
            
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap uppercase tracking-widest z-50 shadow-xl">
                {label}
            </div>
        </div>
    )
}

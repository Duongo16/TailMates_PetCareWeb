"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PetCard } from "./pet-card"
import { pawmatchAPI } from "@/lib/api"
import { Loader2, Heart, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MatchCelebration } from "./match-celebration"

interface SwipeDeckProps {
    petId: string
}

export function SwipeDeck({ petId }: SwipeDeckProps) {
    const [queue, setQueue] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMatching, setIsMatching] = useState(false)
    const [matchedPet, setMatchedPet] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchDiscovery = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await pawmatchAPI.getDiscovery(petId)
            if (res.success) {
                setQueue(res.data || [])
            } else {
                setError(res.message || "Không thể tải danh sách gợi ý")
            }
        } catch (err) {
            setError("Lỗi kết nối máy chủ")
        } finally {
            setIsLoading(false)
        }
    }, [petId])

    useEffect(() => {
        if (petId) {
            fetchDiscovery()
        }
    }, [petId, fetchDiscovery])

    const handleSwipe = async (direction: "left" | "right") => {
        if (queue.length === 0) return

        const targetPet = queue[0]
        const newQueue = queue.slice(1)
        setQueue(newQueue)

        // Optimistic UI: If queue is low, fetch more
        if (newQueue.length < 3) {
            // fetchDiscovery logic could be more advanced here
        }

        try {
            const res: any = await pawmatchAPI.swipe({
                swiperPetId: petId,
                targetPetId: targetPet._id,
                direction: direction === "right" ? "like" : "nope"
            })

            if (res.success && res.data?.isMatch) {
                setMatchedPet(targetPet)
                setIsMatching(true)
            }
        } catch (err) {
            console.error("Swipe failed:", err)
        }
    }

    if (isLoading && queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Đang tìm kiếm những người bạn mới...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] space-y-4 text-center px-6">
                <AlertCircle className="w-16 h-16 text-destructive/50" />
                <div>
                    <h3 className="text-xl font-bold">Ối! Có lỗi xảy ra</h3>
                    <p className="text-muted-foreground">{error}</p>
                </div>
                <Button onClick={fetchDiscovery} variant="outline" className="rounded-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Thử lại
                </Button>
            </div>
        )
    }

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] space-y-6 text-center px-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                        <Heart className="w-12 h-12 text-primary" />
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold">Hết lượt gợi ý rồi!</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                        Đừng lo lắng, hãy quay lại sau hoặc thử đổi "Bé đang tìm kiếm gì" để tìm thêm bạn nhé.
                    </p>
                </div>
                <Button onClick={fetchDiscovery} className="rounded-full px-8 h-12 text-lg">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Làm mới danh sách
                </Button>
            </div>
        )
    }

    return (
        <div className="relative w-full max-w-md mx-auto aspect-[3/4] sm:aspect-[4/5] perspective-1000">
            <AnimatePresence>
                {queue.slice(0, 3).reverse().map((pet, index) => {
                    const isTop = index === Math.min(queue.length, 3) - 1
                    return (
                        <PetCard
                            key={pet._id}
                            pet={pet}
                            onSwipe={isTop ? handleSwipe : () => { }}
                        />
                    )
                })}
            </AnimatePresence>

            <MatchCelebration
                isOpen={isMatching}
                onClose={() => setIsMatching(false)}
                matchedPet={matchedPet}
                currentUserPetId={petId}
            />
        </div>
    )
}

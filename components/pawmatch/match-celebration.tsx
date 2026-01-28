"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Heart, MessageCircle, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface MatchCelebrationProps {
    isOpen: boolean
    onClose: () => void
    matchedPet: any
    currentUserPetId: string
}

export function MatchCelebration({ isOpen, onClose, matchedPet, currentUserPetId }: MatchCelebrationProps) {
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#FF6B6B", "#FFD93D", "#6BCB77"]
            })
        }
    }, [isOpen])

    if (!matchedPet) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-6"
                >
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={onClose}
                        className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </motion.button>

                    <div className="text-center space-y-8 max-w-sm w-full">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="relative inline-block"
                        >
                            <Heart className="w-20 h-20 text-primary absolute -top-10 -right-10 animate-bounce" fill="currentColor" />
                            <h2 className="text-5xl font-black text-white italic tracking-tighter">It's a Match!</h2>
                        </motion.div>

                        <div className="flex items-center justify-center -space-x-8">
                            <motion.div
                                initial={{ x: -100, opacity: 0, rotate: -15 }}
                                animate={{ x: 0, opacity: 1, rotate: -5 }}
                                className="w-40 h-40 rounded-full border-4 border-white overflow-hidden shadow-2xl z-10"
                            >
                                <div className="w-full h-full bg-secondary flex items-center justify-center text-4xl">🐾</div>
                            </motion.div>
                            <motion.div
                                initial={{ x: 100, opacity: 0, rotate: 15 }}
                                animate={{ x: 0, opacity: 1, rotate: 5 }}
                                className="w-40 h-40 rounded-full border-4 border-white overflow-hidden shadow-2xl"
                            >
                                <Image
                                    src={matchedPet.mediaGallery?.[0]?.url || matchedPet.image?.url || "/placeholder.svg"}
                                    alt={matchedPet.name}
                                    fill
                                    className="object-cover"
                                />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4"
                        >
                            <p className="text-white/80 text-lg">
                                Bé và <strong>{matchedPet.name}</strong> đã thích nhau!
                            </p>

                            <div className="grid gap-3 pt-4">
                                <Button
                                    size="lg"
                                    className="rounded-full h-14 text-lg font-bold w-full bg-primary hover:bg-primary/90"
                                    onClick={() => {
                                        onClose();
                                        router.push(`/dashboard/customer?tab=messages&type=PAWMATCH&contextId=${currentUserPetId}&participantId=${matchedPet.owner?._id || matchedPet.owner}`);
                                    }}
                                >
                                    <MessageCircle className="w-6 h-6 mr-2" />
                                    Gửi tin nhắn ngay
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={onClose}
                                    className="rounded-full h-14 text-white hover:text-white hover:bg-white/10"
                                >
                                    Tiếp tục quẹt
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

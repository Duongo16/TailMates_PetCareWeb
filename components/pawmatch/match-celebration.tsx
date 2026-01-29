"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Heart, MessageSquare, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { startConversation } from "@/lib/chat-events"

interface MatchCelebrationProps {
    isOpen: boolean
    onClose: () => void
    matchedPet: any
    userPet: any
}

export function MatchCelebration({ isOpen, onClose, matchedPet, userPet }: MatchCelebrationProps) {
    useEffect(() => {
        if (isOpen) {
            const duration = 3 * 1000
            const animationEnd = Date.now() + duration
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 }

            function randomInRange(min: number, max: number) {
                return Math.random() * (max - min) + min
            }

            const interval: any = setInterval(function() {
                const timeLeft = animationEnd - Date.now()

                if (timeLeft <= 0) {
                    return clearInterval(interval)
                }

                const particleCount = 50 * (timeLeft / duration)
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
            }, 250)
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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 overflow-hidden"
                >
                    {/* Background Sparkles / Decorative Elements */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0.5], rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                                className="absolute"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                }}
                            >
                                <Heart className="text-white/20 w-8 h-8" fill="currentColor" />
                            </motion.div>
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute top-10 right-10 z-50 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-10 h-10" />
                    </motion.button>

                    <div className="text-center space-y-12 max-w-sm w-full relative">
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", damping: 12, delay: 0.2 }}
                            className="relative inline-block"
                        >
                            <h2 className="text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,107,107,0.5)]">
                                It's a Match!
                            </h2>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="absolute -top-12 -right-8"
                            >
                                <Heart className="w-16 h-16 text-red-500 fill-red-500" />
                            </motion.div>
                        </motion.div>

                        {/* Interlocking Circles */}
                        <div className="relative h-48 flex items-center justify-center">
                            <motion.div
                                initial={{ x: -100, opacity: 0, rotate: -20, scale: 0.5 }}
                                animate={{ x: 20, opacity: 1, rotate: -10, scale: 1 }}
                                transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.4 }}
                                className="w-44 h-44 rounded-full border-[6px] border-white overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10"
                            >
                                <img
                                    src={userPet.image?.url || "/placeholder.svg"}
                                    alt={userPet.name}
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ x: 100, opacity: 0, rotate: 20, scale: 0.5 }}
                                animate={{ x: -20, opacity: 1, rotate: 10, scale: 1 }}
                                transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.5 }}
                                className="w-44 h-44 rounded-full border-[6px] border-white overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                            >
                                <img
                                    src={matchedPet.mediaGallery?.[0]?.url || matchedPet.image?.url || "/placeholder.svg"}
                                    alt={matchedPet.name}
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                            
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.8, type: "spring" }}
                                className="absolute z-20 bg-white rounded-full p-3 shadow-xl"
                            >
                                <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="space-y-6"
                        >
                            <p className="text-white/90 text-xl font-medium px-4">
                                Bé và <strong>{matchedPet.name}</strong> đã để ý nhau rồi đấy!
                            </p>

                            <div className="grid gap-4 pt-6">
                                <Button
                                    size="lg"
                                    className="rounded-full h-16 text-xl font-black w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all active:scale-95"
                                    onClick={() => {
                                        onClose();
                                        const recipientId = matchedPet.owner?._id || matchedPet.owner_id || matchedPet.user_id || matchedPet.owner;
                                        if (recipientId) {
                                            startConversation({
                                                type: 'PAWMATCH',
                                                participantId: recipientId,
                                                metadata: {
                                                    title: `Match: ${matchedPet.name}`,
                                                    image: matchedPet.mediaGallery?.[0]?.url || matchedPet.image?.url
                                                }
                                            });
                                        }
                                    }}
                                >
                                    <MessageSquare className="w-7 h-7 mr-3" />
                                    Gửi tin nhắn ngay
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={onClose}
                                    className="rounded-full h-16 text-white/70 hover:text-white hover:bg-white/10 text-lg font-bold"
                                >
                                    Tiếp tục quẹt thẻ
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

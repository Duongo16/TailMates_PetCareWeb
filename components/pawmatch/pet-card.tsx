"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { Heart, X, Info, MapPin, PawPrint } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface PetCardProps {
    pet: any
    onSwipe: (direction: "left" | "right") => void
}

export function PetCard({ pet, onSwipe }: PetCardProps) {
    const [showInfo, setShowInfo] = useState(false)
    const [mediaIndex, setMediaIndex] = useState(0)

    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
    const likeOpacity = useTransform(x, [50, 150], [0, 1])
    const nopeOpacity = useTransform(x, [-50, -150], [0, 1])

    const mediaItems = pet.mediaGallery && pet.mediaGallery.length > 0
        ? pet.mediaGallery
        : (pet.image ? [{ url: pet.image.url, type: "image", public_id: pet.image.public_id }] : [])

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) {
            onSwipe("right")
        } else if (info.offset.x < -100) {
            onSwipe("left")
        }
    }

    const nextMedia = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (mediaIndex < mediaItems.length - 1) {
            setMediaIndex(mediaIndex + 1)
        }
    }

    const prevMedia = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (mediaIndex > 0) {
            setMediaIndex(mediaIndex - 1)
        }
    }

    const currentMedia = mediaItems[mediaIndex] || { url: "/placeholder.svg", type: "image" }

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        >
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-card border">
                {/* Swipe Indicators */}
                <motion.div
                    style={{ opacity: likeOpacity }}
                    className="absolute top-10 left-10 z-20 border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-20deg]"
                >
                    <span className="text-4xl font-black text-green-500 uppercase">THÍCH</span>
                </motion.div>

                <motion.div
                    style={{ opacity: nopeOpacity }}
                    className="absolute top-10 right-10 z-20 border-4 border-red-500 rounded-lg px-4 py-2 rotate-[20deg]"
                >
                    <span className="text-4xl font-black text-red-500 uppercase">BỎ QUA</span>
                </motion.div>

                {/* Media Content */}
                <div className="absolute inset-0 bg-secondary/20">
                    {currentMedia.type === "video" ? (
                        <video
                            src={currentMedia.url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Image
                            src={currentMedia.url}
                            alt={pet.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    )}
                </div>

                {/* Media Navigation Taps */}
                <div className="absolute inset-0 flex z-10">
                    <div className="w-1/2 h-[70%]" onClick={prevMedia} />
                    <div className="w-1/2 h-[70%]" onClick={nextMedia} />
                </div>

                {/* Progress Indicators */}
                {mediaItems.length > 1 && (
                    <div className="absolute top-3 left-4 right-4 flex gap-1 z-20">
                        {mediaItems.map((_: any, i: number) => (
                            <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors ${i === mediaIndex ? "bg-white" : "bg-white/30"}`}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Pet Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2 z-20">
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-bold">{pet.name}</h2>
                                <span className="text-2xl font-medium opacity-90">{Math.floor(pet.age_months / 12) || pet.age_months + ' th'}</span>
                            </div>
                            <p className="flex items-center gap-1 text-white/80 font-medium">
                                <PawPrint className="w-4 h-4" />
                                {pet.breed || pet.species}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInfo(!showInfo);
                            }}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-md transition-colors"
                        >
                            <Info className="w-6 h-6" />
                        </button>
                    </div>

                    {showInfo && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-2"
                        >
                            <p className="text-sm line-clamp-3 text-white/90">
                                {pet.datingProfile?.bio || "Bé chưa có phần giới thiệu chi tiết."}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                    {pet.gender === 'MALE' ? '♂️ Đực' : '♀️ Cái'}
                                </Badge>
                                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                    {pet.datingProfile?.lookingFor === 'Playdate' ? '📍 Tìm bạn chơi' :
                                        pet.datingProfile?.lookingFor === 'Breeding' ? '🧬 Phối giống' : '🐾 Tìm bạn'}
                                </Badge>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

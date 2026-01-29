"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { MapPin, Info, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface PetCardProps {
    pet: any
    isTop?: boolean
    onSwipe: (direction: "left" | "right") => void
}

export function PetCard({ pet, onSwipe, isTop = false }: PetCardProps) {
    const [mediaIndex, setMediaIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    // keyboard / space event listener
    useEffect(() => {
        if (!isTop) return

        const handleNextPhoto = () => {
            if (mediaIndex < mediaItems.length - 1) {
                setMediaIndex(prev => prev + 1)
            } else {
                setMediaIndex(0)
            }
        }

        window.addEventListener("pawmatch:next-photo", handleNextPhoto)
        return () => window.removeEventListener("pawmatch:next-photo", handleNextPhoto)
    }, [isTop, mediaIndex, pet])

    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
    
    // Swipe Feedback Transforms (Stamps)
    const likeOpacity = useTransform(x, [50, 150], [0, 1])
    const likeScale = useTransform(x, [50, 150], [0.5, 1.2])
    const likeRotate = useTransform(x, [50, 150], [0, -15])
    
    const nopeOpacity = useTransform(x, [-50, -150], [0, 1])
    const nopeScale = useTransform(x, [-50, -150], [0.5, 1.2])
    const nopeRotate = useTransform(x, [-50, -150], [0, 15])

    const mediaItems = pet.mediaGallery && pet.mediaGallery.length > 0
        ? pet.mediaGallery
        : (pet.image ? [{ url: pet.image.url, type: "image" }] : [{ url: "/placeholder.svg", type: "image" }])

    const handleDragEnd = (_: any, info: any) => {
        if (!isTop) return
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

    const currentMedia = mediaItems[mediaIndex]

    // Calculate age from age_months
    const years = pet.age_months ? Math.floor(pet.age_months / 12) : 0
    const months = pet.age_months ? pet.age_months % 12 : 0
    const ageDisplay = years > 0 
        ? `${years} tuổi`
        : `${months} tháng`

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing group z-10",
                !isTop && "pointer-events-none"
            )}
        >
            <div className="relative w-full h-full rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden bg-black shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/10">
                {/* Swipe Stamps */}
                <motion.div
                    style={{ opacity: likeOpacity, scale: likeScale, rotate: likeRotate }}
                    className="absolute top-8 lg:top-12 left-6 lg:left-8 z-40 border-[4px] lg:border-[6px] border-green-500 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-1 lg:py-2 pointer-events-none"
                >
                    <span className="text-4xl lg:text-6xl font-black text-green-500 uppercase tracking-tighter">LIKE</span>
                </motion.div>

                <motion.div
                    style={{ opacity: nopeOpacity, scale: nopeScale, rotate: nopeRotate }}
                    className="absolute top-8 lg:top-12 right-6 lg:right-8 z-40 border-[4px] lg:border-[6px] border-red-500 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-1 lg:py-2 pointer-events-none"
                >
                    <span className="text-4xl lg:text-6xl font-black text-red-500 uppercase tracking-tighter">NOPE</span>
                </motion.div>

                {/* Media Content */}
                <div className="absolute inset-0 bg-slate-900">
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
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority
                            draggable={false}
                        />
                    )}
                </div>

                {/* Interaction Overlay for media switching */}
                <div className="absolute inset-x-0 top-0 h-[80%] flex z-10">
                    <div className="w-1/2 h-full cursor-w-resize" onClick={prevMedia} />
                    <div className="w-1/2 h-full cursor-e-resize" onClick={nextMedia} />
                </div>

                {/* Progress bar for multi-media */}
                {mediaItems.length > 1 && (
                    <div className="absolute top-4 lg:top-6 left-6 lg:left-8 right-6 lg:right-8 flex gap-1.5 lg:gap-2 z-30">
                        {mediaItems.map((_: any, i: number) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1 lg:h-1.5 flex-1 rounded-full transition-all duration-300 shadow-sm",
                                    i === mediaIndex ? "bg-white" : "bg-white/20 blur-[0.5px]"
                                )}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom Info Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-20" />

                {/* Pet Information & Quick Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 text-white z-30 transition-transform duration-500 group-hover:-translate-y-2">
                    <div className="flex items-center gap-2 lg:gap-3">
                        <h2 className="text-3xl lg:text-5xl font-black tracking-tighter drop-shadow-lg">
                            {pet.name}, {ageDisplay}
                        </h2>
                        {pet.isVerified && (
                            <CheckCircle2 className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400 fill-white/10 stroke-[3]" />
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-lg font-bold text-white/80 mt-1.5 lg:mt-2 uppercase tracking-widest bg-white/10 backdrop-blur-md w-fit px-2.5 py-1 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-orange-500 fill-orange-500/20" />
                        <span className="text-[10px] lg:text-[12px]">{pet.distance || "Cách 500m"}</span>
                    </div>

                    {/* Expandable Bio/Quick Info */}
                    <motion.div 
                        initial={false}
                        animate={{ 
                            height: isHovered ? "auto" : "44px",
                            opacity: 1
                        }}
                        className="overflow-hidden mt-4 lg:mt-6"
                    >
                        <p className={cn(
                            "text-white/70 text-sm lg:text-base leading-relaxed font-medium transition-colors duration-300",
                            isHovered ? "text-white/90" : "line-clamp-2"
                        )}>
                            {pet.datingProfile?.bio || "Một bé thú cưng đáng yêu đang tìm bạn đồng hành tại TailMate..."}
                        </p>
                        
                        {isHovered && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-2 lg:gap-3 mt-4"
                            >
                                <QuickTag label={pet.breed || "Chó"} />
                                <QuickTag label={pet.gender === "male" ? "Đực" : "Cái"} />
                                <QuickTag label="Thích hòa đồng" />
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

function QuickTag({ label }: { label: string }) {
    return (
        <span className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/80">
            {label}
        </span>
    )
}

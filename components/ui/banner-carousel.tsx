"use client"

import { useState, useEffect, useCallback } from "react"
import { useBanners } from "@/lib/hooks"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Image from "next/image"

interface BannerCarouselProps {
    location: "HOME" | "SHOP" | "SERVICE" | "PROFILE" | "ALL"
    className?: string
}

export function BannerCarousel({ location, className = "" }: BannerCarouselProps) {
    const { data, isLoading } = useBanners(location)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    const banners = data?.banners || []

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, 3000) // 3 seconds

        return () => clearInterval(interval)
    }, [isAutoPlaying, banners.length])

    // Reset index when banners change
    useEffect(() => {
        setCurrentIndex(0)
    }, [banners.length])

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index)
        setIsAutoPlaying(false)
        // Resume auto-play after 5 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 5000)
    }, [])

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 5000)
    }, [banners.length])

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 5000)
    }, [banners.length])

    const handleBannerClick = (targetUrl?: string) => {
        if (targetUrl) {
            window.open(targetUrl, "_blank", "noopener,noreferrer")
        }
    }

    // Handle touch/swipe
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const minSwipeDistance = 50

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            goToNext()
        } else if (isRightSwipe) {
            goToPrevious()
        }
    }

    // Don't render if no banners or loading
    if (isLoading) {
        return (
            <div className={`relative w-full h-32 rounded-2xl bg-secondary/50 flex items-center justify-center ${className}`}>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    if (banners.length === 0) {
        return null
    }

    return (
        <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
            {/* Main Carousel Container */}
            <div
                className="relative aspect-[4/1] sm:aspect-[5/1] lg:aspect-[4/1] overflow-hidden rounded-2xl"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Slides */}
                <div
                    className="flex transition-transform duration-500 ease-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((banner: any, index: number) => (
                        <div
                            key={banner._id || index}
                            className="relative w-full h-full flex-shrink-0 cursor-pointer"
                            onClick={() => handleBannerClick(banner.targetUrl)}
                        >
                            <Image
                                src={banner.image?.url || "/placeholder.svg"}
                                alt={banner.title || `Banner ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                            {/* Overlay gradient for better text visibility if needed */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                            {/* Title overlay (optional) */}
                            {banner.title && (
                                <div className="absolute bottom-4 left-4 right-4">
                                    <p className="text-white font-bold text-lg drop-shadow-lg truncate">
                                        {banner.title}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows (only show if more than 1 banner) */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                goToPrevious()
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                            aria-label="Previous banner"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-800" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                goToNext()
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                            aria-label="Next banner"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-800" />
                        </button>
                    </>
                )}

                {/* Dot Indicators */}
                {banners.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {banners.map((_: any, index: number) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    goToSlide(index)
                                }}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? "w-6 bg-white"
                                    : "bg-white/50 hover:bg-white/75"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

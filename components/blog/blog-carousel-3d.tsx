"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Calendar, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
    _id: string;
    title: string;
    excerpt: string;
    featured_image?: { url: string };
    author_name: string;
    author_avatar?: { url: string };
    published_at?: string;
    created_at?: string;
    category: string;
    view_count?: number;
}

interface BlogCarousel3DProps {
    posts: BlogPost[];
}

export function BlogCarousel3D({ posts }: BlogCarousel3DProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [direction, setDirection] = useState<"left" | "right">("right");

    const displayPosts = posts.slice(0, 8);
    const count = displayPosts.length;

    // Auto-advance
    useEffect(() => {
        if (isPaused || count <= 1) return;
        const interval = setInterval(() => {
            setDirection("right");
            setActiveIndex((prev) => (prev + 1) % count);
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused, count]);

    const handlePrev = useCallback(() => {
        setDirection("left");
        setActiveIndex((prev) => (prev - 1 + count) % count);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 6000);
    }, [count]);

    const handleNext = useCallback(() => {
        setDirection("right");
        setActiveIndex((prev) => (prev + 1) % count);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 6000);
    }, [count]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
        });
    };

    if (count === 0) return null;

    // Calculate positions for each card
    const getCardStyle = (index: number): React.CSSProperties => {
        let diff = index - activeIndex;
        // Handle wrapping
        if (diff > count / 2) diff -= count;
        if (diff < -count / 2) diff += count;

        const absDiff = Math.abs(diff);

        if (absDiff > 2) {
            return {
                opacity: 0,
                transform: `translateX(${diff > 0 ? 300 : -300}px) scale(0.5) rotateY(${diff > 0 ? -30 : 30}deg)`,
                zIndex: 0,
                pointerEvents: "none",
            };
        }

        const translateX = diff * 340;
        const translateZ = -absDiff * 120;
        const rotateY = diff * -8;
        const scale = 1 - absDiff * 0.12;
        const opacity = 1 - absDiff * 0.3;

        return {
            transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
            zIndex: 10 - absDiff,
            opacity,
            pointerEvents: absDiff === 0 ? "auto" : "none",
            filter: absDiff > 0 ? `blur(${absDiff * 1.5}px)` : "none",
        };
    };

    return (
        <div
            className="w-full relative flex flex-col items-center justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{ perspective: "1200px" }}
        >
            {/* Carousel container */}
            <div className="relative w-full flex items-center justify-center" style={{ height: 520 }}>
                {/* Glow behind active card */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[350px] h-[400px] bg-gradient-to-br from-primary/30 via-orange-400/20 to-pink-400/20 rounded-[40px] blur-[80px] animate-pulse" />
                </div>

                {/* Cards */}
                <div className="relative" style={{ transformStyle: "preserve-3d", width: 380, height: 480 }}>
                    {displayPosts.map((post, index) => (
                        <div
                            key={post._id}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{
                                ...getCardStyle(index),
                                transition: "all 0.7s cubic-bezier(0.32, 0.72, 0, 1)",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <Link href={`/blog/${post._id}`} className="block w-full h-full">
                                <div className={`
                                    w-full h-full rounded-[28px] overflow-hidden relative group cursor-pointer
                                    bg-white dark:bg-gray-900
                                    shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)]
                                    hover:shadow-[0_30px_80px_-15px_rgba(241,90,41,0.3),0_0_0_1px_rgba(241,90,41,0.1)]
                                    transition-shadow duration-500
                                `}>
                                    {/* Image section */}
                                    <div className="relative h-[55%] overflow-hidden">
                                        <Image
                                            src={post.featured_image?.url || "/placeholder-blog.jpg"}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Category badge - glassmorphism */}
                                        <Badge className="absolute top-4 left-4 bg-white/20 text-white backdrop-blur-xl border border-white/30 shadow-lg px-3 py-1 text-xs font-bold hover:bg-white/30 z-10">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            {post.category}
                                        </Badge>

                                        {/* View count floating pill */}
                                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/30 text-white backdrop-blur-md rounded-full px-2.5 py-1 text-[11px] font-semibold">
                                            <Eye className="w-3 h-3" />
                                            {post.view_count || 0}
                                        </div>

                                        {/* Bottom gradient info overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(post.published_at || post.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content section */}
                                    <div className="p-5 pb-6 flex flex-col h-[45%] relative">
                                        {/* Decorative line */}
                                        <div className="absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r from-primary/60 via-orange-400/60 to-transparent rounded-full" />

                                        <h3 className="text-lg font-extrabold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300 mt-2">
                                            {post.title}
                                        </h3>

                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-auto leading-relaxed">
                                            {post.excerpt}
                                        </p>

                                        {/* Author row */}
                                        <div className="flex items-center gap-3 pt-4 mt-auto border-t border-border/30">
                                            <div className="w-9 h-9 rounded-full overflow-hidden relative ring-2 ring-primary/20 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-md flex-shrink-0">
                                                <Image
                                                    src={post.author_avatar?.url || "/images/logo.png"}
                                                    alt={post.author_name || "Author"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate block">{post.author_name}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">Tác giả</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary text-[11px] font-bold group-hover:translate-x-1 transition-transform">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                Đọc
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            {count > 1 && (
                <div className="flex items-center gap-6 mt-2 relative z-20">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrev}
                        className="w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-primary/20 hover:bg-primary hover:text-white hover:border-primary hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-primary/30"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-2">
                        {displayPosts.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setDirection(i > activeIndex ? "right" : "left");
                                    setActiveIndex(i);
                                    setIsPaused(true);
                                    setTimeout(() => setIsPaused(false), 6000);
                                }}
                                className={`rounded-full transition-all duration-500 ${
                                    i === activeIndex
                                        ? "w-8 h-2.5 bg-gradient-to-r from-primary to-orange-400 shadow-lg shadow-primary/30"
                                        : "w-2.5 h-2.5 bg-foreground/15 hover:bg-foreground/30"
                                }`}
                            />
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        className="w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-primary/20 hover:bg-primary hover:text-white hover:border-primary hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-primary/30"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            )}

            {/* Reflection floor */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[120px] bg-gradient-to-t from-primary/8 via-primary/4 to-transparent blur-2xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[60px] bg-gradient-to-t from-orange-400/10 to-transparent blur-xl rounded-full pointer-events-none" />
        </div>
    );
}

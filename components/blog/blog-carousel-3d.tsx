"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    const [rotation, setRotation] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [cardDimensions, setCardDimensions] = useState({ width: 320, height: 450 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Use a subset of posts if too many, but ensure enough for 3D effect (min 3 recommended)
    const displayPosts = posts.slice(0, 8);
    const count = displayPosts.length;

    // Responsive card dimensions
    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            if (w >= 1200) {
                setCardDimensions({ width: 450, height: 550 });
            } else if (w >= 1024) {
                setCardDimensions({ width: 400, height: 500 });
            } else if (w >= 768) {
                setCardDimensions({ width: 350, height: 480 });
            } else {
                setCardDimensions({ width: 280, height: 420 });
            }
        };

        handleResize(); // Initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const { width: cardWidth, height: cardHeight } = cardDimensions;
    const gap = 30;

    // Calculate radius based on number of items to form a circle
    // Circumference ~= count * (cardWidth + gap)
    // Radius = Circumference / (2 * PI)
    // Or simpler: r = (cardWidth / 2) / tan(PI / count)
    // We add proper spacing factor
    const radius = count > 1
        ? Math.round((cardWidth + gap) / 2 / Math.tan(Math.PI / count)) + 50
        : 0;

    // Angle per item
    const theta = 360 / count;

    useEffect(() => {
        if (isPaused || count <= 1) return;

        const interval = setInterval(() => {
            setRotation((prev) => prev - theta);
        }, 4000); // Auto rotate every 4 seconds

        return () => clearInterval(interval);
    }, [isPaused, count, theta]);

    const handlePrev = () => {
        setRotation((prev) => prev + theta);
        setIsPaused(true);
        // Resume auto-rotation after interaction
        setTimeout(() => setIsPaused(false), 5000);
    };

    const handleNext = () => {
        setRotation((prev) => prev - theta);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 5000);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
        });
    };

    if (count === 0) return null;

    return (
        <div className="w-full py-20 overflow-hidden relative flex flex-col items-center justify-center min-h-[600px] perspective-container">
            <style jsx>{`
        .perspective-container {
          perspective: 2000px;
        }
        .carousel-3d {
          transform-style: preserve-3d;
          transition: transform 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
      `}</style>

            <div
                className="relative carousel-3d"
                style={{
                    transform: `rotateY(${rotation}deg)`,
                    width: cardWidth,
                    height: cardHeight
                }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {displayPosts.map((post, index) => {
                    // Calculate this item's angle
                    const itemAngle = index * theta;

                    return (
                        <div
                            key={post._id}
                            className="absolute top-0 left-0 w-full h-full backface-hidden"
                            style={{
                                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                                // Add a simplified backface visibility handling or just let content show
                                // Since we want to see the "back" of the circle as it rotates, backface-hidden might be wrong if we see inside?
                                // Actually, preserving 3d means we see them. 
                                // Let's keep them visible.
                            }}
                        >
                            <Link href={`/blog/${post._id}`} className="block w-full h-full">
                                <div className="w-full h-full bg-card/95 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-2xl group hover:-translate-y-2 duration-300">
                                    {/* Image */}
                                    <div className="relative h-1/2 overflow-hidden">
                                        <Image
                                            src={post.featured_image?.url || "/placeholder-blog.jpg"}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        <Badge className="absolute top-4 left-4 bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-sm border-none shadow-sm z-10">
                                            {post.category}
                                        </Badge>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col h-1/2 relative bg-white dark:bg-gray-900/90">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(post.published_at || post.created_at)}
                                            <span className="mx-1">•</span>
                                            <Eye className="w-3.5 h-3.5" />
                                            {post.view_count || 0}
                                        </div>

                                        <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>

                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                            {post.excerpt}
                                        </p>

                                        <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border/50">
                                            <div className="w-8 h-8 rounded-full overflow-hidden relative border border-border">
                                                <Image
                                                    src={post.author_avatar?.url || "/images/logo.png"}
                                                    alt={post.author_name || "Author"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <span className="text-xs font-medium truncate max-w-[150px]">
                                                {post.author_name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            {count > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrev}
                        className="w-12 h-12 rounded-full bg-background/50 backdrop-blur-md border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        className="w-12 h-12 rounded-full bg-background/50 backdrop-blur-md border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>
                </div>
            )}

            {/* Decorative gradient floor */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-gradient-to-t from-primary/5 to-transparent blur-3xl rounded-full" />
        </div>
    );
}

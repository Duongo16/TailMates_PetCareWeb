"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { blogAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar,
    Eye,
    ThumbsUp,
    ThumbsDown,
    ArrowLeft,
    Share2,
    MessageSquare,
    Clock,
} from "lucide-react";

export default function BlogDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userVote, setUserVote] = useState<"LIKE" | "DISLIKE" | null>(null);

    useEffect(() => {
        if (id) {
            fetchPost(id as string);
        }
    }, [id]);

    const fetchPost = async (postId: string) => {
        try {
            setLoading(true);
            const response = await blogAPI.get(postId);
            if (response.success && response.data) {
                setPost(response.data.post);
                setUserVote(response.data.user_vote);
            } else {
                setError(response.message || "Failed to load blog post");
            }
        } catch (err) {
            console.error("Error fetching blog post:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (voteType: "LIKE" | "DISLIKE") => {
        if (!post) return;

        try {
            // Optimistic update
            const newVote = userVote === voteType ? null : voteType;
            setUserVote(newVote);

            // Update counts locally for immediate feedback
            setPost((prev: any) => {
                let newLikeCount = prev.like_count;
                let newDislikeCount = prev.dislike_count;

                // Remove old vote
                if (userVote === 'LIKE') newLikeCount--;
                if (userVote === 'DISLIKE') newDislikeCount--;

                // Add new vote
                if (newVote === 'LIKE') newLikeCount++;
                if (newVote === 'DISLIKE') newDislikeCount++;

                return {
                    ...prev,
                    like_count: newLikeCount,
                    dislike_count: newDislikeCount
                };
            });

            await blogAPI.vote(post._id, newVote);
        } catch (err) {
            console.error("Error voting:", err);
            // Revert on error (optional implementation)
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="h-12 bg-muted rounded w-3/4"></div>
                    <div className="h-[400px] bg-muted rounded-2xl"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-destructive">
                        Không tìm thấy bài viết
                    </h1>
                    <p className="text-muted-foreground">
                        {error || "Bài viết này có thể đã bị xóa hoặc không tồn tại."}
                    </p>
                    <Link href="/blog">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại trang Blog
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Article Header */}
            <div className="bg-muted/30 border-b border-border/50">
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <Link
                        href="/blog"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Quay lại Blog
                    </Link>

                    <div className="flex items-center gap-3 mb-6">
                        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 text-sm rounded-full">
                            {post.category}
                        </Badge>
                        <span className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(post.published_at || post.created_at)}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-8 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarImage src={post.author_avatar?.url} />
                                <AvatarFallback>
                                    {post.author_name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">
                                    {post.author_name}
                                </p>
                                <p className="text-sm text-muted-foreground">Tác giả</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5" title="Lượt xem">
                                <Eye className="w-4 h-4" />
                                {post.view_count || 0}
                            </div>
                            <div className="flex items-center gap-1.5" title="Lượt thích">
                                <ThumbsUp className="w-4 h-4" />
                                {post.like_count || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Image */}
            {post.featured_image?.url && (
                <div className="container mx-auto px-4 max-w-5xl -mt-8 mb-12 relative z-10">
                    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl shadow-xl border border-border/50">
                        <Image
                            src={post.featured_image.url}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
            )}

            {/* Article Content */}
            <article className="container mx-auto px-4 max-w-3xl">
                <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                    {/* 
               Warning: This renders raw HTML. Ensure content is sanitized on the server 
               or use a library like 'dompurify' if user input is not trused. 
               Assuming trusted rich-text output here.
            */}
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-12 pt-8 border-t border-border">
                        <span className="text-sm font-semibold text-muted-foreground mr-2 py-1">
                            Tags:
                        </span>
                        {post.tags.map((tag: string, index: number) => (
                            <span
                                key={index}
                                className="bg-muted hover:bg-muted/80 text-muted-foreground text-sm px-3 py-1 rounded-full transition-colors cursor-default"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Interaction Bar */}
                <div className="flex items-center justify-between p-6 bg-card rounded-2xl border border-border shadow-sm mb-16">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold mr-4 hidden sm:block">
                            Bài viết hữu ích?
                        </p>
                        <Button
                            variant={userVote === "LIKE" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVote("LIKE")}
                            className={`rounded-full gap-2 transition-all ${userVote === "LIKE" ? "bg-green-600 hover:bg-green-700" : "hover:text-green-600 hover:border-green-600"
                                }`}
                        >
                            <ThumbsUp className={`w-4 h-4 ${userVote === "LIKE" ? "fill-current" : ""}`} />
                            <span className="min-w-[1ch]">{post.like_count || 0}</span>
                        </Button>
                        <Button
                            variant={userVote === "DISLIKE" ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleVote("DISLIKE")}
                            className={`rounded-full gap-2 transition-all ${userVote !== "DISLIKE" ? "hover:text-red-600 hover:border-red-600" : ""
                                }`}
                        >
                            <ThumbsDown className={`w-4 h-4 ${userVote === "DISLIKE" ? "fill-current" : ""}`} />
                        </Button>
                    </div>

                    <Button variant="ghost" size="sm" className="gap-2 rounded-full text-muted-foreground hover:text-primary">
                        <Share2 className="w-4 h-4" />
                        Chia sẻ
                    </Button>
                </div>
            </article>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { blogAPI } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    Calendar,
    Eye,
    ThumbsUp,
    ChevronRight,
    ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BlogCarousel3D } from "@/components/blog/blog-carousel-3d";

const BLOG_CATEGORIES = [
    "Tất cả bài viết",
    "Hướng Dẫn Sử Dụng",
    "Kinh nghiệm nuôi Chó",
    "Kinh nghiệm nuôi Mèo",
    "Kinh nghiệm nuôi Pet",
    "Tin Tức Thú Cưng",
    "Uncategorized",
];

export default function BlogPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("Tất cả bài viết");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchPosts();
    }, [selectedCategory, currentPage, debouncedSearch]);

    // Fetch featured posts for carousel
    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const response = await blogAPI.list({ sort: "popular", limit: 8 });
                if (response.success && response.data) {
                    setFeaturedPosts(response.data.posts || []);
                }
            } catch (error) {
                console.error("Failed to fetch featured posts", error);
            }
        };
        loadFeatured();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: currentPage,
                limit: 12, // Standard grid of 12
            };

            if (selectedCategory !== "Tất cả bài viết") {
                params.category = selectedCategory;
            }

            if (debouncedSearch) {
                params.search = debouncedSearch;
            }

            const response = await blogAPI.list(params);
            if (response.success && response.data) {
                setPosts(response.data.posts || []);
                setTotalPages(response.data.pagination?.total_pages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch blog posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };



    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Site Header */}
            <SiteHeader showBlogLink={false} />

            {/* Hero Section */}
            {/* 3D Carousel Hero Section */}
            <section className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-transparent overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10 pt-12 pb-4">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 leading-tight">
                            Góc chia sẻ <span className="text-primary">Kiến thức</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Khám phá những bài viết nổi bật nhất từ cộng đồng TailMates
                        </p>
                    </div>

                    {featuredPosts.length > 0 ? (
                        <BlogCarousel3D posts={featuredPosts} />
                    ) : (
                        <div className="h-[500px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    )}
                </div>
            </section>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 py-16">
                {/* Search and Categories - Floating Sticky */}
                <div className="sticky top-20 z-40 mb-12 bg-background/80 backdrop-blur-md dark:bg-card/80 p-4 rounded-2xl shadow-lg border border-border/50">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Categories Scroll */}
                        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            <div className="flex items-center gap-2">
                                {BLOG_CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setCurrentPage(1);
                                        }}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category
                                            ? "bg-primary text-primary-foreground shadow-md transform scale-105"
                                            : "bg-muted hover:bg-muted/80 text-foreground"
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-72 flex-shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm bài viết..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 bg-background rounded-full border-2 focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                {loading && currentPage !== 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-[400px] bg-muted/30 rounded-2xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link key={post._id} href={`/blog/${post._id}`}>
                                <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card group overflow-hidden rounded-2xl">
                                    {/* Image */}
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
                                        <Image
                                            src={post.featured_image?.url || "/placeholder-blog.jpg"}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-background/90 hover:bg-background text-foreground backdrop-blur-sm shadow-sm border-none">
                                                {post.category}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-6">
                                        {/* Meta Info */}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(post.published_at || post.created_at)}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {post.view_count || 0}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    {post.like_count || 0}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                            {post.title}
                                        </h3>

                                        <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                                            {post.excerpt}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={post.author_avatar?.url} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {post.author_name?.charAt(0) || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium text-foreground/80 truncate max-w-[100px]">
                                                    {post.author_name}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Xem chi tiết
                                                <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    !loading && posts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                                Không tìm thấy bài viết nào
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác xem sao.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategory("Tất cả bài viết");
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    )
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-16">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="rounded-full w-10 h-10 p-0 hover:bg-primary/10 hover:text-primary border-muted-foreground/20"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-full w-10 h-10 p-0 ${currentPage === page
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                    : "hover:bg-primary/10 hover:text-primary border-muted-foreground/20"
                                    }`}
                            >
                                {page}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-full w-10 h-10 p-0 hover:bg-primary/10 hover:text-primary border-muted-foreground/20"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

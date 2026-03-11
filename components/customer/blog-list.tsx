"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { blogAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import BlogCreateModal from "./blog-create-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    MoreHorizontal, 
    Pencil, 
    Trash2, 
    Send, 
    Eye, 
    Search, 
    Filter, 
    Plus, 
    ThumbsUp, 
    ThumbsDown, 
    Calendar, 
    Tag,
    Clock,
    LayoutGrid,
    List as ListIcon,
    AlertCircle,
    Newspaper,
    Image as ImageIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FeatureGate } from "@/components/ui/feature-gate";
import { cn } from "@/lib/utils";

export default function BlogList() {
    const router = useRouter();
    const { toast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.myPosts();
            if (response.success && response.data) {
                setPosts(response.data.posts || []);
            }
        } catch (error) {
            console.error("Failed to fetch blog posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (post: any) => {
        setSelectedPost(post);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedPost(null);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!postToDelete) return;

        try {
            const response = await blogAPI.delete(postToDelete);
            if (response.success) {
                toast({
                    title: "Thành công",
                    description: "Xóa bài viết thành công",
                });
                fetchPosts();
            } else {
                toast({
                    title: "Lỗi",
                    description: response.message || "Không thể xóa bài viết",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to delete post:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa bài viết",
                variant: "destructive",
            });
        } finally {
            setDeleteDialogOpen(false);
            setPostToDelete(null);
        }
    };

    const handleSubmit = async (postId: string) => {
        try {
            const response = await blogAPI.submit(postId);
            if (response.success) {
                toast({
                    title: "Thành công",
                    description: "Gửi bài viết chờ duyệt thành công",
                });
                fetchPosts();
            } else {
                toast({
                    title: "Lỗi",
                    description: response.message || "Không thể gửi bài viết",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to submit post:", error);
            toast({
                title: "Lỗi",
                description: "Không thể gửi bài viết",
                variant: "destructive",
            });
        }
    };

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !statusFilter || post.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [posts, searchQuery, statusFilter]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-slate-100 text-slate-600 border-slate-200";
            case "PENDING": return "bg-amber-50 text-amber-600 border-amber-200";
            case "PUBLISHED": return "bg-emerald-50 text-emerald-600 border-emerald-200";
            case "REJECTED": return "bg-rose-50 text-rose-600 border-rose-200";
            default: return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "DRAFT": return "Bản nháp";
            case "PENDING": return "Đang chờ duyệt";
            case "PUBLISHED": return "Đã công khai";
            case "REJECTED": return "Bị từ chối";
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <FeatureGate featureKey="blog_posting" fullScreen>
            <div className="space-y-6">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Tìm kiếm bài viết..." 
                            className="pl-10 h-10 rounded-xl bg-secondary/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    {statusFilter ? getStatusLabel(statusFilter) : "Tất cả trạng thái"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl mt-2">
                                <DropdownMenuItem onClick={() => setStatusFilter(null)}>Tất cả trạng thái</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("DRAFT")}>Bản nháp</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>Chờ duyệt</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("PUBLISHED")}>Đã công khai</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("REJECTED")}>Bị từ chối</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="hidden sm:flex border border-border rounded-xl p-0.5 ml-1">
                            <Button 
                                variant={viewMode === "list" ? "secondary" : "ghost"} 
                                size="icon" 
                                className="h-9 w-9 rounded-lg"
                                onClick={() => setViewMode("list")}
                            >
                                <ListIcon className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                                size="icon" 
                                className="h-9 w-9 rounded-lg"
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                        </div>

                        <Button onClick={handleCreate} className="h-10 rounded-xl px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all font-semibold ml-2">
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo bài mới
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className={cn(
                    "relative min-h-[300px]",
                    viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
                )}>
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-2xl">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground font-medium">Đang tải bài viết...</p>
                            </div>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className={cn(
                            "flex flex-col items-center justify-center py-20 text-center",
                            viewMode === "grid" && "col-span-full"
                        )}>
                            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
                                <Newspaper className="w-10 h-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {searchQuery ? "Không tìm thấy bài viết" : "Bạn chưa viết bài nào"}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                {searchQuery 
                                    ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc." 
                                    : "Bắt đầu chia sẻ kiến thức và kinh nghiệm về chăm sóc thú cưng của bạn ngay hôm nay!"}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleCreate} className="rounded-xl px-8 py-6 text-lg font-bold">
                                    Thêm bài viết đầu tiên
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredPosts.map((post) => (
                            <Card key={post._id} className={cn(
                                "group border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                                viewMode === "list" ? "p-0" : "flex flex-col h-full"
                            )}>
                                <CardContent className={cn(
                                    "p-0",
                                    viewMode === "list" ? "flex flex-col sm:flex-row items-stretch gap-4 p-3" : "flex flex-col h-full"
                                )}>
                                    {/* Thumbnail */}
                                    <div className={cn(
                                        "relative bg-secondary/50 overflow-hidden shrink-0",
                                        viewMode === "list" ? "w-full sm:w-48 h-32 rounded-xl" : "aspect-video w-full"
                                    )}>
                                        {post.featured_image?.url || post.featured_image ? (
                                            <img 
                                                src={post.featured_image?.url || post.featured_image} 
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2">
                                            <Badge className={cn("text-[10px] font-bold px-2 py-0.5 border shadow-sm", getStatusStyle(post.status))}>
                                                {getStatusLabel(post.status)}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className={cn(
                                        "flex-1 flex flex-col min-w-0 px-1",
                                        viewMode === "list" ? "py-1" : "p-4"
                                    )}>
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                                                <Tag className="w-3 h-3" />
                                                {post.category}
                                            </div>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border/50 p-1">
                                                    {post.status === "PUBLISHED" && (
                                                        <DropdownMenuItem onClick={() => router.push(`/blog/${post._id}`)} className="rounded-lg">
                                                            <Eye className="mr-2 h-4 w-4" /> Xem bài viết
                                                        </DropdownMenuItem>
                                                    )}
                                                    {post.status === "DRAFT" && (
                                                        <DropdownMenuItem onClick={() => handleSubmit(post._id)} className="rounded-lg text-primary font-medium focus:text-primary">
                                                            <Send className="mr-2 h-4 w-4" /> Gửi duyệt ngay
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleEdit(post)} className="rounded-lg">
                                                        <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setPostToDelete(post._id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Xóa bài viết
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <h4 className={cn(
                                            "font-bold text-foreground leading-tight group-hover:text-primary transition-colors cursor-pointer",
                                            viewMode === "list" ? "text-lg line-clamp-1" : "text-base line-clamp-2 mb-4"
                                        )} onClick={() => post.status === "PUBLISHED" ? router.push(`/blog/${post._id}`) : handleEdit(post)}>
                                            {post.title}
                                        </h4>

                                        <div className={cn(
                                            "flex items-center gap-6 mt-auto",
                                            viewMode === "list" ? "mt-4" : "pt-4 border-t border-border/50"
                                        )}>
                                            <div className="flex items-center gap-1.5" title="Lượt xem">
                                                <Eye className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                <span className="text-xs font-semibold">{post.view_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-emerald-600/80" title="Like">
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-semibold">{post.like_count || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-rose-600/80" title="Dislike">
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-semibold">{post.dislike_count || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-auto text-muted-foreground" title="Ngày tạo">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-medium">{formatDate(post.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <BlogCreateModal
                    open={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedPost(null);
                    }}
                    onSuccess={fetchPosts}
                    post={selectedPost}
                />

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent className="rounded-3xl p-8 border-none shadow-2xl">
                        <AlertDialogHeader>
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-6 h-6 text-rose-600" />
                            </div>
                            <AlertDialogTitle className="text-xl font-bold">Xác nhận xóa bài viết?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                                Hành động này không thể hoàn tác. Bài viết của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống TailMates.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-2">
                            <AlertDialogCancel className="rounded-xl border-slate-200">Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                                Xóa bài viết
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </FeatureGate>
    );
}

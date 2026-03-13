"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { managerBlogAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    CheckCircle, 
    XCircle, 
    Eye, 
    Search, 
    Filter, 
    Calendar, 
    Tag, 
    Clock, 
    LayoutGrid, 
    List as ListIcon,
    Newspaper,
    Image as ImageIcon,
    MoreHorizontal,
    ThumbsUp,
    ThumbsDown,
    User,
    Mail,
    AlertCircle
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function BlogApproval() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("PENDING");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [managerNote, setManagerNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [statusFilter]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await managerBlogAPI.list({ status: statusFilter === "ALL" ? undefined : statusFilter });
            if (response.success && response.data) {
                setPosts(response.data.posts || []);
            }
        } catch (error) {
            console.error("Failed to fetch blog posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedPost) return;

        try {
            setActionLoading(true);
            const response = await managerBlogAPI.approve(selectedPost._id, managerNote || undefined);
            if (response.success) {
                toast({
                    title: "Thành công",
                    description: "Duyệt bài viết thành công",
                });
                setApproveDialogOpen(false);
                setManagerNote("");
                setSelectedPost(null);
                fetchPosts();
            } else {
                toast({
                    title: "Lỗi",
                    description: response.message || "Không thể duyệt bài viết",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to approve post:", error);
            toast({
                title: "Lỗi",
                description: "Không thể duyệt bài viết",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedPost) return;

        if (!managerNote) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng nhập lý do từ chối",
                variant: "destructive",
            });
            return;
        }

        try {
            setActionLoading(true);
            const response = await managerBlogAPI.reject(selectedPost._id, managerNote);
            if (response.success) {
                toast({
                    title: "Thành công",
                    description: "Từ chối bài viết thành công",
                });
                setRejectDialogOpen(false);
                setManagerNote("");
                setSelectedPost(null);
                fetchPosts();
            } else {
                toast({
                    title: "Lỗi",
                    description: response.message || "Không thể từ chối bài viết",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to reject post:", error);
            toast({
                title: "Lỗi",
                description: "Không thể từ chối bài viết",
                variant: "destructive",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 post.author_name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [posts, searchQuery]);

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
            case "PENDING": return "Chờ duyệt";
            case "PUBLISHED": return "Đã đăng";
            case "REJECTED": return "Từ chối";
            case "ALL" : return "Tất cả";
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
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border/50 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Tìm theo tiêu đề hoặc tác giả..." 
                        className="pl-11 h-11 rounded-2xl bg-secondary/30 border-none ring-0 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-2xl px-5 border-border/50 flex items-center gap-2 font-bold hover:bg-secondary/50 transition-colors">
                                <Filter className="w-4 h-4 text-primary" />
                                {getStatusLabel(statusFilter)}
                                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary border-none">{posts.length}</Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl mt-2 p-1 border-border/40">
                            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")} className="rounded-xl p-2.5 cursor-pointer">
                                <Clock className="w-4 h-4 mr-2 text-amber-500" /> Chờ duyệt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("PUBLISHED")} className="rounded-xl p-2.5 cursor-pointer">
                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Đã công khai
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("REJECTED")} className="rounded-xl p-2.5 cursor-pointer">
                                <XCircle className="w-4 h-4 mr-2 text-rose-500" /> Đã từ chối
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("ALL")} className="rounded-xl p-2.5 cursor-pointer border-t mt-1">
                                <LayoutGrid className="w-4 h-4 mr-2" /> Tất cả bài viết
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="hidden sm:flex bg-secondary/30 rounded-2xl p-1 gap-1">
                        <Button 
                            variant={viewMode === "list" ? "secondary" : "ghost"} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-xl transition-all shadow-none", viewMode === "list" && "bg-white shadow-sm")}
                            onClick={() => setViewMode("list")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant={viewMode === "grid" ? "secondary" : "ghost"} 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-xl transition-all shadow-none", viewMode === "grid" && "bg-white shadow-sm")}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={cn(
                "relative min-h-[400px] transition-all duration-500",
                viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
            )}>
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px] z-10 rounded-3xl">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-sm font-bold text-muted-foreground animate-pulse">Đang tải danh sách bài viết...</p>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className={cn(
                        "flex flex-col items-center justify-center py-24 text-center bg-card/30 rounded-3xl border-2 border-dashed border-border/50",
                        viewMode === "grid" && "col-span-full"
                    )}>
                        <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
                            <Newspaper className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-2">
                            {searchQuery ? "Không tìm thấy kết quả" : "Trống trải quá..."}
                        </h3>
                        <p className="text-muted-foreground max-w-sm font-medium">
                            {searchQuery 
                                ? "Thử tìm kiếm với tên tác giả hoặc từ khóa khác." 
                                : `Hiện tại không có bài viết nào ở trạng thái ${getStatusLabel(statusFilter)}.`}
                        </p>
                    </div>
                ) : (
                    filteredPosts.map((post) => (
                        <Card key={post._id} className={cn(
                            "group border border-border/50 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 overflow-hidden rounded-3xl",
                            viewMode === "list" ? "p-0" : "flex flex-col h-full"
                        )}>
                            <CardContent className={cn(
                                "p-0",
                                viewMode === "list" ? "flex flex-col sm:flex-row items-stretch gap-6 p-4" : "flex flex-col h-full"
                            )}>
                                {/* Thumbnail */}
                                <div className={cn(
                                    "relative bg-secondary/50 overflow-hidden shrink-0",
                                    viewMode === "list" ? "w-full sm:w-64 h-44 rounded-2xl" : "aspect-[16/10] w-full"
                                )}>
                                    {post.featured_image?.url ? (
                                        <Image 
                                            src={post.featured_image.url} 
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                            <ImageIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <Badge className={cn("text-[10px] font-black px-3 py-1 border-none shadow-lg backdrop-blur-md uppercase tracking-wider", getStatusStyle(post.status))}>
                                            {getStatusLabel(post.status)}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className={cn(
                                    "flex-1 flex flex-col min-w-0",
                                    viewMode === "list" ? "py-1" : "p-5"
                                )}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-0 border-none">
                                                {post.category}
                                            </Badge>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors">
                                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl mt-2 p-1 border-border/40">
                                                <DropdownMenuItem onClick={() => { setSelectedPost(post); setViewDialogOpen(true); }} className="rounded-xl p-2.5 cursor-pointer">
                                                    <Eye className="w-4 h-4 mr-2 text-primary" /> Xem chi tiết bài viết
                                                </DropdownMenuItem>
                                                
                                                {post.status === "PENDING" && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => { setSelectedPost(post); setApproveDialogOpen(true); }} className="rounded-xl p-2.5 cursor-pointer text-emerald-600 font-bold focus:text-emerald-600 focus:bg-emerald-50">
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Duyệt bài này
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setSelectedPost(post); setRejectDialogOpen(true); }} className="rounded-xl p-2.5 cursor-pointer text-rose-600 font-bold focus:text-rose-600 focus:bg-rose-50">
                                                            <XCircle className="w-4 h-4 mr-2" /> Từ chối bài này
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <h4 className={cn(
                                        "font-black text-foreground group-hover:text-primary transition-colors mb-3 leading-tight",
                                        viewMode === "list" ? "text-xl line-clamp-1" : "text-lg line-clamp-2"
                                    )}>
                                        {post.title}
                                    </h4>

                                    {/* Author Mini Profile */}
                                    <div className="flex items-center gap-3 mb-4 p-2 rounded-2xl bg-secondary/20">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                                            {post.author_name?.charAt(0) || "U"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black truncate leading-none mb-0.5">{post.author_name}</p>
                                            <p className="text-[9px] text-muted-foreground truncate font-medium">{post.author_id?.email || "No email"}</p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-center gap-5 mt-auto",
                                        viewMode === "list" ? "pt-4 border-t border-border/50" : "pt-4 border-t border-border/50"
                                    )}>
                                        <div className="flex items-center gap-1.5" title="Lượt xem">
                                            <Eye className="w-3.5 h-3.5 text-muted-foreground/60" />
                                            <span className="text-xs font-bold">{post.view_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-emerald-600/70" title="Like">
                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{post.like_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-rose-600/70" title="Dislike">
                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{post.dislike_count || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-auto text-muted-foreground" title="Ngày tạo">
                                            <Calendar className="w-3.5 h-3.5 opacity-60" />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">{formatDate(post.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
                    {selectedPost && (
                        <div className="flex flex-col">
                            {/* Hero Header */}
                            <div className="relative h-64 w-full bg-secondary">
                                {selectedPost.featured_image?.url && (
                                    <Image
                                        src={selectedPost.featured_image.url}
                                        alt={selectedPost.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8">
                                    <Badge className={cn("w-fit mb-4 font-black px-3 py-1", getStatusStyle(selectedPost.status))}>
                                        {getStatusLabel(selectedPost.status)}
                                    </Badge>
                                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{selectedPost.title}</h2>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Metadata Bar */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-secondary/30 rounded-3xl border border-secondary/50">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Tác giả</Label>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" />
                                            <p className="text-sm font-bold truncate">{selectedPost.author_name}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Danh mục</Label>
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-primary" />
                                            <p className="text-sm font-bold uppercase">{selectedPost.category}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Thời gian</Label>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <p className="text-sm font-bold">{formatDate(selectedPost.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Liên hệ</Label>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" />
                                            <p className="text-[10px] font-bold truncate">{selectedPost.author_id?.email || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-blue max-w-none">
                                    <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-2xl italic text-sm text-foreground/80 mb-6 font-medium">
                                        "{selectedPost.excerpt}"
                                    </div>
                                    
                                    <div 
                                        className="text-foreground/90 font-medium leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: selectedPost.content }} 
                                    />
                                </div>

                                {selectedPost.manager_note && (
                                    <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                                        <div className="flex items-center gap-2 mb-2 text-rose-600">
                                            <AlertCircle className="w-5 h-5" />
                                            <h4 className="font-black text-sm uppercase tracking-widest">Ghi chú từ quản trị viên</h4>
                                        </div>
                                        <p className="text-sm text-rose-700 font-medium leading-normal">{selectedPost.manager_note}</p>
                                    </div>
                                )}
                                
                                {selectedPost.status === "PENDING" && (
                                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
                                        <Button
                                            className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20"
                                            onClick={() => { setViewDialogOpen(false); setApproveDialogOpen(true); }}
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" /> Duyệt bài viết
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 font-black"
                                            onClick={() => { setViewDialogOpen(false); setRejectDialogOpen(true); }}
                                        >
                                            <XCircle className="w-5 h-5 mr-2" /> Từ chối
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Xác nhận duyệt bài</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium pt-2">
                            Bài viết <span className="text-primary font-bold italic">"{selectedPost?.title}"</span> sẽ được công khai ngay sau khi bạn đồng ý.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-3">
                        <Label htmlFor="approve-note" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ghi chú (tùy chọn)</Label>
                        <Textarea
                            id="approve-note"
                            value={managerNote}
                            onChange={(e) => setManagerNote(e.target.value)}
                            placeholder="Nhập ghi chú cá nhân hoặc lời nhắn dành cho tác giả..."
                            className="rounded-2xl bg-secondary/30 border-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 resize-none font-medium h-24"
                        />
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <Button variant="ghost" className="rounded-2xl font-bold" onClick={() => setApproveDialogOpen(false)}>
                            Quay lại
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-black flex-1 shadow-lg shadow-emerald-600/20"
                        >
                            {actionLoading ? "Đang xử lý..." : "Đồng ý Duyệt bài"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-8 h-8 text-rose-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Từ chối bài viết</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium pt-2">
                            Vui lòng cung cấp lý do cụ thể để tác giả chỉnh sửa lại nội dung phù hợp hơn.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-3">
                        <Label htmlFor="reject-note" className="text-xs font-black uppercase tracking-widest text-rose-600">Lý do từ chối (bắt buộc) *</Label>
                        <Textarea
                            id="reject-note"
                            value={managerNote}
                            onChange={(e) => setManagerNote(e.target.value)}
                            placeholder="Ví dụ: Nội dung vi phạm chính sách, hình ảnh không phù hợp, sai danh mục..."
                            className="rounded-2xl bg-rose-50/50 border border-rose-100 focus-visible:ring-2 focus-visible:ring-rose-500/20 resize-none font-medium h-32"
                            required
                        />
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <Button variant="ghost" className="rounded-2xl font-bold" onClick={() => setRejectDialogOpen(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-12 font-black flex-1 shadow-lg shadow-rose-600/20"
                        >
                            {actionLoading ? "Đang xử lý..." : "Gửi thông báo Từ chối"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

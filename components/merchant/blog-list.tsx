"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { blogAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import BlogCreateModal from "./blog-create-modal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Send, Eye } from "lucide-react";
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

export default function BlogList() {
    const router = useRouter();
    const { toast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);

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

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            DRAFT: { label: "Bản nháp", className: "bg-gray-100 text-gray-700 border-gray-200" },
            PENDING: { label: "Chờ duyệt", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
            PUBLISHED: { label: "Đã đăng", className: "bg-green-50 text-green-700 border-green-200" },
            REJECTED: { label: "Từ chối", className: "bg-red-50 text-red-700 border-red-200" },
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    return (
        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Bài viết của tôi</CardTitle>
                    <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 rounded-xl">
                        Tạo bài viết mới
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><span className="animate-pulse">Đang tải...</span></div>
                ) : posts.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">Chưa có bài viết nào</p>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-muted-foreground">TIÊU ĐỀ</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">DANH MỤC</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">TRẠNG THÁI</TableHead>
                                <TableHead className="text-center font-semibold text-muted-foreground">LƯỢT XEM</TableHead>
                                <TableHead className="text-center font-semibold text-muted-foreground">TƯƠNG TÁC</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">NGÀY TẠO</TableHead>
                                <TableHead className="text-right font-semibold text-muted-foreground">THAO TÁC</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.map((post) => (
                                <TableRow key={post._id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium text-foreground py-4 max-w-xs">
                                        <p className="truncate" title={post.title}>{post.title}</p>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="outline" className="bg-background/50 font-normal">{post.category || "General"}</Badge>
                                    </TableCell>
                                    <TableCell className="py-4">{getStatusBadge(post.status)}</TableCell>
                                    <TableCell className="text-center py-4 text-muted-foreground">{post.view_count || 0}</TableCell>
                                    <TableCell className="text-center py-4">
                                        <span className="text-green-600">{post.like_count || 0}</span> / <span className="text-red-500">{post.dislike_count || 0}</span>
                                    </TableCell>
                                    <TableCell className="py-4 text-muted-foreground">{formatDate(post.created_at)}</TableCell>
                                    <TableCell className="text-right py-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                {post.status === "PUBLISHED" && (
                                                    <DropdownMenuItem onClick={() => router.push(`/blog/${post._id}`)} className="rounded-lg cursor-pointer">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Xem
                                                    </DropdownMenuItem>
                                                )}
                                                {post.status === "DRAFT" && (
                                                    <DropdownMenuItem onClick={() => handleSubmit(post._id)} className="rounded-lg cursor-pointer">
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Gửi duyệt
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleEdit(post)} className="rounded-lg cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setPostToDelete(post._id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-red-600 rounded-lg cursor-pointer focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Xóa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

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
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                Xóa
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

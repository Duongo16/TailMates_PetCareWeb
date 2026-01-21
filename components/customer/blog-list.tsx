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
        const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            DRAFT: { label: "Bản nháp", variant: "secondary" },
            PENDING: { label: "Chờ duyệt", variant: "default" },
            PUBLISHED: { label: "Đã đăng", variant: "outline" },
            REJECTED: { label: "Từ chối", variant: "destructive" },
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Bài viết của tôi</CardTitle>
                    <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600">
                        Tạo bài viết mới
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-center py-8 text-gray-500">Đang tải...</p>
                ) : posts.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">Chưa có bài viết nào</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Danh mục</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-center">Lượt xem</TableHead>
                                <TableHead className="text-center">Like/Dislike</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.map((post) => (
                                <TableRow key={post._id}>
                                    <TableCell className="font-medium max-w-xs truncate">
                                        {post.title}
                                    </TableCell>
                                    <TableCell>{post.category}</TableCell>
                                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                                    <TableCell className="text-center">{post.view_count || 0}</TableCell>
                                    <TableCell className="text-center">
                                        {post.like_count || 0} / {post.dislike_count || 0}
                                    </TableCell>
                                    <TableCell>{formatDate(post.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {post.status === "PUBLISHED" && (
                                                    <DropdownMenuItem onClick={() => router.push(`/blog/${post._id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Xem
                                                    </DropdownMenuItem>
                                                )}
                                                {post.status === "DRAFT" && (
                                                    <DropdownMenuItem onClick={() => handleSubmit(post._id)}>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Gửi duyệt
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleEdit(post)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setPostToDelete(post._id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-red-600"
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

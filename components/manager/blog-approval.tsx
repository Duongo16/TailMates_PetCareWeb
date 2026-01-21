"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { managerBlogAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { CheckCircle, XCircle, Eye } from "lucide-react";
import Image from "next/image";

export default function BlogApproval() {
    const { toast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState("PENDING");
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [managerNote, setManagerNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [currentTab]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await managerBlogAPI.list({ status: currentTab });
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
                <CardTitle>Quản lý Blog</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={currentTab} onValueChange={setCurrentTab}>
                    <TabsList>
                        <TabsTrigger value="PENDING">Chờ duyệt</TabsTrigger>
                        <TabsTrigger value="PUBLISHED">Đã duyệt</TabsTrigger>
                        <TabsTrigger value="REJECTED">Đã từ chối</TabsTrigger>
                        <TabsTrigger value="ALL">Tất cả</TabsTrigger>
                    </TabsList>

                    <TabsContent value={currentTab} className="mt-4">
                        {loading ? (
                            <p className="text-center py-8 text-gray-500">Đang tải...</p>
                        ) : posts.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">Không có bài viết nào</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Tiêu đề</TableHead>
                                        <TableHead>Tác giả</TableHead>
                                        <TableHead>Danh mục</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {posts.map((post) => (
                                        <TableRow key={post._id}>
                                            <TableCell>
                                                {post.featured_image?.url && (
                                                    <div className="relative w-10 h-10 rounded overflow-hidden">
                                                        <Image
                                                            src={post.featured_image.url}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium max-w-sm truncate">
                                                {post.title}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{post.author_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {post.author_id?.email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{post.category}</TableCell>
                                            <TableCell>{getStatusBadge(post.status)}</TableCell>
                                            <TableCell>{formatDate(post.created_at)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedPost(post);
                                                        setViewDialogOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {post.status === "PENDING" && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPost(post);
                                                                setApproveDialogOpen(true);
                                                            }}
                                                            className="text-green-600 hover:text-green-700"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPost(post);
                                                                setRejectDialogOpen(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>

                {/* View Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedPost?.title}</DialogTitle>
                        </DialogHeader>
                        {selectedPost && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <Label>Tác giả</Label>
                                        <p>{selectedPost.author_name}</p>
                                    </div>
                                    <div>
                                        <Label>Danh mục</Label>
                                        <p>{selectedPost.category}</p>
                                    </div>
                                    <div>
                                        <Label>Trạng thái</Label>
                                        <div className="mt-1">{getStatusBadge(selectedPost.status)}</div>
                                    </div>
                                    <div>
                                        <Label>Ngày tạo</Label>
                                        <p>{formatDate(selectedPost.created_at)}</p>
                                    </div>
                                </div>

                                {selectedPost.featured_image?.url && (
                                    <div>
                                        <Label>Ảnh đại diện</Label>
                                        <div className="relative w-full h-64 mt-2 rounded overflow-hidden">
                                            <Image
                                                src={selectedPost.featured_image.url}
                                                alt={selectedPost.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Tóm tắt</Label>
                                    <p className="mt-1 text-sm">{selectedPost.excerpt}</p>
                                </div>

                                <div>
                                    <Label>Nội dung</Label>
                                    <div
                                        className="mt-2 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                                    />
                                </div>

                                {selectedPost.manager_note && (
                                    <div className="p-4 bg-gray-100 rounded">
                                        <Label>Ghi chú từ quản lý</Label>
                                        <p className="mt-1 text-sm">{selectedPost.manager_note}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Approve Dialog */}
                <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Duyệt bài viết</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc chắn muốn duyệt bài viết "{selectedPost?.title}"?
                            </DialogDescription>
                        </DialogHeader>
                        <div>
                            <Label htmlFor="approve-note">Ghi chú (tùy chọn)</Label>
                            <Textarea
                                id="approve-note"
                                value={managerNote}
                                onChange={(e) => setManagerNote(e.target.value)}
                                placeholder="Nhập ghi chú (nếu có)"
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Duyệt bài viết
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Từ chối bài viết</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc chắn muốn từ chối bài viết "{selectedPost?.title}"?
                            </DialogDescription>
                        </DialogHeader>
                        <div>
                            <Label htmlFor="reject-note">Lý do từ chối *</Label>
                            <Textarea
                                id="reject-note"
                                value={managerNote}
                                onChange={(e) => setManagerNote(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                rows={4}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Từ chối bài viết
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

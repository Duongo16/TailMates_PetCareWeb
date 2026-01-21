"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { blogAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface BlogModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    post?: any;
}

const BLOG_CATEGORIES = [
    "Hướng Dẫn Sử Dụng",
    "Kinh nghiệm nuôi Chó",
    "Kinh nghiệm nuôi Mèo",
    "Kinh nghiệm nuôi Pet",
    "Tin Tức Thú Cưng",
    "Uncategorized",
];

export default function BlogCreateModal({ open, onClose, onSuccess, post }: BlogModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        excerpt: "",
        category: "",
        tags: "",
        featured_image: null as any,
    });

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title || "",
                content: post.content || "",
                excerpt: post.excerpt || "",
                category: post.category || "",
                tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
                featured_image: post.featured_image || null,
            });
        } else {
            resetForm();
        }
    }, [post, open]);

    const resetForm = () => {
        setFormData({
            title: "",
            content: "",
            excerpt: "",
            category: "",
            tags: "",
            featured_image: null,
        });
    };

    const handleSubmit = async (saveAsDraft: boolean = false) => {
        if (!formData.title || !formData.content || !formData.category) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng điền đầy đủ tiêu đề, nội dung và danh mục",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);

            const data = {
                title: formData.title,
                content: formData.content,
                excerpt: formData.excerpt || undefined,
                category: formData.category,
                tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
                featured_image: formData.featured_image || undefined,
                status: saveAsDraft ? "DRAFT" : "PENDING",
            };

            let response;
            if (post) {
                // Update existing post
                response = await blogAPI.update(post._id, data);
            } else {
                // Create new post
                response = await blogAPI.create(data);
            }

            if (response.success) {
                toast({
                    title: "Thành công",
                    description: post
                        ? "Cập nhật bài viết thành công"
                        : saveAsDraft
                            ? "Lưu bản nháp thành công"
                            : "Gửi bài viết chờ duyệt thành công",
                });
                resetForm();
                onSuccess();
                onClose();
            } else {
                toast({
                    title: "Lỗi",
                    description: response.message || "Không thể lưu bài viết",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to save blog post:", error);
            toast({
                title: "Lỗi",
                description: "Không thể lưu bài viết",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{post ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Title */}
                    <div>
                        <Label htmlFor="title">Tiêu đề *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Nhập tiêu đề bài viết"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <Label htmlFor="category">Danh mục *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                                {BLOG_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Featured Image */}
                    <div>
                        <Label>Ảnh đại diện</Label>
                        <ImageUpload
                            value={formData.featured_image}
                            onChange={(image) => setFormData({ ...formData, featured_image: image })}
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <Label htmlFor="content">Nội dung *</Label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(html) => setFormData({ ...formData, content: html })}
                            placeholder="Nhập nội dung bài viết..."
                        />
                    </div>

                    {/* Excerpt */}
                    <div>
                        <Label htmlFor="excerpt">Tóm tắt (tùy chọn)</Label>
                        <Textarea
                            id="excerpt"
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            placeholder="Tóm tắt ngắn về bài viết (tự động tạo nếu bỏ trống)"
                            rows={3}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <Label htmlFor="tags">Tags (tùy chọn)</Label>
                        <Input
                            id="tags"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="Nhập tags, phân cách bởi dấu phẩy"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ví dụ: chó, chăm sóc, dinh dưỡng</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="outline" onClick={() => handleSubmit(true)} disabled={loading}>
                        Lưu bản nháp
                    </Button>
                    <Button onClick={() => handleSubmit(false)} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                        {post ? "Cập nhật" : "Gửi duyệt"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

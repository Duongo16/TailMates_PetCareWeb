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
import { 
    Layout, 
    Type, 
    FileText, 
    Tag, 
    Image as ImageIcon, 
    Send, 
    Save, 
    X, 
    Sparkles,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

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
                response = await blogAPI.update(post._id, data);
            } else {
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
            <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col rounded-3xl overflow-hidden border-none shadow-2xl">
                {/* Custom Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 flex items-center justify-between border-b border-primary/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                {post ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                            </DialogTitle>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Chia sẻ kiến thức bổ ích tới cộng đồng</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-black/5">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Title & Editor Area */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-bold flex items-center gap-2 mb-2">
                                    <Type className="w-4 h-4 text-primary" /> Tiêu đề bài viết
                                </Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="VD: 5 cách giúp chó của bạn luôn vui vẻ..."
                                    className="h-12 text-lg font-semibold rounded-xl border-border/50 bg-secondary/20 ring-0 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content" className="text-sm font-bold flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-primary" /> Nội dung bài viết
                                </Label>
                                <div className="rounded-2xl border border-border/50 overflow-hidden bg-card min-h-[400px]">
                                    <RichTextEditor
                                        value={formData.content}
                                        onChange={(html) => setFormData({ ...formData, content: html })}
                                        placeholder="Bắt đầu viết nội dung tại đây..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Options Area */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Featured Image Block */}
                            <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 space-y-3">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-primary" /> Ảnh đại diện (Featured)
                                </Label>
                                <ImageUpload
                                    value={formData.featured_image}
                                    onChange={(image) => setFormData({ ...formData, featured_image: image })}
                                />
                                <p className="text-[10px] text-muted-foreground text-center">Tỉ lệ khuyến nghị 16:9, tối đa 2MB</p>
                            </div>

                            {/* Settings Block */}
                            <div className="space-y-4 bg-card p-4 rounded-2xl border border-border/50">
                                <div>
                                    <Label htmlFor="category" className="text-sm font-bold flex items-center gap-2 mb-2">
                                        <Layout className="w-4 h-4 text-primary" /> Danh mục
                                    </Label>
                                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                        <SelectTrigger className="rounded-xl h-10 border-border/50 ring-0 focus:ring-primary/20">
                                            <SelectValue placeholder="Chọn một danh mục" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-border/50">
                                            {BLOG_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="tags" className="text-sm font-bold flex items-center gap-2 mb-2">
                                        <Tag className="w-4 h-4 text-primary" /> Thẻ (Tags)
                                    </Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="chó, mèo, dinh dưỡng..."
                                        className="h-10 rounded-xl border-border/50 ring-0 focus-visible:ring-primary/20 transition-all"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="excerpt" className="text-sm font-bold flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-primary" /> Tóm tắt bài viết
                                    </Label>
                                    <Textarea
                                        id="excerpt"
                                        value={formData.excerpt}
                                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                        placeholder="Giới thiệu ngắn gọn gây ấn tượng cho người đọc..."
                                        className="rounded-xl border-border/50 min-h-[100px] resize-none text-sm ring-0 focus-visible:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-card px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 shrink-0">
                    <p className="text-[11px] text-muted-foreground italic sm:max-w-[200px]">
                        Hãy kiểm tra kỹ thông tin trước khi gửi duyệt bài nhé!
                    </p>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="ghost" className="flex-1 sm:flex-none h-11 rounded-xl px-6 font-semibold text-muted-foreground hover:bg-black/5" onClick={onClose} disabled={loading}>
                            Hủy bỏ
                        </Button>
                        <Button variant="outline" className="flex-1 sm:flex-none h-11 rounded-xl px-6 font-semibold border-primary/20 text-primary hover:bg-primary/5 transition-all" onClick={() => handleSubmit(true)} disabled={loading}>
                            <Save className="w-4 h-4 mr-2" />
                            Lưu nháp
                        </Button>
                        <Button className="flex-1 sm:flex-none h-11 rounded-xl px-8 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all" onClick={() => handleSubmit(false)} disabled={loading}>
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    {post ? "Cập nhật ngay" : "Gửi duyệt ngay"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface TermsDocument {
    _id: string;
    title: string;
    content: string;
    version: string;
    type: "terms" | "privacy";
    is_active: boolean;
}

interface TermsFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    document?: TermsDocument | null;
}

export function TermsFormModal({
    isOpen,
    onClose,
    document,
}: TermsFormModalProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [version, setVersion] = useState("");
    const [type, setType] = useState<"terms" | "privacy">("terms");
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (document) {
            setTitle(document.title);
            setContent(document.content);
            setVersion(document.version);
            setType(document.type);
            setIsActive(document.is_active);
        } else {
            setTitle("");
            setContent("");
            setVersion("1.0");
            setType("terms");
            setIsActive(false);
        }
        setError("");
    }, [document, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("tailmates_token");
            const url = document
                ? `/api/v1/admin/terms-policies/${document._id}`
                : "/api/v1/admin/terms-policies";

            const response = await fetch(url, {
                method: document ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                    version,
                    type,
                    is_active: isActive,
                }),
            });

            const data = await response.json();

            if (data.success) {
                onClose();
            } else {
                setError(data.message || "Có lỗi xảy ra");
            }
        } catch (err) {
            setError("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {document ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Tiêu đề *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="VD: Điều khoản sử dụng"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="version">Phiên bản *</Label>
                            <Input
                                id="version"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="VD: 1.0"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Loại *</Label>
                            <Select value={type} onValueChange={(value: "terms" | "privacy") => setType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="terms">Điều khoản sử dụng</SelectItem>
                                    <SelectItem value="privacy">Chính sách bảo mật</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="is_active">Trạng thái</Label>
                            <div className="flex items-center gap-3 h-10">
                                <Switch
                                    id="is_active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {isActive ? "Đang hoạt động" : "Không hoạt động"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Nội dung *</Label>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Nhập nội dung điều khoản hoặc chính sách..."
                            className="min-h-[300px]"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Đang lưu..." : document ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

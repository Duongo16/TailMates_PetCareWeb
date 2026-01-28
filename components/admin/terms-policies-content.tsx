"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { TermsFormModal } from "@/components/admin/terms-policies-form-modal";
import { TermsViewerModal } from "@/components/ui/terms-viewer-modal";
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

interface TermsDocument {
    _id: string;
    title: string;
    content: string;
    version: string;
    type: "terms" | "privacy";
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export function TermsPoliciesContent() {
    const [documents, setDocuments] = useState<TermsDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<TermsDocument | null>(null);
    const [editingDocument, setEditingDocument] = useState<TermsDocument | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem("tailmates_token");
            const response = await fetch("/api/v1/admin/terms-policies", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setDocuments(data.data.documents);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const token = localStorage.getItem("tailmates_token");
            const response = await fetch(`/api/v1/admin/terms-policies/${deleteId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                await fetchDocuments();
                setShowDeleteDialog(false);
                setDeleteId(null);
            }
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    };

    const handleEdit = (doc: TermsDocument) => {
        setEditingDocument(doc);
        setShowFormModal(true);
    };

    const handleView = (doc: TermsDocument) => {
        setSelectedDocument(doc);
        setShowViewModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setEditingDocument(null);
        fetchDocuments();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quản lý Điều khoản & Chính sách</h1>
                    <p className="text-foreground/60 mt-1">
                        Tạo và quản lý điều khoản sử dụng và chính sách bảo mật
                    </p>
                </div>
                <Button onClick={() => setShowFormModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm mới
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Phiên bản</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Cập nhật</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        Chưa có tài liệu nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => (
                                    <TableRow key={doc._id}>
                                        <TableCell className="font-medium">{doc.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={doc.type === "terms" ? "default" : "secondary"}>
                                                {doc.type === "terms" ? "Điều khoản" : "Chính sách"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{doc.version}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={doc.is_active ? "default" : "outline"}
                                                className={doc.is_active ? "bg-green-100 text-green-600" : ""}
                                            >
                                                {doc.is_active ? "Đang hoạt động" : "Không hoạt động"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(doc.updated_at).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleView(doc)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(doc)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setDeleteId(doc._id);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Form Modal */}
            <TermsFormModal
                isOpen={showFormModal}
                onClose={handleFormClose}
                document={editingDocument}
            />

            {/* View Modal */}
            {selectedDocument && (
                <TermsViewerModal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedDocument(null);
                    }}
                    title={selectedDocument.title}
                    content={selectedDocument.content}
                    version={selectedDocument.version}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

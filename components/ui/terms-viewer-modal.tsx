"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    version?: string;
}

export function TermsViewerModal({
    isOpen,
    onClose,
    title,
    content,
    version,
}: TermsViewerModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {title}
                        {version && (
                            <span className="text-sm text-muted-foreground ml-2">
                                (Phiên bản {version})
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Vui lòng đọc kỹ nội dung dưới đây
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </ScrollArea>

                <DialogFooter>
                    <Button onClick={onClose}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

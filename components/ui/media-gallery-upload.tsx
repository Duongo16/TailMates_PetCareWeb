import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, X, GripVertical, Image as ImageIcon, Video, Link as LinkIcon, Globe } from "lucide-react"
import Image from "next/image"
import { Reorder, useDragControls } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export interface MediaItem {
    url: string
    public_id?: string
    type?: "image" | "video"
}

interface MediaGalleryUploadProps {
    value: MediaItem[]
    onChange: (items: MediaItem[]) => void
    maxItems?: number
}

export function MediaGalleryUpload({ value = [], onChange, maxItems = 10 }: MediaGalleryUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")
    const [linkType, setLinkType] = useState<"image" | "video">("image")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadToCloudinary = async (file: File) => {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default")

            const isVideo = file.type.startsWith("video")
            const resourceType = isVideo ? "video" : "image"

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            )

            if (!response.ok) throw new Error("Upload failed")

            const data = await response.json()
            const newItem: MediaItem = {
                url: data.secure_url,
                public_id: data.public_id,
                type: resourceType
            }
            onChange([...value, newItem])
        } catch (err) {
            console.error("Upload error:", err)
        } finally {
            setIsUploading(false)
        }
    }

    const handleAddByLink = () => {
        if (!linkUrl.trim()) return

        const newItem: MediaItem = {
            url: linkUrl.trim(),
            type: linkType
        }
        onChange([...value, newItem])
        setLinkUrl("")
        setShowLinkInput(false)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const remainingSlots = maxItems - value.length
        const filesToUpload = files.slice(0, remainingSlots)

        filesToUpload.forEach(file => uploadToCloudinary(file))

        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removeItem = (index: number) => {
        const newItems = [...value]
        newItems.splice(index, 1)
        onChange(newItems)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground/70">
                    Thư viện Media ({value.length}/{maxItems})
                </p>
                <div className="flex gap-2">
                    <Dialog open={showLinkInput} onOpenChange={setShowLinkInput}>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl h-8"
                            >
                                <LinkIcon className="w-4 h-4 mr-1" />
                                Thêm link
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Thêm bằng Link</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                                    <Button
                                        size="sm"
                                        variant={linkType === "image" ? "default" : "ghost"}
                                        className="flex-1 rounded-lg"
                                        onClick={() => setLinkType("image")}
                                    >
                                        Hình ảnh
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={linkType === "video" ? "default" : "ghost"}
                                        className="flex-1 rounded-lg"
                                        onClick={() => setLinkType("video")}
                                    >
                                        Video
                                    </Button>
                                </div>
                                <Input
                                    placeholder="Dán link ảnh hoặc video tại đây..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="rounded-xl h-12"
                                />
                                <Button className="w-full rounded-xl h-12" onClick={handleAddByLink}>
                                    Xác nhận thêm
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {value.length < maxItems && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl h-8 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Tải lên
                        </Button>
                    )}
                </div>
            </div>

            <div className={`overflow-y-auto pr-1 -mr-1 transition-all ${value.length >= 3 ? 'max-h-[150px]' : ''}`}>
                <Reorder.Group
                    axis="y"
                    values={value}
                    onReorder={onChange}
                    className="space-y-2"
                >
                    {value.map((item, index) => (
                        <ReorderItem
                            key={item.public_id || item.url}
                            item={item}
                            onRemove={() => removeItem(index)}
                            isFirst={index === 0}
                        />
                    ))}
                </Reorder.Group>
            </div>

            {value.length === 0 && !isUploading && (
                <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Globe className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Chưa có nội dung. Tải lên hoặc thêm link.</p>
                </div>
            )}

            {isUploading && (
                <div className="flex items-center justify-center py-4 bg-primary/5 rounded-xl border border-dashed border-primary/20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                    <span className="text-sm text-primary font-medium">Đang xử lý media...</span>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            <p className="text-[10px] text-foreground/50 italic">
                * Mục đầu tiên sẽ là hiển thị chính. Hỗ trợ ảnh (jpg, png) và video (mp4).
            </p>
        </div>
    )
}

function ReorderItem({ item, onRemove, isFirst }: { item: MediaItem, onRemove: () => void, isFirst: boolean }) {
    const dragControls = useDragControls()
    const isVideo = item.type === "video"

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={dragControls}
            className="flex items-center gap-3 p-2 bg-card border rounded-xl shadow-sm relative group hover:border-primary/50 transition-colors"
        >
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-grab active:cursor-grabbing p-1 text-foreground/30 hover:text-foreground/60 transition-colors"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                {isVideo ? (
                    <div className="w-full h-full relative">
                        <video src={item.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Video className="w-6 h-6 text-white shadow-xl" />
                        </div>
                    </div>
                ) : (
                    <Image src={item.url} alt="Gallery item" fill className="object-cover" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    {isFirst && <Badge className="h-4 px-1 text-[8px] bg-primary">CHÍNH</Badge>}
                    <p className="text-xs font-bold truncate">
                        {isVideo ? "Video" : "Hình ảnh"} {item.public_id ? item.public_id.split('/').pop() : "từ link"}
                    </p>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{item.url}</p>
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </Button>
        </Reorder.Item>
    )
}

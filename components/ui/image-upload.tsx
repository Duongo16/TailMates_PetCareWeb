"use client"

import { useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
    value?: { url: string; public_id?: string } | string | null
    onChange: (image: { url: string; public_id?: string } | null) => void
    label?: string
    required?: boolean
    className?: string
}

export function ImageUpload({ value, onChange, label, required, className = "" }: ImageUploadProps) {
    const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("upload")
    const [isUploading, setIsUploading] = useState(false)
    const [urlInput, setUrlInput] = useState("")
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadToCloudinary = async (file: File) => {
        setIsUploading(true)
        setError(null)

        try {
            // Validate file type
            const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
            if (!validTypes.includes(file.type)) {
                throw new Error("Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF, WEBP")
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error("Kích thước file quá lớn. Tối đa 5MB")
            }

            const formData = new FormData()
            formData.append("file", file)
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default")

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
            if (!cloudName) {
                throw new Error("Cloudinary chưa được cấu hình")
            }

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            )

            if (!response.ok) {
                throw new Error("Không thể tải ảnh lên. Vui lòng thử lại")
            }

            const data = await response.json()
            onChange({ url: data.secure_url, public_id: data.public_id })
        } catch (err: any) {
            setError(err.message || "Lỗi khi tải ảnh lên")
            console.error("Upload error:", err)
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            uploadToCloudinary(file)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) {
            uploadToCloudinary(file)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleUrlSubmit = () => {
        setError(null)

        // Basic URL validation
        if (!urlInput) {
            setError("Vui lòng nhập URL")
            return
        }

        try {
            new URL(urlInput)
            onChange({ url: urlInput })
        } catch {
            setError("URL không hợp lệ")
        }
    }

    const handleRemove = () => {
        onChange(null)
        setUrlInput("")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className={className}>
            {label && (
                <Label className="text-sm font-medium mb-2 block">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}

            <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "upload" | "url")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Tải lên
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        URL
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-0">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-secondary/20"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm text-foreground/60">Đang tải lên...</p>
                            </div>
                        ) : value ? (
                            <div className="space-y-3">
                                <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden bg-secondary">
                                    <Image src={typeof value === 'string' ? value : value.url} alt="Preview" fill className="object-cover" />
                                </div>
                                <p className="text-sm text-foreground/60">Click để thay đổi ảnh</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Kéo thả ảnh vào đây hoặc click để chọn
                                    </p>
                                    <p className="text-xs text-foreground/60 mt-1">
                                        JPG, PNG, GIF, WEBP (tối đa 5MB)
                                    </p>
                                </div>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="url" className="mt-0 space-y-3">
                    <div className="flex gap-2">
                        <Input
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="rounded-xl"
                            onKeyPress={(e) => e.key === "Enter" && handleUrlSubmit()}
                        />
                        <Button onClick={handleUrlSubmit} className="rounded-xl">
                            Áp dụng
                        </Button>
                    </div>
                    {value && uploadMethod === "url" && (
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-secondary">
                            <Image src={typeof value === 'string' ? value : value.url} alt="Preview" fill className="object-cover" />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Error Message */}
            {error && (
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Remove Button */}
            {value && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    className="mt-3 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                    <X className="w-4 h-4 mr-2" />
                    Xóa ảnh
                </Button>
            )}
        </div>
    )
}

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus, Cat, Heart } from "lucide-react"
import { useRouter } from "next/navigation"

interface AuthPromptModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string
}

export function AuthPromptModal({
    open,
    onOpenChange,
    title = "Oops! Bạn chưa đăng nhập",
    description = "Đăng nhập để thả tim và lưu lại những bài viết yêu thích nhé! 🐾"
}: AuthPromptModalProps) {
    const router = useRouter()

    const handleLogin = () => {
        onOpenChange(false)
        router.push("/login")
    }

    const handleRegister = () => {
        onOpenChange(false)
        router.push("/register")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl max-w-sm text-center border-none shadow-xl bg-white/95 backdrop-blur-sm">
                <DialogHeader className="items-center pt-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-4 animate-bounce-slow">
                            <Cat className="w-10 h-10 text-pink-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-bold text-navy">{title}</DialogTitle>
                    <DialogDescription className="text-foreground/70 text-base mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-6 pb-2">
                    <Button
                        onClick={handleLogin}
                        className="w-full rounded-2xl h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Đăng nhập ngay
                    </Button>
                    <Button
                        onClick={handleRegister}
                        variant="ghost"
                        className="w-full rounded-2xl h-12 text-base bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700 transition-all"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Tạo tài khoản mới
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

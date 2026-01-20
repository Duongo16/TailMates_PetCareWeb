"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus, Lock } from "lucide-react"
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
    title = "Đăng nhập để tiếp tục",
    description = "Bạn cần đăng nhập hoặc đăng ký để sử dụng tính năng này."
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
            <DialogContent className="rounded-3xl max-w-sm text-center">
                <DialogHeader className="items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <DialogDescription className="text-foreground/60">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-4">
                    <Button onClick={handleLogin} className="w-full rounded-xl h-11">
                        <LogIn className="w-4 h-4 mr-2" />
                        Đăng nhập
                    </Button>
                    <Button onClick={handleRegister} variant="outline" className="w-full rounded-xl h-11 bg-transparent">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Đăng ký tài khoản
                    </Button>
                </div>
                <p className="text-xs text-foreground/50 mt-2">
                    Đăng nhập miễn phí để trải nghiệm đầy đủ TailMates
                </p>
            </DialogContent>
        </Dialog>
    )
}

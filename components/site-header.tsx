"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Menu, X, LogOut, Settings, LayoutDashboard, ShoppingCart, Bell, Coins, Clock, Users, PawPrint } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useNotifications } from "@/lib/hooks"
import { UserBalance } from "@/components/user-balance"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

interface SiteHeaderProps {
    showBlogLink?: boolean
}

export function SiteHeader({ showBlogLink = true }: SiteHeaderProps) {
    const { user, logout } = useAuth()
    const { totalItems } = useCart()
    const { unreadCount } = useNotifications()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "customer":
                return "Khách hàng"
            case "merchant":
                return "Đối tác"
            case "manager":
                return "Quản lý"
            case "admin":
                return "Admin"
            default:
                return role
        }
    }

    if (user) {
        return <DashboardHeader isExternal />
    }

    return (
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/images/logo-ngang.png" alt="TailMates" width={120} height={40} className="sm:h-16 h-8 w-auto" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <a
                            href="/#features"
                            className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                        >
                            Tính năng
                        </a>
                        <a
                            href="/#how-it-works"
                            className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                        >
                            Cách hoạt động
                        </a>
                        <a
                            href="/#testimonials"
                            className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                        >
                            Đánh giá
                        </a>
                        <Link
                            href="/merchants"
                            className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                        >
                            Đối tác
                        </Link>
                        {showBlogLink && (
                            <Link
                                href="/blog"
                                className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm"
                            >
                                Blog
                            </Link>
                        )}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" className="font-medium rounded-xl">
                                Đăng nhập
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                                Đăng ký miễn phí
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-card border-t border-border animate-in slide-in-from-top-2">
                    <div className="px-4 py-4 space-y-4">
                        <a href="/#features" className="block text-foreground/70 hover:text-foreground font-medium">
                            Tính năng
                        </a>
                        <a href="/#how-it-works" className="block text-foreground/70 hover:text-foreground font-medium">
                            Cách hoạt động
                        </a>
                        <a href="/#testimonials" className="block text-foreground/70 hover:text-foreground font-medium">
                            Đánh giá
                        </a>
                        <Link href="/merchants" className="block text-foreground/70 hover:text-foreground font-medium">
                            Đối tác
                        </Link>
                        {showBlogLink && (
                            <Link href="/blog" className="block text-foreground/70 hover:text-foreground font-medium">
                                Blog
                            </Link>
                        )}
                        <div className="flex flex-col gap-2 pt-4 border-t border-border">
                            <Link href="/login">
                                <Button variant="outline" className="w-full bg-transparent rounded-xl">
                                    Đăng nhập
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                                    Đăng ký miễn phí
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

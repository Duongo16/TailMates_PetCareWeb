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
import { Menu, X, LogOut, Settings, LayoutDashboard, ShoppingCart, Bell, Coins, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { UserBalance } from "@/components/user-balance"

interface SiteHeaderProps {
    showBlogLink?: boolean
}

export function SiteHeader({ showBlogLink = true }: SiteHeaderProps) {
    const { user, logout } = useAuth()
    const { totalItems } = useCart()
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

                    {/* Right Section - Conditional based on Auth */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                {/* Shopping Cart - Only for customers */}
                                {user.role === "customer" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative"
                                        onClick={() => router.push("/dashboard/customer")}
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        {totalItems > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                {totalItems}
                                            </span>
                                        )}
                                    </Button>
                                )}

                                {/* User Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-secondary transition-colors">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {user?.name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="hidden sm:block text-left">
                                                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                                                <p className="text-xs text-foreground/60">{getRoleLabel(user?.role || "")}</p>
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <div className="px-3 py-2">
                                            <p className="font-medium">{user?.name}</p>
                                            <p className="text-sm text-foreground/60">{user?.email}</p>
                                            {["customer", "merchant"].includes(user.role) && (
                                                <div className="mt-2 sm:hidden">
                                                    <UserBalance showAdd={false} />
                                                </div>
                                            )}
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${user.role}`)}>
                                            <LayoutDashboard className="w-4 h-4 mr-2" />
                                            Dashboard
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${user.role}?tab=settings`)}>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Cài đặt
                                        </DropdownMenuItem>
                                        {["customer", "merchant"].includes(user.role) && (
                                            <>
                                                <DropdownMenuItem onClick={() => router.push("/top-up")}>
                                                    <Coins className="w-4 h-4 mr-2 text-yellow-500" />
                                                    Nạp tiền TM
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push("/dashboard/transactions")}>
                                                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                    Lịch sử giao dịch
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Đăng xuất
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
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
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 px-4 py-2">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {user?.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{user?.name}</p>
                                            <p className="text-xs text-foreground/60">{getRoleLabel(user?.role || "")}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full bg-transparent rounded-xl justify-start"
                                        onClick={() => {
                                            router.push(`/dashboard/${user.role}`)
                                            setMobileMenuOpen(false)
                                        }}
                                    >
                                        <LayoutDashboard className="w-4 h-4 mr-2" />
                                        Dashboard
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full bg-transparent rounded-xl justify-start text-destructive hover:text-destructive"
                                        onClick={() => {
                                            handleLogout()
                                            setMobileMenuOpen(false)
                                        }}
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Đăng xuất
                                    </Button>
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

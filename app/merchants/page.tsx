"use client"

import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { MerchantCard } from "@/components/customer/merchant-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Filter, Stethoscope, Sparkles, Hotel, ShoppingBag, Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const CATEGORIES = [
    { id: "all", label: "Tất cả", icon: Filter },
    { id: "Thú y", label: "Thú y", icon: Stethoscope },
    { id: "Spa", label: "Spa", icon: Sparkles },
    { id: "Khách sạn", label: "Khách sạn", icon: Hotel },
    { id: "Cửa hàng", label: "Cửa hàng", icon: ShoppingBag },
    { id: "Đào tạo", label: "Huấn luyện", icon: Sparkles },
    { id: "Cứu hộ", label: "Cứu hộ", icon: Heart },
]

export default function MerchantsPage() {
    const [merchants, setMerchants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 })

    const fetchMerchants = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("page", pagination.page.toString())
            if (searchQuery) params.append("search", searchQuery)
            if (selectedCategory !== "all") params.append("category", selectedCategory)

            const res = await fetch(`/api/v1/merchants?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setMerchants(data.data.merchants)
                setPagination(data.data.pagination)
            }
        } catch (error) {
            console.error("Failed to fetch merchants:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMerchants()
    }, [pagination.page, selectedCategory])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination({ ...pagination, page: 1 })
        fetchMerchants()
    }

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Search & Categories Section */}
                <div className="flex flex-col items-center gap-12 mb-16">
                    {/* Category Icons */}
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon
                            const isActive = selectedCategory === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="flex flex-col items-center gap-3 group transition-all"
                                >
                                    <div className={cn(
                                        "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                                        isActive
                                            ? "bg-primary text-white scale-110 shadow-primary/30"
                                            : "bg-card text-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105"
                                    )}>
                                        <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold transition-colors",
                                        isActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
                                    )}>
                                        {cat.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeCategory"
                                            className="h-1 w-12 bg-primary rounded-full"
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="w-full max-w-2xl flex gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Tìm kiếm đối tác, địa chỉ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-14 pl-12 rounded-2xl border-border bg-card shadow-lg focus:border-primary transition-all text-lg"
                            />
                        </div>
                        <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                            Tìm kiếm
                        </Button>
                    </form>
                </div>

                {/* Listing Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-foreground">Dịch vụ thú cưng</h2>
                            <p className="text-foreground/60 mt-1">Tìm kiếm các dịch vụ chăm sóc thú cưng tốt nhất gần bạn</p>
                        </div>
                        {!loading && merchants.length > 0 && (
                            <p className="text-sm font-medium text-foreground/60">
                                Hiển thị {merchants.length} trong tổng số {pagination.total} đối tác
                            </p>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-foreground/60 font-medium">Đang tìm kiếm đối tác...</p>
                        </div>
                    ) : merchants.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                            {merchants.map((merchant) => (
                                <MerchantCard key={merchant._id} merchant={merchant} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card/50 border-2 border-dashed border-border rounded-3xl py-20 text-center">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Không tìm thấy đối tác nào</h3>
                            <p className="text-foreground/60 mt-2">Thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && pagination.total_pages > 1 && (
                        <div className="flex justify-center gap-2 pt-12">
                            {Array.from({ length: pagination.total_pages }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant={pagination.page === i + 1 ? "default" : "outline"}
                                    onClick={() => setPagination({ ...pagination, page: i + 1 })}
                                    className="w-10 h-10 rounded-xl font-bold"
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

import { Home, Package, Truck, Calendar, QrCode, Sparkles, Settings, FileText, Newspaper, BarChart3, Coins } from "lucide-react"

export type MerchantTab = "dashboard" | "products" | "services" | "orders" | "bookings" | "medical-records" | "blog" | "scanner" | "settings" | "analytics" | "transactions"

export const MERCHANT_TABS = [
    { id: "dashboard", label: "Tổng quan", icon: Home },
    { id: "products", label: "Sản phẩm", icon: Package },
    { id: "services", label: "Dịch vụ", icon: Sparkles },
    { id: "orders", label: "Đơn hàng", icon: Truck },
    { id: "bookings", label: "Lịch hẹn", icon: Calendar },
    { id: "medical-records", label: "Sổ Y Tế", icon: FileText },
    { id: "blog", label: "Blog", icon: Newspaper },
]

export const MERCHANT_CATEGORIES = [
    { id: "Thú y", label: "Thú y" },
    { id: "Spa", label: "Spa" },
    { id: "Khách sạn", label: "Khách sạn" },
    { id: "Cửa hàng", label: "Cửa hàng thú cưng" },
    { id: "Đào tạo", label: "Huấn luyện" },
    { id: "Cứu hộ", label: "Cứu hộ" },
]

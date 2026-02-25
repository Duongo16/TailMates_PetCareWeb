import { Home, Package, Truck, Calendar, QrCode, Sparkles, Settings, FileText, Newspaper, BarChart3, Coins, Crown } from "lucide-react"
import { type FeatureKey } from "@/hooks/use-feature-access"

export type MerchantTab = "dashboard" | "products" | "services" | "orders" | "bookings" | "medical-records" | "blog" | "scanner" | "settings" | "analytics" | "transactions" | "subscription"

export interface MerchantTabItem {
    id: MerchantTab
    label: string
    icon: any
    featureKey?: FeatureKey
}

export const MERCHANT_TABS: MerchantTabItem[] = [
    { id: "dashboard", label: "Tổng quan", icon: Home },
    { id: "products", label: "Sản phẩm", icon: Package },
    { id: "services", label: "Dịch vụ", icon: Sparkles },
    { id: "orders", label: "Đơn hàng", icon: Truck },
    { id: "bookings", label: "Lịch hẹn", icon: Calendar },
    { id: "medical-records", label: "Sổ Y Tế", icon: FileText },
    { id: "blog", label: "Blog", icon: Newspaper },
    { id: "scanner", label: "Máy Quét QR", icon: QrCode, featureKey: "qr_scanning" },
    { id: "analytics", label: "Thống kê", icon: BarChart3, featureKey: "advanced_analytics" },
    { id: "subscription", label: "Gói Merchant", icon: Crown },
]

export const MERCHANT_CATEGORIES = [
    { id: "Thú y", label: "Thú y" },
    { id: "Spa", label: "Spa" },
    { id: "Khách sạn", label: "Khách sạn" },
    { id: "Cửa hàng", label: "Cửa hàng thú cưng" },
    { id: "Đào tạo", label: "Huấn luyện" },
    { id: "Cứu hộ", label: "Cứu hộ" },
]

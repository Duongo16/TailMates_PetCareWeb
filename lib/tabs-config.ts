import { Home, Heart, Sparkles, ShoppingBag, Calendar, FileText, Newspaper, Crown, Settings, Package, Truck, QrCode, BarChart3, TrendingUp, Store, ImageIcon, Shield, Users, type LucideIcon } from "lucide-react"
import { type FeatureKey } from "@/hooks/use-feature-access"

export interface TabItem {
  id: string
  label: string
  icon: LucideIcon
  featureKey?: FeatureKey
  children?: TabItem[] // Sub-tabs for grouped display
}

export const CUSTOMER_TABS: TabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pets", label: "Thú cưng", icon: Heart },
  { id: "pawmatch", label: "PawMatch", icon: Sparkles, featureKey: "pawmate_connect" },
  { id: "services-group", label: "Dịch vụ", icon: ShoppingBag, children: [
    { id: "marketplace", label: "Cửa hàng", icon: ShoppingBag },
    { id: "booking", label: "Đặt lịch", icon: Calendar },
    { id: "medical", label: "Sổ y tế", icon: FileText },
  ]},
  { id: "subscription", label: "Nâng cấp", icon: Crown },
]

export const MERCHANT_TABS: TabItem[] = [
  { id: "dashboard", label: "Tổng quan", icon: Home },
  { id: "catalog-group", label: "Kinh doanh", icon: Package, children: [
    { id: "products", label: "Sản phẩm", icon: Package },
    { id: "services", label: "Dịch vụ", icon: Sparkles },
  ]},
  { id: "operations-group", label: "Quản lý", icon: Truck, children: [
    { id: "orders", label: "Đơn hàng", icon: Truck },
    { id: "bookings", label: "Lịch hẹn", icon: Calendar },
    { id: "medical-records", label: "Sổ Y Tế", icon: FileText },
  ]},
  { id: "scanner", label: "Máy Quét QR", icon: QrCode, featureKey: "qr_scanning" },
  { id: "analytics", label: "Thống kê", icon: BarChart3, featureKey: "advanced_analytics" },
  { id: "subscription", label: "Gói Merchant", icon: Crown },
]

export const MANAGER_TABS: TabItem[] = [
  { id: "dashboard", label: "Tổng quan", icon: Home },
  { id: "revenue", label: "Doanh thu", icon: TrendingUp },
  { id: "merchants", label: "Merchant", icon: Store },
  { id: "packages", label: "Gói đăng ký", icon: Package },
  { id: "content-group", label: "Nội dung", icon: Newspaper, children: [
    { id: "banners", label: "Banner", icon: ImageIcon },
    { id: "blog", label: "Quản lý Blog", icon: Newspaper },
  ]},
  { id: "settings", label: "Cài đặt", icon: Settings },
]

export const ADMIN_TABS: TabItem[] = [
  { id: "dashboard", label: "Tổng quan", icon: Home },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "settings", label: "Cài đặt", icon: Settings },
  { id: "security", label: "Bảo mật", icon: Shield },
]

export function getTabsByRole(role: string): TabItem[] {
  switch (role) {
    case "customer": return CUSTOMER_TABS
    case "merchant": return MERCHANT_TABS
    case "manager": return MANAGER_TABS
    case "admin": return ADMIN_TABS
    default: return []
  }
}

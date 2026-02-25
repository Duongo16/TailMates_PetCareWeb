import { Home, Heart, Sparkles, ShoppingBag, Calendar, FileText, Newspaper, Crown, Settings } from "lucide-react"
import { type FeatureKey } from "@/hooks/use-feature-access"

export type CustomerTab = "dashboard" | "pets" | "pawmatch" | "medical" | "marketplace" | "booking" | "orders" | "blog" | "subscription" | "settings"

export interface CustomerTabItem {
  id: CustomerTab
  label: string
  icon: any
  featureKey?: FeatureKey
}

export const CUSTOMER_TABS: CustomerTabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pets", label: "Thú cưng", icon: Heart },
  { id: "pawmatch", label: "PawMatch", icon: Sparkles, featureKey: "pawmate_connect" },
  { id: "marketplace", label: "Cửa hàng", icon: ShoppingBag },
  { id: "booking", label: "Đặt lịch", icon: Calendar },
  { id: "medical", label: "Sổ y tế", icon: FileText },
  { id: "blog", label: "Blog", icon: Newspaper, featureKey: "blog_posting" },
  { id: "subscription", label: "Nâng cấp", icon: Crown },
  { id: "settings", label: "Cài đặt", icon: Settings },
]

import { Home, PawPrint, FileText, ShoppingBag, Calendar, Newspaper, Crown, Sparkles } from "lucide-react"

export type CustomerTab = "dashboard" | "pets" | "pawmatch" | "medical" | "marketplace" | "booking" | "orders" | "blog" | "subscription" | "settings" | "transactions"

export const CUSTOMER_TABS = [
  { id: "dashboard", label: "Trang chủ", icon: Home },
  { id: "pets", label: "Thú cưng", icon: PawPrint },
  { id: "pawmatch", label: "PawMatch", icon: Sparkles },
  { id: "marketplace", label: "Mua sắm", icon: ShoppingBag },
  { id: "booking", label: "Đặt lịch", icon: Calendar },
  { id: "medical", label: "Sổ y tế", icon: FileText },
  { id: "blog", label: "Blog", icon: Newspaper },
  { id: "subscription", label: "Nâng cấp", icon: Crown },
]

export const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price)
}

export const FINANCE_DATA = [
    { name: "01/10", revenue: 5000000, target: 4500000 },
    { name: "05/10", revenue: 6200000, target: 4500000 },
    { name: "10/10", revenue: 4800000, target: 4500000 },
    { name: "15/10", revenue: 7500000, target: 4500000 },
    { name: "20/10", revenue: 5900000, target: 4500000 },
    { name: "25/10", revenue: 8100000, target: 4500000 },
    { name: "30/10", revenue: 9500000, target: 4500000 },
]

export const METRIC_CARDS = [
    { label: "Doanh thu trung bình/ngày", value: "6.714.285 ₫", trend: "+12.5%", isPositive: true },
    { label: "Lợi nhuận ròng", value: "142.300.000 ₫", trend: "+8.2%", isPositive: true },
    { label: "Phí sàn đã trả", value: "12.500.000 ₫", trend: "+5.1%", isPositive: false },
]

export const ORDER_STATUS_DATA = [
    { name: "T2", success: 40, cancelled: 5, returned: 2 },
    { name: "T3", success: 35, cancelled: 8, returned: 1 },
    { name: "T4", success: 50, cancelled: 3, returned: 4 },
    { name: "T5", success: 45, cancelled: 6, returned: 2 },
    { name: "T6", success: 60, cancelled: 2, returned: 3 },
    { name: "T7", success: 75, cancelled: 4, returned: 5 },
    { name: "CN", success: 85, cancelled: 5, returned: 6 },
]

export const TOP_CUSTOMERS = [
    { id: 1, name: "Nguyễn Văn A", avatar: "/placeholder.svg", totalSpent: 25600000 },
    { id: 2, name: "Trần Thị B", avatar: "/placeholder.svg", totalSpent: 21300000 },
    { id: 3, name: "Lê Văn C", avatar: "/placeholder.svg", totalSpent: 18900000 },
    { id: 4, name: "Phạm Minh D", avatar: "/placeholder.svg", totalSpent: 15400000 },
    { id: 5, name: "Hoàng Anh E", avatar: "/placeholder.svg", totalSpent: 12800000 },
]

export const CATEGORY_DISTRIBUTION = [
    { name: "Thức ăn", value: 45, color: "#F97316" },
    { name: "Dịch vụ Y tế", value: 25, color: "#3B82F6" },
    { name: "Đồ chơi", value: 15, color: "#10B981" },
    { name: "Phụ kiện", value: 10, color: "#8B5CF6" },
    { name: "Khác", value: 5, color: "#EF4444" },
]

export const TOP_PRODUCTS = [
    { id: 1, name: "Thức ăn hạt Royal Canin cho chó", sold: 245, revenue: 12250000, stock: 45 },
    { id: 2, name: "Cát vệ sinh hữu cơ cho mèo", sold: 189, revenue: 3780000, stock: 120 },
    { id: 3, name: "Dịch vụ Tắm & Spa trọn gói", sold: 156, revenue: 46800000, stock: "-" },
    { id: 4, name: "Đồ chơi gặm xương cho chó", sold: 134, revenue: 2010000, stock: 85 },
    { id: 5, name: "Bát ăn inox chống trượt", sold: 112, revenue: 1680000, stock: 30 },
]

export const SLOW_MOVING_PRODUCTS = [
    { id: 1, name: "Vòng cổ đính đá cao cấp", stock: 15, lastSold: "45 ngày trước" },
    { id: 2, name: "Áo mưa cho chó lớn", stock: 25, lastSold: "30 ngày trước" },
    { id: 3, name: "Nhà cây cho mèo size XL", stock: 5, lastSold: "25 ngày trước" },
]

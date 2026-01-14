"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { ordersAPI } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { AlertDialog, useAlertDialog } from "./alert-dialog-custom"

interface CartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout?: () => void
}

export function CartModal({ open, onOpenChange, onCheckout }: CartModalProps) {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const { alertState, showAlert, closeAlert } = useAlertDialog()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsCheckingOut(true)
    try {
      // Transform cart items to order items with full product info
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product_name: item.product_name, // Add product name for snapshot
        price: item.price, // Add price for snapshot
        product_image: item.product_image, // Add image for display
      }))

      const response = await ordersAPI.create({
        items: orderItems,
        note: "Đơn hàng từ giỏ hàng",
      })

      if (response.success) {
        setCheckoutSuccess(true)
        clearCart()
        setTimeout(() => {
          setCheckoutSuccess(false)
          onCheckout?.()
          onOpenChange(false)
        }, 2000)
      } else {
        showAlert({
          type: "error",
          title: "Đặt hàng thất bại",
          message: response.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
        })
        setIsCheckingOut(false)
      }
    } catch (error) {
      showAlert({
        type: "error",
        title: "Lỗi kết nối",
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.",
      })
      setIsCheckingOut(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Giỏ hàng
            {totalItems > 0 && (
              <Badge className="ml-auto">{totalItems} sản phẩm</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {checkoutSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Đặt hàng thành công!</h3>
            <p className="text-foreground/60">Đơn hàng của bạn đang được xử lý</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-foreground/30" />
            </div>
            <p className="text-foreground/60 mb-2">Giỏ hàng trống</p>
            <p className="text-sm text-foreground/40">Thêm sản phẩm vào giỏ hàng để tiếp tục</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    <Image
                      src={item.product_image || "/placeholder.svg"}
                      alt={item.product_name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate mb-1">
                      {item.product_name}
                    </h4>
                    {item.merchant_name && (
                      <p className="text-xs text-foreground/50 mb-2">
                        {item.merchant_name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-primary">{formatPrice(item.price)}</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => removeItem(item.product_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Tạm tính</span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-foreground">Tổng cộng</span>
                <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="flex-1 rounded-xl"
                >
                  Xóa tất cả
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Thanh toán
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    
    {/* Alert Dialog */}
    <AlertDialog
      open={alertState.open}
      onOpenChange={closeAlert}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      onConfirm={alertState.onConfirm}
      showCancel={alertState.showCancel}
    />
  </>
  )
}

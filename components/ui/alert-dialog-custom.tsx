"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react"

export type AlertType = "info" | "success" | "warning" | "error"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message: string
  type?: AlertType
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  showCancel?: boolean
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Hủy",
  onConfirm,
  showCancel = false,
}: AlertDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-12 h-12 text-green-600" />
      case "error":
        return <XCircle className="w-12 h-12 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-orange-600" />
      default:
        return <Info className="w-12 h-12 text-blue-600" />
    }
  }

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-green-100"
      case "error":
        return "bg-red-100"
      case "warning":
        return "bg-orange-100"
      default:
        return "bg-blue-100"
    }
  }

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <div className="text-center py-4">
          <div className={`w-20 h-20 ${getColors()} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {getIcon()}
          </div>
          {title && (
            <DialogHeader>
              <DialogTitle className="text-center text-xl">{title}</DialogTitle>
            </DialogHeader>
          )}
          <DialogDescription className="text-center text-foreground mt-2">
            {message}
          </DialogDescription>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          {showCancel && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className="flex-1 rounded-xl"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useAlertDialog() {
  const [alertState, setAlertState] = useState<{
    open: boolean
    title?: string
    message: string
    type: AlertType
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    showCancel?: boolean
  }>({
    open: false,
    message: "",
    type: "info",
  })

  const showAlert = (config: {
    title?: string
    message: string
    type?: AlertType
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    showCancel?: boolean
  }) => {
    setAlertState({
      open: true,
      ...config,
      type: config.type || "info",
    })
  }

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, open: false }))
  }

  return {
    alertState,
    showAlert,
    closeAlert,
  }
}

import { useState } from "react"

"use client"

import type { ReactNode } from "react"
import { useFeatureAccess, type FeatureKey } from "@/hooks/use-feature-access"
import { Button } from "@/components/ui/button"
import { Lock, Crown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface FeatureGateProps {
    featureKey: FeatureKey
    children: ReactNode
    fallback?: ReactNode
    showUpgradeCTA?: boolean
    className?: string
    fullScreen?: boolean
}

export function FeatureGate({
    featureKey,
    children,
    fallback,
    showUpgradeCTA = true,
    className = "",
    fullScreen = false
}: FeatureGateProps) {
    const { canAccess, isSubscriptionActive } = useFeatureAccess()
    const hasAccess = canAccess(featureKey)

    if (hasAccess) {
        return <>{children}</>
    }

    if (fallback) {
        return <>{fallback}</>
    }

    return (
        <div className={`relative group ${className} ${fullScreen ? "h-full w-full" : ""}`}>
            {/* Dimmed Children */}
            <div className="opacity-40 grayscale pointer-events-none filter blur-[2px] transition-all duration-500 overflow-hidden">
                {children}
            </div>

            {/* Gating Overlay */}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-background/20 backdrop-blur-[2px] rounded-xl border-2 border-dashed border-primary/20 m-1"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-card/90 p-6 rounded-3xl shadow-2xl border border-border max-w-[280px]"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
                            <Lock className="w-6 h-6 text-primary animate-pulse" />
                        </div>

                        <h3 className="text-lg font-bold text-foreground mb-2">Tính năng Premium</h3>
                        <p className="text-sm text-foreground/60 mb-6">
                            Vui lòng nâng cấp gói đăng ký của bạn để sử dụng tính năng này.
                        </p>

                        {showUpgradeCTA && (
                            <Button
                                onClick={() => {
                                    // Try to find the subscription tab from shell if possible or just redirect
                                    // For now, most layouts handle tab switching via props, so we rely on user manually clicking or a event
                                    window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'subscription' }));
                                }}
                                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                Nâng cấp ngay
                            </Button>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

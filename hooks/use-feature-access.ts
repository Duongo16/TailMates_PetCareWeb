"use client"

import { useAuth } from "@/lib/auth-context"
import { useMemo } from "react"

export type FeatureKey = "pawmate_connect" | "blog_posting" | "ai_personality" | "ai_recommendations" | "qr_scanning" | "unlimited_products" | "advanced_analytics" | "priority_support"
export type QuantityKey = "max_pets" | "ai_limit_per_day"

export function useFeatureAccess() {
    const { user } = useAuth()

    // Centralized check for subscription validity
    const isSubscriptionActive = useMemo(() => {
        if (!user?.subscription?.expired_at) return false
        return new Date(user.subscription.expired_at) > new Date()
    }, [user?.subscription?.expired_at])

    // Helper to check boolean feature access
    const canAccess = (featureKey: FeatureKey): boolean => {
        // If no active subscription, all premium features are blocked
        if (!isSubscriptionActive) return false

        // Features config is populated from the Package model on the backend
        const config = user?.active_features_config
        if (!config) return false

        return config[featureKey] === true
    }

    // Helper to get quantity limit (with free tier defaults)
    const getLimit = (limitKey: QuantityKey): number => {
        // Default fallback limits (Free Tier)
        const FREE_LIMITS: Record<QuantityKey, number> = {
            max_pets: 1,
            ai_limit_per_day: 3
        }

        if (!isSubscriptionActive) return FREE_LIMITS[limitKey]

        const config = user?.active_features_config
        if (!config || config[limitKey] === undefined) return FREE_LIMITS[limitKey]

        return config[limitKey]
    }

    return {
        isSubscriptionActive,
        canAccess,
        getLimit,
        packageName: user?.active_features_config?.name || (isSubscriptionActive ? "Gói Thuê Bao" : "Gói Miễn Phí"),
        activeFeatures: user?.active_features_config || {}
    }
}

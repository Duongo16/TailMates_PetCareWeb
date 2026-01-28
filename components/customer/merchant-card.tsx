"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star, MapPin, Globe, ArrowRight, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MerchantCardProps {
    merchant: {
        _id: string
        full_name: string
        avatar?: { url: string }
        merchant_profile: {
            shop_name: string
            address: string
            rating: number
            categories?: string[]
            website?: string
            banners?: { url: string; public_id?: string }[]
        }
    }
}

export function MerchantCard({ merchant }: MerchantCardProps) {
    const { merchant_profile } = merchant
    const mainBanner = merchant_profile.banners?.[0]?.url

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Link href={`/merchants/${merchant._id}`}>
                <Card className="h-full overflow-hidden border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                    <CardContent className="p-0">
                        <div className="relative">
                            <div className="relative h-32 bg-muted overflow-hidden rounded-t-xl">
                                {mainBanner ? (
                                    <Image
                                        src={mainBanner}
                                        alt={merchant_profile.shop_name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
                                )}
                                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                            </div>

                            <motion.div
                                className="absolute -bottom-6 left-6 z-20"
                                whileHover={{ scale: 1.1 }}
                            >
                                <Avatar className="w-16 h-16 border-4 border-card shadow-lg ring-2 ring-primary/5">
                                    <AvatarImage src={merchant.avatar?.url || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                                        {merchant_profile.shop_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>

                            <div className="absolute top-4 right-4 z-20">
                                <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-border shadow-sm">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-bold text-foreground">
                                        {merchant_profile.rating ? merchant_profile.rating.toFixed(1) : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 px-6 pb-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {merchant_profile.shop_name}
                                </h3>
                                <p className="text-sm text-foreground/60 flex items-center gap-1.5 mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="line-clamp-1">{merchant_profile.address}</span>
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {merchant_profile.categories && merchant_profile.categories.length > 0 ? (
                                    merchant_profile.categories.slice(0, 3).map((cat) => (
                                        <Badge key={cat} variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] py-0 px-2">
                                            {cat}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="secondary" className="bg-foreground/5 text-foreground/60 border-transparent text-[10px] py-0 px-2">
                                        Đối tác
                                    </Badge>
                                )}
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                {merchant_profile.website ? (
                                    <div className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Globe className="w-3.5 h-3.5" />
                                        <span>Website</span>
                                    </div>
                                ) : <div />}
                                <div className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    )
}

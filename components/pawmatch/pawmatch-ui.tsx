"use client"

import { useState } from "react"
import { usePets } from "@/lib/hooks"
import { SwipeDeck } from "@/components/pawmatch/swipe-deck"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles, MessageSquare, History, Heart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PawMatchUI() {
    const { data: pets, isLoading } = usePets()
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    const availablePets = pets?.filter(p => p.datingProfile?.bio) || []

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
                        PawMatch <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    </h1>
                    <p className="text-muted-foreground">Tìm bạn chơi hoặc đối tượng phối giống cho bé cưng</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild className="rounded-xl">
                        <Link href="/dashboard/customer/pawmatch/matches">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Đã tương hợp
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Pet Selector */}
            <Card className="bg-primary/5 border-primary/20 rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                            <h3 className="text-lg font-bold">Chọn bé cưng để đi tìm bạn</h3>
                            <p className="text-sm text-foreground/70">
                                Chỉ những bé đã có <b>Hồ sơ PawMatch</b> (Bio và Ảnh gallery) mới có thể sử dụng tính năng này.
                            </p>
                        </div>
                        <div className="w-full sm:w-64">
                            <Select
                                value={selectedPetId || ""}
                                onValueChange={(val) => setSelectedPetId(val)}
                            >
                                <SelectTrigger className="rounded-2xl h-12 bg-white border-2 border-primary/20 focus:ring-primary">
                                    <SelectValue placeholder="Chọn bé cưng..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {availablePets.length > 0 ? (
                                        availablePets.map((pet) => (
                                            <SelectItem key={pet._id} value={pet._id} className="rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary">
                                                        <img src={pet.image?.url || "/placeholder.svg"} alt="" className="object-cover w-full h-full" />
                                                    </div>
                                                    <span className="font-medium">{pet.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            Bạn chưa có bé nào đủ điều kiện.
                                            <Link href="/dashboard/customer" className="text-primary block mt-1 hover:underline">Cập nhật hồ sơ ngay →</Link>
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Discovery Section */}
            <div className="relative pt-4">
                {selectedPetId ? (
                    <SwipeDeck petId={selectedPetId} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-[40px] border-2 border-dashed border-muted-foreground/20 text-center px-6">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                            <History className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground/60">Sẵn sàng để "quẹt"?</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs">
                            Chọn 1 bé cưng ở trên để bắt đầu khám phá những người bạn xung quanh nhé!
                        </p>
                    </div>
                )}
            </div>

            {/* Hint Card */}
            {selectedPetId && (
                <div className="flex justify-center gap-10 text-muted-foreground/60 text-sm font-medium mt-10">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                            <XIcon className="w-6 h-6" />
                        </div>
                        <span>Quẹt trái: Bỏ qua</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                            <Heart className="w-6 h-6" />
                        </div>
                        <span>Quẹt phải: Thích</span>
                    </div>
                </div>
            )}
        </div>
    )
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}

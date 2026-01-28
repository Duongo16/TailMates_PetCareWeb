"use client"

import { useState, useEffect } from "react"
import { usePets } from "@/lib/hooks"
import { pawmatchAPI } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MessageCircle, Info, Heart, ArrowLeft, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function MatchesPage() {
    const { data: pets, isLoading: isLoadingPets } = usePets()
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
    const [matches, setMatches] = useState<any[]>([])
    const [isLoadingMatches, setIsLoadingMatches] = useState(false)

    useEffect(() => {
        if (pets && pets.length > 0 && !selectedPetId) {
            setSelectedPetId(pets[0]._id)
        }
    }, [pets, selectedPetId])

    useEffect(() => {
        if (selectedPetId) {
            fetchMatches()
        }
    }, [selectedPetId])

    const fetchMatches = async () => {
        setIsLoadingMatches(true)
        try {
            const res = await pawmatchAPI.getMatches(selectedPetId!)
            if (res.success) {
                setMatches(res.data || [])
            }
        } catch (err) {
            console.error("Failed to fetch matches:", err)
        } finally {
            setIsLoadingMatches(false)
        }
    }

    if (isLoadingPets) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/dashboard/customer/pawmatch">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-foreground">Bạn bè của bé</h1>
                    <p className="text-muted-foreground">Những bé đã tương hợp (match) thành công</p>
                </div>
            </div>

            {/* Pet Selector */}
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl">
                <span className="text-sm font-medium text-muted-foreground">Xem bạn của:</span>
                <Select
                    value={selectedPetId || ""}
                    onValueChange={(val) => setSelectedPetId(val)}
                >
                    <SelectTrigger className="w-48 rounded-xl h-10 bg-white shadow-sm border-0 focus:ring-primary">
                        <SelectValue placeholder="Chọn bé cưng..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        {pets?.map((pet) => (
                            <SelectItem key={pet._id} value={pet._id} className="rounded-lg">
                                {pet.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Matches List */}
            {isLoadingMatches ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : matches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matches.map((match) => {
                        const targetPet = match.pets.find((p: any) => p._id !== selectedPetId)
                        if (!targetPet) return null

                        return (
                            <Card key={match._id} className="overflow-hidden group hover:shadow-lg transition-all rounded-3xl border-0 shadow-sm bg-card">
                                <CardContent className="p-0">
                                    <div className="flex h-32">
                                        <div className="w-32 relative flex-shrink-0">
                                            <Image
                                                src={targetPet.mediaGallery?.[0]?.url || targetPet.image?.url || "/placeholder.svg"}
                                                alt={targetPet.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-lg">{targetPet.name}</h3>
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] uppercase font-black">MATCH</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {targetPet.breed || targetPet.species} • {Math.floor(targetPet.age_months / 12) || targetPet.age_months + ' th'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" asChild className="flex-1 rounded-xl h-9 font-bold bg-primary hover:bg-primary/90">
                                                    <Link href={`/dashboard/customer/pawmatch/messages/${match._id}?myPetId=${selectedPetId}`}>
                                                        <MessageCircle className="w-4 h-4 mr-2" />
                                                        Chat
                                                    </Link>
                                                </Button>
                                                <Button size="sm" variant="outline" className="rounded-xl w-9 h-9 p-0">
                                                    <Info className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
                        <Heart className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold">Chưa có "người bạn" nào</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                            Hãy chăm chỉ "quẹt" để bé có thêm nhiều bạn mới nhé!
                        </p>
                    </div>
                    <Button asChild className="rounded-full px-8">
                        <Link href="/dashboard/customer/pawmatch">Quẹt ngay thôi</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}

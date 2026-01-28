"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { usePets } from "@/lib/hooks"
import { ChatWindow } from "@/components/pawmatch/chat-window"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { pawmatchAPI, petsAPI } from "@/lib/api"

export default function ChatRoomPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const matchId = params.matchId as string

    // We need to know which pet of the user is participating in this match
    const myPetId = searchParams.get("myPetId")

    const { data: userPets, isLoading: isLoadingUserPets } = usePets()
    const [otherPet, setOtherPet] = useState<any>(null)
    const [isLoadingOtherPet, setIsLoadingOtherPet] = useState(true)

    useEffect(() => {
        if (matchId && myPetId) {
            fetchOtherPetInfo()
        }
    }, [matchId, myPetId])

    const fetchOtherPetInfo = async () => {
        setIsLoadingOtherPet(true)
        try {
            // First get the match details to find the other pet ID
            const res = await fetch(`/api/v1/pawmatch/matches`) // We don't have a single match GET yet, but we can find it in the list
            // Optimization: Usually we'd have a GET /matches/:id but I'll search in list for now 
            // OR I'll just fetch all matches for the pet and find this matchId
            const matchesRes = await pawmatchAPI.getMatches(myPetId!)
            if (matchesRes.success) {
                const match = matchesRes.data?.find((m: any) => m._id === matchId)
                if (match) {
                    const otherPetInfo = match.pets.find((p: any) => p._id !== myPetId)
                    setOtherPet(otherPetInfo)
                }
            }
        } catch (err) {
            console.error("Failed to fetch other pet info:", err)
        } finally {
            setIsLoadingOtherPet(false)
        }
    }

    if (isLoadingUserPets || isLoadingOtherPet) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!otherPet || !myPetId) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Không tìm thấy thông tin cuộc trò chuyện.</p>
                <Button variant="link" onClick={() => router.back()}>Quay lại</Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4 pb-10">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold">Trò chuyện</h1>
            </div>

            <ChatWindow
                matchId={matchId}
                currentPetId={myPetId}
                otherPet={otherPet}
            />
        </div>
    )
}

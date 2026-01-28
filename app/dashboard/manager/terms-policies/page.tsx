"use client"

import { TermsPoliciesContent } from "@/components/admin/terms-policies-content"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function TermsPoliciesPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/manager")}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại Dashboard
                    </Button>
                </div>

                {/* Content */}
                <TermsPoliciesContent />
            </div>
        </div>
    )
}

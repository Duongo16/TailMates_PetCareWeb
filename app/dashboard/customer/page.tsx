"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { CustomerDashboard } from "@/components/customer/dashboard"
import { PetProfile } from "@/components/customer/pet-profile"
import { MedicalRecords } from "@/components/customer/medical-records"
import { Marketplace } from "@/components/customer/marketplace"
import { ServiceBooking } from "@/components/customer/service-booking"
import { Subscription } from "@/components/customer/subscription"
import { ProfileSettings } from "@/components/customer/profile-settings"
import { OrderTracking } from "@/components/customer/order-tracking"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Home, PawPrint, FileText, ShoppingBag, Calendar, Newspaper, Loader2, Sparkles } from "lucide-react"
import BlogList from "@/components/customer/blog-list"
import { PawMatchUI } from "@/components/pawmatch/pawmatch-ui"

type CustomerTab = "dashboard" | "pets" | "pawmatch" | "medical" | "marketplace" | "booking" | "orders" | "blog" | "subscription" | "settings"

const tabs = [
  { id: "dashboard" as CustomerTab, label: "Trang chủ", icon: Home },
  { id: "pets" as CustomerTab, label: "Thú cưng", icon: PawPrint },
  { id: "pawmatch" as CustomerTab, label: "PawMatch", icon: Sparkles },
  { id: "marketplace" as CustomerTab, label: "Mua sắm", icon: ShoppingBag },
  { id: "booking" as CustomerTab, label: "Đặt lịch", icon: Calendar },
  { id: "medical" as CustomerTab, label: "Sổ y tế", icon: FileText },
  { id: "blog" as CustomerTab, label: "Blog", icon: Newspaper },
]

export default function CustomerDashboardPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CustomerTab>("dashboard")
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [shouldOpenAddPet, setShouldOpenAddPet] = useState(false)
  const [shouldOpenEditPet, setShouldOpenEditPet] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render dashboard if not logged in (will redirect)
  if (!user) {
    return null
  }

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId)
    setActiveTab("pets")
  }

  const handlePetEdit = (petId: string) => {
    setSelectedPetId(petId)
    setShouldOpenEditPet(true)
    setActiveTab("pets")
  }

  const handleViewMedical = () => {
    setActiveTab("medical")
  }

  const handleBackFromMedical = () => {
    setActiveTab("pets")
  }

  const handleTabChange = (tab: string) => {
    const tabValue = tab as CustomerTab
    // If switching to pets tab from dashboard's add pet card, trigger add dialog
    if (tabValue === "pets" && activeTab === "dashboard") {
      setShouldOpenAddPet(true)
    }
    setActiveTab(tabValue)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <CustomerDashboard onPetSelect={handlePetSelect} onTabChange={handleTabChange} />
      case "pets":
        return (
          <PetProfile
            selectedPetId={selectedPetId}
            onSelectPet={setSelectedPetId}
            onViewMedical={handleViewMedical}
            shouldOpenAddDialog={shouldOpenAddPet}
            onAddDialogClose={() => setShouldOpenAddPet(false)}
            shouldOpenEditDialog={shouldOpenEditPet}
            onEditDialogClose={() => setShouldOpenEditPet(false)}
          />
        )
      case "pawmatch":
        return <PawMatchUI 
          onEditPet={handlePetEdit} 
          onAddPet={() => {
            setShouldOpenAddPet(true)
            setActiveTab("pets")
          }}
        />
      case "medical":
        return (
          <MedicalRecords selectedPetId={selectedPetId} onSelectPet={setSelectedPetId} onBack={handleBackFromMedical} />
        )
      case "booking":
        return <ServiceBooking />
      case "marketplace":
        return <Marketplace />
      case "orders":
        return <OrderTracking />
      case "blog":
        return <BlogList />
      case "subscription":
        return <Subscription />
      case "settings":
        return <ProfileSettings user={user} onUpdate={refreshUser} />
      default:
        return <CustomerDashboard onPetSelect={handlePetSelect} onTabChange={handleTabChange} />
    }
  }

  return (
    <DashboardShell tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as CustomerTab)}>
      {renderContent()}
    </DashboardShell>
  )
}

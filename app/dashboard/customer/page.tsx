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
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { CUSTOMER_TABS, type CustomerTab } from "@/lib/customer-constants"
import BlogList from "@/components/customer/blog-list"
import { PawMatchUI } from "@/components/pawmatch/pawmatch-ui"
import { TransactionHistory } from "@/components/dashboard/transaction-history"


export default function CustomerDashboardPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<CustomerTab>("dashboard")
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [shouldOpenAddPet, setShouldOpenAddPet] = useState(false)
  const [shouldOpenEditPet, setShouldOpenEditPet] = useState(false)

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab") as CustomerTab
    if (tab && CUSTOMER_TABS.some(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

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
      case "subscription":
        return <Subscription />
      case "settings":
        return <ProfileSettings user={user} onUpdate={refreshUser} />
      default:
        return <CustomerDashboard onPetSelect={handlePetSelect} onTabChange={handleTabChange} />
    }
  }

  return (
    <DashboardShell tabs={CUSTOMER_TABS} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as CustomerTab)}>
      {renderContent()}
    </DashboardShell>
  )
}

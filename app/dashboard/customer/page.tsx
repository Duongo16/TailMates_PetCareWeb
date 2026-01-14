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
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Home, PawPrint, FileText, ShoppingBag, Calendar } from "lucide-react"

type CustomerTab = "dashboard" | "pets" | "medical" | "marketplace" | "booking" | "orders" | "subscription" | "settings"

const tabs = [
  { id: "dashboard" as CustomerTab, label: "Trang chủ", icon: Home },
  { id: "pets" as CustomerTab, label: "Thú cưng", icon: PawPrint },
  { id: "medical" as CustomerTab, label: "Sổ y tế", icon: FileText },
  { id: "booking" as CustomerTab, label: "Đặt lịch", icon: Calendar },
  { id: "marketplace" as CustomerTab, label: "Mua sắm", icon: ShoppingBag },
]

export default function CustomerDashboardPage() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<CustomerTab>("dashboard")
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [shouldOpenAddPet, setShouldOpenAddPet] = useState(false)

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId)
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
          />
        )
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

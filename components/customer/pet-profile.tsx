"use client"

import { useState, useEffect } from "react"
import { usePets } from "@/lib/hooks"
import { petsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Cake,
  Weight,
  Heart,
  Sparkles,
  Edit,
  Camera,
  PawPrint,
  Dna,
  Palette,
  AlertTriangle,
  StickyNote,
  QrCode,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import Image from "next/image"

interface PetProfileProps {
  selectedPetId: string | null
  onSelectPet: (id: string) => void
  onViewMedical?: () => void
  shouldOpenAddDialog?: boolean
  onAddDialogClose?: () => void
}

const SPECIES_OPTIONS = [
  { value: "Dog", label: "Chó" },
  { value: "Cat", label: "Mèo" },
  { value: "Rabbit", label: "Thỏ" },
  { value: "Bird", label: "Chim" },
  { value: "Hamster", label: "Hamster" },
  { value: "Other", label: "Khác" },
]

const BREED_OPTIONS: Record<string, { value: string; label: string }[]> = {
  Dog: [
    { value: "Corgi", label: "Corgi" },
    { value: "Golden Retriever", label: "Golden Retriever" },
    { value: "Husky", label: "Husky" },
    { value: "Poodle", label: "Poodle" },
    { value: "Pomeranian", label: "Pomeranian" },
    { value: "Shiba Inu", label: "Shiba Inu" },
    { value: "Chihuahua", label: "Chihuahua" },
    { value: "Bulldog", label: "Bulldog" },
    { value: "Phốc sóc", label: "Phốc sóc" },
    { value: "Chó ta", label: "Chó ta" },
    { value: "Other", label: "Khác" },
  ],
  Cat: [
    { value: "Mèo ta", label: "Mèo ta" },
    { value: "Mèo Anh lông ngắn", label: "Mèo Anh lông ngắn" },
    { value: "Mèo Ba Tư", label: "Mèo Ba Tư" },
    { value: "Mèo Ragdoll", label: "Mèo Ragdoll" },
    { value: "Mèo Maine Coon", label: "Mèo Maine Coon" },
    { value: "Mèo Scottish Fold", label: "Mèo Scottish Fold" },
    { value: "Mèo Munchkin", label: "Mèo Munchkin" },
    { value: "Mèo Siamese", label: "Mèo Siamese" },
    { value: "Other", label: "Khác" },
  ],
  Rabbit: [
    { value: "Thỏ Hà Lan", label: "Thỏ Hà Lan" },
    { value: "Thỏ sư tử", label: "Thỏ sư tử" },
    { value: "Thỏ lop", label: "Thỏ lop" },
    { value: "Other", label: "Khác" },
  ],
  Bird: [
    { value: "Vẹt", label: "Vẹt" },
    { value: "Chim sẻ", label: "Chim sẻ" },
    { value: "Yến phụng", label: "Yến phụng" },
    { value: "Chào mào", label: "Chào mào" },
    { value: "Other", label: "Khác" },
  ],
  Hamster: [
    { value: "Hamster Syria", label: "Hamster Syria" },
    { value: "Hamster Robo", label: "Hamster Robo" },
    { value: "Hamster Winter White", label: "Hamster Winter White" },
    { value: "Other", label: "Khác" },
  ],
  Other: [
    { value: "Other", label: "Khác" },
  ],
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Đực" },
  { value: "FEMALE", label: "Cái" },
]

export function PetProfile({ selectedPetId, onSelectPet, onViewMedical, shouldOpenAddDialog, onAddDialogClose }: PetProfileProps) {
  const { data: pets, isLoading, refetch } = usePets()
  const [showQR, setShowQR] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<any>(null)

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    species: "Dog",
    breed: "",
    customBreed: "",
    age_months: "",
    weight_kg: "",
    gender: "MALE",
    sterilized: false,
    color: "",
    microchip: "",
    notes: "",
    image_url: "",
    image_public_id: "",
  })

  const selectedPet = pets?.find((p) => p._id === selectedPetId) || pets?.[0]

  useEffect(() => {
    if (showQR && selectedPet) {
      petsAPI.getQRCode(selectedPet._id).then((res) => {
        if (res.success) {
          setQrCodeData(res.data)
        }
      })
    }
  }, [showQR, selectedPet])

  // Auto-open add dialog when triggered from dashboard
  useEffect(() => {
    if (shouldOpenAddDialog) {
      resetForm()
      setShowAddDialog(true)
      onAddDialogClose?.()
    }
  }, [shouldOpenAddDialog, onAddDialogClose])

  const resetForm = () => {
    setFormData({
      name: "",
      species: "Dog",
      breed: "",
      customBreed: "",
      age_months: "",
      weight_kg: "",
      gender: "MALE",
      sterilized: false,
      color: "",
      microchip: "",
      notes: "",
      image_url: "",
      image_public_id: "",
    })
  }

  const openEditDialog = () => {
    if (selectedPet) {
      // Check if current breed is in the predefined list
      const speciesBreeds = BREED_OPTIONS[selectedPet.species] || BREED_OPTIONS.Other
      const isCustomBreed = selectedPet.breed && !speciesBreeds.some(b => b.value === selectedPet.breed)

      setFormData({
        name: selectedPet.name || "",
        species: selectedPet.species || "Dog",
        breed: isCustomBreed ? "Other" : (selectedPet.breed || ""),
        customBreed: isCustomBreed ? (selectedPet.breed || "") : "",
        age_months: String(selectedPet.age_months || ""),
        weight_kg: String(selectedPet.weight_kg || ""),
        gender: selectedPet.gender || "MALE",
        sterilized: selectedPet.sterilized || false,
        color: selectedPet.color || "",
        microchip: selectedPet.microchip || "",
        notes: selectedPet.notes || "",
        image_url: selectedPet.image?.url || "",
        image_public_id: selectedPet.image?.public_id || "",
      })
      setShowEditDialog(true)
    }
  }

  const handleAddPet = async () => {
    if (!formData.name || !formData.species || !formData.age_months || !formData.gender) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      const finalBreed = formData.breed === "Other" ? formData.customBreed : formData.breed
      const petData: any = {
        name: formData.name,
        species: formData.species,
        breed: finalBreed || undefined,
        age_months: parseInt(formData.age_months),
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        gender: formData.gender,
        sterilized: formData.sterilized,
        color: formData.color || undefined,
        microchip: formData.microchip || undefined,
        notes: formData.notes || undefined,
      }

      if (formData.image_url) {
        petData.image = {
          url: formData.image_url,
          public_id: formData.image_public_id || `pet_${Date.now()}`
        }
      }

      const res = await petsAPI.create(petData)
      if (res.success) {
        setShowAddDialog(false)
        resetForm()
        refetch()
      } else {
        alert(res.message || "Không thể thêm thú cưng")
      }
    } catch (error) {
      console.error(error)
      alert("Lỗi khi thêm thú cưng")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePet = async () => {
    if (!selectedPet || !formData.name) {
      alert("Vui lòng điền tên thú cưng")
      return
    }

    setIsSubmitting(true)
    try {
      const finalBreed = formData.breed === "Other" ? formData.customBreed : formData.breed
      const updateData: any = {
        name: formData.name,
        species: formData.species,
        breed: finalBreed || undefined,
        age_months: parseInt(formData.age_months),
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        gender: formData.gender,
        sterilized: formData.sterilized,
        color: formData.color || undefined,
        microchip: formData.microchip || undefined,
        notes: formData.notes || undefined,
      }

      if (formData.image_url) {
        updateData.image = {
          url: formData.image_url,
          public_id: formData.image_public_id || selectedPet.image?.public_id || `pet_${Date.now()}`
        }
      }

      const res = await petsAPI.update(selectedPet._id, updateData)
      if (res.success) {
        setShowEditDialog(false)
        refetch()
      } else {
        alert(res.message || "Không thể cập nhật")
      }
    } catch (error) {
      console.error(error)
      alert("Lỗi khi cập nhật thú cưng")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePet = async () => {
    if (!selectedPet) return

    setIsSubmitting(true)
    try {
      const res = await petsAPI.delete(selectedPet._id)
      if (res.success) {
        setShowDeleteConfirm(false)
        refetch()
      } else {
        alert(res.message || "Không thể xóa")
      }
    } catch (error) {
      console.error(error)
      alert("Lỗi khi xóa thú cưng")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPetIcon = (species: string) => {
    switch (species) {
      case "Cat":
      case "Mèo":
        return "🐱"
      case "Dog":
      case "Chó":
        return "🐕"
      case "Rabbit":
      case "Thỏ":
        return "🐰"
      case "Bird":
      case "Chim":
        return "🐦"
      case "Hamster":
        return "🐹"
      default:
        return "🐾"
    }
  }

  const formatAge = (ageMonths: number) => {
    if (ageMonths >= 12) {
      const years = Math.floor(ageMonths / 12)
      const months = ageMonths % 12
      return months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`
    }
    return `${ageMonths} tháng`
  }

  // Pet Form Component (shared between Add and Edit)
  const PetForm = ({ isEdit = false }: { isEdit?: boolean }) => {
    const currentBreedOptions = BREED_OPTIONS[formData.species] || BREED_OPTIONS.Other

    return (
      <div className="flex flex-col md:flex-row gap-6" >
        {/* Left Column - Image Upload */}
        <div className="md:w-1/3 flex-shrink-0">
          <ImageUpload
            label="Hình ảnh thú cưng"
            value={formData.image_url}
            onChange={(url, publicId) => {
              setFormData({
                ...formData,
                image_url: url,
                image_public_id: publicId || formData.image_public_id
              })
            }}
          />
        </div>

        {/* Right Column - Form Fields */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-sm">Tên thú cưng *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Mochi"
                className="rounded-xl mt-1 h-9" style={{ width: '100%' }}
              />
            </div>
            <div>
              <Label className="text-sm">Loài *</Label>
              <Select
                value={formData.species}
                onValueChange={(val) => setFormData({ ...formData, species: val, breed: "", customBreed: "" })}
              >
                <SelectTrigger className="rounded-xl mt-1 h-9" style={{ width: '100%' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Giống</Label>
              <Select
                value={formData.breed}
                onValueChange={(val) => setFormData({ ...formData, breed: val, customBreed: val === "Other" ? formData.customBreed : "" })}
              >
                <SelectTrigger className="rounded-xl mt-1 h-9" style={{ width: '100%' }}><SelectValue placeholder="Chọn giống" /></SelectTrigger>
                <SelectContent>
                  {currentBreedOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom breed input when 'Other' is selected */}
            {formData.breed === "Other" && (
              <div className="col-span-2">
                <Label className="text-sm">Nhập tên giống</Label>
                <Input
                  value={formData.customBreed}
                  onChange={(e) => setFormData({ ...formData, customBreed: e.target.value })}
                  placeholder="VD: Chó lai Phú Quốc"
                  className="rounded-xl mt-1 h-9" style={{ width: '100%' }}
                />
              </div>
            )}

            <div>
              <Label className="text-sm">Tuổi (tháng) *</Label>
              <Input
                type="number"
                value={formData.age_months}
                onChange={(e) => setFormData({ ...formData, age_months: e.target.value })}
                placeholder="12"
                className="rounded-xl mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-sm">Cân nặng (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                placeholder="4.5"
                className="rounded-xl mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-sm">Giới tính *</Label>
              <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                <SelectTrigger className="rounded-xl mt-1 h-9" style={{ width: '100%' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Màu lông</Label>
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="VD: Trắng, vàng"
                className="rounded-xl mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-sm">Số Microchip</Label>
              <Input
                value={formData.microchip}
                onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
                placeholder="VD: 900123456789012"
                className="rounded-xl mt-1 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sterilized"
                checked={formData.sterilized}
                onChange={(e) => setFormData({ ...formData, sterilized: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="sterilized" className="cursor-pointer text-sm">Đã triệt sản</Label>
            </div>
            <div className="col-span-2">
              <Label className="text-sm">Ghi chú</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="VD: Sợ tiếng ồn, thích chơi với bóng..."
                className="rounded-xl mt-1 min-h-[60px] resize-none" style={{ width: '100%' }}
              />
            </div>
          </div>

          <Button
            className="w-full rounded-xl"
            onClick={isEdit ? handleUpdatePet : handleAddPet}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : isEdit ? "Cập nhật" : "Thêm thú cưng"}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!pets || pets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/60 mb-4">Bạn chưa có thú cưng nào</p>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm thú cưng ngay
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl ">
            <DialogHeader>
              <DialogTitle>Thêm thú cưng mới</DialogTitle>
            </DialogHeader>
            <PetForm />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hồ sơ thú cưng</h1>
        <p className="text-foreground/60 text-sm">Thông tin chi tiết về bé cưng của bạn</p>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-3xl max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa {selectedPet?.name}</DialogTitle>
          </DialogHeader>
          <PetForm isEdit />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-foreground/70">
            Bạn có chắc muốn xóa <strong>{selectedPet?.name}</strong>? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleDeletePet}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Xóa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Card */}
      {selectedPet && (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-secondary to-muted p-8 sm:p-6">
              <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-3xl overflow-hidden ring-4 ring-card shadow-lg bg-secondary">
                    <Image
                      src={selectedPet.image?.url || "/placeholder.svg"}
                      alt={selectedPet.name}
                      width={176}
                      height={176}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="text-center lg:text-left flex-1 w-full">
                  {/* Pet Name Combobox */}
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                    <span className="text-xl sm:text-2xl">{getPetIcon(selectedPet.species)}</span>
                    <Select
                      value={selectedPet?._id}
                      onValueChange={(petId) => onSelectPet(petId)}
                      disabled={!pets || pets.length === 0}
                    >
                      <SelectTrigger className="w-auto max-w-[280px] sm:max-w-[350px] font-bold text-2xl sm:text-3xl border-0 bg-transparent focus:ring-0 focus:ring-offset-0 px-0 hover:text-primary transition-colors">
                        <SelectValue placeholder="Chọn thú cưng">
                          {selectedPet?.name || "Chọn thú cưng"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {pets?.map((pet) => (
                          <SelectItem key={pet._id} value={pet._id} className="group">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getPetIcon(pet.species)}</span>
                              <span className="font-medium">{pet.name}</span>
                              <span className="text-xs text-muted-foreground group-focus:text-white group-hover:text-white transition-colors">
                                {pet.breed || pet.species} • {formatAge(pet.age_months)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-foreground/70 text-base sm:text-lg mb-3">{selectedPet.breed || "Không rõ giống"}</p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
                    <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                      <Cake className="w-3 h-3 mr-1" />
                      {formatAge(selectedPet.age_months)}
                    </Badge>
                    {selectedPet.weight_kg && (
                      <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        <Weight className="w-3 h-3 mr-1" />
                        {selectedPet.weight_kg} kg
                      </Badge>
                    )}
                    <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                      {selectedPet.gender === "MALE" || selectedPet.gender === "Đực" ? "♂️ Đực" : "♀️ Cái"}
                    </Badge>
                    {selectedPet.sterilized && (
                      <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-100 text-green-700 hover:bg-green-100">
                        Đã triệt sản
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {/* Action Buttons Row 1: QR, Add, Edit, Delete */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowQR(!showQR)}
                      variant="outline"
                      size="icon"
                      className="rounded-xl bg-card/80 hover:bg-card flex-shrink-0"
                      title="Mã QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl bg-card/80 hover:bg-card flex-shrink-0"
                          onClick={() => resetForm()}
                          title="Thêm mới"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl" style={{ width: '50%' }}>
                        <DialogHeader>
                          <DialogTitle>Thêm thú cưng mới</DialogTitle>
                        </DialogHeader>
                        <PetForm />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl bg-card/80 hover:bg-card flex-shrink-0"
                      onClick={openEditDialog}
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl bg-card/80 hover:bg-card border-destructive text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => setShowDeleteConfirm(true)}
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Action Button Row 2: Medical Record */}
                  <Button onClick={onViewMedical} className="rounded-xl w-full">
                    Sổ y tế
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* QR Code Popup */}
            {showQR && (
              <div className="p-4 bg-card border-t border-border animate-fade-in-up">
                <div className="flex items-center justify-center gap-6">
                  <div className="p-3 bg-white rounded-xl">
                    {qrCodeData ? (
                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          qrCodeData.profile_url
                        )}`}
                        alt="QR Code"
                        width={120}
                        height={120}
                      />
                    ) : (
                      <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-100 rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-foreground/70">
                    <p className="font-medium text-foreground mb-1 text-lg">Mã QR Định danh</p>
                    <p>Cho phòng khám quét để xem</p>
                    <p>hồ sơ y tế của {selectedPet.name}</p>
                    {qrCodeData && (
                      <p className="text-xs text-primary mt-2">
                        Cập nhật: {new Date(qrCodeData.generated_at).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full bg-card rounded-xl p-1 h-auto flex-wrap">
              <TabsTrigger
                value="info"
                className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
              >
                Thông tin
              </TabsTrigger>
              <TabsTrigger
                value="personality"
                className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
              >
                Tính cách
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
              >
                Sức khỏe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Loài</p>
                        <p className="font-bold text-foreground">{selectedPet.species}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Dna className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Giống</p>
                        <p className="font-bold text-foreground">{selectedPet.breed || "Chưa cập nhật"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Cake className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Tuổi</p>
                        <p className="font-bold text-foreground">{formatAge(selectedPet.age_months)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Palette className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Màu lông</p>
                        <p className="font-bold text-foreground">{selectedPet.color || "Chưa cập nhật"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Microchip */}
              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Số Microchip</p>
                        <p className="font-bold text-foreground font-mono">{selectedPet.microchip || "Chưa có"}</p>
                      </div>
                    </div>
                    {selectedPet.microchip && <Badge className="bg-green-100 text-green-700">Đã đăng ký</Badge>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personality" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Phân tích tính cách (AI)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPet.ai_analysis?.personality ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {(typeof selectedPet.ai_analysis.personality === 'string'
                          ? [selectedPet.ai_analysis.personality]
                          : selectedPet.ai_analysis.personality
                        ).map((trait: string, index: number) => (
                          <Badge
                            key={index}
                            className="bg-secondary text-foreground hover:bg-secondary/80 px-4 py-2 text-sm rounded-full"
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-secondary/30 rounded-xl">
                        <p className="text-foreground/80 text-sm leading-relaxed">
                          {selectedPet.ai_analysis.care_tips || "Chưa có lời khuyên chăm sóc chi tiết."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-foreground/60 mb-3">Chưa có phân tích tính cách</p>
                      <Button variant="outline" size="sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Phân tích ngay
                      </Button>
                    </div>
                  )}
                  <p className="text-foreground/60 text-sm flex items-center gap-1 mt-2">
                    <Heart className="w-4 h-4 text-primary" />
                    Phân tích dựa trên hành vi và thói quen của {selectedPet.name}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="mt-4 space-y-4">
              {/* Allergies */}
              {selectedPet.allergies && selectedPet.allergies.length > 0 && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Dị ứng</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPet.allergies.map((allergy: string, index: number) => (
                            <Badge key={index} variant="destructive" className="bg-destructive/20 text-destructive">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedPet.notes && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <StickyNote className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Ghi chú</p>
                        <p className="text-foreground/70 mt-1">{selectedPet.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dietary Advice from AI */}
              {selectedPet.ai_analysis?.dietary_advice && (
                <Card className="bg-green-50 border-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Cake className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800">Lời khuyên dinh dưỡng (AI)</p>
                        <p className="text-green-700 mt-1 text-sm">{selectedPet.ai_analysis.dietary_advice}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View Full Medical Records */}
              <Button onClick={onViewMedical} className="w-full rounded-xl py-6">
                Xem sổ y tế đầy đủ
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

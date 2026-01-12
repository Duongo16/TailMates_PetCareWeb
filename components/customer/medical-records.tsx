"use client"

import { useState } from "react"
import { usePets, useMedicalRecords } from "@/lib/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Calendar,
  Syringe,
  Stethoscope,
  Scissors,
  Heart,
  ChevronLeft,
  Download,
  Share2,
  Clock,
  MapPin,
  User,
  DollarSign,
  Paperclip,
  Bell,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import Image from "next/image"

interface MedicalRecordsProps {
  selectedPetId: string | null
  onSelectPet: (id: string) => void
  onBack?: () => void
}

export function MedicalRecords({ selectedPetId, onSelectPet, onBack }: MedicalRecordsProps) {
  const { data: pets, isLoading: petsLoading } = usePets()
  
  // Ensure selectedPetId is valid, or default to first pet
  const effectivePetId = selectedPetId || (pets && pets.length > 0 ? pets[0]._id : null)
  
  const { data: records, isLoading: recordsLoading } = useMedicalRecords(effectivePetId || "")
  
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  
  const selectedPet = pets?.find((p) => p._id === effectivePetId)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getCategoryIcon = (diagnosis: string) => {
    const lower = diagnosis.toLowerCase()
    if (lower.includes("vaccine") || lower.includes("tiêm")) return <Syringe className="w-5 h-5" />
    if (lower.includes("khám") || lower.includes("checkup")) return <Stethoscope className="w-5 h-5" />
    if (lower.includes("phẫu thuật") || lower.includes("mổ")) return <Scissors className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  // Simplified category deduction based on diagnosis content 
  // since backend might not have category field yet (schema has 'diagnosis', 'treatment', etc)
  const deduceCategory = (record: any) => {
    const text = (record.diagnosis + " " + record.treatment).toLowerCase()
    if (text.includes("vaccine") || text.includes("tiêm")) return "vaccine"
    if (text.includes("khám") || text.includes("kiểm tra")) return "checkup"
    if (text.includes("phẫu thuật") || text.includes("mổ")) return "surgery"
    return "treatment"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "vaccine":
        return "bg-green-100 text-green-700"
      case "checkup":
        return "bg-blue-100 text-blue-700"
      case "treatment":
        return "bg-orange-100 text-orange-700"
      case "surgery":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "vaccine":
        return "Tiêm phòng"
      case "checkup":
        return "Khám bệnh"
      case "treatment":
        return "Điều trị"
      case "surgery":
        return "Phẫu thuật"
      default:
        return "Khác"
    }
  }

  if (petsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedPet) {
     return (
      <div className="text-center py-12">
        <p className="text-foreground/60">Không tìm thấy thông tin thú cưng</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Sổ y tế</h1>
          <p className="text-foreground/60">Lịch sử khám chữa bệnh của {selectedPet.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-xl bg-transparent">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl bg-transparent">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pet Quick Info */}
      <Card className="bg-gradient-to-r from-secondary to-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-card bg-secondary">
              <Image
                src={selectedPet.image?.url || "/placeholder.svg"}
                alt={selectedPet.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{selectedPet.name}</h2>
              <p className="text-foreground/70 text-sm">
                {selectedPet.breed || "Không rõ giống"} • {selectedPet.species}
              </p>
            </div>
            {/* Pet Selector Dropdown */}
            <select
              value={selectedPet._id}
              onChange={(e) => onSelectPet(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm"
            >
              {pets?.map((pet) => (
                <option key={pet._id} value={pet._id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="records" className="w-full">
        <TabsList className="w-full bg-card rounded-xl p-1">
          <TabsTrigger
            value="records"
            className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileText className="w-4 h-4 mr-2" />
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Bell className="w-4 h-4 mr-2" />
            Lịch tiêm
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4 space-y-4">
          {recordsLoading ? (
             <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="bg-green-50">
                  <CardContent className="p-3 text-center">
                    <Syringe className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-700">
                      {records?.filter((r) => deduceCategory(r) === "vaccine").length || 0}
                    </p>
                    <p className="text-xs text-green-600">Tiêm phòng</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardContent className="p-3 text-center">
                    <Stethoscope className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-700">
                      {records?.filter((r) => deduceCategory(r) === "checkup").length || 0}
                    </p>
                    <p className="text-xs text-blue-600">Khám bệnh</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50">
                  <CardContent className="p-3 text-center">
                    <Heart className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-orange-700">
                      {records?.filter((r) => deduceCategory(r) === "treatment").length || 0}
                    </p>
                    <p className="text-xs text-orange-600">Điều trị</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="p-3 text-center">
                    <Scissors className="w-5 h-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-red-700">
                      {records?.filter((r) => deduceCategory(r) === "surgery").length || 0}
                    </p>
                    <p className="text-xs text-red-600">Phẫu thuật</p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground">Lịch sử y tế</h3>
                {records && records.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                    {records.map((record) => {
                      const category = deduceCategory(record)
                      return (
                        <div key={record._id} className="relative pl-12 pb-6 last:pb-0">
                          {/* Timeline dot */}
                          <div
                            className={`absolute left-3 w-5 h-5 rounded-full flex items-center justify-center ${getCategoryColor(category)}`}
                          >
                            {getCategoryIcon(record.diagnosis)}
                          </div>

                          <Card
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={getCategoryColor(category)}>{getCategoryLabel(category)}</Badge>
                                    <span className="text-sm text-foreground/50">
                                      {new Date(record.visit_date).toLocaleDateString("vi-VN")}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-foreground">{record.diagnosis}</h4>
                                  <p className="text-sm text-foreground/70">{record.treatment}</p>
                                  {(record.vet_id || record.clinic) && (
                                    <div className="flex items-center gap-4 mt-2 text-sm text-foreground/60">
                                      {record.vet_id && (
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {record.vet_id.full_name || record.vet_id.merchant_profile?.shop_name || "Bác sĩ"}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {record.cost && (
                                  <div className="text-right">
                                    <p className="font-bold text-primary">{formatPrice(record.cost)}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Card className="bg-secondary/30">
                    <CardContent className="p-8 text-center">
                      <FileText className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
                      <p className="text-foreground/60">Chưa có hồ sơ y tế nào</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-4 space-y-4">
          {/* Note: In a real app, this would come from a vaccine/appointments API */}
          <h3 className="font-bold text-foreground">Lịch tiêm phòng sắp tới</h3>
          
          <Card className="bg-secondary/30">
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
              <p className="text-foreground/60">Tính năng đang cập nhật...</p>
            </CardContent>
          </Card>

          <Button className="w-full rounded-xl">
            <Calendar className="w-4 h-4 mr-2" />
            Đặt lịch tiêm phòng
          </Button>
        </TabsContent>
      </Tabs>

      {/* Record Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRecord && getCategoryIcon(selectedRecord.diagnosis)}
              Chi tiết hồ sơ
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getCategoryColor(deduceCategory(selectedRecord))}>
                  {getCategoryLabel(deduceCategory(selectedRecord))}
                </Badge>
                <span className="text-sm text-foreground/60">
                  {new Date(selectedRecord.visit_date).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <Card className="bg-secondary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <FileText className="w-4 h-4 text-foreground/60" />
                    <div>
                      <span className="font-medium block">{selectedRecord.diagnosis}</span>
                      <span className="text-sm block text-foreground/80">{selectedRecord.treatment}</span>
                    </div>
                  </div>
                  {selectedRecord.vet_id && (
                    <div className="flex items-center gap-2 text-foreground/70">
                      <User className="w-4 h-4" />
                      <span>{selectedRecord.vet_id.full_name || "Bác sĩ thú y"}</span>
                    </div>
                  )}
                  {selectedRecord.cost && (
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatPrice(selectedRecord.cost)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedRecord.notes && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-foreground/60 mb-1">Ghi chú</p>
                    <p className="text-foreground">{selectedRecord.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Attachments */}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-foreground/60 mb-2">Tệp đính kèm</p>
                    <div className="space-y-2">
                      {selectedRecord.attachments.map((file: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                          <Paperclip className="w-4 h-4 text-foreground/60" />
                          <span className="text-sm text-foreground flex-1">
                            {typeof file === 'string' ? file : 'Tài liệu ' + (index + 1)}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

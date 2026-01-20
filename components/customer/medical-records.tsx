"use client"

import { useState } from "react"
import { usePets, useMedicalRecords } from "@/lib/hooks"
import { petsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Calendar,
  Syringe,
  Stethoscope,
  Scissors,
  Heart,
  ChevronLeft,
  Download,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pill,
  ImageIcon,
  XCircle,
  HelpCircle,
  MessageSquare
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

  const { data: records, isLoading: recordsLoading, refetch: refetchRecords } = useMedicalRecords(effectivePetId || "")

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "reject" | "revision" | null; recordId: string | null }>({
    open: false,
    type: null,
    recordId: null
  })
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedPet = pets?.find((p) => p._id === effectivePetId)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case "VACCINATION": return <Syringe className="w-5 h-5" />;
      case "EXAMINATION": return <Stethoscope className="w-5 h-5" />;
      case "TREATMENT": return <Pill className="w-5 h-5" />;
      case "SURGERY": return <Scissors className="w-5 h-5" />;
      case "DEWORMING": return <Heart className="w-5 h-5" />;
      case "CHECKUP": return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  }

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case "VACCINATION": return "Tiêm phòng";
      case "EXAMINATION": return "Khám bệnh";
      case "TREATMENT": return "Điều trị";
      case "SURGERY": return "Phẫu thuật";
      case "DEWORMING": return "Tẩy giun";
      case "CHECKUP": return "Khám định kỳ";
      default: return "Khác";
    }
  }

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case "VACCINATION": return "bg-blue-100 text-blue-700";
      case "EXAMINATION": return "bg-purple-100 text-purple-700";
      case "TREATMENT": return "bg-orange-100 text-orange-700";
      case "SURGERY": return "bg-red-100 text-red-700";
      case "DEWORMING": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  }

  const handleAction = async (action: "confirm" | "reject" | "request_revision", recordId: string, feedbackText?: string) => {
    if (!effectivePetId) return;
    setIsSubmitting(true);
    try {
      const res = await petsAPI.confirmMedicalRecord(effectivePetId, recordId, action, feedbackText);
      if (res.success) {
        refetchRecords();
        setSelectedRecord(null);
        setActionDialog({ open: false, type: null, recordId: null });
        setFeedback("");
      } else {
        alert(res.message);
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
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
      </div>

      {/* Pet Quick Info */}
      <Card className="bg-gradient-to-r from-secondary to-muted">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-card bg-secondary flex-shrink-0">
                <Image
                  src={selectedPet.image?.url || "/placeholder.svg"}
                  alt={selectedPet.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{selectedPet.name}</h2>
                <p className="text-foreground/70 text-sm truncate">
                  {selectedPet.breed || "Không rõ giống"} • {selectedPet.species}
                </p>
              </div>
            </div>

            {/* Pet Selector Dropdown - Full width on mobile */}
            <select
              value={selectedPet._id}
              onChange={(e) => onSelectPet(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm w-full sm:w-auto sm:max-w-[200px]"
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

      <div className="space-y-4">
        {recordsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {(!records || records.length === 0) ? (
              <Card className="bg-secondary/30">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
                  <p className="text-foreground/60">Chưa có hồ sơ y tế nào</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* PENDING Records need attention */}
                {records.filter((r: any) => r.confirmation_status === "PENDING").map((record: any) => (
                  <Card key={record._id} className="border-orange-200 bg-orange-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-orange-200 text-orange-800 text-xs font-bold rounded-bl-xl">
                      Cần xác nhận
                    </div>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getRecordTypeColor(record.record_type)}`}>
                          {getRecordTypeIcon(record.record_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-white/50">{getRecordTypeLabel(record.record_type)}</Badge>
                            <span className="text-sm text-foreground/60">{new Date(record.visit_date).toLocaleDateString("vi-VN")}</span>
                          </div>
                          <h4 className="font-bold text-lg">{record.diagnosis}</h4>
                          <p className="text-sm text-foreground/70 mb-2">
                            {record.vet_id ? (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                BS. {record.vet_id.full_name} ({record.vet_id.merchant_profile?.shop_name})
                              </span>
                            ) : "Phòng khám thú y"}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={() => setSelectedRecord(record)} className="rounded-lg w-full sm:w-auto">Xem chi tiết & Xác nhận</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Other Records */}
                {records.filter((r: any) => r.confirmation_status !== "PENDING").map((record: any) => (
                  <Card
                    key={record._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getRecordTypeColor(record.record_type)}`}>
                          {getRecordTypeIcon(record.record_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className={`${getRecordTypeColor(record.record_type)} bg-opacity-20`}>{getRecordTypeLabel(record.record_type)}</Badge>
                              <span className="text-sm text-foreground/50 whitespace-nowrap">{new Date(record.visit_date).toLocaleDateString("vi-VN")}</span>
                            </div>
                            {record.confirmation_status === "NEEDS_REVISION" && (
                              <Badge variant="destructive" className="bg-orange-100 text-orange-700 hover:bg-orange-200">Đã yêu cầu sửa</Badge>
                            )}
                            {record.confirmation_status === "REJECTED" && (
                              <Badge variant="destructive">Đã từ chối</Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-foreground truncate">{record.diagnosis}</h4>
                          {record.treatment && <p className="text-sm text-foreground/70 line-clamp-1">{record.treatment}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Record Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="w-[95vw] max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRecord && getRecordTypeIcon(selectedRecord.record_type)}
              Chi tiết hồ sơ
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && new Date(selectedRecord.visit_date).toLocaleDateString("vi-VN")}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              {/* Status Banner */}
              {selectedRecord.confirmation_status === "PENDING" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Cần xác nhận</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Phòng khám đã tạo hồ sơ này. Vui lòng xác nhận thông tin là chính xác.
                    </p>
                  </div>
                </div>
              )}

              {/* Main Info */}
              <Card className="bg-secondary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-foreground/60">Chẩn đoán</p>
                      <p className="font-medium">{selectedRecord.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">Tình trạng</p>
                      <p className="font-medium">{selectedRecord.condition || "Không ghi nhận"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-foreground/60">Phương pháp điều trị</p>
                    <p className="font-medium">{selectedRecord.treatment || "Không có"}</p>
                  </div>

                  {selectedRecord.vet_id && (
                    <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-foreground/50" />
                        <span className="font-medium">{selectedRecord.vet_id.full_name}</span>
                      </div>
                      <span className="text-foreground/60 hidden sm:inline">-</span>
                      <span className="text-foreground/60">{selectedRecord.vet_id.merchant_profile?.shop_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vaccines */}
              {selectedRecord.vaccines && selectedRecord.vaccines.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-foreground/70 flex items-center gap-2"><Syringe className="w-4 h-4" /> Vaccine</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.vaccines.map((v: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-foreground/70 flex items-center gap-2"><Pill className="w-4 h-4" /> Đơn thuốc</h4>
                  <div className="space-y-2">
                    {selectedRecord.medications.map((med: any, i: number) => (
                      <div key={i} className="bg-secondary/50 p-2 rounded-lg text-sm">
                        <div className="font-bold">{med.name}</div>
                        <div className="text-foreground/70">{med.dosage} - {med.frequency} {med.duration_days ? `(${med.duration_days} ngày)` : ""}</div>
                        {med.notes && <div className="text-xs italic mt-1 text-foreground/50">{med.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow up */}
              {selectedRecord.follow_up_date && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Tái khám: {new Date(selectedRecord.follow_up_date).toLocaleDateString("vi-VN")}</p>
                    {selectedRecord.follow_up_notes && <p className="text-sm text-blue-700">{selectedRecord.follow_up_notes}</p>}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/70">Ghi chú thêm</p>
                  <p className="text-sm bg-secondary/30 p-3 rounded-xl">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Attachments */}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground/70 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Hình ảnh đính kèm</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedRecord.attachments.map((file: any, index: number) => (
                      <div key={file.public_id || index} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                        <Image src={file.url} alt="Attachment" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Feedback if any */}
              {(selectedRecord.confirmation_status === "REJECTED" || selectedRecord.confirmation_status === "NEEDS_REVISION") && selectedRecord.customer_feedback && (
                <div className="bg-red-50 p-3 rounded-xl">
                  <p className="text-sm font-bold text-red-800 mb-1">Phản hồi của bạn:</p>
                  <p className="text-sm text-red-700">{selectedRecord.customer_feedback}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            {selectedRecord?.confirmation_status === "PENDING" ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setActionDialog({ open: true, type: "revision", recordId: selectedRecord._id })}>
                  Yêu cầu sửa
                </Button>
                <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => setActionDialog({ open: true, type: "reject", recordId: selectedRecord._id })}>
                  Từ chối
                </Button>
                <Button className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction("confirm", selectedRecord._id)}>
                  Xác nhận đúng
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setSelectedRecord(null)}>Đóng</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Reject/Revision) */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, recordId: null })}>
        <DialogContent className="w-[95vw] rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "reject" ? "Từ chối hồ sơ này" : "Yêu cầu chỉnh sửa"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "reject" ? "Vui lòng cho biết lý do từ chối hồ sơ này." : "Vui lòng ghi chú những thông tin cần chỉnh sửa cho phòng khám."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={actionDialog.type === "reject" ? "Lý do từ chối..." : "Ví dụ: Sai tên thuốc, sai ngày tái khám..."}
              className="rounded-xl min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setActionDialog({ open: false, type: null, recordId: null })}>Hủy</Button>
            <Button
              className="rounded-xl"
              disabled={!feedback.trim() || isSubmitting}
              onClick={() => actionDialog.recordId && handleAction(actionDialog.type === "reject" ? "reject" : "request_revision", actionDialog.recordId, feedback)}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Gửi phản hồi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

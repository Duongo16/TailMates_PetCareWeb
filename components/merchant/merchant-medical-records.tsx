"use client"

import { useState, useEffect } from "react"
import { useMerchantMedicalRecords, useMerchantCompletedBookings } from "@/lib/hooks"
import { petsAPI, merchantAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "@/components/ui/image-upload"
import {
    Calendar,
    Plus,
    FileText,
    Syringe,
    Stethoscope,
    Scissors,
    Heart,
    Pill,
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Edit,
    Loader2,
    PawPrint,
    CalendarDays,
    Image as ImageIcon,
} from "lucide-react"
import Image from "next/image"

// Record Type options
const RECORD_TYPES = [
    { value: "VACCINATION", label: "Tiêm phòng", icon: Syringe, color: "bg-blue-100 text-blue-700" },
    { value: "EXAMINATION", label: "Khám bệnh", icon: Stethoscope, color: "bg-purple-100 text-purple-700" },
    { value: "TREATMENT", label: "Điều trị", icon: Pill, color: "bg-orange-100 text-orange-700" },
    { value: "SURGERY", label: "Phẫu thuật", icon: Scissors, color: "bg-red-100 text-red-700" },
    { value: "DEWORMING", label: "Tẩy giun", icon: Heart, color: "bg-green-100 text-green-700" },
    { value: "CHECKUP", label: "Khám định kỳ", icon: ClipboardList, color: "bg-teal-100 text-teal-700" },
]

const CONFIRMATION_STATUS = {
    PENDING: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    CONFIRMED: { label: "Đã xác nhận", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700", icon: XCircle },
    NEEDS_REVISION: { label: "Cần sửa", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
}

export function MerchantMedicalRecords() {
    const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useMerchantMedicalRecords()
    const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useMerchantCompletedBookings()

    const [activeSubTab, setActiveSubTab] = useState("records")
    const [showAddRecord, setShowAddRecord] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingRecord, setEditingRecord] = useState<any | null>(null)

    // Form state
    const [recordForm, setRecordForm] = useState({
        record_type: "EXAMINATION",
        visit_date: new Date().toISOString().split("T")[0],
        diagnosis: "",
        treatment: "",
        condition: "",
        notes: "",
        vaccines: "",
        medications: [] as Array<{ name: string; dosage: string; frequency: string; duration_days?: number; notes?: string }>,
        follow_up_date: "",
        follow_up_notes: "",
        attachments: [] as Array<{ url: string; public_id: string }>,
    })

    const [newMedication, setNewMedication] = useState({ name: "", dosage: "", frequency: "", duration_days: "", notes: "" })

    const resetForm = () => {
        setRecordForm({
            record_type: "EXAMINATION",
            visit_date: new Date().toISOString().split("T")[0],
            diagnosis: "",
            treatment: "",
            condition: "",
            notes: "",
            vaccines: "",
            medications: [],
            follow_up_date: "",
            follow_up_notes: "",
            attachments: [],
        })
        setNewMedication({ name: "", dosage: "", frequency: "", duration_days: "", notes: "" })
        setSelectedBooking(null)
        setEditingRecord(null)
    }

    const handleAddMedication = () => {
        if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) return
        setRecordForm({
            ...recordForm,
            medications: [...recordForm.medications, {
                ...newMedication,
                duration_days: newMedication.duration_days ? Number(newMedication.duration_days) : undefined,
            }],
        })
        setNewMedication({ name: "", dosage: "", frequency: "", duration_days: "", notes: "" })
    }

    const removeMedication = (index: number) => {
        setRecordForm({
            ...recordForm,
            medications: recordForm.medications.filter((_, i) => i !== index),
        })
    }

    const handleSubmitRecord = async () => {
        if (!selectedBooking && !editingRecord) return
        if (!recordForm.diagnosis || !recordForm.record_type) {
            alert("Vui lòng nhập chẩn đoán và loại hồ sơ")
            return
        }

        setIsSubmitting(true)
        try {
            const petId = selectedBooking?.pet_id?._id || editingRecord?.pet_id?._id || editingRecord?.pet_id

            const payload = {
                record_type: recordForm.record_type,
                visit_date: recordForm.visit_date,
                diagnosis: recordForm.diagnosis,
                treatment: recordForm.treatment || undefined,
                condition: recordForm.condition || undefined,
                notes: recordForm.notes || undefined,
                vaccines: recordForm.vaccines ? recordForm.vaccines.split(",").map(v => v.trim()) : [],
                medications: recordForm.medications,
                follow_up_date: recordForm.follow_up_date || undefined,
                follow_up_notes: recordForm.follow_up_notes || undefined,
                attachments: recordForm.attachments,
                booking_id: selectedBooking?._id,
            }

            let res
            if (editingRecord) {
                res = await petsAPI.updateMedicalRecord(petId, editingRecord._id, payload)
            } else {
                res = await petsAPI.addMedicalRecord(petId, payload)
            }

            if (res.success) {
                setShowAddRecord(false)
                resetForm()
                refetchRecords()
                refetchBookings()
            } else {
                alert(res.message || "Lỗi khi lưu hồ sơ")
            }
        } catch (error) {
            alert("Lỗi khi lưu hồ sơ y tế")
        } finally {
            setIsSubmitting(false)
        }
    }

    const openAddFromBooking = (booking: any) => {
        setSelectedBooking(booking)
        setRecordForm({
            ...recordForm,
            visit_date: new Date(booking.booking_time).toISOString().split("T")[0],
        })
        setShowAddRecord(true)
    }

    const openEditRecord = (record: any) => {
        setEditingRecord(record)
        setRecordForm({
            record_type: record.record_type,
            visit_date: new Date(record.visit_date).toISOString().split("T")[0],
            diagnosis: record.diagnosis || "",
            treatment: record.treatment || "",
            condition: record.condition || "",
            notes: record.notes || "",
            vaccines: record.vaccines?.join(", ") || "",
            medications: record.medications || [],
            follow_up_date: record.follow_up_date ? new Date(record.follow_up_date).toISOString().split("T")[0] : "",
            follow_up_notes: record.follow_up_notes || "",
            attachments: record.attachments || [],
        })
        setShowAddRecord(true)
    }

    const getRecordTypeInfo = (type: string) => {
        return RECORD_TYPES.find(r => r.value === type) || RECORD_TYPES[0]
    }

    const getStatusInfo = (status: string) => {
        return CONFIRMATION_STATUS[status as keyof typeof CONFIRMATION_STATUS] || CONFIRMATION_STATUS.PENDING
    }

    const records = recordsData?.records || []
    const stats = recordsData?.stats || { pending: 0, confirmed: 0, rejected: 0, needsRevision: 0 }
    const completedBookings = bookingsData?.bookings || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Sổ Y Tế</h1>
                    <p className="text-foreground/60">Quản lý hồ sơ y tế sau khi thực hiện dịch vụ</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60">Chờ xác nhận</p>
                                <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60">Đã xác nhận</p>
                                <p className="text-xl font-bold text-green-700">{stats.confirmed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60">Cần sửa</p>
                                <p className="text-xl font-bold text-orange-700">{stats.needsRevision}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground/60">Tổng hồ sơ</p>
                                <p className="text-xl font-bold text-blue-700">{records.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                    <TabsTrigger value="records" className="rounded-lg">Hồ sơ đã tạo</TabsTrigger>
                    <TabsTrigger value="bookings" className="rounded-lg">Lịch hẹn hoàn thành</TabsTrigger>
                </TabsList>

                {/* Records Tab */}
                <TabsContent value="records" className="mt-4 space-y-4">
                    {recordsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : records.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
                                <p className="text-foreground/60">Chưa có hồ sơ y tế nào</p>
                                <p className="text-sm text-foreground/40 mt-1">Hãy chọn từ danh sách lịch hẹn hoàn thành để tạo hồ sơ</p>
                            </CardContent>
                        </Card>
                    ) : (
                        records.map((record: any) => {
                            const typeInfo = getRecordTypeInfo(record.record_type)
                            const statusInfo = getStatusInfo(record.confirmation_status)
                            const TypeIcon = typeInfo.icon
                            const StatusIcon = statusInfo.icon

                            return (
                                <Card key={record._id} className="overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl ${typeInfo.color.split(" ")[0]} flex items-center justify-center`}>
                                                    <TypeIcon className={`w-6 h-6 ${typeInfo.color.split(" ")[1]}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                                                        <Badge className={statusInfo.color}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="font-bold text-foreground">{record.diagnosis}</p>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-foreground/60">
                                                        <span className="flex items-center gap-1">
                                                            <PawPrint className="w-4 h-4" />
                                                            {record.pet_id?.name || "Thú cưng"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="w-4 h-4" />
                                                            {new Date(record.visit_date).toLocaleDateString("vi-VN")}
                                                        </span>
                                                    </div>
                                                    {record.treatment && (
                                                        <p className="text-sm text-foreground/70 mt-2">
                                                            <strong>Điều trị:</strong> {record.treatment}
                                                        </p>
                                                    )}
                                                    {record.customer_feedback && (
                                                        <p className="text-sm text-orange-600 mt-2 p-2 bg-orange-50 rounded-lg">
                                                            <strong>Phản hồi:</strong> {record.customer_feedback}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {record.confirmation_status !== "CONFIRMED" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-lg"
                                                        onClick={() => openEditRecord(record)}
                                                    >
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        Sửa
                                                    </Button>
                                                )}
                                                {record.attachments?.length > 0 && (
                                                    <Badge variant="secondary" className="rounded-lg">
                                                        <ImageIcon className="w-3 h-3 mr-1" />
                                                        {record.attachments.length} ảnh
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </TabsContent>

                {/* Completed Bookings Tab */}
                <TabsContent value="bookings" className="mt-4 space-y-4">
                    {bookingsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : completedBookings.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="w-12 h-12 mx-auto text-foreground/20 mb-4" />
                                <p className="text-foreground/60">Không có lịch hẹn hoàn thành chưa tạo hồ sơ</p>
                                <p className="text-sm text-foreground/40 mt-1">Các lịch hẹn đã có hồ sơ y tế sẽ không hiển thị ở đây</p>
                            </CardContent>
                        </Card>
                    ) : (
                        completedBookings.map((booking: any) => (
                            <Card key={booking._id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary">
                                                {booking.pet_id?.image?.url ? (
                                                    <Image
                                                        src={booking.pet_id.image.url}
                                                        alt={booking.pet_id.name}
                                                        width={48}
                                                        height={48}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <PawPrint className="w-6 h-6 text-foreground/30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{booking.pet_id?.name}</p>
                                                <p className="text-sm text-foreground/60">
                                                    {booking.pet_id?.species} - {booking.service_id?.name}
                                                </p>
                                                <p className="text-sm text-foreground/50">
                                                    {new Date(booking.booking_time).toLocaleString("vi-VN")}
                                                </p>
                                                <p className="text-xs text-foreground/40">
                                                    Khách: {booking.customer_id?.full_name}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            className="rounded-xl"
                                            onClick={() => openAddFromBooking(booking)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tạo hồ sơ
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Add/Edit Record Dialog */}
            <Dialog open={showAddRecord} onOpenChange={(open) => { if (!open) { setShowAddRecord(false); resetForm(); } else setShowAddRecord(true) }}>
                <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRecord ? "Chỉnh sửa hồ sơ y tế" : "Tạo hồ sơ y tế mới"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Pet Info */}
                        {(selectedBooking || editingRecord) && (
                            <Card className="bg-secondary/50">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <PawPrint className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="font-medium">{selectedBooking?.pet_id?.name || editingRecord?.pet_id?.name}</p>
                                            <p className="text-sm text-foreground/60">
                                                {selectedBooking?.pet_id?.species || editingRecord?.pet_id?.species}
                                                {selectedBooking?.service_id?.name && ` - ${selectedBooking.service_id.name}`}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Record Type & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Loại hồ sơ *</Label>
                                <Select
                                    value={recordForm.record_type}
                                    onValueChange={(val) => setRecordForm({ ...recordForm, record_type: val })}
                                >
                                    <SelectTrigger className="rounded-xl mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RECORD_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center gap-2">
                                                    <type.icon className="w-4 h-4" />
                                                    {type.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Ngày khám *</Label>
                                <Input
                                    type="date"
                                    value={recordForm.visit_date}
                                    onChange={(e) => setRecordForm({ ...recordForm, visit_date: e.target.value })}
                                    className="rounded-xl mt-1"
                                />
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div>
                            <Label>Chẩn đoán / Kết quả *</Label>
                            <Textarea
                                value={recordForm.diagnosis}
                                onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                                placeholder="Nhập chẩn đoán hoặc kết quả khám..."
                                className="rounded-xl mt-1"
                                rows={2}
                            />
                        </div>

                        {/* Condition */}
                        <div>
                            <Label>Tình trạng sức khỏe</Label>
                            <Input
                                value={recordForm.condition}
                                onChange={(e) => setRecordForm({ ...recordForm, condition: e.target.value })}
                                placeholder="VD: Khỏe mạnh, Cần theo dõi, Yếu..."
                                className="rounded-xl mt-1"
                            />
                        </div>

                        {/* Treatment */}
                        <div>
                            <Label>Phương pháp điều trị</Label>
                            <Textarea
                                value={recordForm.treatment}
                                onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                                placeholder="Mô tả phương pháp điều trị nếu có..."
                                className="rounded-xl mt-1"
                                rows={2}
                            />
                        </div>

                        {/* Vaccines (for vaccination type) */}
                        {recordForm.record_type === "VACCINATION" && (
                            <div>
                                <Label>Loại vaccine (cách nhau bằng dấu phẩy)</Label>
                                <Input
                                    value={recordForm.vaccines}
                                    onChange={(e) => setRecordForm({ ...recordForm, vaccines: e.target.value })}
                                    placeholder="VD: Vaccine 5 bệnh, Dại, ..."
                                    className="rounded-xl mt-1"
                                />
                            </div>
                        )}

                        {/* Medications */}
                        <div className="space-y-3">
                            <Label>Đơn thuốc</Label>
                            {recordForm.medications.length > 0 && (
                                <div className="space-y-2">
                                    {recordForm.medications.map((med, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-xl text-sm">
                                            <Pill className="w-4 h-4 text-primary" />
                                            <span className="flex-1">
                                                <strong>{med.name}</strong> - {med.dosage}, {med.frequency}
                                                {med.duration_days && ` (${med.duration_days} ngày)`}
                                            </span>
                                            <Button size="sm" variant="ghost" onClick={() => removeMedication(idx)}>
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="grid grid-cols-4 gap-2">
                                <Input
                                    placeholder="Tên thuốc"
                                    value={newMedication.name}
                                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                                    className="rounded-xl"
                                />
                                <Input
                                    placeholder="Liều lượng"
                                    value={newMedication.dosage}
                                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                                    className="rounded-xl"
                                />
                                <Input
                                    placeholder="Tần suất"
                                    value={newMedication.frequency}
                                    onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                                    className="rounded-xl"
                                />
                                <Button type="button" variant="outline" onClick={handleAddMedication} className="rounded-xl">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Follow-up */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Ngày hẹn tái khám</Label>
                                <Input
                                    type="date"
                                    value={recordForm.follow_up_date}
                                    onChange={(e) => setRecordForm({ ...recordForm, follow_up_date: e.target.value })}
                                    className="rounded-xl mt-1"
                                />
                            </div>
                            <div>
                                <Label>Ghi chú tái khám</Label>
                                <Input
                                    value={recordForm.follow_up_notes}
                                    onChange={(e) => setRecordForm({ ...recordForm, follow_up_notes: e.target.value })}
                                    placeholder="VD: Tiêm mũi 2, Tái khám nếu còn triệu chứng..."
                                    className="rounded-xl mt-1"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label>Ghi chú thêm</Label>
                            <Textarea
                                value={recordForm.notes}
                                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                                placeholder="Ghi chú thêm cho chủ nuôi..."
                                className="rounded-xl mt-1"
                                rows={2}
                            />
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <Label>Hình ảnh đính kèm (giấy khám bệnh, hình ảnh...)</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {recordForm.attachments.map((att, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                                        <Image src={att.url} alt={`Attachment ${idx + 1}`} fill className="object-cover" />
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-1 right-1 w-6 h-6"
                                            onClick={() => setRecordForm({
                                                ...recordForm,
                                                attachments: recordForm.attachments.filter((_, i) => i !== idx)
                                            })}
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {recordForm.attachments.length < 5 && (
                                    <ImageUpload
                                        label=""
                                        value=""
                                        onChange={(url, publicId) => {
                                            if (url) {
                                                setRecordForm({
                                                    ...recordForm,
                                                    attachments: [...recordForm.attachments, { url, public_id: publicId || `att_${Date.now()}` }]
                                                })
                                            }
                                        }}
                                        className="aspect-square"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            className="w-full rounded-xl py-6"
                            onClick={handleSubmitRecord}
                            disabled={isSubmitting || !recordForm.diagnosis}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : editingRecord ? (
                                "Cập nhật hồ sơ"
                            ) : (
                                "Tạo hồ sơ y tế"
                            )}
                        </Button>

                        {!editingRecord && (
                            <p className="text-xs text-center text-foreground/50">
                                * Hồ sơ sẽ được gửi đến chủ nuôi để xác nhận
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

"use client"

import { useState, useEffect, useMemo } from "react"
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
    Search,
    Eye,
    Trash2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    User,
    Phone,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    const [selectedRecordDetail, setSelectedRecordDetail] = useState<any | null>(null)

    // Filter & Pagination States
    const [recordStatusFilter, setRecordStatusFilter] = useState("ALL")
    const [recordTypeFilter, setRecordTypeFilter] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

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

    // Filtering Logic
    const filteredRecords = useMemo(() => {
        return records.filter((record: any) => {
            const matchesStatus = recordStatusFilter === "ALL" || record.confirmation_status === recordStatusFilter
            const matchesType = recordTypeFilter === "ALL" || record.record_type === recordTypeFilter
            const matchesSearch = !searchQuery ||
                record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.pet_id?.name?.toLowerCase().includes(searchQuery.toLowerCase())

            return matchesStatus && matchesType && matchesSearch
        })
    }, [records, recordStatusFilter, recordTypeFilter, searchQuery])

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [filteredRecords, currentPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [recordStatusFilter, recordTypeFilter, searchQuery])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Sổ Y Tế</h1>
                    <p className="text-foreground/60">Quản lý hồ sơ y tế sau khi thực hiện dịch vụ</p>
                </div>
            </div>

            {/* Gradient Status Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                    { label: "Tất cả", value: "ALL", count: records.length, color: "bg-blue-50 text-blue-700 border-blue-200", icon: FileText, gradient: "from-blue-50 to-blue-100" },
                    { label: "Lịch hẹn hoàn thành", value: "COMPLETED_BOOKINGS", count: completedBookings.length, color: "bg-violet-50 text-violet-700 border-violet-200", icon: Calendar, gradient: "from-violet-50 to-violet-100", customAction: () => setActiveSubTab("bookings") },
                    { label: "Chờ xác nhận", value: "PENDING", count: stats.pending, color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock, gradient: "from-yellow-50 to-yellow-100" },
                    { label: "Đã xác nhận", value: "CONFIRMED", count: stats.confirmed, color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2, gradient: "from-green-50 to-green-100" },
                    { label: "Cần sửa", value: "NEEDS_REVISION", count: stats.needsRevision, color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle, gradient: "from-orange-50 to-orange-100" },
                    { label: "Từ chối", value: "REJECTED", count: stats.rejected, color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, gradient: "from-red-50 to-red-100" },
                ].map((status) => (
                    <div
                        key={status.value}
                        onClick={() => {
                            if ('customAction' in status && status.customAction) {
                                status.customAction()
                            } else {
                                setRecordStatusFilter(status.value)
                                setActiveSubTab("records")
                            }
                        }}
                        className={`
                            cursor-pointer rounded-2xl p-4 border transition-all duration-300
                            bg-gradient-to-r ${status.gradient}
                            ${(recordStatusFilter === status.value && activeSubTab === "records") || (status.value === "COMPLETED_BOOKINGS" && activeSubTab === "bookings") ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md" : "hover:scale-105 hover:shadow-sm opacity-80 hover:opacity-100"}
                        `}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm ${status.color.split(" ")[1]}`}>
                                <status.icon className="w-5 h-5" />
                            </div>
                            {((recordStatusFilter === status.value && activeSubTab === "records") || (status.value === "COMPLETED_BOOKINGS" && activeSubTab === "bookings")) && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground/70">{status.label}</p>
                            <p className="text-2xl font-bold text-foreground">{status.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                {/* Records Tab */}
                <TabsContent value="records" className="mt-4 space-y-4">
                    {/* Records Filter Header */}
                    <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm thú cưng hoặc chẩn đoán..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-xl"
                            />
                        </div>
                        <div className="w-[180px]">
                            <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Loại hồ sơ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả loại</SelectItem>
                                    {RECORD_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-muted-foreground">THÚ CƯNG</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">LOẠI HỒ SƠ</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">NGÀY KHÁM</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">CHẨN ĐOÁN</TableHead>
                                    <TableHead className="text-center font-semibold text-muted-foreground">TRẠNG THÁI</TableHead>
                                    <TableHead className="text-right font-semibold text-muted-foreground pr-6">THAO TÁC</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recordsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            Không tìm thấy hồ sơ nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedRecords.map((record: any) => {
                                        const typeInfo = getRecordTypeInfo(record.record_type)
                                        const statusInfo = getStatusInfo(record.confirmation_status)
                                        const TypeIcon = typeInfo.icon

                                        return (
                                            <TableRow key={record._id} className="hover:bg-muted/50 transition-colors group">
                                                <TableCell className="py-4 font-medium text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                                                            {record.pet_id?.image?.url ? (
                                                                <Image src={record.pet_id.image.url} alt="" width={32} height={32} className="object-cover" />
                                                            ) : (
                                                                <PawPrint className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        {record.pet_id?.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${typeInfo.color.split(" ")[0]}`}>
                                                            <TypeIcon className={`w-3.5 h-3.5 ${typeInfo.color.split(" ")[1]}`} />
                                                        </div>
                                                        <span className="text-sm font-medium">{typeInfo.label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-muted-foreground">
                                                    {new Date(record.visit_date).toLocaleDateString("vi-VN")}
                                                </TableCell>
                                                <TableCell className="py-4 max-w-[200px] truncate" title={record.diagnosis}>
                                                    {record.diagnosis}
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <Badge className={`${statusInfo.color} font-normal border-none`}>
                                                        {statusInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="rounded-lg h-8 w-8 hover:bg-primary/5 hover:text-primary transition-colors"
                                                            onClick={() => setSelectedRecordDetail(record)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {record.confirmation_status !== "CONFIRMED" && (
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="rounded-lg h-8 w-8 hover:bg-primary/5 hover:text-primary transition-colors"
                                                                onClick={() => openEditRecord(record)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-end p-4 gap-2 border-t text-sm">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-lg h-8"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-foreground/60">
                                    Trang {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg h-8"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </Card>
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
                                        onChange={(image) => {
                                            if (image?.url) {
                                                setRecordForm({
                                                    ...recordForm,
                                                    attachments: [...recordForm.attachments, { url: image.url, public_id: image.public_id || `att_${Date.now()}` }]
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
            {/* Record Detail View Modal */}
            <Dialog open={!!selectedRecordDetail} onOpenChange={() => setSelectedRecordDetail(null)}>
                <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Chi tiết hồ sơ y tế
                        </DialogTitle>
                    </DialogHeader>

                    {selectedRecordDetail && (
                        <div className="space-y-6">
                            {/* Status and Date Header */}
                            <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${getRecordTypeInfo(selectedRecordDetail.record_type).color.split(" ")[0]}`}>
                                        {(() => {
                                            const TypeIcon = getRecordTypeInfo(selectedRecordDetail.record_type).icon
                                            return <TypeIcon className={`w-5 h-5 ${getRecordTypeInfo(selectedRecordDetail.record_type).color.split(" ")[1]}`} />
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground/60">Loại hồ sơ</p>
                                        <p className="font-bold">{getRecordTypeInfo(selectedRecordDetail.record_type).label}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-foreground/60">Ngày khám</p>
                                    <p className="font-bold">{new Date(selectedRecordDetail.visit_date).toLocaleDateString("vi-VN")}</p>
                                </div>
                            </div>

                            {/* Pet and Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="border-none bg-blue-50/50 rounded-2xl">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden">
                                            {selectedRecordDetail.pet_id?.image?.url ? (
                                                <Image src={selectedRecordDetail.pet_id.image.url} alt="" width={40} height={40} className="object-cover" />
                                            ) : (
                                                <PawPrint className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Thú cưng</p>
                                            <p className="font-bold text-blue-900">{selectedRecordDetail.pet_id?.name}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none bg-purple-50/50 rounded-2xl">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Chủ nuôi</p>
                                            <p className="font-bold text-purple-900 truncate max-w-[150px]">
                                                {selectedRecordDetail.pet_id?.owner_id?.full_name || "Khách hàng"}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Clinical Info */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground/40 uppercase tracking-widest mb-2">Thông tin lâm sàng</h3>
                                    <div className="bg-card border rounded-2xl p-4 space-y-3">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Chẩn đoán / Kết quả</Label>
                                            <p className="text-foreground font-medium">{selectedRecordDetail.diagnosis}</p>
                                        </div>
                                        {selectedRecordDetail.treatment && (
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Phương pháp điều trị</Label>
                                                <p className="text-foreground">{selectedRecordDetail.treatment}</p>
                                            </div>
                                        )}
                                        {selectedRecordDetail.condition && (
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Tình trạng sức khỏe</Label>
                                                <Badge variant="outline" className="mt-1">{selectedRecordDetail.condition}</Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Medications */}
                                {selectedRecordDetail.medications?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground/40 uppercase tracking-widest mb-2">Đơn thuốc</h3>
                                        <div className="space-y-2">
                                            {selectedRecordDetail.medications.map((med: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl border-l-4 border-primary">
                                                    <Pill className="w-4 h-4 text-primary" />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm">{med.name}</p>
                                                        <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency} • {med.duration_days} ngày</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Attachments */}
                                {selectedRecordDetail.attachments?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground/40 uppercase tracking-widest mb-2">Hình ảnh đính kèm</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedRecordDetail.attachments.map((att: any, i: number) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary border group cursor-pointer">
                                                    <Image src={att.url} alt="" fill className="object-cover transition-transform group-hover:scale-110" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Follow up */}
                                {selectedRecordDetail.follow_up_date && (
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
                                        <CalendarDays className="w-5 h-5 text-orange-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-orange-800">Hẹn tái khám</p>
                                            <p className="text-sm text-orange-700">
                                                Ngày: {new Date(selectedRecordDetail.follow_up_date).toLocaleDateString("vi-VN")}
                                            </p>
                                            {selectedRecordDetail.follow_up_notes && (
                                                <p className="text-xs text-orange-600 mt-1 italic">"{selectedRecordDetail.follow_up_notes}"</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Merchant Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    className="flex-1 rounded-xl"
                                    onClick={() => setSelectedRecordDetail(null)}
                                >
                                    Đóng
                                </Button>
                                {selectedRecordDetail.confirmation_status !== "CONFIRMED" && (
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl"
                                        onClick={() => {
                                            openEditRecord(selectedRecordDetail)
                                            setSelectedRecordDetail(null)
                                        }}
                                    >
                                        Chỉnh sửa
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

import { useState, useEffect } from "react"
import { transactionsAPI } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Coins,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Transaction {
  _id: string
  type: "TOP_UP" | "SUBSCRIPTION" | "ORDER"
  amount: number
  transaction_code: string
  status: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED"
  created_at: string
}

interface PaginationData {
  total: number
  page: number
  limit: number
  pages: number
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters & Pagination State
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const limit = 6

  useEffect(() => {
    fetchTransactions()
  }, [typeFilter, statusFilter, currentPage])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const params: any = { 
        page: currentPage, 
        limit 
      }
      
      if (typeFilter !== "all") params.type = typeFilter
      if (statusFilter !== "all") params.status = statusFilter

      const result = await transactionsAPI.list(params)
      if (result.success && result.data) {
        setTransactions(result.data.transactions)
        setPagination(result.data.pagination)
      } else {
        setError(result.message || "Không thể tải lịch sử giao dịch")
      }
    } catch (err) {
      setError("Lỗi kết nối API")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetFilters = () => {
    setTypeFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "PENDING": return <Clock className="w-4 h-4 text-yellow-500" />
      case "FAILED": return <XCircle className="w-4 h-4 text-red-500" />
      case "EXPIRED": return <AlertCircle className="w-4 h-4 text-slate-400" />
      default: return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUCCESS": return "Thành công"
      case "PENDING": return "Chờ xử lý"
      case "FAILED": return "Thất bại"
      case "EXPIRED": return "Hết hạn"
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "TOP_UP": return "Nạp TM"
      case "SUBSCRIPTION": return "Đăng ký gói"
      case "ORDER": return "Thanh toán đơn hàng"
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Lịch sử giao dịch</h2>
            <p className="text-muted-foreground">Theo dõi tất cả hoạt động nạp và sử dụng TM của bạn</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTransactions} 
            className="bg-card w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Làm mới
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground/70 uppercase tracking-wider mr-2">
            <FilterIcon className="w-4 h-4" />
            Bộ lọc:
          </div>
          
          <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[180px] bg-card/50 border-none shadow-sm">
              <SelectValue placeholder="Loại giao dịch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giao dịch</SelectItem>
              <SelectItem value="TOP_UP">Nạp tiền TM</SelectItem>
              <SelectItem value="SUBSCRIPTION">Đăng ký gói</SelectItem>
              <SelectItem value="ORDER">Mua sắm / Dịch vụ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px] bg-card/50 border-none shadow-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="SUCCESS">Thành công</SelectItem>
              <SelectItem value="PENDING">Đang chờ</SelectItem>
              <SelectItem value="FAILED">Thất bại</SelectItem>
              <SelectItem value="EXPIRED">Hết hạn</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== "all" || statusFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-muted-foreground hover:text-primary">
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden min-h-[400px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b border-border/50">
                  <th className="px-6 py-4">Giao dịch</th>
                  <th className="px-6 py-4">Mã giao dịch</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Số tiền (TM)</th>
                  <th className="px-6 py-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 relative">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={5} className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                          <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : transactions.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key="empty"
                    >
                      <td colSpan={5} className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Coins className="w-12 h-12" />
                          <p className="font-bold uppercase tracking-widest text-sm text-foreground">Không tìm thấy giao dịch nào</p>
                          <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">Bạn có thể thử thay đổi bộ lọc hoặc nạp tiền để bắt đầu sử dụng</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    transactions.map((tx, idx) => {
                      const isPositive = tx.type === "TOP_UP";
                      return (
                        <motion.tr 
                          key={tx._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group hover:bg-primary/5 transition-colors cursor-default"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                                isPositive ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                              )}>
                                {isPositive ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">{getTypeLabel(tx.type)}</p>
                                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">TM Balance Update</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="bg-secondary/50 px-2 py-1 rounded text-[11px] font-mono font-bold text-foreground/70">
                              {tx.transaction_code}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-foreground/70">
                              {(() => {
                                const date = tx.created_at ? new Date(tx.created_at) : null;
                                const isValid = date && !isNaN(date.getTime());
                                if (!isValid) return <p className="text-muted-foreground opacity-50 italic">N/A</p>;
                                return (
                                  <>
                                    <p>{format(date, "dd/MM/yyyy", { locale: vi })}</p>
                                    <p className="text-[10px] opacity-60">{format(date, "HH:mm:ss", { locale: vi })}</p>
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "text-sm font-black",
                              isPositive ? "text-green-600" : "text-foreground"
                            )}>
                              {isPositive ? "+" : "-"}{tx.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-bold text-foreground/70">{getStatusLabel(tx.status)}</span>
                              {getStatusIcon(tx.status)}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Hiển thị <span className="text-foreground">{(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, pagination.total)}</span> của <span className="text-foreground">{pagination.total}</span> giao dịch
          </p>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg bg-card border-none shadow-sm hover:text-primary transition-all disabled:opacity-30"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              {[...Array(pagination.pages)].map((_, i) => {
                const pageNum = i + 1;
                // Only show 5 pages around current
                if (
                  pagination.pages > 7 && 
                  pageNum !== 1 && 
                  pageNum !== pagination.pages && 
                  Math.abs(pageNum - currentPage) > 2
                ) {
                  if (Math.abs(pageNum - currentPage) === 3) return <span key={pageNum} className="text-muted-foreground px-1">...</span>
                  return null;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "w-8 h-8 rounded-lg transition-all text-xs font-black",
                      currentPage === pageNum ? "shadow-md shadow-primary/20" : "hover:text-primary"
                    )}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg bg-card border-none shadow-sm hover:text-primary transition-all disabled:opacity-30"
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages || isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {transactions.length > 0 && (!pagination || pagination.pages === 1) && (
        <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">
          Đã hiển thị tất cả giao dịch gần nhất
        </p>
      )}
    </div>
  )
}

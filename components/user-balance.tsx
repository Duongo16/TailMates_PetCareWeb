"use client"

import { useAuth } from "@/lib/auth-context"
import { Coins, Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface UserBalanceProps {
  className?: string
  showAdd?: boolean
}

export function UserBalance({ className, showAdd = true }: UserBalanceProps) {
  const { user } = useAuth()
  
  if (!user || !["customer", "merchant"].includes(user.role)) return null

  const balance = (user as any).tm_balance || 0

  return (
    <div className={cn("flex items-center", className)}>
      <Link href="/top-up">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900/5 border border-slate-200/50 hover:bg-slate-900/10 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
              <Coins className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[12px] font-black text-slate-900 tracking-tight">
                {balance.toLocaleString()}
              </span>
              <span className="text-[8px] font-black text-yellow-600 opacity-90 uppercase tracking-tighter">TM</span>
            </div>
          </div>
          
          {showAdd && (
            <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-400 group-hover:bg-yellow-400 group-hover:text-white group-hover:border-yellow-400 transition-all">
              <Plus className="w-2 h-2" />
            </div>
          )}
        </motion.div>
      </Link>
    </div>
  )
}

"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Home, Users, Search, Bell, Menu, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function SocialNavbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()

  const navItems = [
    { label: "Bảng tin", icon: Home, href: "/social" },
    { label: "Bạn bè", icon: Users, href: "/social/friends" },
    { label: "Trang cá nhân", icon: User, href: `/social/profile/${user?.id}` },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border px-4 h-16">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between gap-4">
        {/* Logo & Search */}
        <div className="flex items-center gap-4 flex-1 lg:flex-none">
          <Link href="/" className="flex items-center gap-2 group">
            <Image 
              src="/images/logo-ngang.png" 
              alt="TailMates" 
              width={120} 
              height={40} 
              className="h-10 w-auto" 
            />
          </Link>

          <div className="hidden md:flex items-center relative ml-4 max-w-xs w-full lg:w-64">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Tìm bạn bè, bài viết..." 
              className="w-full bg-secondary border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
            />
          </div>
        </div>

        {/* Center Nav Items */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-md">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all",
                pathname === item.href 
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/5" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground lg:hidden">
            <Search className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" className="group relative rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-[10px] text-primary-foreground rounded-full border-2 border-card flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

          <Link href={`/social/profile/${user?.id}`} className="group flex items-center gap-2">
            <Avatar className="w-9 h-9 border-2 border-transparent group-hover:border-primary/20 transition-all shadow-sm">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs uppercase">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:block">
              <p className="text-xs font-bold text-foreground leading-none">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-1">Cá nhân</p>
            </div>
          </Link>

          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

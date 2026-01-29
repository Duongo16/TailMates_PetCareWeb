"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

    // Toggle visibility
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener("scroll", toggleVisibility, { passive: true })
        return () => window.removeEventListener("scroll", toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    // Gradient and Glow styles matching "Magic Button"
                    className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-[100] p-3 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:shadow-[0_0_30px_rgba(249,115,22,0.8)] backdrop-blur-sm border border-white/20 transition-all duration-300"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="w-6 h-6" strokeWidth={3} />
                </motion.button>
            )}
        </AnimatePresence>
    )
}

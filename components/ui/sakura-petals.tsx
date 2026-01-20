"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Petal {
    id: number
    x: number
    delay: number
    duration: number
    size: number
    rotation: number
    opacity: number
    variant: number // Different petal shapes
}

interface SakuraPetalsProps {
    count?: number
    enabled?: boolean
}

export function SakuraPetals({ count = 20, enabled = true }: SakuraPetalsProps) {
    const [petals, setPetals] = useState<Petal[]>([])

    useEffect(() => {
        if (!enabled) {
            setPetals([])
            return
        }

        const generatePetals = () => {
            const newPetals: Petal[] = []
            for (let i = 0; i < count; i++) {
                newPetals.push({
                    id: i,
                    x: Math.random() * 100,
                    delay: Math.random() * 8,
                    duration: 6 + Math.random() * 8,
                    size: 12 + Math.random() * 14,
                    rotation: Math.random() * 360,
                    opacity: 0.3 + Math.random() * 0.4,
                    variant: Math.floor(Math.random() * 3),
                })
            }
            setPetals(newPetals)
        }

        generatePetals()
        const interval = setInterval(generatePetals, 12000)
        return () => clearInterval(interval)
    }, [count, enabled])

    if (!enabled) return null

    // Realistic sakura petal SVG paths
    const petalPaths = [
        // Classic 5-petal sakura shape (single petal)
        "M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z",
        // Rounded teardrop petal
        "M12 3C8 5 6 10 8 15C10 20 12 22 12 22C12 22 14 20 16 15C18 10 16 5 12 3Z",
        // Pointed sakura petal
        "M12 2C9 4 7 9 8 14C9 19 12 23 12 23C12 23 15 19 16 14C17 9 15 4 12 2Z",
    ]

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {petals.map((petal) => (
                    <motion.div
                        key={`${petal.id}-${Math.random()}`}
                        className="absolute"
                        initial={{
                            x: `${petal.x}vw`,
                            y: -30,
                            rotate: petal.rotation,
                            opacity: 0,
                        }}
                        animate={{
                            y: "105vh",
                            x: [
                                `${petal.x}vw`,
                                `${petal.x + (Math.random() * 15 - 7.5)}vw`,
                                `${petal.x + (Math.random() * 15 - 7.5)}vw`,
                                `${petal.x + (Math.random() * 10 - 5)}vw`,
                            ],
                            rotate: [
                                petal.rotation,
                                petal.rotation + 90,
                                petal.rotation + 180,
                                petal.rotation + 270,
                                petal.rotation + 360,
                            ],
                            rotateY: [0, 180, 0, 180, 0],
                            opacity: [0, petal.opacity, petal.opacity, petal.opacity * 0.5, 0],
                        }}
                        transition={{
                            duration: petal.duration,
                            delay: petal.delay,
                            ease: "linear",
                            x: {
                                duration: petal.duration,
                                ease: [0.45, 0.05, 0.55, 0.95],
                                times: [0, 0.3, 0.6, 1],
                            },
                            rotate: {
                                duration: petal.duration,
                                ease: "linear",
                            },
                            rotateY: {
                                duration: petal.duration * 0.8,
                                ease: "easeInOut",
                                repeat: 2,
                            },
                        }}
                        style={{
                            width: petal.size,
                            height: petal.size * 1.2,
                            transformStyle: "preserve-3d",
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-full h-full"
                            style={{
                                filter: "drop-shadow(0 1px 2px rgba(255, 150, 170, 0.4))",
                            }}
                        >
                            <defs>
                                {/* Realistic sakura gradient */}
                                <linearGradient id={`sakuraGrad-${petal.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFEEF2" />
                                    <stop offset="30%" stopColor="#FFD4DC" />
                                    <stop offset="60%" stopColor="#FFAFC2" />
                                    <stop offset="100%" stopColor="#FF8FA3" />
                                </linearGradient>
                                {/* Inner glow */}
                                <radialGradient id={`sakuraInner-${petal.id}`} cx="40%" cy="30%">
                                    <stop offset="0%" stopColor="#FFF5F7" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#FFD4DC" stopOpacity="0" />
                                </radialGradient>
                            </defs>

                            {/* Main petal */}
                            <path
                                d={petalPaths[petal.variant]}
                                fill={`url(#sakuraGrad-${petal.id})`}
                                stroke="#FFAFC2"
                                strokeWidth="0.3"
                            />

                            {/* Inner highlight */}
                            <ellipse
                                cx="12"
                                cy="10"
                                rx="2.5"
                                ry="4"
                                fill={`url(#sakuraInner-${petal.id})`}
                            />

                            {/* Vein line (subtle) */}
                            <path
                                d="M12 5 Q11 12 12 20"
                                fill="none"
                                stroke="#FFCDD8"
                                strokeWidth="0.4"
                                opacity="0.5"
                            />
                        </svg>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

"use client"

import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion"
import { forwardRef, ReactNode } from "react"
import {
    pageVariants,
    pageFadeVariants,
    cardVariants,
    cardHoverVariants,
    staggerContainerVariants,
    staggerItemVariants,
    modalVariants,
    buttonVariants,
    slideInFromBottom,
} from "@/lib/animations"
import { cn } from "@/lib/utils"

// ==================== Page Transition ====================

interface PageTransitionProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    className?: string
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
PageTransition.displayName = "PageTransition"

// ==================== Fade In ====================

interface FadeInProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    delay?: number
    duration?: number
    className?: string
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
    ({ children, delay = 0, duration = 0.4, className, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration, ease: "easeOut" }}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
FadeIn.displayName = "FadeIn"

// ==================== Animated Card ====================

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    className?: string
    hoverEffect?: boolean
    delay?: number
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
    ({ children, className, hoverEffect = true, delay = 0, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                variants={hoverEffect ? cardHoverVariants : cardVariants}
                initial="rest"
                animate="rest"
                whileHover={hoverEffect ? "hover" : undefined}
                whileTap={hoverEffect ? "tap" : undefined}
                transition={{ delay }}
                className={cn("cursor-pointer", className)}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
AnimatedCard.displayName = "AnimatedCard"

// ==================== Stagger Container ====================

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    className?: string
    delayChildren?: number
    staggerChildren?: number
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
    ({ children, className, delayChildren = 0.1, staggerChildren = 0.08, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial="initial"
                animate="animate"
                variants={{
                    initial: {},
                    animate: {
                        transition: {
                            staggerChildren,
                            delayChildren,
                        },
                    },
                }}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
StaggerContainer.displayName = "StaggerContainer"

// ==================== Stagger Item ====================

interface StaggerItemProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    className?: string
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                variants={staggerItemVariants}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
StaggerItem.displayName = "StaggerItem"

// ==================== Motion Button ====================

interface MotionButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode
    className?: string
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                className={className}
                {...props}
            >
                {children}
            </motion.button>
        )
    }
)
MotionButton.displayName = "MotionButton"

// ==================== Slide Up ====================

interface SlideUpProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    delay?: number
    className?: string
}

export const SlideUp = forwardRef<HTMLDivElement, SlideUpProps>(
    ({ children, delay = 0, className, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                variants={slideInFromBottom}
                initial="initial"
                animate="animate"
                transition={{ delay }}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
SlideUp.displayName = "SlideUp"

// ==================== Animated Presence Wrapper ====================

interface AnimatedPresenceWrapperProps {
    children: ReactNode
    isVisible: boolean
    className?: string
}

export function AnimatedPresenceWrapper({
    children,
    isVisible,
    className,
}: AnimatedPresenceWrapperProps) {
    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={className}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// ==================== Hover Scale ====================

interface HoverScaleProps extends HTMLMotionProps<"div"> {
    children: ReactNode
    scale?: number
    className?: string
}

export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
    ({ children, scale = 1.05, className, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={{ scale }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
HoverScale.displayName = "HoverScale"

// ==================== Animated Counter ====================

interface AnimatedCounterProps {
    value: number
    className?: string
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={className}
        >
            {value}
        </motion.span>
    )
}

// ==================== Pulse Dot ====================

export function PulseDot({ className }: { className?: string }) {
    return (
        <motion.span
            animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            className={cn(
                "inline-block w-2 h-2 rounded-full bg-primary",
                className
            )}
        />
    )
}

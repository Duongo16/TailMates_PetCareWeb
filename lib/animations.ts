import { Variants, Transition } from "framer-motion"

/**
 * Animation Presets for Framer Motion
 * Consistent, reusable animation variants across the app
 */

// ==================== Transitions ====================

export const springTransition: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 25,
}

export const smoothTransition: Transition = {
    type: "tween",
    duration: 0.3,
    ease: "easeOut",
}

export const bouncyTransition: Transition = {
    type: "spring",
    stiffness: 400,
    damping: 15,
}

// ==================== Page Transitions ====================

export const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.2,
        },
    },
}

export const pageFadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.3 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 },
    },
}

// ==================== Card Animations ====================

export const cardVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.95,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: smoothTransition,
    },
    hover: {
        y: -4,
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
        transition: {
            duration: 0.2,
        },
    },
    tap: {
        scale: 0.98,
        transition: {
            duration: 0.1,
        },
    },
}

export const cardHoverVariants: Variants = {
    rest: {
        scale: 1,
        y: 0,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    hover: {
        scale: 1.02,
        y: -4,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        transition: {
            duration: 0.2,
            ease: "easeOut",
        },
    },
    tap: {
        scale: 0.98,
        transition: {
            duration: 0.1,
        },
    },
}

// ==================== List/Stagger Animations ====================

export const staggerContainerVariants: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
}

export const staggerItemVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: smoothTransition,
    },
}

export const staggerFadeVariants: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.3,
        },
    },
}

// ==================== Modal/Dialog Animations ====================

export const modalVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 10,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: {
            duration: 0.15,
        },
    },
}

export const overlayVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
}

// ==================== Button Animations ====================

export const buttonVariants: Variants = {
    initial: { scale: 1 },
    hover: {
        scale: 1.03,
        transition: {
            duration: 0.15,
        },
    },
    tap: {
        scale: 0.97,
        transition: {
            duration: 0.1,
        },
    },
}

export const buttonPulseVariants: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.02, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
}

// ==================== Slide Animations ====================

export const slideInFromLeft: Variants = {
    initial: { x: -100, opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: smoothTransition,
    },
    exit: {
        x: -100,
        opacity: 0,
        transition: { duration: 0.2 },
    },
}

export const slideInFromRight: Variants = {
    initial: { x: 100, opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: smoothTransition,
    },
    exit: {
        x: 100,
        opacity: 0,
        transition: { duration: 0.2 },
    },
}

export const slideInFromBottom: Variants = {
    initial: { y: 50, opacity: 0 },
    animate: {
        y: 0,
        opacity: 1,
        transition: smoothTransition,
    },
    exit: {
        y: 50,
        opacity: 0,
        transition: { duration: 0.2 },
    },
}

// ==================== Icon/Element Animations ====================

export const iconBounceVariants: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.2, 1],
        transition: {
            duration: 0.4,
            ease: "easeInOut",
        },
    },
}

export const rotateVariants: Variants = {
    initial: { rotate: 0 },
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: "linear",
        },
    },
}

export const pulseVariants: Variants = {
    initial: { opacity: 1 },
    animate: {
        opacity: [1, 0.5, 1],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
}

// ==================== Notification/Badge Animations ====================

export const badgePopVariants: Variants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: bouncyTransition,
    },
    exit: {
        scale: 0,
        opacity: 0,
        transition: { duration: 0.15 },
    },
}

export const shakeVariants: Variants = {
    initial: { x: 0 },
    animate: {
        x: [-2, 2, -2, 2, 0],
        transition: {
            duration: 0.4,
        },
    },
}

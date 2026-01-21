"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowLeft,
    ArrowRight,
    PawPrint,
    Heart,
    Sparkles,
    Check,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingFormData {
    species: "Dog" | "Cat" | "Bird" | "Fish" | "Hamster" | "Other" | ""
    name: string
    breed: string
    ageGroup: string
    colors: string[]
    furType: string
}

interface OnboardingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const TEMP_PET_DATA_KEY = "temp_pet_data"

// Map age groups to months
const ageGroupToMonths: Record<string, number> = {
    "under1": 6,
    "1to3": 24,
    "3to7": 60,
    "over7": 96,
}

const ageGroups = [
    { id: "under1", label: "Dưới 1 tuổi", emoji: "🍼" },
    { id: "1to3", label: "1-3 tuổi", emoji: "🎾" },
    { id: "3to7", label: "3-7 tuổi", emoji: "🐕" },
    { id: "over7", label: "Trên 7 tuổi", emoji: "👴" },
]

// Breed options by species (same as wizard)
const BREED_OPTIONS: Record<string, { value: string; label: string }[]> = {
    Dog: [
        { value: "Corgi", label: "Corgi" },
        { value: "Golden Retriever", label: "Golden Retriever" },
        { value: "Husky", label: "Husky" },
        { value: "Poodle", label: "Poodle" },
        { value: "Pomeranian", label: "Pomeranian" },
        { value: "Shiba Inu", label: "Shiba Inu" },
        { value: "Chihuahua", label: "Chihuahua" },
        { value: "Bulldog", label: "Bulldog" },
        { value: "Phốc sóc", label: "Phốc sóc" },
        { value: "Chó ta", label: "Chó ta" },
        { value: "Other", label: "Khác" },
    ],
    Cat: [
        { value: "Mèo ta", label: "Mèo ta" },
        { value: "Mèo Anh lông ngắn", label: "Mèo Anh lông ngắn" },
        { value: "Mèo Ba Tư", label: "Mèo Ba Tư" },
        { value: "Mèo Ragdoll", label: "Mèo Ragdoll" },
        { value: "Mèo Maine Coon", label: "Mèo Maine Coon" },
        { value: "Mèo Scottish Fold", label: "Mèo Scottish Fold" },
        { value: "Mèo Munchkin", label: "Mèo Munchkin" },
        { value: "Mèo Siamese", label: "Mèo Siamese" },
        { value: "Other", label: "Khác" },
    ],
    Bird: [
        { value: "Vẹt", label: "Vẹt" },
        { value: "Chim sẻ", label: "Chim sẻ" },
        { value: "Yến phụng", label: "Yến phụng" },
        { value: "Chào mào", label: "Chào mào" },
        { value: "Chim cảnh", label: "Chim cảnh" },
        { value: "Other", label: "Khác" },
    ],
    Fish: [
        { value: "Cá Betta", label: "Cá Betta" },
        { value: "Cá vàng", label: "Cá vàng" },
        { value: "Cá Koi", label: "Cá Koi" },
        { value: "Cá cảnh nhiệt đới", label: "Cá cảnh nhiệt đới" },
        { value: "Other", label: "Khác" },
    ],
    Hamster: [
        { value: "Hamster Syria", label: "Hamster Syria" },
        { value: "Hamster Robo", label: "Hamster Robo" },
        { value: "Hamster Winter White", label: "Hamster Winter White" },
        { value: "Hamster Campbell", label: "Hamster Campbell" },
        { value: "Other", label: "Khác" },
    ],
    Other: [
        { value: "Other", label: "Khác" },
    ],
}

// Color options
const COLOR_OPTIONS = [
    { id: "white", label: "Trắng", hex: "#FFFFFF", border: "#E5E7EB" },
    { id: "black", label: "Đen", hex: "#000000" },
    { id: "brown", label: "Nâu", hex: "#8B4513" },
    { id: "gray", label: "Xám", hex: "#808080" },
    { id: "yellow", label: "Vàng", hex: "#FFD700" },
    { id: "cream", label: "Kem", hex: "#FFFACD" },
    { id: "orange", label: "Cam", hex: "#FF8C00" },
    { id: "red", label: "Đỏ", hex: "#DC2626" },
    { id: "blue", label: "Xanh dương", hex: "#3B82F6" },
    { id: "green", label: "Xanh lá", hex: "#22C55E" },
]

// Fur type options
const FUR_TYPE_OPTIONS = [
    { id: "short", label: "Lông ngắn", emoji: "✂️" },
    { id: "medium", label: "Lông trung bình", emoji: "📏" },
    { id: "long", label: "Lông dài", emoji: "💇" },
    { id: "hairless", label: "Không lông", emoji: "🦴" },
    { id: "curly", label: "Lông xoăn", emoji: "🌀" },
]

// Pet species  with icon and description
const SPECIES_OPTIONS = [
    { id: "Dog", label: "Chó", emoji: "🐕", description: "Trung thành" },
    { id: "Cat", label: "Mèo", emoji: "🐱", description: "Đáng yêu" },
    { id: "Bird", label: "Chim", emoji: "🐦", description: "Du dương" },
    { id: "Fish", label: "Cá", emoji: "🐠", description: "Tự do" },
    { id: "Hamster", label: "Hamster", emoji: "🐹", description: "Nhỏ xinh" },
    { id: "Other", label: "Khác", emoji: "🐾", description: "Đặc biệt" },
]

// Animation variants
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 200 : -200,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 200 : -200,
        opacity: 0,
    }),
}

const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -3 },
    tap: { scale: 0.98 },
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [direction, setDirection] = useState(0)
    const { watch, setValue, reset } = useForm<OnboardingFormData>({
        defaultValues: {
            species: "",
            name: "",
            breed: "",
            ageGroup: "",
            colors: [],
            furType: "",
        },
    })

    const formData = watch()
    const totalSteps = 7 // 1:species, 2:name, 3:breed, 4:colors, 5:fur, 6:age, 7:completion

    const nextStep = () => {
        setDirection(1)
        // Skip fur type step if species is Fish
        if (step === 4 && formData.species === "Fish") {
            setStep(6) // Jump to age step
        } else {
            setStep((prev) => Math.min(prev + 1, totalSteps))
        }
    }

    const prevStep = () => {
        setDirection(-1)
        // Skip fur type step if species is Fish when going back
        if (step === 6 && formData.species === "Fish") {
            setStep(4) // Jump back to colors step
        } else {
            setStep((prev) => Math.max(prev - 1, 1))
        }
    }

    const handleSpeciesSelect = (species: typeof formData.species) => {
        setValue("species", species)
        setTimeout(nextStep, 300)
    }

    const handleBreedSelect = (breed: string) => {
        setValue("breed", breed)
    }

    const toggleColor = (colorId: string) => {
        const currentColors = formData.colors || []
        if (currentColors.includes(colorId)) {
            setValue("colors", currentColors.filter(c => c !== colorId))
        } else {
            setValue("colors", [...currentColors, colorId])
        }
    }

    const handleFurTypeSelect = (furType: string) => {
        setValue("furType", furType)
    }

    const handleAgeSelect = (ageGroup: string) => {
        setValue("ageGroup", ageGroup)
    }

    const handleClose = () => {
        onOpenChange(false)
        // Reset after modal closes
        setTimeout(() => {
            setStep(1)
            reset()
        }, 300)
    }

    const getSpeciesEmoji = (species: string) => {
        return SPECIES_OPTIONS.find(s => s.id === species)?.emoji || "🐾"
    }

    const getSpeciesLabel = (species: string) => {
        return SPECIES_OPTIONS.find(s => s.id === species)?.label || species
    }

    const saveTempData = () => {
        const tempData = {
            species: formData.species,
            name: formData.name.trim(),
            breed: formData.breed || undefined,
            age_months: ageGroupToMonths[formData.ageGroup] || 24,
            gender: "MALE" as const,
            color: formData.colors.length > 0 ? formData.colors.map(c => COLOR_OPTIONS.find(co => co.id === c)?.label).join(", ") : undefined,
            fur_type: formData.furType ? FUR_TYPE_OPTIONS.find(f => f.id === formData.furType)?.label : undefined,
        }
        localStorage.setItem(TEMP_PET_DATA_KEY, JSON.stringify(tempData))
    }

    const handleComplete = () => {
        saveTempData()
        handleClose()
        router.push("/register?from=onboarding")
    }

    const canProceedStep2 = formData.name.trim().length >= 2
    const canProceedStep3 = formData.breed !== ""
    const canProceedStep4 = formData.colors.length > 0
    const canProceedStep5 = formData.furType !== "" || formData.species === "Fish"
    const canProceedStep6 = formData.ageGroup !== ""

    // Calculate progress (excluding completion step)
    const progressSteps = formData.species === "Fish" ? 5 : 6
    const currentProgress = step === 7 ? progressSteps : Math.min(step, progressSteps)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-0 rounded-3xl max-h-[90vh]">
                <VisuallyHidden>
                    <DialogTitle>Onboarding</DialogTitle>
                </VisuallyHidden>

                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Bắt đầu cuộc hành trình!</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-foreground/60" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        {Array.from({ length: progressSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                    currentProgress >= i + 1
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {currentProgress > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
                            </div>
                        ))}
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-accent"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((currentProgress - 1) / (progressSteps - 1)) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* Step 1: Pet Species Selection */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                        className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/25"
                                    >
                                        <img src="/images/logo.png" style={{ borderRadius: "30%" }} alt="" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Người bạn của bạn là ai?
                                    </h2>
                                    <p className="text-foreground/60 text-sm">
                                        Chọn loại thú cưng để bắt đầu
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {SPECIES_OPTIONS.map((species) => (
                                        <motion.div
                                            key={species.id}
                                            variants={cardHoverVariants}
                                            initial="rest"
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <Card
                                                className={cn(
                                                    "cursor-pointer border-2 transition-all overflow-hidden h-full",
                                                    formData.species === species.id
                                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                                onClick={() => handleSpeciesSelect(species.id as any)}
                                            >
                                                <CardContent className="p-3 text-center">
                                                    <motion.div
                                                        className="text-4xl mb-2"
                                                        animate={formData.species === species.id ? { rotate: [0, -10, 10, 0] } : {}}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        {species.emoji}
                                                    </motion.div>
                                                    <h3 className="text-sm font-bold text-foreground">{species.label}</h3>
                                                    <p className="text-xs text-foreground/60">{species.description}</p>
                                                    {formData.species === species.id && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="mt-2"
                                                        >
                                                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mx-auto">
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Pet Name */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                        className="text-5xl mx-auto"
                                    >
                                        {getSpeciesEmoji(formData.species)}
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Tuyệt vời! Bé tên là gì?
                                    </h2>
                                    <p className="text-foreground/60 text-sm">
                                        Đặt tên cho người bạn nhỏ của bạn
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="petName" className="text-foreground font-medium">
                                            Tên thú cưng
                                        </Label>
                                        <Input
                                            id="petName"
                                            type="text"
                                            placeholder="VD: Mochi, Lucky, Bông..."
                                            value={formData.name}
                                            onChange={(e) => setValue("name", e.target.value)}
                                            className="h-12 text-base rounded-xl border-border focus:border-primary"
                                            autoFocus
                                        />
                                        {formData.name && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-sm text-primary font-medium flex items-center gap-1"
                                            >
                                                <Heart className="w-4 h-4" />
                                                Xin chào, {formData.name}! 👋
                                            </motion.p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Button
                                            onClick={nextStep}
                                            disabled={!canProceedStep2}
                                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all"
                                        >
                                            Tiếp tục
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                        {step > 1 && step < 7 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={prevStep}
                                                className="w-full text-foreground/60 hover:text-foreground"
                                            >
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Quay lại
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Breed Selection */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring" }}
                                        className="text-4xl mx-auto"
                                    >
                                        🧬
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {formData.name} thuộc giống nào?
                                    </h2>
                                    <p className="text-foreground/60 text-sm">
                                        Chọn giống phù hợp
                                    </p>
                                </div>

                                <Card className="border-2 border-border">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="breed" className="text-foreground font-medium">
                                                Giống
                                            </Label>
                                            <Select value={formData.breed} onValueChange={handleBreedSelect}>
                                                <SelectTrigger className="h-12 text-base rounded-xl border-border focus:border-primary" style={{ width: "100%" }}>
                                                    <SelectValue placeholder="Chọn giống..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(BREED_OPTIONS[formData.species] || BREED_OPTIONS.Other).map((breed) => (
                                                        <SelectItem key={breed.value} value={breed.value}>
                                                            {breed.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formData.breed && (
                                                <p className="text-sm text-primary font-medium flex items-center gap-1">
                                                    <Check className="w-4 h-4" />
                                                    Đã chọn: {(BREED_OPTIONS[formData.species] || BREED_OPTIONS.Other).find(b => b.value === formData.breed)?.label}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            onClick={nextStep}
                                            disabled={!canProceedStep3}
                                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
                                        >
                                            Tiếp tục
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={prevStep}
                                            className="w-full"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Quay lại
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 4: Color Selection */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <div className="text-4xl mx-auto">🎨</div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {formData.name} có màu gì?
                                    </h2>
                                    <p className="text-foreground/60 text-sm">Chọn một hoặc nhiều màu</p>
                                </div>

                                <div className="grid grid-cols-5 gap-2">
                                    {COLOR_OPTIONS.map((color) => {
                                        const isSelected = formData.colors.includes(color.id)
                                        return (
                                            <div
                                                key={color.id}
                                                className="cursor-pointer"
                                                onClick={() => toggleColor(color.id)}
                                            >
                                                <Card
                                                    className={cn(
                                                        "border-2 transition-all",
                                                        isSelected
                                                            ? "border-primary shadow-md"
                                                            : "border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    <CardContent className="p-2 space-y-1">
                                                        <div
                                                            className="w-full h-10 rounded"
                                                            style={{
                                                                backgroundColor: color.hex,
                                                                border: color.border ? `1px solid ${color.border}` : "none"
                                                            }}
                                                        />
                                                        <p className="text-xs font-medium text-center truncate">
                                                            {color.label}
                                                        </p>
                                                        {isSelected && (
                                                            <div className="flex justify-center">
                                                                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                                    <Check className="w-2 h-2 text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )
                                    })}
                                </div>

                                {formData.colors.length > 0 && (
                                    <p className="text-center text-xs text-foreground/70">
                                        {formData.colors.map(c => COLOR_OPTIONS.find(co => co.id === c)?.label).join(", ")}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    <Button
                                        onClick={nextStep}
                                        disabled={!canProceedStep4}
                                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
                                    >
                                        Tiếp tục
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={prevStep} className="w-full">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Quay lại
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Fur Type (Skip for Fish) */}
                        {step === 5 && formData.species !== "Fish" && (
                            <motion.div
                                key="step5"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <div className="text-4xl mx-auto">💇</div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        Loại lông của {formData.name}?
                                    </h2>
                                    <p className="text-foreground/60 text-sm">Chọn loại lông</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {FUR_TYPE_OPTIONS.map((furType) => (
                                        <Card
                                            key={furType.id}
                                            className={cn(
                                                "cursor-pointer border-2 transition-all",
                                                formData.furType === furType.id
                                                    ? "border-primary bg-primary/5 shadow-lg"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                            onClick={() => handleFurTypeSelect(furType.id)}
                                        >
                                            <CardContent className="p-3 text-center">
                                                <div className="text-3xl mb-1">{furType.emoji}</div>
                                                <p className="font-semibold text-sm">{furType.label}</p>
                                                {formData.furType === furType.id && (
                                                    <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        onClick={nextStep}
                                        disabled={!canProceedStep5}
                                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
                                    >
                                        Tiếp tục
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={prevStep} className="w-full">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Quay lại
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 6: Pet Age */}
                        {step === 6 && (
                            <motion.div
                                key="step6"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <div className="text-center space-y-2">
                                    <div className="text-4xl mx-auto">🎂</div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {formData.name} bao nhiêu tuổi?
                                    </h2>
                                    <p className="text-foreground/60 text-sm">Chọn nhóm tuổi</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {ageGroups.map((group) => (
                                        <Card
                                            key={group.id}
                                            className={cn(
                                                "cursor-pointer border-2 transition-all",
                                                formData.ageGroup === group.id
                                                    ? "border-primary bg-primary/5 shadow-lg"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                            onClick={() => handleAgeSelect(group.id)}
                                        >
                                            <CardContent className="p-3 text-center">
                                                <div className="text-3xl mb-1">{group.emoji}</div>
                                                <p className="font-semibold text-sm">{group.label}</p>
                                                {formData.ageGroup === group.id && (
                                                    <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        onClick={nextStep}
                                        disabled={!canProceedStep6}
                                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
                                    >
                                        Hoàn thành
                                        <Sparkles className="w-5 h-5 ml-2" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={prevStep} className="w-full">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Quay lại
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 7: Completion */}
                        {step === 7 && (
                            <motion.div
                                key="step7"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="space-y-6 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
                                    className="relative mx-auto"
                                >
                                    <div className="w-24 h-24 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary/30">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="text-5xl"
                                        >
                                            {getSpeciesEmoji(formData.species)}
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="absolute -top-1 -right-1 w-9 h-9 bg-accent rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <Heart className="w-5 h-5 text-white fill-white" />
                                    </motion.div>
                                </motion.div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-foreground">Tuyệt vời! 🎉</h2>
                                    <p className="text-foreground/80 text-sm">
                                        Hãy tạo tài khoản để lưu hồ sơ sức khỏe cho{" "}
                                        <span className="font-bold text-primary">{formData.name}</span>!
                                    </p>
                                </div>

                                <Card className="border-2 border-primary/20 bg-primary/5">
                                    <CardContent className="p-3 text-left space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="text-2xl">{getSpeciesEmoji(formData.species)}</div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">{formData.name}</p>
                                                <p className="text-xs text-foreground/60">
                                                    {getSpeciesLabel(formData.species)} • {formData.breed}
                                                </p>
                                            </div>
                                            <Check className="w-5 h-5 text-primary" />
                                        </div>
                                        {formData.colors.length > 0 && (
                                            <p className="text-xs text-foreground/70">
                                                Màu: {formData.colors.map(c => COLOR_OPTIONS.find(co => co.id === c)?.label).join(", ")}
                                            </p>
                                        )}
                                        {formData.furType && formData.species !== "Fish" && (
                                            <p className="text-xs text-foreground/70">
                                                Lông: {FUR_TYPE_OPTIONS.find(f => f.id === formData.furType)?.label}
                                            </p>
                                        )}
                                        <p className="text-xs text-foreground/70">
                                            Tuổi: {ageGroups.find(g => g.id === formData.ageGroup)?.label}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Button
                                    onClick={handleComplete}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg"
                                >
                                    Tạo tài khoản miễn phí
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>

                                <p className="text-xs text-foreground/50">
                                    Đã có tài khoản?{" "}
                                    <button
                                        onClick={() => {
                                            saveTempData()
                                            handleClose()
                                            router.push("/login")
                                        }}
                                        className="text-primary font-semibold hover:underline"
                                    >
                                        Đăng nhập
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}

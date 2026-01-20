"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
    ArrowLeft,
    ArrowRight,
    PawPrint,
    Heart,
    Sparkles,
    Check
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingFormData {
    species: "Dog" | "Cat" | ""
    name: string
    ageGroup: string
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

// Animation variants
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
}

const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -5 },
    tap: { scale: 0.98 },
}

export function OnboardingWizard() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [direction, setDirection] = useState(0)
    const { watch, setValue, handleSubmit } = useForm<OnboardingFormData>({
        defaultValues: {
            species: "",
            name: "",
            ageGroup: "",
        },
    })

    const formData = watch()
    const totalSteps = 4 // Including completion step

    const nextStep = () => {
        setDirection(1)
        setStep((prev) => Math.min(prev + 1, totalSteps))
    }

    const prevStep = () => {
        setDirection(-1)
        setStep((prev) => Math.max(prev - 1, 1))
    }

    const handleSpeciesSelect = (species: "Dog" | "Cat") => {
        setValue("species", species)
        setTimeout(nextStep, 300)
    }

    const handleAgeSelect = (ageGroup: string) => {
        setValue("ageGroup", ageGroup)
    }

    const saveTempData = () => {
        const tempData = {
            species: formData.species,
            name: formData.name.trim(),
            age_months: ageGroupToMonths[formData.ageGroup] || 24,
            gender: "MALE" as const, // Default, user can update later
        }
        localStorage.setItem(TEMP_PET_DATA_KEY, JSON.stringify(tempData))
    }

    const handleComplete = () => {
        saveTempData()
        router.push("/register?from=onboarding")
    }

    const canProceedStep2 = formData.name.trim().length >= 2
    const canProceedStep3 = formData.ageGroup !== ""

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary/50 via-background to-muted/50 flex flex-col">
            {/* Header */}
            <header className="p-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/images/avarta.png" alt="TailMates" width={100} height={32} className="h-8 w-auto" />
                </Link>
                {step > 1 && step < 4 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevStep}
                        className="text-foreground/60 hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                )}
            </header>

            {/* Progress Bar */}
            <div className="px-4 mb-8">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                                    step >= i
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {step > i ? <Check className="w-4 h-4" /> : i}
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-accent"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((step - 1) / 3) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 pb-8">
                <div className="w-full max-w-lg">
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* Step 1: Pet Type Selection */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-3">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                        className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/25"
                                    >
                                        <PawPrint className="w-8 h-8 text-white" />
                                    </motion.div>
                                    <h1 className="text-3xl font-bold text-foreground">
                                        Người bạn của bạn là ai?
                                    </h1>
                                    <p className="text-foreground/60">
                                        Chọn loại thú cưng để bắt đầu hành trình cùng TailMates
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Dog Card */}
                                    <motion.div
                                        variants={cardHoverVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <Card
                                            className={cn(
                                                "cursor-pointer border-2 transition-all overflow-hidden",
                                                formData.species === "Dog"
                                                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/20"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                            onClick={() => handleSpeciesSelect("Dog")}
                                        >
                                            <CardContent className="p-6 text-center">
                                                <motion.div
                                                    className="text-7xl mb-4"
                                                    animate={formData.species === "Dog" ? { rotate: [0, -10, 10, 0] } : {}}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    🐕
                                                </motion.div>
                                                <h3 className="text-xl font-bold text-foreground">Chó</h3>
                                                <p className="text-sm text-foreground/60 mt-1">
                                                    Người bạn trung thành
                                                </p>
                                                {formData.species === "Dog" && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="mt-3"
                                                    >
                                                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto">
                                                            <Check className="w-5 h-5 text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* Cat Card */}
                                    <motion.div
                                        variants={cardHoverVariants}
                                        initial="rest"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <Card
                                            className={cn(
                                                "cursor-pointer border-2 transition-all overflow-hidden",
                                                formData.species === "Cat"
                                                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/20"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                            onClick={() => handleSpeciesSelect("Cat")}
                                        >
                                            <CardContent className="p-6 text-center">
                                                <motion.div
                                                    className="text-7xl mb-4"
                                                    animate={formData.species === "Cat" ? { rotate: [0, -10, 10, 0] } : {}}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    🐱
                                                </motion.div>
                                                <h3 className="text-xl font-bold text-foreground">Mèo</h3>
                                                <p className="text-sm text-foreground/60 mt-1">
                                                    Chú Sen đáng yêu
                                                </p>
                                                {formData.species === "Cat" && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="mt-3"
                                                    >
                                                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto">
                                                            <Check className="w-5 h-5 text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
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
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-3">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                        className="text-6xl mx-auto"
                                    >
                                        {formData.species === "Dog" ? "🐕" : "🐱"}
                                    </motion.div>
                                    <h1 className="text-3xl font-bold text-foreground">
                                        Tuyệt vời! Bé tên là gì?
                                    </h1>
                                    <p className="text-foreground/60">
                                        Đặt tên cho người bạn nhỏ của bạn
                                    </p>
                                </div>

                                <Card className="border-2 border-border">
                                    <CardContent className="p-6 space-y-6">
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
                                                className="h-14 text-lg rounded-xl border-border focus:border-primary"
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

                                        <Button
                                            onClick={nextStep}
                                            disabled={!canProceedStep2}
                                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all"
                                        >
                                            Tiếp tục
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 3: Pet Age */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-3">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="text-5xl mx-auto"
                                    >
                                        🎂
                                    </motion.div>
                                    <h1 className="text-3xl font-bold text-foreground">
                                        {formData.name} bao nhiêu tuổi?
                                    </h1>
                                    <p className="text-foreground/60">
                                        Chọn nhóm tuổi phù hợp với bé
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {ageGroups.map((group, index) => (
                                        <motion.div
                                            key={group.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card
                                                className={cn(
                                                    "cursor-pointer border-2 transition-all hover:shadow-lg",
                                                    formData.ageGroup === group.id
                                                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/20"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                                onClick={() => handleAgeSelect(group.id)}
                                            >
                                                <CardContent className="p-4 text-center">
                                                    <div className="text-4xl mb-2">{group.emoji}</div>
                                                    <p className="font-semibold text-foreground">{group.label}</p>
                                                    {formData.ageGroup === group.id && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="mt-2"
                                                        >
                                                            <Check className="w-5 h-5 text-primary mx-auto" />
                                                        </motion.div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>

                                <Button
                                    onClick={nextStep}
                                    disabled={!canProceedStep3}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all"
                                >
                                    Hoàn thành
                                    <Sparkles className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 4: Completion / The Hook */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="space-y-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                                    className="relative"
                                >
                                    <div className="w-32 h-32 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="text-6xl"
                                        >
                                            {formData.species === "Dog" ? "🐕" : "🐱"}
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="absolute -top-2 -right-2 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <Heart className="w-6 h-6 text-white fill-white" />
                                    </motion.div>
                                </motion.div>

                                <div className="space-y-3">
                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl font-bold text-foreground"
                                    >
                                        Tuyệt vời! 🎉
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-lg text-foreground/80 max-w-md mx-auto"
                                    >
                                        Hãy tạo tài khoản để lưu hồ sơ sức khỏe đầu tiên cho{" "}
                                        <span className="font-bold text-primary">{formData.name}</span> nhé!
                                    </motion.p>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-4"
                                >
                                    <Card className="border-2 border-primary/20 bg-primary/5">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-3xl">
                                                        {formData.species === "Dog" ? "🐕" : "🐱"}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-foreground">{formData.name}</p>
                                                        <p className="text-sm text-foreground/60">
                                                            {formData.species === "Dog" ? "Chó" : "Mèo"} •{" "}
                                                            {ageGroups.find((g) => g.id === formData.ageGroup)?.label}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Check className="w-6 h-6 text-primary" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Button
                                        onClick={handleComplete}
                                        size="lg"
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-[1.02] transition-all text-lg"
                                    >
                                        Tạo tài khoản miễn phí
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>

                                    <p className="text-sm text-foreground/50">
                                        Đã có tài khoản?{" "}
                                        <Link href="/login" className="text-primary font-semibold hover:underline">
                                            Đăng nhập
                                        </Link>
                                    </p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

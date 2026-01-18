/**
 * Tests for Bookings API Logic
 */

describe("Bookings API Logic", () => {
    describe("Time Slot Management", () => {
        const timeSlots = [
            "08:00", "09:00", "10:00", "11:00",
            "13:00", "14:00", "15:00", "16:00", "17:00"
        ];

        it("should have correct available time slots", () => {
            expect(timeSlots).toHaveLength(9);
            expect(timeSlots).toContain("08:00");
            expect(timeSlots).toContain("17:00");
            // Lunch break is excluded
            expect(timeSlots).not.toContain("12:00");
        });

        it("should filter out booked slots", () => {
            const bookedSlots = ["09:00", "10:00"];
            const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

            expect(availableSlots).not.toContain("09:00");
            expect(availableSlots).not.toContain("10:00");
            expect(availableSlots).toContain("08:00");
            expect(availableSlots).toHaveLength(7);
        });

        it("should parse time string correctly", () => {
            const parseTime = (timeStr: string): { hours: number; minutes: number } => {
                const [hours, minutes] = timeStr.split(":").map(Number);
                return { hours, minutes };
            };

            expect(parseTime("09:00")).toEqual({ hours: 9, minutes: 0 });
            expect(parseTime("14:30")).toEqual({ hours: 14, minutes: 30 });
        });
    });

    describe("Booking Validation", () => {
        it("should validate required fields", () => {
            const validateBooking = (booking: {
                service_id?: string;
                pet_id?: string;
                booking_time?: string;
            }) => {
                const errors: string[] = [];
                if (!booking.service_id) errors.push("Service is required");
                if (!booking.pet_id) errors.push("Pet is required");
                if (!booking.booking_time) errors.push("Booking time is required");
                return errors;
            };

            const validBooking = {
                service_id: "svc-1",
                pet_id: "pet-1",
                booking_time: "2024-01-20T10:00:00Z",
            };
            expect(validateBooking(validBooking)).toHaveLength(0);

            const invalidBooking = { service_id: "svc-1" };
            expect(validateBooking(invalidBooking).length).toBeGreaterThan(0);
        });

        it("should validate booking time is in future", () => {
            const isValidBookingTime = (timeStr: string): boolean => {
                const bookingTime = new Date(timeStr);
                const now = new Date();
                return bookingTime > now;
            };

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            expect(isValidBookingTime(futureDate.toISOString())).toBe(true);

            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            expect(isValidBookingTime(pastDate.toISOString())).toBe(false);
        });

        it("should validate booking is within business hours", () => {
            const isWithinBusinessHours = (timeStr: string): boolean => {
                const date = new Date(timeStr);
                const hours = date.getHours();
                // Business hours: 8:00 - 18:00
                return hours >= 8 && hours < 18;
            };

            expect(isWithinBusinessHours("2024-01-20T09:00:00")).toBe(true);
            expect(isWithinBusinessHours("2024-01-20T06:00:00")).toBe(false);
            expect(isWithinBusinessHours("2024-01-20T20:00:00")).toBe(false);
        });
    });

    describe("Booking Status Workflow", () => {
        const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

        it("should have valid status values", () => {
            expect(validStatuses).toContain("PENDING");
            expect(validStatuses).toContain("CONFIRMED");
            expect(validStatuses).toContain("COMPLETED");
            expect(validStatuses).toHaveLength(5);
        });

        it("should validate status transitions", () => {
            const canTransition = (from: string, to: string): boolean => {
                const transitions: Record<string, string[]> = {
                    PENDING: ["CONFIRMED", "CANCELLED"],
                    CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
                    COMPLETED: [],
                    CANCELLED: [],
                    NO_SHOW: [],
                };
                return transitions[from]?.includes(to) || false;
            };

            expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
            expect(canTransition("PENDING", "COMPLETED")).toBe(false);
            expect(canTransition("CONFIRMED", "COMPLETED")).toBe(true);
        });

        it("should get status display text", () => {
            const getStatusText = (status: string): string => {
                const texts: Record<string, string> = {
                    PENDING: "Chờ xác nhận",
                    CONFIRMED: "Đã xác nhận",
                    COMPLETED: "Hoàn thành",
                    CANCELLED: "Đã hủy",
                    NO_SHOW: "Không đến",
                };
                return texts[status] || status;
            };

            expect(getStatusText("PENDING")).toBe("Chờ xác nhận");
            expect(getStatusText("COMPLETED")).toBe("Hoàn thành");
        });
    });

    describe("Date Handling", () => {
        it("should format date for display", () => {
            const formatDate = (dateStr: string): string => {
                const date = new Date(dateStr);
                return date.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            };

            const formatted = formatDate("2024-01-20");
            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe("string");
        });

        it("should get date range for week view", () => {
            const getWeekDates = (startDate: Date): Date[] => {
                const dates: Date[] = [];
                for (let i = 0; i < 7; i++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + i);
                    dates.push(date);
                }
                return dates;
            };

            const start = new Date("2024-01-15");
            const weekDates = getWeekDates(start);

            expect(weekDates).toHaveLength(7);
            expect(weekDates[0].getDate()).toBe(15);
            expect(weekDates[6].getDate()).toBe(21);
        });
    });

    describe("Slot Conflict Detection", () => {
        it("should detect conflicting bookings", () => {
            const hasConflict = (
                existingBookings: { time: string }[],
                newTime: string
            ): boolean => {
                return existingBookings.some(booking => booking.time === newTime);
            };

            const existing = [
                { time: "09:00" },
                { time: "10:00" },
            ];

            expect(hasConflict(existing, "09:00")).toBe(true);
            expect(hasConflict(existing, "11:00")).toBe(false);
        });

        it("should get all booked slots for a date", () => {
            const getBookedSlots = (
                bookings: { booking_time: string }[],
                targetDate: string
            ): string[] => {
                return bookings
                    .filter(b => b.booking_time.startsWith(targetDate))
                    .map(b => {
                        const time = new Date(b.booking_time);
                        return `${time.getHours().toString().padStart(2, '0')}:00`;
                    });
            };

            const bookings = [
                { booking_time: "2024-01-20T09:00:00Z" },
                { booking_time: "2024-01-20T14:00:00Z" },
                { booking_time: "2024-01-21T10:00:00Z" },
            ];

            const slots = getBookedSlots(bookings, "2024-01-20");
            expect(slots).toHaveLength(2);
        });
    });

    describe("Booking Response Formatting", () => {
        it("should format booking for API response", () => {
            const formatBooking = (booking: any) => ({
                id: booking._id,
                service_name: booking.service_id?.name || "Unknown",
                pet_name: booking.pet_id?.name || "Unknown",
                booking_time: booking.booking_time,
                status: booking.status,
            });

            const booking = {
                _id: "booking-123",
                service_id: { name: "Grooming" },
                pet_id: { name: "Max" },
                booking_time: "2024-01-20T10:00:00Z",
                status: "CONFIRMED",
            };

            const formatted = formatBooking(booking);

            expect(formatted.id).toBe("booking-123");
            expect(formatted.service_name).toBe("Grooming");
            expect(formatted.pet_name).toBe("Max");
        });
    });
});

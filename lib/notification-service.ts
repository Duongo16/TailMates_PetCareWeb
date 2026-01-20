import connectDB from "@/lib/db";
import Notification, { NotificationType, INotification } from "@/models/Notification";

/**
 * Notification Service
 * Helper functions to create and manage notifications
 */

interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    redirectUrl?: string;
    referenceId?: string;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(data: CreateNotificationData): Promise<INotification | null> {
    try {
        await connectDB();

        const notification = await Notification.create({
            user_id: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            redirect_url: data.redirectUrl,
            reference_id: data.referenceId,
            is_read: false,
        });

        return notification;
    } catch (error) {
        console.error("Failed to create notification:", error);
        return null;
    }
}

/**
 * Get status title for order updates
 */
export function getOrderStatusTitle(status: string): string {
    const titles: Record<string, string> = {
        PENDING: "Đơn hàng mới đang chờ xử lý",
        CONFIRMED: "Đơn hàng đã được xác nhận",
        SHIPPING: "Đơn hàng đang được giao",
        COMPLETED: "Đơn hàng đã hoàn thành",
        CANCELLED: "Đơn hàng đã bị hủy",
    };
    return titles[status] || "Cập nhật đơn hàng";
}

/**
 * Get status message for order updates
 */
export function getOrderStatusMessage(orderId: string, status: string): string {
    const shortId = orderId.slice(-6).toUpperCase();
    const messages: Record<string, string> = {
        PENDING: `Đơn hàng #${shortId} đang chờ xác nhận từ người bán`,
        CONFIRMED: `Đơn hàng #${shortId} đã được xác nhận và sẽ sớm được giao`,
        SHIPPING: `Đơn hàng #${shortId} đang trên đường giao đến bạn`,
        COMPLETED: `Đơn hàng #${shortId} đã giao thành công. Cảm ơn bạn!`,
        CANCELLED: `Đơn hàng #${shortId} đã bị hủy`,
    };
    return messages[status] || `Đơn hàng #${shortId}: ${status}`;
}

/**
 * Get status title for booking updates
 */
export function getBookingStatusTitle(status: string): string {
    const titles: Record<string, string> = {
        PENDING: "Lịch hẹn mới đang chờ xác nhận",
        CONFIRMED: "Lịch hẹn đã được xác nhận",
        COMPLETED: "Dịch vụ đã hoàn thành",
        CANCELLED: "Lịch hẹn đã bị hủy",
    };
    return titles[status] || "Cập nhật lịch hẹn";
}

/**
 * Get status message for booking updates
 */
export function getBookingStatusMessage(bookingId: string, status: string, serviceName?: string): string {
    const shortId = bookingId.slice(-6).toUpperCase();
    const service = serviceName ? ` "${serviceName}"` : "";
    const messages: Record<string, string> = {
        PENDING: `Lịch hẹn #${shortId}${service} đang chờ xác nhận`,
        CONFIRMED: `Lịch hẹn #${shortId}${service} đã được xác nhận. Hẹn gặp bạn!`,
        COMPLETED: `Dịch vụ${service} đã hoàn thành. Cảm ơn bạn!`,
        CANCELLED: `Lịch hẹn #${shortId}${service} đã bị hủy`,
    };
    return messages[status] || `Lịch hẹn #${shortId}: ${status}`;
}

/**
 * Get title for new order notification (to merchant)
 */
export function getNewOrderTitle(): string {
    return "Đơn hàng mới!";
}

/**
 * Get message for new order notification (to merchant)
 */
export function getNewOrderMessage(orderId: string, customerName: string, totalAmount: number): string {
    const shortId = orderId.slice(-6).toUpperCase();
    const formattedAmount = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(totalAmount);
    return `Khách hàng ${customerName} vừa đặt đơn hàng #${shortId} - ${formattedAmount}`;
}

/**
 * Get title for new booking notification (to merchant)
 */
export function getNewBookingTitle(): string {
    return "Lịch hẹn mới!";
}

/**
 * Get message for new booking notification (to merchant)
 */
export function getNewBookingMessage(
    bookingId: string,
    customerName: string,
    serviceName: string,
    bookingTime: Date
): string {
    const shortId = bookingId.slice(-6).toUpperCase();
    const formattedTime = new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(bookingTime);
    return `Khách hàng ${customerName} đặt lịch ${serviceName} #${shortId} vào ${formattedTime}`;
}

export { NotificationType };


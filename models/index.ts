// Re-export all models from a single entry point
export { default as User, UserRole } from "./User";
export type { IUser } from "./User";

export { default as Pet, PetSpecies, PetGender } from "./Pet";
export type { IPet } from "./Pet";

export { default as MedicalRecord } from "./MedicalRecord";
export type { IMedicalRecord } from "./MedicalRecord";

export { default as AIConsultation } from "./AIConsultation";
export type { IAIConsultation } from "./AIConsultation";

export { default as Product, ProductCategory } from "./Product";
export type { IProduct } from "./Product";

export { default as Service } from "./Service";
export type { IService } from "./Service";

export { default as Order, OrderStatus, PaymentMethod } from "./Order";
export type { IOrder } from "./Order";

export { default as Booking, BookingStatus } from "./Booking";
export type { IBooking } from "./Booking";

export { default as Package } from "./Package";
export type { IPackage } from "./Package";

export { default as SubscriptionLog, SubscriptionLogStatus } from "./SubscriptionLog";
export type { ISubscriptionLog } from "./SubscriptionLog";

export { default as Banner, BannerLocation } from "./Banner";
export type { IBanner } from "./Banner";

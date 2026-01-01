export type BookingState =
  | "INIT"
  | "QUEUED"
  | "ADMITTED"
  | "LOCKED"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type Booking = {
  id: string;
  state: BookingState;
  idempotencyKey: string;

  slotId: string;
  userId: string;

  seatNumber: number | null;

  createdAt: Date;
  updatedAt: Date;
};

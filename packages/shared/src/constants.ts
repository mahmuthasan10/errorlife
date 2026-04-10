// ── Uygulama Sabitleri ────────────────────────────────────────
// Her iki platform tarafından kullanılan sabitler.

export const APP_NAME = "ErrorLife";
export const APP_TAGLINE = "Kodlama sorunlarınızı paylaşın, çözüm bulun.";

export const JOB_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  CLOSED: "closed",
} as const;

export const BID_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

export const NOTIFICATION_TYPE = {
  FOLLOW: "FOLLOW",
  BID: "BID",
  MESSAGE: "MESSAGE",
  LIKE: "LIKE",
  COMMENT: "COMMENT",
} as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

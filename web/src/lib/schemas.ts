import { z } from "zod";

// ── Sabit Limitler ────────────────────────────────────────────
export const LIMITS = {
  post: {
    content: { min: 1, max: 500 },
    tags: { max: 10 },
    tagName: { min: 1, max: 50 },
  },
  job: {
    title: { min: 10, max: 200 },
    description: { min: 20, max: 3000 },
  },
  bid: {
    amount: { min: 1 },
    estimatedDays: { min: 1 },
    coverLetter: { min: 10, max: 2000 },
  },
  profile: {
    displayName: { min: 2, max: 50 },
    bio: { max: 300 },
    password: { min: 8 },
  },
  pagination: {
    pageSize: 20,
  },
} as const;

// ── Temel şemalar ─────────────────────────────────────────────
export const uuidSchema = z
  .string()
  .uuid({ message: "Geçersiz ID formatı." });

export const cursorSchema = z.string().uuid().optional();

// ── Post şemaları ─────────────────────────────────────────────
export const tagSchema = z.object({
  name: z.string().min(LIMITS.post.tagName.min).max(LIMITS.post.tagName.max),
  slug: z.string().min(1).max(LIMITS.post.tagName.max),
});

export const createPostSchema = z.object({
  content: z
    .string()
    .min(LIMITS.post.content.min, { message: "Gönderi boş olamaz." })
    .max(LIMITS.post.content.max, {
      message: `Gönderi ${LIMITS.post.content.max} karakteri geçemez.`,
    }),
  imageUrl: z.string().url().optional().nullable(),
  tags: z
    .array(tagSchema)
    .max(LIMITS.post.tags.max, {
      message: `En fazla ${LIMITS.post.tags.max} etiket eklenebilir.`,
    })
    .optional()
    .default([]),
});

export const addCommentSchema = z.object({
  postId: uuidSchema,
  content: z
    .string()
    .min(1, { message: "Yorum boş olamaz." })
    .max(LIMITS.post.content.max, {
      message: `Yorum ${LIMITS.post.content.max} karakteri geçemez.`,
    }),
});

// ── Job şemaları ──────────────────────────────────────────────
export const createJobSchema = z.object({
  title: z
    .string()
    .min(LIMITS.job.title.min, {
      message: `Başlık en az ${LIMITS.job.title.min} karakter olmalıdır.`,
    })
    .max(LIMITS.job.title.max, {
      message: `Başlık ${LIMITS.job.title.max} karakteri geçemez.`,
    }),
  description: z
    .string()
    .min(LIMITS.job.description.min, {
      message: `Açıklama en az ${LIMITS.job.description.min} karakter olmalıdır.`,
    })
    .max(LIMITS.job.description.max, {
      message: `Açıklama ${LIMITS.job.description.max} karakteri geçemez.`,
    }),
  budget: z.number().positive().optional().nullable(),
});

export const createBidSchema = z.object({
  jobId: uuidSchema,
  amount: z.number().min(LIMITS.bid.amount.min, {
    message: `Teklif tutarı en az ${LIMITS.bid.amount.min} olmalıdır.`,
  }),
  estimatedDays: z.number().int().min(LIMITS.bid.estimatedDays.min, {
    message: "Tahmini gün en az 1 olmalıdır.",
  }),
  coverLetter: z
    .string()
    .min(LIMITS.bid.coverLetter.min, {
      message: `Kapak mektubu en az ${LIMITS.bid.coverLetter.min} karakter olmalıdır.`,
    })
    .max(LIMITS.bid.coverLetter.max, {
      message: `Kapak mektubu ${LIMITS.bid.coverLetter.max} karakteri geçemez.`,
    }),
});

// ── Profil şemaları ───────────────────────────────────────────
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(LIMITS.profile.displayName.min, {
      message: `İsim en az ${LIMITS.profile.displayName.min} karakter olmalıdır.`,
    })
    .max(LIMITS.profile.displayName.max, {
      message: `İsim ${LIMITS.profile.displayName.max} karakteri geçemez.`,
    }),
  bio: z
    .string()
    .max(LIMITS.profile.bio.max, {
      message: `Bio ${LIMITS.profile.bio.max} karakteri geçemez.`,
    })
    .optional()
    .nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Mevcut şifre gereklidir." }),
    newPassword: z
      .string()
      .min(LIMITS.profile.password.min, {
        message: `Yeni şifre en az ${LIMITS.profile.password.min} karakter olmalıdır.`,
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

// ── Mesaj şemaları ────────────────────────────────────────────
export const sendMessageSchema = z.object({
  chatId: uuidSchema,
  content: z
    .string()
    .min(1, { message: "Mesaj boş olamaz." })
    .max(2000, { message: "Mesaj 2000 karakteri geçemez." }),
});

// ── Follow şemaları ───────────────────────────────────────────
export const followSchema = z.object({
  targetUserId: uuidSchema,
});

// ── Pagination şemaları ───────────────────────────────────────
export const paginationSchema = z.object({
  userId: uuidSchema,
  cursor: z.string().uuid().optional(),
});

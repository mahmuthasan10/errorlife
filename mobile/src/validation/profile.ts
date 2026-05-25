import { z } from "zod";

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "İsim en az 2 karakter olmalı.")
    .max(60, "İsim en fazla 60 karakter olabilir."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Kullanıcı adı en az 3 karakter olmalı.")
    .max(30, "Kullanıcı adı en fazla 30 karakter olabilir.")
    .regex(/^[a-z0-9_]+$/, "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir."),
  bio: z
    .string()
    .trim()
    .max(160, "Bio en fazla 160 karakter olabilir.")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

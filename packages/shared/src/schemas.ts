// ── Zod Şemaları ──────────────────────────────────────────────
// Her iki platform tarafından kullanılan validasyon şemaları.
// Not: Bu dosyayı kullanmak için 'zod' paketi gereklidir.

// Dinamik import ile Zod'u kullanıyoruz ki bundle'a eklenmesi platforma göre karar verilsin.
// Doğrudan import için: import { z } from "zod";

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

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

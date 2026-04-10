"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";
import { updateProfileSettings } from "@/app/actions/settings";
import type { Profile } from "@/types/database";

interface SettingsFormProps {
  profile: Profile;
}

export default function SettingsForm({ profile }: SettingsFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await updateProfileSettings(formData);

        if (result.error) {
          setError(result.error);
          toast.error(result.error);
        } else if (result.success) {
          toast.success(result.success);
          // Şifre alanını temizle
          const passwordInput = formRef.current?.querySelector(
            'input[name="newPassword"]'
          ) as HTMLInputElement | null;
          if (passwordInput) passwordInput.value = "";
        }
      } catch {
        const msg = "Beklenmeyen bir hata oluştu.";
        setError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="mb-1.5 block text-sm font-medium text-zinc-400"
        >
          Görünen Ad
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={profile.display_name}
          placeholder="Adınızı girin"
          minLength={2}
          maxLength={50}
          required
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
        />
      </div>

      {/* Username (Readonly) */}
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-zinc-400"
        >
          Kullanıcı Adı
        </label>
        <input
          id="username"
          type="text"
          value={profile.username}
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-4 py-3 text-zinc-500 outline-none"
        />
        <p className="mt-1 text-xs text-zinc-600">
          Kullanıcı adı değiştirilemez.
        </p>
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="mb-1.5 block text-sm font-medium text-zinc-400"
        >
          Biyografi
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          placeholder="Kendinizi kısaca tanıtın..."
          maxLength={300}
          rows={3}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
        />
      </div>

      {/* Şifre Bölümü */}
      <div className="border-t border-zinc-800 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">
          Şifre Değiştir
        </h3>
        <div className="relative">
          <label
            htmlFor="newPassword"
            className="mb-1.5 block text-sm font-medium text-zinc-400"
          >
            Yeni Şifre
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Değiştirmek istemiyorsanız boş bırakın"
              minLength={8}
              autoComplete="new-password"
              onChange={(e) => setPasswordValue(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 pr-20 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {passwordValue.length > 0 && (
                <span
                  className={`transition-colors ${
                    passwordValue.length >= 8 ? "text-green-400" : "text-zinc-600"
                  }`}
                >
                  <Check size={16} />
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            En az 8 karakter. Boş bırakırsanız şifreniz değişmez.
          </p>
        </div>
      </div>

      {/* Hata */}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            "Değişiklikleri Kaydet"
          )}
        </button>
      </div>
    </form>
  );
}

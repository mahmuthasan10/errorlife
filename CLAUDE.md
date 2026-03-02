# ErrorLife Proje Kuralları

## Tech Stack
- **Web:** Next.js
- **Mobil:** React Native Expo
- **Backend/Auth/DB:** Supabase (PostgreSQL + Realtime)
- **Styling:** Tailwind CSS

## Mimari
- Web ve Mobil projeleri aynı ana klasörde ayrı dizinlerde tutulur:
  - `web/` — Next.js web uygulaması
  - `mobile/` — React Native Expo mobil uygulaması
- Ortak tipler ve yardımcı fonksiyonlar paylaşılabilir şekilde yapılandırılmalı.

## Veritabanı
- Supabase PostgreSQL kullanılır.
- Realtime özellikleri (subscriptions, presence) aktif olarak kullanılacak.
- Migration dosyaları versiyon kontrolünde tutulmalı.

## Stil & Tasarım
- X (Twitter) klonu tasarım dili: modern, temiz, minimal UI.
- Tailwind CSS ile stil verilir, inline style kullanılmaz.
- Responsive tasarım her sayfada zorunlu.

## Yapay Zeka
- OpenAI API entegrasyonu ile:
  - Metin düzenleme (gramer, ton ayarı)
  - Otomatik etiketleme (JSON formatında çıktı)
- API anahtarları `.env` dosyasında tutulur, asla koda yazılmaz.

## Hata Yönetimi (KRİTİK)
- **Her kod bloğundan sonra "Hata Kontrolü" yap.**
- Debug birikmesine asla izin verme — hata bulunursa anında düzelt, biriktirme.
- Try-catch blokları ile hata yakalama zorunlu (API çağrıları, DB sorguları).
- Kullanıcıya anlamlı hata mesajları göster, ham hata fırlatma.
- Console.log yerine yapılandırılmış loglama kullan (production'da console.log olmamalı).
- Her PR/commit öncesi lint ve type-check geçmeli.

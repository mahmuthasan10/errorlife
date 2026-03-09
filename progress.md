# ErrorLife - Proje Yol Haritası & İlerleme Takibi

---

## 1. Aşama: Temel Mimari ve Kurulum (Hafta 1-3)
> Projenin temelinin atıldığı ve veritabanı mimarisinin kurgulandığı aşama.

### Hafta 1: Proje Analizi ve Veritabanı Şeması
- [x] Gereksinimlerin belirlenmesi
- [x] Supabase üzerinde PostgreSQL tablolarının tasarlanması
  - [x] `Users` tablosu
  - [x] `Posts` tablosu
  - [x] `Jobs` tablosu
  - [x] `Tags` tablosu
- [x] Tablolar arası ilişkilerin (foreign key, many-to-many) tasarlanması

### Hafta 2: Ortam Kurulumları ve Kimlik Doğrulama
- [x] Next.js (Web) projesinin başlatılması
- [x] React Native / Expo (Mobil) projesinin başlatılması
- [x] Supabase Auth entegrasyonu
  - [x] Web — Kayıt Ol / Giriş Yap
  - [ ] Mobil — Kayıt Ol / Giriş Yap

### Hafta 3: UI/UX İskeleti
- [x] X (Twitter) benzeri 3 kolonlu web arayüzünün Tailwind CSS ile kodlanması (dummy verilerle)
- [ ] Mobil ana ekranın Tailwind CSS (NativeWind) ile kodlanması (dummy verilerle)

---

## 2. Aşama: Çekirdek Özellikler ve Senkronizasyon (Hafta 4-7)
> Platformun çalışmaya başladığı ve verilerin web-mobil arası aktığı dönem.

### Hafta 4: Akış (Feed) ve CRUD İşlemleri
- [x] Gönderi (Post) oluşturma
- [x] Gönderi silme
- [x] Ana akışta gönderilerin listelenmesi (Feed)

### Hafta 5: Etkileşim Sistemleri
- [x] Beğenme (Like) fonksiyonu — veritabanı bağlantısı
- [x] Yorum Yapma (Comment) fonksiyonu — veritabanı bağlantısı
- [x] Kaydetme (Bookmark) fonksiyonu — veritabanı bağlantısı

### Hafta 6: Gerçek Zamanlı Senkronizasyon (Realtime)
- [ ] Supabase Realtime entegrasyonu
- [ ] Web'de atılan gönderinin sayfayı yenilemeden mobildeki akışa anında düşmesi
- [ ] Mobilde atılan gönderinin web akışına anında yansıması

### Hafta 7: Bildirim Altyapısı
- [ ] Push Notification altyapısının kurulması
- [ ] Uygulama içi bildirim iskeletinin oluşturulması

---

## 3. Aşama: Yapay Zeka ve Gelişmiş Özellikler (Hafta 8-11)
> ErrorLife'ı sıradan bir platform olmaktan çıkarıp zeki bir sisteme dönüştüren aşama.

### Hafta 8: AI Entegrasyonu (Hibrit Model)
- [x] OpenAI / Anthropic API bağlantısının kurulması
- [x] Karmaşık metin düzenleme servisinin yazılması
- [x] Metne uygun meslek/kategori etiketi dönen servisin yazılması (JSON formatında)

### Hafta 9: AI Onay Ekranı ve Etiketleme
- [x] Gönderi paylaşılmadan önce AI önizleme ekranının oluşturulması
  - [x] "Bunu mu demek istedin? [Düzenlenmiş Metin] — [Etiket]" arayüzü
- [x] Kullanıcı onay mekanizmasının entegrasyonu

### Hafta 10: "Armut" Modeli (İlan Sistemi)
- [ ] Yardım ilanı / iş talebi oluşturma formu
- [ ] İlanların ayrı bir sekmede listelenmesi
- [ ] İlan detay sayfası

### Hafta 11: Teklif ve Arama Sistemi
- [ ] İlanlara çözüm ve fiyat teklifi sunma mekanizması
- [ ] Metin bazlı arama (Search) özelliği
- [ ] Etiketlere göre filtreleme özelliği

---

## 4. Aşama: Optimizasyon, Test ve Canlıya Alma (Hafta 12-14)
> Projenin hatasız ve pürüzsüz çalışması için yapılan son dokunuşlar.

### Hafta 12: Kod Refactoring ve Performans İyileştirmesi
- [ ] Karmaşık kodların temizlenmesi ve refactor edilmesi
- [ ] Sayfa yüklenme hızlarının optimize edilmesi
- [ ] Mobil akıcılığın (FPS, render) optimize edilmesi

### Hafta 13: Kapsamlı Test (QA & Debugging)
- [ ] Uç senaryoların test edilmesi
- [ ] Web ↔ Mobil senkronizasyonunda veri kaybı kontrolü
- [ ] Eksik veya hatalı UI elemanlarının düzeltilmesi

### Hafta 14: Canlıya Alma (Deployment)
- [ ] Next.js projesinin Vercel'e deploy edilmesi
- [ ] Mobil uygulamanın TestFlight (iOS) için hazırlanması
- [ ] Mobil uygulamanın APK (Android) olarak dağıtılması
- [ ] Son kontroller ve canlı ortam doğrulaması

---

> **Toplam Süre:** ~14 Hafta | **Başlangıç:** Hafta 1 | **Hedef Bitiş:** Hafta 14

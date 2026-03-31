# ErrorLife - Proje Yol Haritası & İlerleme Takibi

---

## 1. Aşama: Çekirdek Mimari ve Mikroblog Altyapısı (Hafta 1-3)
> Projenin temelinin atıldığı, veritabanı şemalarının ve temel akışın kurgulandığı aşama.

### Hafta 1: Sistem Analizi, Veritabanı Şeması ve Kimlik Doğrulama
- [x] Gereksinim analizi ve Supabase veritabanı şemasının (Users, Posts, Tags) tasarlanması
- [x] Next.js (Web) monorepo mimarisinin kurulması
- [x] Supabase Auth entegrasyonu (Kayıt Ol / Giriş Yap)

### Hafta 2: Temel Akış (Feed) ve Etkileşimler
- [x] Gönderi (Post) oluşturma, listeleme ve silme (CRUD işlemleri)
- [x] Beğenme (Like), Yorum Yapma (Comment) ve Kaydetme (Bookmark) fonksiyonları
- [x] Performans için COUNT(*) yerine PostgreSQL Counter Trigger'larının yazılması

### Hafta 3: Yapay Zeka (AI) ve Gerçek Zamanlı (Realtime) Temelleri
- [x] Vercel AI SDK entegrasyonu ile "AI Destekli İçerik İyileştirme" 
- [x] Supabase Realtime ile anlık gönderi akışının (Feed) sağlanması (Sayfa yenilemeden)
- [x] AI'dan dönen Zod formatlı etiketlerin (tags) normalize tablolarla ilişkilendirilmesi

---

## 2. Aşama: İş Modeli (Armut) ve Teklifler (Hafta 4-5)
> Sistemin sadece bir sosyal ağ olmaktan çıkıp, hizmet platformuna dönüştüğü evre.

### Hafta 4: İlanlar (Jobs) Modülü
- [x] `jobs` tablosunun RLS politikaları ile kurulması
- [x] Zod validasyonlu güvenli İlan Oluşturma formunun (Server Actions) yazılması
- [x] "Tüm İlanlar", "Benim İlanlarım" için URL parametreli dinamik Tab yapısı

### Hafta 5: Teklif (Bids) Mekanizması ve Durum Makinesi
- [x] `bids` tablosunun kurulması ve ilana teklif verme sisteminin yazılması
- [x] Teklif Kabul/Red sistemi ve "Akıllı Trigger" (Biri kabul edilince diğerlerini reddetme)
- [x] Reddedilen tekliflerin revize edilerek tekrar gönderilebilmesi (Re-Bid) UX akışı

---

## 3. Aşama: Sosyal Ağ Genişlemesi ve İletişim (Hafta 6-8)
> Takip, Mesajlaşma ve Bildirimlerle kullanıcıların birbirine bağlandığı yeni jenerasyon etkileşim dönemi.

### Hafta 6: Profil, Ayarlar ve Takip Sistemi (Follow)
- [x] `follows` tablosunun (follower/following ilişkisi) kurulması ve sayacının yazılması
- [x] Twitter (X) benzeri Profil sayfasının (Gönderiler, Beğeniler, İlanlar sekmeleri) altyapısının kurulması
- [x] Kullanıcı profilini ve şifresini güncelleyebileceği Ayarlar (Settings) sayfasının oluşturulması

### Hafta 7: Direkt Mesajlaşma (DM) Altyapısı
- [x] `chats` (Odalar) ve `messages` (Mesajlar) tablolarının kurulması
- [x] İki kullanıcı arasında güvenli mesajlaşmayı sağlayan RLS politikalarının yazılması
- [x] Supabase Realtime ile sayfa yenilemeden anlık mesajlaşma (Chat) UX'inin oluşturulması

### Hafta 8: Gerçek Zamanlı Bildirim Merkezi (Notifications)
- [x] `notifications` tablosunun tasarlanması (Takip, Mesaj, Teklif bildirimleri)
- [x] Bir etkileşim (Bid, Follow, Like) olduğunda otomatik bildirim üreten Trigger'ların yazılması
- [x] İlan sahibinin ekranına Supabase Realtime ile anında bildirimin (Toast) düşmesi

---

## 4. Aşama: Frontend Revizyonu ve UX/UI (Hafta 9-10)
> Tüm arka plan özellikleri biten projenin, premium bir platform hissiyatına kavuşturulduğu tasarım dönemi.

### Hafta 9: Tasarım Sistemi, Profil ve Akış (Feed) Revizyonu
- [x] Tailwind CSS konfigürasyonunun genişletilmesi, Ortak bileşenlerin (Butonlar, Inputlar) şıklaştırılması
- [x] Sayfa yüklenme anları için Skeleton Loader iskeletlerinin eklenmesi
- [x] Profil sayfası, Ana Akış ve Ayarlar'ın Twitter standartlarında görselleştirilmesi

### Hafta 10: Armut Modeli (Jobs) ve Chat UI Revizyonu
- [ ] İlan detay sayfasının (Upwork/Armut benzeri) profesyonel bir arayüze kavuşturulması
- [ ] DM (Mesajlaşma) ekranının WhatsApp/X Chat pencereleri gibi modernleştirilmesi
- [ ] Mobil web görünümü (Responsive Layout) için Sidebar düzeltmeleri

---

## 5. Aşama: Mobil Uygulama Entegrasyonu (Hafta 11-12)
> Web'de kusursuz çalışan mimarinin, monorepo üzerinden React Native (Expo) ile mobillere taşınması.

### Hafta 11: Mobil Temeller, Auth ve Akış
- [ ] Expo projesinin ayağa kaldırılması, NativeWind (Tailwind) ve Navigasyon entegrasyonu
- [ ] Supabase Auth ile mobil giriş/kayıt ekranının kodlanması
- [ ] Web'deki Feed, Profil ve Takip sisteminin mobilde API üzerinden tüketilmesi

### Hafta 12: Mobil İlanlar, Mesajlaşma ve Bildirimler
- [ ] İlanlar (Jobs) ve Teklif (Bids) ekranlarının mobil arayüzlerinin kodlanması
- [ ] DM (Mesajlaşma) modülünün mobil chat ekranı olarak entegre edilmesi
- [ ] Mobil cihazlar için Push Notification (Expo Notifications) testleri

---

## 6. Aşama: Optimizasyon, Test ve Canlıya Alma (Hafta 13-14)
> Projenin piyasaya sürülmeden önceki son hata ayıklama ve sunucu hazırlıkları.

### Hafta 13: QA, Test ve Code Refactoring
- [ ] Tüm veri girişlerinin uç senaryolarla test edilmesi, Yetkisiz mesajlaşma güvenlik (RLS) testleri
- [ ] Kod refactoring (Tekrarlayan kodların lib/utils klasörüne çekilmesi)

### Hafta 14: Deployment (Canlıya Alma) ve Lansman
- [ ] Next.js projesinin Vercel'e deploy edilmesi ve domain bağlanması
- [ ] Mobil uygulamanın APK (Android) / TestFlight (iOS) olarak build alınması
- [ ] Jüri/Yatırımcı sunumu için projenin genel mimari şemalarının çıkarılması

---

> **Durum:** Aşama 2 (Hafta 5) Tamamlandı | **Sıradaki Odak:** Hafta 6 (Profil & Takip Sistemi)
# ErrorLife — Acımasız Kıdemli Mimar Denetim Raporu & Düzeltme Planı

## Context
Mobil (React Native) geçiş öncesinde Web ve Backend'te sıfır teknik borç bırakmak amacıyla yapılan derinlemesine kod denetimi. Tüm bulgu dosya yolları ve satır numaraları bizzat doğrulanmıştır.

---

## 1. 🔒 GÜVENLİK, RLS VE AUTHORIZATION

### [S-01] KRİTİK — `create_post_with_tags` RPC istemciden `p_user_id` kabul ediyor
- **Dosya:** `supabase/migrations/004_create_post_rpc.sql:8-9`
- **Sorun:** `SECURITY DEFINER` fonksiyon RLS'yi bypass eder. `p_user_id` parametresi dışarıdan geldiği için kötü niyetli bir kullanıcı başkası adına post oluşturabilir. Şu anda server action (`web/src/app/actions.ts:41`) `user.id`'yi session'dan alıyor, ancak bu RPC doğrudan çağrılırsa (mobile, Postman, vs.) sorun patlar.
- **Düzeltme:** Yeni migration oluştur:
```sql
-- 014_fix_create_post_rpc.sql
CREATE OR REPLACE FUNCTION public.create_post_with_tags(
  p_content text,
  p_image_url text DEFAULT NULL,
  p_tags jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_id uuid;
  v_tag record;
  v_tag_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO posts (user_id, content, image_url)
  VALUES (v_user_id, p_content, p_image_url)
  RETURNING id INTO v_post_id;

  IF p_tags IS NOT NULL AND jsonb_array_length(p_tags) > 0 THEN
    FOR v_tag IN SELECT * FROM jsonb_to_recordset(p_tags) AS t(name text, slug text)
    LOOP
      INSERT INTO tags (name, slug) VALUES (v_tag.name, v_tag.slug)
      ON CONFLICT (slug) DO NOTHING;
      SELECT id INTO v_tag_id FROM tags WHERE slug = v_tag.slug;
      INSERT INTO post_tags (post_id, tag_id) VALUES (v_post_id, v_tag_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN v_post_id;
END;
$$;
```
- **Web tarafı değişiklik:** `web/src/app/actions.ts:40-45` — `p_user_id: user.id` parametresini kaldır.

### [S-02] YÜKSEK — `bids` UPDATE policy'de WITH CHECK eksik
- **Dosya:** `supabase/migrations/006_fix_bids_rls.sql:2-7`
- **Sorun:** İlan sahibi UPDATE yapabilir ama `WITH CHECK` olmadığı için güncellenen satırın da kurala uyduğu doğrulanmıyor. Teorik olarak `job_id` veya `expert_id` gibi alanları da değiştirebilir.
- **Düzeltme:** Yeni migration:
```sql
DROP POLICY IF EXISTS "İlan sahibi teklifin durumunu güncelleyebilir" ON public.bids;
CREATE POLICY "İlan sahibi teklifin durumunu güncelleyebilir"
  ON public.bids FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.jobs WHERE id = bids.job_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.jobs WHERE id = bids.job_id));
```

### [S-03] YÜKSEK — Messages UPDATE'te kolon kısıtlaması yok
- **Dosya:** `supabase/migrations/008_chat_schema.sql:119-134`
- **Sorun:** Alıcı mesajı `is_read` olarak işaretleyebilir ama `content`, `sender_id` gibi alanları da değiştirebilir.
- **Düzeltme:** Yeni migration'da değiştirilemez alanları koruyan trigger:
```sql
CREATE OR REPLACE FUNCTION public.restrict_message_update()
RETURNS trigger AS $$
BEGIN
  NEW.content    := OLD.content;
  NEW.sender_id  := OLD.sender_id;
  NEW.chat_id    := OLD.chat_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restrict_message_update
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.restrict_message_update();
```

### [S-04] YÜKSEK — `startChat` input validation yok
- **Dosya:** `web/src/app/actions/chat.ts:19-23`
- **Sorun:** `targetUserId` Zod ile doğrulanmıyor. Geçersiz UUID veya boş string hata yaratabilir.
- **Düzeltme:**
```typescript
import { z } from "zod";
const uuidSchema = z.string().uuid("Geçersiz kullanıcı kimliği.");

export async function startChat(targetUserId: string) {
  const parsed = uuidSchema.safeParse(targetUserId);
  if (!parsed.success) return { chatId: null, error: parsed.error.issues[0].message };
  return getOrCreateChat(parsed.data);
}
```

### [S-05] YÜKSEK — `createPost` tags JSON.parse doğrulaması yok
- **Dosya:** `web/src/app/actions.ts:16-17`
- **Sorun:** `JSON.parse(tagsRaw)` try-catch olmadan ve Zod doğrulaması olmadan çalışıyor. Bozuk JSON sunucu hatasına neden olur.
- **Düzeltme:**
```typescript
let tags: string[] = [];
if (tagsRaw) {
  try {
    const raw = JSON.parse(tagsRaw);
    const result = z.array(z.string().min(1).max(50)).max(10).safeParse(raw);
    if (!result.success) return { error: "Geçersiz etiket formatı." };
    tags = result.data;
  } catch {
    return { error: "Etiketler ayrıştırılamadı." };
  }
}
```

### [S-06] YÜKSEK — Like/Bookmark toggle race condition
- **Dosya:** `web/src/app/actions/interactions.ts:20-47` (toggleLike), `71-98` (toggleBookmark)
- **Sorun:** Non-atomic SELECT -> IF -> DELETE/INSERT pattern. Çift tıklama veya paralel istek duplicate insert yapabilir. `23505` handling var ama delete path'inde race condition kalır.
- **Düzeltme — Atomic toggle pattern:**
```typescript
// Önce INSERT dene
const { error: insertError } = await supabase
  .from("likes")
  .insert({ user_id: user.id, post_id: postId });

if (insertError) {
  if (insertError.code === "23505") {
    // Zaten var -> kaldır
    const { error: delError } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (delError) return { error: `Beğeni kaldırılamadı: ${delError.message}` };
  } else {
    return { error: `Beğeni eklenemedi: ${insertError.message}` };
  }
}
```

### [S-07] ORTA — Şifre minimum 6 karakter
- **Dosya:** `web/src/app/actions/settings.ts:19-25`
- **Düzeltme:** `val.length >= 6` -> `val.length >= 8`

### [S-08] ORTA — Dosya yükleme sadece MIME-type kontrolü
- **Dosya:** `web/src/app/actions/upload.ts:42-44`
- **Sorun:** Kullanıcı MIME type sahteleyebilir. Dosya magic bytes doğrulanmıyor.
- **Düzeltme:** Dosyanın ilk 4-8 byte'ını kontrol eden yardımcı fonksiyon ekle.

### [S-09] ORTA — Search RPC'lerde ILIKE wildcard escape yok
- **Dosya:** `supabase/migrations/010_search_and_trending.sql:70-74`
- **Sorun:** `ILIKE '%' || p_query || '%'` — `%` ve `_` wildcard karakterleri escape edilmiyor.
- **Düzeltme:** RPC içinde escape fonksiyonu ekle.

### [S-10] DÜŞÜK — Search RPC'lerde p_limit sınırsız
- **Dosya:** `supabase/migrations/010_search_and_trending.sql`
- **Düzeltme:** `LIMIT LEAST(p_limit, 100)` kullan.

---

## 2. ⚙️ İŞ MANTIĞI VE EDGE CASE'LER

### [B-01] KRİTİK — Actor profili silindiğinde notification UI çöküyor
- **Dosya:** `web/src/app/_components/notification-item.tsx:101-109`
- **Sorun:** `notification.actor` null olabilir (actor hesabını sildiğinde `ON DELETE CASCADE` ile notification kalır ama profiles satırı gider -> join null döner). `notification.actor.avatar_url` ve `.display_name` erişimi TypeError fırlatır -> beyaz ekran.
- **Düzeltme — notification-item.tsx başına guard:**
```tsx
export default function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Actor silindiyse güvenli çıkış
  if (!notification.actor) {
    return null;
  }

  const config = NOTIFICATION_CONFIG[notification.type];
  // ... devam
```
- **Ek:** Notification queries'de `.not('actor_id', 'is', null)` filtresi veya `INNER JOIN` kullan.

### [B-02] KRİTİK — Silinen entity'lere ait notification orphan kalıyor
- **Dosya:** `supabase/migrations/009_notifications_schema.sql:15`
- **Sorun:** `entity_id` kolonunda FK yok. Post/job/chat silindiğinde notification hala eski entity_id'ye işaret eder -> kullanıcı tıkladığında 404.
- **Düzeltme — Entity silme trigger'ları:**
```sql
-- Post silindiğinde LIKE ve COMMENT notification'larını temizle
CREATE OR REPLACE FUNCTION public.cleanup_notifications_on_post_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications WHERE entity_id = OLD.id AND type IN ('LIKE', 'COMMENT');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trg_cleanup_post_notifications
  AFTER DELETE ON public.posts FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_notifications_on_post_delete();

-- Chat silindiğinde MESSAGE notification'larını temizle
CREATE OR REPLACE FUNCTION public.cleanup_notifications_on_chat_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications WHERE entity_id = OLD.id AND type = 'MESSAGE';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trg_cleanup_chat_notifications
  AFTER DELETE ON public.chats FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_notifications_on_chat_delete();

-- Job silindiğinde (bids cascade delete -> entity_id bid'e referans verir)
CREATE OR REPLACE FUNCTION public.cleanup_notifications_on_job_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE type = 'BID' AND entity_id IN (SELECT id FROM public.bids WHERE job_id = OLD.id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trg_cleanup_job_notifications
  BEFORE DELETE ON public.jobs FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_notifications_on_job_delete();
```

### [B-03] YÜKSEK — COMMENT tipi notification-provider toast'ta eksik
- **Dosya:** `web/src/app/_components/notification-provider.tsx:12-42`
- **Sorun:** `NotificationPayload["type"]` sadece `"FOLLOW" | "BID" | "MESSAGE" | "LIKE"` içeriyor. Migration 013 ile COMMENT tipi eklenmiş ama provider güncellenmemiş. Yorum bildirimi geldiğinde toast gösterilmiyor.
- **Düzeltme:**
```typescript
// Satır 5'e import ekle:
import { UserCheck, Heart, MessageCircle, DollarSign, MessageSquare } from "lucide-react";

// Satır 13 — type'a COMMENT ekle:
type: "FOLLOW" | "BID" | "MESSAGE" | "LIKE" | "COMMENT";

// Satır 41'den sonra COMMENT config ekle:
COMMENT: {
  text: "Gönderine yeni bir yorum yapıldı!",
  icon: MessageSquare,
  iconClass: "text-orange-400",
},
```

### [B-04] YÜKSEK — Jobs listesinde LIMIT yok
- **Dosya:** `web/src/app/jobs/page.tsx:24-34` (getOpenJobs), `43-56` (getMyJobs), `62-76` (getMyBids)
- **Sorun:** Hiçbir sorguda `.limit()` yok. Tüm açık ilanlar, tüm kullanıcı ilanları ve tüm teklifler tek seferde çekiliyor.
- **Düzeltme (minimum):** Her sorguya `.limit(50)` ekle. Kalıcı çözüm: Kategori 3'teki pagination.

### [B-05] İYİ — Bid kabul/red mantığı
- `acceptBid()` (jobs.ts:196-248): Sahiplik kontrolü OK, durum kontrolü OK, DB trigger diğer bid'leri otomatik reddediyor OK
- `rejectBid()` (jobs.ts:314-361): Sahiplik kontrolü OK
- `createBid()` (jobs.ts:97-194): Duplicate check OK, rejected retry OK, 23505 handling OK
- **Cascade delete:** Post/Job silindiğinde ilişkili veriler `ON DELETE CASCADE` ile temizleniyor OK

---

## 3. 🎨 UX VE FRONTEND PERFORMANSI

### [U-01] KRİTİK — Hiçbir sayfada Pagination / Infinite Scroll yok
Etkilenen sayfalar:

| Dosya | Satır | Mevcut Durum |
|-------|-------|-------------|
| `web/src/app/page.tsx` | 22 | `.limit(50)` — sabit, devamı yok |
| `web/src/app/jobs/page.tsx` | 24-76 | LIMIT YOK — tüm ilanlar |
| `web/src/app/notifications/page.tsx` | ~10 | Tüm bildirimler |
| `web/src/app/messages/page.tsx` | ~45 | Tüm sohbetler |
| `web/src/app/profile/[username]/_components/posts-tab.tsx` | ~107 | LIMIT YOK |
| `web/src/app/profile/[username]/_components/jobs-tab.tsx` | ~81 | LIMIT YOK |
| `web/src/app/profile/[username]/_components/likes-tab.tsx` | ~92 | LIMIT YOK |
| `web/src/app/profile/[username]/followers/page.tsx` | ~21 | LIMIT YOK |
| `web/src/app/profile/[username]/following/page.tsx` | ~20 | LIMIT YOK |

**Çözüm — Cursor-based infinite scroll:**
1. Reusable `useInfiniteScroll` hook oluştur (`web/src/hooks/use-infinite-scroll.ts`)
2. Server-side ilk 20 kayıt, client-side IntersectionObserver ile devamı
3. Search RPC'leri zaten `p_limit` ve `p_offset` destekliyor — bunları kullan
4. **Öncelik sırası:** Feed > Jobs > Profil tabları > Mesajlar > Bildirimler

### [U-02] YÜKSEK — Form submission optimistic preview yok
- **İyi olanlar:** Like OK, Bookmark OK, Follow OK, Comment OK — hepsi optimistic
- **Eksik olanlar:**
  - `create-post-form.tsx` — Post oluşturduktan sonra kullanıcı içeriğini hemen görmüyor
  - `create-job-form.tsx` — İlan oluşturduktan sonra listeye ekleme yok
  - `create-bid-form.tsx` — Teklif gönderdikten sonra başarı durumu gecikiyor

### [U-03] YÜKSEK — Veri çekme hatalarında kullanıcıya geri bildirim yok
- **Sorun:** Tüm `getXxx()` fonksiyonları hata durumunda sessizce `[]` döndürüyor
- **Örnek:** `page.tsx:24-26` -> `if (error) return [];`
- **Kullanıcı boş sayfa görüyor** ama ağ hatası mı, gerçekten veri yok mu bilemez
- **Düzeltme:** Error state döndür, component'te "Yüklenemedi. Tekrar dene" butonu göster

---

## 4. 🚀 MOBİLE GEÇİŞ İÇİN "BİTİRME" CHECKLIST'İ

### [M-01] KRİTİK — Server Action'lardaki iş mantığı RPC'ye taşınmalı

React Native, Next.js server action'larını kullanamaz. Aşağıdaki işlemler Supabase RPC'ye taşınmalı:

| İşlem | Dosya:Satır | Neden |
|-------|-------------|-------|
| `acceptBid()` | `actions/jobs.ts:196-248` | Sahiplik + durum kontrolü + trigger |
| `rejectBid()` | `actions/jobs.ts:314-361` | Sahiplik kontrolü |
| `createBid()` | `actions/jobs.ts:97-194` | Duplicate check + rejected retry |
| `createJob()` | `actions/jobs.ts:44-95` | Validation -> PG check constraint |
| `updateJobStatus()` | `actions/jobs.ts:280-312` | Sahiplik + durum geçişi |

**Çözüm:** Her biri için Supabase RPC fonksiyonu yaz. Örnek `accept_bid`:
```sql
CREATE OR REPLACE FUNCTION public.accept_bid(p_bid_id uuid, p_job_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_job record;
BEGIN
  SELECT user_id, status INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF v_job.user_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_job.status <> 'open' THEN RAISE EXCEPTION 'Job not open'; END IF;
  UPDATE bids SET status = 'accepted' WHERE id = p_bid_id AND job_id = p_job_id;
END; $$;
```
Sonra web'deki server action'ları da aynı RPC'yi çağıracak şekilde refactor et -> **tek kaynak (single source of truth)**.

### [M-02] YÜKSEK — Zaten mobil-hazır olanlar (aksiyon gerekmez)
- `create_post_with_tags()` RPC — mevcut (S-01 düzeltmesinden sonra)
- `search_posts()`, `search_users()`, `search_jobs()` RPC'leri — mevcut, pagination-ready
- `get_trending_tags()` RPC — mevcut
- Like/Bookmark/Follow/Comment toggle — RLS + direct table ops yeterli
- Message send/read — RLS + direct table ops yeterli
- Realtime subscriptions — Supabase JS client her iki platformda çalışır

### [M-03] ORTA — Shared types paketi oluşturulmalı
- Mevcut: `web/src/types/database.ts`
- Sorun: Tip tanımları web projesine gömülü. Mobilde yeniden kullanılamaz.
- Çözüm: `packages/shared/` altında tip, Zod şema ve sabit tanımları paylaş.

---

## UYGULAMA SIRASI (Önerilen Sprint Planı)

### Sprint 1 — Acil Güvenlik (3-4 gün)
- [x] [S-01] RPC `create_post_with_tags` fix + web refactor (014_fix_create_post_rpc.sql)
- [x] [S-02] Bids UPDATE WITH CHECK (015_security_fixes.sql)
- [x] [S-03] Messages UPDATE kolon kısıtlama trigger (015_security_fixes.sql)
- [x] [S-05] createPost tags validation (actions.ts Zod)
- [x] [B-01] notification-item null actor guard
- [x] [B-02] Entity silme notification cleanup trigger'ları (017_notification_cleanup_triggers.sql)
- [x] [B-03] notification-provider COMMENT ekleme

### Sprint 2 — Güvenlik Tamamlama (2-3 gün)
- [x] [S-04] startChat input validation (uuidSchema)
- [x] [S-06] Like/Bookmark atomic toggle (interactions.ts)
- [x] [S-07] Şifre minimum 8 karakter (settings.ts)
- [x] [S-08] Upload magic bytes doğrulama (upload.ts)
- [x] [S-09] Search ILIKE escape (016_search_security_fixes.sql)
- [x] [S-10] Search p_limit sınırlama (LEAST(p_limit,100))
- [x] [B-04] Jobs sorguları limit ekleme

### Sprint 3 — Pagination (4-5 gün)
- [x] [U-01] Infinite scroll hook + tüm sayfalara uygulama
- [x] Feed (realtime-feed.tsx) — IntersectionObserver sentinel
- [x] Jobs (jobs-feed-client.tsx) — OpenJobsList, MyJobsList, MyBidsList
- [x] Profil tabları — posts-list-client.tsx, likes-list-client.tsx, jobs-list-client.tsx
- [x] Followers/Following — users-list-client.tsx

### Sprint 4 — UX İyileştirme (2-3 gün)
- [x] [U-02] Form optimistic preview
  - [x] create-job-form.tsx → JobFeedContext + skeleton (job-feed-context.tsx)
  - [x] jobs-feed-client.tsx → JobSkeleton (OpenJobsList + MyJobsList)
  - [x] create-bid-form.tsx → loading anında anlık "Gönderiliyor..." paneli
- [x] [U-03] Data error boundary component
  - [x] FetchError reusable bileşeni (fetch-error.tsx) — "Tekrar Dene" router.refresh()
  - [x] page.tsx (feed) + jobs/page.tsx — sunucu hata ayırt etme
  - [x] pagination.ts — tüm fonksiyonlar {data, fetchError} döndürüyor
  - [x] realtime-feed, jobs-feed-client, posts/likes/jobs/users-list-client — loadMore hata satırı + retry

### Sprint 5 — Mobil Hazırlık (4-5 gün)
- [x] [M-01] 5 server action -> Supabase RPC dönüşümü (018_job_rpcs.sql + 019_fix_accept_bid_race.sql)
- [x] [M-03] Shared types paketi oluşturma (packages/shared/)

---

## Doğrulama (Verification)

Her sprint sonunda:
1. Supabase Dashboard -> SQL Editor'da RLS test sorguları çalıştır (farklı kullanıcı rolleriyle)
2. Dev server'ı başlat, preview ile tüm akışları test et
3. Notification senaryoları: Kullanıcı sil -> diğer kullanıcının bildirimleri crash etmemeli
4. Entity sil -> ilgili notification kaybolmalı
5. Like/Bookmark butonlarına hızlı çift tıkla -> race condition olmamalı
6. Jobs sayfası 100+ ilan ile test -> pagination çalışmalı

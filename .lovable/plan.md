# İlk Açılış / "Refresh Atınca Düzeliyor" Sorununun Düzeltilmesi

## Tespit edilen kök nedenler

Kodu inceledim. Sorunun gerçek nedeni Next.js hydration değil (proje Vite/React SPA) — birden fazla küçük problem üst üste binmiş durumda:

### 1) Auth race condition (asıl neden)
`src/hooks/useEntries.ts` queryKey'i `user?.id ?? "anon"` içeriyor ama `enabled` yok. Akış şu:

1. Sayfa yüklenir → `AuthContext.loading = true`, `user = null`
2. `useEntries` hemen "anon" queryKey ile RPC'yi çağırır (henüz JWT yok, header'sız gider)
3. `supabase.auth.getSession()` localStorage'dan session'ı geri yükler → `user` set olur
4. queryKey değişir → ikinci RPC çağrısı (bu sefer JWT ile)
5. İlk cevap "anon" cache'inde kalır, ikinci cevap gelene kadar UI ilkini gösterir — DB yükü %99 olduğunda ikincisi çok geç gelir ve kullanıcı boş/yarım liste görür. Refresh'te session anında hazır olduğu için tek istek gider ve sayfa açılır.

Lovable Stack Overflow notundaki "useAuthReady" pattern'ı tam bu durum için. Kod halihazırda `AuthContext.loading` expose ediyor ama kullanılmıyor.

### 2) Boş Suspense fallback
`src/App.tsx`'te lazy route'lar var ama fallback `<div className="min-h-screen bg-background" />` — yani tamamen boş. Chunk yavaş yüklenirken kullanıcı bembeyaz/siyah ekran görüyor ve "açılmıyor" sanıyor.

### 3) Service worker kill-switch reload davranışı
`public/sw.js` activate sırasında **tüm açık sekmelerde** `client.navigate(url + ?sw-cleanup=...)` çağırıyor. Eski SW'si olan ziyaretçilerde bu, ilk ziyarette otomatik bir reload demek. Çoğu kullanıcı için bir kez çalıştı (localStorage `score-sw-cleanup-version` set edildi) — ama ilk seferki o reload "ilk açılışta yüklenmiyor, refresh düzeltiyor" hissini birebir yaratıyor.

### 4) ReportTable loading state'i çıplak metin
Veri beklerken sadece "yükleniyor..." text'i var. Skeleton yok, kullanıcı boş ekran sanıyor.

## Yapılacaklar

### A. Auth-ready gating (`src/hooks/useEntries.ts` ve `useEntry`)
- `useAuth()`'tan `loading` değerini de al
- `useQuery({ enabled: !loading, ... })` ekle
- queryKey'i `loading ? "loading" : (user?.id ?? "anon")` yap → loading sırasında query hiç çalışmasın, tek seferde doğru kullanıcıyla atılsın
- Aynı pattern'ı race açısından kritik diğer hook'lara da uygula: `useNotifications`, mesaj listesi, profil sayfası query'leri (kısa audit yapacağım, sadece auth.uid()'ye bağımlı olanlara)

### B. App.tsx Suspense fallback'i görünür yap
Boş `<div>` yerine merkezde küçük bir spinner + arka planda Header iskeleti. Eski tasarımla uyumlu, jank yaratmayacak şekilde.

### C. ReportTable skeleton
`isLoading` dalında 6-8 adet `<Skeleton />` satırı (zaten `src/components/ui/skeleton.tsx` mevcut) — kullanıcı veri geldiğini hissetsin.

### D. Service worker reload davranışını yumuşat
`public/sw.js` ve `public/service-worker.js` activate handler'ında `client.navigate(...)` kısmını kaldır. Cache silme + `clients.claim()` + `unregister()` yeterli — yeni asset zaten ağdan gelecek. Bu, eski SW'si olan kullanıcılarda gereksiz reload'u yok eder.
(İki dosya da içerik olarak aynı; ikisini de güncelleyeceğim.)

### E. (Opsiyonel ama önerilen) `staleTime` arttırma yerine `placeholderData`
Auth değiştiğinde queryKey değişiyor — React Query yeni anahtarda eski veriyi göstermiyor. `placeholderData: (prev) => prev` ekleyerek auth resolve olurken UI'ın bomboş kalmasını engelle. Sadece feed/entries için.

## Yapmayacaklarım
- DB tarafına ek migration **yok**. Bu loop bir frontend timing meselesi, DB yükü meselesi değil.
- Realtime / cron / RPC değişikliği **yok** (zaten önceki turlarda optimize edildi).
- Tema, içerik, layout değişikliği **yok**.

## Etkilenecek dosyalar
- `src/hooks/useEntries.ts` (auth gating + placeholderData)
- `src/hooks/useNotifications.ts` (auth gating)
- `src/App.tsx` (Suspense fallback)
- `src/components/ReportTable.tsx` (skeleton loading state)
- `public/sw.js`, `public/service-worker.js` (reload davranışını kaldır)

## Beklenen sonuç
Soğuk başlatmada (incognito / hard reload) feed tek RPC çağrısıyla doğru kullanıcı kimliğiyle yüklenir; lazy chunk yüklenirken kullanıcı görsel feedback alır; eski SW'li cihazlarda istenmeyen otomatik reload olmaz.

Onaylarsan implement edebilirim.
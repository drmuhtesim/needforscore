
## Hedef

Mevcut Score platformunu bozmadan, **sadece `phone` kategorisi** için gizlilik odaklı bir katman eklemek:
- Public görünümde tam numara asla render edilmesin → her yerde `0532 *** ** 67` maske.
- Google ve diğer crawler'lar phone entry sayfalarını **indeksleyemesin**.
- DB'deki mevcut `entries.target` (E.164) korunur; yeni alana ihtiyaç yok.

Diğer kategoriler (instagram, tiktok, twitter, score) aynen kalır.

---

## 1. Maskeleme yardımcısı (frontend)

Yeni dosya: `src/lib/phoneMask.ts`

- `maskPhone(e164: string): string` — `libphonenumber-js` ile parse edip ülke koduna göre maskeler.
  - TR örnek: `+905321234567` → `+90 532 *** ** 67`
  - Genel kural: ülke kodu + son 2 hane görünür, ortadaki tüm rakamlar `*`.
  - Parse edilemezse: tüm rakamları gizleyip son 2'yi gösterir.
- `maskPhoneShort(e164)` — kompakt varyant (`*** ** 67`) liste/satır için.

## 2. `src/lib/platforms.ts` — `formatTargetDisplay` / `formatTargetPreview`

`category === "phone"` dallarını `maskPhone(...)` kullanacak şekilde değiştir.  
→ Bu tek değişiklikle EntryCard, EntryRow, EntryDetail, AddEntryDialog önizleme, EntityProfile başlığı, search önerileri, vs. otomatik olarak maskeli gösterime geçer (hepsi bu yardımcıyı çağırıyor).

`buildProfileUrl` içindeki `tel:` linki phone için **kaldırılır** (`return null`) — tıklanıp tam numarayı açmasın.

## 3. EntityProfile & EntryDetail başlıkları

- `EntityProfile.tsx` (`segment="phone"`): sayfanın H1'i ve `<SEO title>` artık masked değeri kullanır. Slug zaten hash bazlı (`tr-xx-67-abcd1234`), URL'de tam numara yok — bu kısım iyi durumda.
- `EntryDetail.tsx`: phone entries için target render eden yerleri masked değere bağla.

## 4. Search davranışı

`src/components/SearchBar.tsx` ve `Index.tsx` arama akışı:
- Kullanıcı tam numarayı yazıp aratınca: input `target_normalized` ile eşleşir → mevcut RPC zaten sonuç döndürür.
- **Yeni kısıtlama:** phone kategorisindeki entry'ler, ana liste sayfasında (`/` veya `?cat=phone`) yalnızca **arama terimi varsa** gösterilsin. Boş aramada phone entries listelenmez → public browsable directory engellenmiş olur.
- `get_entries_feed` RPC'sine müdahale etmek yerine, frontend tarafında `Index.tsx` içinde: `category === "phone" && !searchTerm` → boş state + "Bir telefon numarası arayın" CTA.

## 5. noindex (phone-only)

`src/pages/EntityProfile.tsx` içinde `segment="phone"` ise `<SEO noindex>` true.  
`SEO.tsx` zaten `noindex` propunu destekliyor.

Index sayfasında `?cat=phone` query'si aktifse de `<SEO noindex>` ekle.

## 6. robots.txt

`public/robots.txt` güncelle:
- Tüm `User-agent` bloklarına (Googlebot, Bingbot, AI crawler'lar, default `*`):
  ```
  Disallow: /phone/
  ```
- Sosyal preview crawler'ları (Twitterbot, facebookexternalhit, LinkedInBot) için de aynı disallow eklenir → link önizlemesinde de numara çıkmaz.

## 7. Sitemap

`supabase/functions/sitemap/index.ts` — phone kategorisindeki entry'leri sitemap'e **eklemeyi durdur**. Sadece score/instagram/tiktok/twitter kalsın. (Mevcut kodu okuyup category filter ekleyeceğim.)

## 8. OG prerender / og-image

`supabase/functions/og-prerender/index.ts` ve `og-image/index.ts` phone entry istendiğinde:
- title/description'da tam numarayı maskeli versiyonla değiştir.
- `<meta name="robots" content="noindex,nofollow">` ekle.

## 9. Yardımcı kontroller

- `Header` / search sonuç chip'leri, `UserHoverCard`, `ReportTable` gibi başka tüketicilerde target gösteren yerleri tara — `formatTargetDisplay` kullananlar otomatik düzelir, manuel string birleştirme varsa düzeltilir.
- Form önizlemesi (AddEntryDialog "şu numarayı puanlamak üzeresin: ...") da maskeli versiyon.

## 10. Memory güncellemesi

`mem://index.md` Core'a ek satır:
> Phone kategorisinde public her yerde maskeli gösterim (`maskPhone`). Phone entry sayfaları `noindex`. `/phone/` robots.txt'de disallow. Boş aramada phone listelenmez.

---

## Kapsam dışı (bu iterasyonda yok)

Removal request sistemi, risk score yeniden tasarımı, landing redesign, captcha, KVKK sayfası, multilingual — sen "öncelik: gizlilik & maskeleme & noindex" dedin. Bu maddeleri sonraki turlarda ayrı plan olarak ele alacağım.

## Teknik notlar

- DB migration **yok** — `entries.target` E.164 olarak kalır, sadece RLS halihazırda public okumayı serbest bırakıyor; ama UI hiçbir yerde ham değeri render etmeyecek.
- DB'den ham numarayı çekmek hâlâ teknik olarak mümkün (RLS public select açık). Bunu gerçekten kapatmak istersen ayrı bir plan gerekir: `get_entries_feed`'i sadece `masked_target` döndürecek şekilde değiştirip `entries` tablosunda `SELECT target` iznini revoke etmek. Şu an için kapsam dışı — sen "mevcut veriyi koru" dedin, ama bunu istersen söyle, ikinci iterasyon olarak eklerim.
- Build sonrası şunları doğrulayacağım: EntryCard/EntryDetail/EntityProfile'da phone entry maskeli görünüyor, `/phone/...` sayfası response head'inde `noindex`, `robots.txt` `/phone/`'u disallow ediyor, boş aramada `?cat=phone` listesi boş.

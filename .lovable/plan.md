## Amaç

Twitter/X paylaşımlarında OG kartı tek bir tıklanabilir resimdir; ayrı linkler veremeyiz. Bunun yerine **görsel dilde** iki net "buton/zone" ayırıp kullanıcıya iki tıklanabilir alan varmış hissi vereceğiz: solda **Score amblemi (marka düğmesi)**, sağda **URL düğmesi**. İkisi de gerçek butonlar gibi gölgeli/çerçeveli, hover-iz bırakan kapsüller olarak çizilecek.

Sadece `supabase/functions/og-image/index.ts` dosyasındaki Satori ağacı değişecek; başka kod, RLS, route veya frontend dokunulmayacak.

## Tasarım yönü

Üst şerit (header) iki belirgin "chip/buton" olarak yeniden kurulur:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  ╔═══════════════╗                          ╔════════════════════╗   │
│  ║ ▣  S  Score   ║                          ║ 🔗 needforscore... ║   │
│  ╚═══════════════╝                          ╚════════════════════╝   │
│                                                                      │
│   [ avatar ]    KATEGORİ                                             │
│                 @handle                                              │
│                 12 entry · ortalama 4.2/10                           │
│                                                                      │
│   Her türlü sanal dolandırıcılığa dur de — yorum yap, puanla.        │
└──────────────────────────────────────────────────────────────────────┘
```

İki chip de aynı görsel dilde (yuvarlatılmış köşe, ince accent çerçeve, hafif iç parlaklık, alt-sağ küçük gölge) → kullanıcıya "iki ayrı tıklanabilir hedef" hissi verir, ama tek görsel olduğundan tüm kart yine post linkine gider.

## Detay (teknik)

`buildTree` içindeki header `div`'i şu hale getirilir:

- **Brand chip (sol)**: mevcut `S` kutucuğu + `Score` yazısı, etrafına accent border + `rgba(34,197,94,0.12)` arka plan + `borderRadius: 9999` (pill) + sağ-alt yumuşak gölge taklidi (ikinci bir absolute-ish layer veya `boxShadow`-benzeri ofsetli arka katman; Satori `boxShadow`'u sınırlı, gerekiyorsa overlay div'le simüle).
- **URL chip (sağ)**: mevcut yeşil rozet aynı pill formuna çevrilir, başına küçük bir "link" glifi (Satori `img` veya inline SVG `data:` URI, küçük zincir/ok ikonu, 28×28 px) eklenir; metin `needforscore.com/<seg>/<handle>`. Sayısal handle'lar uzunsa `maxWidth` + `overflow: hidden` + `textOverflow: ellipsis` ile kart dışına taşmayı engelleriz (1200 px sabit, padding 64).
- **Hover izi simülasyonu**: her iki chip'in altına 4-6 px aşağı/sağa kaydırılmış, accent rengin %25 opaklığında ikinci bir aynı şekil yerleştirilir (drop shadow taklidi). Bu, statik PNG'de "kalkık buton" hissi verir.
- **Aralık ve hizalama**: header `justifyContent: "space-between"`, dikey `alignItems: "center"`, padding 64. URL chip için `maxWidth: 720` + iç `overflow: hidden` ki uzun handle'lar logoya çarpmasın.
- Avatar + display + stats bloğu aynen kalır; en alt slogan rengi yumuşatılır (kontrast yine korunur).

Tipografi ve renk paleti değişmez (`BG`, `FG`, `MUTED`, `ACCENT`); semantik tokenlar yok zaten — bu dosya Deno edge function, Tailwind kullanmıyor.

## Doğrulama

1. `og-image` edge function deploy edilir.
2. `?category=twitter&handle=heathleyeth`, `?category=instagram&handle=erkanntaylan`, `?category=score&handle=kijujan`, `?category=phone&handle=tr-xx-12-abcdef12` örnekleri için PNG indirilir, görsel olarak incelenir:
   - İki chip de kart içinde mi, kenara dayanmış mı?
   - URL uzun handle'da taşıyor mu? (ellipsis devrede mi?)
   - Brand chip ile URL chip eş yükseklikte mi?
   - Kontrast OK mi (light avatar üstünde değil, üst şeritte).
3. Twitter Card Validator + Facebook Sharing Debugger ile fresh-scrape yapılması kullanıcıya hatırlatılır.

## Dokunulmayacaklar

- `og-prerender/index.ts`, route'lar, `_redirects`, `index.html`, frontend bileşenler.
- Meta tag içerikleri (title/desc) aynı kalır — yalnızca üretilen PNG değişir.

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import scoreLogo from "@/assets/score-logo.jpeg";

const Privacy = () => {
  const { i18n } = useTranslation();
  const isTR = (i18n.language || "tr").toLowerCase().startsWith("tr");
  const today = new Date().toLocaleDateString(isTR ? "tr-TR" : "en-US");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14 max-w-3xl mx-auto w-full">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" /> {isTR ? "Anasayfa" : "Home"}
          </Link>
          <Link to="/" className="flex items-center gap-2" aria-label="Score">
            <img src={scoreLogo} alt="Score" className="h-7 w-7 rounded-lg" />
            <span className="text-base font-extrabold tracking-tight">Score</span>
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {isTR ? <PrivacyTR today={today} /> : <PrivacyEN today={today} />}
      </main>
    </div>
  );
};

const PrivacyTR = ({ today }: { today: string }) => (
  <article className="space-y-4 text-sm leading-relaxed text-foreground">
    <h1 className="text-2xl font-bold mb-2">Gizlilik Politikası</h1>
    <p className="text-xs text-muted-foreground mb-4">Son güncelleme: {today}</p>

    <h2 className="text-lg font-semibold mt-6">1. Veri Sorumlusu</h2>
    <p>
      needforscore.com alan adı altında işletilen <strong>Score</strong> platformu, 6698
      sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu
      sıfatıyla hareket eder.
    </p>

    <h2 className="text-lg font-semibold mt-6">2. Toplanan Veriler</h2>
    <ul className="list-disc list-inside space-y-1">
      <li><strong>Hesap verileri:</strong> e-posta adresi, kullanıcı adı, şifre özeti.</li>
      <li><strong>Profil verileri:</strong> avatar, şehir, meslek, yaş, biyografi (isteğe bağlı).</li>
      <li><strong>İçerik verileri:</strong> oluşturduğunuz başlık, deneyim, yorum, mesaj ve yüklediğiniz medya.</li>
      <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı bilgisi, oturum çerezleri, yaklaşık konum (ülke).</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">3. Veri İşleme Amaçları</h2>
    <ul className="list-disc list-inside space-y-1">
      <li>Hesabınızı oluşturmak ve kimliğinizi doğrulamak,</li>
      <li>Hizmeti sunmak, geliştirmek ve güvenliğini sağlamak,</li>
      <li>Yasal yükümlülükleri yerine getirmek (5651 sayılı Kanun, KVKK),</li>
      <li>Suistimal, dolandırıcılık ve spam ile mücadele etmek.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">4. Veri Paylaşımı</h2>
    <p>
      Verileriniz pazarlama amacıyla üçüncü kişilere <strong>satılmaz</strong>. Yalnızca
      (i) hizmet sağlayıcılarımız (barındırma, e-posta, analitik) ile sınırlı şekilde,
      (ii) yasal merciler tarafından usulüne uygun talep edildiğinde, (iii) hak ihlali
      iddialarının incelenmesi sırasında paylaşılabilir.
    </p>

    <h2 className="text-lg font-semibold mt-6">5. Saklama Süresi</h2>
    <p>
      Hesap verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silindikten sonra,
      yasal saklama yükümlülükleri (örn. 5651 sayılı Kanun) saklı kalmak üzere, makul süre
      içinde silinir veya anonimleştirilir. Soft-delete edilen içerikler bir süre arşivde
      tutulabilir.
    </p>

    <h2 className="text-lg font-semibold mt-6">6. Çerezler</h2>
    <p>
      Score; oturum yönetimi, dil tercihi ve temel analitik amaçlarla zorunlu çerezler
      kullanır. Tarayıcınızdan çerezleri devre dışı bırakabilirsiniz; ancak bu durumda
      hizmetin bazı bölümleri çalışmayabilir.
    </p>

    <h2 className="text-lg font-semibold mt-6">7. KVKK Kapsamındaki Haklarınız</h2>
    <p>KVKK m.11 uyarınca, veri sorumlusuna başvurarak şu haklarınızı kullanabilirsiniz:</p>
    <ul className="list-disc list-inside space-y-1">
      <li>Verilerinizin işlenip işlenmediğini öğrenme,</li>
      <li>İşlenmiş verileriniz hakkında bilgi talep etme,</li>
      <li>Verilerin düzeltilmesini, silinmesini veya yok edilmesini isteme,</li>
      <li>İşlemeye itiraz etme ve uğradığınız zararın giderilmesini talep etme.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">8. Güvenlik</h2>
    <p>
      Score, verilerinizi korumak için endüstri standardı şifreleme, erişim kontrolü ve
      satır seviyesi güvenlik (RLS) önlemleri uygular. Buna rağmen internet üzerinden
      yapılan hiçbir aktarımın %100 güvenli olduğu garanti edilemez.
    </p>

    <h2 className="text-lg font-semibold mt-6">9. İletişim</h2>
    <p>
      Gizlilik talepleriniz için Score iletişim kanallarından bize ulaşabilirsiniz.
    </p>
  </article>
);

const PrivacyEN = ({ today }: { today: string }) => (
  <article className="space-y-4 text-sm leading-relaxed text-foreground">
    <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
    <p className="text-xs text-muted-foreground mb-4">Last updated: {today}</p>

    <h2 className="text-lg font-semibold mt-6">1. Data Controller</h2>
    <p>
      The <strong>Score</strong> platform, operating under the domain needforscore.com,
      acts as the data controller under applicable data-protection laws, including the
      Turkish Personal Data Protection Law (KVKK) and, where relevant, the GDPR.
    </p>

    <h2 className="text-lg font-semibold mt-6">2. Data We Collect</h2>
    <ul className="list-disc list-inside space-y-1">
      <li><strong>Account data:</strong> email address, username, password hash.</li>
      <li><strong>Profile data:</strong> avatar, city, occupation, age, bio (optional).</li>
      <li><strong>Content data:</strong> entries, experiences, comments, messages and media you upload.</li>
      <li><strong>Technical data:</strong> IP address, browser info, session cookies, approximate location (country).</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">3. Purposes of Processing</h2>
    <ul className="list-disc list-inside space-y-1">
      <li>To create your account and authenticate you,</li>
      <li>To provide, maintain and improve the service and its security,</li>
      <li>To comply with legal obligations,</li>
      <li>To prevent abuse, fraud and spam.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">4. Data Sharing</h2>
    <p>
      We <strong>do not sell</strong> your data to third parties for marketing. Data may
      only be shared (i) with our service providers (hosting, email, analytics) under
      contract, (ii) with competent authorities upon a valid legal request, or (iii) when
      investigating rights-infringement claims.
    </p>

    <h2 className="text-lg font-semibold mt-6">5. Retention</h2>
    <p>
      Account data is retained while your account is active. After deletion it is removed
      or anonymized within a reasonable period, subject to legal retention requirements.
      Soft-deleted content may be archived for a limited time.
    </p>

    <h2 className="text-lg font-semibold mt-6">6. Cookies</h2>
    <p>
      Score uses essential cookies for session management, language preference and basic
      analytics. You can disable cookies in your browser, but parts of the service may
      stop working.
    </p>

    <h2 className="text-lg font-semibold mt-6">7. Your Rights</h2>
    <p>You may exercise the following rights at any time:</p>
    <ul className="list-disc list-inside space-y-1">
      <li>Know whether your data is being processed and request information about it,</li>
      <li>Request rectification, deletion or destruction of your data,</li>
      <li>Object to processing and request compensation for damages caused by unlawful processing.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">8. Security</h2>
    <p>
      Score uses industry-standard encryption, access controls and row-level security
      (RLS) to protect your data. However, no transmission over the internet can be
      guaranteed to be 100% secure.
    </p>

    <h2 className="text-lg font-semibold mt-6">9. Contact</h2>
    <p>
      For privacy requests, please reach us through Score's contact channels.
    </p>
  </article>
);

export default Privacy;

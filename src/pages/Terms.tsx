import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import scoreLogo from "@/assets/score-logo.jpeg";

const Terms = () => {
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
        {isTR ? <TermsTR today={today} /> : <TermsEN today={today} />}
      </main>
    </div>
  );
};

const TermsTR = ({ today }: { today: string }) => (
  <article className="space-y-4 text-sm leading-relaxed text-foreground">
    <h1 className="text-2xl font-bold mb-2">Kullanıcı Sözleşmesi</h1>
    <p className="text-xs text-muted-foreground mb-4">Son güncelleme: {today}</p>

    <h2 className="text-lg font-semibold mt-6">1. Taraflar ve Kabul</h2>
    <p>
      İşbu Kullanıcı Sözleşmesi (“Sözleşme”), needforscore.com alan adı altında yayın yapan
      <strong> Score</strong> platformu (“Score” veya “Platform”) ile platforma kayıt olan ya da
      ziyaret eden gerçek kişi (“Kullanıcı”) arasında akdedilmiştir. Platforma üye olarak,
      hesap oluşturarak veya içerik paylaşarak bu Sözleşme’nin tüm hükümlerini okuduğunuzu,
      anladığınızı ve kabul ettiğinizi beyan edersiniz.
    </p>

    <h2 className="text-lg font-semibold mt-6">2. Hizmetin Tanımı</h2>
    <p>
      Score; kullanıcıların sosyal medya hesapları, telefon numaraları ve diğer Score
      kullanıcıları hakkında deneyim, yorum ve değerlendirme paylaşmasına olanak tanıyan,
      açık kaynak istihbaratı (OSINT) odaklı, kullanıcı tarafından üretilen içeriğe (UGC)
      dayalı bir platformdur. Score; içerik üreticisi değil, yer sağlayıcıdır (5651 sayılı
      Kanun anlamında).
    </p>

    <h2 className="text-lg font-semibold mt-6">3. Hesap Açma ve Güvenlik</h2>
    <ul className="list-disc list-inside space-y-1">
      <li>Hesap açabilmek için 18 yaşını doldurmuş olmanız gerekir.</li>
      <li>Hesabınızın güvenliğinden ve şifrenizden bizzat siz sorumlusunuz.</li>
      <li>Tek bir kişi birden fazla hesap açarak manipülasyon yapamaz.</li>
      <li>Score; şüpheli görülen hesapları doğrulamak veya askıya almak hakkını saklı tutar.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">4. İçerik Sorumluluğu</h2>
    <p>
      Platformda paylaşılan tüm başlık, deneyim, yorum, mesaj, medya ve diğer içerikler
      <strong> tamamen ilgili Kullanıcı’nın sorumluluğundadır</strong>. Score, kullanıcılar
      tarafından üretilen içeriklerin doğruluğunu, güncelliğini veya hukuka uygunluğunu
      garanti etmez ve bu içeriklerden doğan hiçbir doğrudan veya dolaylı zarardan sorumlu
      tutulamaz. Hakaret, iftira, tehdit, kişisel veri ifşası (doxxing), nefret söylemi,
      müstehcen veya çocuk istismarı içeren paylaşımlar, telif ihlali ve sair hukuka aykırı
      içerikler nedeniyle doğacak tüm hukuki ve cezai sorumluluk, içeriği oluşturan
      Kullanıcı’ya aittir.
    </p>

    <h2 className="text-lg font-semibold mt-6">5. Yasaklı Davranışlar</h2>
    <ul className="list-disc list-inside space-y-1">
      <li>Başkasının kimliğine bürünmek veya sahte hesap açmak,</li>
      <li>Spam, bot, otomatik script veya manipülatif puanlama kullanmak,</li>
      <li>Üçüncü kişilerin kişisel verilerini rıza dışı paylaşmak,</li>
      <li>Hakaret, taciz, tehdit, ayrımcılık ve nefret söylemi içeren paylaşımda bulunmak,</li>
      <li>Yasa dışı madde tanıtımı, dolandırıcılık veya yasa dışı hizmet pazarlamak,</li>
      <li>Platformun teknik altyapısına zarar vermek ya da güvenliğini aşmaya çalışmak.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">6. Moderasyon ve Yaptırımlar</h2>
    <p>
      Score yönetimi ve atanmış moderatörler; Sözleşme’ye, topluluk kurallarına veya
      yürürlükteki mevzuata aykırı bulduğu içerikleri önceden bildirim yapmaksızın
      kaldırma, gizleme, hesap askıya alma veya sonlandırma hakkını saklı tutar. Soft-delete
      uygulanan içerikler 5651 sayılı Kanun kapsamında belirli süreyle saklanabilir.
    </p>

    <h2 className="text-lg font-semibold mt-6">7. Hak Talepleri ve İçerik Kaldırma</h2>
    <p>
      Hakkınızda paylaşılan bir içeriğin kişilik haklarınızı, gizliliğinizi veya yasal
      haklarınızı ihlal ettiğini düşünüyorsanız, ayrıntılı belgeleriyle birlikte iletişim
      kanallarımızdan başvurabilirsiniz. Talebiniz makul süre içinde değerlendirilecek; haklı
      bulunması halinde ilgili içerik kaldırılacaktır.
    </p>

    <h2 className="text-lg font-semibold mt-6">8. Fikri Mülkiyet</h2>
    <p>
      Score markası, logosu, arayüzü ve yazılımı Score’a aittir. Kullanıcı tarafından
      yüklenen içeriklerin telif hakkı Kullanıcı’da kalır; ancak Kullanıcı, içeriği
      yüklemekle bu içeriği Platform’da yayınlamak, çoğaltmak ve göstermek için Score’a
      münhasır olmayan, dünya çapında, ücretsiz bir lisans verir.
    </p>

    <h2 className="text-lg font-semibold mt-6">9. Sorumluluğun Sınırlandırılması</h2>
    <p>
      Platform “olduğu gibi” ve “mevcut haliyle” sunulmaktadır. Score; hizmette kesinti,
      veri kaybı, üçüncü kişi içerikleri veya Kullanıcı kaynaklı zararlar nedeniyle hiçbir
      garanti vermez ve bunlardan sorumlu tutulamaz.
    </p>

    <h2 className="text-lg font-semibold mt-6">10. Sözleşme Değişiklikleri</h2>
    <p>
      Score, bu Sözleşme’yi tek taraflı olarak güncelleyebilir. Güncel sürüm bu sayfada
      yayımlandığı andan itibaren yürürlüğe girer. Önemli değişikliklerde Kullanıcılar
      bilgilendirilebilir.
    </p>

    <h2 className="text-lg font-semibold mt-6">11. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
    <p>
      İşbu Sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Sözleşme’den doğacak
      uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.
    </p>
  </article>
);

const TermsEN = ({ today }: { today: string }) => (
  <article className="space-y-4 text-sm leading-relaxed text-foreground">
    <h1 className="text-2xl font-bold mb-2">Terms of Use</h1>
    <p className="text-xs text-muted-foreground mb-4">Last updated: {today}</p>

    <h2 className="text-lg font-semibold mt-6">1. Parties and Acceptance</h2>
    <p>
      These Terms of Use (the “Terms”) form a binding agreement between the
      <strong> Score</strong> platform (“Score”, “we”, “us”), operating under the domain
      needforscore.com, and any natural person who registers for or visits the platform
      (the “User”). By creating an account, signing in, or posting content, you confirm
      that you have read, understood and accepted these Terms in full.
    </p>

    <h2 className="text-lg font-semibold mt-6">2. Description of the Service</h2>
    <p>
      Score is an OSINT-oriented, user-generated-content platform that lets users share
      experiences, comments and ratings about social-media accounts, phone numbers and
      other Score users. Score acts as a hosting/intermediary service provider, not as the
      author of user-submitted content.
    </p>

    <h2 className="text-lg font-semibold mt-6">3. Accounts and Security</h2>
    <ul className="list-disc list-inside space-y-1">
      <li>You must be at least 18 years old to create an account.</li>
      <li>You are solely responsible for the security of your account and password.</li>
      <li>Operating multiple accounts to manipulate ratings is prohibited.</li>
      <li>Score may verify, suspend or terminate suspicious accounts.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">4. Content Responsibility</h2>
    <p>
      All entries, experiences, comments, messages, media and other content posted on the
      platform are <strong>the sole responsibility of the User who submitted them</strong>.
      Score does not guarantee the accuracy, currency or lawfulness of user-generated
      content and is not liable for any direct or indirect damages arising from such
      content. Defamation, threats, doxxing, hate speech, obscene or child-exploitation
      material, copyright infringement and any other unlawful content remain the
      exclusive legal and criminal responsibility of the posting User.
    </p>

    <h2 className="text-lg font-semibold mt-6">5. Prohibited Conduct</h2>
    <ul className="list-disc list-inside space-y-1">
      <li>Impersonating another person or operating fake accounts;</li>
      <li>Using spam, bots, automated scripts or manipulative voting;</li>
      <li>Sharing third parties' personal data without their consent;</li>
      <li>Harassment, threats, discrimination or hate speech;</li>
      <li>Promoting illegal substances, fraud or unlawful services;</li>
      <li>Attempting to compromise the platform's security or infrastructure.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">6. Moderation and Enforcement</h2>
    <p>
      Score administrators and appointed moderators may remove, hide, suspend or terminate
      any content or account that violates these Terms, the community guidelines or
      applicable law, without prior notice. Soft-deleted content may be retained for a
      limited period for legal-compliance purposes.
    </p>

    <h2 className="text-lg font-semibold mt-6">7. Takedown Requests</h2>
    <p>
      If you believe that content posted about you violates your personality rights,
      privacy or other legal rights, you may submit a documented request through our
      contact channels. Valid requests will be reviewed within a reasonable period and the
      relevant content will be removed where justified.
    </p>

    <h2 className="text-lg font-semibold mt-6">8. Intellectual Property</h2>
    <p>
      The Score brand, logo, interface and software are owned by Score. Users retain
      copyright in the content they upload but, by uploading, grant Score a non-exclusive,
      worldwide, royalty-free license to host, reproduce and display that content on the
      platform.
    </p>

    <h2 className="text-lg font-semibold mt-6">9. Limitation of Liability</h2>
    <p>
      The platform is provided “as is” and “as available”. Score makes no warranties and
      shall not be liable for service interruptions, data loss, third-party content or any
      damages caused by users.
    </p>

    <h2 className="text-lg font-semibold mt-6">10. Changes to the Terms</h2>
    <p>
      Score may update these Terms unilaterally. The updated version takes effect upon
      publication on this page. Material changes may be communicated to Users.
    </p>

    <h2 className="text-lg font-semibold mt-6">11. Governing Law and Jurisdiction</h2>
    <p>
      These Terms are governed by the laws of the Republic of Türkiye. The Istanbul
      (Çağlayan) Courts and Execution Offices shall have exclusive jurisdiction over any
      dispute arising out of or in connection with these Terms.
    </p>
  </article>
);

export default Terms;

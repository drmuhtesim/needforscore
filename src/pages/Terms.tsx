import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import scoreLogo from "@/assets/score-logo.jpeg";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14 max-w-3xl mx-auto w-full">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" /> Anasayfa
          </Link>
          <Link to="/" className="flex items-center gap-2" aria-label="Score">
            <img src={scoreLogo} alt="Score" className="h-7 w-7 rounded-lg" />
            <span className="text-base font-extrabold tracking-tight">Score</span>
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 prose prose-invert prose-sm">
        <h1 className="text-2xl font-bold mb-4">Kullanıcı Sözleşmesi</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
        </p>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold mt-6">1. Taraflar ve Kabul</h2>
          <p>
            needforscore.com (“Score” veya “Platform”) üzerinden hesap oluşturarak, bu
            sözleşmenin tüm maddelerini okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan
            edersiniz.
          </p>

          <h2 className="text-lg font-semibold mt-6">2. İçerik Sorumluluğu</h2>
          <p>
            Score, kullanıcılar tarafından oluşturulan başlık, deneyim, yorum, mesaj ve diğer
            tüm içeriklerden <strong>doğrudan sorumlu değildir</strong>. Yayımladığınız her
            içeriğin doğruluğu, hukuka uygunluğu ve üçüncü kişilerin haklarını ihlal etmemesi
            tamamen sizin sorumluluğunuzdadır. Hakaret, iftira, tehdit, kişisel veri ifşası
            (doxxing), nefret söylemi, müstehcen içerik, telif ihlali veya yasa dışı sayılan
            herhangi bir paylaşım, yasal sonuçlarıyla birlikte içeriği oluşturan kullanıcıya
            aittir.
          </p>

          <h2 className="text-lg font-semibold mt-6">3. Yasaklı Davranışlar</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Başkasının kimliğine bürünmek veya sahte hesap açmak</li>
            <li>Spam, otomatik script veya manipülatif puanlama</li>
            <li>Kişisel verileri rıza dışı paylaşmak</li>
            <li>Hakaret, taciz, tehdit ve nefret söylemi</li>
            <li>Yasa dışı içerik, yasaklı madde tanıtımı veya dolandırıcılık</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">4. Moderasyon Hakkı</h2>
          <p>
            Score yönetimi, sözleşmeye veya yürürlükteki mevzuata aykırı bulduğu içerikleri
            önceden bildirimde bulunmaksızın kaldırma, hesabı askıya alma veya sonlandırma
            hakkını saklı tutar.
          </p>

          <h2 className="text-lg font-semibold mt-6">5. Hak Talepleri</h2>
          <p>
            Sizinle ilgili paylaşılan bir içeriğin haklarınızı ihlal ettiğini düşünüyorsanız
            iletişim kanallarımızdan başvurabilirsiniz. Talebiniz incelenecek ve gerekli
            görülürse içerik kaldırılacaktır.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Sorumluluğun Sınırlandırılması</h2>
          <p>
            Score, kullanıcı kaynaklı içeriklerden doğan doğrudan veya dolaylı zararlardan
            sorumlu tutulamaz. Platform “olduğu gibi” sunulmaktadır.
          </p>

          <h2 className="text-lg font-semibold mt-6">7. Değişiklikler</h2>
          <p>
            Score, bu sözleşmeyi gerektiğinde güncelleyebilir. Güncel sözleşme, bu sayfada
            yayımlandığı andan itibaren geçerlidir.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Terms;

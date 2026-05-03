import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import scoreLogo from "@/assets/score-logo.jpeg";

const Privacy = () => {
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

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Gizlilik Politikası</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
        </p>
        <section className="space-y-4 text-sm leading-relaxed">
          <p>
            Score, hesap açan kullanıcılarından yalnızca platformun çalışması için gerekli olan
            verileri (e-posta, kullanıcı adı, profil bilgileri, oluşturduğunuz içerikler) toplar.
          </p>
          <p>
            Verileriniz üçüncü kişilerle satılmak amacıyla paylaşılmaz; yalnızca yasal merciler
            tarafından usulüne uygun talep edilmesi halinde paylaşılabilir.
          </p>
          <p>
            Hesabınızı silmek veya verilerinizin işlenmesine ilişkin haklarınızı kullanmak için
            iletişim kanallarımızdan başvurabilirsiniz.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Privacy;

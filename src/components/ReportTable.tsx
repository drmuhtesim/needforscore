import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion, Clock, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import type { CategoryType } from "./CategorySidebar";

export interface Report {
  id: string;
  target: string;
  category: CategoryType;
  status: "safe" | "danger" | "suspicious";
  reportCount: number;
  positiveCount: number;
  negativeCount: number;
  lastReport: string;
  description: string;
}

const mockReports: Report[] = [
  { id: "1", target: "@sahtemagaza_tr", category: "instagram", status: "danger", reportCount: 142, positiveCount: 3, negativeCount: 139, lastReport: "2 saat önce", description: "Sahte ürün satışı, ödeme aldıktan sonra engelliyor" },
  { id: "2", target: "@guvenilir_satis", category: "instagram", status: "safe", reportCount: 89, positiveCount: 85, negativeCount: 4, lastReport: "5 saat önce", description: "Güvenilir satıcı, hızlı kargo ve iyi iletişim" },
  { id: "3", target: "05XX 123 45 67", category: "phone", status: "danger", reportCount: 234, positiveCount: 0, negativeCount: 234, lastReport: "30 dk önce", description: "Banka dolandırıcılığı, kendini müşteri temsilcisi olarak tanıtıyor" },
  { id: "4", target: "@tiktoker_shop", category: "tiktok", status: "suspicious", reportCount: 45, positiveCount: 18, negativeCount: 27, lastReport: "1 gün önce", description: "Bazı ürünlerde sorun yaşandı, karışık yorumlar" },
  { id: "5", target: "info@kampanya-ozel.com", category: "email", status: "danger", reportCount: 567, positiveCount: 2, negativeCount: 565, lastReport: "15 dk önce", description: "Phishing e-postası, sahte kampanya linki gönderiyor" },
  { id: "6", target: "@xtrader_signals", category: "twitter", status: "suspicious", reportCount: 78, positiveCount: 22, negativeCount: 56, lastReport: "3 saat önce", description: "Şüpheli yatırım sinyalleri, bazı kullanıcılar zarara uğradı" },
  { id: "7", target: "www.ucuz-elektronik.xyz", category: "website", status: "danger", reportCount: 312, positiveCount: 5, negativeCount: 307, lastReport: "1 saat önce", description: "Sahte e-ticaret sitesi, ödeme alıyor ama ürün göndermiyor" },
  { id: "8", target: "@modatrend2024", category: "instagram", status: "safe", reportCount: 156, positiveCount: 148, negativeCount: 8, lastReport: "12 saat önce", description: "Güvenilir moda mağazası, orijinal ürünler" },
  { id: "9", target: "05XX 987 65 43", category: "phone", status: "suspicious", reportCount: 23, positiveCount: 9, negativeCount: 14, lastReport: "6 saat önce", description: "Emlak dolandırıcılığı şüphesi, sahte ilan numarası" },
  { id: "10", target: "@crypto_kazanc_tr", category: "tiktok", status: "danger", reportCount: 198, positiveCount: 7, negativeCount: 191, lastReport: "45 dk önce", description: "Sahte kripto yatırım vaatleri, para çekme işlemi yapılamıyor" },
];

const statusConfig = {
  safe: { icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10", label: "Güvenli" },
  danger: { icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10", label: "Tehlikeli" },
  suspicious: { icon: ShieldQuestion, color: "text-suspicious", bg: "bg-suspicious/10", label: "Şüpheli" },
};

interface ReportTableProps {
  category: CategoryType;
  searchQuery: string;
}

const ReportTable = ({ category, searchQuery }: ReportTableProps) => {
  const filtered = mockReports.filter((r) => {
    const matchCategory = category === "all" || r.category === category;
    const matchSearch = !searchQuery || r.target.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getScoreBar = (positive: number, negative: number) => {
    const total = positive + negative;
    if (total === 0) return 0;
    return (negative / total) * 100;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-semibold">Hedef</th>
            <th className="text-left py-3 px-4 font-semibold">Durum</th>
            <th className="text-center py-3 px-4 font-semibold">Raporlar</th>
            <th className="text-center py-3 px-4 font-semibold hidden md:table-cell">
              <ThumbsUp className="h-3.5 w-3.5 inline mr-1" />/<ThumbsDown className="h-3.5 w-3.5 inline ml-1" />
            </th>
            <th className="text-left py-3 px-4 font-semibold hidden lg:table-cell">Risk</th>
            <th className="text-right py-3 px-4 font-semibold hidden sm:table-cell">
              <Clock className="h-3.5 w-3.5 inline" />
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((report, i) => {
            const status = statusConfig[report.status];
            const StatusIcon = status.icon;
            const riskPercent = getScoreBar(report.positiveCount, report.negativeCount);

            return (
              <tr
                key={report.id}
                className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-5">#{i + 1}</span>
                    <div>
                      <p className="font-mono text-sm text-foreground">{report.target}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{report.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm font-mono">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    {report.reportCount.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="flex items-center justify-center gap-2 text-xs font-mono">
                    <span className="text-safe">{report.positiveCount}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-danger">{report.negativeCount}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${riskPercent}%`,
                        background: riskPercent > 70 ? "hsl(0 72% 55%)" : riskPercent > 40 ? "hsl(38 92% 50%)" : "hsl(145 80% 42%)",
                      }}
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-right hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">{report.lastReport}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Sonuç bulunamadı</p>
        </div>
      )}
    </div>
  );
};

export default ReportTable;

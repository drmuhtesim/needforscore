import { ShieldCheck, AlertTriangle, Eye, TrendingUp } from "lucide-react";

const stats = [
  { label: "Toplam Entry", value: "2,847", icon: Eye, color: "text-primary" },
  { label: "Deneyim sayısı", value: "1,203", icon: AlertTriangle, color: "text-danger" },
  { label: "Güvenli deneyim", value: "892", icon: ShieldCheck, color: "text-safe" },
  { label: "Bugün Eklenen", value: "+47", icon: TrendingUp, color: "text-suspicious" },
];

const StatsBar = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <Icon className={`h-5 w-5 ${stat.color} flex-shrink-0`} />
            <div>
              <p className="text-lg font-bold font-mono">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsBar;

import { formatCurrency } from "@/lib/utils";

interface StatsBarProps {
  totalRevenue: number;
  totalProposals: number;
  awaitingAction: number;
  winRate: number;
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  gradient: string;
  textColor: string;
}

function StatCard({ label, value, sub, gradient, textColor }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-6 ${gradient} relative overflow-hidden border border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_60%)] mix-blend-overlay" />
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
      <div className="relative z-10">
        <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ${textColor} opacity-90`}>
          {label}
        </p>
        <p className={`text-4xl font-extrabold tracking-tight ${textColor} leading-none mb-1 drop-shadow-sm`}>{value}</p>
        <p className={`text-[13px] ${textColor} opacity-70 mt-2 font-medium`}>{sub}</p>
      </div>
    </div>
  );
}

export function StatsBar({ totalRevenue, totalProposals, awaitingAction, winRate }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Revenue"
        value={formatCurrency(totalRevenue)}
        sub="from paid proposals"
        gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        textColor="text-white"
      />
      <StatCard
        label="All Proposals"
        value={String(totalProposals)}
        sub={totalProposals === 1 ? "proposal created" : "proposals created"}
        gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
        textColor="text-white"
      />
      <StatCard
        label="Awaiting Action"
        value={String(awaitingAction)}
        sub="sent, viewed, or signed"
        gradient="bg-gradient-to-br from-amber-400 to-orange-500"
        textColor="text-white"
      />
      <StatCard
        label="Win Rate"
        value={totalProposals === 0 ? "—" : `${winRate}%`}
        sub="paid vs sent"
        gradient="bg-gradient-to-br from-slate-700 to-slate-900"
        textColor="text-white"
      />
    </div>
  );
}

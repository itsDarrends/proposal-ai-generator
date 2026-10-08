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
    <div className={`rounded-lg p-6 ${gradient} relative overflow-hidden border border-white/10 transition-colors`}>
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
        gradient="bg-indigo-700"
        textColor="text-white"
      />
      <StatCard
        label="All Proposals"
        value={String(totalProposals)}
        sub={totalProposals === 1 ? "proposal created" : "proposals created"}
        gradient="bg-slate-700"
        textColor="text-white"
      />
      <StatCard
        label="Awaiting Action"
        value={String(awaitingAction)}
        sub="sent, viewed, or signed"
        gradient="bg-violet-600"
        textColor="text-white"
      />
      <StatCard
        label="Win Rate"
        value={totalProposals === 0 ? "—" : `${winRate}%`}
        sub="paid vs sent"
        gradient="bg-purple-700"
        textColor="text-white"
      />
    </div>
  );
}

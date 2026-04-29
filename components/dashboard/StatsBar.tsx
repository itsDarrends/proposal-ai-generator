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
    <div className={`rounded-2xl p-6 ${gradient} relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${textColor} opacity-80`}>
        {label}
      </p>
      <p className={`text-3xl font-bold ${textColor} leading-none mb-1`}>{value}</p>
      <p className={`text-xs ${textColor} opacity-60 mt-2`}>{sub}</p>
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

import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({ label, value, sub, icon, gradient }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-6 ${gradient} relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white opacity-80 mb-3">{label}</p>
          <p className="text-3xl font-bold text-white leading-none mb-1">{value}</p>
          <p className="text-xs text-white opacity-60 mt-2">{sub}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createServiceClient();

  const [
    { count: totalUsers },
    { count: totalProposals },
    { data: paidProposals },
    { data: recentProposals },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("proposals").select("*", { count: "exact", head: true }),
    supabase.from("proposals").select("amount").eq("status", "paid"),
    supabase.from("proposals")
      .select("id, title, client_name, amount, status, created_at, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalRevenue = (paidProposals ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = paidProposals?.length ?? 0;
  const winRate = (totalProposals ?? 0) > 0 ? Math.round((paidCount / (totalProposals ?? 1)) * 100) : 0;

  const STATUS_COLOR: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-100 text-blue-700",
    viewed: "bg-amber-100 text-amber-700",
    signed: "bg-violet-100 text-violet-700",
    paid: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time stats across all accounts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Users"
          value={String(totalUsers ?? 0)}
          sub="registered accounts"
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          icon={<Users className="w-5 h-5 text-white" />}
        />
        <StatCard
          label="Total Proposals"
          value={String(totalProposals ?? 0)}
          sub="across all users"
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          icon={<FileText className="w-5 h-5 text-white" />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub={`${paidCount} paid proposals`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon={<DollarSign className="w-5 h-5 text-white" />}
        />
        <StatCard
          label="Platform Win Rate"
          value={totalProposals === 0 ? "—" : `${winRate}%`}
          sub="paid vs total"
          gradient="bg-gradient-to-br from-slate-700 to-slate-900"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Recent Proposals
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proposal</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Creator</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recentProposals ?? []).map((p: any) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900 truncate max-w-[200px]">{p.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{p.client_name}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {p.profiles?.email?.split("@")[0] ?? "—"}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, ExternalLink } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-amber-100 text-amber-700",
  signed: "bg-violet-100 text-violet-700",
  paid: "bg-emerald-100 text-emerald-700",
};

export default async function AdminProposalsPage() {
  const supabase = await createServiceClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, title, client_name, client_email, amount, status, created_at, paid_at, profiles(email)")
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Proposals</h1>
        <p className="text-sm text-slate-500 mt-1">{proposals?.length ?? 0} proposals across all users</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {!proposals?.length ? (
          <div className="text-center py-24">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No proposals yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proposal</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Creator</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900 truncate max-w-[180px]">{p.title}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {p.profiles?.email?.split("@")[0] ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{p.client_name}</p>
                    <p className="text-slate-400 text-xs">{p.client_email}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`${appUrl}/proposal/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

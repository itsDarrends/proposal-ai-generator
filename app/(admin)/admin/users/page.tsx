"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { UserX, UserCheck, Trash2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
  proposal_count: number;
  revenue: number;
  banned: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(userId: string, action: "disable" | "enable" | "delete") {
    if (action === "delete" && !confirm("Permanently delete this account and all their proposals?")) return;
    setActionId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      toast.success(action === "delete" ? "Account deleted" : action === "disable" ? "Account disabled" : "Account enabled");
      await load();
    } else {
      toast.error("Action failed");
    }
    setActionId(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
        <p className="text-sm text-slate-500 mt-1">{users.length} registered accounts</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-24">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No users yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proposals</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const username = u.email.split("@")[0];
                const initials = username.slice(0, 2).toUpperCase();
                const isAdmin = u.role === "admin";
                const busy = actionId === u.id;
                return (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isAdmin ? "bg-gradient-to-br from-rose-500 to-pink-600" : "bg-gradient-to-br from-indigo-500 to-violet-600"}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{username}</p>
                          <p className="text-slate-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isAdmin ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                        {isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 tabular-nums">{u.proposal_count}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 tabular-nums">{formatCurrency(u.revenue)}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.banned ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {u.banned ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {isAdmin ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {u.banned ? (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleAction(u.id, "enable")} disabled={busy}>
                              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleAction(u.id, "disable")} disabled={busy}>
                              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleAction(u.id, "delete")} disabled={busy}>
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

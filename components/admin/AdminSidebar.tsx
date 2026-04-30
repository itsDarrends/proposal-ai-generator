import Link from "next/link";
import { LayoutDashboard, Users, FileText, Shield, ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

interface AdminSidebarProps {
  userEmail: string;
}

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/proposals", icon: FileText, label: "All Proposals" },
];

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const username = userEmail.split("@")[0];
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-slate-950 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Admin Panel</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">ProposalAI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Management
        </p>
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors group"
          >
            <Icon className="w-4 h-4 shrink-0 group-hover:text-rose-400 transition-colors" />
            {label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-white hover:bg-slate-800 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{username}</p>
            <p className="text-[10px] text-rose-400 font-medium">Super Admin</p>
          </div>
          <SignOutButton iconOnly />
        </div>
      </div>
    </aside>
  );
}

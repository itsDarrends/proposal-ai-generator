import Link from "next/link";
import { LayoutDashboard, Sparkles, FileText, Shield } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

interface SidebarProps {
  userEmail: string;
  isAdmin?: boolean;
}

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/proposals/new", icon: Sparkles, label: "New Proposal" },
];

export function Sidebar({ userEmail, isAdmin }: SidebarProps) {
  const username = userEmail.split("@")[0];
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-slate-950 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">ProposalAI</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">Proposal Generator</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Workspace
        </p>
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors group"
          >
            <Icon className="w-4 h-4 shrink-0 group-hover:text-indigo-400 transition-colors" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-2">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Administration
            </p>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors group"
            >
              <Shield className="w-4 h-4 shrink-0 group-hover:text-rose-400 transition-colors" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{username}</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          </div>
          <SignOutButton iconOnly />
        </div>
      </div>
    </aside>
  );
}

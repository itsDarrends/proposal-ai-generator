import Link from "next/link";
import { LayoutDashboard, FilePlus, FileText, Shield, Settings } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

interface SidebarProps {
  userEmail: string;
  isAdmin?: boolean;
}

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/proposals/new", icon: FilePlus, label: "New Proposal" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ userEmail, isAdmin }: SidebarProps) {
  const username = userEmail.split("@")[0];
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-none">ProposalAI</p>
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors group"
          >
            <Icon className="w-4 h-4 shrink-0 group-hover:text-indigo-700 transition-colors" />
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors group"
            >
              <Shield className="w-4 h-4 shrink-0 group-hover:text-rose-700 transition-colors" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">{username}</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          </div>
          <SignOutButton iconOnly />
        </div>
      </div>
    </aside>
  );
}

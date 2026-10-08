import { redirect } from "next/navigation";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const service = await createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar userEmail={user.email ?? ""} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto relative">
        {/* Ambient background glows */}
        <div className="pointer-events-none fixed top-0 left-64 right-0 bottom-0 overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-violet-500/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Branding & Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Customize how your proposals look to clients. Your logo and brand color appear on every proposal you send.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Building2 } from "lucide-react";

interface Settings {
  company_name: string;
  company_logo_url: string;
  brand_color: string;
}

const DEFAULT_COLOR = "#4f46e5";

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Settings>({
    company_name: "",
    company_logo_url: "",
    brand_color: DEFAULT_COLOR,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        setForm({
          company_name: d.company_name ?? "",
          company_logo_url: d.company_logo_url ?? "",
          brand_color: d.brand_color ?? DEFAULT_COLOR,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function update(key: keyof Settings, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name || null,
          company_logo_url: form.company_logo_url || null,
          brand_color: form.brand_color || DEFAULT_COLOR,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading settings…</span>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Company name */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Company Name
        </label>
        <p className="text-xs text-slate-400 mb-3">Appears in the header of every proposal you send.</p>
        <input
          type="text"
          value={form.company_name}
          onChange={e => update("company_name", e.target.value)}
          placeholder="Acme Design Co."
          maxLength={120}
          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Logo URL */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Company Logo URL
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Direct URL to your logo image (PNG, SVG, or WebP recommended). Upload to Imgur, Cloudinary, or any CDN.
        </p>
        <input
          type="url"
          value={form.company_logo_url}
          onChange={e => update("company_logo_url", e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {form.company_logo_url && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.company_logo_url}
              alt="Logo preview"
              className="h-10 w-auto object-contain max-w-[200px]"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-xs text-slate-400">Preview</span>
          </div>
        )}
      </div>

      {/* Brand color */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Brand Color
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Used for the proposal header accent, investment section, and section dividers.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.brand_color}
            onChange={e => update("brand_color", e.target.value)}
            className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={form.brand_color}
            onChange={e => {
              if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) update("brand_color", e.target.value);
            }}
            maxLength={7}
            className="w-28 h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <div
            className="h-10 flex-1 rounded-lg border border-slate-100"
            style={{ backgroundColor: form.brand_color }}
          />
        </div>

        {/* Color presets */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#0f172a"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => update("brand_color", c)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: form.brand_color === c ? "#1e293b" : "transparent" }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Preview banner */}
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `3px solid ${form.brand_color}` }}>
          {form.company_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.company_logo_url} alt="" className="h-8 w-auto object-contain max-w-[120px]"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${form.brand_color}20` }}>
              <Building2 className="w-4 h-4" style={{ color: form.brand_color }} />
            </div>
          )}
          {form.company_name && <span className="font-semibold text-slate-800 text-sm">{form.company_name}</span>}
          <span className="text-xs ml-auto" style={{ color: form.brand_color }}>Business Proposal</span>
        </div>
        <div className="px-6 py-3 bg-slate-50">
          <p className="text-xs text-slate-400">Proposal header preview</p>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <Button type="submit" disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

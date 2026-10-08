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
      <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-sm">Loading settings…</span>
      </div>
    );
  }

  const inputCls = "w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all";

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Company name */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 transition-transform duration-300 hover:-translate-y-0.5 shadow-lg">
        <label className="block text-sm font-semibold text-slate-200 mb-1.5">
          Company Name
        </label>
        <p className="text-xs text-slate-500 mb-4">Appears in the header of every proposal you send.</p>
        <input
          type="text"
          value={form.company_name}
          onChange={e => update("company_name", e.target.value)}
          placeholder="Acme Design Co."
          maxLength={120}
          className={inputCls}
        />
      </div>

      {/* Logo URL */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 transition-transform duration-300 hover:-translate-y-0.5 shadow-lg">
        <label className="block text-sm font-semibold text-slate-200 mb-1.5">
          Company Logo URL
        </label>
        <p className="text-xs text-slate-500 mb-4">
          Direct URL to your logo image (PNG, SVG, or WebP recommended).
        </p>
        <input
          type="url"
          value={form.company_logo_url}
          onChange={e => update("company_logo_url", e.target.value)}
          placeholder="https://example.com/logo.png"
          className={inputCls}
        />
        {form.company_logo_url && (
          <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.company_logo_url}
              alt="Logo preview"
              className="h-10 w-auto object-contain max-w-[200px]"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-xs text-slate-500">Preview</span>
          </div>
        )}
      </div>

      {/* Brand color */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 transition-transform duration-300 hover:-translate-y-0.5 shadow-lg">
        <label className="block text-sm font-semibold text-slate-200 mb-1.5">
          Brand Color
        </label>
        <p className="text-xs text-slate-500 mb-4">
          Used for the proposal header accent, investment section, and section dividers.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.brand_color}
            onChange={e => update("brand_color", e.target.value)}
            className="w-12 h-11 rounded-xl border border-white/10 cursor-pointer p-0.5 bg-transparent"
          />
          <input
            type="text"
            value={form.brand_color}
            onChange={e => {
              if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) update("brand_color", e.target.value);
            }}
            maxLength={7}
            className="w-28 h-11 px-3 rounded-xl border border-white/10 bg-white/5 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div
            className="h-11 flex-1 rounded-xl border border-white/10"
            style={{ backgroundColor: form.brand_color }}
          />
        </div>

        {/* Color presets */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#0f172a"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => update("brand_color", c)}
              className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
              style={{ backgroundColor: c, borderColor: form.brand_color === c ? "white" : "transparent" }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Preview banner */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50">
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `2px solid ${form.brand_color}` }}>
          {form.company_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.company_logo_url} alt="" className="h-8 w-auto object-contain max-w-[120px]"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${form.brand_color}30` }}>
              <Building2 className="w-4 h-4" style={{ color: form.brand_color }} />
            </div>
          )}
          {form.company_name && <span className="font-semibold text-white text-sm">{form.company_name}</span>}
          <span className="text-xs ml-auto font-medium" style={{ color: form.brand_color }}>Business Proposal</span>
        </div>
        <div className="px-6 py-3 bg-black/20">
          <p className="text-xs text-slate-500">Proposal header preview</p>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <Button type="submit" disabled={saving} className="gap-2 h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold border border-indigo-400/20 shadow-[0_0_20px_-5px_rgb(79,70,229,0.5)] transition-all hover:-translate-y-0.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

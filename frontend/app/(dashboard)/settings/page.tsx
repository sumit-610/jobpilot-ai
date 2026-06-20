"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Settings, CheckCircle } from "lucide-react";
import { usersApi } from "@/lib/api";

type Form = {
  role: string; job_type: string; work_mode: string;
  location: string; salary_min: string;
  keywords: string; avoid_companies: string; min_score: string;
};

const defaultForm: Form = {
  role: "", job_type: "full-time", work_mode: "remote",
  location: "India", salary_min: "", keywords: "",
  avoid_companies: "", min_score: "60",
};

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#F0F0F5] text-sm font-medium mb-1">{label}</label>
      {hint && <p className="text-[#55556A] text-xs mb-2">{hint}</p>}
      {children}
    </div>
  );
}

const input = "w-full bg-[#1A1A24] border border-[#2A2A38] rounded-lg px-3.5 py-2.5 text-[#F0F0F5] text-sm placeholder-[#55556A] focus:outline-none focus:border-orange-500/60 focus:bg-[#1E1E2E] transition-colors";

export default function SettingsPage() {
  const [form, setForm] = useState<Form>(defaultForm);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPreferences();
    }, 2000);
  
    return () => clearTimeout(timer);
  }, []);

  async function loadPreferences() {
    try {
      const res = await usersApi.getMe();
  
      if (res.data?.preferences) {
        setForm({
          ...defaultForm,
          ...res.data.preferences,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  function set(k: keyof Form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setSaved(false);
    };
  }

  async function save() {
    setSaving(true);
    try {
      await usersApi.updatePreferences(form);
      setSaved(true);
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 text-[#55556A] text-xs font-medium uppercase tracking-wider mb-2">
        <Settings size={12} /> Settings
      </div>
      <h1 className="text-2xl font-bold text-[#F0F0F5] tracking-tight mb-1">Preferences</h1>
      <p className="text-[#8B8BA8] text-sm mb-8">
        Tell your agent exactly what to look for — every preference sharpens your daily digest.
      </p>

      {/* Section: Role */}
      <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-6 mb-4 space-y-5">
        <p className="text-[#F0F0F5] text-xs font-semibold uppercase tracking-wider text-[#55556A]">
          Target role
        </p>
        <Field label="Job title" hint="What role are you targeting?">
          <input
            className={input} value={form.role}
            placeholder="e.g. Software Engineer, Product Manager"
            onChange={set("role")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Job type">
            <select className={input} value={form.job_type} onChange={set("job_type")}>
              <option value="full-time">Full-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
            </select>
          </Field>
          <Field label="Work mode">
            <select className={input} value={form.work_mode} onChange={set("work_mode")}>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
              <option value="any">Any</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Section: Location + Salary */}
      <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-6 mb-4 space-y-5">
        <p className="text-[#55556A] text-xs font-semibold uppercase tracking-wider">
          Location & compensation
        </p>
        <Field label="Preferred location">
          <input
            className={input} value={form.location}
            placeholder="e.g. India, Bangalore, Remote"
            onChange={set("location")}
          />
        </Field>
        <Field label="Minimum salary (₹/year)" hint="Leave blank to see all salary ranges">
          <input
            className={input} type="number" value={form.salary_min}
            placeholder="e.g. 1200000"
            onChange={set("salary_min")}
          />
        </Field>
      </div>

      {/* Section: Keywords */}
      <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-6 mb-4 space-y-5">
        <p className="text-[#55556A] text-xs font-semibold uppercase tracking-wider">
          Targeting
        </p>
        <Field label="Keywords to prioritise" hint="Comma-separated — jobs containing these rank higher">
          <input
            className={input} value={form.keywords}
            placeholder="e.g. React, FastAPI, machine learning, fintech"
            onChange={set("keywords")}
          />
        </Field>
        <Field label="Companies to avoid" hint="Comma-separated — these are filtered out entirely">
          <input
            className={input} value={form.avoid_companies}
            placeholder="e.g. Infosys, Wipro"
            onChange={set("avoid_companies")}
          />
        </Field>
        <Field
          label={`Minimum match score: ${form.min_score}%`}
          hint="Jobs below this score won't appear in your digest"
        >
          <div className="flex items-center gap-4">
            <input
              type="range" min={0} max={90} step={5}
              value={form.min_score} onChange={set("min_score")}
              className="flex-1 accent-orange-500 h-1.5"
            />
            <span className="text-orange-400 text-sm font-bold tabular-nums w-10 text-right">
              {form.min_score}%
            </span>
          </div>
        </Field>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-400 text-sm fade-up">
            <CheckCircle size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

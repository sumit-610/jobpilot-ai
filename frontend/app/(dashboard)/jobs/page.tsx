"use client";

import { useState } from "react";
import { Zap, SlidersHorizontal, Target } from "lucide-react";
import JobCard, { Job } from "@/components/jobs/job-card";
import { SkeletonCard, EmptyState } from "@/components/ui";
import { jobsApi } from "@/lib/api";

type Filter = { platform: string; work_mode: string; min_score: number };

export default function JobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<"idle" | "done" | "error">("idle");
  const [filter, setFilter]   = useState<Filter>({ platform: "all", work_mode: "all", min_score: 0 });
  const [showFilter, setShowFilter] = useState(false);

  async function generate() {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await jobsApi.getJobs();
      const data = res.data;
      setJobs(data);
      setStatus("done");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  const visible = jobs.filter((j) =>
    (filter.platform === "all" || j.platform === filter.platform) &&
    (filter.work_mode === "all" || j.work_mode === filter.work_mode) &&
    j.match_score >= filter.min_score
  );

  const platforms = ["all", ...Array.from(new Set(jobs.map((j) => j.platform)))];

  return (
    <div className="p-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[#55556A] text-xs font-medium uppercase tracking-wider mb-2">
            <Target size={12} /> Jobs Feed
          </div>
          <h1 className="text-2xl font-bold text-[#F0F0F5] tracking-tight">Today's digest</h1>
          <p className="text-[#8B8BA8] text-sm mt-1">
            {status === "done"
              ? `${visible.length} jobs matched your profile`
              : "AI-ranked jobs scored against your resume"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "done" && (
            <button
              onClick={() => setShowFilter((s) => !s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                showFilter
                  ? "bg-[#1A1A24] border-orange-500/30 text-orange-400"
                  : "bg-[#111118] border-[#2A2A38] text-[#8B8BA8] hover:border-[#3A3A4E] hover:text-[#F0F0F5]"
              }`}
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Zap size={14} className={loading ? "animate-pulse" : ""} />
            {loading ? "Scoring…" : "Generate digest"}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilter && status === "done" && (
        <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-4 mb-6 flex flex-wrap gap-6 items-end">
          <div>
            <label className="text-[#55556A] text-xs font-medium block mb-2">Platform</label>
            <select
              value={filter.platform}
              onChange={(e) => setFilter((f) => ({ ...f, platform: e.target.value }))}
              className="bg-[#1A1A24] border border-[#2A2A38] rounded-lg px-3 py-2 text-[#F0F0F5] text-sm focus:outline-none focus:border-orange-500"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>{p === "all" ? "All platforms" : p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[#55556A] text-xs font-medium block mb-2">Work mode</label>
            <select
              value={filter.work_mode}
              onChange={(e) => setFilter((f) => ({ ...f, work_mode: e.target.value }))}
              className="bg-[#1A1A24] border border-[#2A2A38] rounded-lg px-3 py-2 text-[#F0F0F5] text-sm focus:outline-none focus:border-orange-500"
            >
              {["all", "remote", "hybrid", "onsite"].map((m) => (
                <option key={m} value={m}>{m === "all" ? "All modes" : m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[#55556A] text-xs font-medium block mb-2">
              Min score: <span className="text-orange-400">{filter.min_score}%</span>
            </label>
            <input
              type="range" min={0} max={90} step={10}
              value={filter.min_score}
              onChange={(e) => setFilter((f) => ({ ...f, min_score: Number(e.target.value) }))}
              className="w-32 accent-orange-500"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          Failed to generate digest — make sure the backend is running and you've uploaded a resume.
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty: initial state */}
      {!loading && status === "idle" && (
        <div className="border border-dashed border-[#2A2A38] rounded-xl">
          <EmptyState
            icon="🎯"
            title="Ready to find your next role"
            description="Click 'Generate digest' to score and rank today's scraped jobs against your resume."
            action={
              <button
                onClick={generate}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Generate digest
              </button>
            }
          />
        </div>
      )}

      {/* Empty: no results */}
      {!loading && status === "done" && visible.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No jobs match your filters"
          description={jobs.length > 0 ? "Try loosening your filters above." : "Run the scraper first to populate jobs, then generate your digest."}
        />
      )}

      {/* Job grid */}
      {!loading && visible.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle, Bookmark, X } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  platform: string;
  work_mode: string | null;
  salary_min: number | null;
  salary_max: number | null;
  match_score: number;
  skills_matched: string[];
  skills_missing: string[];
  reasoning: string | null;
};

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#2A2A38" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {score}%
      </span>
    </div>
  );
}

type ActionState = "idle" | "approve" | "save" | "reject" | "loading";

export default function JobCard({ job }: { job: Job }) {
  const [action, setAction] = useState<ActionState>("idle");
  const [expanded, setExpanded] = useState(false);

  async function act(a: "approve" | "save" | "reject") {
    setAction("loading");
    try {
      await fetch(`http://localhost:8000/api/jobs/${job.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: a }),
      });
      setAction(a);
    } catch {
      setAction("idle");
    }
  }

  if (action === "reject") return null;

  const workModeLabel: Record<string, string> = {
    remote: "Remote", hybrid: "Hybrid", onsite: "Onsite"
  };

  function formatSalary(min: number | null, max: number | null) {
    if (!min) return null;
    const fmt = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`;
    return max ? `${fmt(min)} – ${fmt(max)}` : `${fmt(min)}+`;
  }

  return (
    <div className={cn(
      "bg-[#111118] border rounded-xl transition-all duration-200 fade-up overflow-hidden",
      action === "approve"
        ? "border-green-500/30 bg-green-500/5"
        : action === "save"
        ? "border-blue-500/30"
        : "border-[#2A2A38] hover:border-[#3A3A4E]"
    )}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <ScoreRing score={job.match_score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[#F0F0F5] font-semibold text-sm leading-snug line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-[#8B8BA8] text-xs mt-0.5">{job.company}</p>
              </div>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#55556A] hover:text-orange-400 transition-colors flex-shrink-0 mt-0.5"
              >
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {job.location && (
                <Badge variant="default">{job.location.split(",")[0]}</Badge>
              )}
              {job.work_mode && (
                <Badge variant={job.work_mode === "remote" ? "success" : "default"}>
                  {workModeLabel[job.work_mode] ?? job.work_mode}
                </Badge>
              )}
              {job.platform && (
                <Badge variant="default" className="capitalize">{job.platform}</Badge>
              )}
              {formatSalary(job.salary_min, job.salary_max) && (
                <Badge variant="orange">{formatSalary(job.salary_min, job.salary_max)}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        {job.skills_matched.length > 0 && (
          <div className="mb-3">
            <p className="text-[#55556A] text-xs mb-1.5 font-medium">Matched</p>
            <div className="flex flex-wrap gap-1">
              {job.skills_matched.slice(0, 5).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-green-500/8 text-green-400 border border-green-500/15">
                  {s}
                </span>
              ))}
              {job.skills_matched.length > 5 && (
                <span className="text-xs px-2 py-0.5 text-[#55556A]">
                  +{job.skills_matched.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {job.skills_missing.length > 0 && (
          <div className="mb-3">
            <p className="text-[#55556A] text-xs mb-1.5 font-medium">Gaps</p>
            <div className="flex flex-wrap gap-1">
              {job.skills_missing.slice(0, 3).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-500/8 text-red-400 border border-red-500/15">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning toggle */}
        {job.reasoning && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-[#55556A] hover:text-[#8B8BA8] transition-colors mb-3 flex items-center gap-1"
          >
            {expanded ? "Hide" : "Show"} AI reasoning
            <span className="text-[10px]">{expanded ? "▲" : "▼"}</span>
          </button>
        )}
        {expanded && job.reasoning && (
          <p className="text-xs text-[#8B8BA8] leading-relaxed bg-[#1A1A24] rounded-lg p-3 mb-3 border border-[#2A2A38]">
            {job.reasoning}
          </p>
        )}

        {/* Actions */}
        {action === "approve" ? (
          <div className="flex items-center gap-2 text-green-400 text-sm py-1">
            <CheckCircle size={15} />
            <span>Approved — queued for auto-apply</span>
          </div>
        ) : action === "save" ? (
          <div className="flex items-center gap-2 text-blue-400 text-sm py-1">
            <Bookmark size={15} />
            <span>Saved for later</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => act("approve")}
              disabled={action === "loading"}
              className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold transition-colors disabled:opacity-40"
            >
              Approve & Apply
            </button>
            <button
              onClick={() => act("save")}
              disabled={action === "loading"}
              className="w-10 h-[34px] rounded-lg bg-[#1A1A24] hover:bg-[#2A2A38] text-[#8B8BA8] hover:text-[#F0F0F5] transition-colors disabled:opacity-40 flex items-center justify-center"
            >
              <Bookmark size={14} />
            </button>
            <button
              onClick={() => act("reject")}
              disabled={action === "loading"}
              className="w-10 h-[34px] rounded-lg bg-[#1A1A24] hover:bg-red-500/10 text-[#55556A] hover:text-red-400 transition-colors disabled:opacity-40 flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

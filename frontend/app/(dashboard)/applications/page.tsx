"use client";

import { useEffect, useState } from "react";
import { ClipboardList, ExternalLink } from "lucide-react";
import { Badge, Skeleton, EmptyState } from "@/components/ui";

type App = {
  id: string;
  status: "pending" | "applying" | "applied" | "failed";
  applied_at: string | null;
  job: { title: string; company: string; platform: string; url: string } | null;
};

const statusVariant: Record<string, any> = {
  applied:  "success",
  applying: "info",
  pending:  "warning",
  failed:   "danger",
};

const statusLabel: Record<string, string> = {
  applied:  "Applied",
  applying: "Applying…",
  pending:  "Pending",
  failed:   "Failed",
};

export default function ApplicationsPage() {
  const [apps, setApps]     = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/applications")
      .then((r) => r.json())
      .then((d) => { setApps(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total:   apps.length,
    applied: apps.filter((a) => a.status === "applied").length,
    pending: apps.filter((a) => a.status === "pending").length,
    failed:  apps.filter((a) => a.status === "failed").length,
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-2 text-[#55556A] text-xs font-medium uppercase tracking-wider mb-2">
        <ClipboardList size={12} /> Applications
      </div>
      <h1 className="text-2xl font-bold text-[#F0F0F5] tracking-tight mb-1">Application tracker</h1>
      <p className="text-[#8B8BA8] text-sm mb-8">Every job your agent has applied to on your behalf</p>

      {/* Stats row */}
      {!loading && apps.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total",   value: counts.total,   color: "text-[#F0F0F5]" },
            { label: "Applied", value: counts.applied,  color: "text-green-400" },
            { label: "Pending", value: counts.pending,  color: "text-amber-400" },
            { label: "Failed",  value: counts.failed,   color: "text-red-400"   },
          ].map((s) => (
            <div key={s.label} className="bg-[#111118] border border-[#2A2A38] rounded-xl p-4">
              <p className={`text-2xl font-bold tabular-nums mb-1 ${s.color}`}>{s.value}</p>
              <p className="text-[#55556A] text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#111118] border border-[#2A2A38] rounded-xl p-4 flex gap-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && apps.length === 0 && (
        <div className="border border-dashed border-[#2A2A38] rounded-xl">
          <EmptyState
            icon="📭"
            title="No applications yet"
            description="Approve jobs in the Jobs Feed to start auto-applying. Your agent will track everything here."
          />
        </div>
      )}

      {/* Table */}
      {!loading && apps.length > 0 && (
        <div className="bg-[#111118] border border-[#2A2A38] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A38]">
                {["Role", "Company", "Platform", "Status", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-[#55556A] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A24]">
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-[#1A1A24] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[#F0F0F5] font-medium line-clamp-1">
                        {app.job?.title ?? "—"}
                      </span>
                      {app.job?.url && (
                        <a
                          href={app.job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-[#55556A] hover:text-orange-400 transition-all"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#8B8BA8]">{app.job?.company ?? "—"}</td>
                  <td className="px-5 py-4">
                    <Badge variant="default" className="capitalize">
                      {app.job?.platform ?? "—"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={statusVariant[app.status] ?? "default"}>
                      {statusLabel[app.status] ?? app.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-[#55556A] text-xs tabular-nums">
                    {app.applied_at
                      ? new Date(app.applied_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

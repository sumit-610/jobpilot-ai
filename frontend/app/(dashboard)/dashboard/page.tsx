import { currentUser } from "@clerk/nextjs/server";
import { LayoutDashboard, ArrowRight, Clock, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui";

const steps = [
  { n: 1, label: "Upload your resume",           href: "/resume",       done: false },
  { n: 2, label: "Set job preferences",          href: "/settings",     done: false },
  { n: 3, label: "Run your first scrape",        href: "/jobs",         done: false },
  { n: 4, label: "Review & approve jobs",        href: "/jobs",         done: false },
];

export default async function DashboardPage() {
  const user = await currentUser();
  const name = user?.firstName ?? "there";

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" :
    now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#55556A] text-xs font-medium uppercase tracking-wider mb-3">
          <LayoutDashboard size={12} />
          Overview
        </div>
        <h1 className="text-3xl font-bold text-[#F0F0F5] tracking-tight mb-1">
          {greeting}, {name}
        </h1>
        <p className="text-[#8B8BA8] text-sm">
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          {" · "}Your agent is standing by.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Scraped today"    value="0"  sub="Run scraper to populate"       accent="text-orange-400" />
        <StatCard label="Pending review"   value="0"  sub="Jobs awaiting your decision"   accent="text-amber-400" />
        <StatCard label="Applied"          value="0"  sub="Total applications sent"       accent="text-green-400" />
        <StatCard label="Avg match score"  value="—"  sub="Upload resume to calculate"    accent="text-blue-400" />
      </div>

      {/* Two-col: getting started + schedule */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Getting started */}
        <div className="lg:col-span-2 bg-[#111118] border border-[#2A2A38] rounded-xl p-6">
          <h2 className="text-[#F0F0F5] font-semibold text-sm mb-4">Getting started</h2>
          <div className="space-y-1">
            {steps.map((s) => (
              <Link
                key={s.n}
                href={s.href}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#1A1A24] transition-colors group"
              >
                <div className={`
                  w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors
                  ${s.done
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-[#1A1A24] border-[#2A2A38] text-[#55556A] group-hover:border-orange-500/40 group-hover:text-orange-400"
                  }
                `}>
                  {s.done ? <CheckCircle size={13} /> : s.n}
                </div>
                <span className="text-[#8B8BA8] text-sm group-hover:text-[#F0F0F5] transition-colors flex-1">
                  {s.label}
                </span>
                <ArrowRight size={13} className="text-[#2A2A38] group-hover:text-[#55556A] transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-4">
          {/* Schedule card */}
          <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-orange-400" />
              <span className="text-[#F0F0F5] text-sm font-medium">Daily schedule</span>
            </div>
            <div className="text-3xl font-bold text-orange-400 tabular-nums mb-1">7:52</div>
            <p className="text-[#55556A] text-xs">AM IST — agent runs automatically</p>
            <div className="mt-4 pt-4 border-t border-[#2A2A38]">
              <p className="text-[#8B8BA8] text-xs leading-relaxed">
                Scrapes LinkedIn & Wellfound, scores matches, delivers your digest.
              </p>
            </div>
          </div>

          {/* Quick action */}
          <Link
            href="/jobs"
            className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 hover:bg-orange-500/15 transition-colors group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-orange-400" />
                <span className="text-orange-300 text-sm font-medium">Generate digest</span>
              </div>
              <p className="text-orange-400/60 text-xs">Score & rank today's jobs</p>
            </div>
            <ArrowRight size={15} className="text-orange-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

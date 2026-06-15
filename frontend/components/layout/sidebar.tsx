"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Target,
  ClipboardList,
  Bookmark,
  FileText,
  Settings,
  Zap,
} from "lucide-react";

const nav = [
  { href: "/dashboard",     label: "Overview",      icon: LayoutDashboard },
  { href: "/jobs",          label: "Jobs Feed",     icon: Target },
  { href: "/saved",         label: "Saved Jobs",    icon: Bookmark },
  { href: "/applications",  label: "Applications",  icon: ClipboardList },
  { href: "/resume",        label: "Resume",        icon: FileText },
  { href: "/settings",      label: "Settings",      icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-[#111118] border-r border-[#2A2A38] flex flex-col flex-shrink-0">

      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-[#2A2A38] gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-white" fill="white" />
        </div>
        <span className="font-bold text-[#F0F0F5] text-base tracking-tight">
          JobPilot<span className="text-orange-500"> AI</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group
                ${active
                  ? "bg-orange-500/10 text-orange-400 font-medium"
                  : "text-[#8B8BA8] hover:text-[#F0F0F5] hover:bg-[#1A1A24]"
                }
              `}
            >
              <Icon
                size={16}
                className={active ? "text-orange-400" : "text-[#55556A] group-hover:text-[#8B8BA8]"}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-[#2A2A38]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1A1A24] transition-colors">
          <UserButton afterSignOutUrl="/sign-in" />
          <span className="text-[#8B8BA8] text-xs">Account</span>
        </div>
      </div>
    </aside>
  );
}

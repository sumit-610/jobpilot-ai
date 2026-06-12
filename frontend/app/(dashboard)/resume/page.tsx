"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Briefcase, GraduationCap, Code } from "lucide-react";
import { Badge } from "@/components/ui";
import { resumeApi } from "@/lib/api";

type ParsedResume = {
  full_name?: string;
  skills?: string[];
  experience_years?: number;
  summary?: string;
  experience?: { title: string; company: string; duration_months: number; description: string }[];
  education?: { institution: string; degree: string; year: number | null }[];
  projects?: { name: string; tech_stack: string[]; description: string }[];
};

export default function ResumePage() {
  const [drag, setDrag]     = useState(false);
  const [file, setFile]     = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [error, setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.name.endsWith(".pdf")) { setFile(f); setStatus("idle"); setParsed(null); }
  }, []);

  async function upload() {
    if (!file) return;
    setStatus("uploading"); setError("");
    const form = new FormData(); form.append("file", file);
    try {
      const res = await resumeApi.upload(file);
      const data = res.data;
      setParsed(data.parsed);
      setStatus("done");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? e.message ?? "Upload failed");
      setStatus("error");
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2 text-[#55556A] text-xs font-medium uppercase tracking-wider mb-2">
        <FileText size={12} /> Resume
      </div>
      <h1 className="text-2xl font-bold text-[#F0F0F5] tracking-tight mb-1">Your resume</h1>
      <p className="text-[#8B8BA8] text-sm mb-8">
        Upload once — JobPilot parses your skills and matches every job against them.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-4
          ${drag
            ? "border-orange-500 bg-orange-500/5"
            : status === "done"
            ? "border-green-500/40 bg-green-500/5"
            : "border-[#2A2A38] hover:border-[#3A3A4E] hover:bg-[#111118]"
          }
        `}
      >
        <input
          ref={inputRef} type="file" accept=".pdf" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setStatus("idle"); setParsed(null); }
          }}
        />
        {status === "done" ? (
          <>
            <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-green-400 font-semibold mb-1">Parsed successfully</p>
            <p className="text-[#55556A] text-sm">{file?.name}</p>
          </>
        ) : (
          <>
            <Upload size={28} className={`mx-auto mb-3 ${drag ? "text-orange-400" : "text-[#55556A]"}`} />
            {file ? (
              <>
                <p className="text-[#F0F0F5] font-medium mb-1">{file.name}</p>
                <p className="text-[#55556A] text-sm">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p className="text-[#F0F0F5] font-medium mb-1">Drop your resume here</p>
                <p className="text-[#55556A] text-sm">PDF only · max 5MB</p>
              </>
            )}
          </>
        )}
      </div>

      {/* Upload button */}
      {file && status !== "done" && (
        <button
          onClick={upload}
          disabled={status === "uploading"}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors mb-4"
        >
          {status === "uploading" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-base">⟳</span> Parsing with AI…
            </span>
          ) : "Upload & parse resume"}
        </button>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
          <AlertCircle size={14} /> {error || "Upload failed. Check that the backend is running."}
        </div>
      )}

      {/* Parsed output */}
      {parsed && (
        <div className="space-y-4 fade-up">

          {/* Summary */}
          {parsed.summary && (
            <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-5">
              <p className="text-[#55556A] text-xs font-medium uppercase tracking-wider mb-3">Summary</p>
              <p className="text-[#8B8BA8] text-sm leading-relaxed">{parsed.summary}</p>
            </div>
          )}

          {/* Skills */}
          {parsed.skills && parsed.skills.length > 0 && (
            <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Code size={14} className="text-orange-400" />
                <p className="text-[#F0F0F5] text-sm font-semibold">
                  Skills extracted
                  <span className="ml-2 text-[#55556A] font-normal text-xs">{parsed.skills.length} found</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {parsed.skills.map((s) => (
                  <Badge key={s} variant="orange">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {parsed.experience && parsed.experience.length > 0 && (
            <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={14} className="text-blue-400" />
                <p className="text-[#F0F0F5] text-sm font-semibold">
                  Experience
                  <span className="ml-2 text-[#55556A] font-normal text-xs">{parsed.experience_years} years total</span>
                </p>
              </div>
              <div className="space-y-4">
                {parsed.experience.map((e, i) => (
                  <div key={i} className={i > 0 ? "pt-4 border-t border-[#2A2A38]" : ""}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-[#F0F0F5] text-sm font-medium">{e.title}</p>
                      <span className="text-[#55556A] text-xs">
                        {e.duration_months >= 12
                          ? `${Math.floor(e.duration_months / 12)}y ${e.duration_months % 12 ? (e.duration_months % 12) + "m" : ""}`
                          : `${e.duration_months}m`}
                      </span>
                    </div>
                    <p className="text-[#8B8BA8] text-xs mb-1.5">{e.company}</p>
                    <p className="text-[#55556A] text-xs leading-relaxed">{e.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {parsed.education && parsed.education.length > 0 && (
            <div className="bg-[#111118] border border-[#2A2A38] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={14} className="text-green-400" />
                <p className="text-[#F0F0F5] text-sm font-semibold">Education</p>
              </div>
              <div className="space-y-3">
                {parsed.education.map((e, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div>
                      <p className="text-[#F0F0F5] text-sm">{e.degree}</p>
                      <p className="text-[#8B8BA8] text-xs mt-0.5">{e.institution}</p>
                    </div>
                    {e.year && <span className="text-[#55556A] text-xs">{e.year}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

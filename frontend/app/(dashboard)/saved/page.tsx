"use client";

import { useEffect, useState } from "react";
import JobCard, { Job } from "@/components/jobs/job-card";
import { applicationsApi } from "@/lib/api";
import { EmptyState, SkeletonCard } from "@/components/ui";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  async function loadSavedJobs() {
    try {
      const res = await applicationsApi.saved();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F0F0F5]">
          Saved Jobs
        </h1>

        <p className="text-[#8B8BA8] text-sm mt-1">
          {jobs.length} saved jobs
        </p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No saved jobs yet"
          description="Save jobs from the Jobs Feed and they will appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
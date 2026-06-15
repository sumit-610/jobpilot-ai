import axios from "axios";
import { auth } from "@clerk/nextjs/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Attach Clerk JWT to every request (client-side)
if (typeof window !== "undefined") {
  apiClient.interceptors.request.use(async (config) => {
    // @ts-ignore — window.__clerk is set by Clerk's provider
    const token = await window.Clerk?.session?.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

// API functions
export const jobsApi = {
  getJobs: () => apiClient.get("/jobs"),
  action: (jobId: string, action: "approve" | "reject" | "save") =>
    apiClient.post(`/jobs/${jobId}/action`, { action }),
};

export const usersApi = {
  getMe: () => apiClient.get("/users/me"),
  updatePreferences: (preferences: any) =>
    apiClient.put("/users/preferences", preferences),
};

export const applicationsApi = {
  list: () => apiClient.get("/applications"),

  trigger: (jobId: string) =>
    apiClient.post("/applications", {
      job_id: jobId,
    }),

  saved: () =>
    apiClient.get("/applications/saved"),
};

export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post("/resume/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getParsed: () => apiClient.get("/resume/parsed"),
};

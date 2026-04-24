"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface JobFeedContextValue {
  isPendingJob: boolean;
  pendingTitle: string;
  setPendingJob: (title: string) => void;
  clearPendingJob: () => void;
}

const JobFeedContext = createContext<JobFeedContextValue | null>(null);

export function JobFeedProvider({ children }: { children: ReactNode }) {
  const [pendingTitle, setPendingTitle] = useState("");

  return (
    <JobFeedContext.Provider
      value={{
        isPendingJob: pendingTitle.length > 0,
        pendingTitle,
        setPendingJob: (title) => setPendingTitle(title),
        clearPendingJob: () => setPendingTitle(""),
      }}
    >
      {children}
    </JobFeedContext.Provider>
  );
}

export function useJobFeed() {
  const ctx = useContext(JobFeedContext);
  if (!ctx) throw new Error("useJobFeed must be used within JobFeedProvider");
  return ctx;
}

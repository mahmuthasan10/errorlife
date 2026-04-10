import { getUserJobs } from "@/lib/profile-queries";
import JobsListClient from "./jobs-list-client";

export default async function JobsTab({ userId }: { userId: string }) {
  const jobs = await getUserJobs(userId);
  return <JobsListClient initialJobs={jobs} userId={userId} />;
}

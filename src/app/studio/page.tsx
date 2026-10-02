import { redirect } from "next/navigation";
import { ProjectsHome } from "@/components/ProjectsHome";
import { isDemo } from "@/lib/config";
import { getSession } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudioHome() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [projects, credits] = await Promise.all([session.store.listProjects(), session.store.getCredits()]);
  return <ProjectsHome projects={projects} credits={credits} email={session.email} demo={isDemo} />;
}

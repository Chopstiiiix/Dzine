import { redirect } from "next/navigation";
import { Studio } from "@/components/Studio";
import { getSession } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudioPage(props: PageProps<"/studio/[id]">) {
  const { id } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/studio/${id}`)}`);
  return <Studio projectId={id} />;
}

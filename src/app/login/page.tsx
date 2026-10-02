import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isDemo } from "@/lib/config";

export default async function LoginPage(props: PageProps<"/login">) {
  if (isDemo) redirect("/studio");
  const query = await props.searchParams;
  const nextParam = typeof query.next === "string" ? query.next : "";
  const next = /^\/studio(\/[\w-]+)?$/.test(nextParam) ? nextParam : "/studio";
  const error = typeof query.error === "string" ? query.error : null;
  return <LoginForm next={next} initialError={error} />;
}

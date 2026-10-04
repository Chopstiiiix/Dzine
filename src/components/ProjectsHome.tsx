"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RATIOS, RATIO_GROUPS, getRatio } from "@/lib/ratios";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { ProjectSummary } from "@/lib/store/types";
import { Logo } from "./Logo";
import { RatioShape } from "./RatioPicker";

export function ProjectsHome({
  projects: initial,
  credits,
  email,
  demo,
}: {
  projects: ProjectSummary[];
  /** null while credits are switched off for testing. */
  credits: number | null;
  email: string | null;
  demo: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async (ratioId: string) => {
    setCreating(ratioId);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratio: ratioId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      router.push(`/studio/${body.id}`);
    } catch {
      setError("Could not start a new design. Please try again.");
      setCreating(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this design? This cannot be undone.")) return;
    setProjects((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  };

  const signOut = async () => {
    await createBrowserSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mx-auto min-h-dvh max-w-[1080px] px-6 pb-20">
      <header className="flex h-16 items-center justify-between">
        <Link href="/" aria-label="Dzine home">
          <Logo size={19} />
        </Link>
        <div className="flex items-center gap-3 text-[13px]">
          {credits !== null ? (
            <span className="rounded-full border border-line px-2.5 py-1 font-medium tabular-nums">
              {credits} {credits === 1 ? "credit" : "credits"}
            </span>
          ) : null}
          {demo ? (
            <span className="text-muted">Demo mode</span>
          ) : (
            <button type="button" onClick={() => void signOut()} className="text-muted transition hover:text-ink" title={email ?? undefined}>
              Sign out
            </button>
          )}
        </div>
      </header>

      <section className="pt-10">
        <h1 className="text-[30px] font-semibold tracking-[-0.03em]">Start a new design</h1>
        <p className="mt-1.5 text-[15px] text-muted">Pick where it&apos;s going. You can change the format later.</p>
        {error ? (
          <p role="alert" className="mt-3 text-[13.5px] text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {RATIO_GROUPS.map((group) => (
            <div key={group}>
              <h2 className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-faint">{group}</h2>
              <div className="mt-2.5 flex flex-col gap-1.5">
                {RATIOS.filter((r) => r.group === group).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={!!creating}
                    onClick={() => void create(r.id)}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-panel px-3 py-2.5 text-left transition hover:border-faint disabled:opacity-60"
                  >
                    <span className="text-muted transition group-hover:text-accent">
                      <RatioShape ratio={r} size={26} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{creating === r.id ? "Opening…" : r.label}</span>
                      <span className="block truncate text-[12px] text-muted">{r.hint}</span>
                    </span>
                    <Plus size={15} className="text-faint" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {projects.length ? (
        <section className="pt-14">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Your designs</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((p) => {
              const r = getRatio(p.ratio);
              return (
                <div key={p.id} className="group relative">
                  <Link href={`/studio/${p.id}`} className="block">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line bg-soft p-4">
                      {p.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumb} alt="" className="max-h-full max-w-full rounded-[3px] shadow-md" />
                      ) : (
                        <span className="text-faint">
                          <RatioShape ratio={r} size={44} />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-[13.5px] font-medium">{p.title}</p>
                    <p className="text-[12px] text-muted">{r.label}</p>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${p.title}`}
                    onClick={() => void remove(p.id)}
                    className="absolute right-2 top-2 rounded-lg bg-panel/90 p-2 text-muted shadow-sm transition hover:text-danger focus:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:p-1.5 [@media(hover:hover)]:opacity-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

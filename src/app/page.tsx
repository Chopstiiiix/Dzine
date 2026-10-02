import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { FREE_CREDITS } from "@/lib/config";
import { RATIOS } from "@/lib/ratios";

const STEPS = [
  { n: "01", title: "Add your content", body: "Photos, logos, names, dates. Everything that has to be on it." },
  { n: "02", title: "Describe the look", body: "Say it in your own words, or drop in a reference to follow." },
  { n: "03", title: "Watch it come together", body: "The design builds live beside the chat. Ask for changes until it's right." },
];

export default async function Home(props: PageProps<"/">) {
  // Supabase sends sign-in codes to the site root when a redirect URL is not on its allow list.
  const { code } = await props.searchParams;
  if (typeof code === "string") redirect(`/auth/callback?code=${encodeURIComponent(code)}`);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1080px] flex-col px-6">
      <header className="flex h-16 items-center justify-between">
        <Logo size={19} />
        <Link href="/studio" className="text-[14px] font-medium text-muted transition hover:text-ink">
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16 md:py-24">
        <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-accent">A designer, not a generator</p>
        <h1 className="mt-5 max-w-[15ch] text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[64px] md:text-[76px]">
          Posters, covers and cards, designed while you watch.
        </h1>
        <p className="mt-6 max-w-[56ch] text-[17px] leading-relaxed text-muted">
          Dzine is a design agent for artwork that has to say something. It generates the imagery, then sets your words and
          logos itself, so the text is always spelled right and every piece is ready for the platform you picked.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/studio" className="rounded-xl bg-ink px-5 py-3 text-[15px] font-medium text-bg transition hover:opacity-90">
            Start designing
          </Link>
          <span className="text-[14px] text-muted">{FREE_CREDITS} free designs. No card needed.</span>
        </div>

        <ol className="mt-20 grid gap-8 border-t border-line pt-10 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="font-mono text-[12px] text-faint">{s.n}</span>
              <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{s.title}</h2>
              <p className="mt-1.5 max-w-[34ch] text-[14.5px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14">
          <p className="text-[13px] text-faint">Sized for</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {RATIOS.map((r) => (
              <li key={r.id} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-muted">
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="flex h-16 items-center text-[13px] text-faint">© {new Date().getFullYear()} Dzine</footer>
    </div>
  );
}

export function Logo({ size = 18 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-[0.38em] font-semibold tracking-[-0.03em] text-ink" style={{ fontSize: size }}>
      <span aria-hidden className="inline-block rounded-[0.18em] bg-accent" style={{ width: "0.62em", height: "0.62em", transform: "rotate(12deg)" }} />
      Dzine
    </span>
  );
}

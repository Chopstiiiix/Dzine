import { isDemo } from "@/lib/config";
import { notFound } from "@/lib/http";
import { MemoryStore } from "@/lib/store/memory";

/** Serves in-memory assets in demo mode. With Supabase, assets come straight from storage. */
export async function GET(_req: Request, ctx: RouteContext<"/api/demo-asset/[id]">) {
  if (!isDemo) return notFound();
  const { id } = await ctx.params;
  const asset = await new MemoryStore().getAssetData(id);
  if (!asset) return notFound();
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "private, max-age=3600",
      // Uploaded files are never executed as a page.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

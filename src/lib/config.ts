// Central configuration. Anything a founder is likely to tune lives here.

/** No Supabase configured: the app runs fully in memory with a demo user. */
export const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const serverConfig = {
  /** The model that plays the designer. */
  agentModel: process.env.DZINE_AGENT_MODEL || "claude-opus-5-5",
  /** Text-to-image model on fal.ai. The matching edit endpoint is `${imageModel}/edit`. */
  imageModel: process.env.DZINE_IMAGE_MODEL || "fal-ai/nano-banana-pro",
  /** 1K, 2K or 4K. 2K keeps backgrounds sharp at print-size exports. */
  imageResolution: process.env.DZINE_IMAGE_RESOLUTION || "2K",
  /**
   * Template mode: the designer picks a typography treatment and supplies words and colours, and code
   * places every box. For local models that cannot write reliable layout coordinates.
   */
  get templateMode() {
    return process.env.DZINE_TEMPLATE_MODE === "1";
  },
  /** Generate images on this machine with mflux instead of fal.ai. Apple Silicon only, never on Vercel. */
  localImages: process.env.DZINE_LOCAL_IMAGES === "1" && process.env.DZINE_MOCK !== "1",
  /** Folder holding the mflux-generate-* commands (`uv tool install mflux` puts them here). */
  mfluxDir: process.env.DZINE_MFLUX_DIR || `${process.env.HOME}/.local/bin`,
  /** Long side in pixels of locally generated images. Higher is sharper and slower. */
  localImageSize: Number(process.env.DZINE_LOCAL_IMAGE_SIZE || 1536),
  cutoutModel: process.env.DZINE_CUTOUT_MODEL || "fal-ai/birefnet/v2",
  /** AI images the agent may create in a single turn. Caps the cost of one credit. */
  maxImagesPerTurn: Number(process.env.DZINE_MAX_IMAGES_PER_TURN || 3),
  /** Times per turn the agent gets to look at the real render and fix it. */
  reviewPasses: Number(process.env.DZINE_REVIEW_PASSES || 1),
  thinking: process.env.DZINE_THINKING !== "off",
  /**
   * Run the designer on an OpenAI-compatible API (e.g. NVIDIA). Models are tried in order, each given
   * DZINE_LLM_WAIT_SECONDS to start answering; if none does, the Anthropic client (DZINE_AGENT_MODEL) takes over.
   * Comma-separated keys are used in turn to spread rate limits.
   */
  get llm() {
    const baseUrl = process.env.DZINE_LLM_BASE_URL;
    const list = (v?: string) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const models = list(process.env.DZINE_LLM_MODELS);
    if (!baseUrl || !models.length) return null;
    return {
      baseUrl,
      keys: list(process.env.DZINE_LLM_API_KEYS),
      models,
      waitMs: Number(process.env.DZINE_LLM_WAIT_SECONDS || 20) * 1000,
    };
  },
  get hasAnthropic() {
    return !!process.env.ANTHROPIC_API_KEY && process.env.DZINE_MOCK !== "1";
  },
  get hasFal() {
    return !!process.env.FAL_KEY && process.env.DZINE_MOCK !== "1";
  },
  get hasStripe() {
    return !!process.env.STRIPE_SECRET_KEY;
  },
  get hasPaystack() {
    return !!process.env.PAYSTACK_SECRET_KEY;
  },
  get appUrl() {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
    ).replace(/\/$/, "");
  },
};

/** Free generations for every new account. Keep in sync with dzine_ensure_profile() in the SQL. */
export const FREE_CREDITS = 2;

/** Testing switch: generations cost nothing and credit counts are hidden. Unset it to bring the limit back. */
export const UNLIMITED_CREDITS = process.env.DZINE_UNLIMITED_CREDITS === "1";

export type Pack = {
  id: string;
  name: string;
  credits: number;
  /** Price in US cents (Stripe). */
  usd: number;
  /** Price in kobo (Paystack). */
  ngn: number;
  popular?: boolean;
};

// PLACEHOLDER PRICES. One credit = one generation or revision, which costs roughly
// $0.25-$0.60 in model fees depending on how many AI images the design needs.
export const PACKS: Pack[] = [
  { id: "starter", name: "Starter", credits: 15, usd: 1200, ngn: 1800000 },
  { id: "creator", name: "Creator", credits: 50, usd: 3500, ngn: 5250000, popular: true },
  { id: "studio", name: "Studio", credits: 150, usd: 9000, ngn: 13500000 },
];

export function formatPrice(pack: Pack, currency: "usd" | "ngn") {
  return currency === "usd"
    ? `$${(pack.usd / 100).toFixed(pack.usd % 100 ? 2 : 0)}`
    : `₦${(pack.ngn / 100).toLocaleString("en-NG")}`;
}

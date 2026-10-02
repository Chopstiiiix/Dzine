import type { Asset, AssetKind, Design } from "@/lib/design/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Asset ids attached to a user message. */
  attachments: string[];
  createdAt: string;
};

/** A turn that is paused while the browser captures a preview for the agent to review. */
export type Pending = {
  /** Tool results already computed for the paused assistant message. */
  toolResults: unknown[];
  /** The design tool call that is waiting for its preview image. */
  reviewToolUseId: string;
  reviewNote: string;
  reviewsLeft: number;
  imagesUsed: number;
  assistantText: string;
  /** Text style the user picked for this turn, kept through the review pass. */
  style?: string;
};

export type Project = {
  id: string;
  title: string;
  ratio: string;
  design: Design | null;
  /** Raw model conversation (Anthropic message params). */
  history: unknown[];
  pending: Pending | null;
  thumb: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = Pick<Project, "id" | "title" | "ratio" | "thumb" | "updatedAt">;

export type NewAsset = {
  kind: AssetKind;
  label: string;
  name: string;
  mime: string;
  width: number | null;
  height: number | null;
  data: Buffer;
};

export class NoCreditsError extends Error {
  constructor() {
    super("insufficient_credits");
  }
}

export interface Store {
  readonly demo: boolean;
  readonly userId: string;
  /** A human-readable reason the store cannot run agent turns, or null when it can. */
  configProblem(): string | null;

  getCredits(): Promise<number>;
  /** Spends one credit and returns the new balance. Throws NoCreditsError at zero. */
  spendCredit(projectId: string): Promise<number>;

  listProjects(): Promise<ProjectSummary[]>;
  createProject(input: { ratio: string; title?: string }): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  updateProject(id: string, patch: Partial<Pick<Project, "title" | "ratio" | "design" | "history" | "pending" | "thumb">>): Promise<void>;
  deleteProject(id: string): Promise<void>;

  listMessages(projectId: string): Promise<ChatMessage[]>;
  addMessage(projectId: string, msg: Pick<ChatMessage, "role" | "content" | "attachments">): Promise<ChatMessage>;

  listAssets(projectId: string): Promise<Asset[]>;
  addAsset(projectId: string, asset: NewAsset): Promise<Asset>;
  /** Raw bytes, for stores whose URLs are not reachable from the public internet. */
  getAssetData(assetId: string): Promise<{ data: Buffer; mime: string } | null>;
}

export const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export function newAssetId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "ast_" + Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}

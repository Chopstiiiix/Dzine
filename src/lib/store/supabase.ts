import type { SupabaseClient } from "@supabase/supabase-js";
import type { Asset, Design } from "@/lib/design/types";
import {
  type ChatMessage,
  EXT,
  type NewAsset,
  NoCreditsError,
  type Pending,
  type Project,
  type Store,
  newAssetId,
} from "./types";

const BUCKET = "dzine-assets";

type ProjectRow = {
  id: string;
  title: string;
  ratio: string;
  design: Design | null;
  history: unknown[] | null;
  pending: Pending | null;
  thumb: string | null;
  created_at: string;
  updated_at: string;
};

type AssetRow = {
  id: string;
  kind: Asset["kind"];
  label: string;
  name: string;
  mime: string;
  width: number | null;
  height: number | null;
  url: string;
};

const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  title: r.title,
  ratio: r.ratio,
  design: r.design,
  history: r.history ?? [],
  pending: r.pending,
  thumb: r.thumb,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const ASSET_COLS = "id, kind, label, name, mime, width, height, url";

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/**
 * Talks to Supabase as the signed-in user, so row level security does the access control.
 * The one exception is the agent's conversation state, which only the server may write:
 * that goes through the service-role client, scoped to this user's own rows.
 */
export class SupabaseStore implements Store {
  readonly demo = false;

  constructor(
    private db: SupabaseClient,
    readonly userId: string,
    private admin: SupabaseClient | null,
  ) {}

  configProblem() {
    return this.admin ? null : "SUPABASE_SERVICE_ROLE_KEY is not set on the server, so designs cannot be generated yet.";
  }

  async getCredits() {
    return check(await this.db.rpc("dzine_ensure_profile")) as number;
  }

  async spendCredit(projectId: string) {
    const { data, error } = await this.db.rpc("dzine_spend_credit", { p_project: projectId });
    if (error) {
      if (error.message.includes("insufficient_credits")) throw new NoCreditsError();
      throw new Error(error.message);
    }
    return data as number;
  }

  async listProjects() {
    const rows = check(
      await this.db
        .from("dzine_projects")
        .select("id, title, ratio, thumb, updated_at")
        .order("updated_at", { ascending: false })
        .limit(60),
    ) as Pick<ProjectRow, "id" | "title" | "ratio" | "thumb" | "updated_at">[];
    return rows.map((r) => ({ id: r.id, title: r.title, ratio: r.ratio, thumb: r.thumb, updatedAt: r.updated_at }));
  }

  async createProject(input: { ratio: string; title?: string }) {
    const row = check(
      await this.db
        .from("dzine_projects")
        .insert({ ratio: input.ratio, title: input.title || "Untitled design" })
        .select()
        .single(),
    ) as ProjectRow;
    return toProject(row);
  }

  async getProject(id: string) {
    const row = check(await this.db.from("dzine_projects").select().eq("id", id).maybeSingle()) as ProjectRow | null;
    return row ? toProject(row) : null;
  }

  async updateProject(id: string, patch: Partial<Project>) {
    const row: Record<string, unknown> = {};
    for (const k of ["title", "ratio", "design", "thumb"] as const) {
      if (k in patch) row[k] = patch[k];
    }
    if (Object.keys(row).length) check(await this.db.from("dzine_projects").update(row).eq("id", id));

    const state: Record<string, unknown> = {};
    for (const k of ["history", "pending"] as const) {
      if (k in patch) state[k] = patch[k];
    }
    if (Object.keys(state).length) {
      if (!this.admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to save agent state.");
      check(await this.admin.from("dzine_projects").update(state).eq("id", id).eq("user_id", this.userId));
    }
  }

  async deleteProject(id: string) {
    const { data: files } = await this.db.storage.from(BUCKET).list(`${this.userId}/${id}`, { limit: 1000 });
    if (files?.length) {
      await this.db.storage.from(BUCKET).remove(files.map((f) => `${this.userId}/${id}/${f.name}`));
    }
    check(await this.db.from("dzine_projects").delete().eq("id", id));
  }

  async listMessages(projectId: string) {
    const rows = check(
      await this.db
        .from("dzine_messages")
        .select("id, role, content, attachments, created_at")
        .eq("project_id", projectId)
        .order("created_at"),
    ) as { id: string; role: ChatMessage["role"]; content: string; attachments: string[]; created_at: string }[];
    return rows.map((r) => ({ id: r.id, role: r.role, content: r.content, attachments: r.attachments ?? [], createdAt: r.created_at }));
  }

  async addMessage(projectId: string, msg: Pick<ChatMessage, "role" | "content" | "attachments">) {
    const r = check(
      await this.db
        .from("dzine_messages")
        .insert({ project_id: projectId, role: msg.role, content: msg.content, attachments: msg.attachments })
        .select("id, role, content, attachments, created_at")
        .single(),
    ) as { id: string; role: ChatMessage["role"]; content: string; attachments: string[]; created_at: string };
    return { id: r.id, role: r.role, content: r.content, attachments: r.attachments ?? [], createdAt: r.created_at };
  }

  async listAssets(projectId: string) {
    return check(
      await this.db.from("dzine_assets").select(ASSET_COLS).eq("project_id", projectId).order("created_at"),
    ) as AssetRow[];
  }

  async addAsset(projectId: string, input: NewAsset) {
    const id = newAssetId();
    const path = `${this.userId}/${projectId}/${id}.${EXT[input.mime] ?? "bin"}`;
    const up = await this.db.storage.from(BUCKET).upload(path, input.data, {
      contentType: input.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
    const url = this.db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return check(
      await this.db
        .from("dzine_assets")
        .insert({
          id,
          project_id: projectId,
          kind: input.kind,
          label: input.label,
          name: input.name,
          mime: input.mime,
          width: input.width,
          height: input.height,
          path,
          url,
        })
        .select(ASSET_COLS)
        .single(),
    ) as AssetRow;
  }

  async getAssetData() {
    return null; // Public URLs: nobody needs the raw bytes.
  }
}

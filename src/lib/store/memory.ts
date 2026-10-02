import { FREE_CREDITS } from "@/lib/config";
import type { Asset } from "@/lib/design/types";
import { type ChatMessage, type NewAsset, NoCreditsError, type Project, type Store, newAssetId } from "./types";

// Demo mode: everything lives in this process. Restarting the server wipes it.

type Db = {
  credits: number;
  projects: Map<string, Project>;
  messages: Map<string, ChatMessage[]>;
  assets: Map<string, Asset & { projectId: string; data: Buffer }>;
};

const g = globalThis as unknown as { __dzineDemo?: Db };
const db: Db = (g.__dzineDemo ??= {
  credits: FREE_CREDITS,
  projects: new Map(),
  messages: new Map(),
  assets: new Map(),
});

const now = () => new Date().toISOString();

export function demoAddCredits(n: number) {
  db.credits += n;
  return db.credits;
}

export class MemoryStore implements Store {
  readonly demo = true;
  readonly userId = "demo";

  configProblem() {
    return null;
  }

  async getCredits() {
    return db.credits;
  }

  async spendCredit() {
    if (db.credits <= 0) throw new NoCreditsError();
    db.credits -= 1;
    return db.credits;
  }

  async listProjects() {
    return [...db.projects.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ id, title, ratio, thumb, updatedAt }) => ({ id, title, ratio, thumb, updatedAt }));
  }

  async createProject(input: { ratio: string; title?: string }) {
    const project: Project = {
      id: crypto.randomUUID(),
      title: input.title || "Untitled design",
      ratio: input.ratio,
      design: null,
      history: [],
      pending: null,
      thumb: null,
      createdAt: now(),
      updatedAt: now(),
    };
    db.projects.set(project.id, project);
    db.messages.set(project.id, []);
    return project;
  }

  async getProject(id: string) {
    return db.projects.get(id) ?? null;
  }

  async updateProject(id: string, patch: Partial<Project>) {
    const p = db.projects.get(id);
    if (p) db.projects.set(id, { ...p, ...patch, id, updatedAt: now() });
  }

  async deleteProject(id: string) {
    db.projects.delete(id);
    db.messages.delete(id);
    for (const [k, a] of db.assets) if (a.projectId === id) db.assets.delete(k);
  }

  async listMessages(projectId: string) {
    return db.messages.get(projectId) ?? [];
  }

  async addMessage(projectId: string, msg: Pick<ChatMessage, "role" | "content" | "attachments">) {
    const m: ChatMessage = { id: crypto.randomUUID(), createdAt: now(), ...msg };
    db.messages.set(projectId, [...(db.messages.get(projectId) ?? []), m]);
    return m;
  }

  async listAssets(projectId: string) {
    return [...db.assets.values()]
      .filter((a) => a.projectId === projectId)
      .map((a): Asset => ({ id: a.id, kind: a.kind, label: a.label, name: a.name, mime: a.mime, width: a.width, height: a.height, url: a.url }));
  }

  async addAsset(projectId: string, input: NewAsset) {
    const id = newAssetId();
    const { data, ...meta } = input;
    const asset: Asset = { id, ...meta, url: `/api/demo-asset/${id}` };
    db.assets.set(id, { ...asset, projectId, data });
    return asset;
  }

  async getAssetData(assetId: string) {
    const a = db.assets.get(assetId);
    return a ? { data: a.data, mime: a.mime } : null;
  }
}

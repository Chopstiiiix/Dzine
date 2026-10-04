// Projects with an agent turn in flight, so a page that lost its stream (or was reloaded)
// can tell "still working" from "finished" and pick the turn back up.
// ponytail: lives in this server process only. Fine for one self-hosted server; move it to the
// store (a column with a timestamp) before running more than one instance.
const g = globalThis as unknown as { dzineRunning?: Set<string> };
export const running = (g.dzineRunning ??= new Set<string>());

// Persists the TanStack Query cache to localStorage so the app paints real
// data instantly on the next open — including fully offline.
//
// ⚠️ Previously this called the imperative `persistQueryClient()` from a
// `useEffect` in the root component — which fires *after* first paint, racing
// against whatever queries had already started fetching. Depending on which
// finished first, you'd randomly see: skeleton → fresh data → then the async
// localStorage restore blindly overwriting it with stale cached data a beat
// later. `usePersistQueryClientReady` (used via `PersistQueryClientProvider`
// in __root.tsx) gates query execution until restore finishes, so there's a
// single, deterministic loading → data sequence.
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

const shouldDehydrateQuery = (query: { state: { status: string }; queryKey: readonly unknown[] }) => {
  if (query.state.status !== "success") return false;
  const key = String(query.queryKey[0] ?? "");
  // Chat threads change constantly and can be large — never persist them.
  return !/^(messages|dm|group-messages|chat)/.test(key);
};

// No-op persister for SSR (no localStorage there) — resolves instantly so
// `isRestoring` clears on the very first server render instead of hanging.
const noopPersister: Persister = {
  persistClient: async () => {},
  restoreClient: async () => undefined,
  removeClient: async () => {},
};

export function getQueryPersistOptions() {
  const persister: Persister =
    typeof window === "undefined"
      ? noopPersister
      : (createSyncStoragePersister({
          storage: window.localStorage,
          key: "aladhra.query-cache",
          throttleTime: 1500,
        }) as unknown as Persister);

  return {
    persister,
    maxAge: 24 * 60 * 60 * 1000,
    buster: "v1",
    dehydrateOptions: { shouldDehydrateQuery },
  };
}

export type { PersistedClient };

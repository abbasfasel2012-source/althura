// Persists the TanStack Query cache to localStorage so the app paints real
// data instantly on the next open — including fully offline.
import type { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

let started = false;

export function setupQueryPersistence(queryClient: QueryClient) {
  if (started || typeof window === "undefined") return;
  started = true;

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "aladhra.query-cache",
    throttleTime: 1500,
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000,
    buster: "v1",
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        if (query.state.status !== "success") return false;
        const key = String(query.queryKey[0] ?? "");
        // Chat threads change constantly and can be large — never persist them.
        return !/^(messages|dm|group-messages|chat)/.test(key);
      },
    },
  });
}

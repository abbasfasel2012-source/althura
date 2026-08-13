import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cached pages must paint instantly when the user comes back to them;
        // a refetch on every mount was what made navigation feel sticky.
        staleTime: 60_000,
        gcTime: 24 * 60 * 60_000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: 1,
        // Keep the previous result on screen while a new one loads instead of
        // flashing a skeleton on every parameter change.
        placeholderData: (prev: unknown) => prev,
        networkMode: "offlineFirst",
      },
    },
  });



  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};

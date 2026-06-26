import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { SnackbarProvider } from "notistack";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import "./monaco/setup";
import DarkModeProvider from "./providers/DarkModeProvider.tsx";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
// Needs to be interface to merge with internal interface
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  // Set base document title
  document.title = "CORE";
  document.documentElement.lang = "en";

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <DarkModeProvider>
          <CssBaseline />
          <SnackbarProvider
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            maxSnack={3}
            autoHideDuration={3000}
          >
            <RouterProvider router={router} />
          </SnackbarProvider>
        </DarkModeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

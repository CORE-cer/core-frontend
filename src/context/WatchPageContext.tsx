/* eslint-disable react-refresh/only-export-components */
import { useWatchPage } from "@/hooks/useWatchPage";
import { createContext, useContext } from "react";

type WatchPageContextType = ReturnType<typeof useWatchPage>;

const WatchPageContext = createContext<WatchPageContextType | null>(null);

export function WatchPageProvider({ children }: { children: React.ReactNode }) {
  const watchPage = useWatchPage();
  return (
    <WatchPageContext.Provider value={watchPage}>
      {children}
    </WatchPageContext.Provider>
  );
}

export function useWatchPageContext(): WatchPageContextType {
  const context = useContext(WatchPageContext);
  if (!context) {
    throw new Error(
      "useWatchPageContext must be used within a WatchPageProvider",
    );
  }
  return context;
}

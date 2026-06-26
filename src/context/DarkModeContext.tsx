import { createContext } from "react";

type DarkModeContextType = {
  toggleDarkMode: () => void;
};

export const DarkModeContext = createContext<DarkModeContextType>({
  toggleDarkMode: () => {},
});

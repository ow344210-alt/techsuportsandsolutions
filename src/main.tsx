import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "aos/dist/aos.css";

import App from "./App";

import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
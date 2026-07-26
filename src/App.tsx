import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";

import AppRoutes from "./routes/AppRoutes";
import { SiteContentProvider } from "./contexts/SiteContentContext";

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <SiteContentProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(15, 23, 42, 0.96)",
              color: "#ffffff",
              border: "1px solid rgba(139, 92, 246, 0.45)",
              borderRadius: "16px",
              boxShadow: "0 16px 40px rgba(76, 29, 149, 0.35)",
              padding: "12px 14px",
            },
            success: {
              iconTheme: { primary: "#8b5cf6", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
            },
            loading: {
              iconTheme: { primary: "#8b5cf6", secondary: "#ffffff" },
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </SiteContentProvider>
  );
}

export default App;
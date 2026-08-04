import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import AppRoutes from "./routes/AppRoutes";
import { SiteContentProvider } from "./contexts/SiteContentContext";
import { prefetchPublicData } from "./lib/prefetch";

function App() {
  useEffect(() => {
    prefetchPublicData();
    AOS.init({
      duration: 400,
      once: true,
      offset: 0,
      delay: 0,
      easing: "ease-out",
    });
  }, []);

  return (
    <SiteContentProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SiteContentProvider>
  );
}

export default App;
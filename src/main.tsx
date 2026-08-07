import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register only in a production build. A service worker in front of the Vite
// dev server caches stale modules and makes HMR lie to you.
//
// For the installable demo, run `npm run build && npm run preview` behind the
// tunnel rather than `npm run dev`.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  });
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./ui/styles.css";
import "./ui/media.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    // Activating an offline worker must never reload an open editor: recordings
    // and unfinished subtitle jobs exist only in this page. New app code takes
    // effect when the user next opens or reloads VideoSplat.
    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js?v=29`,
        { updateViaCache: "none" },
      );
      await registration.update();
    } catch (error) {
      // Offline support is optional; registration/update failure must not
      // interrupt the editor or produce an unhandled rejection.
      console.warn("VideoSplat offline support could not be updated.", error);
    }
  });
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

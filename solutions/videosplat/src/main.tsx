import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./ui/styles.css";
import "./ui/media.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    const reloadKey = "videosplat-worker-reloaded-v11";
    const replacingExistingWorker = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!replacingExistingWorker) return;
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    });
    const registration = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js?v=11`,
      { updateViaCache: "none" },
    );
    await registration.update();
  });
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

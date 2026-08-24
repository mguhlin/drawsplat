import { StrictMode } from "react"; import { createRoot } from "react-dom/client"; import { App } from "./ui/App"; import "./ui/styles.css"; import "./ui/split-options.css";
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
if ("serviceWorker" in navigator && import.meta.env.PROD) window.addEventListener("load", () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));

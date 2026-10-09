const select = document.querySelector("[data-pdf-language]");
const supported = new Set(["en", "es", "vi", "ar", "zh", "uh"]);
let stored;
try { stored = localStorage.getItem("drawsplat.language"); } catch { /* Private/file origins can disable storage. */ }
select.value = supported.has(stored) ? stored : "en";

function loadController() {
  if (document.querySelector("script[data-ds-language]")) return;
  const script = document.createElement("script");
  script.src = "../../assets/js/app-language.js?v=20261009-pdf";
  script.dataset.dsLanguage = "pdfsplat";
  document.body.append(script);
}

loadController();
select.addEventListener("change", () => {
  try { localStorage.setItem("drawsplat.language", select.value); } catch { /* Language switching still works. */ }
  loadController();
});

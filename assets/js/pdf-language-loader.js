const select = document.querySelector("[data-pdf-language]");
const supported = new Set(["en", "es", "vi", "ar", "zh", "uh"]);
const stored = localStorage.getItem("drawsplat.language");
select.value = supported.has(stored) ? stored : "en";

function loadController() {
  if (document.querySelector("script[data-ds-language]")) return;
  const script = document.createElement("script");
  script.src = "../../assets/js/app-language.js";
  script.dataset.dsLanguage = "pdfsplat";
  document.body.append(script);
}

if (select.value !== "en") loadController();
select.addEventListener("change", () => {
  localStorage.setItem("drawsplat.language", select.value);
  loadController();
});

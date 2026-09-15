import { defineConfig, devices } from "@playwright/test";
import desktop from "./playwright.config";

// These exercise phone layouts, touch input and capability fallbacks. Desktop
// engines emulating devices cannot validate physical Android/iPhone hardware.
export default defineConfig({
  ...desktop,
  testMatch: "mobile-usability.spec.ts",
  projects: [
    { name: "chromium-phone", use: { ...devices["Pixel 7"], launchOptions: desktop.projects?.[0].use?.launchOptions } },
    { name: "firefox-phone", use: { browserName: "firefox", viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] } },
  ],
});

import { initDownloadButtons } from "./modules/download-buttons.js";
import { initMobileNav } from "./modules/mobile-nav.js";
import { initTheme } from "./modules/theme.js";
import { initUploader } from "./modules/uploader.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initUploader();
  initDownloadButtons();
  initMobileNav();
});
import { downloadAll } from "./downloads.js";
import { clearResults } from "./results.js";

export function initDownloadButtons(){
  ["tinyDownloadTop", "tinyDownloadBottom", "tinyZipTop", "tinyZipBottom"].forEach(id => {
    const button = document.getElementById(id);
    if(!button) return;

    button.disabled = true;
    button.addEventListener("click", event => {
      event.preventDefault();
      downloadAll();
    });
  });

  document.querySelectorAll(".tiny-clear-all").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      clearResults();
    });
  });
}

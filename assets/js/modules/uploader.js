import { chooseBtn, drop, input } from "./dom.js";
import { handleFiles } from "./results.js";

export function initUploader(){
  if(!input || !drop) return;

  drop.addEventListener("click", event => {
    if(event.target instanceof Element && event.target.closest(".convert-widget")) return;
    if(event.target !== input) input.click();
  });

  if(chooseBtn){
    chooseBtn.addEventListener("click", event => {
      event.stopPropagation();
      input.click();
    });
  }

  input.addEventListener("change", event => {
    handleFiles(event.target.files);
  });

  ["dragenter", "dragover"].forEach(eventName => {
    drop.addEventListener(eventName, event => {
      event.preventDefault();
      drop.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    drop.addEventListener(eventName, event => {
      event.preventDefault();
      drop.classList.remove("dragover");
    });
  });

  drop.addEventListener("drop", event => {
    handleFiles(event.dataTransfer.files);
  });
}

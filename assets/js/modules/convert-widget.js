import { setAutoConvert, setConvertFormat } from "./state.js";

export function initConvertWidget(){
  const widget = document.getElementById("convertWidget");
  const toggleButton = widget ? widget.querySelector(".convert-widget-toggle") : null;
  const formatButtons = widget ? widget.querySelectorAll(".convert-option") : [];

  if(!widget || !toggleButton) return;

  function setOpen(isOpen){
    widget.classList.toggle("is-open", isOpen);
    toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    setAutoConvert(isOpen);
  }

  function toggleOpen(event){
    event.preventDefault();
    event.stopPropagation();
    setOpen(!widget.classList.contains("is-open"));
  }

  toggleButton.addEventListener("pointerdown", toggleOpen);
  toggleButton.addEventListener("keydown", event => {
    if(event.key !== "Enter" && event.key !== " ") return;
    toggleOpen(event);
  });

  widget.addEventListener("pointerdown", event => {
    event.stopPropagation();
  });

  widget.addEventListener("click", event => {
    event.stopPropagation();
  });

  formatButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      formatButtons.forEach(item => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      setConvertFormat(button.dataset.format);
    });
  });

  setOpen(widget.classList.contains("is-open"));
}




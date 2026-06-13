export function initTheme(){
  const root = document.documentElement;
  const lightIcon = "assets/img/blackone.webp";
  const darkIcon = "assets/img/whiteone.webp";
  const saved = localStorage.getItem("flowsync-theme");

  if(saved === "dark") root.classList.add("dark");

  function syncTheme(){
    const button = document.getElementById("themeToggle");
    const favicon = document.getElementById("themeFavicon") || document.querySelector('link[rel~="icon"]');
    const isDark = root.classList.contains("dark");

    if(favicon) favicon.href = isDark ? darkIcon : lightIcon;

    if(button){
      button.classList.add("theme-icon-toggle");
      button.setAttribute("type", "button");
      button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");

      if(!button.querySelector(".toggle-sun") || !button.querySelector(".toggle-moon")){
        button.innerHTML = '<span class="toggle-sun" aria-hidden="true"></span><span class="toggle-moon" aria-hidden="true"></span>';
      }
    }
  }

  syncTheme();

  const button = document.getElementById("themeToggle");
  if(!button) return;

  button.addEventListener("click", () => {
    root.classList.toggle("dark");
    localStorage.setItem("flowsync-theme", root.classList.contains("dark") ? "dark" : "light");
    syncTheme();
  });
}

export function initMobileNav(){
  const menuButton = document.querySelector(".nav .icon-btn");
  const navLinks = document.querySelectorAll(".nav-links a");

  if(!menuButton) return;

  menuButton.setAttribute("aria-expanded", "false");

  menuButton.addEventListener("click", () => {
    const open = document.body.classList.toggle("mobile-nav-open");
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    menuButton.innerHTML = open ? "&times;" : "&#9776;";
  });

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      document.body.classList.remove("mobile-nav-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.innerHTML = "&#9776;";
    });
  });
}

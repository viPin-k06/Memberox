const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-links a");

menuToggle.addEventListener("click", () => {
  document.querySelector("nav").classList.toggle("menu-open");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector("nav").classList.remove("menu-open");
  });
});

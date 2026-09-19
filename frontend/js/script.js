const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
const signupForm = document.querySelector("#signup-form");
const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirm-password");
const passwordError = document.querySelector(".password-error");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    document.querySelector("nav").classList.toggle("menu-open");
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector("nav").classList.remove("menu-open");
  });
});

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    password.classList.remove("input-error");
    confirmPassword.classList.remove("input-error");
    passwordError.textContent = "";
    if (password.value.length < 8) {
      passwordError.textContent = "Password must be at least 8 characters.";
      password.classList.add("input-error");
      return;
    }
    if (password.value !== confirmPassword.value) {
      passwordError.textContent = "Passwords do not match.";
      confirmPassword.classList.add("input-error");
      return;
    }
    passwordError.textContent = "";
    confirmPassword.classList.remove("input-error");
    alert("Account created successfully!");
  });
}

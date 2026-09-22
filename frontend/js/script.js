console.log("script.js loaded");

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
const signupForm = document.querySelector("#signup-form");
const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirm-password");
const passwordError = document.querySelector(".password-error");
const loginForm = document.querySelector("#login-form");
const loginEmail = document.querySelector("#email");
const loginPassword = document.querySelector("#password");
const revenueChart = document.querySelector("#revenue-chart");

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

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (loginEmail.value.trim() === "") {
      // alert("Please enter your email.");
      return;
    }

    if (loginPassword.value.length < 8) {
      // alert("Password must be at least 8 characters.");
      return;
    }

    // alert("login successfull!");
  });
}

if (revenueChart) {
  new Chart(revenueChart, {
    type: "line",

    data: {
      labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],

      datasets: [
        {
          label: "Revenue",
          data: [85000, 102000, 94000, 118000, 110000, 124500],
          tension: 0.4,
          pointRadius: 0,
          pointHitRadius: 30,
          pointHoverRadius: 5,
          borderColor: "#7c3aed",
          borderWidth: 3,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return "₹" + context.parsed.y.toLocaleString("en-IN");
            },
          },
        },
      },

      layout: {
        padding: {
          left: 5,
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },
        },

        y: {
          border: {
            display: false,
          },

          grid: {
            color: "#eeeeee",
          },
          ticks: {
            callback: function (value) {
              return "₹" + value.toLocaleString("en-IN");
            },
          },
        },
      },
    },
  });
}

console.log("Chart code reached");

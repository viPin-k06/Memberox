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
const memberSearchInput = document.querySelector("#member-search-input");
const memberFilterBtn = document.querySelector(".member-filter-btn");
const filterMenu = document.querySelector(".filter-menu");
const filterButtons = document.querySelectorAll(".filter-menu button");
const addMemberBtn = document.querySelector(".add-member-btn");
const memberModal = document.querySelector("#member-modal");
const memberModalClose = document.querySelector(".member-modal-close");
const addMemberForm = document.querySelector("#add-member-form");
const memberNameInput = document.querySelector("#member-name");
const memberMembershipInput = document.querySelector("#member-membership");
const memberJoiningDateInput = document.querySelector("#member-joining-date");

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

let selectedStatus = "all";

function filterMembers() {
  const searchValue = memberSearchInput.value.toLowerCase();

  // Desktop table
  const memberRows = document.querySelectorAll(".members-table tbody tr");

  memberRows.forEach((row) => {
    const memberName = row.children[0].textContent.toLowerCase();
    const memberStatus = row.children[2].textContent.toLowerCase();

    const matchesName = memberName.includes(searchValue);
    const matchesStatus =
      selectedStatus === "all" || memberStatus === selectedStatus;

    if (matchesName && matchesStatus) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });

  // Mobile cards
  const mobileCards = document.querySelectorAll(".member-mobile-card");

  mobileCards.forEach((card) => {
    const memberName = card
      .querySelector(".member-mobile-info strong")
      .textContent.toLowerCase();

    const memberStatus = card.dataset.status;

    const matchesName = memberName.includes(searchValue);
    const matchesStatus =
      selectedStatus === "all" || memberStatus === selectedStatus;

    if (matchesName && matchesStatus) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}

if (memberSearchInput) {
  memberSearchInput.addEventListener("input", filterMembers);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedStatus = button.dataset.status;

    filterMembers();

    filterMenu.classList.remove("show");
  });
});

if (memberFilterBtn && filterMenu) {
  memberFilterBtn.addEventListener("click", () => {
    filterMenu.classList.toggle("show");
  });
}

if (addMemberBtn && memberModal) {
  addMemberBtn.addEventListener("click", () => {
    memberModal.classList.add("show");
  });
}

if (memberModalClose && memberModal) {
  memberModalClose.addEventListener("click", () => {
    memberModal.classList.remove("show");
  });
}
if (addMemberForm) {
  addMemberForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = memberNameInput.value.trim();
    const membership = memberMembershipInput.value;
    const joiningDate = new Date(memberJoiningDateInput.value);

    const expiryDate = new Date(joiningDate);

    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const membersTableBody = document.querySelector(".members-table tbody");

    const newRow = document.createElement("tr");

    newRow.innerHTML = `
      <td>${name}</td>
      <td>${membership}</td>
      <td><span class="status status-active">Active</span></td>
      <td>${expiryDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}</td>
      <td>
        <button class="member-action-btn">
          <i class="fa-solid fa-ellipsis"></i>
        </button>
      </td>
    `;

    membersTableBody.appendChild(newRow);

    const mobileList = document.querySelector(".members-mobile-list");

    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    const formattedExpiry = expiryDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newCard = document.createElement("div");

    newCard.classList.add("member-mobile-card");
    newCard.dataset.status = "active";

    newCard.innerHTML = `
  <div class="member-avatar">${initials}</div>

  <div class="member-mobile-info">
    <strong>${name}</strong>
    <p>${membership}</p>
  </div>

  <div class="member-mobile-details">
    <span class="status status-active">Active</span>

    <div class="member-mobile-expiry">
      <i class="fa-regular fa-calendar"></i>
      <span>${formattedExpiry}</span>
    </div>
  </div>

  <button class="member-action-btn">
    <i class="fa-solid fa-ellipsis-vertical"></i>
  </button>
`;

    mobileList.appendChild(newCard);

    memberModal.classList.remove("show");
    addMemberForm.reset();
  });
}

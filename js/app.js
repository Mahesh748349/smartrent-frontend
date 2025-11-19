// API configuration
const API_BASE = "https://smartrent-backend-d5ec.onrender.com/api";
let currentUser = null;

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

// Main initialization function
function initializeApp() {
  checkAuthStatus();
  setupEventListeners();
  loadProperties();
  setupNavigation();
}

// Check if user is already logged in
function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {
    try {
      currentUser = JSON.parse(user);
      updateUIForLoggedInUser();

      // Initialize managers if they exist
      if (typeof propertiesManager !== "undefined") {
        propertiesManager.loadProperties();
      }
      if (typeof paymentsManager !== "undefined") {
        paymentsManager.loadPayments();
      }
      if (typeof tenantsManager !== "undefined") {
        tenantsManager.loadTenants();
      }

      // Redirect to dashboard if already on a dashboard page
      if (window.location.pathname.includes("dashboard")) {
        updateDashboardUI();
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      logout();
    }
  }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
  const authButtons = document.querySelector(".auth-buttons");
  if (currentUser && authButtons) {
    authButtons.innerHTML = `
      <span style="margin-right: 15px; color: var(--primary); font-weight: 600;">
        Welcome, ${currentUser.name}
      </span>
      <button class="btn btn-outline" id="logoutBtn">Logout</button>
      ${
        currentUser.role === "owner"
          ? '<button class="btn btn-primary" onclick="redirectToDashboard()">Dashboard</button>'
          : '<button class="btn btn-primary" onclick="redirectToDashboard()">My Dashboard</button>'
      }
    `;

    document.getElementById("logoutBtn").addEventListener("click", logout);
  }
}

// Update dashboard UI
function updateDashboardUI() {
  const userWelcome =
    document.getElementById("userWelcome") ||
    document.getElementById("tenantWelcome");
  if (userWelcome && currentUser) {
    userWelcome.textContent = `Welcome, ${currentUser.name}`;
  }
}

// Redirect to appropriate dashboard after login
function redirectToDashboard() {
  if (currentUser) {
    if (currentUser.role === "owner") {
      window.location.href = "dashboard/owner-dashboard.html";
    } else {
      window.location.href = "dashboard/tenant-dashboard.html";
    }
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Auth buttons
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => openModal("loginModal"));
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", () => openModal("registerModal"));
  }

  // Hero section buttons
  const getStartedBtn = document.getElementById("getStartedBtn");
  const learnMoreBtn = document.getElementById("learnMoreBtn");

  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", () => {
      document
        .getElementById("properties")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  if (learnMoreBtn) {
    learnMoreBtn.addEventListener("click", () => {
      alert(
        "SmartRent provides complete property management solutions including tenant management, rent collection, maintenance tracking, and financial reporting."
      );
    });
  }

  // Modal close buttons
  document.querySelectorAll(".close").forEach((button) => {
    button.addEventListener("click", function () {
      this.closest(".modal").style.display = "none";
    });
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  });

  // Form submissions
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const contactForm = document.getElementById("contactForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  if (contactForm) {
    contactForm.addEventListener("submit", handleContact);
  }
}

// Setup smooth navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// Modal management functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Load properties from backend
async function loadProperties() {
  try {
    // Use propertiesManager if available, otherwise use direct API call
    if (typeof propertiesManager !== "undefined") {
      await propertiesManager.loadProperties();
    } else {
      const response = await fetch(`${API_BASE}/properties`);
      if (!response.ok) throw new Error("Failed to load properties");

      const data = await response.json();
      if (data.success && data.properties) {
        displayProperties(data.properties);
      } else {
        displayEmptyProperties();
      }
    }
  } catch (error) {
    console.error("Error loading properties:", error);
    displayEmptyProperties();
  }
}

// Display properties in the grid
function displayProperties(properties) {
  const propertiesList = document.getElementById("propertiesList");
  if (!propertiesList) return;

  if (properties.length === 0) {
    displayEmptyProperties();
    return;
  }

  propertiesList.innerHTML = properties
    .map(
      (property) => `
        <div class="property-card">
            <div class="property-image">
                <i class="fas fa-home"></i>
            </div>
            <div class="property-content">
                <h3>${property.name}</h3>
                <div class="property-price">$${property.rent}/month</div>
                <p>${property.address.street}, ${property.address.city}</p>
                <div class="property-features">
                    <span><i class="fas fa-bed"></i> ${
                      property.bedrooms
                    } beds</span>
                    <span><i class="fas fa-bath"></i> ${
                      property.bathrooms
                    } baths</span>
                    <span><i class="fas fa-ruler-combined"></i> ${
                      property.area
                    }</span>
                </div>
                <div class="property-actions">
                    <button class="btn btn-outline" onclick="viewPropertyDetails('${
                      property._id
                    }')">
                        View Details
                    </button>
                    ${
                      !currentUser
                        ? `
                        <button class="btn btn-primary" onclick="openModal('loginModal')">
                            Apply Now
                        </button>
                    `
                        : currentUser.role === "tenant"
                        ? `
                        <button class="btn btn-primary" onclick="applyForProperty('${property._id}')">
                            Apply Now
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Display empty properties state
function displayEmptyProperties() {
  const propertiesList = document.getElementById("propertiesList");
  if (propertiesList) {
    propertiesList.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #666; grid-column: 1 / -1;">
            <i class="fas fa-home fa-3x" style="margin-bottom: 1rem; opacity: 0.5;"></i>
            <h3>No Properties Available</h3>
            <p>Check back later for new listings</p>
        </div>
    `;
  }
}

// Handle user login
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showNotification(data.message, "success");
      closeModal("loginModal");
      updateUIForLoggedInUser();
      loadProperties();

      // Redirect to dashboard after login
      setTimeout(() => {
        redirectToDashboard();
      }, 1000);
    } else {
      showNotification(data.message, "error");
    }
  } catch (error) {
    showNotification("Login failed. Please try again.", "error");
  }
}

// Handle user registration
async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;
  const phone = document.getElementById("regPhone").value;

  // Basic validation
  if (!name || !email || !password || !role) {
    showNotification("Please fill all required fields", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role, phone }),
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showNotification(data.message, "success");
      closeModal("registerModal");
      updateUIForLoggedInUser();
      loadProperties();

      // Clear form
      document.getElementById("registerForm").reset();

      // Redirect to dashboard after registration
      setTimeout(() => {
        redirectToDashboard();
      }, 1000);
    } else {
      showNotification(data.message, "error");
    }
  } catch (error) {
    showNotification("Registration failed. Please try again.", "error");
  }
}

// Handle contact form submission
function handleContact(event) {
  event.preventDefault();
  showNotification(
    "Thank you for your message! We will get back to you soon.",
    "success"
  );
  document.getElementById("contactForm").reset();
}

// Show notification to user
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notif) => notif.remove());

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// User logout
function logout() {
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (window.location.pathname.includes("dashboard")) {
    window.location.href = "../index.html";
  } else {
    location.reload();
  }
}

// Property viewing function
function viewPropertyDetails(propertyId) {
  // Use propertiesManager if available
  if (
    typeof propertiesManager !== "undefined" &&
    propertiesManager.viewProperty
  ) {
    propertiesManager.viewProperty(propertyId);
  } else {
    showNotification("Property details feature would open here", "success");
  }
}

// In app.js - ADD dashboard navigation helper
function navigateToDashboard() {
  if (!currentUser) {
    showNotification("Please login first", "error");
    openModal("loginModal");
    return;
  }

  redirectToDashboard();
}

// UPDATE the existing redirectToDashboard function
function redirectToDashboard() {
  if (currentUser) {
    if (currentUser.role === "owner") {
      // Check if we're already on the owner dashboard
      if (window.location.pathname.includes("owner-dashboard")) {
        return; // Already on the correct page
      }
      window.location.href = "dashboard/owner-dashboard.html";
    } else {
      // Check if we're already on the tenant dashboard
      if (window.location.pathname.includes("tenant-dashboard")) {
        return; // Already on the correct page
      }
      window.location.href = "dashboard/tenant-dashboard.html";
    }
  }
}

// Property application function
function applyForProperty(propertyId) {
  if (!currentUser) {
    openModal("loginModal");
    showNotification("Please login to apply for this property", "info");
    return;
  }

  if (currentUser.role === "tenant") {
    // Use propertiesManager if available
    if (
      typeof propertiesManager !== "undefined" &&
      propertiesManager.applyForProperty
    ) {
      propertiesManager.applyForProperty(propertyId);
    } else {
      showNotification(
        `Application submitted! The owner will contact you soon.`,
        "success"
      );
    }
  }
}

// Load tenant view (for tenant dashboard)
function loadTenantView(view) {
  const content = document.getElementById("tenantContent");

  switch (view) {
    case "overview":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Rental Overview</h3>
          </div>
          <p>Welcome to your tenant dashboard. Here you can manage your payments and maintenance requests.</p>
        </div>
      `;
      break;

    case "payments":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Payment History</h3>
            ${
              typeof paymentsManager !== "undefined"
                ? `
              <button class="btn btn-primary" onclick="paymentsManager.payNowModal()">
                <i class="fas fa-credit-card"></i> Make Payment
              </button>
            `
                : ""
            }
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Due Date</th>
                <th>Month</th>
                <th>Status</th>
                <th>Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tenantPaymentsList">
              <tr>
                <td colspan="8" class="empty-state">
                  <i class="fas fa-money-bill-wave"></i>
                  <h4>No Payments Found</h4>
                  <p>Your payment history will appear here</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      if (typeof paymentsManager !== "undefined") {
        paymentsManager.loadPayments();
      }
      break;

    case "maintenance":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Maintenance Requests</h3>
            <button class="btn btn-primary">New Request</button>
          </div>
          <p>Maintenance feature coming soon...</p>
        </div>
      `;
      break;

    case "profile":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Profile</h3>
          </div>
          <div class="profile-info">
            <p><strong>Name:</strong> ${currentUser?.name || "N/A"}</p>
            <p><strong>Email:</strong> ${currentUser?.email || "N/A"}</p>
            <p><strong>Phone:</strong> ${currentUser?.phone || "N/A"}</p>
            <p><strong>Role:</strong> ${currentUser?.role || "N/A"}</p>
          </div>
        </div>
      `;
      break;
  }
}

// Initialize tenant dashboard
if (window.location.pathname.includes("tenant-dashboard.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    updateDashboardUI();
    loadTenantView("overview");
  });
}

// Make functions globally available
window.openAddPropertyModal = function () {
  if (
    typeof propertiesManager !== "undefined" &&
    propertiesManager.openAddPropertyModal
  ) {
    propertiesManager.openAddPropertyModal();
  } else {
    showNotification("Add property feature would open here", "success");
  }
};

window.applyForProperty = applyForProperty;
window.viewPropertyDetails = viewPropertyDetails;
window.logout = logout;
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;

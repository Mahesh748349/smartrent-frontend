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
      <button class="btn btn-primary" onclick="redirectToDashboard()">
        ${currentUser.role === "owner" ? "Dashboard" : "My Dashboard"}
      </button>
    `;

    // Remove existing event listeners and add new one
    const newLogoutBtn = document.getElementById("logoutBtn");
    if (newLogoutBtn) {
      newLogoutBtn.addEventListener("click", logout);
    }
  }
}

// Redirect to appropriate dashboard
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
      showNotification(
        "SmartRent provides complete property management solutions including tenant management, rent collection, maintenance tracking, and financial reporting.",
        "success"
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
    const response = await fetch(`${API_BASE}/properties`);

    if (!response.ok) {
      throw new Error("Failed to load properties");
    }

    const data = await response.json();

    if (data.success && data.properties) {
      displayProperties(data.properties);
    } else {
      displayEmptyProperties();
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
                      !currentUser || currentUser.role === "tenant"
                        ? `
                        <button class="btn btn-primary" onclick="handleApplyNow('${property._id}')">
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

// Handle Apply Now button click
function handleApplyNow(propertyId) {
  if (!currentUser) {
    openModal("loginModal");
    showNotification("Please login to apply for this property", "info");
    return;
  }

  if (currentUser.role === "tenant") {
    showNotification(
      "Application submitted! The owner will contact you soon.",
      "success"
    );
  }
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

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Logging in...";
  submitBtn.disabled = true;

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

      showNotification("Login successful!", "success");
      closeModal("loginModal");
      updateUIForLoggedInUser();
      loadProperties();

      // Redirect to dashboard
      setTimeout(() => {
        redirectToDashboard();
      }, 1000);
    } else {
      showNotification(data.message || "Login failed", "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showNotification("Login failed. Please try again.", "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
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

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Creating account...";
  submitBtn.disabled = true;

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

      showNotification("Registration successful!", "success");
      closeModal("registerModal");
      updateUIForLoggedInUser();
      loadProperties();

      // Clear form
      document.getElementById("registerForm").reset();

      // Redirect to dashboard
      setTimeout(() => {
        redirectToDashboard();
      }, 1000);
    } else {
      showNotification(data.message || "Registration failed", "error");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showNotification("Registration failed. Please try again.", "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
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
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    z-index: 10000;
    font-weight: 500;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
  `;

  if (type === "success") {
    notification.style.backgroundColor = "#28a745";
  } else if (type === "error") {
    notification.style.backgroundColor = "#dc3545";
  } else {
    notification.style.backgroundColor = "#4361ee";
  }

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
    window.location.reload();
  }
}

// Property viewing function
function viewPropertyDetails(propertyId) {
  showNotification("Property details feature would open here", "success");
}

// Load tenant view (for tenant dashboard)
function loadTenantView(view) {
  const content = document.getElementById("tenantContent");
  if (!content) return;

  switch (view) {
    case "overview":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Rental Overview</h3>
          </div>
          <div class="tenant-overview">
            <div class="overview-card">
              <h4>Current Lease</h4>
              <p>You are currently renting: <strong>Sunset Apartments</strong></p>
              <p>Monthly Rent: <strong>$1200</strong></p>
              <p>Next Payment Due: <strong>15 days</strong></p>
            </div>
            <div class="overview-card">
              <h4>Quick Actions</h4>
              <button class="btn btn-primary" onclick="loadTenantView('payments')">Make Payment</button>
              <button class="btn btn-outline" onclick="loadTenantView('maintenance')">Request Maintenance</button>
            </div>
          </div>
        </div>
      `;
      break;

    case "payments":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Payment History</h3>
            <button class="btn btn-primary" onclick="showNotification('Payment feature would open here', 'success')">
              <i class="fas fa-credit-card"></i> Make Payment
            </button>
          </div>
          <div class="payment-history">
            <div class="payment-card">
              <div class="payment-header">
                <h4>October 2024 Rent</h4>
                <span class="status-badge status-paid">Paid</span>
              </div>
              <p>Amount: $1200</p>
              <p>Paid on: October 1, 2024</p>
            </div>
            <div class="payment-card">
              <div class="payment-header">
                <h4>November 2024 Rent</h4>
                <span class="status-badge status-pending">Due in 15 days</span>
              </div>
              <p>Amount: $1200</p>
              <p>Due: November 1, 2024</p>
            </div>
          </div>
        </div>
      `;
      break;

    case "maintenance":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Maintenance Requests</h3>
            <button class="btn btn-primary" onclick="showNotification('Maintenance request form would open here', 'success')">
              <i class="fas fa-plus"></i> New Request
            </button>
          </div>
          <div class="maintenance-requests">
            <p>No active maintenance requests.</p>
            <button class="btn btn-outline" onclick="showNotification('Maintenance request submitted!', 'success')">
              Submit Sample Request
            </button>
          </div>
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
            <div class="profile-item">
              <strong>Name:</strong> ${currentUser?.name || "N/A"}
            </div>
            <div class="profile-item">
              <strong>Email:</strong> ${currentUser?.email || "N/A"}
            </div>
            <div class="profile-item">
              <strong>Phone:</strong> ${currentUser?.phone || "N/A"}
            </div>
            <div class="profile-item">
              <strong>Role:</strong> ${currentUser?.role || "N/A"}
            </div>
            <div class="profile-actions">
              <button class="btn btn-outline" onclick="showNotification('Profile edit feature would open here', 'success')">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      `;
      break;
  }
}

// Initialize tenant dashboard
if (window.location.pathname.includes("tenant-dashboard.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    const userWelcome = document.getElementById("tenantWelcome");
    if (userWelcome && currentUser) {
      userWelcome.textContent = `Welcome, ${currentUser.name}`;
    }
    loadTenantView("overview");
  });
}

// Global function for dashboard navigation
if (typeof loadDashboardView === "undefined") {
  window.loadDashboardView = function (view) {
    showNotification(`${view} section would load here`, "success");
  };
}

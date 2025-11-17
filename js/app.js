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
    currentUser = JSON.parse(user);
    updateUIForLoggedInUser();

    // Redirect to dashboard if already on a dashboard page
    if (window.location.pathname.includes("dashboard")) {
      updateDashboardUI();
    }
  }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
  const authButtons = document.querySelector(".auth-buttons");
  if (currentUser && authButtons) {
    authButtons.innerHTML = `
            <span style="margin-right: 15px; color: var(--primary);">
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
                      // Show Apply Now for everyone except owners
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
    // Not logged in - open login modal
    openModal("loginModal");
    showNotification("Please login to apply for this property", "info");
    return;
  }

  if (currentUser.role === "tenant") {
    // Tenant is logged in - process application
    applyForProperty(propertyId);
  }
}

// Apply for property - FIXED SCROLL VERSION
function applyForProperty(propertyId) {
  // Find property details
  const propertiesList = document.getElementById("propertiesList");
  if (!propertiesList) return;

  const propertyCards = propertiesList.querySelectorAll(".property-card");
  let propertyName = "";
  let propertyRent = "";
  let propertyAddress = "";

  // Find property data
  propertyCards.forEach((card) => {
    if (card.querySelector('button[onclick*="' + propertyId + '"]')) {
      propertyName = card.querySelector("h3").textContent;
      propertyRent = card.querySelector(".property-price").textContent;
      propertyAddress = card.querySelector("p").textContent;
    }
  });

  if (propertyName) {
    // Show application form modal with fixed scroll
    const modalHTML = `
      <div id="applyModal" class="modal">
        <div class="modal-content scrollable-modal">
          <div class="modal-header">
            <h2>Apply for ${propertyName}</h2>
            <span class="close" onclick="closeModal('applyModal')">&times;</span>
          </div>
          <div class="modal-body">
            <div class="application-form">
              <div class="property-summary">
                <p><strong>Rent:</strong> ${propertyRent}</p>
                <p><strong>Address:</strong> ${propertyAddress}</p>
              </div>
              
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="applicantName" value="${currentUser.name}" readonly>
              </div>
              
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="applicantEmail" value="${currentUser.email}" readonly>
              </div>
              
              <div class="form-group">
                <label>Phone *</label>
                <input type="tel" id="applicantPhone" placeholder="Your phone number" required>
              </div>
              
              <div class="form-group">
                <label>Message to Owner (Optional)</label>
                <textarea id="applicantMessage" rows="3" placeholder="Tell the owner why you're interested..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeModal('applyModal')">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="submitApplication('${propertyId}')">
                Submit Application
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    openModal("applyModal");
  }
}

// Submit application
function submitApplication(propertyId) {
  const phone = document.getElementById("applicantPhone").value;
  const message = document.getElementById("applicantMessage").value;

  if (!phone) {
    showNotification("Please provide your phone number", "error");
    return;
  }

  // Simulate application submission
  showNotification(
    `Application submitted successfully! The owner will contact you soon.`,
    "success"
  );
  closeModal("applyModal");

  // In a real app, you would send this to your backend
  console.log("Rental application submitted:", {
    propertyId,
    applicant: currentUser,
    phone,
    message,
  });
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
  // Find property in the loaded properties
  const propertiesList = document.getElementById("propertiesList");
  if (!propertiesList) return;

  const propertyCards = propertiesList.querySelectorAll(".property-card");
  let propertyData = null;

  // Try to find property data from the current display
  propertyCards.forEach((card) => {
    if (card.querySelector('button[onclick*="' + propertyId + '"]')) {
      const name = card.querySelector("h3").textContent;
      const price = card.querySelector(".property-price").textContent;
      const address = card.querySelector("p").textContent;
      const features = card.querySelectorAll(".property-features span");

      propertyData = {
        _id: propertyId,
        name: name,
        rent: price.replace("$", "").replace("/month", ""),
        address: { street: address.split(",")[0] },
        bedrooms: features[0].textContent.replace(" beds", "").trim(),
        bathrooms: features[1].textContent.replace(" baths", "").trim(),
        area: features[2].textContent,
      };
    }
  });

  if (propertyData) {
    const modalHTML = `
      <div id="propertyDetailsModal" class="modal">
        <div class="modal-content scrollable-modal">
          <div class="modal-header">
            <h2>${propertyData.name}</h2>
            <span class="close" onclick="closeModal('propertyDetailsModal')">&times;</span>
          </div>
          <div class="modal-body">
            <div class="property-details">
              <div class="detail-section">
                <h3>Basic Information</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <strong>Rent:</strong> $${propertyData.rent}/month
                  </div>
                  <div class="detail-item">
                    <strong>Bedrooms:</strong> ${propertyData.bedrooms}
                  </div>
                  <div class="detail-item">
                    <strong>Bathrooms:</strong> ${propertyData.bathrooms}
                  </div>
                  <div class="detail-item">
                    <strong>Area:</strong> ${propertyData.area}
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h3>Address</h3>
                <p>${propertyData.address.street}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <div class="property-actions">
              ${
                !currentUser
                  ? `<button class="btn btn-primary" onclick="openModal('loginModal'); closeModal('propertyDetailsModal');">Login to Apply</button>`
                  : currentUser.role === "tenant"
                  ? `<button class="btn btn-primary" onclick="applyForProperty('${propertyId}'); closeModal('propertyDetailsModal');">Apply Now</button>`
                  : ""
              }
              <button class="btn btn-outline" onclick="closeModal('propertyDetailsModal')">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    openModal("propertyDetailsModal");
  } else {
    showNotification("Property details not available", "error");
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
            <button class="btn btn-primary" onclick="paymentsManager.payNowModal()">
              <i class="fas fa-credit-card"></i> Make Payment
            </button>
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
      paymentsManager.loadPayments();
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
// Reload CSS to fix styling issues
function reloadCSS() {
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    const url = new URL(link.href, window.location.origin);
    url.searchParams.set("v", Date.now());
    link.href = url.toString();
  });
}

// Call this after login/registration
function fixStyling() {
  reloadCSS();
  // Force redraw
  document.body.style.display = "none";
  document.body.offsetHeight; // Trigger reflow
  document.body.style.display = "block";
}

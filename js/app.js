// API configuration - USING YOUR REAL BACKEND
const API_BASE = "https://smartrent-backend-d5ec.onrender.com/api";
let currentUser = null;
let properties = [];

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
      <button class="btn btn-outline" onclick="logout()">Logout</button>
      <button class="btn btn-primary" onclick="redirectToDashboard()">
        ${currentUser.role === "owner" ? "Dashboard" : "My Dashboard"}
      </button>
    `;
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

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
}

// Modal management functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Load properties from backend - REAL API CALL
async function loadProperties() {
  try {
    showNotification("Loading properties...", "info");
    const response = await fetch(`${API_BASE}/properties`);

    if (!response.ok) {
      throw new Error("Failed to load properties");
    }

    const data = await response.json();

    if (data.success && data.properties) {
      properties = data.properties;
      displayProperties(data.properties);
      showNotification(
        `Loaded ${data.properties.length} properties`,
        "success"
      );
    } else {
      displayEmptyProperties();
    }
  } catch (error) {
    console.error("Error loading properties:", error);
    showNotification("Error loading properties", "error");
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
                <p>${property.address.street}, ${property.address.city}, ${
        property.address.state
      }</p>
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
                        ? `<button class="btn btn-primary" onclick="openModal('loginModal')">Login to Apply</button>`
                        : currentUser.role === "tenant"
                        ? `<button class="btn btn-primary" onclick="applyForProperty('${property._id}')">Apply Now</button>`
                        : `<button class="btn btn-outline" onclick="showNotification('This is your property', 'info')">Your Property</button>`
                    }
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Handle Apply Now button click
function applyForProperty(propertyId) {
  if (!currentUser) {
    openModal("loginModal");
    showNotification("Please login to apply for this property", "info");
    return;
  }

  const property = properties.find((p) => p._id === propertyId);
  if (property) {
    showNotification(
      `Application submitted for ${property.name}! Owner will contact you.`,
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

// Handle user login - REAL API CALL
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

      showNotification("Login successful! Redirecting...", "success");
      closeModal("loginModal");
      updateUIForLoggedInUser();
      loadProperties();

      // Redirect to dashboard
      setTimeout(() => {
        redirectToDashboard();
      }, 1500);
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

// Handle user registration - REAL API CALL
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

      showNotification("Registration successful! Redirecting...", "success");
      closeModal("registerModal");
      updateUIForLoggedInUser();
      loadProperties();

      // Clear form
      document.getElementById("registerForm").reset();

      // Redirect to dashboard
      setTimeout(() => {
        redirectToDashboard();
      }, 1500);
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
  const property = properties.find((p) => p._id === propertyId);
  if (property) {
    showNotification(
      `Viewing details for ${property.name} - $${property.rent}/month`,
      "info"
    );
  }
}

// Global function to add property (for owner dashboard)
function openAddPropertyModal() {
  if (!currentUser || currentUser.role !== "owner") {
    showNotification("Only owners can add properties", "error");
    return;
  }

  const modalHTML = `
    <div id="addPropertyModal" class="modal">
      <div class="modal-content scrollable-modal">
        <div class="modal-header">
          <h2>Add New Property</h2>
          <span class="close" onclick="closeModal('addPropertyModal')">&times;</span>
        </div>
        <div class="modal-body">
          <form id="addPropertyForm">
            <div class="form-row">
              <div class="form-group">
                <label for="propertyName">Property Name *</label>
                <input type="text" id="propertyName" required>
              </div>
              <div class="form-group">
                <label for="propertyRent">Monthly Rent ($) *</label>
                <input type="number" id="propertyRent" required min="0">
              </div>
            </div>
            
            <div class="form-group">
              <label for="propertyAddress">Street Address *</label>
              <input type="text" id="propertyAddress" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="propertyCity">City *</label>
                <input type="text" id="propertyCity" required>
              </div>
              <div class="form-group">
                <label for="propertyState">State *</label>
                <input type="text" id="propertyState" required>
              </div>
              <div class="form-group">
                <label for="propertyZip">ZIP Code *</label>
                <input type="text" id="propertyZip" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="propertyBedrooms">Bedrooms *</label>
                <input type="number" id="propertyBedrooms" required min="0">
              </div>
              <div class="form-group">
                <label for="propertyBathrooms">Bathrooms *</label>
                <input type="number" id="propertyBathrooms" required min="0">
              </div>
              <div class="form-group">
                <label for="propertyArea">Area *</label>
                <input type="text" id="propertyArea" required placeholder="e.g., 1000 sq ft">
              </div>
            </div>
            
            <div class="form-group">
              <label for="propertyDescription">Description</label>
              <textarea id="propertyDescription" rows="3" placeholder="Describe the property..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <div class="form-actions">
            <button type="button" class="btn btn-outline" onclick="closeModal('addPropertyModal')">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="addNewProperty()">Add Property</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  openModal("addPropertyModal");
}

// Add new property - REAL API CALL
async function addNewProperty() {
  const name = document.getElementById("propertyName").value;
  const rent = document.getElementById("propertyRent").value;
  const address = document.getElementById("propertyAddress").value;
  const city = document.getElementById("propertyCity").value;
  const state = document.getElementById("propertyState").value;
  const zipCode = document.getElementById("propertyZip").value;
  const bedrooms = document.getElementById("propertyBedrooms").value;
  const bathrooms = document.getElementById("propertyBathrooms").value;
  const area = document.getElementById("propertyArea").value;
  const description = document.getElementById("propertyDescription").value;

  if (
    !name ||
    !rent ||
    !address ||
    !city ||
    !state ||
    !zipCode ||
    !bedrooms ||
    !bathrooms ||
    !area
  ) {
    showNotification("Please fill all required fields", "error");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        rent: Number(rent),
        address: {
          street: address,
          city,
          state,
          zipCode,
        },
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area,
        description,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("Property added successfully!", "success");
      closeModal("addPropertyModal");
      // Reload properties to show the new one
      loadProperties();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error adding property:", error);
    showNotification("Error adding property: " + error.message, "error");
  }
}

// Make functions globally available
window.openAddPropertyModal = openAddPropertyModal;
window.addNewProperty = addNewProperty;
window.logout = logout;

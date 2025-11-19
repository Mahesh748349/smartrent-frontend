// =====================================================
//  DASHBOARD MANAGER (FINAL CLEAN MERGED VERSION)
// =====================================================

class DashboardManager {
  constructor() {
    this.stats = {};
  }

  async loadDashboard() {
    if (!currentUser) return;

    try {
      await this.loadDataFromManagers();

      if (currentUser.role === "owner") {
        await this.loadStats();
      }

      this.displayDashboard();
    } catch (error) {
      console.error("Error loading dashboard:", error);
      showNotification("Error loading dashboard data", "error");
    }
  }

  async loadDataFromManagers() {
    if (propertiesManager?.loadProperties)
      await propertiesManager.loadProperties();
    if (tenantsManager?.loadTenants) await tenantsManager.loadTenants();
    if (paymentsManager?.loadPayments) await paymentsManager.loadPayments();
  }

  async loadStats() {
    try {
      if (paymentsManager?.getPaymentStats) {
        const paymentStats = await paymentsManager.getPaymentStats();
        if (paymentStats) this.stats.paymentStats = paymentStats;
      }
      this.calculateBasicStats();
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  calculateBasicStats() {
    // Properties
    this.stats.totalProperties = propertiesManager?.properties?.length || 0;
    this.stats.availableProperties =
      propertiesManager?.properties?.filter((p) => p.isAvailable).length || 0;

    // Tenants
    this.stats.totalTenants = tenantsManager?.tenants?.length || 0;

    // Revenue
    this.stats.totalRevenue =
      paymentsManager?.payments
        ?.filter((p) => p.status === "paid")
        .reduce((t, p) => t + p.amount, 0) || 0;
  }

  displayDashboard() {
    this.displayStats();
    this.displayRecentActivity();
  }

  displayStats() {
    const statsContainer = document.getElementById("dashboardStats");
    if (!statsContainer) return;

    if (currentUser.role === "owner") {
      statsContainer.innerHTML = `
        <div class="stat-card"><i class="fas fa-home"></i>
          <div class="stat-number">${this.stats.totalProperties}</div>
          <div class="stat-label">Total Properties</div>
        </div>

        <div class="stat-card"><i class="fas fa-users"></i>
          <div class="stat-number">${this.stats.totalTenants}</div>
          <div class="stat-label">Active Tenants</div>
        </div>

        <div class="stat-card"><i class="fas fa-dollar-sign"></i>
          <div class="stat-number">$${this.stats.totalRevenue}</div>
          <div class="stat-label">Total Revenue</div>
        </div>

        <div class="stat-card"><i class="fas fa-chart-line"></i>
          <div class="stat-number">$${
            this.stats.paymentStats?.monthlyRevenue || 0
          }</div>
          <div class="stat-label">This Month</div>
        </div>
      `;
    }
  }

  displayRecentActivity() {
    const container = document.getElementById("recentActivity");
    if (!container) return;

    const recentPayments = paymentsManager?.payments?.slice(0, 5) || [];

    if (recentPayments.length === 0) {
      container.innerHTML = `
        <div class="empty-activity">
          <i class="fas fa-clock"></i><p>No recent activity</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recentPayments
      .map(
        (p) => `
        <div class="activity-item">
          <div class="activity-icon"><i class="fas fa-money-bill-wave"></i></div>

          <div class="activity-content">
            <div class="activity-title">Payment of $${p.amount} ${
          p.status === "paid" ? "received" : "due"
        }</div>
            <div class="activity-meta">From ${
              p.tenant?.user?.name || "Tenant"
            } for ${p.property?.name || "Property"}</div>
            <div class="activity-time">${new Date(
              p.paymentDate
            ).toLocaleDateString()}</div>
          </div>

          <div class="activity-status status-${p.status}">${p.status}</div>
        </div>
      `
      )
      .join("");
  }
}

const dashboardManager = new DashboardManager();

// =====================================================
//   UNIFIED loadDashboardView() — FINAL VERSION
// =====================================================
// In dashboard.js - UPDATE existing loadDashboardView function
function loadDashboardView(view) {
  const content = document.getElementById("dashboardContent");
  if (!content) return;

  switch (view) {
    // ---------------- Overview -----------------
    case "overview":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Dashboard Overview</h3>
          </div>
          <div class="overview-grid">
            <div class="overview-card">
              <h4><i class="fas fa-home"></i> Properties Summary</h4>
              <div class="overview-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Properties:</span>
                  <span class="stat-value" id="totalProperties">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Available:</span>
                  <span class="stat-value" id="availableProperties">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Occupied:</span>
                  <span class="stat-value" id="occupiedProperties">0</span>
                </div>
              </div>
            </div>
            
            <div class="overview-card">
              <h4><i class="fas fa-users"></i> Tenants Summary</h4>
              <div class="overview-stats">
                <div class="stat-item">
                  <span class="stat-label">Active Tenants:</span>
                  <span class="stat-value" id="activeTenants">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Pending Applications:</span>
                  <span class="stat-value" id="pendingApplications">0</span>
                </div>
              </div>
            </div>
            
            <div class="overview-card">
              <h4><i class="fas fa-money-bill-wave"></i> Financial Summary</h4>
              <div class="overview-stats">
                <div class="stat-item">
                  <span class="stat-label">Monthly Revenue:</span>
                  <span class="stat-value" id="monthlyRevenue">$0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Pending Payments:</span>
                  <span class="stat-value" id="pendingPayments">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-section">
          <div class="section-header">
            <h3>Recent Activity</h3>
          </div>
          <div id="recentActivity"></div>
        </div>

        <div class="dashboard-section">
          <div class="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="quick-actions">
            <button class="btn btn-primary" onclick="loadDashboardView('properties'); propertiesManager.openAddPropertyModal()">
              <i class="fas fa-plus"></i> Add Property
            </button>
            <button class="btn btn-outline" onclick="loadDashboardView('tenants')">
              <i class="fas fa-users"></i> Manage Tenants
            </button>
            <button class="btn btn-outline" onclick="loadDashboardView('payments')">
              <i class="fas fa-money-bill"></i> View Payments
            </button>
            <button class="btn btn-outline" onclick="paymentsManager.recordPaymentModal()">
              <i class="fas fa-receipt"></i> Record Payment
            </button>
          </div>
        </div>
      `;
      // Load real data for overview
      this.loadOverviewData();
      dashboardManager.displayRecentActivity();
      break;

    // ---------------- Properties -----------------
    case "properties":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Properties</h3>
            <button class="btn btn-primary" onclick="propertiesManager.openAddPropertyModal()">
              <i class="fas fa-plus"></i> Add Property
            </button>
          </div>
          <div id="propertiesList" class="properties-grid"></div>
        </div>
      `;
      // Load owner's properties from backend
      if (propertiesManager && propertiesManager.loadProperties) {
        propertiesManager.loadProperties();
      }
      break;

    // ---------------- Tenants -----------------
    case "tenants":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Tenants</h3>
          </div>
          <div class="tenants-info">
            <p>Tenants who have applied to or are occupying your properties will appear here.</p>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Property</th>
                <th>Unit</th>
                <th>Rent</th>
                <th>Lease Start</th>
                <th>Lease End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tenantsList"></tbody>
          </table>
        </div>
      `;
      // Load owner's tenants from backend
      if (tenantsManager && tenantsManager.loadTenants) {
        tenantsManager.loadTenants();
      }
      break;

    // ---------------- Payments -----------------
    case "payments":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Payment History</h3>
            <button class="btn btn-primary" onclick="paymentsManager.recordPaymentModal()">
              <i class="fas fa-plus"></i> Record Payment
            </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Due Date</th>
                <th>Month</th>
                <th>Status</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="paymentsList"></tbody>
          </table>
        </div>
      `;
      // Load payments from backend
      if (paymentsManager && paymentsManager.loadPayments) {
        paymentsManager.loadPayments();
      }
      break;

    // ---------------- Maintenance -----------------
    case "maintenance":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Maintenance Requests</h3>
          </div>
          <div id="maintenanceList" class="maintenance-list"></div>
        </div>
      `;
      // Load maintenance requests
      if (
        typeof maintenanceManager !== "undefined" &&
        maintenanceManager.loadMaintenance
      ) {
        maintenanceManager.loadMaintenance();
      }
      break;
  }
}

// Add this new function to load overview data
async function loadOverviewData() {
  try {
    // Load properties count
    if (propertiesManager && propertiesManager.properties) {
      document.getElementById("totalProperties").textContent =
        propertiesManager.properties.length;
      const available = propertiesManager.properties.filter(
        (p) => p.isAvailable
      ).length;
      document.getElementById("availableProperties").textContent = available;
      document.getElementById("occupiedProperties").textContent =
        propertiesManager.properties.length - available;
    }

    // Load tenants count
    if (tenantsManager && tenantsManager.tenants) {
      document.getElementById("activeTenants").textContent =
        tenantsManager.tenants.length;
      // You might want to add pending applications logic
      document.getElementById("pendingApplications").textContent = "0";
    }

    // Load financial data
    if (paymentsManager && paymentsManager.payments) {
      const monthlyRevenue = paymentsManager.payments
        .filter((p) => p.status === "paid")
        .reduce((total, p) => total + p.amount, 0);
      document.getElementById(
        "monthlyRevenue"
      ).textContent = `$${monthlyRevenue}`;

      const pending = paymentsManager.payments.filter(
        (p) => p.status === "pending"
      ).length;
      document.getElementById("pendingPayments").textContent = pending;
    }
  } catch (error) {
    console.error("Error loading overview data:", error);
  }
}

// In dashboard.js - ADD proper tenant dashboard functionality
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
                    <div class="overview-grid">
                        <div class="overview-card">
                            <h4><i class="fas fa-home"></i> My Property</h4>
                            <div class="overview-stats" id="tenantPropertyInfo">
                                <div class="stat-item">
                                    <span class="stat-label">Current Property:</span>
                                    <span class="stat-value">Loading...</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Monthly Rent:</span>
                                    <span class="stat-value">Loading...</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Lease End:</span>
                                    <span class="stat-value">Loading...</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="overview-card">
                            <h4><i class="fas fa-money-bill-wave"></i> Payments</h4>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">This Month:</span>
                                    <span class="stat-value" id="currentMonthPayment">-</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Payment Status:</span>
                                    <span class="stat-value" id="paymentStatus">-</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Next Due:</span>
                                    <span class="stat-value" id="nextDueDate">-</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="overview-card">
                            <h4><i class="fas fa-tools"></i> Maintenance</h4>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Open Requests:</span>
                                    <span class="stat-value" id="openRequests">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">In Progress:</span>
                                    <span class="stat-value" id="inProgressRequests">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div class="quick-actions">
                        <button class="btn btn-primary" onclick="loadTenantView('payments'); setTimeout(() => paymentsManager.payNowModal(), 100)">
                            <i class="fas fa-credit-card"></i> Make Payment
                        </button>
                        <button class="btn btn-outline" onclick="loadTenantView('maintenance'); setTimeout(() => maintenanceManager.openNewRequestModal(), 100)">
                            <i class="fas fa-tools"></i> Request Maintenance
                        </button>
                        <button class="btn btn-outline" onclick="loadTenantView('properties')">
                            <i class="fas fa-search"></i> Browse Properties
                        </button>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div id="tenantRecentActivity">
                        <div class="empty-activity">
                            <i class="fas fa-clock"></i>
                            <p>No recent activity</p>
                        </div>
                    </div>
                </div>
            `;
      loadTenantOverviewData();
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
                                    <h4>Loading Payments...</h4>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
      if (
        typeof paymentsManager !== "undefined" &&
        paymentsManager.loadPayments
      ) {
        paymentsManager.loadPayments();
      }
      break;

    case "maintenance":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Maintenance Requests</h3>
                        <button class="btn btn-primary" onclick="maintenanceManager.openNewRequestModal()">
                            <i class="fas fa-plus"></i> New Request
                        </button>
                    </div>
                    <div id="maintenanceList" class="maintenance-list">
                        <div class="empty-state">
                            <i class="fas fa-tools"></i>
                            <h3>Loading Maintenance Requests...</h3>
                        </div>
                    </div>
                </div>
            `;
      if (
        typeof maintenanceManager !== "undefined" &&
        maintenanceManager.loadMaintenance
      ) {
        maintenanceManager.loadMaintenance();
      }
      break;

    case "properties":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Available Properties</h3>
                    </div>
                    <div id="propertiesList" class="properties-grid">
                        <div class="empty-state">
                            <i class="fas fa-home"></i>
                            <h3>Loading Properties...</h3>
                        </div>
                    </div>
                </div>
            `;
      if (
        typeof propertiesManager !== "undefined" &&
        propertiesManager.loadProperties
      ) {
        propertiesManager.loadProperties();
      }
      break;

    case "profile":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Profile</h3>
                        <button class="btn btn-outline" onclick="editTenantProfile()">
                            <i class="fas fa-edit"></i> Edit Profile
                        </button>
                    </div>
                    <div class="profile-info" id="tenantProfileInfo">
                        <div class="profile-item">
                            <strong>Name:</strong> ${currentUser?.name || "N/A"}
                        </div>
                        <div class="profile-item">
                            <strong>Email:</strong> ${
                              currentUser?.email || "N/A"
                            }
                        </div>
                        <div class="profile-item">
                            <strong>Phone:</strong> ${
                              currentUser?.phone || "N/A"
                            }
                        </div>
                        <div class="profile-item">
                            <strong>Member Since:</strong> ${
                              new Date(
                                currentUser?.createdAt
                              ).toLocaleDateString() || "N/A"
                            }
                        </div>
                    </div>
                </div>
            `;
      break;
    // In dashboard.js - ADD this case to the existing loadTenantView switch statement
    case "documents":
      content.innerHTML = `
        <div class="dashboard-section">
            <div class="section-header">
                <h3>My Documents</h3>
                <button class="btn btn-primary" onclick="documentManager.openUploadModal()">
                    <i class="fas fa-upload"></i> Upload Document
                </button>
            </div>
            <div id="documentsList" class="documents-grid">
                <div class="empty-state">
                    <i class="fas fa-file-upload"></i>
                    <h3>Loading Documents...</h3>
                </div>
            </div>
        </div>
    `;
      if (
        typeof documentManager !== "undefined" &&
        documentManager.loadDocuments
      ) {
        documentManager.loadDocuments();
      }
      break;
  }
}

// NEW: Load tenant overview data
async function loadTenantOverviewData() {
  try {
    // Load tenant's assigned property
    await loadTenantProperty();

    // Load payment status
    await loadTenantPaymentStatus();

    // Load maintenance stats
    await loadTenantMaintenanceStats();
  } catch (error) {
    console.error("Error loading tenant overview:", error);
  }
}

// NEW: Load tenant's assigned property
async function loadTenantProperty() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/tenants/my-lease`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success && data.lease) {
      const propertyInfo = document.getElementById("tenantPropertyInfo");
      if (propertyInfo) {
        propertyInfo.innerHTML = `
                    <div class="stat-item">
                        <span class="stat-label">Current Property:</span>
                        <span class="stat-value">${
                          data.lease.property.name
                        }</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Monthly Rent:</span>
                        <span class="stat-value">$${data.lease.rent}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Lease End:</span>
                        <span class="stat-value">${new Date(
                          data.lease.leaseEnd
                        ).toLocaleDateString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Unit:</span>
                        <span class="stat-value">${
                          data.lease.unit || "N/A"
                        }</span>
                    </div>
                `;
      }
    } else {
      document.getElementById("tenantPropertyInfo").innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Current Property:</span>
                    <span class="stat-value">No active lease</span>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading tenant property:", error);
  }
}

// NEW: Load tenant payment status
async function loadTenantPaymentStatus() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/payments/my-status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("currentMonthPayment").textContent = `$${
        data.currentMonth?.amount || 0
      }`;
      document.getElementById("paymentStatus").textContent =
        data.currentMonth?.status || "No payment due";
      document.getElementById("nextDueDate").textContent = data.nextDueDate
        ? new Date(data.nextDueDate).toLocaleDateString()
        : "N/A";
    }
  } catch (error) {
    console.error("Error loading payment status:", error);
  }
}

// NEW: Load tenant maintenance stats
async function loadTenantMaintenanceStats() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/maintenance/my-stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("openRequests").textContent =
        data.stats?.open || 0;
      document.getElementById("inProgressRequests").textContent =
        data.stats?.inProgress || 0;
    }
  } catch (error) {
    console.error("Error loading maintenance stats:", error);
  }
}

// NEW: Edit tenant profile function
function editTenantProfile() {
  const modalHTML = `
        <div id="editTenantProfileModal" class="modal">
            <div class="modal-content scrollable-modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Edit Profile</h2>
                    <span class="close" onclick="closeModal('editTenantProfileModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editTenantProfileForm">
                        <div class="form-group">
                            <label for="editName">Full Name</label>
                            <input type="text" id="editName" value="${
                              currentUser?.name || ""
                            }" required>
                        </div>
                        <div class="form-group">
                            <label for="editPhone">Phone Number</label>
                            <input type="tel" id="editPhone" value="${
                              currentUser?.phone || ""
                            }">
                        </div>
                        <div class="form-group">
                            <label for="editEmergencyContact">Emergency Contact</label>
                            <input type="text" id="editEmergencyContact" placeholder="Name and phone number">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal('editTenantProfileModal')">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  document
    .getElementById("editTenantProfileForm")
    .addEventListener("submit", handleTenantProfileUpdate);
  openModal("editTenantProfileModal");
}

// NEW: Handle tenant profile update
async function handleTenantProfileUpdate(event) {
  event.preventDefault();

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Updating...";
  submitBtn.disabled = true;

  const profileData = {
    name: document.getElementById("editName").value,
    phone: document.getElementById("editPhone").value,
    emergencyContact: document.getElementById("editEmergencyContact").value,
  };

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("Profile updated successfully!", "success");
      // Update current user data
      currentUser = data.user;
      localStorage.setItem("user", JSON.stringify(data.user));
      closeModal("editTenantProfileModal");
      loadTenantView("profile"); // Reload profile view
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showNotification("Error updating profile: " + error.message, "error");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// =====================================================
//   Load Payment Stats
// =====================================================

async function loadPaymentStats() {
  const statsContainer = document.getElementById("paymentStats");
  if (!statsContainer) return;

  let stats = await paymentsManager?.getPaymentStats?.();

  statsContainer.innerHTML = `
    <div class="stat-card"><i class="fas fa-calendar"></i>
      <div class="stat-number">$${stats?.monthlyRevenue || 0}</div>
      <div class="stat-label">This Month</div>
    </div>

    <div class="stat-card"><i class="fas fa-chart-bar"></i>
      <div class="stat-number">$${stats?.yearlyRevenue || 0}</div>
      <div class="stat-label">This Year</div>
    </div>

    <div class="stat-card"><i class="fas fa-credit-card"></i>
      <div class="stat-number">${stats?.paymentMethods?.length || 0}</div>
      <div class="stat-label">Payment Methods</div>
    </div>

    <div class="stat-card"><i class="fas fa-percentage"></i>
      <div class="stat-number">95%</div>
      <div class="stat-label">Collection Rate</div>
    </div>
  `;
}

// =====================================================
//   PAGE INITIALIZATION
// =====================================================
// In dashboard.js - ADD proper initialization
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on a dashboard page
  const isOwnerDashboard = window.location.pathname.includes("owner-dashboard");
  const isTenantDashboard =
    window.location.pathname.includes("tenant-dashboard");

  if (isOwnerDashboard || isTenantDashboard) {
    // Update welcome message
    const userWelcome =
      document.getElementById("userWelcome") ||
      document.getElementById("tenantWelcome");
    if (userWelcome && currentUser) {
      userWelcome.textContent = `Welcome, ${currentUser.name}`;
    }

    // Load appropriate dashboard view
    if (isOwnerDashboard) {
      loadDashboardView("overview");
      if (typeof dashboardManager !== "undefined") {
        dashboardManager.loadDashboard();
      }
    } else if (isTenantDashboard) {
      loadTenantView("overview");
    }
  }
});

// UPDATE loadDashboardView to handle missing elements gracefully
function loadDashboardView(view) {
  const content = document.getElementById("dashboardContent");
  if (!content) {
    console.error("Dashboard content element not found");
    return;
  }

  // Your existing switch case code here...
  switch (view) {
    case "overview":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Dashboard Overview</h3>
                    </div>
                    <div class="overview-grid">
                        <div class="overview-card">
                            <h4><i class="fas fa-home"></i> Properties Summary</h4>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Total Properties:</span>
                                    <span class="stat-value" id="totalProperties">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Available:</span>
                                    <span class="stat-value" id="availableProperties">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Occupied:</span>
                                    <span class="stat-value" id="occupiedProperties">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="overview-card">
                            <h4><i class="fas fa-users"></i> Tenants Summary</h4>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Active Tenants:</span>
                                    <span class="stat-value" id="activeTenants">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="overview-card">
                            <h4><i class="fas fa-money-bill-wave"></i> Financial Summary</h4>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Monthly Revenue:</span>
                                    <span class="stat-value" id="monthlyRevenue">$0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Pending Payments:</span>
                                    <span class="stat-value" id="pendingPayments">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div id="recentActivity">
                        <div class="empty-activity">
                            <i class="fas fa-clock"></i>
                            <p>No recent activity</p>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div class="quick-actions">
                        <button class="btn btn-primary" onclick="loadDashboardView('properties'); setTimeout(() => propertiesManager.openAddPropertyModal(), 100)">
                            <i class="fas fa-plus"></i> Add Property
                        </button>
                        <button class="btn btn-outline" onclick="loadDashboardView('tenants')">
                            <i class="fas fa-users"></i> Manage Tenants
                        </button>
                        <button class="btn btn-outline" onclick="loadDashboardView('payments')">
                            <i class="fas fa-money-bill"></i> View Payments
                        </button>
                        <button class="btn btn-outline" onclick="paymentsManager.recordPaymentModal()">
                            <i class="fas fa-receipt"></i> Record Payment
                        </button>
                    </div>
                </div>
            `;
      break;

    case "properties":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Properties</h3>
                        <button class="btn btn-primary" onclick="propertiesManager.openAddPropertyModal()">
                            <i class="fas fa-plus"></i> Add Property
                        </button>
                    </div>
                    <div id="propertiesList" class="properties-grid">
                        <div class="empty-state">
                            <i class="fas fa-home"></i>
                            <h3>Loading Properties...</h3>
                        </div>
                    </div>
                </div>
            `;
      // Load properties
      if (
        typeof propertiesManager !== "undefined" &&
        propertiesManager.loadProperties
      ) {
        propertiesManager.loadProperties();
      }
      break;

    case "tenants":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Tenants</h3>
                    </div>
                    <div class="tenants-info">
                        <p>Tenants who have applied to or are occupying your properties will appear here.</p>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Property</th>
                                <th>Unit</th>
                                <th>Rent</th>
                                <th>Lease Start</th>
                                <th>Lease End</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="tenantsList">
                            <tr>
                                <td colspan="10" class="empty-state">
                                    <i class="fas fa-users"></i>
                                    <h4>Loading Tenants...</h4>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
      // Load tenants
      if (typeof tenantsManager !== "undefined" && tenantsManager.loadTenants) {
        tenantsManager.loadTenants();
      }
      break;

    case "payments":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Payment History</h3>
                        <button class="btn btn-primary" onclick="paymentsManager.recordPaymentModal()">
                            <i class="fas fa-plus"></i> Record Payment
                        </button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tenant</th>
                                <th>Property</th>
                                <th>Amount</th>
                                <th>Payment Date</th>
                                <th>Due Date</th>
                                <th>Month</th>
                                <th>Status</th>
                                <th>Method</th>
                                <th>Reference</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="paymentsList">
                            <tr>
                                <td colspan="10" class="empty-state">
                                    <i class="fas fa-money-bill-wave"></i>
                                    <h4>Loading Payments...</h4>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
      // Load payments
      if (
        typeof paymentsManager !== "undefined" &&
        paymentsManager.loadPayments
      ) {
        paymentsManager.loadPayments();
      }
      break;

    case "maintenance":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Maintenance Requests</h3>
                    </div>
                    <div id="maintenanceList" class="maintenance-list">
                        <div class="empty-state">
                            <i class="fas fa-tools"></i>
                            <h3>Loading Maintenance Requests...</h3>
                        </div>
                    </div>
                </div>
            `;
      // Load maintenance
      if (
        typeof maintenanceManager !== "undefined" &&
        maintenanceManager.loadMaintenance
      ) {
        maintenanceManager.loadMaintenance();
      }
      break;

    // In dashboard.js - ADD this case to loadDashboardView
    case "applications":
      content.innerHTML = `
        <div class="dashboard-section">
            <div class="section-header">
                <h3>Tenant Applications</h3>
            </div>
            <div id="applicationsList" class="applications-grid">
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3>Loading Applications...</h3>
                </div>
            </div>
        </div>
    `;
      if (
        typeof applicationsManager !== "undefined" &&
        applicationsManager.loadApplications
      ) {
        applicationsManager.loadApplications();
      }
      break;
  }
}
// ADD this at the end of dashboard.js file (after all existing code)
class DocumentManager {
  constructor() {
    this.documents = [];
  }

  async loadDocuments() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.documents = data.documents || [];
        this.displayDocuments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      this.documents = [];
      this.displayDocuments();
    }
  }

  // ... include all other DocumentManager methods from previous code ...
}

const documentManager = new DocumentManager();

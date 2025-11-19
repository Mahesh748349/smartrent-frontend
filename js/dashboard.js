// dashboard.js - COMPLETE FIXED VERSION WITH ALL FEATURES
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
    // Load properties if manager exists
    if (
      typeof propertiesManager !== "undefined" &&
      propertiesManager.loadProperties
    ) {
      await propertiesManager.loadProperties();
    }

    // Load tenants if manager exists
    if (typeof tenantsManager !== "undefined" && tenantsManager.loadTenants) {
      await tenantsManager.loadTenants();
    }

    // Load payments if manager exists
    if (
      typeof paymentsManager !== "undefined" &&
      paymentsManager.loadPayments
    ) {
      await paymentsManager.loadPayments();
    }

    // Load applications if manager exists
    if (
      typeof applicationsManager !== "undefined" &&
      applicationsManager.loadApplications
    ) {
      await applicationsManager.loadApplications();
    }
  }

  async loadStats() {
    try {
      // Try to get payment stats from backend
      if (paymentsManager && paymentsManager.getPaymentStats) {
        const paymentStats = await paymentsManager.getPaymentStats();
        if (paymentStats) this.stats.paymentStats = paymentStats;
      }

      // Calculate basic stats
      this.calculateBasicStats();
    } catch (error) {
      console.error("Error loading stats:", error);
      this.calculateBasicStats(); // Fallback to basic stats
    }
  }

  calculateBasicStats() {
    // Properties stats
    if (propertiesManager && propertiesManager.properties) {
      this.stats.totalProperties = propertiesManager.properties.length;
      this.stats.availableProperties = propertiesManager.properties.filter(
        (p) => p.isAvailable
      ).length;
    } else {
      this.stats.totalProperties = 0;
      this.stats.availableProperties = 0;
    }

    // Tenants stats
    if (tenantsManager && tenantsManager.tenants) {
      this.stats.totalTenants = tenantsManager.tenants.length;
    } else {
      this.stats.totalTenants = 0;
    }

    // Revenue stats
    if (paymentsManager && paymentsManager.payments) {
      this.stats.totalRevenue = paymentsManager.payments
        .filter((p) => p.status === "paid")
        .reduce((total, p) => total + p.amount, 0);

      this.stats.monthlyRevenue = this.stats.paymentStats?.monthlyRevenue || 0;
    } else {
      this.stats.totalRevenue = 0;
      this.stats.monthlyRevenue = 0;
    }

    // Applications stats (for owner)
    if (applicationsManager && applicationsManager.applications) {
      this.stats.pendingApplications = applicationsManager.applications.filter(
        (app) => app.status === "pending"
      ).length;
    } else {
      this.stats.pendingApplications = 0;
    }
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
                <div class="stat-card">
                    <i class="fas fa-home"></i>
                    <div class="stat-number">${this.stats.totalProperties}</div>
                    <div class="stat-label">Total Properties</div>
                </div>

                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <div class="stat-number">${this.stats.totalTenants}</div>
                    <div class="stat-label">Active Tenants</div>
                </div>

                <div class="stat-card">
                    <i class="fas fa-dollar-sign"></i>
                    <div class="stat-number">$${this.stats.totalRevenue}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>

                <div class="stat-card">
                    <i class="fas fa-chart-line"></i>
                    <div class="stat-number">$${this.stats.monthlyRevenue}</div>
                    <div class="stat-label">This Month</div>
                </div>
            `;
    }
  }

  displayRecentActivity() {
    const container = document.getElementById("recentActivity");
    if (!container) return;

    // Show empty state if no payments
    if (
      !paymentsManager ||
      !paymentsManager.payments ||
      paymentsManager.payments.length === 0
    ) {
      container.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-clock"></i>
                    <p>No recent activity</p>
                </div>
            `;
      return;
    }

    const recentPayments = paymentsManager.payments.slice(0, 5);
    container.innerHTML = recentPayments
      .map(
        (p) => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
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
                    <div class="activity-status status-${p.status}">${
          p.status
        }</div>
                </div>
            `
      )
      .join("");
  }
}

const dashboardManager = new DashboardManager();

// FIXED: loadDashboardView function WITH APPLICATIONS
function loadDashboardView(view) {
  const content = document.getElementById("dashboardContent");
  if (!content) {
    console.error("Dashboard content element not found");
    return;
  }

  switch (view) {
    case "overview":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Dashboard Overview</h3>
                    </div>
                    <div id="dashboardStats" class="dashboard-stats">
                        <!-- Stats will be loaded here -->
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
                        <button class="btn btn-primary" onclick="loadDashboardView('properties'); setTimeout(() => { if(propertiesManager) propertiesManager.openAddPropertyModal(); }, 100)">
                            <i class="fas fa-plus"></i> Add Property
                        </button>
                        <button class="btn btn-outline" onclick="loadDashboardView('applications')">
                            <i class="fas fa-file-alt"></i> View Applications
                        </button>
                        <button class="btn btn-outline" onclick="loadDashboardView('tenants')">
                            <i class="fas fa-users"></i> Manage Tenants
                        </button>
                        <button class="btn btn-outline" onclick="loadDashboardView('payments')">
                            <i class="fas fa-money-bill"></i> View Payments
                        </button>
                        <button class="btn btn-outline" onclick="if(paymentsManager) paymentsManager.recordPaymentModal()">
                            <i class="fas fa-receipt"></i> Record Payment
                        </button>
                    </div>
                </div>
            `;
      // Load stats and activity
      setTimeout(() => {
        if (dashboardManager) {
          dashboardManager.loadDashboard();
        }
      }, 100);
      break;

    case "properties":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Properties</h3>
                        <button class="btn btn-primary" onclick="if(propertiesManager) propertiesManager.openAddPropertyModal()">
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
      setTimeout(() => {
        if (propertiesManager && propertiesManager.loadProperties) {
          propertiesManager.loadProperties();
        }
      }, 100);
      break;

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
      // Load applications
      setTimeout(() => {
        if (
          typeof applicationsManager !== "undefined" &&
          applicationsManager.loadApplications
        ) {
          applicationsManager.loadApplications();
        }
      }, 100);
      break;

    case "tenants":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Tenants</h3>
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
      setTimeout(() => {
        if (tenantsManager && tenantsManager.loadTenants) {
          tenantsManager.loadTenants();
        }
      }, 100);
      break;

    case "payments":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Payment History</h3>
                        <button class="btn btn-primary" onclick="if(paymentsManager) paymentsManager.recordPaymentModal()">
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

                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>Payment Statistics</h3>
                    </div>
                    <div id="paymentStats" class="dashboard-stats">
                        <div class="stat-card">
                            <i class="fas fa-calendar"></i>
                            <div class="stat-number">$0</div>
                            <div class="stat-label">This Month</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-chart-bar"></i>
                            <div class="stat-number">$0</div>
                            <div class="stat-label">This Year</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-credit-card"></i>
                            <div class="stat-number">0</div>
                            <div class="stat-label">Payment Methods</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-percentage"></i>
                            <div class="stat-number">0%</div>
                            <div class="stat-label">Collection Rate</div>
                        </div>
                    </div>
                </div>
            `;
      // Load payments and stats
      setTimeout(() => {
        if (paymentsManager && paymentsManager.loadPayments) {
          paymentsManager.loadPayments();
        }
        loadPaymentStats();
      }, 100);
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
      setTimeout(() => {
        if (
          typeof maintenanceManager !== "undefined" &&
          maintenanceManager.loadMaintenance
        ) {
          maintenanceManager.loadMaintenance();
        }
      }, 100);
      break;
  }
}

// FIXED: Tenant dashboard view WITH ALL FEATURES
function loadTenantView(view) {
  const content = document.getElementById("tenantContent");
  if (!content) {
    console.error("Tenant content element not found");
    return;
  }

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
                        <button class="btn btn-primary" onclick="loadTenantView('payments'); setTimeout(() => { if(paymentsManager) paymentsManager.payNowModal(); }, 100)">
                            <i class="fas fa-credit-card"></i> Make Payment
                        </button>
                        <button class="btn btn-outline" onclick="loadTenantView('maintenance'); setTimeout(() => { if(maintenanceManager) maintenanceManager.openNewRequestModal(); }, 100)">
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
      // Load tenant overview data
      setTimeout(() => {
        loadTenantOverviewData();
      }, 100);
      break;

    case "payments":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Payment History</h3>
                        <button class="btn btn-primary" onclick="if(paymentsManager) paymentsManager.payNowModal()">
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
      // Load payments
      setTimeout(() => {
        if (paymentsManager && paymentsManager.loadPayments) {
          paymentsManager.loadPayments();
        }
      }, 100);
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
      // Load properties
      setTimeout(() => {
        if (propertiesManager && propertiesManager.loadProperties) {
          propertiesManager.loadProperties();
        }
      }, 100);
      break;

    case "maintenance":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Maintenance Requests</h3>
                        <button class="btn btn-primary" onclick="if(maintenanceManager) maintenanceManager.openNewRequestModal()">
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
      // Load maintenance
      setTimeout(() => {
        if (
          typeof maintenanceManager !== "undefined" &&
          maintenanceManager.loadMaintenance
        ) {
          maintenanceManager.loadMaintenance();
        }
      }, 100);
      break;

    case "documents":
      content.innerHTML = `
                <div class="dashboard-section">
                    <div class="section-header">
                        <h3>My Documents</h3>
                        <button class="btn btn-primary" onclick="if(documentManager) documentManager.openUploadModal()">
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
      // Load documents
      setTimeout(() => {
        if (
          typeof documentManager !== "undefined" &&
          documentManager.loadDocuments
        ) {
          documentManager.loadDocuments();
        }
      }, 100);
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
                <div class="stat-item">
                    <span class="stat-label">Browse Properties:</span>
                    <span class="stat-value"><a href="#" onclick="loadTenantView('properties')" style="color: var(--primary);">Click here</a></span>
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

// Load Payment Stats
async function loadPaymentStats() {
  const statsContainer = document.getElementById("paymentStats");
  if (!statsContainer) return;

  let stats = await paymentsManager?.getPaymentStats?.();

  statsContainer.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-calendar"></i>
            <div class="stat-number">$${stats?.monthlyRevenue || 0}</div>
            <div class="stat-label">This Month</div>
        </div>

        <div class="stat-card">
            <i class="fas fa-chart-bar"></i>
            <div class="stat-number">$${stats?.yearlyRevenue || 0}</div>
            <div class="stat-label">This Year</div>
        </div>

        <div class="stat-card">
            <i class="fas fa-credit-card"></i>
            <div class="stat-number">${stats?.paymentMethods?.length || 0}</div>
            <div class="stat-label">Payment Methods</div>
        </div>

        <div class="stat-card">
            <i class="fas fa-percentage"></i>
            <div class="stat-number">95%</div>
            <div class="stat-label">Collection Rate</div>
        </div>
    `;
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on a dashboard page
  const isOwnerDashboard = window.location.pathname.includes("owner-dashboard");
  const isTenantDashboard =
    window.location.pathname.includes("tenant-dashboard");

  if (isOwnerDashboard) {
    // Load owner dashboard overview by default
    loadDashboardView("overview");
  } else if (isTenantDashboard) {
    // Load tenant dashboard overview by default
    loadTenantView("overview");
  }
});

// Make functions globally available
window.loadDashboardView = loadDashboardView;
window.loadTenantView = loadTenantView;
window.dashboardManager = dashboardManager;
window.loadTenantOverviewData = loadTenantOverviewData;
window.editTenantProfile = editTenantProfile;
window.handleTenantProfileUpdate = handleTenantProfileUpdate;

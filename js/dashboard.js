// Dashboard functionality
class DashboardManager {
  constructor() {
    this.stats = {};
  }

  // Load dashboard data
  async loadDashboard() {
    if (!currentUser) return;

    try {
      // Load properties
      await propertiesManager.loadProperties();

      // Load tenants (for owners)
      if (currentUser.role === "owner") {
        await tenantsManager.loadTenants();
      }

      // Load payments
      await paymentsManager.loadPayments();

      // Load stats for owners
      if (currentUser.role === "owner") {
        await this.loadStats();
      }

      this.displayDashboard();
    } catch (error) {
      console.error("Error loading dashboard:", error);
      showNotification("Error loading dashboard data", "error");
    }
  }

  // Load statistics (owner only)
  async loadStats() {
    try {
      const token = localStorage.getItem("token");

      // Get payment stats
      const paymentStats = await paymentsManager.getPaymentStats();
      if (paymentStats) {
        this.stats.paymentStats = paymentStats;
      }

      // Calculate basic stats
      this.stats.totalProperties = propertiesManager.properties.length;
      this.stats.totalTenants = tenantsManager.tenants.length;
      this.stats.availableProperties = propertiesManager.properties.filter(
        (p) => p.isAvailable
      ).length;
      this.stats.totalRevenue = this.calculateTotalRevenue();
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  // Calculate total revenue from payments
  calculateTotalRevenue() {
    return paymentsManager.payments
      .filter((p) => p.status === "paid")
      .reduce((total, payment) => total + payment.amount, 0);
  }

  // Display dashboard
  displayDashboard() {
    this.displayStats();
    this.displayRecentActivity();
  }

  // Display statistics cards
  displayStats() {
    const statsContainer = document.getElementById("dashboardStats");
    if (!statsContainer) return;

    if (currentUser.role === "owner") {
      statsContainer.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-home"></i>
                    <div class="stat-number">${
                      this.stats.totalProperties || 0
                    }</div>
                    <div class="stat-label">Total Properties</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <div class="stat-number">${
                      this.stats.totalTenants || 0
                    }</div>
                    <div class="stat-label">Active Tenants</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-dollar-sign"></i>
                    <div class="stat-number">$${
                      this.stats.totalRevenue || 0
                    }</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-line"></i>
                    <div class="stat-number">$${
                      this.stats.paymentStats?.monthlyRevenue || 0
                    }</div>
                    <div class="stat-label">This Month</div>
                </div>
            `;
    } else {
      // Tenant dashboard stats
      const tenant = tenantsManager.tenants[0];
      if (tenant) {
        statsContainer.innerHTML = `
                    <div class="stat-card">
                        <i class="fas fa-home"></i>
                        <div class="stat-number">1</div>
                        <div class="stat-label">My Property</div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-dollar-sign"></i>
                        <div class="stat-number">$${tenant.rent}</div>
                        <div class="stat-label">Monthly Rent</div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-calendar"></i>
                        <div class="stat-number">${this.getDaysUntilDue()}</div>
                        <div class="stat-label">Days Until Due</div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-check-circle"></i>
                        <div class="stat-number">${this.getPaymentStatus()}</div>
                        <div class="stat-label">Payment Status</div>
                    </div>
                `;
      }
    }
  }

  // Get days until next payment due (for tenants)
  getDaysUntilDue() {
    return 15;
  }

  // Get payment status (for tenants)
  getPaymentStatus() {
    return "Current";
  }

  // Display recent activity
  displayRecentActivity() {
    const activityContainer = document.getElementById("recentActivity");
    if (!activityContainer) return;

    // Show recent payments
    const recentPayments = paymentsManager.payments.slice(0, 5);

    if (recentPayments.length === 0) {
      activityContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clock"></i>
          <h4>No Recent Activity</h4>
          <p>Your recent activity will appear here</p>
        </div>
      `;
      return;
    }

    activityContainer.innerHTML = recentPayments
      .map(
        (payment) => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        Payment of $${payment.amount} ${
          payment.status === "paid" ? "received" : "due"
        }
                    </div>
                    <div class="activity-meta">
                        From ${payment.tenant?.user?.name || "Tenant"} for ${
          payment.property?.name || "Property"
        }
                    </div>
                    <div class="activity-time">
                        ${this.formatTimeAgo(payment.paymentDate)}
                    </div>
                </div>
                <div class="activity-status status-${payment.status}">
                    ${payment.status}
                </div>
            </div>
        `
      )
      .join("");
  }

  // Format time ago
  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}

// Dashboard navigation functions
function loadDashboardView(view) {
  const content = document.getElementById("dashboardContent");

  if (!content) return;

  switch (view) {
    case "overview":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Recent Activity</h3>
          </div>
          <div id="recentActivity">
            <!-- Recent activity will be loaded here -->
          </div>
        </div>
        
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="quick-actions">
            <button class="btn btn-primary" onclick="propertiesManager.openAddPropertyModal()">
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
      dashboardManager.displayRecentActivity();
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
            <!-- Properties will be loaded here -->
          </div>
        </div>
      `;
      propertiesManager.displayProperties();
      break;

    case "tenants":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Tenants</h3>
            <button class="btn btn-primary" onclick="tenantsManager.addTenantModal()">
              <i class="fas fa-plus"></i> Add Tenant
            </button>
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
              <!-- Tenants will be loaded here -->
            </tbody>
          </table>
        </div>
      `;
      tenantsManager.displayTenants();
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
              <!-- Payments will be loaded here -->
            </tbody>
          </table>
        </div>
        
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Payment Statistics</h3>
          </div>
          <div id="paymentStats" class="dashboard-stats">
            <!-- Payment stats will be loaded here -->
          </div>
        </div>
      `;
      paymentsManager.loadPayments();
      loadPaymentStats();
      break;

    case "maintenance":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Maintenance Requests</h3>
            <button class="btn btn-primary">
              <i class="fas fa-plus"></i> New Request
            </button>
          </div>
          <div class="empty-state">
            <i class="fas fa-tools"></i>
            <h4>Maintenance Management</h4>
            <p>Track and manage maintenance requests for your properties</p>
            <button class="btn btn-primary">
              <i class="fas fa-plus"></i> Create First Request
            </button>
          </div>
        </div>
      `;
      break;
  }
}

// Load payment statistics
async function loadPaymentStats() {
  const statsContainer = document.getElementById("paymentStats");
  if (!statsContainer) return;

  try {
    const stats = await paymentsManager.getPaymentStats();

    if (stats) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <i class="fas fa-calendar"></i>
          <div class="stat-number">$${stats.monthlyRevenue || 0}</div>
          <div class="stat-label">This Month</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-chart-bar"></i>
          <div class="stat-number">$${stats.yearlyRevenue || 0}</div>
          <div class="stat-label">This Year</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-credit-card"></i>
          <div class="stat-number">${stats.paymentMethods?.length || 0}</div>
          <div class="stat-label">Payment Methods</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-percentage"></i>
          <div class="stat-number">${calculateCollectionRate(stats)}%</div>
          <div class="stat-label">Collection Rate</div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading payment stats:", error);
  }
}

// Calculate collection rate
function calculateCollectionRate(stats) {
  if (!stats.monthlyRevenue) return 0;
  // Simple calculation - in real app, this would be based on expected vs actual
  return 95; // Demo value
}

// Add tenant modal function to tenants manager
tenantsManager.addTenantModal = function () {
  const modalHTML = `
    <div id="addTenantModal" class="modal">
      <div class="modal-content modal-form">
        <span class="close" onclick="closeModal('addTenantModal')">&times;</span>
        <h2>Add New Tenant</h2>
        <form id="addTenantForm">
          <div class="form-group">
            <label for="tenantName">Tenant Name *</label>
            <input type="text" id="tenantName" required>
          </div>
          <div class="form-group">
            <label for="tenantEmail">Email *</label>
            <input type="email" id="tenantEmail" required>
          </div>
          <div class="form-group">
            <label for="tenantPhone">Phone</label>
            <input type="tel" id="tenantPhone">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="tenantProperty">Property *</label>
              <select id="tenantProperty" required>
                <option value="">Select Property</option>
                ${propertiesManager.properties
                  .map((p) => `<option value="${p._id}">${p.name}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="form-group">
              <label for="tenantUnit">Unit/Room *</label>
              <input type="text" id="tenantUnit" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="tenantRent">Monthly Rent ($) *</label>
              <input type="number" id="tenantRent" required min="0">
            </div>
            <div class="form-group">
              <label for="tenantDeposit">Security Deposit ($)</label>
              <input type="number" id="tenantDeposit" min="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="leaseStart">Lease Start *</label>
              <input type="date" id="leaseStart" required>
            </div>
            <div class="form-group">
              <label for="leaseEnd">Lease End *</label>
              <input type="date" id="leaseEnd" required>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" onclick="closeModal('addTenantModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Tenant</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Set default dates
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  document.getElementById("leaseStart").value = today
    .toISOString()
    .split("T")[0];
  document.getElementById("leaseEnd").value = oneYearLater
    .toISOString()
    .split("T")[0];

  document.getElementById("addTenantForm").addEventListener("submit", (e) => {
    e.preventDefault();
    showNotification("Tenant added successfully!", "success");
    closeModal("addTenantModal");
  });

  openModal("addTenantModal");
};

// Initialize dashboard manager
const dashboardManager = new DashboardManager();

// Initialize owner dashboard
if (window.location.pathname.includes("owner-dashboard.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    updateDashboardUI();
    loadDashboardView("overview");
    dashboardManager.loadDashboard();
  });
}

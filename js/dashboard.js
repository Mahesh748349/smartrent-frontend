// Dashboard functionality - INTEGRATION WITH ALL MANAGERS
class DashboardManager {
  constructor() {
    this.stats = {};
  }

  // Load dashboard data from all managers
  async loadDashboard() {
    if (!currentUser) return;

    try {
      // Load data from all available managers
      await this.loadDataFromManagers();

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

  // Load data from all managers
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
  }

  // Load statistics (owner only)
  async loadStats() {
    try {
      // Get payment stats if payments manager exists
      if (
        typeof paymentsManager !== "undefined" &&
        paymentsManager.getPaymentStats
      ) {
        const paymentStats = await paymentsManager.getPaymentStats();
        if (paymentStats) {
          this.stats.paymentStats = paymentStats;
        }
      }

      // Calculate basic stats from available data
      this.calculateBasicStats();
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  // Calculate basic stats from available managers
  calculateBasicStats() {
    // Properties count
    if (
      typeof propertiesManager !== "undefined" &&
      propertiesManager.properties
    ) {
      this.stats.totalProperties = propertiesManager.properties.length;
      this.stats.availableProperties = propertiesManager.properties.filter(
        (p) => p.isAvailable
      ).length;
    } else {
      this.stats.totalProperties = 0;
      this.stats.availableProperties = 0;
    }

    // Tenants count
    if (typeof tenantsManager !== "undefined" && tenantsManager.tenants) {
      this.stats.totalTenants = tenantsManager.tenants.length;
    } else {
      this.stats.totalTenants = 0;
    }

    // Revenue calculation
    if (typeof paymentsManager !== "undefined" && paymentsManager.payments) {
      this.stats.totalRevenue = paymentsManager.payments
        .filter((p) => p.status === "paid")
        .reduce((total, payment) => total + payment.amount, 0);
    } else {
      this.stats.totalRevenue = 0;
    }
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
          <div class="stat-number">${this.stats.totalProperties || 0}</div>
          <div class="stat-label">Total Properties</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-users"></i>
          <div class="stat-number">${this.stats.totalTenants || 0}</div>
          <div class="stat-label">Active Tenants</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-dollar-sign"></i>
          <div class="stat-number">$${this.stats.totalRevenue || 0}</div>
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
      const tenant = tenantsManager?.tenants?.[0] || {};
      statsContainer.innerHTML = `
        <div class="stat-card">
          <i class="fas fa-home"></i>
          <div class="stat-number">${tenant ? 1 : 0}</div>
          <div class="stat-label">My Property</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-dollar-sign"></i>
          <div class="stat-number">$${tenant.rent || 0}</div>
          <div class="stat-label">Monthly Rent</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-calendar"></i>
          <div class="stat-number">15</div>
          <div class="stat-label">Days Until Due</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-check-circle"></i>
          <div class="stat-number">Current</div>
          <div class="stat-label">Payment Status</div>
        </div>
      `;
    }
  }

  // Display recent activity
  displayRecentActivity() {
    const activityContainer = document.getElementById("recentActivity");
    if (!activityContainer) return;

    // Get recent payments from payments manager
    const recentPayments = paymentsManager?.payments?.slice(0, 5) || [];

    if (recentPayments.length === 0) {
      activityContainer.innerHTML = `
        <div class="empty-activity">
          <i class="fas fa-clock"></i>
          <p>No recent activity</p>
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
                ${new Date(payment.paymentDate).toLocaleDateString()}
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
}

// Dashboard navigation functions - INTEGRATED WITH ALL MANAGERS
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
            ${
              typeof propertiesManager !== "undefined"
                ? `
              <button class="btn btn-primary" onclick="propertiesManager.openAddPropertyModal()">
                <i class="fas fa-plus"></i> Add Property
              </button>
            `
                : ""
            }
            <button class="btn btn-outline" onclick="loadDashboardView('tenants')">
              <i class="fas fa-users"></i> Manage Tenants
            </button>
            <button class="btn btn-outline" onclick="loadDashboardView('payments')">
              <i class="fas fa-money-bill"></i> View Payments
            </button>
            ${
              typeof paymentsManager !== "undefined"
                ? `
              <button class="btn btn-outline" onclick="paymentsManager.recordPaymentModal()">
                <i class="fas fa-receipt"></i> Record Payment
              </button>
            `
                : ""
            }
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
            ${
              typeof propertiesManager !== "undefined"
                ? `
              <button class="btn btn-primary" onclick="propertiesManager.openAddPropertyModal()">
                <i class="fas fa-plus"></i> Add Property
              </button>
            `
                : ""
            }
          </div>
          ${
            typeof propertiesManager !== "undefined"
              ? `
            <div id="propertiesList" class="properties-grid">
              <!-- Properties will be loaded by propertiesManager -->
            </div>
          `
              : `
            <div class="empty-state">
              <i class="fas fa-home"></i>
              <h4>Property Management</h4>
              <p>Property management features are available</p>
            </div>
          `
          }
        </div>
      `;
      if (
        typeof propertiesManager !== "undefined" &&
        propertiesManager.displayProperties
      ) {
        propertiesManager.displayProperties();
      }
      break;

    case "tenants":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Tenants</h3>
            ${
              typeof tenantsManager !== "undefined"
                ? `
              <button class="btn btn-primary" onclick="tenantsManager.addTenantModal()">
                <i class="fas fa-plus"></i> Add Tenant
              </button>
            `
                : ""
            }
          </div>
          ${
            typeof tenantsManager !== "undefined"
              ? `
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
                <!-- Tenants will be loaded by tenantsManager -->
              </tbody>
            </table>
          `
              : `
            <div class="empty-state">
              <i class="fas fa-users"></i>
              <h4>Tenant Management</h4>
              <p>Tenant management features are available</p>
            </div>
          `
          }
        </div>
      `;
      if (
        typeof tenantsManager !== "undefined" &&
        tenantsManager.displayTenants
      ) {
        tenantsManager.displayTenants();
      }
      break;

    case "payments":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Payment History</h3>
            ${
              typeof paymentsManager !== "undefined"
                ? `
              <button class="btn btn-primary" onclick="paymentsManager.recordPaymentModal()">
                <i class="fas fa-plus"></i> Record Payment
              </button>
            `
                : ""
            }
          </div>
          ${
            typeof paymentsManager !== "undefined"
              ? `
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
                <!-- Payments will be loaded by paymentsManager -->
              </tbody>
            </table>
          `
              : `
            <div class="empty-state">
              <i class="fas fa-money-bill-wave"></i>
              <h4>Payment Management</h4>
              <p>Payment management features are available</p>
            </div>
          `
          }
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
      if (typeof paymentsManager !== "undefined") {
        paymentsManager.loadPayments();
        loadPaymentStats();
      }
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
    let stats = null;
    if (
      typeof paymentsManager !== "undefined" &&
      paymentsManager.getPaymentStats
    ) {
      stats = await paymentsManager.getPaymentStats();
    }

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
    } else {
      statsContainer.innerHTML = `
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
      `;
    }
  } catch (error) {
    console.error("Error loading payment stats:", error);
  }
}

// Calculate collection rate
function calculateCollectionRate(stats) {
  if (!stats || !stats.monthlyRevenue) return 0;
  return 95; // Demo value
}

// Initialize dashboard manager
const dashboardManager = new DashboardManager();

// Initialize owner dashboard
if (window.location.pathname.includes("owner-dashboard.html")) {
  document.addEventListener("DOMContentLoaded", function () {
    const userWelcome = document.getElementById("userWelcome");
    if (userWelcome && currentUser) {
      userWelcome.textContent = `Welcome, ${currentUser.name}`;
    }
    loadDashboardView("overview");
    dashboardManager.loadDashboard();
  });
}

// Make functions globally available
window.loadDashboardView = loadDashboardView;
window.dashboardManager = dashboardManager;

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

function loadDashboardView(view) {
  const content = document.getElementById("dashboardContent");
  if (!content) return;

  switch (view) {
    // ---------------- Overview -----------------
    case "overview":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header"><h3>Recent Activity</h3></div>
          <div id="recentActivity"></div>
        </div>

        <div class="dashboard-section">
          <div class="section-header"><h3>Quick Actions</h3></div>
          <div class="quick-actions">
            ${
              propertiesManager
                ? `
              <button class="btn btn-primary" onclick="propertiesManager.openAddPropertyModal()">
                <i class="fas fa-plus"></i> Add Property
              </button>`
                : ""
            }

            <button class="btn btn-outline" onclick="loadDashboardView('tenants')">
              <i class="fas fa-users"></i> Manage Tenants
            </button>

            <button class="btn btn-outline" onclick="loadDashboardView('payments')">
              <i class="fas fa-money-bill"></i> View Payments
            </button>

            ${
              paymentsManager
                ? `
              <button class="btn btn-outline" onclick="paymentsManager.recordPaymentModal()">
                <i class="fas fa-receipt"></i> Record Payment
              </button>`
                : ""
            }
          </div>
        </div>
      `;
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
      propertiesManager?.displayProperties();
      break;

    // ---------------- Tenants -----------------
    case "tenants":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header"><h3>Tenants</h3></div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th>
                <th>Property</th><th>Unit</th><th>Rent</th>
                <th>Lease Start</th><th>Lease End</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>

            <tbody id="tenantsList"></tbody>
          </table>
        </div>
      `;
      tenantsManager?.displayTenants();
      break;

    // ---------------- Payments -----------------
    case "payments":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header"><h3>Payment History</h3></div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Tenant</th><th>Property</th><th>Amount</th>
                <th>Payment Date</th><th>Due Date</th>
                <th>Month</th><th>Status</th>
                <th>Method</th><th>Reference</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="paymentsList"></tbody>
          </table>
        </div>

        <div class="dashboard-section">
          <div class="section-header"><h3>Payment Statistics</h3></div>
          <div id="paymentStats" class="dashboard-stats"></div>
        </div>
      `;
      paymentsManager?.displayPayments();
      loadPaymentStats();
      break;
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

document.addEventListener("DOMContentLoaded", () => {
  const userWelcome =
    document.getElementById("userWelcome") ||
    document.getElementById("tenantWelcome");
  if (userWelcome && currentUser) {
    userWelcome.textContent = `Welcome, ${currentUser.name}`;
  }

  if (window.location.pathname.includes("owner-dashboard")) {
    loadDashboardView("overview");
    dashboardManager.loadDashboard();
  }
});

window.loadDashboardView = loadDashboardView;
window.dashboardManager = dashboardManager;

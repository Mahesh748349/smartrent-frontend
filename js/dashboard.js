// Dashboard functionality - USING REAL API
class DashboardManager {
  constructor() {
    this.properties = [];
    this.tenants = [];
    this.payments = [];
  }

  // Load dashboard data from API
  async loadDashboard() {
    try {
      await this.loadProperties();
      await this.loadTenants();
      await this.loadPayments();
      this.displayDashboard();
    } catch (error) {
      console.error("Error loading dashboard:", error);
      showNotification("Error loading dashboard data", "error");
    }
  }

  // Load properties from API
  async loadProperties() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/properties/my-properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        this.properties = data.properties;
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  // Load tenants from API
  async loadTenants() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        this.tenants = data.tenants;
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  }

  // Load payments from API
  async loadPayments() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        this.payments = data.payments;
      }
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  }

  // Display dashboard with real data
  displayDashboard() {
    this.displayStats();
    this.displayRecentActivity();
  }

  // Display statistics cards with real data
  displayStats() {
    const statsContainer = document.getElementById("dashboardStats");
    if (!statsContainer) return;

    const totalProperties = this.properties.length;
    const totalTenants = this.tenants.length;
    const totalRevenue = this.payments
      .filter((p) => p.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const monthlyRevenue = totalRevenue / 12; // Simplified calculation

    statsContainer.innerHTML = `
      <div class="stat-card">
        <i class="fas fa-home"></i>
        <div class="stat-number">${totalProperties}</div>
        <div class="stat-label">Total Properties</div>
      </div>
      <div class="stat-card">
        <i class="fas fa-users"></i>
        <div class="stat-number">${totalTenants}</div>
        <div class="stat-label">Active Tenants</div>
      </div>
      <div class="stat-card">
        <i class="fas fa-dollar-sign"></i>
        <div class="stat-number">$${totalRevenue}</div>
        <div class="stat-label">Total Revenue</div>
      </div>
      <div class="stat-card">
        <i class="fas fa-chart-line"></i>
        <div class="stat-number">$${monthlyRevenue.toFixed(0)}</div>
        <div class="stat-label">Monthly Average</div>
      </div>
    `;
  }

  // Display recent activity with real data
  displayRecentActivity() {
    const activityContainer = document.getElementById("recentActivity");
    if (!activityContainer) return;

    const recentPayments = this.payments.slice(0, 3);

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
                Payment received
              </div>
              <div class="activity-meta">
                $${payment.amount} from ${
          payment.tenant?.user?.name || "Tenant"
        }
              </div>
              <div class="activity-time">
                ${new Date(payment.paymentDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        `
      )
      .join("");
  }

  // Display properties with real data
  displayProperties() {
    const content = document.getElementById("dashboardContent");
    if (!content) return;

    if (this.properties.length === 0) {
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Properties</h3>
            <button class="btn btn-primary" onclick="openAddPropertyModal()">
              <i class="fas fa-plus"></i> Add Your First Property
            </button>
          </div>
          <div class="empty-state">
            <i class="fas fa-home fa-3x"></i>
            <h4>No Properties Yet</h4>
            <p>Start by adding your first property to manage</p>
          </div>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="dashboard-section">
        <div class="section-header">
          <h3>My Properties (${this.properties.length})</h3>
          <button class="btn btn-primary" onclick="openAddPropertyModal()">
            <i class="fas fa-plus"></i> Add Property
          </button>
        </div>
        <div class="properties-grid">
          ${this.properties
            .map(
              (property) => `
            <div class="property-management-card">
              <div class="property-header">
                <h4>${property.name}</h4>
                <span class="status-badge ${
                  property.isAvailable ? "status-active" : "status-pending"
                }">
                  ${property.isAvailable ? "Available" : "Occupied"}
                </span>
              </div>
              <p><i class="fas fa-map-marker-alt"></i> ${
                property.address.street
              }, ${property.address.city}</p>
              <p><i class="fas fa-dollar-sign"></i> $${property.rent}/month</p>
              <p><i class="fas fa-bed"></i> ${
                property.bedrooms
              } beds | <i class="fas fa-bath"></i> ${
                property.bathrooms
              } baths</p>
              <div class="property-actions">
                <button class="btn btn-outline btn-sm" onclick="editProperty('${
                  property._id
                }')">Edit</button>
                <button class="btn btn-primary btn-sm" onclick="viewPropertyDetails('${
                  property._id
                }')">View</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // Display tenants with real data
  displayTenants() {
    const content = document.getElementById("dashboardContent");
    if (!content) return;

    content.innerHTML = `
      <div class="dashboard-section">
        <div class="section-header">
          <h3>Tenant Management</h3>
          <button class="btn btn-primary" onclick="showNotification('Add tenant feature would open here', 'success')">
            <i class="fas fa-plus"></i> Add Tenant
          </button>
        </div>
        ${
          this.tenants.length === 0
            ? `
          <div class="empty-state">
            <i class="fas fa-users fa-3x"></i>
            <h4>No Tenants Yet</h4>
            <p>Tenants will appear here when they apply for your properties</p>
          </div>
        `
            : `
          <div class="tenants-list">
            ${this.tenants
              .map(
                (tenant) => `
              <div class="tenant-card">
                <div class="tenant-header">
                  <h4>${tenant.user.name}</h4>
                  <span class="status-badge status-active">Active</span>
                </div>
                <p><i class="fas fa-envelope"></i> ${tenant.user.email}</p>
                <p><i class="fas fa-phone"></i> ${
                  tenant.user.phone || "Not provided"
                }</p>
                <p><i class="fas fa-home"></i> ${tenant.property.name}</p>
                <p><i class="fas fa-dollar-sign"></i> $${tenant.rent}/month</p>
                <div class="tenant-actions">
                  <button class="btn btn-outline btn-sm">Contact</button>
                  <button class="btn btn-primary btn-sm">Details</button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
        }
      </div>
    `;
  }

  // Display payments with real data
  displayPayments() {
    const content = document.getElementById("dashboardContent");
    if (!content) return;

    content.innerHTML = `
      <div class="dashboard-section">
        <div class="section-header">
          <h3>Payment History</h3>
          <button class="btn btn-primary" onclick="showNotification('Record payment feature would open here', 'success')">
            <i class="fas fa-plus"></i> Record Payment
          </button>
        </div>
        ${
          this.payments.length === 0
            ? `
          <div class="empty-state">
            <i class="fas fa-money-bill-wave fa-3x"></i>
            <h4>No Payments Yet</h4>
            <p>Payment history will appear here</p>
          </div>
        `
            : `
          <div class="payments-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.payments
                  .map(
                    (payment) => `
                  <tr>
                    <td>${payment.tenant?.user?.name || "N/A"}</td>
                    <td>${payment.property?.name || "N/A"}</td>
                    <td>$${payment.amount}</td>
                    <td>${new Date(
                      payment.paymentDate
                    ).toLocaleDateString()}</td>
                    <td><span class="status-badge status-${payment.status}">${
                      payment.status
                    }</span></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
        }
      </div>
    `;
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
            <button class="btn btn-primary" onclick="openAddPropertyModal()">
              <i class="fas fa-plus"></i> Add Property
            </button>
            <button class="btn btn-outline" onclick="loadDashboardView('tenants')">
              <i class="fas fa-users"></i> Manage Tenants
            </button>
            <button class="btn btn-outline" onclick="loadDashboardView('payments')">
              <i class="fas fa-money-bill"></i> View Payments
            </button>
          </div>
        </div>
      `;
      dashboardManager.displayRecentActivity();
      break;

    case "properties":
      dashboardManager.displayProperties();
      break;

    case "tenants":
      dashboardManager.displayTenants();
      break;

    case "payments":
      dashboardManager.displayPayments();
      break;

    case "maintenance":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Maintenance Requests</h3>
            <button class="btn btn-primary" onclick="showNotification('New maintenance request form would open here', 'success')">
              <i class="fas fa-plus"></i> New Request
            </button>
          </div>
          <div class="empty-state">
            <i class="fas fa-tools fa-3x"></i>
            <h4>No Maintenance Requests</h4>
            <p>Maintenance requests from tenants will appear here</p>
          </div>
        </div>
      `;
      break;
  }
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
window.editProperty = function (propertyId) {
  showNotification(
    `Edit property ${propertyId} - Feature would open here`,
    "success"
  );
};
window.viewPropertyDetails = function (propertyId) {
  showNotification(`Viewing property details for ${propertyId}`, "info");
};

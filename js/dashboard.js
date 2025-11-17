// Dashboard functionality
class DashboardManager {
  constructor() {
    this.stats = {
      totalProperties: 3,
      totalTenants: 2,
      totalRevenue: 3600,
      monthlyRevenue: 1200,
    };
  }

  // Load dashboard data
  async loadDashboard() {
    this.displayDashboard();
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

  // Display recent activity
  displayRecentActivity() {
    const activityContainer = document.getElementById("recentActivity");
    if (!activityContainer) return;

    activityContainer.innerHTML = `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-user-plus"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">
            New tenant registered
          </div>
          <div class="activity-meta">
            John Doe - Sunset Apartments
          </div>
          <div class="activity-time">
            Today
          </div>
        </div>
      </div>
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">
            Rent payment received
          </div>
          <div class="activity-meta">
            $1200 - Jane Smith
          </div>
          <div class="activity-time">
            2 days ago
          </div>
        </div>
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
            <button class="btn btn-primary" onclick="showNotification('Add property feature would open here', 'success')">
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
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>My Properties</h3>
            <button class="btn btn-primary" onclick="showNotification('Add property form would open here', 'success')">
              <i class="fas fa-plus"></i> Add Property
            </button>
          </div>
          <div class="properties-list">
            <div class="property-management-card">
              <h4>Sunset Apartments</h4>
              <p>123 Main Street, Cityville</p>
              <p>Rent: $1200/month</p>
              <div class="property-actions">
                <button class="btn btn-outline btn-sm">Edit</button>
                <button class="btn btn-primary btn-sm">View Details</button>
              </div>
            </div>
            <div class="property-management-card">
              <h4>Luxury Villa</h4>
              <p>456 Oak Avenue, Townsville</p>
              <p>Rent: $2500/month</p>
              <div class="property-actions">
                <button class="btn btn-outline btn-sm">Edit</button>
                <button class="btn btn-primary btn-sm">View Details</button>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case "tenants":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Tenant Management</h3>
            <button class="btn btn-primary" onclick="showNotification('Add tenant form would open here', 'success')">
              <i class="fas fa-plus"></i> Add Tenant
            </button>
          </div>
          <div class="tenants-list">
            <div class="tenant-card">
              <h4>John Doe</h4>
              <p>Email: john@example.com</p>
              <p>Phone: (555) 123-4567</p>
              <p>Property: Sunset Apartments</p>
              <div class="tenant-actions">
                <button class="btn btn-outline btn-sm">Edit</button>
                <button class="btn btn-primary btn-sm">View Details</button>
              </div>
            </div>
            <div class="tenant-card">
              <h4>Jane Smith</h4>
              <p>Email: jane@example.com</p>
              <p>Phone: (555) 987-6543</p>
              <p>Property: Luxury Villa</p>
              <div class="tenant-actions">
                <button class="btn btn-outline btn-sm">Edit</button>
                <button class="btn btn-primary btn-sm">View Details</button>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case "payments":
      content.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h3>Payment Management</h3>
            <button class="btn btn-primary" onclick="showNotification('Record payment feature would open here', 'success')">
              <i class="fas fa-plus"></i> Record Payment
            </button>
          </div>
          <div class="payments-list">
            <div class="payment-management-card">
              <h4>October Rent - John Doe</h4>
              <p>Amount: $1200</p>
              <p>Status: <span class="status-badge status-paid">Paid</span></p>
              <p>Date: October 1, 2024</p>
            </div>
            <div class="payment-management-card">
              <h4>October Rent - Jane Smith</h4>
              <p>Amount: $2500</p>
              <p>Status: <span class="status-badge status-pending">Pending</span></p>
              <p>Due: October 5, 2024</p>
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
            <button class="btn btn-primary" onclick="showNotification('New maintenance request form would open here', 'success')">
              <i class="fas fa-plus"></i> New Request
            </button>
          </div>
          <div class="maintenance-list">
            <p>No active maintenance requests at this time.</p>
            <button class="btn btn-outline" onclick="showNotification('Sample maintenance request created!', 'success')">
              Create Sample Request
            </button>
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

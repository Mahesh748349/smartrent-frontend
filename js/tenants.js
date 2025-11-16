// Tenants management functionality
class TenantsManager {
  constructor() {
    this.tenants = [];
  }

  // Load tenants
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
        this.displayTenants();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
      showNotification("Error loading tenants", "error");
    }
  }

  // Display tenants in the UI
  displayTenants() {
    const container = document.getElementById("tenantsList");
    if (!container) return;

    if (this.tenants.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    container.innerHTML = this.tenants
      .map((tenant) => this.createTenantRow(tenant))
      .join("");
  }

  // Create tenant table row
  createTenantRow(tenant) {
    const isOwner = currentUser && currentUser.role === "owner";

    return `
            <tr>
                <td>${tenant.user.name}</td>
                <td>${tenant.user.email}</td>
                <td>${tenant.user.phone || "N/A"}</td>
                <td>${tenant.property.name}</td>
                <td>${tenant.unit}</td>
                <td>$${tenant.rent}/month</td>
                <td>${this.formatDate(tenant.leaseStart)}</td>
                <td>${this.formatDate(tenant.leaseEnd)}</td>
                <td>
                    <span class="status-badge status-${tenant.status}">
                        ${tenant.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="tenantsManager.viewTenant('${
                          tenant._id
                        }')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${
                          isOwner
                            ? `
                            <button class="btn btn-primary btn-sm" onclick="tenantsManager.editTenant('${tenant._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="tenantsManager.removeTenant('${tenant._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        `
                            : ""
                        }
                    </div>
                </td>
            </tr>
        `;
  }

  // Empty state HTML
  getEmptyState() {
    const isOwner = currentUser && currentUser.role === "owner";

    return `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h4>No Tenants Found</h4>
                    <p>${
                      isOwner
                        ? "Add your first tenant to get started"
                        : "No tenant information available"
                    }</p>
                </td>
            </tr>
        `;
  }

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  // View tenant details
  viewTenant(tenantId) {
    const tenant = this.tenants.find((t) => t._id === tenantId);
    if (tenant) {
      const modalHTML = `
                <div id="tenantDetailsModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeModal('tenantDetailsModal')">&times;</span>
                        <h2>Tenant Details</h2>
                        
                        <div class="tenant-details">
                            <div class="detail-section">
                                <h3>Personal Information</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Name:</strong> ${
                                          tenant.user.name
                                        }
                                    </div>
                                    <div class="detail-item">
                                        <strong>Email:</strong> ${
                                          tenant.user.email
                                        }
                                    </div>
                                    <div class="detail-item">
                                        <strong>Phone:</strong> ${
                                          tenant.user.phone || "N/A"
                                        }
                                    </div>
                                    <div class="detail-item">
                                        <strong>Unit:</strong> ${tenant.unit}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h3>Lease Information</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Property:</strong> ${
                                          tenant.property.name
                                        }
                                    </div>
                                    <div class="detail-item">
                                        <strong>Rent:</strong> $${
                                          tenant.rent
                                        }/month
                                    </div>
                                    <div class="detail-item">
                                        <strong>Lease Start:</strong> ${this.formatDate(
                                          tenant.leaseStart
                                        )}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Lease End:</strong> ${this.formatDate(
                                          tenant.leaseEnd
                                        )}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Security Deposit:</strong> $${
                                          tenant.securityDeposit || 0
                                        }
                                    </div>
                                    <div class="detail-item">
                                        <strong>Status:</strong> 
                                        <span class="status-badge status-${
                                          tenant.status
                                        }">
                                            ${tenant.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            ${
                              tenant.emergencyContact
                                ? `
                                <div class="detail-section">
                                    <h3>Emergency Contact</h3>
                                    <div class="detail-grid">
                                        <div class="detail-item">
                                            <strong>Name:</strong> ${tenant.emergencyContact.name}
                                        </div>
                                        <div class="detail-item">
                                            <strong>Phone:</strong> ${tenant.emergencyContact.phone}
                                        </div>
                                        <div class="detail-item">
                                            <strong>Relationship:</strong> ${tenant.emergencyContact.relationship}
                                        </div>
                                    </div>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);
      openModal("tenantDetailsModal");
    }
  }

  // Add tenant (owner only)
  async addTenant(tenantData) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tenantData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Tenant added successfully!", "success");
        await this.loadTenants(); // Reload tenants
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error adding tenant:", error);
      showNotification("Error adding tenant: " + error.message, "error");
      return false;
    }
  }

  // Remove tenant (owner only)
  async removeTenant(tenantId) {
    if (
      !confirm(
        "Are you sure you want to remove this tenant? This will mark the property as available."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/tenants/${tenantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Tenant removed successfully!", "success");
        await this.loadTenants(); // Reload tenants
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error removing tenant:", error);
      showNotification("Error removing tenant: " + error.message, "error");
    }
  }
}

// Initialize tenants manager
const tenantsManager = new TenantsManager();

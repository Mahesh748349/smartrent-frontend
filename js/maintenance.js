// maintenance.js - BACKEND-ONLY VERSION
class MaintenanceManager {
  constructor() {
    this.requests = [];
  }

  async loadMaintenance() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/maintenance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.requests = data.requests || [];
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading maintenance:", error);
      this.requests = [];
    }
    this.displayMaintenance();
  }

  displayMaintenance() {
    const container = document.getElementById("maintenanceList");
    if (!container) return;

    if (this.requests.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    container.innerHTML = this.requests
      .map(
        (request) => `
            <div class="maintenance-card">
                <div class="maintenance-header">
                    <h4>${request.title}</h4>
                    <span class="priority-badge priority-${request.priority}">
                        ${request.priority}
                    </span>
                </div>
                <div class="maintenance-content">
                    <p>${request.description}</p>
                    <div class="maintenance-meta">
                        <span><i class="fas fa-home"></i> ${
                          request.property?.name || "N/A"
                        }</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(
                          request.createdAt
                        ).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="maintenance-footer">
                    <span class="status-badge status-${request.status}">
                        ${request.status}
                    </span>
                    <div class="maintenance-actions">
                        <button class="btn btn-outline btn-sm" onclick="maintenanceManager.viewRequest('${
                          request._id
                        }')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${
                          currentUser?.role === "owner"
                            ? `
                            <button class="btn btn-primary btn-sm" onclick="maintenanceManager.updateStatus('${request._id}')">
                                <i class="fas fa-edit"></i> Update
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

  getEmptyState() {
    return `
            <div class="empty-state">
                <i class="fas fa-tools"></i>
                <h4>No Maintenance Requests</h4>
                <p>${
                  currentUser?.role === "tenant"
                    ? "Submit your first maintenance request"
                    : "No maintenance requests found"
                }</p>
                ${
                  currentUser?.role === "tenant"
                    ? `
                    <button class="btn btn-primary" onclick="maintenanceManager.openNewRequestModal()">
                        <i class="fas fa-plus"></i> Submit Request
                    </button>
                `
                    : ""
                }
            </div>
        `;
  }

  openNewRequestModal() {
    const existingModal = document.getElementById("newMaintenanceModal");
    if (existingModal) existingModal.remove();

    const modalHTML = `
            <div id="newMaintenanceModal" class="modal">
                <div class="modal-content scrollable-modal" style="max-width: 600px; max-height: 85vh;">
                    <div class="modal-header">
                        <h2>New Maintenance Request</h2>
                        <span class="close" onclick="closeModal('newMaintenanceModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="maintenanceForm">
                            <div class="form-group">
                                <label for="maintenanceTitle">Title *</label>
                                <input type="text" id="maintenanceTitle" required>
                            </div>
                            <div class="form-group">
                                <label for="maintenanceDescription">Description *</label>
                                <textarea id="maintenanceDescription" rows="4" required></textarea>
                            </div>
                            <div class="form-group">
                                <label for="maintenancePriority">Priority *</label>
                                <select id="maintenancePriority" required>
                                    <option value="">Select Priority</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="closeModal('newMaintenanceModal')">Cancel</button>
                                <button type="submit" class="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document
      .getElementById("maintenanceForm")
      .addEventListener("submit", (e) => this.handleNewRequest(e));
    openModal("newMaintenanceModal");
  }

  async handleNewRequest(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    const requestData = {
      title: document.getElementById("maintenanceTitle").value,
      description: document.getElementById("maintenanceDescription").value,
      priority: document.getElementById("maintenancePriority").value,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          "Maintenance request submitted successfully!",
          "success"
        );
        closeModal("newMaintenanceModal");
        await this.loadMaintenance();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      showNotification("Error submitting request: " + error.message, "error");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  viewRequest(requestId) {
    const request = this.requests.find((r) => r._id === requestId);
    if (request) {
      const modalHTML = `
                <div id="viewMaintenanceModal" class="modal">
                    <div class="modal-content scrollable-modal">
                        <div class="modal-header">
                            <h2>Maintenance Request Details</h2>
                            <span class="close" onclick="closeModal('viewMaintenanceModal')">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="maintenance-details">
                                <div class="detail-section">
                                    <h3>Request Information</h3>
                                    <div class="detail-grid">
                                        <div class="detail-item"><strong>Title:</strong> ${
                                          request.title
                                        }</div>
                                        <div class="detail-item"><strong>Priority:</strong> 
                                            <span class="priority-badge priority-${
                                              request.priority
                                            }">${request.priority}</span>
                                        </div>
                                        <div class="detail-item"><strong>Status:</strong> 
                                            <span class="status-badge status-${
                                              request.status
                                            }">${request.status}</span>
                                        </div>
                                        <div class="detail-item"><strong>Submitted:</strong> ${new Date(
                                          request.createdAt
                                        ).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div class="detail-section">
                                    <h3>Description</h3>
                                    <p>${request.description}</p>
                                </div>
                                ${
                                  request.property
                                    ? `
                                    <div class="detail-section">
                                        <h3>Property</h3>
                                        <p>${request.property.name}</p>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                            <div class="modal-actions">
                                <button class="btn btn-outline" onclick="closeModal('viewMaintenanceModal')">Close</button>
                                ${
                                  currentUser?.role === "owner"
                                    ? `
                                    <button class="btn btn-primary" onclick="maintenanceManager.updateStatus('${request._id}'); closeModal('viewMaintenanceModal');">
                                        Update Status
                                    </button>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);
      openModal("viewMaintenanceModal");
    }
  }

  async updateStatus(requestId) {
    const request = this.requests.find((r) => r._id === requestId);
    if (!request) return;

    const newStatus = prompt(
      "Enter new status (pending, in-progress, completed, cancelled):",
      request.status
    );

    if (
      newStatus &&
      ["pending", "in-progress", "completed", "cancelled"].includes(newStatus)
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/maintenance/${requestId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (data.success) {
          showNotification("Status updated successfully!", "success");
          await this.loadMaintenance();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showNotification("Error updating status: " + error.message, "error");
      }
    }
  }
}

const maintenanceManager = new MaintenanceManager();

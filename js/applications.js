// js/applications.js - NEW FILE for managing rental applications
class ApplicationsManager {
  constructor() {
    this.applications = [];
  }

  async loadApplications() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/applications/my-properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.applications = data.applications || [];
        this.displayApplications();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      showNotification("Error loading applications", "error");
      this.applications = [];
      this.displayApplications();
    }
  }

  displayApplications() {
    const container = document.getElementById("applicationsList");
    if (!container) return;

    if (this.applications.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    container.innerHTML = this.applications
      .map((application) => this.createApplicationCard(application))
      .join("");
  }

  createApplicationCard(application) {
    return `
            <div class="application-card">
                <div class="application-header">
                    <h4>Application for ${
                      application.property?.name || "Unknown Property"
                    }</h4>
                    <span class="status-badge status-${application.status}">
                        ${application.status}
                    </span>
                </div>
                
                <div class="application-content">
                    <div class="applicant-info">
                        <h5>Applicant Details</h5>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Name:</strong> ${
                                  application.applicantName
                                }
                            </div>
                            <div class="detail-item">
                                <strong>Email:</strong> ${
                                  application.applicantEmail
                                }
                            </div>
                            <div class="detail-item">
                                <strong>Phone:</strong> ${
                                  application.applicantPhone
                                }
                            </div>
                            <div class="detail-item">
                                <strong>Occupation:</strong> ${
                                  application.occupation
                                }
                            </div>
                            <div class="detail-item">
                                <strong>Monthly Income:</strong> $${
                                  application.monthlyIncome
                                }
                            </div>
                            <div class="detail-item">
                                <strong>Move-in Date:</strong> ${new Date(
                                  application.moveInDate
                                ).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    ${
                      application.message
                        ? `
                        <div class="application-message">
                            <h5>Message from Applicant</h5>
                            <p>"${application.message}"</p>
                        </div>
                    `
                        : ""
                    }

                    ${
                      application.references
                        ? `
                        <div class="application-references">
                            <h5>References</h5>
                            <p>${application.references}</p>
                        </div>
                    `
                        : ""
                    }

                    <div class="application-meta">
                        <small>Applied on: ${new Date(
                          application.createdAt
                        ).toLocaleDateString()}</small>
                    </div>
                </div>

                <div class="application-actions">
                    <button class="btn btn-outline btn-sm" onclick="applicationsManager.viewApplication('${
                      application._id
                    }')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${
                      application.status === "pending"
                        ? `
                        <button class="btn btn-success btn-sm" onclick="applicationsManager.updateStatus('${application._id}', 'approved')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="applicationsManager.updateStatus('${application._id}', 'rejected')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  getEmptyState() {
    return `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h4>No Applications Found</h4>
                <p>Tenant applications for your properties will appear here</p>
            </div>
        `;
  }

  async updateStatus(applicationId, status) {
    const action = status === "approved" ? "approve" : "reject";
    if (!confirm(`Are you sure you want to ${action} this application?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/applications/${applicationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showNotification(`Application ${status} successfully!`, "success");
        await this.loadApplications();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      showNotification("Error updating application: " + error.message, "error");
    }
  }

  viewApplication(applicationId) {
    const application = this.applications.find((a) => a._id === applicationId);
    if (application) {
      const modalHTML = `
                <div id="viewApplicationModal" class="modal">
                    <div class="modal-content scrollable-modal" style="max-width: 700px; max-height: 85vh;">
                        <div class="modal-header">
                            <h2>Application Details</h2>
                            <span class="close" onclick="closeModal('viewApplicationModal')">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="application-details">
                                <div class="detail-section">
                                    <h3>Property Information</h3>
                                    <div class="detail-grid">
                                        <div class="detail-item"><strong>Property:</strong> ${
                                          application.property?.name || "N/A"
                                        }</div>
                                        <div class="detail-item"><strong>Rent:</strong> $${
                                          application.property?.rent || "N/A"
                                        }/month</div>
                                        <div class="detail-item"><strong>Address:</strong> ${
                                          application.property?.address
                                            ?.street || "N/A"
                                        }, ${
        application.property?.address?.city || "N/A"
      }</div>
                                    </div>
                                </div>

                                <div class="detail-section">
                                    <h3>Applicant Information</h3>
                                    <div class="detail-grid">
                                        <div class="detail-item"><strong>Name:</strong> ${
                                          application.applicantName
                                        }</div>
                                        <div class="detail-item"><strong>Email:</strong> ${
                                          application.applicantEmail
                                        }</div>
                                        <div class="detail-item"><strong>Phone:</strong> ${
                                          application.applicantPhone
                                        }</div>
                                        <div class="detail-item"><strong>Occupation:</strong> ${
                                          application.occupation
                                        }</div>
                                        <div class="detail-item"><strong>Monthly Income:</strong> $${
                                          application.monthlyIncome
                                        }</div>
                                        <div class="detail-item"><strong>Desired Move-in:</strong> ${new Date(
                                          application.moveInDate
                                        ).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                ${
                                  application.message
                                    ? `
                                    <div class="detail-section">
                                        <h3>Applicant Message</h3>
                                        <p>${application.message}</p>
                                    </div>
                                `
                                    : ""
                                }

                                ${
                                  application.references
                                    ? `
                                    <div class="detail-section">
                                        <h3>References</h3>
                                        <p>${application.references}</p>
                                    </div>
                                `
                                    : ""
                                }

                                <div class="detail-section">
                                    <h3>Application Status</h3>
                                    <div class="detail-grid">
                                        <div class="detail-item"><strong>Status:</strong> 
                                            <span class="status-badge status-${
                                              application.status
                                            }">${application.status}</span>
                                        </div>
                                        <div class="detail-item"><strong>Applied On:</strong> ${new Date(
                                          application.createdAt
                                        ).toLocaleDateString()}</div>
                                        <div class="detail-item"><strong>Last Updated:</strong> ${new Date(
                                          application.updatedAt
                                        ).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="modal-actions">
                                <button class="btn btn-outline" onclick="closeModal('viewApplicationModal')">Close</button>
                                ${
                                  application.status === "pending"
                                    ? `
                                    <button class="btn btn-success" onclick="applicationsManager.updateStatus('${application._id}', 'approved'); closeModal('viewApplicationModal');">
                                        Approve Application
                                    </button>
                                    <button class="btn btn-danger" onclick="applicationsManager.updateStatus('${application._id}', 'rejected'); closeModal('viewApplicationModal');">
                                        Reject Application
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
      openModal("viewApplicationModal");
    }
  }
}

const applicationsManager = new ApplicationsManager();

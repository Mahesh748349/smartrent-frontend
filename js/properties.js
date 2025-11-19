// properties.js - BACKEND-ONLY VERSION
class PropertiesManager {
  constructor() {
    this.properties = [];
    this.currentEditingId = null;
  }

  async loadProperties() {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        currentUser?.role === "owner"
          ? `${API_BASE}/properties/my-properties`
          : `${API_BASE}/properties`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.properties = data.properties || [];
        this.displayProperties();
      } else {
        throw new Error(data.message || "Failed to load properties");
      }
    } catch (error) {
      console.error("Error loading properties:", error);
      showNotification("Error loading properties", "error");
      this.properties = [];
      this.displayProperties();
    }
  }

  displayProperties() {
    const container = document.getElementById("propertiesList");
    if (!container) return;

    if (this.properties.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    container.innerHTML = this.properties
      .map((property) => this.createPropertyCard(property))
      .join("");
  }

  createPropertyCard(property) {
    const isOwner = currentUser && currentUser.role === "owner";

    return `
            <div class="property-card" data-property-id="${property._id}">
                <div class="property-image">
                    <i class="fas fa-home"></i>
                </div>

                <div class="property-content">
                    <h3>${property.name || "Untitled Property"}</h3>
                    <div class="property-price">$${
                      property.rent || 0
                    }/month</div>
                    <p class="property-address">
                        ${property.address?.street || ""}, ${
      property.address?.city || ""
    }, ${property.address?.state || ""}
                    </p>

                    <div class="property-features">
                        <span><i class="fas fa-bed"></i> ${
                          property.bedrooms || 0
                        } beds</span>
                        <span><i class="fas fa-bath"></i> ${
                          property.bathrooms || 0
                        } baths</span>
                        <span><i class="fas fa-ruler-combined"></i> ${
                          property.area || "N/A"
                        }</span>
                    </div>

                    ${
                      property.description
                        ? `<p class="property-description">${property.description}</p>`
                        : ""
                    }

                    <div class="property-actions">
                        <button class="btn btn-outline btn-sm" onclick="propertiesManager.viewProperty('${
                          property._id
                        }')">
                            <i class="fas fa-eye"></i> View
                        </button>

                        ${
                          isOwner
                            ? `
                            <button class="btn btn-primary btn-sm" onclick="propertiesManager.editProperty('${property._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="propertiesManager.deleteProperty('${property._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        `
                            : currentUser?.role === "tenant"
                            ? `
                            <button class="btn btn-primary" onclick="propertiesManager.applyForProperty('${property._id}')">
                                <i class="fas fa-paper-plane"></i> Apply Now
                            </button>
                        `
                            : `
                            <button class="btn btn-primary" onclick="openModal('loginModal')">
                                <i class="fas fa-sign-in-alt"></i> Login to Apply
                            </button>
                        `
                        }
                    </div>

                    ${
                      isOwner
                        ? `
                        <div class="property-status">
                            <span class="status-badge ${
                              property.isAvailable
                                ? "status-active"
                                : "status-pending"
                            }">
                                ${
                                  property.isAvailable
                                    ? "Available"
                                    : "Occupied"
                                }
                            </span>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  getEmptyState() {
    const isOwner = currentUser && currentUser.role === "owner";
    return `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <h3>No Properties Found</h3>
                <p>${
                  isOwner
                    ? "Add your first property to get started"
                    : "No properties available at the moment"
                }</p>
                ${
                  isOwner
                    ? `
                    <button class="btn btn-primary" onclick="propertiesManager.openAddPropertyModal()">
                        <i class="fas fa-plus"></i> Add First Property
                    </button>
                `
                    : ""
                }
            </div>
        `;
  }

  openAddPropertyModal() {
    if (!currentUser || currentUser.role !== "owner") {
      showNotification("Please login as owner to add properties", "error");
      return;
    }
    this.currentEditingId = null;
    this.openPropertyModal("Add New Property", null);
  }

  editProperty(propertyId) {
    const property = this.properties.find((p) => p._id === propertyId);
    if (property) {
      this.currentEditingId = propertyId;
      this.openPropertyModal("Edit Property", property);
    } else {
      showNotification("Property not found", "error");
    }
  }

  openPropertyModal(title, property = null) {
    const existingModal = document.getElementById("propertyModal");
    if (existingModal) existingModal.remove();

    const safeFeatures = Array.isArray(property?.features)
      ? property.features.join(", ")
      : "";

    const modalHTML = `
            <div id="propertyModal" class="modal">
                <div class="modal-content scrollable-modal" style="max-width: 700px; max-height: 85vh;">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <span class="close" onclick="closeModal('propertyModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="propertyForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="propertyName">Property Name *</label>
                                    <input type="text" id="propertyName" value="${
                                      property?.name || ""
                                    }" required>
                                </div>
                                <div class="form-group">
                                    <label for="propertyRent">Monthly Rent ($) *</label>
                                    <input type="number" id="propertyRent" value="${
                                      property?.rent || ""
                                    }" required min="0">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="propertyAddress">Street Address *</label>
                                <input type="text" id="propertyAddress" value="${
                                  property?.address?.street || ""
                                }" required>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="propertyCity">City *</label>
                                    <input type="text" id="propertyCity" value="${
                                      property?.address?.city || ""
                                    }" required>
                                </div>
                                <div class="form-group">
                                    <label for="propertyState">State *</label>
                                    <input type="text" id="propertyState" value="${
                                      property?.address?.state || ""
                                    }" required>
                                </div>
                                <div class="form-group">
                                    <label for="propertyZip">ZIP Code *</label>
                                    <input type="text" id="propertyZip" value="${
                                      property?.address?.zipCode || ""
                                    }" required>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="propertyBedrooms">Bedrooms *</label>
                                    <input type="number" id="propertyBedrooms" value="${
                                      property?.bedrooms || ""
                                    }" required min="0">
                                </div>
                                <div class="form-group">
                                    <label for="propertyBathrooms">Bathrooms *</label>
                                    <input type="number" id="propertyBathrooms" value="${
                                      property?.bathrooms || ""
                                    }" required min="0">
                                </div>
                                <div class="form-group">
                                    <label for="propertyArea">Area *</label>
                                    <input type="text" id="propertyArea" value="${
                                      property?.area || ""
                                    }" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="propertyDescription">Description</label>
                                <textarea id="propertyDescription" rows="3">${
                                  property?.description || ""
                                }</textarea>
                            </div>

                            <div class="form-group">
                                <label for="propertyFeatures">Features (comma separated)</label>
                                <input type="text" id="propertyFeatures" value="${safeFeatures}">
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="closeModal('propertyModal')">Cancel</button>
                                <button type="submit" class="btn btn-primary">
                                    ${
                                      this.currentEditingId
                                        ? "Update Property"
                                        : "Add Property"
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document
      .getElementById("propertyForm")
      .addEventListener("submit", (e) => this.handlePropertySubmit(e));
    openModal("propertyModal");
  }

  async handlePropertySubmit(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = this.currentEditingId ? "Updating..." : "Adding...";
    submitBtn.disabled = true;

    const formData = {
      name: document.getElementById("propertyName").value.trim(),
      address: {
        street: document.getElementById("propertyAddress").value.trim(),
        city: document.getElementById("propertyCity").value.trim(),
        state: document.getElementById("propertyState").value.trim(),
        zipCode: document.getElementById("propertyZip").value.trim(),
      },
      rent: parseFloat(document.getElementById("propertyRent").value),
      bedrooms: parseInt(document.getElementById("propertyBedrooms").value),
      bathrooms: parseInt(document.getElementById("propertyBathrooms").value),
      area: document.getElementById("propertyArea").value.trim(),
      description: document.getElementById("propertyDescription").value.trim(),
      features: document
        .getElementById("propertyFeatures")
        .value.split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0),
    };

    try {
      const token = localStorage.getItem("token");
      const url = this.currentEditingId
        ? `${API_BASE}/properties/${this.currentEditingId}`
        : `${API_BASE}/properties`;
      const method = this.currentEditingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          this.currentEditingId
            ? "Property updated successfully!"
            : "Property added successfully!",
          "success"
        );
        closeModal("propertyModal");
        this.currentEditingId = null;
        await this.loadProperties();
      } else {
        throw new Error(data.message || "Failed to save property");
      }
    } catch (error) {
      console.error("Error saving property:", error);
      showNotification("Error: " + error.message, "error");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async deleteProperty(propertyId) {
    if (
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Property deleted successfully!", "success");
        await this.loadProperties();
      } else {
        throw new Error(data.message || "Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      showNotification("Error deleting property: " + error.message, "error");
    }
  }

  viewProperty(propertyId) {
    const property = this.properties.find((p) => p._id === propertyId);
    if (!property) {
      showNotification("Property not found", "error");
      return;
    }

    const features = Array.isArray(property.features) ? property.features : [];
    const modalHTML = `
            <div id="propertyDetailsModal" class="modal">
                <div class="modal-content scrollable-modal">
                    <div class="modal-header">
                        <h2>${property.name}</h2>
                        <span class="close" onclick="closeModal('propertyDetailsModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="property-details">
                            <div class="detail-section">
                                <h3>Basic Information</h3>
                                <div class="detail-grid">
                                    <div class="detail-item"><strong>Rent:</strong> $${
                                      property.rent
                                    }/month</div>
                                    <div class="detail-item"><strong>Bedrooms:</strong> ${
                                      property.bedrooms
                                    }</div>
                                    <div class="detail-item"><strong>Bathrooms:</strong> ${
                                      property.bathrooms
                                    }</div>
                                    <div class="detail-item"><strong>Area:</strong> ${
                                      property.area
                                    }</div>
                                </div>
                            </div>

                            <div class="detail-section">
                                <h3>Address</h3>
                                <p>${property.address?.street || ""}<br>
                                ${property.address?.city || ""}, ${
      property.address?.state || ""
    } ${property.address?.zipCode || ""}</p>
                            </div>

                            ${
                              property.description
                                ? `<div class="detail-section"><h3>Description</h3><p>${property.description}</p></div>`
                                : ""
                            }

                            ${
                              features.length
                                ? `<div class="detail-section"><h3>Features</h3><div class="features-list">${features
                                    .map(
                                      (f) =>
                                        `<span class="feature-tag">${f}</span>`
                                    )
                                    .join("")}</div></div>`
                                : ""
                            }
                        </div>

                        <div class="modal-actions">
                            ${
                              currentUser?.role === "owner"
                                ? `
                                <button class="btn btn-primary" onclick="propertiesManager.editProperty('${property._id}'); closeModal('propertyDetailsModal');">
                                    Edit Property
                                </button>
                            `
                                : ""
                            }
                            <button class="btn btn-outline" onclick="closeModal('propertyDetailsModal')">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    openModal("propertyDetailsModal");
  }

  // In properties.js - UPDATE the applyForProperty method
  async applyForProperty(propertyId) {
    if (!currentUser || currentUser.role !== "tenant") {
      showNotification(
        "Please login as a tenant to apply for properties",
        "error"
      );
      return;
    }

    const property = this.properties.find((p) => p._id === propertyId);
    if (!property) {
      showNotification("Property not found", "error");
      return;
    }

    // Open application form instead of just showing notification
    this.openApplicationModal(property);
  }

  // NEW: Open application form modal
  openApplicationModal(property) {
    const existingModal = document.getElementById("applicationModal");
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="applicationModal" class="modal">
            <div class="modal-content scrollable-modal" style="max-width: 600px; max-height: 85vh;">
                <div class="modal-header">
                    <h2>Apply for ${property.name}</h2>
                    <span class="close" onclick="closeModal('applicationModal')">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="property-summary">
                        <h3>Property Details</h3>
                        <p><strong>Rent:</strong> $${property.rent}/month</p>
                        <p><strong>Address:</strong> ${
                          property.address?.street
                        }, ${property.address?.city}</p>
                        <p><strong>Bedrooms:</strong> ${
                          property.bedrooms
                        } | <strong>Bathrooms:</strong> ${
      property.bathrooms
    }</p>
                    </div>
                    
                    <form id="applicationForm">
                        <div class="form-group">
                            <label for="applicantName">Full Name *</label>
                            <input type="text" id="applicantName" value="${
                              currentUser?.name || ""
                            }" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="applicantEmail">Email *</label>
                            <input type="email" id="applicantEmail" value="${
                              currentUser?.email || ""
                            }" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="applicantPhone">Phone Number *</label>
                            <input type="tel" id="applicantPhone" value="${
                              currentUser?.phone || ""
                            }" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="applicantOccupation">Occupation *</label>
                            <input type="text" id="applicantOccupation" required placeholder="e.g., Software Engineer">
                        </div>
                        
                        <div class="form-group">
                            <label for="applicantIncome">Monthly Income ($) *</label>
                            <input type="number" id="applicantIncome" required min="0" placeholder="e.g., 5000">
                        </div>
                        
                        <div class="form-group">
                            <label for="applicantMoveInDate">Desired Move-in Date *</label>
                            <input type="date" id="applicantMoveInDate" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="applicantMessage">Message to Property Owner</label>
                            <textarea id="applicantMessage" rows="3" placeholder="Tell the owner about yourself and why you're interested in this property..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="applicantReferences">References</label>
                            <textarea id="applicantReferences" rows="2" placeholder="Previous landlord contacts or personal references (optional)"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal('applicationModal')">Cancel</button>
                            <button type="submit" class="btn btn-primary">Submit Application</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document
      .getElementById("applicationForm")
      .addEventListener("submit", (e) =>
        this.handleApplicationSubmit(e, property._id)
      );
    openModal("applicationModal");
  }

  // NEW: Handle application submission
  async handleApplicationSubmit(event, propertyId) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    const applicationData = {
      propertyId: propertyId,
      applicantName: document.getElementById("applicantName").value,
      applicantEmail: document.getElementById("applicantEmail").value,
      applicantPhone: document.getElementById("applicantPhone").value,
      occupation: document.getElementById("applicantOccupation").value,
      monthlyIncome: parseFloat(
        document.getElementById("applicantIncome").value
      ),
      moveInDate: document.getElementById("applicantMoveInDate").value,
      message: document.getElementById("applicantMessage").value,
      references: document.getElementById("applicantReferences").value,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          "Application submitted successfully! The property owner will review your application.",
          "success"
        );
        closeModal("applicationModal");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification(
        "Error submitting application: " + error.message,
        "error"
      );
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
}

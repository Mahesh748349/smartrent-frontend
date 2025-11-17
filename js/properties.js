// Use global API_BASE from app.js (fallback included)
const API_BASE =
  window.API_BASE || "https://your-smartrent-backend.onrender.com/api";

// =======================
// PropertiesManager
// =======================
class PropertiesManager {
  constructor() {
    this.properties = [];
    this.currentEditingId = null;
  }

  // Load properties (owner gets /my-properties)
  async loadProperties() {
    try {
      const token = localStorage.getItem("token");
      const endpoint = currentUser
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
    }
  }

  // Render properties grid/list
  displayProperties() {
    const container = document.getElementById("propertiesList");
    if (!container) return;

    if (!this.properties || this.properties.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    container.innerHTML = this.properties
      .map((property) => this.createPropertyCard(property))
      .join("");
  }

  // Build single property card. Uses optional chaining and safe defaults.
  createPropertyCard(property) {
    const isOwner = currentUser && currentUser.role === "owner";
    const address = property.address || {};
    const features = Array.isArray(property.features) ? property.features : [];

    return `
      <div class="property-card" data-property-id="${property._id}">
        <div class="property-image">
          <!-- if you later add property.imageUrl use it here -->
          <i class="fas fa-home"></i>
        </div>

        <div class="property-content">
          <h3>${property.name || "Untitled Property"}</h3>
          <div class="property-price">$${property.rent ?? 0}/month</div>
          <p>${address.street || ""}${address.city ? ", " + address.city : ""}${
      address.state ? ", " + address.state : ""
    }${address.zipCode ? " " + address.zipCode : ""}</p>

          <div class="property-features">
            <span><i class="fas fa-bed"></i> ${
              property.bedrooms ?? 0
            } beds</span>
            <span><i class="fas fa-bath"></i> ${
              property.bathrooms ?? 0
            } baths</span>
            <span><i class="fas fa-ruler-combined"></i> ${
              property.area ?? "—"
            }</span>
          </div>

          ${
            property.description
              ? `<p class="property-description">${property.description}</p>`
              : ""
          }

          ${
            features.length > 0
              ? `<div class="property-tags">${features
                  .map((f) => `<span class="tag">${f}</span>`)
                  .join("")}</div>`
              : ""
          }

          <div class="property-actions">
            <button class="btn btn-outline" onclick="propertiesManager.viewProperty('${
              property._id
            }')">
              <i class="fas fa-eye"></i> View Details
            </button>

            ${
              isOwner
                ? `
              <button class="btn btn-primary" onclick="propertiesManager.editProperty('${property._id}')">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-danger" onclick="propertiesManager.deleteProperty('${property._id}')">
                <i class="fas fa-trash"></i> Delete
              </button>
            `
                : currentUser && currentUser.role === "tenant"
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
                property.isAvailable ? "status-active" : "status-pending"
              }">
                ${property.isAvailable ? "Available" : "Occupied"}
              </span>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  // Empty state with Add button for owners
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

  // Open add property modal (owner-only check)
  openAddPropertyModal() {
    if (!currentUser || currentUser.role !== "owner") {
      showNotification("Please login as owner to add properties", "error");
      return;
    }
    this.currentEditingId = null;
    this.openPropertyModal("Add New Property", null);
  }

  // Enter edit mode
  editProperty(propertyId) {
    const property = this.properties.find((p) => p._id === propertyId);
    if (property) {
      this.currentEditingId = propertyId;
      this.openPropertyModal("Edit Property", property);
    } else {
      showNotification("Property not found", "error");
    }
  }

  // Scrollable modal builder used by add & edit
  openPropertyModal(title, property = null) {
    const safeFeatures = Array.isArray(property?.features)
      ? property.features.join(", ")
      : "";

    const modalHTML = `
      <div id="propertyModal" class="modal">
        <div class="modal-content modal-form scrollable-modal">
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
                    property?.name ?? ""
                  }" required>
                </div>
                <div class="form-group">
                  <label for="propertyRent">Monthly Rent ($) *</label>
                  <input type="number" id="propertyRent" value="${
                    property?.rent ?? ""
                  }" required min="0">
                </div>
              </div>

              <div class="form-group">
                <label for="propertyAddress">Street Address *</label>
                <input type="text" id="propertyAddress" value="${
                  property?.address?.street ?? ""
                }" required>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="propertyCity">City *</label>
                  <input type="text" id="propertyCity" value="${
                    property?.address?.city ?? ""
                  }" required>
                </div>
                <div class="form-group">
                  <label for="propertyState">State *</label>
                  <input type="text" id="propertyState" value="${
                    property?.address?.state ?? ""
                  }" required>
                </div>
                <div class="form-group">
                  <label for="propertyZip">ZIP Code *</label>
                  <input type="text" id="propertyZip" value="${
                    property?.address?.zipCode ?? ""
                  }" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="propertyBedrooms">Bedrooms *</label>
                  <input type="number" id="propertyBedrooms" value="${
                    property?.bedrooms ?? ""
                  }" required min="0">
                </div>
                <div class="form-group">
                  <label for="propertyBathrooms">Bathrooms *</label>
                  <input type="number" id="propertyBathrooms" value="${
                    property?.bathrooms ?? ""
                  }" required min="0">
                </div>
                <div class="form-group">
                  <label for="propertyArea">Area *</label>
                  <input type="text" id="propertyArea" value="${
                    property?.area ?? ""
                  }" required placeholder="e.g., 1000 sq ft">
                </div>
              </div>

              <div class="form-group">
                <label for="propertyDescription">Description</label>
                <textarea id="propertyDescription" rows="3" placeholder="Describe the property features, amenities, etc.">${
                  property?.description ?? ""
                }</textarea>
              </div>

              <div class="form-group">
                <label for="propertyFeatures">Features (comma separated)</label>
                <input type="text" id="propertyFeatures" value="${safeFeatures}" placeholder="e.g., Parking, Laundry, Gym, Pool">
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal('propertyModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">${
                  this.currentEditingId ? "Update Property" : "Add Property"
                }</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Ensure only one handler is attached (remove previous if present)
    const form = document.getElementById("propertyForm");
    if (form) {
      form.addEventListener("submit", (e) => this.handlePropertySubmit(e));
    }

    openModal("propertyModal");
  }

  // Submit add/edit
  async handlePropertySubmit(event) {
    event.preventDefault();

    const formData = {
      name: document.getElementById("propertyName").value.trim(),
      address: {
        street: document.getElementById("propertyAddress").value.trim(),
        city: document.getElementById("propertyCity").value.trim(),
        state: document.getElementById("propertyState").value.trim(),
        zipCode: document.getElementById("propertyZip").value.trim(),
      },
      rent: Number(document.getElementById("propertyRent").value),
      bedrooms: Number(document.getElementById("propertyBedrooms").value),
      bathrooms: Number(document.getElementById("propertyBathrooms").value),
      area: document.getElementById("propertyArea").value.trim(),
      description: document.getElementById("propertyDescription").value.trim(),
      features: (document.getElementById("propertyFeatures").value || "")
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0),
    };

    // Validation
    if (
      !formData.name ||
      !formData.rent ||
      !formData.address.street ||
      !formData.address.city ||
      !formData.address.state ||
      !formData.address.zipCode ||
      Number.isNaN(formData.bedrooms) ||
      Number.isNaN(formData.bathrooms) ||
      !formData.area
    ) {
      showNotification("Please fill all required fields", "error");
      return;
    }

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
      showNotification("Error saving property: " + error.message, "error");
    }
  }

  // Delete property (owner)
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

  // View details modal
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
                <p>${property.address?.street || ""}<br>${
      property.address?.city || ""
    }, ${property.address?.state || ""} ${property.address?.zipCode || ""}</p>
              </div>

              ${
                property.description
                  ? `<div class="detail-section"><h3>Description</h3><p>${property.description}</p></div>`
                  : ""
              }

              ${
                features.length
                  ? `<div class="detail-section"><h3>Features</h3><div class="features-list">${features
                      .map((f) => `<span class="feature-tag">${f}</span>`)
                      .join("")}</div></div>`
                  : ""
              }
            </div>

            <div class="modal-actions">
              ${
                currentUser && currentUser.role === "owner"
                  ? `<button class="btn btn-primary" onclick="propertiesManager.editProperty('${property._id}'); closeModal('propertyDetailsModal');">Edit Property</button>`
                  : ""
              }
              ${
                !currentUser
                  ? `<button class="btn btn-primary" onclick="openModal('loginModal'); closeModal('propertyDetailsModal');">Login to Apply</button>`
                  : ""
              }
              ${
                currentUser && currentUser.role === "tenant"
                  ? `<button class="btn btn-primary" onclick="propertiesManager.applyForProperty('${property._id}'); closeModal('propertyDetailsModal');">Apply Now</button>`
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

  // Tenant apply action (demo)
  applyForProperty(propertyId) {
    const property = this.properties.find((p) => p._id === propertyId);
    if (property) {
      showNotification(
        `Application submitted for ${property.name}! We will contact you soon.`,
        "success"
      );
    } else {
      showNotification("Property not found", "error");
    }
  }
}

// Initialize and wire into page
const propertiesManager = new PropertiesManager();

// DOM init: load properties and insert owner add-button (once)
document.addEventListener("DOMContentLoaded", function () {
  propertiesManager.loadProperties();

  if (currentUser && currentUser.role === "owner") {
    const propertiesSection = document.getElementById("properties");
    if (propertiesSection) {
      // Avoid adding duplicate add button
      if (!propertiesSection.querySelector(".owner-add-property-btn")) {
        const addButton = document.createElement("button");
        addButton.className = "btn btn-primary owner-add-property-btn";
        addButton.innerHTML = '<i class="fas fa-plus"></i> Add Property';
        addButton.style.marginBottom = "2rem";
        addButton.onclick = () => propertiesManager.openAddPropertyModal();

        const parentContainer =
          propertiesSection.querySelector(".container") || propertiesSection;
        parentContainer.insertBefore(
          addButton,
          parentContainer.querySelector("#propertiesList") ||
            parentContainer.firstChild
        );
      }
    }
  }
});

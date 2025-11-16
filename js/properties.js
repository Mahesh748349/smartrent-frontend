// Use global API_BASE from app.js
const API_BASE =
  window.API_BASE || "https://your-smartrent-backend.onrender.com/api";

// Properties management functionality
class PropertiesManager {
  constructor() {
    this.properties = [];
    this.currentEditingId = null;
  }

  // Load properties based on user role
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
        this.properties = data.properties;
        this.displayProperties();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
      showNotification("Error loading properties", "error");
    }
  }

  // Display properties in the UI
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

  // Create property card HTML
  createPropertyCard(property) {
    const isOwner = currentUser && currentUser.role === "owner";

    return `
            <div class="property-card" data-property-id="${property._id}">
                <div class="property-image">
                    <i class="fas fa-home"></i>
                </div>
                <div class="property-content">
                    <h3>${property.name}</h3>
                    <div class="property-price">$${property.rent}/month</div>
                    <p>${property.address.street}, ${property.address.city}, ${
      property.address.state
    } ${property.address.zipCode}</p>
                    
                    <div class="property-features">
                        <span><i class="fas fa-bed"></i> ${
                          property.bedrooms
                        } beds</span>
                        <span><i class="fas fa-bath"></i> ${
                          property.bathrooms
                        } baths</span>
                        <span><i class="fas fa-ruler-combined"></i> ${
                          property.area
                        }</span>
                    </div>
                    
                    ${
                      property.description
                        ? `<p class="property-description">${property.description}</p>`
                        : ""
                    }
                    
                    ${
                      property.features && property.features.length > 0
                        ? `
                        <div class="property-tags">
                            ${property.features
                              .map(
                                (feature) =>
                                  `<span class="tag">${feature}</span>`
                              )
                              .join("")}
                        </div>
                    `
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
                                <i class="fas fa-edit"></i> Apply Now
                            </button>
                        `
                            : `
                            <button class="btn btn-primary" onclick="openModal('loginModal')">
                                <i class="fas fa-edit"></i> Login to Apply
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

  // Empty state HTML
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

  // Open add property modal
  openAddPropertyModal() {
    this.currentEditingId = null;
    this.openPropertyModal("Add New Property");
  }

  // Open edit property modal
  editProperty(propertyId) {
    const property = this.properties.find((p) => p._id === propertyId);
    if (property) {
      this.currentEditingId = propertyId;
      this.openPropertyModal("Edit Property", property);
    }
  }

  // Open property modal with data - FIXED SCROLLABLE VERSION
  openPropertyModal(title, property = null) {
    // Create modal HTML with scrollable content
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
                                      property ? property.name : ""
                                    }" required>
                                </div>
                                <div class="form-group">
                                    <label for="propertyRent">Monthly Rent ($) *</label>
                                    <input type="number" id="propertyRent" value="${
                                      property ? property.rent : ""
                                    }" required min="0">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="propertyAddress">Street Address *</label>
                                <input type="text" id="propertyAddress" value="${
                                  property ? property.address.street : ""
                                }" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="propertyCity">City *</label>
                                    <input type="text" id="propertyCity" value="${
                                      property ? property.address.city : ""
                                    }" required>
                                </div>
                                <div class="form-group">
                                    <label for="propertyState">State *</label>
                                    <input type="text" id="propertyState" value="${
                                      property ? property.address.state : ""
                                    }" required>
                                </div>
                                <div class="form-group">
                                    <label for="propertyZip">ZIP Code *</label>
                                    <input type="text" id="propertyZip" value="${
                                      property ? property.address.zipCode : ""
                                    }" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="propertyBedrooms">Bedrooms *</label>
                                    <input type="number" id="propertyBedrooms" value="${
                                      property ? property.bedrooms : ""
                                    }" required min="0">
                                </div>
                                <div class="form-group">
                                    <label for="propertyBathrooms">Bathrooms *</label>
                                    <input type="number" id="propertyBathrooms" value="${
                                      property ? property.bathrooms : ""
                                    }" required min="0">
                                </div>
                                <div class="form-group">
                                    <label for="propertyArea">Area *</label>
                                    <input type="text" id="propertyArea" value="${
                                      property ? property.area : ""
                                    }" required placeholder="e.g., 1000 sq ft">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="propertyDescription">Description</label>
                                <textarea id="propertyDescription" rows="3" placeholder="Describe the property features, amenities, etc.">${
                                  property ? property.description : ""
                                }</textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="propertyFeatures">Features (comma separated)</label>
                                <input type="text" id="propertyFeatures" value="${
                                  property ? property.features.join(", ") : ""
                                }" placeholder="e.g., Parking, Laundry, Gym, Pool">
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="closeModal('propertyModal')">Cancel</button>
                                <button type="submit" class="btn btn-primary">${
                                  this.currentEditingId
                                    ? "Update Property"
                                    : "Add Property"
                                }</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

    // Add modal to page
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add form submit handler
    document
      .getElementById("propertyForm")
      .addEventListener("submit", (e) => this.handlePropertySubmit(e));

    // Open modal
    openModal("propertyModal");
  }

  // Handle property form submission
  async handlePropertySubmit(event) {
    event.preventDefault();

    const formData = {
      name: document.getElementById("propertyName").value,
      address: {
        street: document.getElementById("propertyAddress").value,
        city: document.getElementById("propertyCity").value,
        state: document.getElementById("propertyState").value,
        zipCode: document.getElementById("propertyZip").value,
      },
      rent: Number(document.getElementById("propertyRent").value),
      bedrooms: Number(document.getElementById("propertyBedrooms").value),
      bathrooms: Number(document.getElementById("propertyBathrooms").value),
      area: document.getElementById("propertyArea").value,
      description: document.getElementById("propertyDescription").value,
      features: document
        .getElementById("propertyFeatures")
        .value.split(",")
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
      !formData.bedrooms ||
      !formData.bathrooms ||
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
        method: method,
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
        await this.loadProperties(); // Reload properties
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error saving property:", error);
      showNotification("Error saving property: " + error.message, "error");
    }
  }

  // Delete property
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
        await this.loadProperties(); // Reload properties
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      showNotification("Error deleting property: " + error.message, "error");
    }
  }

  // View property details
  viewProperty(propertyId) {
    const property = this.properties.find((p) => p._id === propertyId);
    if (property) {
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
                                        <div class="detail-item">
                                            <strong>Rent:</strong> $${
                                              property.rent
                                            }/month
                                        </div>
                                        <div class="detail-item">
                                            <strong>Bedrooms:</strong> ${
                                              property.bedrooms
                                            }
                                        </div>
                                        <div class="detail-item">
                                            <strong>Bathrooms:</strong> ${
                                              property.bathrooms
                                            }
                                        </div>
                                        <div class="detail-item">
                                            <strong>Area:</strong> ${
                                              property.area
                                            }
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="detail-section">
                                    <h3>Address</h3>
                                    <p>${property.address.street}<br>
                                    ${property.address.city}, ${
        property.address.state
      } ${property.address.zipCode}</p>
                                </div>
                                
                                ${
                                  property.description
                                    ? `
                                    <div class="detail-section">
                                        <h3>Description</h3>
                                        <p>${property.description}</p>
                                    </div>
                                `
                                    : ""
                                }
                                
                                ${
                                  property.features &&
                                  property.features.length > 0
                                    ? `
                                    <div class="detail-section">
                                        <h3>Features</h3>
                                        <div class="features-list">
                                            ${property.features
                                              .map(
                                                (feature) =>
                                                  `<span class="feature-tag">${feature}</span>`
                                              )
                                              .join("")}
                                        </div>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                            
                            <div class="modal-actions">
                                ${
                                  currentUser && currentUser.role === "owner"
                                    ? `
                                    <button class="btn btn-primary" onclick="propertiesManager.editProperty('${property._id}'); closeModal('propertyDetailsModal');">
                                        Edit Property
                                    </button>
                                `
                                    : !currentUser
                                    ? `<button class="btn btn-primary" onclick="openModal('loginModal'); closeModal('propertyDetailsModal');">Login to Apply</button>`
                                    : currentUser.role === "tenant"
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
  }

  // Apply for property (tenant)
  applyForProperty(propertyId) {
    const property = this.properties.find((p) => p._id === propertyId);
    if (property) {
      showNotification(
        `Application submitted for ${property.name}! We will contact you soon.`,
        "success"
      );
    }
  }
}

// Initialize properties manager
const propertiesManager = new PropertiesManager();

// Update main app.js to use properties manager
document.addEventListener("DOMContentLoaded", function () {
  // Load properties using the manager
  propertiesManager.loadProperties();

  // Add property button for owners on main page
  if (currentUser && currentUser.role === "owner") {
    const propertiesSection = document.getElementById("properties");
    if (propertiesSection) {
      const addButton = document.createElement("button");
      addButton.className = "btn btn-primary";
      addButton.innerHTML = '<i class="fas fa-plus"></i> Add Property';
      addButton.style.marginBottom = "2rem";
      addButton.onclick = () => propertiesManager.openAddPropertyModal();

      propertiesSection
        .querySelector(".container")
        .insertBefore(
          addButton,
          propertiesSection.querySelector("#propertiesList")
        );
    }
  }
});

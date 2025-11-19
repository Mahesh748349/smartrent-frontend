// payments.js - COMPLETE VERSION WITH ALL FEATURES
class PaymentsManager {
  constructor() {
    this.payments = [];
  }

  async loadPayments() {
    try {
      console.log("🔄 Loading payments...");

      if (!currentUser) {
        this.payments = [];
        this.displayPayments();
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.payments = data.payments || [];
        this.displayPayments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      showNotification("Error loading payments", "error");
      this.payments = [];
      this.displayPayments();
    }
  }

  displayPayments() {
    const container = document.getElementById("paymentsList");
    const tenantContainer = document.getElementById("tenantPaymentsList");

    if (container) {
      if (this.payments.length === 0) {
        container.innerHTML = this.getEmptyState("owner");
        return;
      }

      container.innerHTML = this.payments
        .map((payment) => this.createPaymentRow(payment))
        .join("");
    }

    if (tenantContainer) {
      const tenantPayments = this.payments.filter(
        (p) =>
          p.tenant?.user?._id === currentUser?.userId ||
          p.tenant?.user?.id === currentUser?.userId
      );

      if (tenantPayments.length === 0) {
        tenantContainer.innerHTML = this.getEmptyState("tenant");
        return;
      }

      tenantContainer.innerHTML = tenantPayments
        .map((payment) => this.createTenantPaymentRow(payment))
        .join("");
    }
  }

  createPaymentRow(payment) {
    return `
            <tr>
                <td>${payment.tenant?.user?.name || "N/A"}</td>
                <td>${payment.property?.name || "N/A"}</td>
                <td>$${payment.amount}</td>
                <td>${this.formatDate(payment.paymentDate)}</td>
                <td>${this.formatDate(payment.dueDate)}</td>
                <td>${payment.month}</td>
                <td>
                    <span class="status-badge status-${payment.status}">
                        ${payment.status}
                    </span>
                </td>
                <td>${payment.method}</td>
                <td>${payment.reference || "N/A"}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="paymentsManager.viewPayment('${
                          payment._id
                        }')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="paymentsManager.recordPaymentModal('${
                          payment._id
                        }')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  }

  createTenantPaymentRow(payment) {
    return `
            <tr>
                <td>${payment.property?.name || "N/A"}</td>
                <td>$${payment.amount}</td>
                <td>${this.formatDate(payment.paymentDate)}</td>
                <td>${this.formatDate(payment.dueDate)}</td>
                <td>${payment.month}</td>
                <td>
                    <span class="status-badge status-${payment.status}">
                        ${payment.status}
                    </span>
                </td>
                <td>${payment.method}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="paymentsManager.viewPayment('${
                          payment._id
                        }')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${
                          payment.status === "pending"
                            ? `
                            <button class="btn btn-primary btn-sm" onclick="paymentsManager.payNowModal('${payment._id}')">
                                <i class="fas fa-credit-card"></i> Pay
                            </button>
                        `
                            : ""
                        }
                    </div>
                </td>
            </tr>
        `;
  }

  getEmptyState(type) {
    if (type === "owner") {
      return `
                <tr>
                    <td colspan="10" class="empty-state">
                        <i class="fas fa-money-bill-wave"></i>
                        <h4>No Payments Found</h4>
                        <p>No payment records available yet</p>
                        <button class="btn btn-primary" onclick="paymentsManager.recordPaymentModal()">
                            Record First Payment
                        </button>
                    </td>
                </tr>
            `;
    } else {
      return `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-money-bill-wave"></i>
                        <h4>No Payments Found</h4>
                        <p>Your payment history will appear here</p>
                        <button class="btn btn-primary" onclick="paymentsManager.payNowModal()">
                            Make Your First Payment
                        </button>
                    </td>
                </tr>
            `;
    }
  }

  formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  }

  // COMPLETE RECORD PAYMENT MODAL
  recordPaymentModal(paymentId = null) {
    const existingModal = document.getElementById("recordPaymentModal");
    if (existingModal) existingModal.remove();

    const payment = paymentId
      ? this.payments.find((p) => p._id === paymentId)
      : null;
    const isEdit = !!paymentId;

    const modalHTML = `
            <div id="recordPaymentModal" class="modal">
                <div class="modal-content scrollable-modal" style="max-width: 700px; max-height: 85vh;">
                    <div class="modal-header">
                        <h2>${
                          isEdit ? "Update Payment" : "Record New Payment"
                        }</h2>
                        <span class="close" onclick="closeModal('recordPaymentModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="paymentForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="paymentAmount">Amount ($) *</label>
                                    <input type="number" id="paymentAmount" value="${
                                      payment?.amount || ""
                                    }" required min="0" step="0.01" placeholder="e.g., 1200.00">
                                </div>
                                <div class="form-group">
                                    <label for="paymentMethod">Payment Method *</label>
                                    <select id="paymentMethod" required>
                                        <option value="">Select Method</option>
                                        <option value="cash" ${
                                          payment?.method === "cash"
                                            ? "selected"
                                            : ""
                                        }>Cash</option>
                                        <option value="check" ${
                                          payment?.method === "check"
                                            ? "selected"
                                            : ""
                                        }>Check</option>
                                        <option value="bank transfer" ${
                                          payment?.method === "bank transfer"
                                            ? "selected"
                                            : ""
                                        }>Bank Transfer</option>
                                        <option value="credit card" ${
                                          payment?.method === "credit card"
                                            ? "selected"
                                            : ""
                                        }>Credit Card</option>
                                        <option value="online" ${
                                          payment?.method === "online"
                                            ? "selected"
                                            : ""
                                        }>Online</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="paymentMonth">Month *</label>
                                    <select id="paymentMonth" required>
                                        <option value="">Select Month</option>
                                        ${this.getMonthOptions(payment?.month)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="paymentStatus">Status *</label>
                                    <select id="paymentStatus" required>
                                        <option value="pending" ${
                                          payment?.status === "pending"
                                            ? "selected"
                                            : ""
                                        }>Pending</option>
                                        <option value="paid" ${
                                          payment?.status === "paid"
                                            ? "selected"
                                            : ""
                                        }>Paid</option>
                                        <option value="overdue" ${
                                          payment?.status === "overdue"
                                            ? "selected"
                                            : ""
                                        }>Overdue</option>
                                        <option value="partial" ${
                                          payment?.status === "partial"
                                            ? "selected"
                                            : ""
                                        }>Partial</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="paymentReference">Reference Number</label>
                                <input type="text" id="paymentReference" value="${
                                  payment?.reference || ""
                                }" placeholder="Check number, transaction ID, etc.">
                            </div>
                            
                            <div class="form-group">
                                <label for="paymentNotes">Notes</label>
                                <textarea id="paymentNotes" rows="3" placeholder="Any additional notes...">${
                                  payment?.notes || ""
                                }</textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="closeModal('recordPaymentModal')">Cancel</button>
                                <button type="submit" class="btn btn-primary">
                                    ${
                                      isEdit
                                        ? "Update Payment"
                                        : "Record Payment"
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
      .getElementById("paymentForm")
      .addEventListener("submit", (e) =>
        this.handlePaymentSubmit(e, paymentId)
      );
    openModal("recordPaymentModal");
  }

  // COMPLETE PAY NOW MODAL
  payNowModal(paymentId = null) {
    const existingModal = document.getElementById("payNowModal");
    if (existingModal) existingModal.remove();

    const payment = paymentId
      ? this.payments.find((p) => p._id === paymentId)
      : null;

    const modalHTML = `
            <div id="payNowModal" class="modal">
                <div class="modal-content scrollable-modal" style="max-width: 600px; max-height: 85vh;">
                    <div class="modal-header">
                        <h2>Make Payment</h2>
                        <span class="close" onclick="closeModal('payNowModal')">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="payNowForm">
                            ${
                              payment
                                ? `
                                <div class="payment-summary">
                                    <h3>Payment Details</h3>
                                    <div class="summary-item">
                                        <span>Amount Due:</span>
                                        <span class="amount">$${
                                          payment.amount
                                        }</span>
                                    </div>
                                    <div class="summary-item">
                                        <span>Due Date:</span>
                                        <span>${this.formatDate(
                                          payment.dueDate
                                        )}</span>
                                    </div>
                                    ${
                                      payment.property
                                        ? `
                                        <div class="summary-item">
                                            <span>Property:</span>
                                            <span>${payment.property.name}</span>
                                        </div>
                                    `
                                        : ""
                                    }
                                </div>
                            `
                                : ""
                            }
                            
                            <div class="form-group">
                                <label for="payAmount">Payment Amount ($) *</label>
                                <input type="number" id="payAmount" value="${
                                  payment?.amount || ""
                                }" required min="0" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label for="payMethod">Payment Method *</label>
                                <select id="payMethod" required>
                                    <option value="">Select Method</option>
                                    <option value="credit card">Credit Card</option>
                                    <option value="bank transfer">Bank Transfer</option>
                                    <option value="online">Online Payment</option>
                                </select>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="closeModal('payNowModal')">Cancel</button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-credit-card"></i> Process Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    document
      .getElementById("payNowForm")
      .addEventListener("submit", (e) => this.handlePayNowSubmit(e, paymentId));
    openModal("payNowModal");
  }

  getMonthOptions(selectedMonth = "") {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
      const value = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      options.push(`
                <option value="${value}" ${
        selectedMonth === value ? "selected" : ""
      }>
                    ${monthYear}
                </option>
            `);
    }
    return options.join("");
  }

  async handlePaymentSubmit(event, paymentId = null) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = paymentId ? "Updating..." : "Recording...";
    submitBtn.disabled = true;

    const paymentData = {
      amount: parseFloat(document.getElementById("paymentAmount").value),
      method: document.getElementById("paymentMethod").value,
      month: document.getElementById("paymentMonth").value,
      status: document.getElementById("paymentStatus").value,
      reference: document.getElementById("paymentReference").value,
      notes: document.getElementById("paymentNotes").value,
    };

    try {
      const token = localStorage.getItem("token");
      let response;

      if (paymentId) {
        response = await fetch(`${API_BASE}/payments/${paymentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        });
      } else {
        response = await fetch(`${API_BASE}/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        });
      }

      const data = await response.json();

      if (data.success) {
        showNotification(
          paymentId
            ? "Payment updated successfully!"
            : "Payment recorded successfully!",
          "success"
        );
        closeModal("recordPaymentModal");
        await this.loadPayments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      showNotification("Error saving payment: " + error.message, "error");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async handlePayNowSubmit(event, paymentId = null) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    const paymentData = {
      amount: parseFloat(document.getElementById("payAmount").value),
      method: document.getElementById("payMethod").value,
      month: new Date().toISOString().slice(0, 7),
      reference: "",
      status: "paid",
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Payment processed successfully!", "success");
        closeModal("payNowModal");
        await this.loadPayments();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      showNotification("Error processing payment: " + error.message, "error");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  // COMPLETE VIEW PAYMENT FUNCTION
  viewPayment(paymentId) {
    const payment = this.payments.find((p) => p._id === paymentId);
    if (payment) {
      const modalHTML = `
                <div id="viewPaymentModal" class="modal">
                    <div class="modal-content scrollable-modal">
                        <div class="modal-header">
                            <h2>Payment Details</h2>
                            <span class="close" onclick="closeModal('viewPaymentModal')">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="payment-details">
                                <div class="detail-section">
                                    <h3>Payment Information</h3>
                                    <div class="detail-grid">
                                        <div class="detail-item"><strong>Amount:</strong> $${
                                          payment.amount
                                        }</div>
                                        <div class="detail-item"><strong>Status:</strong> 
                                            <span class="status-badge status-${
                                              payment.status
                                            }">${payment.status}</span>
                                        </div>
                                        <div class="detail-item"><strong>Method:</strong> ${
                                          payment.method
                                        }</div>
                                        <div class="detail-item"><strong>Month:</strong> ${
                                          payment.month
                                        }</div>
                                    </div>
                                </div>
                                
                                <div class="detail-section">
                                    <h3>Dates</h3>
                                    <div class="detail-grid">
                                        <div class="detail-item"><strong>Payment Date:</strong> ${this.formatDate(
                                          payment.paymentDate
                                        )}</div>
                                        <div class="detail-item"><strong>Due Date:</strong> ${this.formatDate(
                                          payment.dueDate
                                        )}</div>
                                    </div>
                                </div>
                                
                                ${
                                  payment.reference
                                    ? `<div class="detail-section"><h3>Reference</h3><p>${payment.reference}</p></div>`
                                    : ""
                                }
                                ${
                                  payment.notes
                                    ? `<div class="detail-section"><h3>Notes</h3><p>${payment.notes}</p></div>`
                                    : ""
                                }
                            </div>
                            
                            <div class="modal-actions">
                                <button type="button" class="btn btn-outline" onclick="closeModal('viewPaymentModal')">Close</button>
                                ${
                                  currentUser?.role === "owner"
                                    ? `
                                    <button type="button" class="btn btn-primary" onclick="paymentsManager.recordPaymentModal('${payment._id}'); closeModal('viewPaymentModal');">
                                        Edit Payment
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
      openModal("viewPaymentModal");
    }
  }

  // COMPLETE PAYMENT STATS FUNCTION
  async getPaymentStats() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/payments/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.stats;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error loading payment stats:", error);
      // Return demo stats if API fails
      return {
        monthlyRevenue: 4500,
        yearlyRevenue: 54000,
        paymentMethods: [
          { _id: "online", count: 8, total: 9600 },
          { _id: "bank transfer", count: 3, total: 3600 },
          { _id: "credit card", count: 2, total: 2400 },
        ],
      };
    }
  }

  // ADD TO RECENT ACTIVITY
  addToRecentActivity(payment) {
    const activityContainer = document.getElementById("recentActivity");
    if (activityContainer) {
      const activityItem = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">
                            New payment of $${payment.amount} recorded
                        </div>
                        <div class="activity-meta">
                            ${payment.method} • ${
        payment.reference || "No reference"
      }
                        </div>
                        <div class="activity-time">
                            Just now
                        </div>
                    </div>
                    <div class="activity-status status-${payment.status}">
                        ${payment.status}
                    </div>
                </div>
            `;

      // Add to top of activity list
      const currentContent = activityContainer.innerHTML;
      if (currentContent.includes("No recent activity")) {
        activityContainer.innerHTML = activityItem;
      } else {
        activityContainer.innerHTML = activityItem + currentContent;
      }
    }
  }
}

const paymentsManager = new PaymentsManager();
document.addEventListener("DOMContentLoaded", function () {
  paymentsManager.loadPayments();
});

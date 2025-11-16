// Authentication functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔐 Auth system initializing...");

  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    console.log("✅ Login form handler attached");
  } else {
    console.error("❌ Login form not found!");
  }

  // Registration form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
    console.log("✅ Register form handler attached");
  } else {
    console.error("❌ Register form not found!");
  }
});

// Handle login
async function handleLogin(event) {
  event.preventDefault();
  console.log("🔑 Login form submitted");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("📝 Login attempt:", email);

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("📡 Login response status:", response.status);
    const data = await response.json();
    console.log("📦 Login response data:", data);

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showNotification("✅ " + data.message, "success");
      closeModal("loginModal");
      updateUIForLoggedInUser();
      loadProperties();

      console.log("✅ Login successful:", currentUser.name);
    } else {
      console.error("❌ Login failed:", data.message);
      showNotification("❌ " + data.message, "error");
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    showNotification("❌ Login failed. Please try again.", "error");
  }
}

// Handle registration
async function handleRegister(event) {
  event.preventDefault();
  console.log("📝 Register form submitted");

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;
  const phone = document.getElementById("regPhone").value;

  console.log("📝 Registration data:", { name, email, role, phone });

  // Basic validation
  if (!name || !email || !password || !role) {
    showNotification("❌ Please fill all required fields", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role, phone }),
    });

    console.log("📡 Register response status:", response.status);
    const data = await response.json();
    console.log("📦 Register response data:", data);

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showNotification("✅ " + data.message, "success");
      closeModal("registerModal");
      updateUIForLoggedInUser();
      loadProperties();

      console.log("✅ Registration successful:", currentUser.name);
    } else {
      console.error("❌ Registration failed:", data.message);
      showNotification("❌ " + data.message, "error");
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    showNotification(
      "❌ Registration failed. Please check your connection.",
      "error"
    );
  }
}
// Handle registration - DEBUG VERSION
async function handleRegister(event) {
  event.preventDefault();
  console.log("📝 Register form submitted");

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;
  const phone = document.getElementById("regPhone").value;

  console.log("📝 Registration data:", { name, email, role, phone });

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Registering...";
  submitBtn.disabled = true;

  try {
    console.log(
      "🔄 Sending registration request to:",
      `${API_BASE}/auth/register`
    );

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role, phone }),
    });

    console.log("📡 Register response status:", response.status);
    console.log("📡 Register response ok:", response.ok);

    const data = await response.json();
    console.log("📦 Register response data:", data);

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    if (data.success === true) {
      console.log("✅ Registration SUCCESS in frontend");
      currentUser = data.user;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showNotification(
        "✅ " + (data.message || "Registration successful!"),
        "success"
      );
      closeModal("registerModal");
      updateUIForLoggedInUser();
      loadProperties();

      // Clear form
      document.getElementById("registerForm").reset();

      console.log("✅ User logged in:", currentUser.name);
    } else {
      console.error("❌ Registration failed in response:", data.message);
      showNotification(
        "❌ " + (data.message || "Registration failed"),
        "error"
      );
    }
  } catch (error) {
    console.error("❌ Registration network error:", error);

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    showNotification(
      "❌ Registration failed. Please check your connection.",
      "error"
    );
  }
}

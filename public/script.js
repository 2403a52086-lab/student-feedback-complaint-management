// Show Selected Form
function showForm(formId) {
    document.querySelectorAll(".form-box").forEach(function(form) {
        form.style.display = "none";
    });

    const selectedForm = document.getElementById(formId);
    if (selectedForm) {
        selectedForm.style.display = "block";
        selectedForm.scrollIntoView({ behavior: "smooth" });
    }
}

// Student Registration
const registerForm = document.getElementById("studentRegisterForm");

registerForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const student = {
        name: formData.get("name").trim(),
        rollNumber: formData.get("rollNumber").trim(),
        email: formData.get("email").trim(),
        password: formData.get("password")
    };

    const message = document.getElementById("registerMessage");
    message.textContent = "Registering...";

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student)
        });

        const result = await response.json();
        message.textContent = result.message;

        if (response.ok) registerForm.reset();
    } catch (error) {
        message.textContent = "Unable to connect to the server.";
        console.error(error);
    }
});

// Student Login
const loginForm = document.getElementById("studentLoginForm");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const loginDetails = {
        email: formData.get("email").trim(),
        password: formData.get("password")
    };

    const message = document.getElementById("loginMessage");
    message.textContent = "Checking login details...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginDetails)
        });

        const result = await response.json();
        message.textContent = result.message;

        if (response.ok) {
            sessionStorage.setItem("student", JSON.stringify(result.student));
            window.location.href = "/dashboard.html";
        }
    } catch (error) {
        message.textContent = "Unable to connect to the server.";
        console.error(error);
    }
});

// Admin Login
const adminForm = document.getElementById("adminLoginForm");

adminForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const message = document.getElementById("adminMessage");

    message.textContent = "Checking admin details...";

    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        message.textContent = result.message;

        if (response.ok) {
            sessionStorage.setItem("isAdmin", "true");
            window.location.href = "/admin.html";
        }
    } catch (error) {
        message.textContent = "Unable to connect to server.";
        console.error(error);
    }
});

// Admin Registration
const adminRegisterForm = document.getElementById("adminRegisterForm");

adminRegisterForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const admin = {
        name: document.getElementById("newAdminName").value.trim(),
        email: document.getElementById("newAdminEmail").value.trim(),
        password: document.getElementById("newAdminPassword").value
    };

    const message = document.getElementById("adminRegisterMessage");
    message.textContent = "Creating admin account...";

    try {
        const response = await fetch("/api/admin/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(admin)
        });

        const result = await response.json();
        message.textContent = result.message;

        if (response.ok) {
            adminRegisterForm.reset();
            setTimeout(function() {
                showForm("adminLoginFormBox");
            }, 1500);
        }
    } catch (error) {
        message.textContent = "Unable to connect to server.";
        console.error(error);
    }
});

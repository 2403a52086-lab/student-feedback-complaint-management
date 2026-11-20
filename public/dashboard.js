// Get Logged-in Student
const student = JSON.parse(sessionStorage.getItem("student"));

if (!student) {
    window.location.href = "index.html";
} else {
    document.getElementById("studentName").textContent = student.name;
}

// Logout
function logout() {
    sessionStorage.removeItem("student");
    window.location.href = "index.html";
}

// Dashboard Section Navigation
function showDashboardSection(sectionId) {
    document.querySelectorAll(".dashboard .form-box").forEach(function(section) {
        section.style.display = "none";
    });

    document.getElementById(sectionId).style.display = "block";
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth", block: "start" });
}

// Submit Complaint
const complaintForm = document.getElementById("complaintForm");

complaintForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const complaint = {
        title: document.getElementById("complaintTitle").value.trim(),
        category: document.getElementById("complaintCategory").value,
        description: document.getElementById("complaintDescription").value.trim(),
        studentEmail: student.email
    };

    const message = document.getElementById("complaintMessage");
    message.textContent = "Submitting complaint...";

    try {
        const response = await fetch("/api/complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(complaint)
        });

        const result = await response.json();
        message.textContent = result.message;

        if (response.ok) {
            complaintForm.reset();
            loadMyComplaints();
        }
    } catch (error) {
        message.textContent = "Unable to connect to server.";
        console.error(error);
    }
});

// Display My Complaints
async function loadMyComplaints() {
    const complaintsList = document.getElementById("complaintsList");
    complaintsList.innerHTML = "<p>Loading complaints...</p>";

    try {
        const response = await fetch(
            "/api/my-complaints?email=" + encodeURIComponent(student.email)
        );

        const complaints = await response.json();

        if (!response.ok) {
            complaintsList.textContent = complaints.message;
            return;
        }

        if (complaints.length === 0) {
            complaintsList.innerHTML = "<p>No complaints submitted yet.</p>";
            return;
        }

        complaintsList.innerHTML = "";

        complaints.forEach(function(complaint) {
            const card = document.createElement("div");
            card.className = "complaint-card";

            const title = document.createElement("h3");
            title.textContent = complaint.title;

            const id = document.createElement("p");
            id.textContent = "Complaint ID: " + complaint.id;

            const category = document.createElement("p");
            category.textContent = "Category: " + complaint.category;

            const description = document.createElement("p");
            description.textContent = "Description: " + complaint.description;

            const status = document.createElement("p");
            status.textContent = "Current Status: " + complaint.status;

            const priority = document.createElement("p");
            const currentPriority = complaint.priority || "Medium";
            priority.textContent = "Priority: " + currentPriority;
            priority.style.fontWeight = "bold";
            priority.style.color = currentPriority === "High" ? "red" :
                currentPriority === "Medium" ? "#d97706" : "green";

            const remarks = document.createElement("p");
            remarks.textContent = "Admin Remarks: " + (complaint.adminRemarks || "No remarks yet.");

            const historyTitle = document.createElement("h4");
            historyTitle.textContent = "Complaint Status History";

            const historyBox = document.createElement("div");
            historyBox.className = "history-box";

            const history = complaint.statusHistory || [];
            history.forEach(function(item, index) {
                const historyItem = document.createElement("p");
                const historyDate = item.changedAt
                    ? new Date(item.changedAt).toLocaleString()
                    : "Previous date not recorded";

                historyItem.textContent =
                    (index + 1) + ". " + item.status + " - " + historyDate;

                if (index === history.length - 1) {
                    historyItem.classList.add("latest-history");
                }
                historyBox.appendChild(historyItem);
            });

            const date = document.createElement("p");
            date.textContent = "Submitted: " + new Date(complaint.createdAt).toLocaleString();

            card.append(title, id, category, description, status, priority,
                historyTitle, historyBox, remarks, date);

            complaintsList.appendChild(card);
        });
    } catch (error) {
        complaintsList.textContent = "Unable to load complaints.";
        console.error(error);
    }
}

// Submit Feedback
const feedbackForm = document.getElementById("feedbackForm");

feedbackForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const feedback = {
        studentName: student.name,
        studentEmail: student.email,
        rollNumber: student.rollNumber,
        feedbackType: document.getElementById("feedbackType").value,
        subject: document.getElementById("feedbackSubject").value.trim(),
        facultyName: document.getElementById("facultyName").value.trim(),
        rating: document.getElementById("feedbackRating").value,
        comments: document.getElementById("feedbackComments").value.trim()
    };

    const message = document.getElementById("feedbackMessage");
    message.textContent = "Submitting feedback...";

    try {
        const response = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feedback)
        });

        const result = await response.json();
        message.textContent = result.message;

        if (response.ok) {
            feedbackForm.reset();
            loadMyFeedback();
        }
    } catch (error) {
        message.textContent = "Unable to connect to server.";
        console.error(error);
    }
});

// Load My Feedback
async function loadMyFeedback() {
    const feedbackList = document.getElementById("feedbackList");
    feedbackList.innerHTML = "<p>Loading feedback...</p>";

    try {
        const response = await fetch(
            "/api/my-feedback?email=" + encodeURIComponent(student.email)
        );

        const feedbackItems = await response.json();

        if (!response.ok) {
            feedbackList.textContent = feedbackItems.message;
            return;
        }

        if (feedbackItems.length === 0) {
            feedbackList.innerHTML = "<p>No feedback submitted yet.</p>";
            return;
        }

        feedbackList.innerHTML = "";

        feedbackItems.slice().reverse().forEach(function(item) {
            const card = document.createElement("div");
            card.className = "complaint-card feedback-card";

            const heading = document.createElement("h3");
            heading.textContent = item.feedbackType + " Feedback";

            const rating = document.createElement("p");
            rating.textContent = "Rating: " + "★".repeat(item.rating) +
                "☆".repeat(5 - item.rating) + " (" + item.rating + "/5)";

            const subject = document.createElement("p");
            subject.textContent = "Subject: " + (item.subject || "Not specified");

            const faculty = document.createElement("p");
            faculty.textContent = "Faculty: " + (item.facultyName || "Not specified");

            const comments = document.createElement("p");
            comments.textContent = "Comments: " + item.comments;

            const date = document.createElement("p");
            date.textContent = "Submitted: " + new Date(item.createdAt).toLocaleString();

            card.append(heading, rating, subject, faculty, comments, date);
            feedbackList.appendChild(card);
        });
    } catch (error) {
        feedbackList.textContent = "Unable to load feedback.";
        console.error(error);
    }
}

// Load complaints when dashboard opens
loadMyComplaints();

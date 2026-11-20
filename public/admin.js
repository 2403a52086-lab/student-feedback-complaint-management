
// Check Admin Login
if (sessionStorage.getItem("isAdmin") !== "true") {
    window.location.href = "index.html";
}

let allComplaints = [];
let allFeedback = [];

let statusChart = null;
let categoryChart = null;
let priorityChart = null;
let feedbackCategoryChart = null;
let ratingChart = null;
let largeChart = null;

// Admin Logout
function adminLogout() {
    sessionStorage.removeItem("isAdmin");
    window.location.href = "index.html";
}

// Load Complaints and Feedback
async function loadAdminData() {
    await loadAllComplaints();
    await loadAllFeedback();
}

// Load All Complaints
async function loadAllComplaints() {
    const complaintsList = document.getElementById("adminComplaintsList");

    try {
        const response = await fetch("/api/admin/complaints");
        const complaints = await response.json();

        if (!response.ok) {
            complaintsList.textContent =
                complaints.message || "Unable to load complaints.";
            return;
        }

        allComplaints = complaints;

        document.getElementById("totalComplaints").textContent =
            complaints.length;

        document.getElementById("pendingComplaints").textContent =
            complaints.filter(c => c.status === "Pending").length;

        document.getElementById("resolvedComplaints").textContent =
            complaints.filter(c => c.status === "Resolved").length;

        updateComplaintCharts();
        displayComplaints();

    } catch (error) {
        complaintsList.textContent = "Unable to load complaints.";
        console.error(error);
    }
}

// Complaint Analytics Charts
function updateComplaintCharts() {
    const pending = allComplaints.filter(
        c => c.status === "Pending"
    ).length;

    const inProgress = allComplaints.filter(
        c => c.status === "In Progress"
    ).length;

    const resolved = allComplaints.filter(
        c => c.status === "Resolved"
    ).length;

    const categories = ["Academic", "Hostel", "Facilities", "Other"];

    const categoryCounts = categories.map(category =>
        allComplaints.filter(c => c.category === category).length
    );

    const high = allComplaints.filter(
        c => (c.priority || "Medium") === "High"
    ).length;

    const medium = allComplaints.filter(
        c => (c.priority || "Medium") === "Medium"
    ).length;

    const low = allComplaints.filter(
        c => (c.priority || "Medium") === "Low"
    ).length;

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(
        document.getElementById("statusChart"),
        {
            type: "pie",
            data: {
                labels: ["Pending", "In Progress", "Resolved"],
                datasets: [{
                    data: [pending, inProgress, resolved],
                    backgroundColor: [
                        "#f39c12",
                        "#3498db",
                        "#2ecc71"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        }
    );

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(
        document.getElementById("categoryChart"),
        {
            type: "bar",
            data: {
                labels: categories,
                datasets: [{
                    label: "Number of Complaints",
                    data: categoryCounts,
                    backgroundColor: [
                        "#3498db",
                        "#9b59b6",
                        "#e67e22",
                        "#2ecc71"
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        }
    );

    if (priorityChart) priorityChart.destroy();

    priorityChart = new Chart(
        document.getElementById("priorityChart"),
        {
            type: "bar",
            data: {
                labels: ["High", "Medium", "Low"],
                datasets: [{
                    label: "Number of Complaints",
                    data: [high, medium, low],
                    backgroundColor: [
                        "#e74c3c",
                        "#f39c12",
                        "#2ecc71"
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        }
    );
}

// Display and Filter Complaints
function displayComplaints() {
    const searchText = document.getElementById(
        "searchComplaint"
    ).value.toLowerCase();

    const selectedStatus = document.getElementById(
        "statusFilter"
    ).value;

    const selectedCategory = document.getElementById(
        "categoryFilter"
    ).value;

    const selectedPriority = document.getElementById(
        "priorityFilter"
    ).value;

    const filteredComplaints = allComplaints.filter(function(c) {
        const searchData = [
            c.id,
            c.studentEmail,
            c.title,
            c.category,
            c.description
        ].join(" ").toLowerCase();

        return searchData.includes(searchText) &&
            (selectedStatus === "All" || c.status === selectedStatus) &&
            (selectedCategory === "All" || c.category === selectedCategory) &&
            (selectedPriority === "All" ||
                (c.priority || "Medium") === selectedPriority);
    });

    const complaintsList = document.getElementById(
        "adminComplaintsList"
    );

    complaintsList.innerHTML = "";

    document.getElementById(
        "complaintResultCount"
    ).textContent =
        "Showing " + filteredComplaints.length +
        " of " + allComplaints.length + " complaints";

    if (filteredComplaints.length === 0) {
        complaintsList.textContent = "No matching complaints found.";
        return;
    }

    filteredComplaints.forEach(function(complaint) {
        const card = document.createElement("div");
        card.className = "complaint-card";

        const title = document.createElement("h3");
        title.textContent = complaint.title;

        const id = document.createElement("p");
        id.textContent = "Complaint ID: " + complaint.id;

        const email = document.createElement("p");
        email.textContent = "Student Email: " + complaint.studentEmail;

        const category = document.createElement("p");
        category.textContent = "Category: " + complaint.category;

        const description = document.createElement("p");
        description.textContent =
            "Description: " + complaint.description;

        const status = document.createElement("p");
        status.textContent = "Current Status: " + complaint.status;

        const priorityText = document.createElement("p");
        priorityText.textContent =
            "Current Priority: " + (complaint.priority || "Medium");

        const date = document.createElement("p");
        date.textContent =
            "Submitted: " + new Date(complaint.createdAt).toLocaleString();

        const historyTitle = document.createElement("h4");
        historyTitle.textContent = "Status History";

        const historyBox = document.createElement("div");
        historyBox.className = "history-box";

        (complaint.statusHistory || []).forEach(function(item) {
            const historyItem = document.createElement("p");

            const historyDate = item.changedAt
                ? new Date(item.changedAt).toLocaleString()
                : "Date not available";

            historyItem.textContent =
                item.status + " - " + historyDate;

            historyBox.appendChild(historyItem);
        });

        const statusSelect = document.createElement("select");

        ["Pending", "In Progress", "Resolved"].forEach(function(value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected = value === complaint.status;
            statusSelect.appendChild(option);
        });

        const priorityLabel = document.createElement("p");
        priorityLabel.textContent = "Set Complaint Priority:";

        const prioritySelect = document.createElement("select");

        ["Low", "Medium", "High"].forEach(function(value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            option.selected =
                value === (complaint.priority || "Medium");
            prioritySelect.appendChild(option);
        });

        const remarksInput = document.createElement("textarea");
        remarksInput.placeholder = "Enter admin remarks...";
        remarksInput.value = complaint.adminRemarks || "";

        const updateButton = document.createElement("button");
        updateButton.textContent = "Update Status & Priority";

        updateButton.addEventListener("click", function() {
            updateComplaintStatus(
                complaint.id,
                statusSelect.value,
                remarksInput.value,
                prioritySelect.value
            );
        });

        card.append(
            title,
            id,
            email,
            category,
            description,
            status,
            priorityText,
            date,
            historyTitle,
            historyBox,
            statusSelect,
            priorityLabel,
            prioritySelect,
            remarksInput,
            updateButton
        );

        complaintsList.appendChild(card);
    });
}

// Update Complaint Status, Remarks and Priority
async function updateComplaintStatus(
    id,
    status,
    adminRemarks,
    priority
) {
    try {
        const response = await fetch(
            "/api/admin/complaints/" + id,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status,
                    adminRemarks,
                    priority
                })
            }
        );

        const result = await response.json();
        alert(result.message);

        if (response.ok) {
            await loadAllComplaints();
        }

    } catch (error) {
        alert("Unable to update complaint.");
        console.error(error);
    }
}

// Load All Feedback
async function loadAllFeedback() {
    const feedbackList = document.getElementById(
        "adminFeedbackList"
    );

    try {
        const response = await fetch("/api/admin/feedback");
        const feedbackItems = await response.json();

        if (!response.ok) {
            feedbackList.textContent =
                feedbackItems.message || "Unable to load feedback.";
            return;
        }

        allFeedback = feedbackItems;

        // Total Feedback
        document.getElementById("totalFeedback").textContent =
            allFeedback.length;

        // Average Rating
        const average = allFeedback.length
            ? allFeedback.reduce(
                (sum, item) => sum + Number(item.rating || 0),
                0
            ) / allFeedback.length
            : 0;

        document.getElementById("averageRating").textContent =
            average.toFixed(1) + " / 5";

        // 5-Star Feedback
        document.getElementById("fiveStarFeedback").textContent =
            allFeedback.filter(
                item => Number(item.rating) === 5
            ).length;

        // 1-Star Feedback
        document.getElementById("oneStarFeedback").textContent =
            allFeedback.filter(
                item => Number(item.rating) === 1
            ).length;

        updateFeedbackCharts();
        displayFeedback();

    } catch (error) {
        feedbackList.textContent = "Unable to load feedback.";
        console.error(error);
    }
}

// Feedback Analytics Charts
function updateFeedbackCharts() {
    const feedbackCategories = [
        "Teaching",
        "Faculty",
        "Laboratory",
        "Classroom",
        "Infrastructure",
        "Library",
        "Other"
    ];

    const categoryCounts = feedbackCategories.map(category =>
        allFeedback.filter(
            item => item.feedbackType === category
        ).length
    );

    const ratingCounts = [1, 2, 3, 4, 5].map(rating =>
        allFeedback.filter(
            item => Number(item.rating) === rating
        ).length
    );

    if (feedbackCategoryChart) {
        feedbackCategoryChart.destroy();
    }

    feedbackCategoryChart = new Chart(
        document.getElementById("feedbackCategoryChart"),
        {
            type: "bar",
            data: {
                labels: feedbackCategories,
                datasets: [{
                    label: "Number of Feedback",
                    data: categoryCounts,
                    backgroundColor: [
                        "#3498db",
                        "#9b59b6",
                        "#e67e22",
                        "#2ecc71",
                        "#16a085",
                        "#f1c40f",
                        "#95a5a6"
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        }
    );

    if (ratingChart) ratingChart.destroy();

    ratingChart = new Chart(
        document.getElementById("ratingChart"),
        {
            type: "bar",
            data: {
                labels: [
                    "1 Star",
                    "2 Stars",
                    "3 Stars",
                    "4 Stars",
                    "5 Stars"
                ],
                datasets: [{
                    label: "Number of Ratings",
                    data: ratingCounts,
                    backgroundColor: [
                        "#e74c3c",
                        "#e67e22",
                        "#f1c40f",
                        "#3498db",
                        "#2ecc71"
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        }
    );
}

// Display and Filter Feedback
function displayFeedback() {
    const searchText = document.getElementById(
        "searchFeedback"
    ).value.toLowerCase();

    const selectedCategory = document.getElementById(
        "feedbackCategoryFilter"
    ).value;

    const selectedRating = document.getElementById(
        "feedbackRatingFilter"
    ).value;

    const filteredFeedback = allFeedback.filter(function(item) {
        const searchData = [
            item.studentName,
            item.studentEmail,
            item.rollNumber,
            item.feedbackType,
            item.subject,
            item.facultyName,
            item.comments
        ].join(" ").toLowerCase();

        return searchData.includes(searchText) &&
            (selectedCategory === "All" ||
                item.feedbackType === selectedCategory) &&
            (selectedRating === "All" ||
                String(item.rating) === selectedRating);
    });

    const feedbackList = document.getElementById(
        "adminFeedbackList"
    );

    feedbackList.innerHTML = "";

    document.getElementById(
        "feedbackResultCount"
    ).textContent =
        "Showing " + filteredFeedback.length +
        " of " + allFeedback.length + " feedback entries";

    if (filteredFeedback.length === 0) {
        feedbackList.textContent = "No matching feedback found.";
        return;
    }

    filteredFeedback.slice().reverse().forEach(function(item) {
        const card = document.createElement("div");
        card.className = "complaint-card feedback-card";

        const title = document.createElement("h3");
        title.textContent = item.feedbackType + " Feedback";

        const student = document.createElement("p");
        student.textContent =
            "Student: " + item.studentName +
            " (" + item.rollNumber + ")";

        const email = document.createElement("p");
        email.textContent = "Email: " + item.studentEmail;

        const subject = document.createElement("p");
        subject.textContent =
            "Subject / Course: " + (item.subject || "Not specified");

        const faculty = document.createElement("p");
        faculty.textContent =
            "Faculty: " + (item.facultyName || "Not specified");

        const rating = document.createElement("p");
        const numericRating = Math.max(
            0,
            Math.min(5, Number(item.rating) || 0)
        );

        rating.textContent =
            "Rating: " +
            "★".repeat(numericRating) +
            "☆".repeat(5 - numericRating) +
            " (" + item.rating + "/5)";

        rating.className = "feedback-rating";

        const comments = document.createElement("p");
        comments.textContent = "Feedback: " + item.comments;

        const date = document.createElement("p");
        date.textContent =
            "Submitted: " + new Date(item.createdAt).toLocaleString();

        card.append(
            title,
            student,
            email,
            subject,
            faculty,
            rating,
            comments,
            date
        );

        feedbackList.appendChild(card);
    });
}

// Open Large Chart Popup
function openLargeChart(chart, title) {
    if (!chart) return;

    document.getElementById("chartModal").style.display = "flex";

    document.getElementById("chartModalTitle").textContent = title;

    if (largeChart) largeChart.destroy();

    largeChart = new Chart(
        document.getElementById("largeChart"),
        {
            type: chart.config.type,
            data: JSON.parse(JSON.stringify(chart.data)),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top"
                    }
                },
                scales: chart.config.type === "bar" ? {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                } : {}
            }
        }
    );
}

// Close Large Chart
function closeLargeChart() {
    document.getElementById("chartModal").style.display = "none";

    if (largeChart) {
        largeChart.destroy();
        largeChart = null;
    }
}

// Chart Click Events
[
    ["statusChart", () => statusChart, "Status-wise Complaints"],
    ["categoryChart", () => categoryChart, "Category-wise Complaints"],
    ["priorityChart", () => priorityChart, "Priority-wise Complaints"],
    [
        "feedbackCategoryChart",
        () => feedbackCategoryChart,
        "Feedback Category-wise"
    ],
    [
        "ratingChart",
        () => ratingChart,
        "Feedback Rating Distribution"
    ]
].forEach(function(item) {
    document.getElementById(item[0]).addEventListener(
        "click",
        function() {
            openLargeChart(item[1](), item[2]);
        }
    );
});

// Close Chart Button
document.getElementById("closeChart").addEventListener(
    "click",
    closeLargeChart
);

// Close Chart by Clicking Outside
document.getElementById("chartModal").addEventListener(
    "click",
    function(event) {
        if (event.target === this) {
            closeLargeChart();
        }
    }
);

// Complaint Search and Filters
document.getElementById("searchComplaint").addEventListener(
    "input",
    displayComplaints
);

document.getElementById("statusFilter").addEventListener(
    "change",
    displayComplaints
);

document.getElementById("categoryFilter").addEventListener(
    "change",
    displayComplaints
);

document.getElementById("priorityFilter").addEventListener(
    "change",
    displayComplaints
);

// Feedback Search and Filters
document.getElementById("searchFeedback").addEventListener(
    "input",
    displayFeedback
);

document.getElementById("feedbackCategoryFilter").addEventListener(
    "change",
    displayFeedback
);

document.getElementById("feedbackRatingFilter").addEventListener(
    "change",
    displayFeedback
);

// Start Admin Dashboard
loadAdminData();

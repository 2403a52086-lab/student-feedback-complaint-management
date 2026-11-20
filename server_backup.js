const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = 3000;

const dataFolder = path.join(__dirname, "data");
const adminsFile = path.join(dataFolder, "admins.json");
const usersFile = path.join(dataFolder, "users.json");
const complaintsFile = path.join(dataFolder, "complaints.json");
const feedbackFile = path.join(dataFolder, "feedback.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Read and write JSON data safely
async function readData(file) {
    try {
        return JSON.parse(await fs.readFile(file, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") {
            await fs.writeFile(file, "[]");
            return [];
        }
        throw error;
    }
}

async function writeData(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Get Status History for old and new complaints
function getStatusHistory(complaint) {
    if (Array.isArray(complaint.statusHistory) && complaint.statusHistory.length > 0) {
        return complaint.statusHistory;
    }

    const history = [{
        status: "Pending",
        changedAt: complaint.createdAt,
        note: "Complaint submitted"
    }];

    if (complaint.status && complaint.status !== "Pending") {
        history.push({
            status: complaint.status,
            changedAt: null,
            note: "Previous status - date not recorded"
        });
    }

    return history;
}

// Student Registration
app.post("/api/register", async (req, res) => {
    try {
        const { name, rollNumber, email, password } = req.body;

        if (!name || !rollNumber || !email || !password) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must contain at least 6 characters." });
        }

        const users = await readData(usersFile);
        const existingUser = users.find(user =>
            user.email.toLowerCase() === email.trim().toLowerCase() ||
            user.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
        );

        if (existingUser) {
            return res.status(409).json({ message: "Email or roll number is already registered." });
        }

        users.push({
            id: Date.now().toString(),
            name: name.trim(),
            rollNumber: rollNumber.trim(),
            email: email.trim().toLowerCase(),
            password,
            createdAt: new Date().toISOString()
        });

        await writeData(usersFile, users);
        res.status(201).json({ message: "Registration successful! Your details have been saved." });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// Student Login
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await readData(usersFile);
        const student = users.find(user =>
            user.email === String(email || "").trim().toLowerCase()
        );

        if (!student || student.password !== password) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        res.json({
            message: "Login successful!",
            student: {
                name: student.name,
                email: student.email,
                rollNumber: student.rollNumber
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// Submit Complaint
app.post("/api/complaints", async (req, res) => {
    try {
        const { title, category, description, studentEmail } = req.body;

        if (!title || !category || !description || !studentEmail) {
            return res.status(400).json({ message: "Please fill in all complaint details." });
        }

        const complaints = await readData(complaintsFile);
        const createdAt = new Date().toISOString();

        const newComplaint = {
            id: Date.now().toString(),
            studentEmail: studentEmail.toLowerCase(),
            title: title.trim(),
            category,
            description: description.trim(),
            status: "Pending",
            priority: "Medium",
            adminRemarks: "",
            createdAt,
            statusHistory: [{
                status: "Pending",
                changedAt: createdAt,
                note: "Complaint submitted"
            }]
        };

        complaints.push(newComplaint);
        await writeData(complaintsFile, complaints);

        res.status(201).json({
            message: "Complaint submitted successfully!",
            complaintId: newComplaint.id
        });
    } catch (error) {
        console.error("Complaint error:", error);
        res.status(500).json({ message: "Unable to save complaint." });
    }
});

// Get Student Complaints
app.get("/api/my-complaints", async (req, res) => {
    try {
        const complaints = await readData(complaintsFile);
        const email = String(req.query.email || "").toLowerCase();

        const studentComplaints = complaints
            .filter(c => String(c.studentEmail).toLowerCase() === email)
            .map(c => ({
                ...c,
                priority: c.priority || "Medium",
                statusHistory: getStatusHistory(c)
            }));

        res.json(studentComplaints);
    } catch (error) {
        console.error("Student complaints error:", error);
        res.status(500).json({ message: "Unable to load complaints." });
    }
});

// Submit Student Feedback
app.post("/api/feedback", async (req, res) => {
    try {
        const {
            studentName,
            studentEmail,
            rollNumber,
            feedbackType,
            subject,
            facultyName,
            rating,
            comments
        } = req.body;

        const ratingNumber = Number(rating);

        if (!studentName || !studentEmail || !feedbackType || !rating || !comments) {
            return res.status(400).json({ message: "Please fill in all required feedback fields." });
        }

        if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        const feedbackList = await readData(feedbackFile);
        const newFeedback = {
            id: Date.now().toString(),
            studentName: studentName.trim(),
            studentEmail: studentEmail.trim().toLowerCase(),
            rollNumber: String(rollNumber || ""),
            feedbackType,
            subject: String(subject || "").trim(),
            facultyName: String(facultyName || "").trim(),
            rating: ratingNumber,
            comments: comments.trim(),
            createdAt: new Date().toISOString()
        };

        feedbackList.push(newFeedback);
        await writeData(feedbackFile, feedbackList);

        res.status(201).json({
            message: "Feedback submitted successfully. Thank you!",
            feedbackId: newFeedback.id
        });
    } catch (error) {
        console.error("Feedback error:", error);
        res.status(500).json({ message: "Unable to save feedback." });
    }
});

// Get Feedback Submitted by a Student
app.get("/api/my-feedback", async (req, res) => {
    try {
        const feedbackList = await readData(feedbackFile);
        const email = String(req.query.email || "").toLowerCase();

        res.json(
            feedbackList.filter(item => item.studentEmail.toLowerCase() === email)
        );
    } catch (error) {
        console.error("My feedback error:", error);
        res.status(500).json({ message: "Unable to load your feedback." });
    }
});

// Admin Registration
app.post("/api/admin/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must contain at least 6 characters." });
        }

        const admins = await readData(adminsFile);

        if (admins.length > 0) {
            return res.status(403).json({ message: "Admin account already exists. Please login." });
        }

        admins.push({
            id: Date.now().toString(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password
        });

        await writeData(adminsFile, admins);
        res.status(201).json({ message: "Admin registration successful! Please login." });
    } catch (error) {
        console.error("Admin registration error:", error);
        res.status(500).json({ message: "Unable to register admin." });
    }
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const admins = await readData(adminsFile);
        const admin = admins.find(item =>
            item.email === String(email || "").trim().toLowerCase()
        );

        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: "Invalid admin email or password." });
        }

        res.json({
            message: "Admin login successful!",
            admin: { name: admin.name, email: admin.email }
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Unable to login." });
    }
});

// Admin: View All Complaints
app.get("/api/admin/complaints", async (req, res) => {
    try {
        const complaints = await readData(complaintsFile);

        res.json(complaints.map(c => ({
            ...c,
            priority: c.priority || "Medium",
            statusHistory: getStatusHistory(c)
        })));
    } catch (error) {
        console.error("Admin complaints error:", error);
        res.status(500).json({ message: "Unable to load complaints." });
    }
});

// Admin: Update Complaint Status, Remarks and Priority
app.patch("/api/admin/complaints/:id", async (req, res) => {
    try {
        const complaints = await readData(complaintsFile);
        const complaint = complaints.find(c => c.id === req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found." });
        }

        const allowedStatuses = ["Pending", "In Progress", "Resolved"];
        const allowedPriorities = ["Low", "Medium", "High"];

        const newStatus = req.body.status;
        const newPriority = req.body.priority || complaint.priority || "Medium";

        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({ message: "Invalid complaint status." });
        }

        if (!allowedPriorities.includes(newPriority)) {
            return res.status(400).json({ message: "Invalid complaint priority." });
        }

        complaint.statusHistory = getStatusHistory(complaint);

        if (complaint.status !== newStatus) {
            complaint.statusHistory.push({
                status: newStatus,
                changedAt: new Date().toISOString(),
                note: "Status updated by admin"
            });
        }

        complaint.status = newStatus;
        complaint.priority = newPriority;
        complaint.adminRemarks = String(req.body.adminRemarks || "");

        await writeData(complaintsFile, complaints);

        res.json({
            message: "Complaint updated successfully!",
            statusHistory: complaint.statusHistory,
            priority: complaint.priority
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Unable to update complaint." });
    }
});

// Admin: View All Feedback
app.get("/api/admin/feedback", async (req, res) => {
    try {
        const feedbackList = await readData(feedbackFile);
        res.json(feedbackList);
    } catch (error) {
        console.error("Admin feedback error:", error);
        res.status(500).json({ message: "Unable to load feedback." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

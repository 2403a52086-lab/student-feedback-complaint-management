
const express = require("express");
const path = require("path");
const db = require("./db").promise();
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Convert database complaint row into frontend format
function complaintFromRow(row) {
    let history = row.status_history || [];

    if (typeof history === "string") {
        try {
            history = JSON.parse(history);
        } catch {
            history = [];
        }
    }

    return {
        id: String(row.id),
        studentEmail: row.student_email,
        title: row.title,
        category: row.category,
        description: row.description,
        status: row.status || "Pending",
        priority: row.priority || "Medium",
        adminRemarks: row.admin_remarks || "",
        createdAt: row.created_at
            ? new Date(row.created_at).toISOString()
            : null,
        statusHistory: history
    };
}

// Convert database feedback row into frontend format
function feedbackFromRow(row) {
    return {
        id: String(row.id),
        studentName: row.student_name,
        studentEmail: row.student_email,
        rollNumber: row.roll_number,
        feedbackType: row.feedback_type,
        subject: row.subject,
        facultyName: row.faculty_name,
        rating: row.rating,
        comments: row.comments,
        createdAt: row.created_at
            ? new Date(row.created_at).toISOString()
            : null
    };
}

// Convert database student row into frontend format
function studentFromRow(row) {
    return {
        id: String(row.id),
        name: row.name,
        rollNumber: row.roll_number,
        email: row.email
    };
}


// ===============================
// STUDENT REGISTRATION
// ===============================

app.post("/api/register", async (req, res) => {
    try {
        const { name, rollNumber, email, password } = req.body;

        if (!name || !rollNumber || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters."
            });
        }

        // Hash student password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO students
            (id, name, roll_number, email, password, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                Date.now().toString(),
                name.trim(),
                rollNumber.trim().toLowerCase(),
                email.trim().toLowerCase(),
                hashedPassword,
                new Date()
            ]
        );

        res.json({
            message: "Registration successful! Your details have been saved."
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email or roll number already registered."
            });
        }

        console.log(error);
        res.status(500).json({ message: "Registration failed." });
    }
});


// ===============================
// STUDENT LOGIN
// ===============================

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const [rows] = await db.execute(
            "SELECT * FROM students WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Check hashed password or existing plain-text password
        let isPasswordValid = false;

        if (rows[0].password.startsWith("$2")) {
            isPasswordValid = await bcrypt.compare(
                password,
                rows[0].password
            );
        } else {
            isPasswordValid = rows[0].password === password;

            // Convert existing plain-text password into hash
            if (isPasswordValid) {
                const hashedPassword = await bcrypt.hash(password, 10);

                await db.execute(
                    "UPDATE students SET password = ? WHERE id = ?",
                    [hashedPassword, rows[0].id]
                );
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
            student: studentFromRow(rows[0])
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Login failed." });
    }
});


// ===============================
// SUBMIT COMPLAINT
// ===============================

app.post("/api/complaints", async (req, res) => {
    try {
        const { title, category, description, studentEmail } = req.body;

        if (!title || !category || !description || !studentEmail) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const id = Date.now().toString();
        const createdAt = new Date();

        const history = [{
            status: "Pending",
            changedAt: createdAt.toISOString(),
            note: "Complaint submitted"
        }];

        await db.execute(
            `INSERT INTO complaints
            (id, student_email, title, category, description,
             status, priority, admin_remarks, created_at, status_history)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                studentEmail.trim().toLowerCase(),
                title,
                category,
                description,
                "Pending",
                "Medium",
                "",
                createdAt,
                JSON.stringify(history)
            ]
        );

        res.json({
            message: "Complaint submitted successfully!",
            complaintId: id
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Complaint submission failed." });
    }
});


// ===============================
// STUDENT VIEW COMPLAINTS
// ===============================

app.get("/api/my-complaints", async (req, res) => {
    try {
        const email = (req.query.email || "").toLowerCase();

        const [rows] = await db.execute(
            "SELECT * FROM complaints WHERE student_email = ? ORDER BY created_at DESC",
            [email]
        );

        res.json(rows.map(complaintFromRow));

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch complaints." });
    }
});


// ===============================
// SUBMIT FEEDBACK
// ===============================

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

        if (!studentName || !studentEmail || !feedbackType ||
            !rating || !comments) {
            return res.status(400).json({
                message: "Required fields are missing."
            });
        }

        const ratingValue = Number(rating);

        if (!Number.isInteger(ratingValue) ||
            ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5."
            });
        }

        const id = Date.now().toString();

        await db.execute(
            `INSERT INTO feedback
            (id, student_name, student_email, roll_number,
             feedback_type, subject, faculty_name, rating,
             comments, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                studentName,
                studentEmail.trim().toLowerCase(),
                rollNumber || null,
                feedbackType,
                subject || null,
                facultyName || null,
                ratingValue,
                comments,
                new Date()
            ]
        );

        res.json({
            message: "Feedback submitted successfully!",
            feedbackId: id
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Feedback submission failed." });
    }
});


// ===============================
// STUDENT VIEW FEEDBACK
// ===============================

app.get("/api/my-feedback", async (req, res) => {
    try {
        const email = (req.query.email || "").toLowerCase();

        const [rows] = await db.execute(
            "SELECT * FROM feedback WHERE student_email = ? ORDER BY created_at DESC",
            [email]
        );

        res.json(rows.map(feedbackFromRow));

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch feedback." });
    }
});


// ===============================
// ADMIN REGISTRATION
// ===============================

app.post("/api/admin/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters."
            });
        }

        const [admins] = await db.execute(
            "SELECT COUNT(*) AS total FROM admins"
        );

        if (admins[0].total > 0) {
            return res.status(403).json({
                message: "Admin registration is already completed."
            });
        }

        // Hash admin password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO admins (id, name, email, password)
            VALUES (?, ?, ?, ?)`,
            [
                Date.now().toString(),
                name.trim(),
                email.trim().toLowerCase(),
                hashedPassword
            ]
        );

        res.json({ message: "Admin registration successful!" });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        console.log(error);
        res.status(500).json({ message: "Admin registration failed." });
    }
});


// ===============================
// ADMIN LOGIN
// ===============================

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const [rows] = await db.execute(
            "SELECT * FROM admins WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Check hashed password or existing plain-text password
        let isPasswordValid = false;

        if (rows[0].password.startsWith("$2")) {
            isPasswordValid = await bcrypt.compare(
                password,
                rows[0].password
            );
        } else {
            isPasswordValid = rows[0].password === password;

            // Convert existing plain-text password into hash
            if (isPasswordValid) {
                const hashedPassword = await bcrypt.hash(password, 10);

                await db.execute(
                    "UPDATE admins SET password = ? WHERE id = ?",
                    [hashedPassword, rows[0].id]
                );
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Admin login successful!",
            admin: {
                name: rows[0].name,
                email: rows[0].email
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Admin login failed." });
    }
});


// ===============================
// ADMIN VIEW ALL COMPLAINTS
// ===============================

app.get("/api/admin/complaints", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM complaints ORDER BY created_at DESC"
        );

        res.json(rows.map(complaintFromRow));

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch complaints." });
    }
});


// ===============================
// ADMIN UPDATE COMPLAINT
// ===============================

app.patch("/api/admin/complaints/:id", async (req, res) => {
    try {
        const { status, priority, adminRemarks } = req.body;
        const id = req.params.id;

        const [rows] = await db.execute(
            "SELECT * FROM complaints WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Complaint not found."
            });
        }

        const complaint = complaintFromRow(rows[0]);

        const validStatuses = ["Pending", "In Progress", "Resolved"];
        const validPriorities = ["Low", "Medium", "High"];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid complaint status."
            });
        }

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Invalid complaint priority."
            });
        }

        const newStatus = status || complaint.status;
        const newPriority = priority || complaint.priority;
        const newRemarks = adminRemarks !== undefined
            ? adminRemarks
            : complaint.adminRemarks;

        const history = complaint.statusHistory || [];

        if (newStatus !== complaint.status) {
            history.push({
                status: newStatus,
                changedAt: new Date().toISOString(),
                note: "Status updated by admin"
            });
        }

        await db.execute(
            `UPDATE complaints
            SET status = ?, priority = ?, admin_remarks = ?,
                status_history = ?
            WHERE id = ?`,
            [
                newStatus,
                newPriority,
                newRemarks,
                JSON.stringify(history),
                id
            ]
        );

        res.json({
            message: "Complaint updated successfully!",
            statusHistory: history,
            priority: newPriority
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Complaint update failed." });
    }
});


// ===============================
// ADMIN VIEW ALL FEEDBACK
// ===============================

app.get("/api/admin/feedback", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM feedback ORDER BY created_at DESC"
        );

        res.json(rows.map(feedbackFromRow));

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch feedback." });
    }
});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

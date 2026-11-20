
const fs = require("fs");
const db = require("./db");

const connection = db.promise();

function readJSON(file) {
    return JSON.parse(
        fs.readFileSync(`./data/${file}`, "utf8")
    );
}

function formatDate(date) {
    if (!date) return null;

    const d = new Date(date);

    if (isNaN(d.getTime())) return null;

    return d.toISOString().slice(0, 19).replace("T", " ");
}

async function migrate() {
    try {
        const users = readJSON("users.json");
        const admins = readJSON("admins.json");
        const complaints = readJSON("complaints.json");
        const feedback = readJSON("feedback.json");

        await connection.beginTransaction();

        for (const u of users) {
            await connection.execute(
                `INSERT IGNORE INTO students
                (id, name, roll_number, email, password, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    u.id, u.name, u.rollNumber,
                    u.email, u.password, formatDate(u.createdAt)
                ]
            );
        }

        for (const a of admins) {
            await connection.execute(
                `INSERT IGNORE INTO admins
                (id, name, email, password)
                VALUES (?, ?, ?, ?)`,
                [a.id, a.name, a.email, a.password]
            );
        }

        for (const c of complaints) {
            const history = c.statusHistory || [{
                status: c.status || "Pending",
                changedAt: c.createdAt,
                note: "Complaint submitted"
            }];

            await connection.execute(
                `INSERT IGNORE INTO complaints
                (id, student_email, title, category, description,
                 status, priority, admin_remarks, created_at, status_history)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    c.id, c.studentEmail, c.title, c.category,
                    c.description, c.status || "Pending",
                    c.priority || "Medium",
                    c.adminRemarks || "",
                    formatDate(c.createdAt),
                    JSON.stringify(history)
                ]
            );
        }

        for (const f of feedback) {
            await connection.execute(
                `INSERT IGNORE INTO feedback
                (id, student_name, student_email, roll_number,
                 feedback_type, subject, faculty_name, rating,
                 comments, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    f.id, f.studentName, f.studentEmail,
                    f.rollNumber || null, f.feedbackType,
                    f.subject || null, f.facultyName || null,
                    f.rating, f.comments, formatDate(f.createdAt)
                ]
            );
        }

        await connection.commit();

        console.log("Migration completed successfully!");
        console.log("Students:", users.length);
        console.log("Admins:", admins.length);
        console.log("Complaints:", complaints.length);
        console.log("Feedback:", feedback.length);

    } catch (error) {
        await connection.rollback();
        console.log("Migration failed:", error.message);
    } finally {
        await connection.end();
    }
}

migrate();

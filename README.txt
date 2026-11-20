STUDENT FEEDBACK AND COMPLAINT MANAGEMENT SYSTEM

TECHNOLOGY
- Node.js
- Express
- HTML, CSS and JavaScript
- JSON file storage
- Chart.js (loaded from CDN in admin.html)

PROJECT FILES
- server.js
- public/index.html, script.js, style.css
- public/dashboard.html, dashboard.js
- public/admin.html, admin.js
- data/users.json
- data/admins.json
- data/complaints.json
- data/feedback.json

RUN THE PROJECT
1. Open this folder in VS Code.
2. Open Terminal in VS Code.
3. Run: npm install
4. Run: node server.js
5. Open: http://localhost:3000

FEATURES
STUDENT:
- Register and login
- Submit complaints and track status, priority, status history and admin remarks
- Submit feedback about teaching, faculty, laboratory, classroom, infrastructure, library or other
- Give a rating from 1 to 5
- View previously submitted feedback

ADMIN:
- Login and manage complaints
- Search and filter complaints by status, category and priority
- Update complaint status, priority and remarks
- Complaint analytics charts (click a chart to enlarge)
- View student feedback
- Feedback category and rating analytics
- Search and filter feedback by category and rating

DATA
Existing users, admins and complaints JSON data were preserved from the uploaded project.
New feedback records are saved in data/feedback.json.

NOTE
This is a beginner academic project. It currently uses simple JSON storage and the existing
sessionStorage login approach. Passwords in the existing JSON files are stored as plain text;
change demo passwords and do not use this version for real sensitive student data.

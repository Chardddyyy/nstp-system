# NSTP System - Database Setup Guide

## Overview
This guide will help you set up the MySQL database for the NSTP System.

## Prerequisites
- XAMPP or MAMP installed (with Apache and MySQL)
- Node.js installed
- MySQL database server running on port 8889 (MAMP default)

## Step 1: Start Your Local Server
1. Open MAMP or XAMPP Control Panel
2. Start Apache server
3. Start MySQL server
4. Open phpMyAdmin at http://localhost:8888/phpmyadmin (MAMP) or http://localhost/phpmyadmin (XAMPP)

## Step 2: Create the Database
1. In phpMyAdmin, click "New" to create a database
2. Name it: `nstp-system`
3. Click "Create"

## Step 3: Import the Database Schema
1. Select the `nstp-system` database
2. Click on the "SQL" tab
3. Open the file `backend/database/schema.sql`
4. Copy all the SQL code and paste it into the SQL tab
5. Click "Go" to execute

This will create all the necessary tables:
- users
- students
- reports
- report_submissions
- conversations
- messages
- enrollments

## Step 4: Install Backend Dependencies
Open terminal and run:
```bash
cd backend
npm install
```

## Step 5: Start the Backend Server
```bash
npm start
```
The backend will run on http://localhost:3001

## Step 6: Start the React Frontend
In a new terminal:
```bash
npm run dev
```

## Default Login Credentials
After setup, you can login with these accounts:

| Email | Password | Role | Department |
|-------|----------|------|------------|
| admin@cvsu.edu.ph | admin123 | Admin | NSTP Office |
| cwts@cvsu.edu.ph | cwts123 | Instructor | CWTS |
| lts@cvsu.edu.ph | lts123 | Instructor | LTS |
| rotc@cvsu.edu.ph | rotc123 | Instructor | ROTC |

## API Endpoints
The backend provides these API endpoints:

### Authentication
- POST `/api/auth/login` - Login user

### Users
- GET `/api/users` - Get all users
- GET `/api/users/me` - Get current user
- PUT `/api/users/:id` - Update user profile
- PUT `/api/users/:id/password` - Change password

### Students
- GET `/api/students` - Get all students
- POST `/api/students` - Add new student
- PUT `/api/students/:id` - Update student
- DELETE `/api/students/:id` - Delete student

### Reports
- GET `/api/reports` - Get all reports
- POST `/api/reports` - Create report
- PUT `/api/reports/:id` - Update report
- DELETE `/api/reports/:id` - Delete report
- POST `/api/reports/:id/submit` - Submit report

### Conversations & Messages
- GET `/api/conversations` - Get user conversations
- POST `/api/conversations` - Create conversation
- GET `/api/conversations/:id/messages` - Get messages
- POST `/api/conversations/:id/messages` - Send message
- DELETE `/api/conversations/:id` - Delete conversation

### Enrollments
- GET `/api/enrollments` - Get all enrollments
- POST `/api/enrollments` - Submit enrollment
- PUT `/api/enrollments/:id` - Approve/Decline enrollment

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, change it in `backend/.env`:
```
PORT=3002
```

### Database Connection Error
Make sure MySQL is running on port 8889. If using XAMPP (default port 3306), update `backend/config/database.js`:
```javascript
const dbConfig = {
  host: 'localhost',
  port: 3306, // XAMPP default
  user: 'root',
  password: '', // XAMPP default (empty password)
  database: 'nstp-system'
};
```

### Profile Pictures Not Saving
Profile pictures are now stored in the database as base64 strings. The system automatically compresses images to prevent storage issues.

## Data Migration (Optional)
If you have existing data in localStorage that you want to migrate:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this code to export your data:
```javascript
const data = {
  users: JSON.parse(localStorage.getItem('nstp_users') || '[]'),
  students: JSON.parse(localStorage.getItem('nstp_students') || '[]'),
  reports: JSON.parse(localStorage.getItem('nstp_reports') || '[]'),
  conversations: JSON.parse(localStorage.getItem('nstp_conversations') || '[]'),
  messages: JSON.parse(localStorage.getItem('nstp_messages') || '{}')
};
console.log(JSON.stringify(data, null, 2));
```
4. Copy the output and save it to a file
5. You can then import this data into the MySQL database using custom scripts or manually

## Important Notes
- All data is now stored in MySQL, not localStorage
- JWT tokens are still stored in localStorage for authentication
- Profile pictures are stored as base64 strings in the database
- The backend must be running for the app to work

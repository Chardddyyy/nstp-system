-- NSTP System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'instructor') NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  avatar VARCHAR(50) DEFAULT 'default',
  profilePicture TEXT,
  phone VARCHAR(50),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  department ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
  status ENUM('Active', 'Inactive', 'Completed') DEFAULT 'Active',
  semester VARCHAR(50),
  schoolYear VARCHAR(50),
  course VARCHAR(100),
  program VARCHAR(100),
  year VARCHAR(50),
  section VARCHAR(50),
  contactNumber VARCHAR(50),
  address TEXT,
  birthDate DATE,
  birthMonth VARCHAR(2),
  birthDay VARCHAR(2),
  birthYear VARCHAR(4),
  age VARCHAR(10),
  civilStatus VARCHAR(50),
  gender VARCHAR(20),
  height VARCHAR(10),
  weight VARCHAR(10),
  facebookAccount VARCHAR(255),
  bloodType VARCHAR(10),
  emergencyContact VARCHAR(255),
  emergencyNumber VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  status ENUM('Draft', 'Submitted', 'Reviewed') DEFAULT 'Draft',
  due_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Report submissions table
CREATE TABLE IF NOT EXISTS report_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  instructor_id INT NOT NULL,
  content TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(255) PRIMARY KEY,
  participant_1_id INT NOT NULL,
  participant_2_id INT NOT NULL,
  last_message TEXT,
  last_message_time TIMESTAMP,
  unread_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id VARCHAR(255) NOT NULL,
  sender_id INT NOT NULL,
  text TEXT,
  type ENUM('text', 'image', 'file', 'voice', 'system', 'deleted') DEFAULT 'text',
  image_url TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  audio_url TEXT,
  duration VARCHAR(20),
  reactions JSON,
  edited BOOLEAN DEFAULT FALSE,
  deleted_for JSON,
  deleted_for_everyone BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  department ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
  studentId VARCHAR(50),
  contactNumber VARCHAR(50),
  birthDate DATE,
  gender VARCHAR(20),
  address TEXT,
  course VARCHAR(100),
  yearLevel VARCHAR(50),
  emergencyContact VARCHAR(255),
  emergencyNumber VARCHAR(50),
  status ENUM('Pending', 'Approved', 'Declined') DEFAULT 'Pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT,
  reviewed_at TIMESTAMP,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default users (plain text passwords)
INSERT INTO users (id, email, password, role, name, department, avatar) VALUES
(1, 'admin@cvsu.edu.ph', 'admin123', 'admin', 'Admin User', 'NSTP Office', 'default'),
(2, 'cwts@cvsu.edu.ph', 'cwts123', 'instructor', 'CWTS Instructor', 'CWTS', 'default'),
(3, 'lts@cvsu.edu.ph', 'lts123', 'instructor', 'LTS Instructor', 'LTS', 'default'),
(4, 'rotc@cvsu.edu.ph', 'rotc123', 'instructor', 'ROTC Instructor', 'ROTC', 'default')
ON DUPLICATE KEY UPDATE id=id;

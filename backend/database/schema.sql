-- NSTP System Database Schema
-- This file is the single source of truth for new installations.
-- Existing databases are handled by the ensure*() migration functions in server.js.

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'instructor') NOT NULL,
  name          VARCHAR(255) NOT NULL,
  department    VARCHAR(100),
  avatar        VARCHAR(50)  DEFAULT 'default',
  profilePicture TEXT,
  phone         VARCHAR(50),
  bio           TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  studentId       VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  department      ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
  status          ENUM('Active', 'Inactive', 'Completed') DEFAULT 'Active',
  semester        VARCHAR(50),
  schoolYear      VARCHAR(50),
  course          VARCHAR(100),
  program         VARCHAR(100),
  year            VARCHAR(50),
  section         VARCHAR(50),
  contactNumber   VARCHAR(50),
  address         TEXT,
  birthDate       DATE,
  birthMonth      VARCHAR(2),
  birthDay        VARCHAR(2),
  birthYear       VARCHAR(4),
  age             VARCHAR(10),
  civilStatus     VARCHAR(50),
  gender          VARCHAR(20),
  height          VARCHAR(10),
  weight          VARCHAR(10),
  facebookAccount VARCHAR(255),
  emergencyContact VARCHAR(255),
  emergencyNumber  VARCHAR(50),
  firstName       VARCHAR(100),
  lastName        VARCHAR(100),
  middleName      VARCHAR(100),
  street          VARCHAR(255),
  municipality    VARCHAR(100),
  province        VARCHAR(100),
  registeredVoter VARCHAR(20),
  registrationPhoto LONGTEXT,
  registration_photo LONGTEXT,
  profilePicture  TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_students_department (department),
  INDEX idx_students_status (status),
  INDEX idx_students_program (program)
);

-- department is VARCHAR so 'All' is a valid value (ENUM would reject it)
CREATE TABLE IF NOT EXISTS reports (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  department          VARCHAR(50),
  status              ENUM('Draft', 'Submitted', 'Reviewed') DEFAULT 'Draft',
  due_date            DATE,
  created_by          INT,
  batch_year          INT,
  reference_file_data LONGTEXT,
  reference_file_name VARCHAR(255),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_department (department),
  INDEX idx_reports_batch_year (batch_year),
  INDEX idx_reports_status (status)
);

CREATE TABLE IF NOT EXISTS report_submissions (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  report_id     INT NOT NULL,
  instructor_id INT NOT NULL,
  content       TEXT,
  file_data     LONGTEXT,
  file_name     VARCHAR(255),
  submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id)     REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_report_submissions_report (report_id),
  INDEX idx_report_submissions_instructor (instructor_id)
);

CREATE TABLE IF NOT EXISTS report_comments (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  report_id  INT NOT NULL,
  user_id    INT NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_report_comments_report (report_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id                VARCHAR(255) PRIMARY KEY,
  participant_1_id  INT NULL,
  participant_2_id  INT NULL,
  is_group          BOOLEAN DEFAULT FALSE,
  group_name        VARCHAR(255) NULL,
  created_by        INT NULL,
  last_message      TEXT,
  last_message_time TIMESTAMP NULL,
  last_sender_id    INT NULL,
  last_sender_name  VARCHAR(255) NULL,
  unread_count      INT DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_2_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by)       REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_conversations_p1 (participant_1_id),
  INDEX idx_conversations_p2 (participant_2_id),
  INDEX idx_conversations_group (is_group)
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id VARCHAR(255) NOT NULL,
  user_id         INT NOT NULL,
  joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  INDEX idx_conv_participants_user (user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id      VARCHAR(255) NOT NULL,
  sender_id            INT NOT NULL,
  text                 TEXT,
  type                 VARCHAR(20) DEFAULT 'text',
  image_url            LONGTEXT,
  file_url             LONGTEXT,
  file_name            VARCHAR(255),
  audio_url            LONGTEXT,
  duration             VARCHAR(50),
  reactions            JSON,
  edited               BOOLEAN DEFAULT FALSE,
  deleted_snapshot     JSON,
  deleted_at           TIMESTAMP NULL,
  deleted_for          JSON,
  deleted_for_everyone BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE,
  INDEX idx_messages_conversation (conversation_id, created_at),
  INDEX idx_messages_sender (sender_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  student_name     VARCHAR(255) NOT NULL,
  firstName        VARCHAR(100),
  lastName         VARCHAR(100),
  middleName       VARCHAR(100),
  email            VARCHAR(255),
  department       ENUM('ROTC', 'CWTS', 'LTS') NOT NULL,
  studentId        VARCHAR(50),
  contactNumber    VARCHAR(50),
  homeAddress      TEXT,
  address          TEXT,
  birthDate        DATE,
  birthMonth       VARCHAR(2),
  birthDay         VARCHAR(2),
  birthYear        VARCHAR(4),
  age              VARCHAR(10),
  civilStatus      VARCHAR(50),
  gender           VARCHAR(20),
  height           VARCHAR(10),
  weight           VARCHAR(10),
  facebookAccount  VARCHAR(255),
  bloodType        VARCHAR(10),
  course           VARCHAR(100),
  program          VARCHAR(100),
  section          VARCHAR(50),
  yearLevel        VARCHAR(50),
  emergencyContact VARCHAR(255),
  emergencyNumber  VARCHAR(50),
  status           ENUM('Pending', 'Approved', 'Declined') DEFAULT 'Pending',
  registration_photo LONGTEXT,
  submitted_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by      INT,
  reviewed_at      TIMESTAMP NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_enrollments_status (status),
  INDEX idx_enrollments_department (department)
);

-- offer_sdp / answer_sdp are the active column names used by server.js.
-- (sdp_offer / sdp_answer existed in an older version and are kept by the
--  ensureWebRTCColumns() migration on existing DBs; they are not used by any route.)
CREATE TABLE IF NOT EXISTS calls (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id VARCHAR(255) NOT NULL,
  caller_id       INT NOT NULL,
  receiver_id     INT NOT NULL,
  call_type       ENUM('voice', 'video') DEFAULT 'voice',
  status          ENUM('ringing', 'connected', 'ended', 'declined', 'missed') DEFAULT 'ringing',
  started_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  connected_at    TIMESTAMP NULL,
  ended_at        TIMESTAMP NULL,
  duration        INT DEFAULT 0,
  offer_sdp       MEDIUMTEXT,
  answer_sdp      MEDIUMTEXT,
  caller_ice      JSON,
  receiver_ice    JSON,
  group_call_id   VARCHAR(36),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (caller_id)       REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (receiver_id)     REFERENCES users(id)         ON DELETE CASCADE,
  INDEX idx_calls_receiver_status (receiver_id, status),
  INDEX idx_calls_caller (caller_id),
  INDEX idx_calls_group_call (group_call_id)
);

CREATE TABLE IF NOT EXISTS archived_years (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  year        INT NOT NULL,
  students    INT DEFAULT 0,
  reports     INT DEFAULT 0,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data        JSON,
  UNIQUE KEY unique_year (year)
);

CREATE TABLE IF NOT EXISTS current_batch (
  id         INT PRIMARY KEY DEFAULT 1,
  year       INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit trail for security-sensitive actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  action     VARCHAR(100) NOT NULL,
  user_id    INT,
  detail     TEXT,
  ip         VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_action (action)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA
-- Passwords are bcrypt-hashed (cost 12):
--   admin123 / cwts123 / lts123 / rotc123
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO users (id, email, password, role, name, department, avatar) VALUES
(1, 'admin@cvsu.edu.ph', '$2a$12$hT9P3bPCgpnBV./hlnO8Fuj8syXl1PI0KZULNb89t20hW5p0g5Qf2', 'admin',      'Admin User',       'NSTP Office', 'default'),
(2, 'cwts@cvsu.edu.ph',  '$2a$12$Czsx0PgIyJHdNNsoN4hwPeMnj1nu6QmI1KVnoBabE0mmsda1VL/KO', 'instructor', 'CWTS Instructor', 'CWTS',        'default'),
(3, 'lts@cvsu.edu.ph',   '$2a$12$E/wGMewwF28hVNG6yg23.uD8e.ck9KbqAkrGJkFoZmIGESBhM5eMG', 'instructor', 'LTS Instructor',  'LTS',         'default'),
(4, 'rotc@cvsu.edu.ph',  '$2a$12$ke.4ad4ZeY0nyzD6W56.RuMEAPdW27yiPZye1m1YEvmKye77wWMT6', 'instructor', 'ROTC Instructor', 'ROTC',        'default')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO current_batch (id, year) VALUES (1, 2025)
ON DUPLICATE KEY UPDATE id = id;

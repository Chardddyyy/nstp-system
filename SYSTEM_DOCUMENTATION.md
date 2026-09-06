# 📘 CvSU Naic NSTP Management System — Official Technical Documentation

---

## 1. System Overview & Core Features

### 📌 Pangunahing Layunin (Primary Purpose)
Ang **CvSU Naic NSTP Management System** ay isang automated, secure, at centralized web-based records management platform na sadyang idinisenyo para sa **Cavite State University - Naic Campus National Service Training Program (NSTP) Office**.

Pangunahing layunin ng sistema na gawing mabilis, maaasahan, at ligtas ang pag-manage ng mga impormasyon ng mga mag-aaral na kumukuha ng alinman sa tatlong NSTP tracks:
1. **ROTC** (Reserve Officers' Training Corps)
2. **CWTS** (Civic Welfare Training Service)
3. **LTS** (Literacy Training Service)

Sa pamamagitan ng platapormang ito, natuldukan ang mga sumusunod na tradisyunal na suliranin:
* **Mano-manong Enrollment:** Pinalitan ng modernong online enrollment portal na may built-in Certificate of Registration (COR) image OCR at format validation.
* **Mano-manong Pag-compile ng CHED Reports:** Dati ay inaabot ng ilang linggo ang pag-type at pag-format ng student records para sa Commission on Higher Education (CHED). Ngayon, isang pindot na lamang ito gamit ang automated Excel & PDF export engines.
* **Kakulangan sa Sentralisadong Komunikasyon:** May realtime group/direct messaging at in-chat file sharing sa pagitan ng NSTP Coordinator at Instructors.
* **Seguridad at Privacy:** Sumusunod sa **Data Privacy Act of 2012 (RA 10173)** sa pamamagitan ng role-based access control, cryptographic token authentication, at encrypted cloud storage.

---

### 📊 One-Click Excel & PDF Export (Automated Report Generation)
Ang automated report generation ng sistema ay idinisenyo upang mag-produce ng **Commission on Higher Education (CHED) Standard OSDS-NSTP Form 2-A (Summary Matrix)** at **Form 2-B (Student Masterlist by Track & Section)**.

Gumagamit ang system ng modernong JavaScript engines (**ExcelJS**, **SheetJS/xlsx**, at **jsPDF**) para sa agarang pag-proseso at pag-download ng official spreadsheets at vector PDF documents nang direkta sa browser at server (`src/utils/chedExportGenerator.js`, `src/utils/chedPdfGenerator.js`, `backend/routes/studentRoutes.js`).

#### Paano Gumagana ang Export Pipeline:
1. **Data Ingestion:** Kinukuha ng system ang mga aktibo at aprubadong estudyante mula sa MySQL database.
2. **Dynamic Spreadsheet Compilation:** Binubuo ng JavaScript engine ang official CHED template na may exact multi-cell headers, department groupings, at formal institutional typography.
3. **Row Expansion & Value Insertion:** Kusa nitong pinupunan ang mga linya simula sa header boundary, pinapanatili ang formula summaries, at inilalapat ang formatting.
4. **Print Optimization & Auto-fit:** Nilalapatan ng text-wrapping, center-alignment sa numerics, A4 landscape print setup, at standard borders ang bawat cell bago i-export bilang `.xlsx` o `.pdf` file.

### 📐 Spreadsheet Formatting Logic & Settings (Print-Ready Output)
Upang masiguradong handa na agad i-print sa **A4 Landscape** o **Legal** paper ang Excel nang walang putol na columns o magulong formatting, ginagamit ang mga sumusunod na print setup sa JavaScript (`src/utils/chedExportGenerator.js`):

```javascript
// Pure JavaScript Print Setup & Auto-Fit Engine (ExcelJS / SheetJS)
function applyPrintSetup(worksheet) {
  worksheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 9, // A4 Standard
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0 // Automatic vertical multi-page flow
  };
  worksheet.views = [{ showGridLines: true }];
}
```

---

## 2. Database Structure (MySQL & Aiven)

### 🗄️ Database Tables & Data Types
Naka-host ang relational database sa **Aiven Cloud MySQL 8.0** na binubuo ng mga normalized tables na may primary at foreign key relationships:

#### 1. Table: `users`
Naglalaman ng records ng mga awtorisadong Admin at Department Instructors.
| Column | Data Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Primary Key, Auto Increment |
| `email` | `VARCHAR(255)` | NO | Unique institutional email (`@cvsu.edu.ph`) |
| `password` | `VARCHAR(255)` | NO | Bcrypt Hashed Password (cost factor 12) |
| `role` | `ENUM('admin','instructor')` | NO | User access role |
| `name` | `VARCHAR(255)` | NO | Full name ng user |
| `department`| `VARCHAR(100)` | YES | NSTP Department (`ROTC`, `CWTS`, `LTS`, `NSTP Office`) |
| `avatar` | `VARCHAR(50)` | YES | Default avatar identifier |
| `profilePicture` | `LONGTEXT` | YES | Base64/Cloudinary avatar URL |
| `phone` | `VARCHAR(50)` | YES | Contact mobile number |
| `bio` | `TEXT` | YES | Profile bio description |
| `created_at` | `TIMESTAMP` | NO | Default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | NO | Auto-update on modification |

#### 2. Table: `students`
Masterlist ng lahat ng opisyal na naka-enroll na mag-aaral sa NSTP.
| Column | Data Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Primary Key, Auto Increment |
| `studentId` | `VARCHAR(50)` | NO | Unique Student Identification Number |
| `name` | `VARCHAR(255)` | NO | Buong pangalan ng estudyante (Last, First, Middle) |
| `email` | `VARCHAR(255)` | YES | Active email address |
| `department` | `ENUM('ROTC','CWTS','LTS')` | NO | NSTP Component Track |
| `status` | `ENUM('Active','Inactive','Completed')` | YES | Current enrollment status (Default: `Active`) |
| `semester` | `VARCHAR(50)` | YES | Semester (e.g. `1st Semester`, `2nd Semester`) |
| `schoolYear` | `VARCHAR(50)` | YES | Academic Year (e.g. `2025-2026`, `2026-2027`) |
| `course` | `VARCHAR(100)` | YES | Academic Program / Degree |
| `section` | `VARCHAR(50)` | YES | Assigned Section (e.g. `BSIT 1-1`, `CWTS-A`) |
| `contactNumber`| `VARCHAR(50)` | YES | Contact Phone Number |
| `address` | `TEXT` | YES | Complete Residential Address |
| `birthDate` | `DATE` | YES | Date of Birth |
| `gender` | `VARCHAR(20)` | YES | Sex / Gender (`Male`, `Female`) |
| `registeredVoter` | `VARCHAR(20)` | YES | Voter registration status (`Yes`, `No`) |
| `registrationPhoto` | `LONGTEXT` | YES | Official 2x2 ID Photo |
| `created_at` | `TIMESTAMP` | NO | Registration timestamp |

#### 3. Table: `enrollments`
Pending, Approved, o Declined student self-service enrollment submissions.
| Column | Data Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Primary Key, Auto Increment |
| `student_name` | `VARCHAR(255)` | NO | Name of student enrollee |
| `studentId` | `VARCHAR(50)` | YES | Student ID Number |
| `email` | `VARCHAR(255)` | YES | Email for notification & OTP |
| `department` | `ENUM('ROTC','CWTS','LTS')`| NO | Selected NSTP track |
| `status` | `ENUM('Pending','Approved','Declined')` | YES | Evaluation status (Default: `Pending`) |
| `course` | `VARCHAR(100)` | YES | Degree Program |
| `section` | `VARCHAR(50)` | YES | Assigned Section |
| `registration_photo` | `LONGTEXT` | YES | Uploaded ID Photo / COR image |
| `submitted_at` | `TIMESTAMP` | NO | Submission timestamp |
| `reviewed_by` | `INT` | YES | Foreign Key -> `users(id)` |
| `reviewed_at` | `TIMESTAMP` | YES | Timestamp kung kailan na-evaluate |

#### 4. Table: `attendance_records`
Lahat ng opisyal na session logs ng QR scanning at manual excuse ng mga estudyante.
| Column | Data Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Primary Key, Auto Increment |
| `student_id` | `VARCHAR(50)` | NO | Foreign Key / Reference -> `students(studentId)` |
| `student_name` | `VARCHAR(255)` | NO | Full name ng estudyante |
| `department` | `VARCHAR(50)` | NO | NSTP Track (`CWTS`, `ROTC`, `LTS`) |
| `section` | `VARCHAR(50)` | YES | Assigned Section |
| `activity_name`| `VARCHAR(255)` | NO | Session title (e.g. `Day 1 - Orientation`, `Day 15 - Final Evaluation`) |
| `scan_type` | `ENUM('TIME_IN','TIME_OUT','EXCUSED','ABSENT')` | NO | Uri ng scan o attendance entry |
| `scanned_by` | `INT` | YES | Foreign Key -> `users(id)` (Instructor / Admin ID) |
| `status` | `VARCHAR(50)` | NO | `Present`, `Late`, `Excused`, `Incomplete`, `Absent` |
| `notes` | `TEXT` | YES | Reason for excuse, late cutoff notes, o remarks |
| `scanned_at` | `TIMESTAMP` | NO | Timestamp ng scan (Default: `CURRENT_TIMESTAMP`) |

#### 5. Table: `student_grades`
Database records ng Midterm, Final, at Remarks ng bawat estudyante.
| Column | Data Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Primary Key, Auto Increment |
| `student_id` | `INT` | NO | Foreign Key -> `students(id)` |
| `studentId` | `VARCHAR(50)` | NO | Student ID Number |
| `department` | `VARCHAR(50)` | NO | NSTP Department |
| `semester` | `VARCHAR(50)` | NO | Semester (e.g. `1st Semester`) |
| `school_year` | `VARCHAR(50)` | NO | Academic Year |
| `nstp_section`| `VARCHAR(50)` | YES | NSTP Assigned Section |
| `midterm_grade`| `VARCHAR(20)` | YES | Midterm numerical grade (e.g. `1.25`, `1.50`) |
| `final_grade` | `VARCHAR(20)` | YES | Final numerical grade (e.g. `1.00`, `1.25`) |
| `remarks` | `VARCHAR(50)` | YES | `PASSED`, `FAILED`, `INC`, `DROPPED` |
| `instructor_id` | `INT` | YES | Foreign Key -> `users(id)` |

#### 6. Table: `conversations` at `messages`
Realtime chat system para sa direct at group messaging.
* `conversations`: Nag-iingat ng mga active direct chats at group channels (`id`, `participant_1_id`, `participant_2_id`, `is_group`, `group_name`, `last_message`, `last_message_time`).
* `messages`: Bawat mensahe, file attachment, voice note, at reaction (`id`, `conversation_id`, `sender_id`, `text`, `type`, `image_url`, `file_url`, `audio_url`, `reactions`, `created_at`).

---

### 🌐 Aiven Cloud Connection & Data Storage Setup
Naka-configure ang backend connection gamit ang `mysql2/promise` na may **TLS/SSL Encryption (`ca.pem`)** at automated connection pooling:

```javascript
// backend/config/database.js
const mysql = require('mysql2/promise');
const { getDbConfig } = require('./dbEnv');

const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,         // Scaled para sa Aiven connection tier
  queueLimit: 1000,            // Queue requests during traffic spikes
  connectTimeout: 15000,       // 15s connection timeout
  enableKeepAlive: true,       // Iwas idle disconnection
  keepAliveInitialDelay: 10000 // 10s TCP keepalive ping
});

module.exports = pool;
```

---

## 3. API Endpoints (Backend & Postman)

Lahat ng API endpoints ay gumagamit ng standard REST patterns na may prefix na `/api/` at nagbabalik ng standardized JSON responses.

### 🔑 Authentication Endpoints
#### `POST /api/auth/login`
Nagve-verify ng credentials at naglalabas ng JWT Bearer token.
* **Request Payload:**
  ```json
  {
    "email": "admin@cvsu.edu.ph",
    "password": "yourPassword123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@cvsu.edu.ph",
      "role": "admin",
      "department": "NSTP Office"
    }
  }
  ```

---

### 👨‍🎓 Student Management Endpoints
#### `GET /api/students`
Kumukuha ng masterlist ng lahat ng aktibong estudyante.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 2,
    "students": [
      {
        "id": 1,
        "studentId": "2025-1001",
        "name": "Juan Dela Cruz",
        "email": "juan@cvsu.edu.ph",
        "department": "CWTS",
        "program": "BSIT",
        "section": "1-1",
        "status": "Active"
      }
    ]
  }
  ```

#### `POST /api/students`
Nagdaragdag ng bagong student record nang direkta mula sa Admin/Instructor dashboard.
* **Request Payload:**
  ```json
  {
    "studentId": "2025-1002",
    "name": "Maria Santos",
    "email": "maria.santos@cvsu.edu.ph",
    "department": "ROTC",
    "program": "BSCS",
    "section": "1-1",
    "contactNumber": "09123456789",
    "address": "Naic, Cavite",
    "status": "Active"
  }
  ```

#### `PUT /api/students/:id`
Nag-a-update ng impormasyon ng umiiral na estudyante.

#### `DELETE /api/students/:id`
Nagde-delete o nag-a-archive ng record ng estudyante.

---

### 📝 Enrollment & Self-Service Endpoints
#### `POST /api/enrollment/submit`
Public endpoint para sa pagsusumite ng enrollment form ng estudyante.
* **Request Payload:**
  ```json
  {
    "firstName": "Pedro",
    "lastName": "Penduko",
    "middleName": "A",
    "studentId": "2025-1003",
    "email": "pedro@cvsu.edu.ph",
    "department": "CWTS",
    "course": "BSIT",
    "section": "1-2",
    "contactNumber": "09987654321",
    "registration_photo": "data:image/jpeg;base64,..."
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Enrollment submitted successfully. Awaiting approval.",
    "enrollmentId": 15
  }
  ```

#### `POST /api/enrollment/approve/:id`
Ina-aprubahan ng Admin ang pending enrollment at awtomatikong inililipat sa `students` masterlist.

---

### 📊 Grades Management Endpoints
#### `GET /api/grades`
Kumukuha ng listahan ng grades ayon sa department, semester, at academic year.
* **Query Parameters:** `?department=CWTS&semester=1st+Semester&school_year=2025-2026`

#### `POST /api/grades/batch-save`
Isahan at sabayang nagse-save ng Midterm, Final, at Remarks ng buong section.
* **Request Payload:**
  ```json
  {
    "department": "CWTS",
    "semester": "1st Semester",
    "school_year": "2025-2026",
    "grades": [
      {
        "student_id": 1,
        "studentId": "2025-1001",
        "midterm_grade": "1.25",
        "final_grade": "1.00",
        "remarks": "PASSED"
      }
    ]
  }
  ```

---

## 4. Deployment Configuration (Render)

### 🚀 Step-by-Step Deployment sa Render Cloud Hosting

1. **Mag-login sa Render:** Pumunta sa [dashboard.render.com](https://dashboard.render.com/) at i-link ang iyong GitHub account.
2. **Gumawa ng Bagong Web Service:**
   * Piliin ang **"New +"** button $\to$ **"Web Service"**.
   * Piliin ang repository: `Chardddyyy/nstp-system`.
3. **I-configure ang Build Settings:**
   * **Name:** `nstp-system-backend`
   * **Region:** Singapore o Oregon (pinakamalapit sa iyong Aiven cluster).
   * **Branch:** `main`
   * **Root Directory:** `backend` (o iwanang blank kung gamit ang unified server script).
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
4. **I-setup ang Environment Variables sa Render Dashboard:**
   Pumunta sa tab na **"Environment"** at ilagay ang mga kinakailangang credentials:

| Environment Variable | Value Example / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DB_HOST` | `mysql-xxxxx.aivencloud.com` |
| `DB_PORT` | `14333` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | `[Inyong Aiven Database Secret Password]` |
| `DB_NAME` | `defaultdb` o `nstp_system` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | `nstp-super-secure-jwt-token-2026` |
| `FRONTEND_URL` | `https://chardddyyy.github.io` |

5. **Deploy & Health Check:**
   I-click ang **"Create Web Service"**. Kapag tapos na mag-build, bisitahin ang `https://your-service.onrender.com/health` upang kumpirmahing nagbabalik ito ng `{"status":"ok"}`.

---

## 5. User Guide (Gabay sa Paggamit ng Sistema)

### 🔐 1. Pag-login sa System
1. Buksan ang website sa iyong browser: `https://chardddyyy.github.io/nstp-system/`.
2. I-click ang **"Portal Login"** sa kanang bahagi sa itaas.
3. Ilagay ang iyong CvSU institutional email at password.
4. I-click ang **"Sign In"** para makapasok sa Dashboard ayon sa iyong tungkulin (**Admin** o **Instructor**).

---

### 📋 2. Pag-input at Pag-manage ng Student Records (Admin & Instructor)
1. Sa kaliwang navigation sidebar, i-click ang **"Students"** (o **"Student Management"**).
2. Para magdagdag ng estudyante:
   * I-click ang berdeng **"+ Add Student"** button sa kanang itaas.
   * Punan ang kinakailangang impormasyon: Student ID, Pangalan, Email, Department Track (ROTC/CWTS/LTS), Course, at Section.
   * I-click ang **"Save Student"**.
3. Para mag-edit o mag-delete ng estudyante:
   * Gamitin ang Search bar para hanapin ang apelyido o Student ID.
   * I-click ang **Edit (Kendi/Lapis icon)** o **Delete (Trash icon)** sa gilid ng record.

---

### 📥 3. Pagsusuri ng Online Enrollments (Pending Applications)
1. Sa navigation sidebar, pumunta sa **"Enrollment"** tab.
2. Makikita ang listahan ng mga estudyanteng nag-submit online kasama ang kanilang ID photo at Certificate of Registration (COR).
3. I-click ang **"Approve"** para pumasok agad ang estudyante sa opisyal na masterlist, o **"Decline"** kung may maling dokumento.

---

### 📊 4. One-Click Excel at PDF Export (Paggawa ng CHED Reports)
Upang mag-download ng handa nang i-print na report para sa CHED:
1. Pumunta sa **"Reports"** o **"Students"** section.
2. Piliin ang nais na Filter (halimbawa: Track: `CWTS`, Section: `BSIT 1-1`, School Year: `2025-2026`).
3. I-click ang **"Export CHED Matrix (Excel)"** o **"Export Form 2-B (.xlsx)"** button.
4. Kusa nang idodownload ng browser ang `.xlsx` spreadsheet na may kumpletong standard header, borders, auto-fitted widths, at nakalagay na opisyal na format na handang-handa nang i-print!

---

### 💬 5. Realtime Chat & File Collaboration
1. I-click ang **"Chat"** sa sidebar.
2. Piliin ang conversation sa kaliwa (Direct chat sa kapwa instructor o Group Channel).
3. Pwede kang mag-send ng mensahe, mag-upload ng files/photos, mag-record ng voice notes, o maghanap ng lumang pinag-usapan gamit ang **In-Chat Search Bar (🔍)**.

---

### 📱 6. Live QR Code Attendance Tracking & 15-Day Master Matrix (Instructors & Admin)

Ang sistema ay may enterprise-grade, real-time camera QR attendance tracking na may sumusunod na mga panuntunan:

#### A. Dalawang Yugto ng Pag-scan (Two-Step Workflow):
1. **Hakbang 1 (Session Configuration Setup):**
   * **Piliin ang Araw (Day 1 hanggang Day 15):** Awtomatikong naka-lock ang mga araw na natapos na (`Conducted / Closed`) upang maiwasan ang aksidenteng pagbura o overwrite ng naitalang attendance.
   * **Session Activity Name:** Isusulat ng instructor ang tiyak na aktibidad (hal. *Orientation, Community Profiling, Tree Planting*).
   * **Session Start Time & Grace Period:** Itinatakda ng guro ang oras ng simula (hal. `08:00 AM`) at ang grace period tolerance (`0 min`, `10 mins`, `15 mins`, o `30 mins`).
   * **Visual Cutoff Display:** Awtomatikong kinakalkula at ipinapakita ng system ang eksaktong oras ng late cutoff (hal. `08:15 AM`).

2. **Hakbang 2 (Live QR Scanner & Session Attendees Roster):**
   * **Live Camera Viewfinder:** Ipinapakita ang WebRTC camera stream na may real-time audio beeps (mataas na beep para sa successful scan, mababang beep para sa warning/error).
   * **Active Scanner Toggle:** Madaling lumipat sa pagitan ng `TIME_IN` at `TIME_OUT`.
   * **Mahigpit na Panuntunan:** Hindi maaaring mag-`TIME_OUT` ang sinumang estudyante na walang naitalang `TIME_IN` sa araw na iyon.

#### B. Awtomatikong Lateness Detection & Cutoff Algorithm:
* Kapag nag-scan ng `TIME_IN` ang estudyante at ang kasalukuyang oras ay lumampas na sa Cutoff Time (`session_start_time + grace_period`), awtomatiko itong mamarkahan bilang **`Late (L)`**.
* Kapag nag-Time-Out ang estudyante sa hapon, mananatiling `Late` ang status nito dahil sa naunang late time-in.

#### C. Strict Single-Entry Deduplication Engine:
* Bawat estudyante ay may **isang natatanging card lamang** sa listahan ng mga dumalo sa kasalukuyang session (`Attendees List`).
* Kapag nag-Time-In ang estudyante, itatala ang `In: [oras]`.
* Kapag nag-Time-Out ang parehong estudyante, **hindi ito dadami o magiging duplicate**; sa halip, ia-update ang existing entry nito upang ipakita ang `In: [oras]` at `Out: [oras]`, at magiging `Present (P)` (o `Late (L)` kung nahuli sa umaga).

#### D. Pagtatala ng Hindi Nag-Time-Out (Incomplete Attendance):
* Alinsunod sa patakaran ng unibersidad, ang mga estudyanteng nag-Time-In lamang ngunit **hindi nag-Time-Out** bago i-save ang attendance ay awtomatikong itatala bilang **`Incomplete (INC)`**.

#### E. Pag-excuse ng Estudyante (Excuse Student Workflow):
* Para sa mga estudyanteng may balidong excuse letter, medikal na dahilan, o opisyal na representasyon ng unibersidad, maaaring i-click ng instructor ang **"Excuse Student"** button.
* May built-in search upang mabilis na piliin ang estudyante, maglagay ng preset o customized na dahilan, at awtomatiko itong maitala bilang **`Excused (E)`**.

#### F. 15-Day Master Attendance Matrix Ledger:
* May nakalaang interactive matrix modal kung saan makikita ang bawat estudyante sa buong 15 araw ng semestre.
* Awtomatikong naka-filter sa track ng instructor (walang manual dropdown para sa instructors) at may opisyal na Matrix Legend:
  * 🟢 **P (Present):** Buong oras na pumasok (may Time-In at Time-Out).
  * 🔴 **A (Absent):** Walang record ng pagpasok sa natapos na araw.
  * 🟡 **L (Late):** Pumasok nang lumagpas sa itinakdang grace period cutoff.
  * 🔵 **E (Excused):** May opisyal na excuse letter o pinahintulutang pagliban.
  * 🟠 **INC (Incomplete):** Nag-Time-In lamang ngunit hindi nag-Time-Out.
  * ⚪ **— (Future / Not Yet Conducted):** Araw na hindi pa dumarating.

---

*Dokumentasyong Inihanda Para sa CvSU Naic NSTP Office — Bersyon 2026.*

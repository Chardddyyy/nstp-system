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

### 📊 One-Click Excel Export (Automated Report Generation)
Ang automated report generation ng sistema ay idinisenyo upang mag-produce ng **Commission on Higher Education (CHED) Standard OSDS-NSTP Form A (Summary Matrix)** at **Form B (Student Masterlist by Track & Section)**.

Gumagamit ang system ng Python na may **openpyxl** at **pandas** para sa pag-proseso ng datos at direktang pag-inject sa official spreadsheet templates (`scripts/generate_nstp_reports.py`, `scripts/generate_form_a_openpyxl.py`, `scripts/generate_form_b_openpyxl.py`).

#### Paano Gumagana ang Export Pipeline:
1. **Data Ingestion:** Kinukuha ng system ang mga aktibo at aprubadong estudyante mula sa MySQL database (o frontend JSON payload).
2. **Template Loading:** Binubuksan ng script ang official CHED blank template (`OSDS-NSTP-Form-2-A.xlsx` o `OSDS-NSTP-Form-2-B.xlsx`).
3. **Row Expansion & Value Insertion:** Kusa nitong pinupunan ang mga linya simula sa header boundary, pinapanatili ang formula summaries, at inilalapat ang formatting.
4. **Print Optimization & Auto-fit:** Nilalapatan ng text-wrapping, center-alignment sa numerics, at standard thin borders ang bawat cell bago i-save bilang bagong `.xlsx` file.

---

### 📐 Spreadsheet Formatting Logic & Settings (Print-Ready Output)
Upang masiguradong handa na agad i-print sa **A4 Landscape** o **Legal** paper ang Excel nang walang putol na columns o magulong formatting, ginagamit ang mga sumusunod na specific code logic:

```python
import openpyxl
from openpyxl.styles import Alignment, Border, Side, Font, PatternFill
from openpyxl.worksheet.properties import WorksheetProperties, PageSetupProperties
from openpyxl.utils import get_column_letter

def enforce_print_setup(ws):
    """
    Tinitiyak na ang Excel worksheet ay naka-set sa Landscape A4
    at naka-fit sa 1 page wide (fitToWidth = 1).
    """
    if ws.sheet_properties is None:
        ws.sheet_properties = WorksheetProperties()
    if ws.sheet_properties.pageSetUpPr is None:
        ws.sheet_properties.pageSetUpPr = PageSetupProperties()
    ws.sheet_properties.pageSetUpPr.fitToPage = True

    # Orientation at Paper Size (9 = A4 Paper)
    ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0  # 0 allows automatic multi-page vertical flow

    # Margins (sa pulgada) para sa maximum print coverage
    ws.page_margins.left = 0.25
    ws.page_margins.right = 0.25
    ws.page_margins.top = 0.5
    ws.page_margins.bottom = 0.5

def apply_cell_styling_and_autofit(ws, start_row, end_row):
    """
    Inilalapat ang text wrapping, borderlines, at dynamic auto-fitting
    ng column widths base sa haba ng text content.
    """
    thin_side = Side(border_style="thin", color="000000")
    cell_border = Border(top=thin_side, left=thin_side, right=thin_side, bottom=thin_side)
    
    # 1. Pag-apply ng Borders at Text Wrapping sa Rows
    for row in ws.iter_rows(min_row=start_row, max_row=end_row, min_col=1, max_col=ws.max_column):
        for cell in row:
            cell.border = cell_border
            # Pag-center kung student number, sex, o contact, left-align naman kung pangalan
            if cell.column in [1, 5, 6, 8, 10]:  # No., Sex, Birthday, Contact
                cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

    # 2. Dynamic Auto-Fitting ng Column Widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val = str(cell.value or '')
            if cell.row >= start_row and val:
                max_len = max(max_len, len(val))
        # Magdagdag ng padding para hindi maging masikip
        ws.column_dimensions[col_letter].width = max(max_len + 3, 11)
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

#### 4. Table: `student_grades`
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

#### 5. Table: `conversations` at `messages`
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
*Dokumentasyong Inihanda Para sa CvSU Naic NSTP Office — Bersyon 2026.*

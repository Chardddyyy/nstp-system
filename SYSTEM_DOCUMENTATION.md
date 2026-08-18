# 📘 CvSU Naic NSTP Record & Report Management System
## 📄 Opisyal na Dokumentasyon at Presentation Script para sa Oral Defense

---

## 🎙️ 1. Mabilisang Script at Presentation Guide (Babasahin Nito sa Defense)

> **TIP:** Pwedeng-pwede mo itong basahin o sabihin nang direkta sa iyong panel/evaluators habang nire-presenta ang system!

### 🗣️ Panimula (System Overview & Background)
> *"Magandang araw po. Ang inihahandog po namin ay ang **CvSU Naic NSTP Record & Report Management System** — isang makabagong web-based platform na ginawa natin para sa **Cavite State University - Naic Campus NSTP Office**.*
>
> *Dati po, ang pagpaparehistro ng NSTP at pag-aayos ng student masterlist ay ginagawa nang mano-mano sa papel at Excel sheets, na nagdudulot ng delay sa pag-submit sa CHED at madalas na pagkawala ng mga dokumento.*
>
> *Sa pamamagitan ng ating bagong system, nagawa nating **fully digital, mabilis, at highly secure** ang buong proseso mula sa Student Registration hanggang sa CHED Masterlist Reporting."*

---

### 🗣️ Mga Pangunahing Tampok ng System (Key System Features)

#### 1. 📝 Online Student Registration & Enrollment Portal
> *"Ang mga bagong estudyante (Freshmen) ay pwedeng mag-enroll online sa tatlong NSTP components: **CWTS, LTS, at ROTC**.*
> * * **Institutional Email Strict Enforcement:** Tanging opisyal na `@cvsu.edu.ph` student emails lamang ang pinapayagang mag-register.*
> * * **iPhone Photo Auto-Converter:** Awtomatikong kino-convert ng system ang mga `.HEIC` photos mula sa iPhone papuntang `.JPEG` para walang error sa submission.*
> * * **Filipino Character Support:** Buong suportado ang letrang **ñ / Ñ** at proper Title Casing para sa tamang ebidensya ng pangalan sa rekord.*

#### 2. 🛡️ Multi-Layered Anti-Troll Security System
> *"Para maiwasan ang mga nagta-try mag-enroll nang peke o nan-titrip:*
> * * **Google reCAPTCHA v2:** May opisyal na 'I'm not a robot' Google security checkbox.*
> * * **Student ID Pattern Check:** Binoblock ng system ang mga paulit-ulit o pekeng numero (tulad ng 11111111 o 12345678).*
> * * **IP Rate Limiting:** Hanggang 4 na enrollment attempts lang bawat 15 minuto ang pinapayagan bawat device/IP.*
> * * **Security Audit Box:** Nakikita ng Admin ang IP Address at Browser Details ng bawat nag-submit para sa buong accountability."*

#### 3. 📊 Student Roster & 1-Click CHED Excel Masterlist Exporter
> *"Naka-organisa ang libo-libong mag-aaral ayon sa Batch Year, Program (`BSIT`, `BSCS`, `BSFAS`, `BSBA`, `BSEd`, `BEED`, `BSHM`), Component (`CWTS`, `LTS`, `ROTC`), at Section.*
> * Sa isang click lang ng button na **'Export CHED Excel'**, awtomatikong nagge-generate ang system ng opisyal na formatted Excel sheet na handang-handa nang isumite sa Commission on Higher Education."*

#### 4. 💬 Real-time Communication 
> *"May built-in communication hub ang Admin at Instructors:*
> * * Direct messaging at **All-Instructors Group Chat**.*
> * * Instant image and file attachment sharing.*


#### 5. ☁️ Automatic Google Drive Cloud Backup
> *"Lahat ng datos (100% ng 13 MySQL database tables) ay awtomatikong binaback-up at pino-protektahan sa **Google Drive Storage** tuwing may bagong enrollment, report submission, o student status update."*

---

## 📌 2. Pangkalahatang Impormasyon (System Overview & Technical Architecture)
Ang **CvSU Naic NSTP Record & Report Management System** ay isang makabagong, web-based platform na sadyang idinisenyo para sa **Cavite State University - Naic Campus National Service Training Program (NSTP) Office**.

Layunin nitong i-automate, gawing mabilis, ligtas, at digital ang lahat ng proseso at talaan ng NSTP:
* **Online Student Registration & Enrollment**: Pagpaparehistro ng mga bagong mag-aaral (Freshmen) sa tatlong NSTP components (**CWTS, LTS, at ROTC**) gamit ang automatic HEIC-to-JPEG conversion para sa mga kuha sa iPhone, PDF document viewer, at input validation para sa mga pangalang may letrang **ñ / Ñ**.
* **Student Roster & CHED Export**: Pag-organisa ng libo-libong mag-aaral ayon sa Batch Year, Program (`BSIT`, `BSCS`, `BSFAS`, `BSBA`, `BSEd`, `BEED`, `BSHM`), Component (`CWTS`, `LTS`, `ROTC`), at Section. May tampok na **CHED Excel Masterlist Exporter**.
* **Reports, Letter Formats, & Calendar**: Paglikha at pagpasa ng mga report requirements, opisyal na pormat ng liham (Letter Formats), at kalendaryo ng mga gawain at pista opisyal.

---

## 🖼️ 2. Talaan ng mga Sanggunian at Asset (Media & Image References)

Lahat ng mga larawan, logo, media assets, at external URLs na ginamit sa sistema ay opisyal na nakatala sa ibaba:

| Media Asset / File Path | Uri / Format | Deskripsyon at Pinagmulan (Source / Usage) |
| :--- | :--- | :--- |
| `file:///public/cvsu.png` | PNG Image | **Opisyal na Seal ng Cavite State University (CvSU)**. Ginamit bilang brand logo sa Header ng lahat ng pahina (`AdminDashboard`, `InstructorDashboard`, `StudentManagement`, `Reports`, `Chat`, `Calendar`, `LetterFormats`, `Profile`). |
| `file:///public/cvsunaiccampus.png` | PNG Image | **Larawan ng CvSU Naic Main Campus Entrance**. Ginamit sa Hero Section ng Landing Page. |
| `file:///public/cwts-cover.jpg` | JPG Image | **Civic Welfare Training Service (CWTS) Banner Photo**. Larawan ng mga estudyanteng nag-a-outreach at community service. |
| `file:///public/lts-cover.jpg` | JPG Image | **Literacy Training Service (LTS) Banner Photo**. Larawan ng mga estudyanteng nagtuturo ng literacy at numeracy sa mga kabataan. |
| `file:///public/IMG_9578.JPG` | JPG Image | **Reserve Officers' Training Corps (ROTC) Cadets Photo**. Larawan ng mga ROTC cadets sa military training at Sunday drills. |
| `file:///public/nstp-orientation.mp4` | MP4 Video | **Opisyal na Audio-Visual Orientation Video** ng CvSU Naic NSTP Office na pwedeng i-play sa Landing Page. |
| `Google Maps Location Link` | External URL | Link papuntang CvSU Naic Campus sa Google Maps: [CvSU Naic Google Maps](https://www.google.com/maps/search/?api=1&query=Cavite+State+University+-+Naic). |
| `Google Apps Script Webhook` | API Endpoint | Webhook URL para sa awtomatikong pag-backup ng records papuntang **Google Drive Sheet / Storage**. |
| `file:///public/favicon.ico` & `file:///public/icons/` | App Icons | Web Icons para sa Browser Favicon at Progressive Web App (PWA) manifest support (`192x192` at `512x512` PNG). |

---

## 🛠️ 3. Mga Teknolohiya at Tools na Ginamit (Tech Stack & Architecture)

### 🎨 Frontend Framework & UI Engine
* **React 19 (Vite 7)**: SPA architecture para sa mabilis na pag-load nang walang full page reloads.
* **Tailwind CSS v4**: Modern CSS utility system para sa sleek dark/emerald design system, responsive grid layouts, at micro-animations.
* **Lucide React**: Vector SVG icon library.
* **React Router DOM v7**: Dynamic routing at Role-based Protected Route System.
* **Heic2any Library**: Automatic client-side conversion ng `.HEIC` photos mula sa iOS devices papuntang `.JPEG` bago i-upload.

### ⚙️ Backend API & Database Infrastructure
* **Node.js & Express.js**: RESTful API Web Server.
* **MySQL 8.0 / MariaDB**: Relational Database Engine na may `mysql2/promise` connection pool.
* **JWT (JSON Web Tokens)**: Secure token-based authentication system.
* **BcryptJS**: Password hashing algorithm (12 salt rounds) para sa proteksyon ng passkeys.
* **Helmet.js & Express Rate Limit**: Proteksyon sa HTTP headers at rate limiting (3,000 requests per 15 min global limit).
* **ExcelJS & XLSX (SheetJS)**: Automated formatting at generation ng CHED NSTP Excel enrollment masterlists.

---

## 🗄️ 4. Estruktura ng Database Schema (MySQL Database Tables)

Ang database ay binubuo ng mga sumusunod na talahanayan (Tables):

1. **`users`**: Impormasyon ng mga Admin at Instructor accounts (Email, Hashed Password, Role, Department, Avatar, Profile Picture).
2. **`students`**: Masterlist ng mga aprubadong estudyante kasama ang kumpletong CHED fields (First/Middle/Last Name, Street, Municipality, Province, Birthdate, Age, Voter Status, Program, Section, Department, at Registration Photo).
3. **`enrollments`**: Talaan ng mga bago at pending na registration form submissions.
4. **`reports`**: Mfa inaatas na requirements at report assignments ng Admin para sa mga Instructors.
5. **`report_submissions`**: Mga isinumiteng report files at attachment ng mga Instructors.
6. **`report_comments`**: Balitaktakan at komento ng Admin at Instructor sa bawat report.
7. **`conversations` & `conversation_participants`**: Talaan ng mga direct messages at All-Instructors Group Chat.
8. **`messages`**: Mga mensahe, larawang ipinadala, at reactions sa chat.
10. **`archives`**: Naka-archive na lumang Batch Years (Read-only historical data).
11. **`audit_logs`**: System audit trail (Timestamp, User ID, Action, IP Address, at Details).

---

## 📂 5. Estruktura ng mga Files sa System (Directory Structure)

```
nstp-system/
├── backend/
│   ├── config/
│   │   ├── database.js          # Connection pool (Connection limit: 10)
│   │   └── dbEnv.js             # Environment SSL & DB Host configurations
│   ├── database/
│   │   └── schema.sql           # Database tables single source of truth
│   ├── scripts/                 # Utility scripts (seed data, migration helpers)
│   ├── server.js                # Main Express REST API server & auto-migrations
│   └── .env                     # Local environment variables
├── public/                      # Static media assets (Logos, Banners, Video)
├── src/
│   ├── assets/                  # CSS & static resources
│   ├── components/              # Shared UI components (Sidebar, Modals, Overlays)
│   ├── context/                 # AuthContext & state management
│   ├── pages/
│   │   ├── AdminDashboard.jsx   # Super Admin Portal & Analytics
│   │   ├── InstructorDashboard.jsx # Instructor Class Roster & Metrics
│   │   ├── StudentManagement.jsx # Student Masterlist & CHED Excel Exporter
│   │   ├── Reports.jsx          # Requirements & Submission Hub
│   │   ├── Chat.jsx             # Real-time Chat & WebRTC Video Calls
│   │   ├── Calendar.jsx         # Academic Activities & Holiday Tracker
│   │   ├── LetterFormats.jsx    # Official Templates & Attachment Downloads
│   │   ├── Profile.jsx          # Profile Settings & Account Management
│   │   ├── Landing.jsx          # Public Landing Page & Enrollment Guide
│   │   ├── Enrollment.jsx       # Student Online Registration Form
│   │   └── Login.jsx            # Portal Authentication Page
│   ├── services/
│   │   └── api.js               # Frontend API helper & HTTP endpoints
│   ├── App.jsx                  # Main React Routing & App Provider
│   └── main.jsx                 # Entry point & global error handlers
└── SYSTEM_DOCUMENTATION.md      # Opisyal na Dokumentasyon
```

---

## 🔘 6. Kompletong Talaan ng lahat ng Button Functions sa System (Page-by-Page Button Guide)

### 1. 🏠 Landing Page (`Landing.jsx`)
* **"Enroll Now" / "Mag-register Na" Button**: Nagno-navigate papuntang Online Student Registration Form (`/enrollment`).
* **"Portal Login" / "Mag-login" Button**: Nagno-navigate papuntang Authentication Portal (`/login`).
* **"Play Video Orientation" Button**: Nagbubukas ng modal window na nag-i-stream ng CvSU Naic NSTP Audio-Visual Orientation video (`/public/nstp-orientation.mp4`).

---

### 3. 📝 Online Enrollment Portal (`Enrollment.jsx`)
* **Multi-Step Form Tab Buttons ("Personal Info", "Academic Info", "Address & Contact", "Guardian Info", "Review & Submit")**: Nagno-navigate sa bawat bahagi ng registration form habang pinaiiral ang client-side validation sa bawat step.
* **"Upload 2x2 Photo" Button**: Nagbubukas ng file picker o camera capture. Kino-compress at kino-convert ang anumang larawan (kasama ang `.HEIC` mula sa iPhone) papuntang optimized `.JPEG` base64.
* **"Upload ID / COR Photo" Button**: Nag-a-upload ng katibayan ng pag-enroll (Student ID o Certificate of Registration).
* **reCAPTCHA Checkbox**: Verification mula sa Google reCAPTCHA v2 para harangan ang mga automated spam bots (may mobile fallback).
* **"Submit Application" Button (`type="submit"`)**: Nagpapatakbo ng input sanitization (Title Case, parehong institutional `@cvsu.edu.ph` at personal email support tulad ng Gmail/Yahoo, Student ID check, preservation ng letrang ñ/Ñ), nagse-send ng `POST /api/enrollments`, nagtatala ng audit log na may IP address, nagte-trigger ng cloud backup sa Google Drive, at nagpapakita ng modal na may Reference Number.
* **"Clear Form / Reset" Button**: Nagli-linis ng lahat ng input field at nagtatanggal ng nakasave na local draft (`enrollmentFormData`).

---

### 4. 👑 Admin Dashboard (`AdminDashboard.jsx`)
* **Quick Stats Cards ("Total Students", "Pending Approvals", "Reports Submitted", "Active Instructors") Buttons**: Clickable metrics na nagdidirekta sa filtered views sa Student Management o Reports.
* **"Approve Enrollment" Button (Checkmark Icon)**: Tumatawag sa `PUT /api/enrollments/:id/approve`. Inililipat ang estudyante mula sa `enrollments` table papuntang `students` masterlist, nag-a-assign ng active Batch Year, nagse-send ng toast notification, nagtatala ng audit log (`enrollment_approved`), at nag-e-execute ng Google Drive backup.
* **"Reject Enrollment" Button (X Icon)**: Nagbubukas ng modal para sa dahilan ng pag-reject, tumatawag sa `PUT /api/enrollments/:id/reject`, nagtatala ng audit log, at nagse-send ng notification.
* **"View Application Details" (Eye Icon) Button**: Nagbubukas ng modal drawer na nagpapakita ng buong registration details, 2x2 photo, COR photo, tirahan, at audit IP Address.
* **"Manage Batch Years / Archive Year" Button**: Nagbubukas ng modal para mag-snapshot ng kasalukuyang batch year papunta sa read-only `archives` table at mag-umpisa ng bagong Academic Year.
* **"Backup Database to Google Drive" Button**: Manwal na nagte-trigger ng agad na cloud backup webhook papunta sa Google Apps Script / Google Drive Sheet.
* **"View System Audit Logs" Button**: Nagbubukas ng security audit trail drawer na nagpapakita ng live logs (`audit_logs` table: Timestamp, User ID, Action, IP Address, Details).

---

### 5. 👨‍🏫 Instructor Dashboard (`InstructorDashboard.jsx`)
* **Department Metric Cards ("My Students", "Pending Requirements", "Recent Messages") Buttons**: Mabilis na navigation papunta sa section roster o pending reports.
* **"Submit Required Report" Button**: Direct shortcut papuntang `/reports` na may nakapiling requirement filter.
* **Section Selector Buttons**: Pinipili at nino-narrow down ang nakikitang datos ayon sa CWTS, LTS, o ROTC section.

---

### 6. 🎓 Student Management (`StudentManagement.jsx`)
* **"Export CHED Excel Masterlist" Button**: Tumatawag sa `GET /api/students/ched-export` o gumagamit ng ExcelJS/XLSX engine para mag-generate ng opisyal na formatted `.xlsx` masterlist spreadsheet na tumutupad sa pormat ng Commission on Higher Education (CHED).
* **"Add New Student" Button**: Nagbubukas ng modal form para sa manwal na pagdaragdag ng estudyante (Admin lang).
* **"Edit Student" Button (Pencil Icon)**: Nagbubukas ng modal para mag-update ng program, section, o contact info (`PUT /api/students/:id`).
* **"Delete Student" Button (Trash Icon)**: Nagpapakita ng confirmation dialog bago permanenteng burahin ang student record (`DELETE /api/students/:id`).
* **"View Student Profile" Button (Eye Icon)**: Nagbubukas ng kumpletong modal drawer ng estudyante (2x2 photo, tirahan, emergency contact, enrollment timestamp).
* **Clear Search ("X") Button**: Agad na nagtatanggal ng search keyword at ibinabalik ang buong roster view.
* **Filter Dropdowns (Batch Year, Component, Program, Section)**: Live filtering ng masterlist table nang walang reload.
* **"Sync Google Drive Backup" Button**: Nag-e-execute ng cloud backup sync ng kasalukuyang student roster.

---

### 7. 📑 Reports Hub (`Reports.jsx`)
* **"Create Report Assignment" Button (Admin Only)**: Nagbubukas ng modal para sa bagong requirement (Title, Target Department: All/CWTS/LTS/ROTC, Deadline, Description, Attachment Template). Tumatawag sa `POST /api/reports`.
* **"Submit Report" Button (Instructor)**: Nagbubukas ng submission modal para sa pag-attach ng files/images at komento. Tumatawag sa `POST /api/reports/:id/submit`.
* **"View Submission / Review Requirements" Button**: Nagbubukas ng modal para suriin ang isinumiteng file ng instructor, oras ng submission, at approval status.
* **"Approve Submission" Button (Admin)**: Nag-u-update ng status sa Approved, nagtatala ng audit log, at nagno-notify sa instructor.
* **"Request Revision / Reject" Button (Admin)**: Ibinabalik ang report sa instructor na may kasamang revision instructions.
* **"Download Attached File" Button**: Kino-convert ang base64 attachment pabalik sa totoong maida-download na file.
* **"Post Comment" Button**: Nagdaragdag ng real-time comment sa talakayan ng requirement (`POST /api/reports/:id/comments`).

---

### 8. 💬 Real-Time Chat (`Chat.jsx`)
* **"New Chat / Start DM" Button**: Nagbubukas ng modal para pumili ng Admin o Instructor na kakausapin.
* **"All-Instructors Group Chat" Channel Button**: Lumilipat sa pang-lahatang group chat ng lahat ng faculty members.
* **"Send Message" Button**: Nagpapadala ng text message, timestamp, at attachments (`POST /api/conversations/:id/messages`).
* **"Attach File / Image" Button**: Pumipili ng larawan o dokumento, kino-convert sa base64, at ina-attach sa mensahe.

---

### 9. 📅 Calendar (`Calendar.jsx`)
* **"Add Academic Event" Button (Admin Only)**: Nagbubukas ng modal para sa bagong event (Title, Category: Community Outreach, Submission Deadline, Holiday, Exam, Date).
* **"Edit / Delete Event" Buttons**: Nag-u-update o nagtatanggal ng nakatakdang event.
* **Month Navigation Buttons ("`<` Previous", "`>` Next", "Today")**: Naglilipat ng view sa nakaraang buwan, susunod na buwan, o kasalukuyang araw.

---

### 10. 📄 Letter Formats (`LetterFormats.jsx`)
* **"Download Document Template" Buttons**: Agad na nagda-download ng mga pormal na template ng dokumento (Excuse Letter, Parental Consent Form, Endorsement Letter, Activity Proposal Form).

---

## 🛡️ 7. Simple at Madaling Intindihing Panseguridad (Security Architecture Explained Simply)

Kung tatanungin ka sa defense: *"Paano gumagana ang Security ng System niyo?"*, ipaliwanag mo sa simpleng paraan gamit ang 6 na proteksyong ito:

1. **🔑 Susi at Passcode (JWT Token at Session Interceptor)**
   * Para itong **Digital ID Card / Badge**. Kapag nag-login ang Admin o Instructor, binibigyan sila ng secure token (`JWT`). Kapag nag-expire ang token, awtomatikong ilalabas ng system ang user para walang makapasok na iba.

2. **🔒 Naka-Lock na Password (Bcrypt Encryption - 12 Salt Rounds)**
   * Walang kahit sinong nakakakita ng totoong password sa database. Lahat ng password ay ginagawang magkakasunod na random characters (Hash) gamit ang **BcryptJS**. Kahit mabuksan ang database, hindi mababasa ang password.

3. **🛑 Proteksyon sa Spam at Trolls (reCAPTCHA v2 & Rate Limiting)**
   * **reCAPTCHA Checkbox**: Tinitiyak na tao at hindi bot ang nag-e-enroll.
   * **IP Rate Limiting**: Limitado sa 4 na enrollment submissions lang bawat 15 minuto bawat IP address.
   * **Email Support**: Tinatanggap pareho ang institutional email (`@cvsu.edu.ph`) at mga personal email (Gmail, Yahoo, etc.).

4. **🔤 Malinis na Inputs at Letrang Ñ (Input Sanitization & ñ/Ñ Support)**
   * Pinapayagan ng system ang mga totoong pangalang Pilipino na may letrang **ñ at Ñ**, habang binoblock at linilinis nito ang mga mapanirang script tags (`<script>`) o SQL commands.

5. **🗄️ Proteksyon sa Database Hacking (100% Parameterized SQL Statements)**
   * Lahat ng data queries ay gumagamit ng MySQL `?` placeholders. Pinipigilan nito ang **SQL Injection (SQLi)** o ang pagpasa ng masasamang utos sa database.

6. **📊 IP Audit Trail at Google Drive Backup**
   * **IP Logging**: Itinatala ng system ang IP Address ng bawat nagse-submit o nag-a-update ng datos para sa buong accountability.
   * **Google Drive Backup**: Tuwing may bagong enrollment o report, awtomatikong binaback-up ang datos sa Google Drive Storage para sigurado ang 0% data loss.

---

## 🛠️ 8. Ginamit na Software at Open-Source Libraries (Tech Stack)

* **Node.js & Express.js**: Ang backend REST API server na namamahala sa database at security.
* **React 19 (Vite 6)**: Ang mabilis na frontend UI engine para sa Single Page Application (SPA).
* **MySQL 8.0 & `mysql2/promise`**: Ang relational database connection pool.
* **BcryptJS & JSONWebToken (JWT)**: Para sa password encryption at token authorization.
* **Helmet.js & Express-Rate-Limit**: Para sa HTTP headers security at IP anti-spam protection.
* **ExcelJS & XLSX (SheetJS)**: Para sa automated 1-click CHED Excel masterlist generation.
* **Tailwind CSS v4 & Lucide React**: Para sa modern UI styling at vector icons.
* **Heic2any & Canvas API**: Para sa automatic photo compression at iPhone `.HEIC` image conversion.

---

## 📊 9. Telemetry at Real-Time System Metrics

Ang telemetry ng sistema ay nagbibigay ng eksaktong talaan para sa monitoring:
* **Active Online Users Ping**: Nagsasagawa ng regular na telemetry check sa server (`/api/telemetry`) upang malaman kung ilang users ang kasalukuyang active.
* **Audit Trail Telemetry**: Bawat mahalagang transaction (Login, Enrollment Submit, Report Approval, Password Change) ay nagtatala ng Exact Timestamp, Action, User ID, at Client IP Address sa `audit_logs` table.
* **Database Pool Health**: Awtomatikong pinapamahalaan ng MySQL connection pool (10 concurrent limits) ang pag-query nang walang system overload.

---

## 📚 7. Opisyal na Sanggunian (APA 7th Edition References)

Ang mga sumusunod ay ang pormal na talaan ng mga sanggunian (APA 7th Edition Style) para sa mga legal basis, institutional assets, software frameworks, at mga larawan/media na ginamit sa pagbuo ng **CvSU Naic NSTP Record & Report Management System**:

### 🏛️ Legal & Institutional Framework References
* Commission on Higher Education. (2021). *Revised implementing rules and regulations of the National Service Training Program (NSTP)* (CHED Memorandum Order No. 01, Series of 2021). Office of the President of the Philippines, CHED.
* Cavite State University - Naic. (2024). *CvSU Naic official logo and campus imagery* [Graphics & photographs]. CvSU Naic Information & Communications Technology Office. https://cvsu.edu.ph
* Republic Act No. 9163. (2002). *An Act establishing the National Service Training Program (NSTP) for tertiary level students, amending for the purpose Republic Act No. 7077 and Presidential Decree No. 1706, and for other purposes*. Congress of the Philippines. https://www.officialgazette.gov.ph/2002/01/23/republic-act-no-9163/

### 🖼️ Media Assets & Mapping References
* Cavite State University - Naic. (2024). *CvSU Naic Main Entrance Gate* [Photograph]. CvSU Naic Public Affairs Office. `file:///public/cvsunaiccampus.png`
* Cavite State University - Naic. (2024). *Civic Welfare Training Service (CWTS) community outreach activities* [Photograph]. CvSU Naic NSTP Office. `file:///public/cwts-cover.jpg`
* Cavite State University - Naic. (2024). *Literacy Training Service (LTS) child literacy program* [Photograph]. CvSU Naic NSTP Office. `file:///public/lts-cover.jpg`
* Cavite State University - Naic. (2024). *Reserve Officers' Training Corps (ROTC) cadet training formation* [Photograph]. CvSU Naic ROTC Unit. `file:///public/IMG_9578.JPG`
* Google Maps. (2026). *Map location of Cavite State University - Naic Campus* [Digital map]. Alphabet Inc. https://www.google.com/maps/search/?api=1&query=Cavite+State+University+-+Naic

### 💻 Open Source Software & Technical References
* Express Core Team. (2024). *Express: Fast, unopinionated, minimalist web framework for Node.js* (Version 4.19.0) [Computer software]. OpenJS Foundation. https://expressjs.com
* Lucide Contributors. (2024). *Lucide React: Beautiful & consistent icon toolkit* (Version 0.344.0) [Computer software]. Lucide Open Source Community. https://lucide.dev
* Meta Open Source. (2024). *React: JavaScript library for building user interfaces* (Version 19.0.0) [Computer software]. Meta Platforms, Inc. https://react.dev
* Node.js Project. (2024). *Node.js cross-platform JavaScript runtime environment* (Version 20.0.0) [Computer software]. OpenJS Foundation. https://nodejs.org
* SheetJS LLC. (2024). *SheetJS Community Edition: Spreadsheet data parser and exporter* (Version 0.18.5) [Computer software]. SheetJS. https://sheetjs.com
* Tailwind Labs Inc. (2024). *Tailwind CSS: Utility-first CSS framework* (Version 4.0.0) [Computer software]. Tailwind Labs. https://tailwindcss.com
* Vite Core Team. (2024). *Vite: Next-generation frontend tooling* (Version 6.0.0) [Computer software]. Vite Project. https://vitejs.dev

---

*Inihanda para sa: Cavite State University Naic - National Service Training Program Office*  
*Huling Na-update: Agosto 2026*


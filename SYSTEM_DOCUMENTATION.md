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

#### 4. 💬 Real-time Communication & WebRTC Audio/Video Calls
> *"May built-in communication hub ang Admin at Instructors:*
> * * Direct messaging at **All-Instructors Group Chat**.*
> * * Instant image and file attachment sharing.*
> * * **P2P WebRTC Voice & Video Calls:** Pwedeng tumawag at makipag-video conference ang Admin at Instructors nang direkta sa loob ng app."*

#### 5. ☁️ Automatic Google Drive Cloud Backup
> *"Lahat ng datos (100% ng 13 MySQL database tables) ay awtomatikong binaback-up at pino-protektahan sa **Google Drive Storage** tuwing may bagong enrollment, report submission, o student status update."*

---

## 📌 2. Pangkalahatang Impormasyon (System Overview & Technical Architecture)
Ang **CvSU Naic NSTP Record & Report Management System** ay isang makabagong, web-based platform na sadyang idinisenyo para sa **Cavite State University - Naic Campus National Service Training Program (NSTP) Office**.

Layunin nitong i-automate, gawing mabilis, ligtas, at digital ang lahat ng proseso at talaan ng NSTP:
* **Online Student Registration & Enrollment**: Pagpaparehistro ng mga bagong mag-aaral (Freshmen) sa tatlong NSTP components (**CWTS, LTS, at ROTC**) gamit ang automatic HEIC-to-JPEG conversion para sa mga kuha sa iPhone, PDF document viewer, at input validation para sa mga pangalang may letrang **ñ / Ñ**.
* **Student Roster & CHED Export**: Pag-organisa ng libo-libong mag-aaral ayon sa Batch Year, Program (`BSIT`, `BSCS`, `BSFAS`, `BSBA`, `BSEd`, `BEED`, `BSHM`), Component (`CWTS`, `LTS`, `ROTC`), at Section. May tampok na **CHED Excel Masterlist Exporter**.
* **Real-time Messaging & Video Calling**: Chat system na sumusuporta sa direct messaging, All-Instructors Group Chat, attachment image sharing, at P2P WebRTC Audio/Video calling.
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
9. **`calls`**: Signal table para sa WebRTC Peer-to-Peer Audio & Video calling.
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

## 🛡️ 6. Panseguridad at Input Validation Rules (Security & Quality Assurance)

* **Filipino Character & Diacritics Support**: Pinapayagan ang letrang **`ñ`** at **`Ñ`** sa mga pangalan at tirahan gamit ang regex: `/[^a-zA-ZñÑÀ-ÖØ-öø-ÿ\s'-]/g`.
* **Proper Word Title Casing**: Pinaiiral ang `toTitleCase` function na nagpapanatili ng unang letrang Uppercase bawat salita habang ipinagbabawal ang ALL-CAPS inputs.
* **Contact Number Validation**: Digits-only regex (`/\D/g`) para sa mga numero ng telepono.
* **DOM Password Form Compliance**: Lahat ng password fields sa `Profile.jsx` ay nakapaloob sa `<form>` element para sa accessibility at password manager standards.
* **0-404 Asset Bundle Guarantee**: Ang lahat ng mga pahina ay naka-bundle nang buo upang maiwasan ang mga 404 Chunk Load errors sa mga bagong deployments.

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


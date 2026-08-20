# 📘 CvSU Naic NSTP Record & Report Management System
## 📄 Opisyal na Dokumentasyon, Technical Architecture, at Gabay sa Oral Defense (Capstone / Thesis Defense Guide)

---

## 🎙️ 1. Mabilisang Script at Presentation Guide (Babasahin Nito sa Harap ng Panelist)

> [!TIP]
> **Gabay sa Pagsasalita:** Pwedeng-pwede mo itong basahin, isaulo, o gawing outline habang nire-presenta at dina-demo ang live system sa harap ng panelist!

```
               ┌─────────────────────────────────────────────────────────────┐
               │         PRESENTATION FLOW (5 - 8 MINUTES TOTAL)             │
               │                                                             │
               │  1. Panimula (Suliranin at Layunin)                 - 1 min │
               │  2. Paano Ginawa ang System (Tech Stack)            - 1 min │
               │  3. Live Demo (Landing ➔ Enrollment ➔ Admin ➔ CHED) - 4 min │
               │  4. Security, Backup, at Reliability                - 1 min │
               │  5. Konklusyon at Pagbubukas sa Q&A                 - 1 min │
               └─────────────────────────────────────────────────────────────┘
```

---

### 🗣️ Bahagi 1: Panimula (The Hook, Problem Statement, & Objective)
> *"Magandang araw po sa ating mga kagalang-galang na panelists at advisers. Ako po si [Iyong Pangalan], at buong puso ko pong inihahandog sa inyo ang **CvSU Naic NSTP Record & Report Management System** — isang komprehensibo, automated, at secure na web-based solution na sadyang ginawa para sa **Cavite State University - Naic Campus NSTP Office**.*
>
> *Sa nakaraang mga taon, ang NSTP Office ay nahaharap sa mga sumusunod na malalaking hamon:*
> 1. *Mano-manong pagpila at pag-fill up ng papel ng daan-daang freshmen students para sa ROTC, CWTS, at LTS enrollment.*
> 2. *Madalas na pagkaantala at human error sa pag-compile ng official student masterlists para sa **Commission on Higher Education (CHED)**.*
> 3. *Kakulangan ng sentralisadong communication at report submission hub sa pagitan ng Admin at mga NSTP Instructors.*
>
> *Binuo po natin ang system na ito upang gawing **100% digital, paperless, mabilis, at secure** ang buong workflow mula sa Student Online Enrollment hanggang sa 1-Click CHED Masterlist Generation."*

---

### 🗣️ Bahagi 2: Paano Ginawa ang System (Technical Architecture)
> *"Upang masiguro ang mataas na bilis, scalability, at modernong user experience, ginamit po natin ang **MERN / PERN-equivalent Modern Web Architecture**:*
> * * **Frontend Client (React 19 + Vite 7 + Tailwind CSS v4):** Isang dynamic na Single Page Application (SPA) na may mobile-responsive glassmorphic design, zero layout shift, at client-side image processing.*
> * * **Backend REST API (Node.js + Express.js):** Namamahala sa business logic, authentication, request rate limiting, at automated schema auto-provisioning.*
> * * **Database (MySQL 8.0 with Connection Pooling):** Naka-deploy sa cloud na may 15 normalized relational tables, automated indexes, at 45-second keepalive heartbeats para maiwasan ang server disconnection.*
> * * **Security & Data Integrity:** Pinoprotektahan ng **Google reCAPTCHA v2**, **Bcrypt Password Encryption (12 salt rounds)**, **JWT Authentication**, at **Google Drive Automated Cloud Backups**."*

---

### 🗣️ Bahagi 3: Live System Demonstration Script (Hakbang-Hakbang na Pagpapakita)

#### A. 🌐 Landing Page at Telemetry
> *"Dito po sa ating **Landing Page**, makikita ng mga bisita at estudyante ang official campus branding ng **Cavite State University - Naic**, ang educational orientation video, gabay sa pag-enroll sa 3 tracks (CWTS, LTS, ROTC), at ang real-time **Live Telemetry Bar** na nagpapakita ng eksaktong bilang ng Total Registered Users at Active Online Users na nanggagaling sa database."*

#### B. 📝 Online Enrollment Form at Unmirrored HD Camera
> *"Kapag nag-enroll ang estudyante:*
> 1. *Pipili sila ng kanilang component track at mag-i-input ng personal at academic details na may suporta sa letrang **ñ / Ñ** at standard institutional `@cvsu.edu.ph` o personal email.*
> 2. *Para sa mga kuha sa iPhone, awtomatikong kino-convert ng system ang `.HEIC` photos papuntang optimized `.JPEG`.*
> 3. *Sa pagkuha ng **Registration Form (COR)** at **Official 2x2 ID Photo**, gumamit tayo ng built-in **WebRTC Live Camera API** na may **Strictly Normal / Non-Mirrored Viewfinder**. Hindi po ito naka-mirror upang ang mga letra sa registration form at mukha sa ID ay nasa tamang natural orientation.*
> 4. *Pagkatapos kumuha o mag-upload, maaaring i-click ng estudyante ang photo thumbnail upang magbukas ang **Full Inspection Lightbox Modal** kung saan pwedeng i-zoom, i-inspect ang linaw, mag-retake, mag-upload ng ibang file, o magbura.*
> 5. *Pinoprotektahan ito ng Google reCAPTCHA bago mag-submit."*

#### C. 👑 Admin Dashboard at 1-Click CHED Masterlist Export
> *"Sa panig ng Administrator:*
> 1. *Makikita ng Admin ang lahat ng pending applications kasama ang IP Address at audit details ng bawat nag-submit para sa **Anti-Troll Accountability**.*
> 2. *Sa isang click ng **'Approve'**, awtomatikong napupunta ang estudyante sa active student masterlist at nagti-trigger ng auto-backup sa **Google Drive Storage**.*
> 3. *Sa pahina ng **Student Management**, mayroon tayong **1-Click CHED Excel Masterlist Exporter**. Sa isang pindot lang, ang daan-daang estudyante ay awtomatikong na-e-export sa isang pormal at standardized `.xlsx` spreadsheet na handa nang ipasa sa Commission on Higher Education."*

#### D. 👨‍🏫 Instructor Portal, Reports, at Real-Time Communication
> *"Para sa mga Instructors, mayroon silang sariling class roster view, submission portal para sa required activity reports, at real-time direct at group messaging hub."*

---

### 🗣️ Bahagi 4: Pagwawakas at Pagbubukas sa Q&A
> *"Sa kabuuan po, ang **CvSU Naic NSTP Record & Report Management System** ay hindi lamang isang simpleng enrollment form kundi isang **end-to-end, compliant, and production-ready academic management ecosystem** para sa ating pamantasan.*
>
> *Maraming salamat po sa inyong pakikinig, at bukas na po ang aming grupo para sa inyong mga katanungan at suhestiyon."*

---

## 🛠️ 2. "Paano Ginawa ang System?" — Malalimang Technical Architecture Breakdown

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SYSTEM ARCHITECTURE TIER                                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   [ CLIENT BROWSER / MOBILE ] ── React 19 SPA (Tailwind CSS v4 + Lucide Icons)           │
│         │                                                                                │
│         ├── HTTPS REST API Calls (JWT Bearer Token + JSON Payloads)                      │
│         ▼                                                                                │
│   [ BACKEND SERVER ] ────────── Node.js + Express.js API Gateway (Render / Localhost)    │
│         │                       ├── Helmet.js & Rate Limiter Security Layer              │
│         │                       ├── BcryptJS Password Hash Engine (12 Rounds)            │
│         │                       ├── Auto-Provisioning Schema Migration Manager           │
│         │                       └── 45-Second TCP Keepalive Connection Monitor           │
│         │                                                                                │
│         ├── Connection Pool (mysql2/promise with SSL Support)                            │
│         ▼                                                                                │
│   [ RELATIONAL DATABASE ] ───── MySQL 8.0 (15 Normalized Relational Tables)              │
│         │                                                                                │
│         └── Webhook Event Triggers (On Approval / New Submission)                        │
│         ▼                                                                                │
│   [ CLOUD STORAGE & BACKUP ] ── Google Apps Script / Google Drive Automated Sheets       │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Frontend Tier (Client Interface)
* **Framework:** **React 19** na binuo sa ibabaw ng **Vite 7** build tooling para sa instant module replacement (HMR) at compressed production bundles.
* **Styling & UI:** **Tailwind CSS v4** na may bespoke emerald/gold university palette, full responsive grid layouts para sa mobile at desktop, at zero render-blocking CSS.
* **Icons & Visuals:** **Lucide React** scalable vector icons.
* **Client-Side Image Pre-Processing:**
  * **`heic2any` Library:** Awtomatikong nagko-convert ng mga `.HEIC` at `.HEIF` images na kinunan gamit ang iPhone/iPad papuntang standard compressed `.JPEG`.
  * **HTML5 Canvas Engine:** Bago i-upload ang larawan, pinaliit at kinokompres ito ng canvas engine (maximum 1200px dimension at 0.78 quality factor) upang maging mabilis ang submission kahit mahina ang data connection ng estudyante.
  * **Non-Mirrored WebRTC Camera Capture:** Gumagamit ng `navigator.mediaDevices.getUserMedia` na may `transform: none` at natural canvas rendering para sa unmirrored documentation capture.
  * **Interactive Lightbox Modal:** Full-screen zoom and inspection overlay para masuri ng estudyante ang linaw ng COR at 2x2 photo bago i-submit.

### 2. Backend Tier (Application Server)
* **Server Framework:** **Node.js** kasama ang **Express.js**.
* **Database Connection Manager:** `mysql2/promise` pool na may connection limit na 10, queue limit na 1,000 requests, at **TCP Keepalive Ping (`SELECT 1` bawat 45 segundo)** upang maiwasan ang idle disconnects sa mga cloud hosting services (tulad ng Render at Aiven).
* **Self-Healing Schema Auto-Provisioner (`ensureAllCoreTables`):** Bawat boot ng server, awtomatiko nitong sinusuri kung kumpleto ang lahat ng 15 core tables. Kung sakaling bago ang database o may missing table, awtomatiko itong lumilikha ng schema at nagse-seed ng default super-admin account (`admin@cvsu.edu.ph`).
* **Security & Sanitization Middleware:**
  * `helmet()` para sa 15+ HTTP security response headers.
  * `express-rate-limit` para sa global anti-DDoS at brute-force defense (3,000 requests / 15 min global; 4 attempts / 15 min sa enrollment).
  * Parameterized SQL queries gamit ang prepared statements (`?` placeholders) upang 100% protektado laban sa **SQL Injection**.

### 3. Database Tier (Data Storage)
Binubuo ng **15 normalized relational tables**:
1. `users` — Administrator at Instructor accounts.
2. `students` — Masterlist ng mga aprubadong estudyante kasama ang kumpletong CHED demographic profile fields.
3. `enrollments` — Mga isinumiteng online registration forms na naghihintay ng verification.
4. `reports` — Mga inatas na requirements at deadlines ng Admin para sa mga Instructors.
5. `report_submissions` — Isinumiteng mga dokumento, accomplishment reports, at attachments.
6. `report_comments` — Real-time academic review notes sa pagitan ng Admin at Instructor.
7. `conversations` — Direct at group communication channels.
8. `conversation_participants` — Membership at unread counters sa bawat conversation.
9. `messages` — End-to-end recorded communication trail.
10. `calls` — WebRTC voice and video call signaling metadata.
11. `archived_years` — Historical snapshots ng mga nakalipas na academic school years.
12. `current_batch` — Active academic school year at semester configuration.
13. `audit_logs` — Immutable audit trail (Timestamp, User ID, Action, IP Address, Device Details).
14. `active_visitors` — Real-time telemetry monitoring para sa active online traffic.
15. `attendance_records` — QR Code and barcode time-in / time-out tracking logs.

---

## 🎯 3. Sampung (10) Mahihirap na Tanong ng Panelist at Eksaktong Isasagot (Q&A Cheat Sheet)

---

### ❓ Tanong 1: *"Bakit React at Node.js ang pinili ninyo sa halip na traditional PHP o desktop software?"*
> **💡 Sagot:**  
> *"Pinili po natin ang **React at Node.js (SPA Architecture)** dahil ang NSTP enrollment ay sabay-sabay na ginagamit ng daan-daang estudyante gamit ang iba't ibang mobile phones at laptops. Sa React SPA, hindi nagre-reload ang buong page kaya napakabilis ng navigation at matipid sa mobile data. Sa backend naman, ang Node.js ay asynchronous at non-blocking I/O kaya kaya nitong mag-handle ng libo-libong concurrent requests nang hindi nagka-crash kumpara sa traditional blocking architectures."*

---

### ❓ Tanong 2: *"Paano ninyo pinoprotektahan ang personal data ng mga estudyante ayon sa Data Privacy Act (RA 10173)?"*
> **💡 Sagot:**  
> *"Mahigpit po tayong sumusunod sa **Republic Act No. 10173 (Data Privacy Act of 2012)** sa pamamagitan ng apat na lebel ng proteksyon:*  
> 1. * **Authentication & Role-Based Access Control (RBAC):** Tanging mga awtorisadong NSTP Coordinator at Admin lamang ang may access sa student records via encrypted JWT session tokens.*  
> 2. * **Password Encryption:** Ang lahat ng passwords ay naka-hash gamit ang **Bcrypt algorithm na may 12 salt rounds** — imposible itong ma-decrypt kahit ma-access ang database.*  
> 3. * **Data Purpose Limitation:** Malinaw na nakalahad sa Terms of Agreement na ang data ay gagamitin lamang para sa NSTP course verification at CHED compliance.*  
> 4. * **Audit Trail Logging:** Lahat ng pag-access, pag-approve, at pagbura ng data ay naitatala sa `audit_logs` table kasama ang exact timestamp at IP address."*

---

### ❓ Tanong 3: *"Bakit hindi naka-mirror ang camera sa enrollment form, at ano ang bentahe nito?"*
> **💡 Sagot:**  
> *"Sinadya po nating gawing **strictly non-mirrored (`transform: none`, natural orientation)** ang live camera preview at canvas capture dahil ang mga dokumento tulad ng **Certificate of Registration (COR)** ay may mga nakaimprentang letra, student number, at subjects. Kapag naka-mirror ang camera, magiging baligtad at hindi mababasa ang dokumento. Ganundin sa 2x2 ID portrait, tinitiyak nitong ang opisyal na ID card ay nasa tamang anatomic orientation ng mukha."*

---

### ❓ Tanong 4: *"Paano ninyo sinisigurong hindi magka-crash o mag-e-error 500 ang server kapag natutulog ang cloud hosting?"*
> **💡 Sagot:**  
> *"Mayroon po tayong tatlong built-in resilience mechanisms:*  
> 1. * **Automated Schema Provisioning (`ensureAllCoreTables`):** Awtomatikong nililikha ng backend ang lahat ng 15 MySQL tables at default admin user sa tuwing mag-i-start ang server.*  
> 2. * **45-Second TCP Keepalive Heartbeat:** Nagpapadala ang server ng `SELECT 1` ping bawat 45 segundo upang mapanatiling gising ang cloud database pool at maiwasan ang idle disconnects.*  
> 3. * **Queue Limiting at Connection Pool:** Ang `mysql2` connection pool ay nagke-queue ng hanggang 1,000 requests para maiwasan ang server memory overload."*

---

### ❓ Tanong 5: *"Paano napipigilan ng system ang mga spam at troll enrollment submissions?"*
> **💡 Sagot:**  
> *"Mayroon po tayong **Multi-Layered Anti-Troll Security Defense**:*  
> * * **Google reCAPTCHA v2:** Humaharang sa mga automated bot scripts.*  
> * * **Regex Student ID Validation:** Binoblock ang mga pekeng format (tulad ng 11111111 o 12345678).*  
> * * **IP Rate Limiting:** Hanggang 4 na enrollment attempts lamang bawat 15 minuto ang pinapayagan bawat device.*  
> * * **Audit IP Logging:** Naitatala ang IP Address ng bawat nag-submit para madaling matukoy kung sino ang nagtangkang magpadala ng maling impormasyon."*

---

### ❓ Tanong 6: *"Paano ginagawa ng system ang 1-Click CHED Excel Masterlist Export?"*
> **💡 Sagot:**  
> *"Gumagamit po tayo ng **ExcelJS at SheetJS (XLSX) engine**. Kino-query ng system ang mga aprubadong estudyante mula sa `students` table, sinasala ayon sa Batch Year, Component (ROTC/CWTS/LTS), Program, at Section, at awtomatikong inilalapat ang opisyal na table headers, column widths, font styling, at institutional metadata na hinihingi ng Commission on Higher Education."*

---

### ❓ Tanong 7: *"Paano pino-proseso ng system ang mga litratong galing sa iPhone na may .HEIC format?"*
> **💡 Sagot:**  
> *"Ang mga modernong Apple devices ay nagse-save ng litrato sa format na `.HEIC` na hindi karaniwang nababasa sa web. Gumamit po tayo ng **`heic2any` library** sa frontend na awtomatikong nagko-convert ng `.HEIC` file papuntang standard `.JPEG` bago ito i-render sa canvas at i-submit sa database, kaya 100% seamless ito para sa mga iOS users."*

---

### ❓ Tanong 8: *"Ano ang mangyayari kung sakaling masira o mawalan ng internet connection ang database server?"*
> **💡 Sagot:**  
> *"Naka-integrate po ang ating system sa **Automated Google Drive Cloud Backup Webhook**. Tuwing may bagong enrollment approval o report submission, awtomatikong nagpapadala ang server ng real-time snapshot papunta sa Google Drive Sheets. Dahil dito, kahit magkaroon ng database hardware issue, laging may ligtas at updated na cloud replica ang NSTP Office."*

---

### ❓ Tanong 9: *"Bakit may real-time telemetry at paano ninyo kinakalkula ang Total Users?"*
> **💡 Sagot:**  
> *"Ang **Live Telemetry Bar** ay nagbibigay ng transparency sa operasyon ng sistema. Kinakalkula po ang **Total Users** sa pamamagitan ng pagkuha ng totoong bilang ng mga rehistradong estudyante (`COUNT(*) FROM students`) at mga faculty administrators (`COUNT(*) FROM users`). Ang **Active Online Users** naman ay real-time na binibilang gamit ang aktibong session heartbeats sa nakalipas na 25 segundo."*

---

### ❓ Tanong 10: *"Ano ang pinakamalaking bentahe ng inyong system kumpara sa paggamit lamang ng Google Forms o Excel?"*
> **💡 Sagot:**  
> *"Ang Google Forms at Excel po ay walang relational structure, walang automated validation para sa institutional emails at student IDs, walang role-based security para sa instructors, at hindi awtomatikong nagge-generate ng formatted CHED reports o nagte-track ng IP audit trail. Ang ating sistema ay isang **kompleto, integrated, at compliant na Management Information System (MIS)** na sadyang pinasadya sa eksaktong pangangailangan ng Cavite State University - Naic."*

---

## 📊 4. Opisyal na Talaan ng Database Schema (MySQL Schema Architecture)

| Table Name | Primary Key | Layunin at Nilalaman |
| :--- | :--- | :--- |
| **`users`** | `id` (INT) | Accounts ng Admin at Instructors (`email`, `password`, `role`, `department`, `avatar`, `last_active_at`). |
| **`students`** | `id` (INT) | Opisyal na aprubadong masterlist ng mga mag-aaral kasama ang buong CHED demographic data. |
| **`enrollments`** | `id` (INT) | Mga isinumiteng enrollment applications na may status (`Pending`, `Approved`, `Rejected`). |
| **`reports`** | `id` (INT) | Mga inatas na gawain at requirements para sa mga faculty instructors. |
| **`report_submissions`** | `id` (INT) | Mga isinumiteng report files, accomplishment evidence, at descriptions. |
| **`report_comments`** | `id` (INT) | Academic feedback at revision instructions sa bawat report submission. |
| **`conversations`** | `id` (INT) | Direct message at group chat channels sa pagitan ng mga kawani. |
| **`conversation_participants`** | `id` (INT) | Pagkakakilanlan ng mga kasali sa chat at unread tracking. |
| **`messages`** | `id` (INT) | Mga mensahe, file attachments, at timestamps sa komunikasyon. |
| **`calls`** | `id` (INT) | WebRTC audio/video call session metadata at signaling data. |
| **`archived_years`** | `id` (INT) | Naka-archive na historical records ng mga nakalipas na Academic Years. |
| **`current_batch`** | `id` (INT) | Kasalukuyang bukas na school year at semester setting. |
| **`audit_logs`** | `id` (INT) | Immutable security log na may timestamp, action, user ID, IP address, at details. |
| **`active_visitors`** | `visitor_id` (VARCHAR) | Real-time telemetry monitoring ng active website traffic. |
| **`attendance_records`** | `id` (INT) | Talaan ng QR code at barcode scan attendance para sa NSTP sessions. |

---

## 📚 5. Talaan ng mga Sanggunian (APA 7th Edition References)

* Commission on Higher Education. (2021). *Revised implementing rules and regulations of the National Service Training Program (NSTP)* (CHED Memorandum Order No. 01, Series of 2021). Office of the President of the Philippines, CHED.
* Cavite State University - Naic. (2024). *CvSU Naic official logo and campus imagery* [Graphics & photographs]. CvSU Naic Information & Communications Technology Office. https://cvsu.edu.ph
* Republic Act No. 9163. (2002). *An Act establishing the National Service Training Program (NSTP) for tertiary level students, amending for the purpose Republic Act No. 7077 and Presidential Decree No. 1706, and for other purposes*. Congress of the Philippines. https://www.officialgazette.gov.ph/2002/01/23/republic-act-no-9163/
* Republic Act No. 10173. (2012). *Data Privacy Act of 2012*. Congress of the Philippines. https://www.privacy.gov.ph/data-privacy-act/
* Express Core Team. (2024). *Express: Fast, unopinionated, minimalist web framework for Node.js* (Version 4.19.0) [Computer software]. OpenJS Foundation. https://expressjs.com
* Lucide Contributors. (2024). *Lucide React: Beautiful & consistent icon toolkit* (Version 0.344.0) [Computer software]. Lucide Open Source Community. https://lucide.dev
* Meta Open Source. (2024). *React: JavaScript library for building user interfaces* (Version 19.0.0) [Computer software]. Meta Platforms, Inc. https://react.dev
* Node.js Project. (2024). *Node.js cross-platform JavaScript runtime environment* (Version 20.0.0) [Computer software]. OpenJS Foundation. https://nodejs.org
* SheetJS LLC. (2024). *SheetJS Community Edition: Spreadsheet data parser and exporter* (Version 0.18.5) [Computer software]. SheetJS. https://sheetjs.com
* Tailwind Labs Inc. (2024). *Tailwind CSS: Utility-first CSS framework* (Version 4.0.0) [Computer software]. Tailwind Labs. https://tailwindcss.com
* Vite Core Team. (2024). *Vite: Next-generation frontend tooling* (Version 7.0.0) [Computer software]. Vite Project. https://vitejs.dev

---

*Inihanda para sa: Cavite State University Naic - National Service Training Program Office*  
*Huling Na-update: Agosto 2026*

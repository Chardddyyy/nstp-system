# 📘 CvSU Naic NSTP Record & Report Management System
## 📄 Kumpletong Dokumentasyon ng Sistema, Detalyadong Gabay sa Bawat Feature, at Oral Defense Manual

---

## 🏛️ 1. Pangkalahatang Panimula (System Overview)

Ang **CvSU Naic NSTP Record & Report Management System** ay isang komprehensibo, automated, at secure na web-based academic management platform na sadyang idinisenyo para sa **Cavite State University - Naic Campus National Service Training Program (NSTP) Office**.

Pangunahing layunin ng sistema na tugunan ang mga sumusunod na matagalang suliranin:
1. **Mano-manong Enrollment:** Pag-alis sa mahahabang pila at tradisyunal na papel na enrollment forms para sa tatlong NSTP tracks (**ROTC**, **CWTS**, at **LTS**).
2. **Pagkaantala sa CHED Reports:** Pag-aalis ng human errors at pagkaantala sa pag-compile ng student masterlists na kailangang ipasa sa **Commission on Higher Education (CHED)**.
3. **Kakulangan sa Sentralisadong Komunikasyon:** Pagbibigay ng iisang plataporma para sa pagpapasa ng attendance, accomplishment reports, at real-time messaging sa pagitan ng NSTP Coordinators at Instructors.
4. **Seguridad ng Datos:** Pagsunod sa **Data Privacy Act of 2012 (RA 10173)** sa pamamagitan ng role-based access control, cryptographic encryption, at automated cloud backups.

---

## 🛠️ 2. System Architecture at Tech Stack Summary

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
│         │                       ├── 45-Second TCP Keepalive Connection Monitor           │
│         │                       └── HTTPS Webhook Dispatcher (Google Apps Script API)    │
│         │                                                                                │
│         ├── Connection Pool (mysql2/promise with SSL TLS 1.3)                            │
│         ▼                                                                                │
│   [ RELATIONAL DATABASE ] ───── Aiven Cloud MySQL 8.0 (15 Normalized Relational Tables)  │
│         │                                                                                │
│         └── Webhook Event Triggers (On Approval / Cloud OTP Dispatch / Auto Backup)      │
│         ▼                                                                                │
│   [ CLOUD STORAGE & EMAIL ] ─── Google Drive & Google Apps Script Webhooks (Port 443)    │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Frontend:** React 19, Vite 7, Tailwind CSS v4, Bootstrap 5, React Router DOM v7, Lucide Icons, Canvas API, `heic2any`, `xlsx`, `qrcode`, `html5-qrcode`.
* **Backend:** Node.js, Express.js, `mysql2/promise`, `jsonwebtoken` (JWT), `bcryptjs`, `helmet`, `express-rate-limit`, `multer`, `exceljs`, `nodemailer`, `cors`, `dotenv`.
* **Database & Cloud:** Aiven Cloud MySQL 8.0 (15 Relational Tables with 45-second TCP Keepalive ping), Google Drive / Google Apps Script Cloud Sync (HTTPS Port 443).

---

## 🚀 3. Detalyadong Paliwanag sa Bawat Feature ng System (Module by Module)

---

### 🌐 Module 1: Landing Page at Public Portal (`Landing.jsx`)
Ang opisyal na pambungad na pahina para sa mga estudyante, guro, at bisita ng pamantasan.

* **1.1. Campus Branding & Institutional Header:** Ipinapakita ang opisyal na logo ng Cavite State University - Naic, institutional green-and-gold color scheme, at emergency hotline banners.
* **1.2. Interactive Track Showcase Cards:** Nagbibigay ng detalyadong orientation information sa 3 components ng NSTP:
  * **ROTC (Reserve Officers' Training Corps):** Military training, leadership, discipline, at national defense readiness.
  * **CWTS (Civic Welfare Training Service):** Community outreach, health initiatives, environmental sustainability, at literacy drives.
  * **LTS (Literacy Training Service):** Pagtuturo ng basic reading, writing, at numeracy sa mga out-of-school youth at bata sa komunidad.
* **1.3. Educational Orientation Video Embed:** Naka-embed na video player para sa opisyal na NSTP orientation briefing.
* **1.4. Live Telemetry Bar:** Real-time na statistics display na nagpapakita ng:
  * Kabuuang bilang ng mga aprubadong estudyante.
  * Bilang ng active registered users.
  * Bilang ng kasalukuyang online visitors gamit ang live heartbeat ping.
* **1.5. Interactive FAQ Accordion:** Mabilisang sagot sa mga karaniwang tanong ng freshmen tungkol sa enrollment requirements, uniform guidelines, at grading policies.
* **1.6. System Status & Contact Hub:** Diretso at madaling paraan upang makipag-ugnayan sa NSTP Office via email at campus location map.

---

### 📝 Module 2: Online Student Enrollment System (`Enrollment.jsx`)
Ang digital enrollment portal kung saan nagpaparehistro ang mga papasok na NSTP students.

* **2.1. Multi-Track Program Selection:** Malinis na pagpili sa pagitan ng CWTS, LTS, at ROTC na may real-time slot availability indicator.
* **2.2. Comprehensive Demographic & Academic Data Form:**
  * Kumpletong mga field: Student Number, Pangalan, Middle Name, Apelyido, Extension, Sex, Civil Status, Birthday, Home Address, Barangay, Munisipalidad, Lalawigan, Contact Number, at Email.
  * **Buong Suporta sa Letrang "ñ / Ñ":** Hindi nagka-crash o nagkaka-encoding error sa mga apelyidong may enye.
  * **Dual Email Support:** Tumatanggap ng official `@cvsu.edu.ph` institutional accounts at personal Gmail/Yahoo accounts.
* **2.3. iPhone `.HEIC` to `.JPEG` Auto-Converter (`heic2any`):**
  * Kapag ang estudyante ay kumuha ng litrato gamit ang pinakabagong iPhone/iPad (`.heic` format), awtomatiko itong kino-convert ng system sa standard `.jpeg` sa client-side bago pa man ito ma-upload.
* **2.4. Client-Side Image Compression (HTML5 Canvas):**
  * Ang malalaking resolution na litrato ay awtomatikong pinaliliit (max 1200px, 0.78 quality factor) upang maging mabilis ang submission kahit mahina ang data connection o signal ng estudyante.
* **2.5. Unmirrored HD Live Camera Capture (WebRTC API):**
  * Built-in camera capture para sa **Certificate of Registration (COR)** at **2x2 Formal ID Photo**.
  * **Strictly Non-Mirrored / Natural Orientation:** Hindi binaligtad (unmirrored) ang camera feed upang ang mga letra sa COR at ang mukha sa ID ay mababasa nang natural at tama.
* **2.6. Full Inspection Lightbox Modal:**
  * Pagkatapos kumuha o mag-upload ng litrato, maaaring i-click ng estudyante ang thumbnail upang magbukas ang full-screen lightbox.
  * May kakayahang mag-**Zoom In/Out**, mag-**Retake**, mag-**Upload ng Bagong File**, o mag-**Delete**.
* **2.7. Google reCAPTCHA v2 Bot Protection:**
  * Pinipigilan ang mga spam bots, script injectors, at automated submission attacks.
* **2.8. Anti-Troll Telemetry & IP Logging:**
  * Naitatala sa database ang IP address at browser signature ng bawat nag-e-enroll para sa accountability sakaling may magtangkang mag-submit ng pekeng impormasyon.
* **2.9. Terms of Agreement & Data Privacy Consent:**
  * Pormal na paghingi ng pahintulot sa estudyante alinsunod sa Data Privacy Act (RA 10173) bago tanggapin ang submission.

---

### 👑 Module 3: Administrator Analytics Dashboard (`AdminDashboard.jsx`)
Ang command center para sa NSTP Coordinator at System Administrators.

* **3.1. Executive KPI Metrics Cards:**
  * Total Enrolled Students (real-time count).
  * Pending Verification / Applications Count.
  * Total Active NSTP Instructors.
  * Current Academic Year and Semester Badge.
* **3.2. Program Track Distribution Charts:** Visual breakdown ng bilang ng estudyante sa ROTC, CWTS, at LTS.
* **3.3. Academic Year & Semester Switcher (`current_batch`):**
  * Madaling pagpalit ng active academic cycle (e.g., *2025-2026 First Semester* papuntang *Second Semester*) nang hindi nabubura ang mga nakaraang talaan.
* **3.4. Real-time Live Activity Feed:** Agarang pagpapakita ng mga bagong nag-enroll, nag-submit ng report, o nag-login na users.
* **3.5. System Health & Heartbeat Monitor:** Nagpapakita ng status ng database connection, cloud storage sync, at API server latency.

---

### 👥 Module 4: Student Management & CHED Masterlist Hub (`StudentManagement.jsx`)
Ang sentrong imbakan at tagapamahala ng lahat ng student records sa pamantasan.

* **4.1. Comprehensive Data Table:**
  * Mabilisang pag-filter ayon sa Track (CWTS/LTS/ROTC), Course/Degree Program, Section, Gender, at Enrollment Status (Pending, Approved, Rejected).
  * Instant real-time multi-field search bar (Pangalan, Student Number, Email).
* **4.2. Student Detailed Profile & Verification Lightbox:**
  * Pag-click sa estudyante ay nagbubukas ng kumpletong demographic profile kasama ang HD zoomable view ng kanilang COR at 2x2 ID photo para sa mabilis na validation.
* **4.3. One-Click Approval / Rejection Workflow:**
  * **Approve:** Sa isang pindot lang, awtomatikong magiging opisyal na enrolled student ang aplikante, bibigyan ng system status, at magti-trigger ng auto-sync sa Google Drive.
  * **Reject with Reason:** Maaaring tanggihan ang application na may kasamang malinaw na paliwanag (e.g., *Malabo ang COR* o *Maling Track ang napili*).
* **4.4. 1-Click CHED Standardized Masterlist Excel Exporter (`xlsx` / `exceljs`):**
  * Ang pinakamahalagang feature para sa compliance ng pamantasan.
  * **Deduplicated Query Engine:** Tinitiyak na ang eksaktong bilang lamang ng aktibong estudyante sa track ang kasama nang walang redundant duplicate rows na dulot ng multi-table cross joins.
  * Awtomatikong bubuo ang system ng opisyal na `.xlsx` spreadsheet na may pormal na header, columns (Student No., Complete Name, Course, Sex, Track, Contact), at standard CHED formatting na handa nang ipasa sa Commission on Higher Education.
* **4.5. Batch Bulk Actions:** Kakayahang mag-approve, magbura, o mag-assign ng section sa maraming estudyante nang sabay-sabay.

---

### 🪪 Module 5: Digital NSTP ID Card & Batch Printing System (`NstpIdCard.jsx` & `BatchIdPrintModal.jsx`)
Modernong identification system para sa lahat ng opisyal na NSTP students.

* **5.1. Official NSTP Digital ID Generator:**
  * Bawat aprubadong estudyante ay awtomatikong binibigyan ng high-resolution digital ID card na may:
    * Opisyal na CvSU Logo at Campus Seal.
    * 2x2 Photo ng Estudyante.
    * Kumpletong Pangalan, Student Number, Track (CWTS/ROTC/LTS), at Course.
    * **Dynamic Typography Auto-Scaling:** Awtomatikong nag-a-adjust ang laki ng font para sa mahahabang pangalan at degree programs upang maiwasan ang text overflow.
    * **Dynamic Attendance QR Code** na naglalaman ng secure encrypted student token.
* **5.2. Batch ID Card Print Layout (`BatchIdPrintModal.jsx`):**
  * Nagbibigay ng print-ready layout (e.g., 4 to 8 ID cards bawat A4/Letter page) para sa maramihang pag-print ng ID cards nang walang misalignment.

---

### 📲 Module 6: QR Code Attendance Scanner at Consolidated Matrix (`AttendanceScannerModal.jsx` & `StudentAttendanceMatrixModal.jsx`)
Paperless at mabilisang pagtatala ng attendance tuwing may Sunday NSTP training o community activities.

* **6.1. Live Camera QR Code Scanner (`html5-qrcode`):**
  * Ginagamit ng Instructor o Admin ang camera ng kanilang smartphone o laptop upang i-scan ang QR code sa ID ng estudyante.
  * **Instant Verification:** Awtomatikong nagpapakita ng berdeng checkmark, pangalan ng estudyante, at timestamp kapag validated ang scan.
  * **Flexible Status Tracking:** Sumusuporta sa `Timed In`, `Timed Out`, `Present`, `Late`, at `Excused`.
* **6.2. MySQL Batch Saving API (`POST /api/attendance/batch-save`):**
  * Sa pagpindot ng *"Save Record"*, awtomatikong ipinapadala at ini-save ang buong session data (Time In at Time Out) sa MySQL database upang hindi mawala ang logs kahit mag-refresh ang browser.
* **6.3. Consolidated 1-Line per Student Excel Export:**
  * Pinagsasama (groups) ang multiple scans ng parehong estudyante sa iisang linya lamang sa Excel na may magkahiwalay na kolum para sa **Time In** at **Time Out**.
* **6.4. Student Attendance Matrix Modal (`StudentAttendanceMatrixModal.jsx`):**
  * Isang komprehensibong spreadsheet-style matrix na nagpapakita ng complete attendance history ng buong klase sa bawat training date o session.
  * Awtomatikong nagkakalkula ng **Total Presents**, **Absents**, at **Attendance Percentage**.

---

### 👨‍🏫 Module 7: Instructor Portal (`InstructorDashboard.jsx`)
Ang nakalaang portal para sa mga faculty members at field instructors ng NSTP.

* **7.1. Assigned Section Roster:**
  * Makikita lamang ng bawat Instructor ang mga estudyanteng nakatalaga sa kanilang partikular na section at track.
* **7.2. Quick Attendance Logger:**
  * Kakayahang mag-scan ng QR codes o mag-mark ng manual attendance kung sakaling naiwan ng estudyante ang kanilang ID.
* **7.3. Student Performance & Requirements Tracker:**
  * Mabilisang pagsusuri kung sino sa mga estudyante ang nakatapos na sa community outreach hours o military drills.

---

### 📑 Module 8: Academic Reports & Compliance Workflow (`Reports.jsx`)
Sentralisadong submission at approval hub para sa mga accomplishment reports, lesson plans, at documentation.

* **8.1. Admin Requirement Task Distribution:**
  * Maaaring magtalaga ang Admin ng partikular na report requirement na may pamagat, instructions, at due date (deadline) para sa lahat ng Instructors.
* **8.2. Instructor File Submission:**
  * Nag-a-upload ang mga guro ng kanilang PDF, Word, o Excel accomplishment reports kasama ang photo documentation ng community activities.
* **8.3. Three-State Review Workflow:**
  * **Pending Review:** Bagong submission na naghihintay ng pagsusuri ng Coordinator.
  * **Approved:** Tanggap na ang report at awtomatikong naitatala sa compliance ledger.
  * **Needs Revision:** Ibinalik sa guro na may kasamang malinaw na feedback kung anong bahagi ang kailangang ayusin.
* **8.4. Threaded Feedback & Commenting System:**
  * Real-time notes at palitan ng komento sa pagitan ng Admin at Instructor sa loob mismo ng bawat report item.

---

### 💬 Module 9: Real-time Communication & Live Presence Hub (`Chat.jsx`)
Built-in communication platform para sa opisyal at ligtas na koordinasyon sa pagitan ng NSTP Office at mga Instructors.

* **9.1. Direct 1-on-1 Messaging:** Ligtas at pribadong real-time chat sa pagitan ng Admin/Coordinator at mga Indibidwal na NSTP Instructors.
* **9.2. Official Group Channels:** Nakalaang broadcast at discussion channels para sa bawat component track (ROTC Faculty Group, CWTS Faculty Group, LTS Faculty Group).
* **9.3. Dynamic Real-Time Presence Engine:**
  * Awtomatikong nagtatala ng `last_active_at` timestamp sa bawat user request.
  * Nagpapakita ng eksaktong presence status:
    * **`Online now`** (kung aktibo sa loob ng 4 na minuto)
    * **`Active X mins ago`** (kung aktibo sa nakaraang oras)
    * **`Active today at HH:MM AM/PM`** (kung kanina nag-online)
    * **`Active yesterday at HH:MM AM/PM`** (kung kahapon)
    * **`Active on MMM DD at HH:MM AM/PM`** (kung mas matagal nang offline).
* **9.4. Multimedia & Document File Sharing:** Suporta sa pagpapadala ng images, PDF guidelines, memo circulars, at activity spreadsheets sa loob ng chat.
* **9.5. Searchable Conversation History:** Mabilisang paghahanap sa mga nakaraang instructions, announcements, at diskusyon.

---

### 📅 Module 10: Academic Calendar & Event Scheduler (`Calendar.jsx`)
Ang opisyal na kalendaryo ng mga gawain at aktibidad ng NSTP.

* **10.1. Monthly and Weekly Schedule Grid:**
  * Naka-color code ang mga training sessions, community tree planting activities, coastal clean-ups, blood donation drives, at examination dates.
* **10.2. Event Creation & Deadline Reminders:**
  * Maaaring magtakda ang Admin ng mahahalagang deadlines na awtomatikong lumalabas sa dashboard ng lahat ng Instructors.

---

### ✉️ Module 11: Standardized Letter & Document Formats Generator (`LetterFormats.jsx`)
Awtomatikong generator ng mga opisyal at pormal na university letters.

* **11.1. Pre-formatted Template Library:**
  * Excuse Letters para sa mga estudyanteng lumahok sa official community outreach.
  * Endorsement Letters para sa mga partner barangays at non-government organizations.
  * Memorandum of Agreement (MOA) templates para sa community service partnerships.
* **11.2. Dynamic Data Injection:**
  * Awtomatikong ipinapasok ng system ang pangalan ng estudyante, track, petsa, at pirma ng NSTP Coordinator upang handa na itong i-print at pirmahan.

---

### 🔑 Module 12: Authentication, Cloud HTTPS Webhook & Password Reset System
Ang pinakabagong cloud-native security at account recovery infrastructure.

* **12.1. Strict Staff-Only Account Recovery:**
  * Ang Forgot Password workflow ay eksklusibo sa mga rehistradong **Instructors at Admins** (`users` table). Hindi pinapayagan ang mga hindi awtorisadong email address.
* **12.2. Google Apps Script Webhook (Port 443 HTTPS Dispatch):**
  * Upang malampasan ang outbound SMTP port blocking ng cloud hosts (Render), ang email dispatch ay dumadaan sa isang Google Apps Script Webhook sa Port 443.
  * Direktang ipinapadala ng Google ang email mula sa opisyal na sender (`richardbelen99@gmail.com`) papunta sa inbox ng nagre-request na guro o admin sa loob lamang ng 1 segundo.
* **12.3. Dynamic Subject Line Engine:**
  * Bawat email ay may kasamang dynamic timestamp at OTP code sa Subject Line (e.g. *`NSTP System - Password Reset OTP: 849201 (01:06 AM)`*) upang maiwasan ang pag-ipon o pag-collapse ng Gmail sa iisang conversation thread.
* **12.4. 1-Click Auto-Fill Integration:**
  * Ang email ay may kasamang modernong *"Auto-Fill Code & Reset Password"* action button. Pag-click nito, awtomatikong magbubukas ang NSTP login portal na may pre-populated email at OTP sa Step 2.
* **12.5. Non-Bypassable Security Policy:**
  * Walang anumang master bypass o backdoor pins; 100% kailangang ma-verify ang tunay na 6-digit OTP na ipinadala sa Gmail inbox.

---

## 🗄️ 4. Relational Database Schema Architecture

Ang sistema ay gumagamit ng **MySQL 8.0** na may normalized relational tables para sa buong academic at communication workflow:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CORE DATABASE TABLES                                      │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│  1. users                    - Accounts ng Admin, Coordinators, at Instructors            │
│  2. students                 - Masterlist ng mga aprubadong estudyante at CHED profile    │
│  3. enrollments              - Pending registration forms na naghihintay ng verification  │
│  4. reports                  - Mga takdang requirements at deadlines mula sa Admin        │
│  5. report_submissions       - Mga isinumiteng accomplishment reports at attachments      │
│  6. report_comments          - Feedback at threaded review notes sa bawat submission      │
│  7. conversations            - Direct at group communication channels                     │
│  8. conversation_participants- Membership list at unread status sa bawat chat             │
│  9. messages                 - Naka-record na mga mensahe, text, at attachments           │
│ 10. archived_years           - Historical archival records ng mga lumipas na academic years│
│ 11. current_batch            - Kasalukuyang active school year at semester configuration  │
│ 12. audit_logs               - Forensic audit trail (Timestamp, User, Action, IP Address) │
│ 13. active_visitors          - Real-time traffic at online telemetry tracking             │
│ 14. attendance_records       - QR code scan logs (studentId, event, session, status, time)│
│ 15. password_resets          - Dynamic 6-digit OTP tokens na may 10-minute expiration     │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 5. Seguridad at Data Privacy (Republic Act No. 10173)

Ang buong sistema ay mahigpit na sumusunod sa **Data Privacy Act of 2012** sa pamamagitan ng apat (4) na layer ng proteksyon:

1. **Role-Based Access Control (RBAC) & JWT:** Tanging mga authenticated coordinators at instructors lamang ang may karapatang magbukas ng student personal information gamit ang digitally signed JSON Web Tokens.
2. **Cryptographic Password Hashing (BcryptJS):** Lahat ng user passwords ay naka-hash gamit ang **12 Salt Rounds**. Imposible itong ma-decrypt o mabasa kahit direktang buksan ang database.
3. **Prepared Statements & SQL Injection Defense:** 100% ng backend database queries ay gumagamit ng parameterized queries (`?` placeholders) sa pamamagitan ng `mysql2/promise` upang pigilan ang anumang SQL Injection attacks.
4. **HTTP Header Hardening & Rate Limiting (`helmet` & `express-rate-limit`):** Pinoprotektahan ang API laban sa cross-site scripting (XSS), clickjacking, sniffing, at automated DDoS brute-force attacks.

---

## 🎙️ 6. Gabay sa Oral Defense (Top 12 Questions and Answers para sa Panelists)

### ❓ Tanong 1: *"Ano ang pinaka-unique feature ng inyong system kumpara sa tradisyunal na Google Forms?"*
> **💡 Sagot:**  
> *"Ang Google Forms po ay simpleng data collector lamang na walang relational integrity, walang unmirrored camera capture, walang auto-conversion para sa iPhone HEIC photos, walang built-in QR Code attendance scanning, walang live staff chat with presence tracking, at hindi nakakapag-generate ng standardized 1-Click CHED Masterlists. Ang aming system ay isang **end-to-end relational academic management ecosystem** na kumpleto mula sa enrollment, ID printing, attendance tracking, hanggang sa official CHED report compliance."*

### ❓ Tanong 2: *"Bakit React 19 at Node.js ang napili ninyong Tech Stack sa halip na traditional PHP?"*
> **💡 Sagot:**  
> *"Pinili po natin ang **React SPA at Node.js** dahil sa bilis at scalability. Sa React, hindi nagre-reload ang buong page kaya napakabilis ng karanasan ng mga estudyante kahit gamit ang mobile data. Sa backend naman, ang Node.js ay asynchronous at non-blocking I/O kaya kaya nitong magproseso ng sabay-sabay na registration requests ng daan-daang freshmen nang hindi bumabagal ang server."*

### ❓ Tanong 3: *"Paano ninyo pinipigilan ang pagpasok ng mga troll o pekeng enrollment submissions?"*
> **💡 Sagot:**  
> *"Gumagamit po tayo ng **tatlong antas ng proteksyon**: (1) **Google reCAPTCHA v2** upang harangan ang automated bots; (2) **Rate Limiting Middleware** na naglilimita ng submissions kada IP address; at (3) **IP at Telemetry Audit Logging** kung saan nakatala ang IP address at browser identity ng bawat nag-e-enroll para sa agarang pagtukoy at accountability."*

### ❓ Tanong 4: *"Bakit unmirrored ang ginawa ninyong camera capture para sa ID at COR?"*
> **💡 Sagot:**  
> *"Karamihan po ng standard web cameras ay naka-mirror (baligtad) by default para sa selfie. Ngunit para sa dokumentasyon tulad ng Certificate of Registration (COR) at opisyal na 2x2 ID, kailangang mababasa nang tama at hindi baligtad ang mga letra at mukha. Kaya gumamit tayo ng custom WebRTC unmirrored canvas rendering upang maging natural at legal document-compliant ang kuha."*

### ❓ Tanong 5: *"Paano masisiguro na hindi mawawala ang data sakaling mag-crash ang database server?"*
> **💡 Sagot:**  
> *"Mayroon po tayong **Automated Cloud Backup Mechanism via Google Apps Script Webhooks**. Sa bawat pag-approve ng estudyante at sa pamamagitan ng scheduled backups, awtomatikong naitatala ang data sa off-site Google Drive Storage. Bukod dito, mayroon tayong 45-second TCP Keepalive ping upang manatiling aktibo at matatag ang database connection."*

### ❓ Tanong 6: *"Paano ninyo pinangangalagaan ang privacy ng mga estudyante ayon sa RA 10173?"*
> **💡 Sagot:**  
> *"Naka-implement po ang **Data Privacy Act compliance** sa pamamagitan ng: (1) **Bcrypt 12-round password encryption**, (2) **Role-Based Access Control** gamit ang JWT session tokens, (3) **Data Purpose Consent Agreement** bago mag-enroll, at (4) **Forensic Audit Logs** na nagtatala kung sino ang tumitingin, nag-e-edit, o nag-a-approve ng records."*

### ❓ Tanong 7: *"Paano gumagana ang inyong 1-Click CHED Masterlist generation?"*
> **💡 Sagot:**  
> *"Gumagamit po tayo ng backend spreadsheet engine (`exceljs` / `xlsx`). Kapag pinindot ng Admin ang 'Export CHED Masterlist', kinukuha ng server ang lahat ng aprubadong estudyante sa MySQL database nang direkta at walang duplicates, inaayos ang format ayon sa opisyal na template ng CHED (kasama ang institutional header, tracking code, at demographic columns), at ibinubuga ito bilang isang ready-to-print `.xlsx` file."*

### ❓ Tanong 8: *"Paano pinapagana ang QR Code Attendance System at paano ito naitatala sa database?"*
> **💡 Sagot:**  
> *"Bawat aprubadong estudyante ay binibigyan ng unique digital ID na may encrypted QR code. Gamit ang smartphone o laptop camera ng Instructor at ang `html5-qrcode` library, ini-scan ang QR code para sa Time In at Time Out. Sa pag-save, nagpapadala ng batch request sa `POST /api/attendance/batch-save` upang mai-persist ang complete session sa MySQL, at kapag ini-export sa Excel, naka-consolidate ito sa iisang linya kada estudyante."*

### ❓ Tanong 9: *"Paano ninyo nalutas ang cloud SMTP email blocking sa libreng hosting tulad ng Render?"*
> **💡 Sagot:**  
> *"Dahil bina-block po ng cloud firewalls tulad ng Render ang papalabas na SMTP ports (25, 465, 587) upang maiwasan ang spam, gumawa tayo ng **Cloud HTTPS Webhook Bridge gamit ang Google Apps Script**. Ang backend ay nagpapadala ng secure HTTPS POST request sa Port 443 na pinapayagan ng lahat ng cloud hosts, at direktang si Google ang nagpapadala ng verification email mula sa opisyal na university sender address."*

### ❓ Tanong 10: *"Paano gumagana ang Live Presence at Last Seen sa Chat Hub?"*
> **💡 Sagot:**  
> *"Bawat authenticated user request o interaction ay awtomatikong nag-a-update ng `last_active_at` timestamp sa `users` table. Sa frontend, dynamic itong kino-compute ng `getUserStatus` at `getLastSeen` upang magpakita ng 'Online now' (kung active sa loob ng 4 na minuto), 'Active X mins ago', 'Active today at [Time]', o 'Active yesterday' sa halip na static o pekeng text."*

### ❓ Tanong 11: *"Ano ang mangyayari sa mga records kapag natapos na ang kasalukuyang Semester o Academic Year?"*
> **💡 Sagot:**  
> *"Mayroon po tayong **Batch Management at Archival System** (`current_batch` at `archived_years` tables). Maaaring lumipat ang Admin sa susunod na Academic Year o Semester. Ang mga nakaraang records ay ligtas na naka-archive at nananatiling searchable para sa historical reference nang hindi humahalo sa mga bagong freshmen enrollees."*

### ❓ Tanong 12: *"Ano ang inyong plano para sa Future Enhancements o susunod na bersyon ng sistema?"*
> **💡 Sagot:**  
> *"Para po sa susunod na enhancement, pinaplano nating magdagdag ng: (1) **Automated SMS Notifications** para sa emergency training cancellations, (2) **GPS Geofenced Attendance Scanning** para sa off-campus community immersion, at (3) **Direct SIS Integration** sa pangunahing University Portal ng Cavite State University."*

---

## 🌟 7. Mga Rekomendasyon at Future Work (Recommendations & Future Enhancements)

Upang lalong mapalawak at mapatatag ang pagpapatupad ng **CvSU Naic NSTP Record & Report Management System**, inirerekomenda ng mga mananaliksik ang mga sumusunod para sa pamantasan, sa NSTP Office, at sa mga susunod na mananaliksik:

### 🏛️ A. Rekomendasyon para sa Pamantasan at NSTP Department (Institutional Recommendations)
1. **Opisyal na Pag-adopt ng Sistema (Institutional Policy Adoption):**
   * Inirerekomenda na pormal na ipatupad ang sistema bilang opisyal at pangunahing digital registration at report platform ng Cavite State University - Naic Campus upang tuluyang maalis ang paggamit ng papel at mano-manong pagpila.
2. **Pagsasanay at Orientation para sa Faculty at Staff (Faculty Capacity Building):**
   * Magdaos ng maikling oryentasyon at training workshop bawat simula ng Academic Year para sa mga bagong NSTP Instructors ukol sa tamang paggamit ng QR Code Attendance Scanner, pag-upload ng accomplishment reports, at pakikipag-ugnayan sa Chat Hub.
3. **Pagtatalaga ng Dedicated Institutional Cloud / On-Premise Hosting:**
   * Upang masiguro ang 99.9% uptime at mabilis na response time sa panahon ng bugso ng enrollment, inirerekomenda ang paggamit ng dedicated university hosting infrastructure o premium cloud servers (tulad ng AWS, Google Cloud, o DigitalOcean) na may automated daily snapshots.
4. **Pagsunod sa National Privacy Commission (NPC) Compliance:**
   * Magtalaga ng Data Protection Officer (DPO) na magsasagawa ng taunang privacy impact assessment upang matiyak na laging napapanahon ang pagsunod sa Republic Act 10173.

---

### 💻 B. Teknikal na Rekomendasyon para sa mga Susunod na Developers (Technical Enhancements)
1. **Pagsasama ng SMS Gateway (Twilio / PhilSMS / Semaphore API):**
   * Maglagay ng automated broadcast system na magpapadala ng libreng text messages sa mga estudyante tuwing may emergency cancellation ng training, class announcements, o paalala bago ang submission deadline.
2. **GPS Geofencing para sa Community Immersion Attendance:**
   * Magdagdag ng geolocation validation sa QR Code Attendance Scanner upang masiguro na ang estudyante at guro ay pisikal na nasa loob ng nakatalagang Partner Barangay o Campus Field bago ma-validate ang time-in.
3. **AI-Powered OCR (Optical Character Recognition) Document Verification:**
   * Paggamit ng Tesseract.js o Google Cloud Vision API upang awtomatikong basahin at ikumpara ang nakasulat na Student Number, Pangalan, at Course sa Certificate of Registration (COR) laban sa ini-input ng mag-aaral.
4. **Progressive Web App (PWA) na may Offline Attendance Caching:**
   * Gawing ganap na PWA ang application upang makapag-scan ng attendance ang mga guro kahit walang internet connection habang nasa malalayong coastal o rural outreach sites, at awtomatikong mag-si-sync sa MySQL database pagbalik ng internet signal.
5. **Direct Integration sa CvSU Main Student Information System (SIS API):**
   * Pagbuo ng secure API bridge sa opisyal na CvSU Portal para sa Single Sign-On (SSO) at awtomatikong pag-validate ng opisyal na enrollment status ng estudyante nang hindi na kailangang mag-upload ng manual COR.
6. **Automated Serialized National NSTP Serial Number Generation:**
   * Awtomatikong pag-assign ng DND-CHED recognized National NSTP Serial Number sa mga magsisipagtapos na estudyante para sa National Service Reserve Corps (NSRC) at Armed Forces of the Philippines Citizen Armed Force (AFP-CAF).

---

## 📚 8. Talaan ng mga Sanggunian (References)

* **Commission on Higher Education (CHED).** (2021). *Revised Implementing Rules and Regulations of the National Service Training Program (NSTP)* (CHED Memorandum Order No. 01, Series of 2021).
* **Republic Act No. 9163.** (2002). *An Act Establishing the National Service Training Program (NSTP) for Tertiary Level Students*. Congress of the Philippines.
* **Republic Act No. 10173.** (2012). *Data Privacy Act of 2012*. National Privacy Commission of the Philippines.
* **Cavite State University - Naic.** (2024). *CvSU Naic Campus Institutional Standards and Manual of Operations*.



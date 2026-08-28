# 📘 CvSU Naic NSTP Record & Report Management System
## 📄 Kumpletong Dokumentasyon ng Sistema, Detalyadong Gabay sa Bawat Feature, at Oral Defense Manual

---

## 🏛️ 1. Pangkalahatang Panimula (System Overview)

Ang **CvSU Naic NSTP Record & Report Management System** ay isang komprehensibo, automated, at secure na web-based academic management platform na sadyang idinisenyo para sa **Cavite State University - Naic Campus National Service Training Program (NSTP) Office**.

Pangunahing layunin ng sistema na tugunan ang mga sumusunod na matagalang suliranin:
1. **Mano-manong Enrollment:** Pag-alis sa mahahabang pila at tradisyunal na papel na enrollment forms para sa tatlong NSTP tracks (**ROTC**, **CWTS**, at **LTS**).
2. **Pagkaantala sa CHED Reports:** Pag-aalis ng human errors at pagkaantala sa pag-compile ng student masterlists at enrollment/completion summaries na kailangang ipasa sa **Commission on Higher Education (CHED)** gamit ang standard **OSDS-NSTP Form A at Form B**.
3. **Kakulangan sa Sentralisadong Komunikasyon:** Pagbibigay ng iisang plataporma para sa pagpapasa ng attendance, accomplishment reports, real-time messaging, at voice calls sa pagitan ng NSTP Coordinator at Instructors.
4. **Seguridad ng Datos:** Pagsunod sa **Data Privacy Act of 2012 (RA 10173)** sa pamamagitan ng role-based access control, cryptographic encryption, client-side data sanitization, at automated cloud backups.

---

## 🛠️ 2. System Architecture at Tech Stack Summary

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SYSTEM ARCHITECTURE TIER                                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   [ CLIENT BROWSER / MOBILE ] ── React 19 SPA (Tailwind CSS v4 + Lucide Icons)           │
│         │                       ├── Client-Side Image Optimizer (Canvas Compression)     │
│         │                       ├── COR Document Validation & Heuristic Auditor          │
│         │                       └── Pure Unique Visitor Telemetry Monotonic Cache        │
│         │                                                                                │
│         ├── HTTPS REST API Calls (JWT Bearer Token + JSON Payloads)                      │
│         ▼                                                                                │
│   [ BACKEND SERVER ] ────────── Node.js + Express.js API Gateway (Render / Localhost)    │
│         │                       ├── Helmet.js & Rate Limiter Security Layer              │
│         │                       ├── BcryptJS Password Hash Engine (12 Rounds)            │
│         │                       ├── Auto-Provisioning Schema Migration Manager           │
│         │                       ├── 45-Second TCP Keepalive Connection Monitor           │
│         │                       ├── Socket.IO Bi-Directional WebSocket Server            │
│         │                       └── HTTPS Webhook Dispatcher (Google Apps Script API)    │
│         │                                                                                │
│         ├── Connection Pool (mysql2/promise with SSL TLS 1.3)                            │
│         ▼                                                                                │
│   [ RELATIONAL DATABASE ] ───── Aiven Cloud MySQL 8.0 (18 Normalized Relational Tables)  │
│         │                                                                                │
│         └── Webhook Event Triggers (On Approval / Cloud OTP Dispatch / Auto Backup)      │
│         ▼                                                                                │
│   [ CLOUD STORAGE & EMAIL ] ─── Google Drive & Google Apps Script Webhooks (Port 443)    │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Frontend:** React 19, Vite 7, Tailwind CSS v4, Bootstrap 5, React Router DOM v7, Lucide Icons, Canvas API, `imageOptimizer.js`, `documentValidation.js`, `heic2any`, `xlsx`, `jspdf`, `html2canvas`, `qrcode`, `html5-qrcode`.
* **Backend:** Node.js, Express.js, `mysql2/promise`, `socket.io`, `jsonwebtoken` (JWT), `bcryptjs`, `helmet`, `express-rate-limit`, `multer`, `exceljs`, `cors`, `dotenv`, `node-cron`.
* **Database & Cloud:** Aiven Cloud MySQL 8.0 (18 Normalized Relational Tables with 45-second TCP Keepalive ping), Google Drive / Google Apps Script Cloud Sync (HTTPS Port 443), GitHub Pages CDN.

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
* **1.4. Pure Non-Degrading Visitor Telemetry Bar:** Real-time na statistics display na nagpapakita ng:
  * **Total Visitors:** Kabuuang bilang ng lahat ng tunay at natatanging bisita (unique visitors) mula noong inilunsad ang sistema gamit ang persistent MySQL `active_visitors` registry na hindi kailanman binubura o bumababa. **Mahigpit na hindi isinasama ang mga student records o dummy entries sa bilang**.
  * **Active Online Visitors:** Bilang ng kasalukuyang active users/browsers sa loob ng 30-second live heartbeat window na may pulsing green indicator.
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
* **2.4. Low-Bandwidth Client-Side Image Compression (`imageOptimizer.js`):**
  * Ang malalaking resolution na 2x2 ID photos at COR uploads (5MB–15MB) ay awtomatikong pinaliliit (max 480px–900px, 0.70–0.80 quality factor) gamit ang HTML5 Canvas bago ipadala sa network. Dahil dito, ang file size ay nagiging ~30KB–50KB lamang, na nagbibigay-daan sa **10x mas mabilis na loading** kahit sa mahinang 2G/3G mobile data.
* **2.5. Intelligent COR Document Auditor (`documentValidation.js`):**
  * Sinusuri sa client-side kung ang in-upload na Certificate of Registration ay tunay na papel na dokumento o selfie/portrait photo. Nagbibigay ito ng agarang babala sa estudyante kapag kahina-hinala ang in-upload na dokumento bago pa man mai-submit.
* **2.6. Unmirrored HD Live Camera Capture (WebRTC API):**
  * Built-in camera capture para sa **Certificate of Registration (COR)** at **2x2 Formal ID Photo**.
  * **Strictly Non-Mirrored / Natural Orientation:** Hindi binaligtad (unmirrored) ang camera feed upang ang mga letra sa COR at ang mukha sa ID ay mababasa nang natural at tama.
* **2.7. Full Inspection Lightbox Modal:**
  * Pagkatapos kumuha o mag-upload ng litrato, maaaring i-click ng estudyante ang thumbnail upang magbukas ang full-screen lightbox na may Zoom In/Out, Retake, at Delete.
* **2.8. Google reCAPTCHA v2 Bot Protection:** Pinipigilan ang mga spam bots, script injectors, at automated submission attacks.
* **2.9. Terms of Agreement & Data Privacy Consent:** Pormal na paghingi ng pahintulot sa estudyante alinsunod sa Data Privacy Act (RA 10173).

---

### 👑 Module 3: Administrator Analytics Dashboard (`AdminDashboard.jsx`)
Ang command center para sa NSTP Coordinator at System Administrators.

* **3.1. Executive KPI Metrics Cards:** Real-time summary ng Total Enrolled Students, Pending Enrollments, Active Instructors, at Current Academic Batch.
* **3.2. Continuous Automatic Academic Year & Semester Progression (`computeNextBatch` / `getConsecutiveBatchDetails`):**
  * Awtomatikong kinakalkula ng sistema ang natural na pagkakasunod-sunod ng Academic Year at Semestre (halimbawa: `2026-2027 1st Semester` ➔ `2026-2027 2nd Semester` ➔ `2027-2028 1st Semester` ➔ `2027-2028 2nd Semester`).
  * **Accidental Click Prevention Safeguard:** Mahigpit na kinakailangan na i-type ng admin ang salitang `"confirm"` sa confirmation dialog bago ipatupad ang bagong batch.
* **3.3. Program Track Distribution Charts:** Visual breakdown ng bilang ng estudyante sa ROTC, CWTS, at LTS.
* **3.4. Pending Enrollment Verification with RegForm Audit Alerts:**
  * Mabilisang pagsusuri ng mga nag-enroll kung saan may visual alert badge kung ang in-upload na COR ay minarkahan ng document auditor na kahina-hinala o selfie.
* **3.5. Real-time Live Activity Feed & Health Monitor:** Agarang pagpapakita ng system status, database latency, at cloud sync logs.

---

### 👥 Module 4: Student Management & CHED Masterlist Hub (`StudentManagement.jsx`)
Ang sentrong imbakan at tagapamahala ng lahat ng student records sa pamantasan.

* **4.1. Comprehensive Data Table & Filter Engine:** Mabilisang pag-filter ayon sa Track (CWTS/LTS/ROTC), Course/Degree Program, Section, Gender, at Status (Pending, Approved, Rejected) na may instant multi-field search bar.
* **4.2. Student Detailed Profile & Verification Lightbox:** Pagbukas ng kumpletong demographic profile kasama ang HD zoomable view ng kanilang COR at 2x2 ID photo na may `loading="lazy"` at `decoding="async"`.
* **4.3. One-Click Approval / Rejection Workflow:**
  * **Approve:** Sa isang pindot lang, nagiging opisyal na enrolled student ang aplikante at nagti-trigger ng auto-sync sa Google Drive.
  * **Reject with Reason:** Maaaring tanggihan ang application na may kasamang malinaw na paliwanag.
* **4.4. 1-Click CHED Standardized Masterlist Excel Exporter (`chedExportGenerator.js`):**
  * **CHED OSDS-NSTP Form A:** Summary of Enrollment and Graduates of NSTP ayon sa programa at kasarian.
  * **CHED OSDS-NSTP Form B:** Detailed Masterlist of Enrollees and Graduates with Serial Numbers, Student Numbers, at Complete Demographic Profiles.
* **4.5. Batch Bulk Actions:** Kakayahang mag-approve, magbura, o mag-assign ng section sa maraming estudyante nang sabay-sabay.

---

### 🪪 Module 5: Digital NSTP ID Card & Batch Printing System (`NstpIdCard.jsx`, `BatchIdPrintModal.jsx`, `DigitalIdViewer.jsx`)
Modernong identification system para sa lahat ng opisyal na NSTP students.

* **5.1. Official NSTP Digital ID Generator:**
  * Bawat aprubadong estudyante ay binibigyan ng high-resolution digital ID card na may CvSU Logo, 2x2 Photo, Complete Name, Student Number, Track, Course, at Dynamic Encrypted Attendance QR Code.
  * **Dynamic Typography Auto-Scaling:** Awtomatikong nag-a-adjust ang laki ng font para sa mahahabang pangalan at degree programs upang maiwasan ang text overflow.
* **5.2. Batch ID Card Print Layout (`BatchIdPrintModal.jsx`):** Print-ready layout (4 to 8 ID cards bawat A4/Letter page) para sa maramihang pag-print nang walang misalignment.
* **5.3. Public ID Verification Portal (`DigitalIdViewer.jsx`):** Nagbibigay-daan sa mga guro o opisyal na ma-verify ang pagiging lehitimo ng ID sa pamamagitan ng pag-scan sa QR code.

---

### 📲 Module 6: QR Code Attendance Scanner at Consolidated Matrix (`AttendanceScannerModal.jsx` & `StudentAttendanceMatrixModal.jsx`)
Paperless at mabilisang pagtatala ng attendance tuwing may training o community activities.

* **6.1. Live Camera QR Code Scanner (`html5-qrcode`):**
  * Ginagamit ang camera ng smartphone o laptop upang i-scan ang QR code sa ID ng estudyante para sa Time In at Time Out.
  * **Instant Verification:** Berdeng checkmark, pangalan ng estudyante, at timestamp sa bawat scan.
* **6.2. MySQL Batch Saving API (`POST /api/attendance/batch-save`):** Ini-save ang buong session data sa MySQL database upang hindi mawala ang logs.
* **6.3. Consolidated 1-Line per Student Excel Export:** Pinagsasama ang multiple scans ng parehong estudyante sa iisang linya sa Excel na may magkahiwalay na kolum para sa Time In at Time Out.
* **6.4. Student Attendance Matrix Modal (`StudentAttendanceMatrixModal.jsx`):** Spreadsheet-style matrix na nagpapakita ng complete attendance history ng buong klase na may automated calculation ng Total Presents, Absents, at Percentage.

---

### 👨‍🏫 Module 7: Instructor Portal (`InstructorDashboard.jsx`)
Ang nakalaang portal para sa mga faculty members at field instructors ng NSTP.

* **7.1. Assigned Section Roster:** Makikita lamang ng bawat Instructor ang mga estudyanteng nakatalaga sa kanilang partikular na section at track.
* **7.2. Quick Attendance Logger:** Kakayahang mag-scan ng QR codes o mag-mark ng manual attendance.
* **7.3. Student Performance & Grade Submissions:** Pagsubaybay at pagtatala ng grades para sa 1st Semester at 2nd Semester na naitatala sa `student_grades` table.

---

### 📑 Module 8: Academic Reports & Compliance Workflow (`Reports.jsx`)
Sentralisadong submission at approval hub para sa mga accomplishment reports, lesson plans, at documentation.

* **8.1. Admin Requirement Task Distribution:** Nagtatalaga ng report requirement na may pamagat, instructions, department scope, at deadline.
* **8.2. Instructor File Submission:** Pag-upload ng PDF, Word, o Excel accomplishment reports kasama ang photo documentation.
* **8.3. Three-State Review Workflow:** `Pending Review`, `Approved`, at `Needs Revision`.
* **8.4. Threaded Feedback & Commenting System:** Real-time notes at palitan ng komento sa loob mismo ng bawat report item.

---

### 💬 Module 9: Real-time Communication, Voice Chat, at Protected Group Channels (`Chat.jsx`)
Built-in institutional communication platform para sa koordinasyon ng NSTP Administrator at Instructors.

* **9.1. Direct 1-on-1 & Official Track Group Channels:** Ligtas na direct messaging at dedicated group channels para sa *ROTC*, *CWTS*, *LTS*, at *All Instructors*.
* **9.2. Protected Group Chat Security Policy:**
  * **Mahigpit na pinagbabawalan ang "Clear Chat History" at "Delete Conversation" sa mga Group Chats** upang protektahan ang opisyal na talaan ng pamantasan.
  * Tanging sa mga pribadong 1-on-1 chats lamang pinapayagan ang pag-clear o pag-delete ng usapan.
* **9.3. Real-Time WebSocket Engine (`Socket.IO`):** Zero-latency message delivery (<50ms), typing indicators, real-time unread badges, at instant reaction broadcasts.
* **9.4. Voice Audio Chat Engine (`MediaRecorder API`):** One-tap voice message recording gamit ang device microphone at client-side Opus audio encoding.
* **9.5. Messenger-Style Shared Media Backreader Hub:** Nakalaang gallery hub kung saan maaaring buksan at i-download ang lahat ng nakalakip na **Photos**, **Documents (PDF/Word/Excel)**, at **Voice Notes**.
* **9.6. Dynamic Real-Time Presence & Activity Tracker:** Nagpapakita ng `Online now` (<4m), `Active X mins ago`, `Active today at HH:MM AM/PM`, at `Active yesterday`.

---

### 📅 Module 10: Academic Calendar & Event Scheduler (`Calendar.jsx`)
Ang opisyal na kalendaryo ng mga gawain at aktibidad ng NSTP.

* **10.1. Monthly and Weekly Schedule Grid:** Naka-color code ang mga training sessions, community immersions, military drills, coastal clean-ups, at holidays.
* **10.2. Event Creation & Reminders:** Madaling paglikha at pagsubaybay sa mga paparating na aktibidad.

---

### ✉️ Module 11: Standardized Letter & Document Formats Generator (`LetterFormats.jsx`)
Awtomatikong generator ng mga opisyal at pormal na university letters.

* **11.1. Pre-formatted Template Library:** Excuse Letters, Endorsement Letters, at Memorandum of Agreement (MOA) para sa partner barangays.
* **11.2. Dynamic Data Injection:** Awtomatikong ipinapasok ang pangalan ng estudyante, track, petsa, at pirma ng NSTP Coordinator.

---

### 🔑 Module 12: Authentication, Cloud HTTPS Webhook & Password Reset System
Ligtas na access management at account recovery infrastructure.

* **12.1. Authentic Admin Account Architecture:** Ang opisyal na Primary Administrator ay naka-bind sa `richardbelen99@gmail.com` (Admin User). Tinanggal ang lahat ng hardcoded re-seeding ng lumang dummy accounts.
* **12.2. Strict Staff-Only Account Recovery:** Eksklusibo sa mga rehistradong Instructors at Admins (`users` table).
* **12.3. Google Apps Script Webhook (Port 443 HTTPS Dispatch):** Direktang ipinapadala ng Google ang OTP email sa Port 443 na 100% lumalampas sa cloud SMTP port blocking.
* **12.4. Dynamic Subject Line & 1-Click Clipboard Auto-Fill:** Bawat email ay may dynamic timestamp at 1-click button na awtomatikong nagkokopya ng OTP at nagbubukas ng login page nang may pre-filled code.

---

## 🗄️ 4. Relational Database Schema Architecture (18 Normalized Tables)

Ang sistema ay gumagamit ng **MySQL 8.0** na may **18 normalized relational tables** para sa buong academic at communication workflow:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           CORE DATABASE TABLES (18 TABLES)                                │
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
│ 13. active_visitors          - Real-time traffic at pure online visitor telemetry         │
│ 14. attendance_records       - QR code scan logs (studentId, event, session, status, time)│
│ 15. password_resets          - Dynamic 6-digit OTP tokens na may 10-minute expiration     │
│ 16. nstp_id_cards            - Digital ID metadata, custom serials, at QR code payload    │
│ 17. calls                    - WebRTC signaling logs para sa audio at video voice calls   │
│ 18. student_grades           - Official 1st Sem & 2nd Sem academic grades at completion   │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 5. Seguridad at Data Privacy (Republic Act No. 10173)

Ang buong sistema ay mahigpit na sumusunod sa **Data Privacy Act of 2012** sa pamamagitan ng sumusunod na mga layer ng proteksyon:

1. **Role-Based Access Control (RBAC) & JWT:** Tanging mga authenticated coordinators at instructors lamang ang may karapatang magbukas ng student personal information gamit ang digitally signed JSON Web Tokens.
2. **Cryptographic Password Hashing (BcryptJS):** Lahat ng user passwords ay naka-hash gamit ang **12 Salt Rounds**. Imposible itong ma-decrypt o mabasa kahit direktang buksan ang database.
3. **Prepared Statements & SQL Injection Defense:** 100% ng backend database queries ay gumagamit ng parameterized queries (`?` placeholders) sa pamamagitan ng `mysql2/promise` upang pigilan ang anumang SQL Injection attacks.
4. **HTTP Header Hardening & Rate Limiting (`helmet` & `express-rate-limit`):** Pinoprotektahan ang API laban sa cross-site scripting (XSS), clickjacking, sniffing, at automated DDoS brute-force attacks.
5. **Group Chat Immutability:** Pinoprotektahan ang official group conversations laban sa accidental o unauthorized deletion.

---

## 🎙️ 6. Gabay sa Oral Defense (Top 12 Questions and Answers para sa Panelists)

### ❓ Tanong 1: *"Ano ang pinaka-unique feature ng inyong system kumpara sa tradisyunal na Google Forms?"*
> **💡 Sagot:**  
> *"Ang Google Forms po ay simpleng data collector lamang na walang relational integrity, walang unmirrored camera capture, walang auto-conversion para sa iPhone HEIC photos, walang built-in QR Code attendance scanning, walang live staff chat with presence tracking, at hindi nakakapag-generate ng standardized 1-Click CHED Masterlists (Form A at Form B). Ang aming system ay isang **end-to-end relational academic management ecosystem** na kumpleto mula sa enrollment, ID printing, attendance tracking, hanggang sa official CHED report compliance."*

### ❓ Tanong 2: *"Bakit React 19 at Node.js ang napili ninyong Tech Stack sa halip na traditional PHP?"*
> **💡 Sagot:**  
> *"Pinili po natin ang **React SPA at Node.js** dahil sa bilis at scalability. Sa React, hindi nagre-reload ang buong page kaya napakabilis ng karanasan ng mga estudyante kahit gamit ang mobile data. Sa backend naman, ang Node.js ay asynchronous at non-blocking I/O kaya kaya nitong magproseso ng sabay-sabay na registration requests ng daan-daang freshmen nang hindi bumabagal ang server."*

### ❓ Tanong 3: *"Paano ninyo pinipigilan ang pagpasok ng mga troll o pekeng enrollment submissions?"*
> **💡 Sagot:**  
> *"Gumagamit po tayo ng **tatlong antas ng proteksyon**: (1) **Google reCAPTCHA v2** upang harangan ang automated bots; (2) **Rate Limiting Middleware** na naglilimita ng submissions kada IP address; at (3) **Document Validation Heuristics & IP Audit Logging** kung saan awtomatikong sinusuri kung papel na COR ang in-upload at naitatala ang IP address ng bawat nag-e-enroll para sa accountability."*

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
> *"Gumagamit po tayo ng backend spreadsheet engine (`exceljs` / `xlsx`). Kapag pinindot ng Admin ang 'Export CHED Masterlist', kinukuha ng server ang lahat ng aprubadong estudyante sa MySQL database nang direkta at walang duplicates, inaayos ang format ayon sa opisyal na template ng CHED (**OSDS-NSTP Form A at Form B** kasama ang institutional header, tracking code, at demographic columns), at ibinubuga ito bilang isang ready-to-print `.xlsx` file."*

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
> *"Mayroon po tayong **Continuous Batch Progression at Archival System** (`current_batch` at `archived_years` tables). Awtomatikong kinakalkula ng system ang susunod na academic cycle (e.g. 2026-2027 1st Sem ➔ 2026-2027 2nd Sem) na may typing confirmation safeguard. Ang mga nakaraang records ay ligtas na naka-archive at nananatiling searchable para sa historical reference."*

### ❓ Tanong 12: *"Ano ang inyong plano para sa Future Enhancements o susunod na bersyon ng sistema?"*
> **💡 Sagot:**  
> *"Para po sa susunod na enhancement, pinaplano nating magdagdag ng: (1) **Automated SMS Notifications** para sa emergency training cancellations, (2) **GPS Geofenced Attendance Scanning** para sa off-campus community immersion, at (3) **Direct SIS Integration** sa pangunahing University Portal ng Cavite State University."*

---

## 🌟 7. Mga Rekomendasyon at Future Work (Recommendations & Future Enhancements)

Upang lalong mapalawak at mapatatag ang pagpapatupad ng **CvSU Naic NSTP Record & Report Management System**, inirerekomenda ng mga mananaliksik ang mga sumusunod para sa pamantasan, sa NSTP Office, at sa mga susunod na mananaliksik:

### 🏛️ A. Rekomendasyon para sa Pamantasan at NSTP Department (Institutional Recommendations)
1. **Opisyal na Pag-adopt ng Sistema (Institutional Policy Adoption):** Pormal na ipatupad ang sistema bilang opisyal na digital registration at report platform ng Cavite State University - Naic Campus upang tuluyang maalis ang papel at mano-manong pila.
2. **Pagsasanay at Orientation para sa Faculty at Staff (Faculty Capacity Building):** Magdaos ng maikling oryentasyon bawat simula ng Academic Year para sa mga bagong NSTP Instructors ukol sa tamang paggamit ng QR Code Attendance Scanner, accomplishment reports, at Chat Hub.
3. **Pagtatalaga ng Dedicated Institutional Cloud Hosting:** Paggamit ng dedicated university hosting infrastructure o premium cloud servers na may automated daily snapshots.
4. **Pagsunod sa National Privacy Commission (NPC) Compliance:** Magtalaga ng Data Protection Officer (DPO) na magsasagawa ng taunang privacy impact assessment.

### 💻 B. Teknikal na Rekomendasyon para sa mga Susunod na Developers (Technical Enhancements)
1. **Pagsasama ng SMS Gateway (Twilio / Semaphore API):** Automated broadcast system para sa text announcements at emergency alerts.
2. **GPS Geofencing para sa Community Immersion Attendance:** Geolocation validation sa QR Code scanner para sa off-campus community immersion.
3. **AI-Powered OCR Document Verification:** Paggamit ng Vision OCR upang awtomatikong i-cross-check ang COR details laban sa user input.
4. **Progressive Web App (PWA) na may Offline Attendance Caching:** Ganap na offline attendance scanner para sa malalayong outreach sites na may auto-syncing pagbalik ng internet.
5. **Direct Integration sa CvSU Main Student Information System (SIS API):** Single Sign-On (SSO) at direct enrollment verification bridge.

---

## 📚 8. Talaan ng mga Sanggunian (References)

* **Commission on Higher Education (CHED).** (2021). *Revised Implementing Rules and Regulations of the National Service Training Program (NSTP)* (CHED Memorandum Order No. 01, Series of 2021).
* **Republic Act No. 9163.** (2002). *An Act Establishing the National Service Training Program (NSTP) for Tertiary Level Students*. Congress of the Philippines.
* **Republic Act No. 10173.** (2012). *Data Privacy Act of 2012*. National Privacy Commission of the Philippines.
* **Cavite State University - Naic.** (2024). *CvSU Naic Campus Institutional Standards and Manual of Operations*.

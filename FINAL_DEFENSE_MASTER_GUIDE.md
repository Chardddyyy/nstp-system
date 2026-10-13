# 🎓 CvSU Naic — NSTP Management & Record System
## 🏆 Final Defense Master Review Guide & Technical Compendium

> **Dokumentong Pamantayan para sa Final Defense**  
> *Lahat ng kailangan mo para sa oral presentation, technical demonstration, panelist Q&A, system architecture, at code defense ay narito sa iisang file.*

---

## 📑 Talaan ng Nilalaman
1. [Executive Summary at Project Background](#1-executive-summary-at-project-background)
2. [Objectives: General & Specific](#2-objectives-general--specific)
3. [Scope and Delimitation](#3-scope-and-delimitation)
4. [System Architecture at Full Tech Stack (100% Free Localhost & On-Premise)](#4-system-architecture-at-full-tech-stack-100-free-localhost--on-premise)
5. [Database Schema at Localhost Data Infrastructure](#5-database-schema-at-localhost-data-infrastructure)
6. [Mga Pangunahing Modyul at Features](#6-mga-pangunahing-modyul-at-features)
7. [Algorithm & Business Logic Highlights](#7-algorithm--business-logic-highlights)
8. [DevSecOps, Security Audits & Disaster Recovery](#8-devsecops-security-audits--disaster-recovery)
9. [Step-by-Step Live Defense Demonstration Script](#9-step-by-step-live-defense-demonstration-script)
10. [Top 25 Panelist Defense Questions & Winning Answers](#10-top-25-panelist-defense-questions--winning-answers)

---

## 1. Executive Summary at Project Background

### 🏫 Institusyon at Asignatura
* **Unibersidad:** Cavite State University – Naic Campus (CvSU Naic)
* **Departamento:** Office of Student Development and Services (OSDS) / NSTP Department
* **Programa:** National Service Training Program (Republic Act No. 9163)
* **Mga Component / Tracks:**
  1. **CWTS:** Civic Welfare Training Service
  2. **LTS:** Literacy Training Service
  3. **ROTC:** Reserve Officers' Training Corps

### 🛑 Dating Sistema at mga Suliranin (Problem Statement)
Bago binuo ang sistemang ito, ang NSTP Department ng CvSU Naic ay humaharap sa mga sumusunod na pagsubok:
1. **Manual Enrollment at Pisikal na Pila:** Mano-manong nagpupunta ang mga freshman sa opisina upang magpasa ng photocopy ng Certificate of Registration (COR).
2. **Kakulangan sa Document Verification:** Maraming estudyante ang nagpapasa ng malabong litrato, screenshot ng social media, o duplicate 2x2 pictures sa halip na tunay na official registration form.
3. **Mano-manong Attendance Sheet:** Madaling mawala, mapunit, o mabasa ang papel na attendance roster. Matagal din ang proseso ng pagtawag sa mahigit daan-daang estudyante tuwing Sabado o Linggo.
4. **Cross-Department Human Error:** Madalas mapaghalo ang attendance ng ROTC, CWTS, at LTS dahil sa iisang venue o sabay-sabay na schedule.
5. **Kakulangan sa Agarang Komunikasyon:** Walang integrated communication platform para sa instructors at admin maliban sa magulong personal social media groups.
6. **Data Privacy at Cloud Cost Risks:** Ang paggamit ng mga bayarang banyagang cloud servers (tulad ng Render at third-party DBs) ay nagdudulot ng patuloy na buwanang gastusin sa institusyon ($13+ buwan-buwan) at naglalagay ng personal na impormasyon ng mga estudyante sa labas ng lokal na kontrol ng unibersidad labag sa diwa ng Data Privacy Act of 2012.

---

## 2. Objectives: General & Specific

### 🎯 General Objective
Makapagdisenyo, makabuo, at makapagpatakbo ng isang secure, high-performance, at **100% Free Localhost / Institutional On-Premise NSTP Management and Record System** para sa CvSU Naic na may online enrollment, automated COR validation, real-time QR attendance tracking na may track isolation, integrated messaging, at automated report generation na sumusunod sa CHED standards nang walang anumang recurring cloud hosting fees.

### 🎯 Specific Objectives
1. **Online Enrollment with Canvas Document Validation:** Makagawa ng self-service registration portal na awtomatikong sumusuri kung papel/dokumento ba talaga ang in-upload na COR gamit ang computer vision canvas algorithms (luminance, chroma, ink density).
2. **Dynamic Digital ID Card with Anti-Tamper QR Code:** Makapag-generate ng opisyal na printable at downloadable Digital ID Card na may encrypted payload para sa bawat lehitimong estudyante.
3. **Real-Time Attendance Scanner with Track Isolation:** Makabuo ng QR scanner gamit ang camera o manual input na nagpapatupad ng mahigpit na track isolation (halimbawa: hindi kailanman mairerekord ng ROTC instructor ang CWTS student).
4. **Automated Lateness Detection & Grace Period Engine:** Makapag-kalkula nang awtomatiko kung "On-Time" o "Late" ang estudyante batay sa class start time at napiling grace period (10, 15, o 30 minuto).
5. **Real-Time WebSockets Communication, Voice Messages & Device Notifications:** Makapagbigay ng zero-latency messaging, interactive voice notes, at instant browser/device notifications na may kasamang hardware audio chime sa pagitan ng Admin at Instructors nang hindi na kailangang mag-refresh ng pahina.
6. **CHED & OSDS Compliance Reporting:** Makapag-export ng OSDS-NSTP Form 2-A, Form 2-B, at CHED masterlist sa Excel at PDF format sa isang pindot lamang.
7. **Strict Letter Formats & Form Management:** Makapagbigay ng opisyal na lalagyan ng transmittal letters at excuse forms na may mahigpit na file verification upang maiwasan ang paglikha ng mga pekeng dokumento.
8. **Institutional On-Premise Data Sovereignty & Disaster Recovery:** Makapagtatag ng zero-cost local MySQL data infrastructure na may automated daily compressed backup (`.sql.gz`) at secure cloud mirroring sa Google Drive via Google Apps Script Webhooks.

---

## 3. Scope and Delimitation

### 📌 Saklaw (Scope)
* **Target Users:**
  * **System Administrator / NSTP Coordinator:** Ganap na kontrol sa enrollment approvals, batch sectioning, grading, CHED exports, analytics, at user accounts.
  * **NSTP Instructors (CWTS, LTS, ROTC):** Attendance scanning para sa kanilang partikular na track, report submission, announcements, at calendar tracking.
  * **Enrolling Students:** Online submission ng application, real-time application status tracker, at Digital ID viewer.
* **Attendance Cycle:** 15-Session official semester matrix (Day 1 hanggang Day 15).
* **Supported Degree Programs:** BSIT, BSCS, BSHM, BSBA, BSFAS, at iba pang program sa CvSU Naic.
* **Document Generation:** Real-time PDF ID Cards, Excel grade masters, CHED templates, at transmittal letters.
* **Deployment Model:** 100% On-Premise / Campus Localhost Network (Port 5173 para sa Frontend, Port 3001 para sa API Gateway, Port 3306 para sa MySQL).

### 📌 Hangganan (Delimitations)
* Eksklusibo ang sistema sa **CvSU Naic Campus** at sa mga patakaran ng OSDS-NSTP nito.
* Hindi tumatanggap ang attendance scanner ng cross-department attendance (bawal mag-scan ang ROTC instructor sa CWTS/LTS).
* Ang mga instructor ay walang karapatang mag-download o mag-export ng official master grade sheets (admin-only security restriction).
* Hindi gumagamit ng mga bayarang banyagang cloud computing services (tulad ng Render o AWS) upang maiwasan ang patuloy na financial overhead ng institusyon.

---

## 4. System Architecture at Full Tech Stack (100% Free Localhost & On-Premise)

```
               [ User Devices: Coordinator / Instructor / Student ]
                                    │
                                    ▼
          ┌─────────────────────────────────────────────────────┐
          │         FRONTEND CLIENT (SPA)                       │
          │  • React 19 + Vite 7 (High Speed Bundler)           │
          │  • Localhost Port: 5173 / Campus LAN IP             │
          │  • Tailwind CSS v4 (Modern Styling & Dark UI)       │
          │  • HTML5-QRCode Scanner + Web Audio API Chime       │
          │  • jsPDF, html2canvas, ExcelJS Client Exporters     │
          └─────────────────────────┬───────────────────────────┘
                                    │ Local HTTP / WebSocket Proxy
                                    ▼
          ┌─────────────────────────────────────────────────────┐
          │         BACKEND REST API & REALTIME GATEWAY         │
          │  • Node.js v20+ & Express.js Engine (Port 3001)     │
          │  • Socket.io (Bi-directional Instant Messaging)     │
          │  • JWT (JSON Web Tokens) Bearer Authentication      │
          │  • Helmet Security Headers & Rate Limiters          │
          │  • Zero-Cost Local Runtime (No Cloud Recurring Fee) │
          └─────────────────────────┬───────────────────────────┘
                                    │ Ultra-Low Latency (~1ms)
                                    ▼
          ┌─────────────────────────────────────────────────────┐
          │         LOCAL MYSQL 8.x ENTERPRISE DATABASE         │
          │  • Address: 127.0.0.1:3306 / Database: nstp_system  │
          │  • Full Data Sovereignty (Data Privacy Act of 2012) │
          │  • Connection Pooling (10 Concurrent Pool, Queue: 1k│
          │  • Gzip Automated Snapshots (scripts/backup_db.sh)  │
          └─────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
          ┌─────────────────────────────────────────────────────┐
          │       DISASTER RECOVERY & SYNC MIRRORING            │
          │  • Google Drive Webhook Sync (Apps Script Engine)   │
          │  • Automated Midnight Cron Local Backup (00:00 PHT) │
          │  • Optional Cloudinary / Local Hybrid Storage       │
          └─────────────────────────────────────────────────────┘
```

### 🛠️ Detalyadong Listahan ng Teknolohiya

| Layer | Teknolohiya | Rationale / Bakit Ito ang Ginamit? |
| :--- | :--- | :--- |
| **Frontend Framework** | `React 19` | Mahusay sa component-based reusability, virtual DOM diffing, at reactive state management para sa realtime dashboards. |
| **Build Tool** | `Vite 7` | Mabilis na HMR (Hot Module Replacement) at optimized production chunking kumpara sa lumang Webpack o Create-React-App. |
| **Styling** | `Tailwind CSS v4` | Modernong utility-first styling engine na nagbibigay ng mataas na UI/UX polish, responsive mobile layouts, at dark mode nang walang mabigat na CSS overhead. |
| **Runtime & Backend** | `Node.js & Express` | Non-blocking, event-driven I/O model na kayang humawak ng sabay-sabay na concurrent requests at socket connections sa mababang memory footprint. |
| **Realtime Gateway** | `Socket.io v4.8` | Real-time full-duplex communication para sa 0ms instant text messaging, voice messages, live attendance broadcast, at instant device notification alerts. |
| **Database** | `Local MySQL 8.x` | Ganap na **libre (P0.00)**, ultra-fast 1ms query response, walang risk ng cold-start delays, at sumusunod sa **Data Privacy Act of 2012** dahil ang mga datos ng estudyante ay nananatili sa loob ng institusyon. |
| **Hardware Audio** | `Web Audio API` | 100% self-contained synthesized frequency oscillator na nagpapatunog ng malinaw na chimes nang hindi nangangailangan ng panlabas na mp3 files. |
| **Security Layer** | `Helmet, xss, & Rate-Limit` | Pinoprotektahan ang server laban sa HTTP header vulnerabilities, clickjacking, brute-force attacks, at XSS injection. |

### 💡 Bakit Localhost / On-Premise Architecture ang Pinakamagandang Desisyon?
1. **Pagsunod sa Data Privacy Act of 2012 (RA 10173):** Ang mga personal na dokumento tulad ng Certificate of Registration (COR), 2x2 biometric photos, at home addresses ay hindi inilalabas sa mga commercial cloud servers sa ibang bansa.
2. **Zero Recurring Budget Burden:** Walang buwanang subscription fee ($13 o higit pa kada buwan sa Render) na kailangang bayaran ng mga estudyante o ng unibersidad.
3. **Mataas na Bilis (1ms Latency):** Walang internet lag o cold-start delay kapag nag-i-scan ng daan-daang estudyante tuwing Sabado at Linggo.
4. **Offline Resilience:** Kahit mawalan ng koneksyon sa internet ang campus o magkaroon ng fiber cut ang ISP, tuloy-tuloy pa rin ang attendance scanning at pag-record sa local network.

---

## 5. Database Schema at Localhost Data Infrastructure

### 🗄️ Mga Pangunahing Database Tables sa `nstp_system` (MySQL 8.x)

```
                    ┌────────────────────────┐
                    │         users          │
                    │ id (PK), email, role,  │
                    │ password, department   │
                    └───────────┬────────────┘
                                │ 1:N
            ┌───────────────────┼───────────────────┐
            │ 1:1               │ 1:N               │ 1:N
            ▼                   ▼                   ▼
┌───────────────────────┐ ┌───────────────┐ ┌──────────────────────┐
│       students        │ │    reports    │ │    conversations     │
│ id (PK), studentId,   │ │ id (PK),      │ │ id (PK), title,      │
│ name, department,     │ │ title,        │ │ is_group, created_at │
│ nstp_section, status  │ │ deadline      │ └──────────┬───────────┘
└───────────┬───────────┘ └───────┬───────┘            │ 1:N
            │ 1:N                 │ 1:N                ▼
            ▼                     ▼         ┌──────────────────────┐
┌───────────────────────┐ ┌───────────────┐ │       messages       │
│  attendance_records   │ │ submissions   │ │ id (PK), conv_id,    │
│ id (PK), studentId,   │ │ id, reportId, │ │ sender_id, text,     │
│ activity_name, status,│ │ file_path     │ │ created_at           │
│ scan_type, is_late    │ └───────────────┘ └──────────────────────┘
└───────────────────────┘
```

1. **`users`**: Taglay ang admin at instructor accounts (naka-hash ang password gamit ang `bcryptjs` na may 12 rounds).
2. **`students`**: Opisyal na talaan ng mga lehitimong estudyante kabilang ang studentId, kurso, seksyon, NSTP component, at digital ID payload.
3. **`enrollments`**: Temporary buffer para sa mga bagong nag-a-apply online kalakip ang uploaded 2x2 photo at validated COR.
4. **`attendance_records`**: Naglalaman ng attendance per session (Day 1 - 15), time in, time out, is_late flag, at activity title.
5. **`conversations` & `messages`**: Private at group chat threads kasama ang soft-delete at reaction logs.
6. **`reports` & `report_submissions`**: Academic compliance reports na ipinapasa ng instructors sa admin.
7. **`archived_years`**: Imbakan ng mga nakalipas na academic batches (A.Y. 2023-2024, 2024-2025, 2025-2026).

---

## 6. Mga Pangunahing Modyul at Features

### 1. Self-Service Online Enrollment Portal
* Tumatanggap ng impormasyon ng freshman student.
* Pumipili ng gustong NSTP Track (CWTS, LTS, o ROTC).
* Tumatanggap ng 2x2 ID Photo at Certificate of Registration (COR).
* May built-in instant application tracking gamit ang Reference ID o Student Number.

### 2. Client-Side Canvas COR Document Validation
* Bago ma-upload ang file, sinusuri ng browser canvas kung tunay na dokumento ang isinumite.
* Kung nag-upload ng selfie, meme, o landscape photo, agad itong tatanggihan ng system.
* May duplicate detection upang hindi magamit ang parehong litrato bilang 2x2 at COR.

### 3. Smart QR Attendance Scanner & Manual ID Console
* Gumagamit ng device camera (rear o front) gamit ang `html5-qrcode`.
* Sinusuportahan ang instant typing ng student ID kung sakaling walang dala o sira ang camera ng estudyante.
* **Track Isolation:** Awtomatikong hinaharangan ang estudyante mula sa ibang track (hal. ROTC vs CWTS) nang hindi nagkaka-crash ang camera.
* Awtomatikong nagtatala ng Time-In at Time-Out.

### 4. Interactive Grouped Column Bar Graph (Analytics)
* Matatagpuan sa Admin Dashboard.
* Ipinapakita ang live breakdown ng mga estudyante bawat degree program (BSIT, BSCS, BSHM, BSBA, BSFAS).
* Naka-cluster ang vertical columns ayon sa track: **CWTS (Green)**, **LTS (Purple)**, at **ROTC (Red)**.
* May interactive toggle para sa All Tracks, CWTS-only, LTS-only, at ROTC-only.
* Puwedeng i-click ang kahit anong column para mag-focus at mag-filter sa naturang kurso.

### 5. Instant Real-Time Chat, Voice Messages & Device Notifications
* Powered by Socket.io real-time engine (zero-latency message delivery).
* **Text Chat & Voice Messaging:** Suportado ang direct at group chat, file/photo attachments, at **Voice Messages** (Audio recording gamit ang microphone ng device at embedded audio player).
* **Device & In-App Alerts:** May synthesized hardware audio chime gamit ang Web Audio API, visual in-app toast, at browser notification kapag may bagong mensahe.

### 6. Automated Document & Report Generation
* **Digital ID Cards:** Isang pindot para mag-generate ng standardized high-resolution PDF ID na may QR code.
* **OSDS-NSTP Form 2-A & 2-B:** Opisyal na CHED annual completion format na may kumpletong student roster at grading columns.

### 7. Letter Formats & Administrative Document Center (Na-Audited at Na-Refactor)
* Opisyal na lagakan ng mga CvSU NSTP letter templates (Medical Excuse, Immersion Request, Parent Consent, at Special Make-Up Agreements).
* **Strict Attachment Requirement:** Hindi na kailanman lumilikha ang system ng mga pekeng random letter o mock files (`135.0 KB`) kapag walang totoong file na in-attach ang user.
* Mahigpit na Department Isolation para sa Instructors: ang CWTS Instructor ay maaari lamang magbago o magbura ng mga sulat na sakop ng CWTS.

---

## 7. Algorithm & Business Logic Highlights

### A. Document Verification Canvas Algorithm (`documentValidation.js`)
Paano nalalaman ng system kung papel/COR ba ang ini-upload ng estudyante nang hindi gumagamit ng magastos na third-party OCR API?
1. **Luminance Calculation:** Kinukuha ang RGB values ng bawat pixel sa canvas:
   $$\text{Luminance} = 0.299R + 0.587G + 0.114B$$
   Ang tunay na papel o photocopy ay may average background luminance na $> 140$.
2. **Chroma / Color Saturation:**
   $$\text{Chroma} = \max(R, G, B) - \min(R, G, B)$$
   Ang official printed forms ay may mababang chroma ($< 36$) dahil itim, puti, o gray ang papel at tinta.
3. **Ink Density Check:** Sinusuri kung may sapat na text pixels ($\text{Luminance} < 115$) upang masigurong may nakaimprentang mga letra at hindi blankong puting papel lang.

### B. Grace Period & Lateness Cutoff Calculation (`checkIsLate`)
$$\text{Cutoff Time} = \text{Start Time} + \text{Grace Period Minutes}$$
* Kapag ang estudyante ay nag-scan ng Time In pagkatapos ng Cutoff Time (hanggang sa 59th second), awtomatikong itinatakda ang `status = 'Late'` at `is_late = 1`.

### C. ROTC / CWTS / LTS Track Isolation Engine
```javascript
// Strict Boundary Check sa Scanner
if (instructorRole === 'instructor' && instructorDept !== 'All') {
  if (studentDept !== instructorDept) {
    playScanBeep(false); // Error audio
    return; // STOP! Walang lalabas sa sessionLogs at walang error crash
  }
}
```

### D. File Integrity & Letter Attachment Validation
```javascript
// Mahigpit na pagpigil sa paglikha ng pekeng attachment
const hasExistingFile = editingTemplate && editingTemplate.file && (editingTemplate.file.data || String(editingTemplate.id || '').startsWith('tpl-'));
if (!attachedFile && !hasExistingFile) {
  showToast('Please attach a document file (PDF, Word, or Image) before saving.', 'warning');
  return;
}
const finalFile = attachedFile || (editingTemplate ? editingTemplate.file : null);
```

---

## 8. DevSecOps, Security Audits & Disaster Recovery

### 🛡️ Defensive Security Matrix

| Uri ng Banta (Threat) | Paraan ng Proteksyon sa Sistema | Katayuan |
| :--- | :--- | :---: |
| **SQL Injection (SQLi)** | 100% ng database queries sa `server.js` ay gumagamit ng **Parameterized Queries (`?`)** via `mysql2/promise`. Walang string concatenation ng user inputs. | **Pumasa** |
| **Cross-Site Scripting (XSS)** | Ang React JSX ay awtomatikong nag-e-escape ng output. Ang dynamic HTML sa letters ay sinasala ng `xss()` library, at ang email bodies ay pinangangalagaan ng `escapeHtml()`. | **Pumasa** |
| **CSRF Attacks** | Walang ambient cookies na ginagamit sa authentication. Lahat ng tawag ay nangangailangan ng `Authorization: Bearer <JWT>` header. | **Pumasa** |
| **Brute Force & DoS** | Nililimitahan ng `express-rate-limit` ang login attempts sa 10 kada 15 minuto, at ang global API sa 3,000 requests kada window. | **Pumasa** |
| **Password Security** | Minimum 8 characters policy, bcrypt hashing (12 work factor), at current-password verification bago makapag-reset ng password. | **Pumasa** |
| **User Enumeration** | Ang password reset endpoint ay hindi naglalabas ng impormasyon kung rehistrado o hindi ang inilagay na email address. | **Pumasa** |
| **Environment Secrets** | Ang `.env` at `backend/.env` ay mahigpit na nakatago sa `.gitignore` at hindi kailanman na-e-expose sa repository. | **Pumasa** |

### 💾 Disaster Recovery Strategy
1. **Local Compressed Snapshot (`scripts/backup_database.sh`):**
   * Isang mabilisang bash command na lumilikha ng gzip-compressed full database dump (`.sql.gz`) sa loob ng 1 segundo.
   * Awtomatikong naglilinis ng mga lumang snapshot na lampas sa 30 araw upang mapangalagaan ang storage ng computer.
2. **Google Drive Cloud Mirroring (`backend/utils/gdriveAutoSave.js`):**
   * Bawat mahalagang transaksyon (tulad ng student approvals, grading, at archiving) ay awtomatikong nagpapadala ng encrypted JSON payload sa nakakonektang Google Apps Script Webhook para sa cloud redundancy.

---

## 9. Step-by-Step Live Defense Demonstration Script

Sundin ang pagkakasunod-sunod na ito sa harap ng defense panel para sa isang perpekto at propesyonal na presentasyon:

```
[ Hakbang 0: Pagpapatakbo ng Localhost Server ]
 └─ Sa terminal: npm run dev:all
 └─ Buksan ang browser sa: http://localhost:5173

[ Hakbang 1: Landing Page & Telemetry ]
 └─ Ipakita ang CvSU Naic Portal.
 └─ Ituro ang live Telemetry (Total Active Students, Total Enrollments, at Genuine Visitors).

[ Hakbang 2: Online Student Enrollment & COR Validation ]
 └─ Pumunta sa /enrollment. Mag-fill out ng bagong estudyante (hal. Juan Dela Cruz, BSIT, ROTC).
 └─ Subukang mag-upload ng random selfie o meme sa COR slot (Pansinin: tatanggihan ito ng Canvas Validator!).
 └─ I-upload ang totoong sample COR (Pansinin: papasa ito at makakakuha ng Reference ID).

[ Hakbang 3: Admin Dashboard Approval ]
 └─ Mag-login bilang Admin (richardbelen99@gmail.com).
 └─ Buksan ang Pending Enrollments. Ipakita ang side-by-side audit ng 2x2 photo at COR.
 └─ I-click ang "Approve Enrollment" (Awtomatikong papasok ang estudyante sa Official Student Roster).

[ Hakbang 4: Analytics Bar Graph Demonstration ]
 └─ Sa Admin Dashboard, ipakita ang "CvSU Naic Analytics & Program Distribution".
 └─ Ipakita ang vertical columns bawat kurso (BSIT, BSCS, BSHM, atbp.).
 └─ I-toggle ang "ROTC" filter para makitang dynamic na nag-a-adjust ang bar graph.

[ Hakbang 5: Digital ID Card Generation ]
 └─ Pumunta sa Student Management. Hanapin ang bagong aprubadong estudyante.
 └─ Buksan ang Digital ID. Ipakita ang QR Code na may anti-tampering hash.
 └─ I-download ang printable high-resolution PDF ID Card.

[ Hakbang 6: Attendance Tracking & Track Isolation ]
 └─ Mag-login gamit ang ROTC Instructor account (rotc@gmail.com).
 └─ Buksan ang Live Attendance Scanner. Itakda ang Day 1 Session at 15-minute grace period.
 └─ Test A (Mismatched Track): I-scan o i-type ang ID ng CWTS student.
    ↳ Resulta: May error warning, HINDI naitala, walang lalabas sa table, at walang crash!
 └─ Test B (Matched Track): I-scan ang ID ng ROTC student.
    ↳ Resulta: Tutunog ang audio beep, lalabas ang estudyante bilang "Timed In".

[ Hakbang 7: Real-Time Chat, Voice Messages & Device Notifications ]
 └─ Magbukas ng dalawang browser window (Admin at Instructor).
 └─ Mag-chat o magpadala ng Voice Message mula sa Admin.
    ↳ Resulta: Agad itong tutunog (hardware chime) at magpapakita ng notification nang walang page reload!

[ Hakbang 8: Letter Formats & Document Center ]
 └─ Pumunta sa Letter Formats. Ipakita ang mga opisyal na templates.
 └─ Subukang mag-save ng letter nang walang file (Pansinin: Haharangin ito ng system at hindi gagawa ng pekeng sulat).
 └─ Mag-attach ng totoong PDF o document at i-download ito.

[ Hakbang 9: Official Reports, CHED Export & Local Database Backup ]
 └─ Ipakita ang CHED Masterlist Export sa Excel at OSDS Form 2-A/2-B.
 └─ Ipakita ang mabilisang database backup snapshot sa terminal: bash ./scripts/backup_database.sh.
```

---

## 10. Top 25 Panelist Defense Questions & Winning Answers

### 💡 Kategorya A: System Architecture & Deployment

#### Q1: "Bakit React at Vite ang pinili ninyo sa halip na traditional PHP o Next.js?"
> **Sagot:**  
> "Pinili po namin ang React kasama ang Vite dahil ang aming aplikasyon ay nangangailangan ng high-frequency interactive updates tulad ng live attendance scanning, QR decoding, at real-time socket chats na hindi nangangailangan ng full-page reloads. Ang Vite ay nagbibigay ng instant build performance at optimized client bundles, habang ang decoupled Node.js REST API ay nagbibigay sa amin ng malinis na separation of concerns sa pagitan ng client at database."

#### Q2: "Ano ang bentahe ng Socket.io kumpara sa karaniwang HTTP polling?"
> **Sagot:**  
> "Ang karaniwang HTTP polling ay paulit-ulit na nagpapadala ng requests sa server bawat segundo, na nagdudulot ng mataas na bandwidth consumption at server overhead. Ang Socket.io naman ay nagtatatag ng isang persistent, bi-directional WebSocket connection. Kapag may bagong mensahe o attendance event, agad itong 'itinutulak' ng server sa client na may 0ms latency nang walang sayang na HTTP traffic."

#### Q3: "Bakit Localhost / On-Premise Architecture ang pinili ninyo sa halip na magbayad ng banyagang Cloud tulad ng Render o AWS?"
> **Sagot:**  
> "Ito po ay isang sadyang desisyong pang-arkitektura (architectural decision) batay sa tatlong mahahalagang pamantayan:
> 1. **Data Privacy Act of 2012 (RA 10173):** Ang mga personal na dokumento tulad ng COR, 2x2 ID photos, at grading records ay nananatili sa loob ng perimeter ng CvSU Naic at hindi inilalabas sa mga commercial cloud servers sa ibang bansa.
> 2. **Financial Sustainability (P0.00 Cost):** Ang mga commercial cloud services ay naniningil buwan-buwan (tulad ng Render na nagkakahalaga ng mahigit $13 kada buwan). Ang aming On-Premise setup ay walang anumang recurring fees para sa unibersidad.
> 3. **Mababang Latency at Offline Resilience:** Sa pamamagitan ng local network, nakakamit namin ang 1ms query latency na mahalaga sa mabilisang QR scanning ng daan-daang estudyante tuwing weekend exercises kahit walang internet signal."

---

### 💡 Kategorya B: Database, Security & Data Privacy

#### Q4: "Paano ninyo pinoprotektahan ang database laban sa SQL Injection?"
> **Sagot:**  
> "Lahat po ng queries sa aming backend ay gumagamit ng **Parameterized Queries (Prepared Statements)** gamit ang `mysql2/promise`. Ang mga variable mula sa user ay hindi kailanman idinidikit gamit ang string concatenation (`+`), kundi ipinapasa bilang parameters gamit ang placeholder na `?`. Dahil dito, itinuturing ng MySQL engine ang user input bilang purong data at hindi bilang executable SQL command."

#### Q5: "Ano ang ginagawa ninyo para maiwasan ang Cross-Site Scripting (XSS) attacks?"
> **Sagot:**  
> "Mayroon po kaming tatlong antas ng depensa: Una, ang React JSX ay likas na nag-e-escape ng anumang dynamic string bago i-render sa DOM. Pangalawa, sa mga bahagi kung saan kailangan naming mag-render ng formatted documents, ipinapasa po muna namin ang HTML sa `xss()` sanitization engine. Pangatlo, ang mga automated emails na ipinapadala ng server ay pinangangalagaan ng aming `escapeHtml()` defensive function."

#### Q6: "Bakit hindi kayo gumamit ng cookies para sa authentication? Ano ang bentahe ng Bearer JWT?"
> **Sagot:**  
> "Ang paggamit ng `Authorization: Bearer <JWT>` header ay epektibong pumipigil sa Cross-Site Request Forgery (CSRF). Ang mga browser cookies ay awtomatikong ipinapadala ng browser kahit sa cross-origin requests, na siyang ugat ng CSRF vulnerabilities. Sa aming token-based architecture, ang client lamang ang may hawak ng JWT at ipinapadala lamang ito sa mga lehitimong API calls."

#### Q7: "Paano pinangangalagaan ang passwords at user sessions sa Localhost setup?"
> **Sagot:**  
> "Lahat ng passwords ay naka-hash gamit ang `bcryptjs` na may 12 salt rounds—hindi kailanman nakaimbak ang plain-text password. Bago makapag-palit ng password ang user sa kanilang profile, kailangan nilang patunayan ang kanilang `currentPassword`. Bukod dito, ang aming `JWT_SECRET` ay nakaimbak sa isang secure na `.env` configuration file na mahigpit na naka-exclude sa `.gitignore`."

---

### 💡 Kategorya C: Business Logic & Feature Integrity

#### Q8: "Paano ninyo nasisiguro na hindi makakapag-attendance ang CWTS student sa ROTC instructor?"
> **Sagot:**  
> "Bago po i-commit ang attendance log sa database, mayroong **Track Isolation Boundary Check** ang aming scanner. Sinusuri ng system kung ang department ng instructor ay tumutugma sa department ng estudyante. Kung hindi ito tugma, agad na pumuputol ang execution: nagpapatunog ng error beep ang scanner, nagpapakita ng babala, hindi idinaragdag ang estudyante sa session logs, at walang anumang error o crash na magaganap sa scanner."

#### Q9: "Paano gumagana ang inyong Document Validation para sa COR nang walang binabayarang AI service?"
> **Sagot:**  
> "Gumagamit po kami ng HTML5 Canvas image pixel analysis algorithm. Sinusuri po namin ang **Background Luminance** ($> 140$ para sa puting papel), ang **Chroma/Saturation** ($< 36$ upang tiyaking black-and-white na dokumento ito at hindi makulay na litrato), at ang **Ink Density** ($< 115$) para matiyak na may imprentang mga letra. Mayroon din itong hash comparison para maiwasang i-upload muli ng estudyante ang kanyang 2x2 picture bilang COR."

#### Q10: "Bakit tinanggal ang grade downloading at printing options para sa mga instructors?"
> **Sagot:**  
> "Ito po ay batay sa opisyal na patakaran ng CvSU Naic OSDS. Ang pinal na grado at official completion sheets (Form 2-A at 2-B) ay itinuturing na confidential institutional records. Ang Admin / NSTP Coordinator lamang ang may legal na awtoridad na mag-export at magsumite ng official grade masterlists sa CHED upang maiwasan ang data tampering at unauthorized grade distribution."

#### Q11: "Paano nalalaman ng system kung Late ang estudyante sa attendance?"
> **Sagot:**  
> "Sa simula ng session, itinatakda ng instructor ang class start time at ang napiling grace period (halimbawa: 8:00 AM na may 15-minute grace period). Ang cutoff ay nagiging 8:15:59 AM. Kapag ang time stamp ng Time In ng estudyante ay lumampas sa cutoff, awtomatikong itinatakda ng system ang flag na `is_late = 1` at inilalagay ang status bilang 'Late' sa master matrix."

#### Q12: "Bakit Bar Graph ang ginamit sa Analytics sa halip na simpleng cards o pie chart?"
> **Sagot:**  
> "Ang grouped column bar graph po ang pinakamadaling basahin kapag naghahambing ng enrollment sa iba't ibang academic degree programs (BSIT, BSCS, BSHM, atbp.) laban sa tatlong magkakaibang tracks (CWTS, LTS, ROTC). Ang pie charts ay mahirap basahin kapag marami nang slices, samantalang ang grouped bar graph ay agad na nagpapakita ng pinakamalaking track at nagbibigay ng agarang visual distribution para sa administrative decisions."

#### Q13: "Paano ninyo inayos ang bug sa Letter Formats kung saan gumagawa ito ng random letter kapag walang in-attach na file?"
> **Sagot:**  
> "Nagsagawa po kami ng masusing code audit at natuklasan na ang dating code ay may fallback dummy file generator na kusa naglalagay ng `135.0 KB` mock file. Inayos po namin ito sa pamamagitan ng:
> 1. Pagtatakda ng **Strict Frontend Validation** kung saan bawal mag-save kung walang piniling file.
> 2. Pagtanggal sa lahat ng fabricated mock files.
> 3. Paglalagay ng download guards upang ang tunay na in-upload na file lamang ang mada-download ng user."

---

### 💡 Kategorya D: Disaster Recovery, Performance & Future Work

#### Q14: "Ano ang disaster recovery plan kapag nasira ang local machine ng coordinator?"
> **Sagot:**  
> "Mayroon po kaming dual-layer redundancy:
> 1. **Automated Local Snapshots (`scripts/backup_database.sh`):** Awtomatikong nag-e-export ng compressed `.sql.gz` dump ang server tuwing hatinggabi (00:00 Manila Time) na naitatabi sa `backups/` folder.
> 2. **Google Drive Cloud Mirroring:** Sa pamamagitan ng aming `gdriveAutoSave.js` webhook integration, ang mga transaksyon ay naisasalba rin sa Google Drive via Google Apps Script. Kung sakaling masira ang physical computer, madali itong mai-restore sa anumang bagong computer sa loob lamang ng 2 minuto gamit ang `mysql -u root nstp_system < backup.sql`."

#### Q15: "Kung mag-eenroll ang 5,000 freshmen nang sabay-sabay, paano maiiwasan ang pagbagal ng database?"
> **Sagot:**  
> "Ang aming MySQL database pool ay naka-configure na may `connectionLimit: 10`, `waitForConnections: true`, at `queueLimit: 1000`. Sa halip na mag-crash ang database dahil sa sobrang koneksyon, pinipila ng pool ang mga requests. Bukod dito, ang client-side canvas validation ay sumasala na sa maling uploads bago pa man ito makarating sa server, kaya hindi nasasayang ang resources ng database."

#### Q16: "Ano ang susunod na hakbang para higit pang mapaganda ang sistema (Future Recommendations)?"
> **Sagot:**  
> "Bilang future recommendations:
> 1. Pagpapatakbo ng automated local network mDNS discovery upang madaling makakonekta ang ibang computer sa campus nang hindi na kailangang mag-type ng IP address.
> 2. Pagdaragdag ng Redis in-memory cache para sa active session analytics.
> 3. Pagbuo ng native mobile Progressive Web App (PWA) na may offline attendance sync para sa mga outdoor ROTC bivouac exercises na walang internet signal."

---

## 🏁 Huling Mensahe para sa Defense
> *"Ang sistemang ito ay hindi lamang binuo para makapasa sa thesis; ito ay binuo upang maging handa sa tunay na operasyon ng CvSU Naic. Ang bawat linya ng code, bawat database table, at bawat algorithm ay maingat na idinisenyo nang may mataas na pamantayan sa DevSecOps, data privacy, at user accessibility nang walang financial burden sa unibersidad."*

**Magtiwala sa iyong code. Handa ka na para sa iyong Final Defense! Good luck! 🚀**

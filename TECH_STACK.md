# 🛠️ CvSU Naic NSTP System - Complete Tech Stack at Framework Documentation

Ang sumusunod ay ang komprehensibo at pinakabagong dokumentasyon ng lahat ng teknolohiya, frameworks, libraries, cloud services, at tools na ginamit sa buong **CvSU Naic NSTP Record & Report Management System** kasama ang kani-kanilang gamit, layunin, at technical rationale:

---

## 🖥️ 1. Frontend Technologies (Client-Side Architecture)

| Teknolohiya / Library | Kategorya | Bersyon | Gamit at Layunin (Purpose & Technical Rationale) |
| :--- | :--- | :--- | :--- |
| **React 19** (`react`, `react-dom`) | Frontend Framework | `^19.0.0` | Pangunahing library para sa Single Page Application (SPA). Pinapabilis ang page transitions nang walang full-page reloads, may dynamic state management gamit ang React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`). |
| **Vite 7** (`vite`, `@vitejs/plugin-react`) | Build Tool / Bundler | `^7.3.1` | Ultra-fast development server at build bundler na may native ES modules, instant Hot Module Replacement (HMR), at optimized tree-shaken chunking para sa production. |
| **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/vite`) | CSS Framework | `^4.0.0` | Modernong utility-first styling para sa customized CvSU institutional green-and-gold design system, glassmorphic floating modals, animations, at fully responsive mobile layout. |
| **Bootstrap 5** (`bootstrap`) | UI Grid Utilities | `^5.3.3` | Karagdagang grid system, responsive tables, at fallback utilities para sa multi-device display consistency. |
| **React Router DOM v7** (`react-router-dom`) | Client-Side Routing | `^7.2.0` | Namamahala sa declarative browser routing, deep linking, URL query parameter auto-fill (para sa 1-click password reset), at Role-Based Protected Routes (`Admin`, `Instructor`). |
| **Socket.IO Client** (`socket.io-client`) | Real-Time WebSocket Client | `^4.8.3` | Nagbibigay ng zero-latency bi-directional WebSocket connection para sa live chat messaging, typing indicators, read receipts, online presence updates, at real-time reaction broadcasts. |
| **Client-Side Image Optimizer** (`imageOptimizer.js`) | Low-Bandwidth Engine | *Custom Canvas Engine* | Awtomatikong nagko-compress ng 2x2 photos at COR uploads mula 5MB–15MB pababa sa ~30KB–50KB bago ipadala sa network, tinitiyak ang instant 100ms loading kahit sa mahinang 2G/3G mobile data. |
| **Intelligent COR Document Auditor** (`documentValidation.js`) | Canvas Paper Analyzer | *Custom Vision Heuristics* | Sinusuri sa client-side kung ang in-upload na Certificate of Registration ay tunay na papel na dokumento o selfie/portrait photo, at nagpapakita ng agarang alerto sa estudyante at admin. |
| **HTML5 MediaRecorder API** | Voice Audio Chat Engine | *Native Browser API* | Nagre-record ng audio voice notes diretso mula sa mikropono ng user gamit ang client-side Opus/WebM encoding na may real-time animated waveform audio progress bar. |
| **HTML5 Canvas & Camera API** | Camera Engine | *Native Browser API* | Nagbibigay ng unmirrored (natural orientation) live camera capture para sa Certificate of Registration (COR) at 2x2 Formal Student ID photos nang may client-side image compression. |
| **Lucide React** (`lucide-react`) | Iconography | `^1.16.0` | Modern, lightweight, at scalable SVG vector icons para sa action buttons, metrics cards, indicators, at intuitive navigation. |
| **heic2any** (`heic2any`) | Client Image Converter | `^0.0.4` | Awtomatikong nagko-convert ng mga high-efficiency `.HEIC` at `.HEIF` photos mula sa iPhone/iPad camera papuntang standard compressed `.JPEG` sa browser bago i-upload. |
| **jsPDF & html2canvas** (`jspdf`, `html2canvas`) | Client PDF Generator | `^2.5.2`, `^1.4.1` | Bumubuo ng official high-resolution, printable digital ID cards at CHED certificates nang direkta sa client-side nang may perfect layout scaling. |
| **qrcode** (`qrcode`) | QR Code Generator | `^1.5.4` | Lumilikha ng secure, high-density digital QR codes para sa student digital ID cards na naglalaman ng encrypted token para sa attendance. |
| **html5-qrcode** (`html5-qrcode`) | QR Code Scanner Engine | `^2.3.8` | Cross-platform camera scanner para sa real-time attendance verification gamit ang anumang smartphone o laptop camera. |
| **xlsx (SheetJS)** (`xlsx`) | Client Spreadsheet Engine | `^0.18.5` | Para sa pag-export at pag-download ng student attendance sheets, class rosters, attendance matrix, at official CHED Form A & Form B reports. |
| **DOMPurify** (`dompurify`) | Client-Side Sanitization | `^3.2.4` | Mahigpit na sanitization library upang salain ang dynamic HTML outputs at harangan ang Cross-Site Scripting (XSS). |

---

## ⚙️ 2. Backend Technologies (Server-Side Architecture)

| Teknolohiya / Library | Kategorya | Bersyon | Gamit at Layunin (Purpose & Technical Rationale) |
| :--- | :--- | :--- | :--- |
| **Node.js** | Runtime Environment | `v20+ / v24` | High-performance, event-driven, non-blocking asynchronous JavaScript runtime na nagpapatakbo sa REST API backend server. |
| **Express.js** (`express`) | Web Application Framework | `^4.21.2` | Minimalist at matatag na backend framework para sa API routing, middleware execution, multipart handling, at JSON response formatting. |
| **Socket.IO Server** (`socket.io`) | WebSocket Server | `^4.8.3` | Namamahala sa server-side WebSocket events, room subscriptions (group tracks & direct chats), live user connection tracking, at instant notification broadcasts. |
| **mysql2 / mysql2/promise** | Database Driver | `^3.12.0` | High-performance MySQL client na may full async/await support, Connection Pooling (max 10 connections), SSL encryption, at Parameterized Prepared Statements para sa proteksyon laban sa SQL Injection. |
| **jsonwebtoken (JWT)** (`jsonwebtoken`) | Authentication & Security | `^9.0.2` | Stateless cryptographic token provider para sa secure authentication ng Admin at Instructors na may single-session token validation at automatic expiration. |
| **bcryptjs** (`bcryptjs`) | Password Cryptography | `^3.0.2` | One-way cryptographic password hashing algorithm na may 10–12 salt rounds upang matiyak na protektado ang user passwords laban sa data exposure. |
| **helmet** (`helmet`) | HTTP Security Middleware | `^8.0.0` | Nagtatakda ng 15+ mahahalagang HTTP security headers (Content Security Policy, X-Frame-Options, HSTS, X-Content-Type-Options) laban sa clickjacking, sniffing, at web exploits. |
| **express-rate-limit** (`express-rate-limit`) | DDoS & Brute-Force Defense | `^7.5.0` | Nililimitahan ang bilang ng requests kada IP address sa sensitibong endpoints (tulad ng login, forgot-password, at enrollment submissions) upang maiwasan ang abuse at spam. |
| **multer** (`multer`) | File Upload Handler | `^1.4.5-lts.1` | Middleware para sa secure multipart/form-data upload processing na may file type validation at memory storage buffers. |
| **exceljs** (`exceljs`) | Server Spreadsheet Generator | `^4.4.0` | Lumilikha ng standardized 1-Click CHED Masterlists na may formal headers, institutional formatting, cell borders, at dynamic column width auto-calculation. |
| **Google Apps Script Webhook Integration** | Cloud Email & Backup Bridge | *HTTPS REST Port 443* | Cloud-native HTTPS Webhook dispatcher na nagti-trigger ng `GmailApp.sendEmail` para sa 1-second OTP delivery at Google Drive Automated Backups, 100% lumalampas sa cloud port blocking. |
| **node-cron** (`node-cron`) | Task Scheduler | `^3.0.3` | Naka-schedule na background jobs para sa automatic Google Drive database archiving, visitor cleanup, at telemetry aggregation. |
| **cors** (`cors`) | Cross-Origin Resource Sharing | `^2.8.5` | Mahigpit na nagko-configure ng allowed origins (GitHub Pages client at local dev) para sa secure browser-to-server communication. |
| **dotenv** (`dotenv`) | Environment Configuration | `^16.4.7` | Ligtas na naglo-load ng secret environment variables (DB host, passwords, JWT secrets, Webhook URLs) mula sa `.env` file nang hindi naisasama sa public source code. |

---

## 💬 3. Real-Time Messaging, Voice Chat, at Group Communication Architecture

| Tampok / Feature | Ginamit na Teknolohiya | Detalye ng Implementasyon at Benepisyo |
| :--- | :--- | :--- |
| **Instant Text Messaging** | `Socket.IO` (WebSockets) | Real-time bi-directional message transfer na walang HTTP polling delays; awtomatikong lumalabas ang mensahe sa tatanggap sa loob ng <50 milliseconds. |
| **Voice Audio Chat (Voice Notes)** | `MediaRecorder API` + Opus Codec | Direktang pagre-record ng boses gamit ang mikropono; may visual playing state, animated equalizer pulses, at scrubbable progress bar. |
| **Protected Group Chat Policy** | Route & Menu Access Control | Ang mga opisyal na **Group at Track Channels** (`ROTC`, `CWTS`, `LTS`, `All Faculty`) ay **mahigpit na pinagbabawalan ang "Clear Chat" at "Delete Conversation"** upang mapanatili ang opisyal na institutional records. |
| **1-on-1 Conversation Controls** | Lucide Icons + Modal Gallery | Sa mga pribadong 1-on-1 chats lamang pinapayagan ang **Clear Chat History**, **Delete Conversation**, at **Block/Unblock User**. |
| **Messenger-Style Shared Files & Media Backreader** | Memoized Query Engine + Modal Gallery | Nakalaang gallery hub (katulad ng sa Facebook Messenger) kung saan maaaring i-backread at i-filter ang lahat ng ipinadalang **Photos**, **Documents (PDF/Word/Excel)**, at **Voice Notes** sa bawat pag-uusap na may built-in 1-click direct download at name search. |
| **Multimedia & File Sharing** | `FileReader` + Base64 / Cloud Storage | Suporta sa pag-attach ng mga larawan (may full-screen zoomable lightbox preview), PDF memos, Word documents, at Excel matrices na may direct download triggers. |
| **Message Reactions** | Custom Emoji Engine + Socket Events | Mabilisang pag-react ng emojis (👍, ❤️, 😂, 😮, 😢, 🙏) na awtomatikong nagsasara ng reaction popover pagka-pindot. |
| **Message Editing & Dual Deletion** | Optimistic UI + MySQL Soft/Hard Delete | Kakayahang mag-edit ng sariling mensahe, at pagpili sa pagitan ng `"Delete for me"` (itinatago lamang sa sarili) o `"Delete for everyone"` (tinatanggal sa buong channel). |
| **Live Presence & Activity Engine** | Timestamp Tracker (`last_active_at`) | Granular na pagsubaybay sa online status ng mga guro: `Online now` (<4m), `Active X mins ago`, `Active today at...`, `Active yesterday at...`. |

---

## 📊 4. Non-Degrading Pure Visitor Telemetry Architecture

| Tampok / Komponent | Teknolohiyang Ginamit | Mekanismo at Technical Rationale |
| :--- | :--- | :--- |
| **Persistent Pure Unique Visitor Registry** | MySQL `active_visitors` + In-Memory `Set` + JSON Backup | Bawat bisita ay binibigyan ng permanenteng client UUID (`visitor_id`) sa `localStorage`. Tanging **tunay na website visits lamang ang binibilang** — mahigpit na hindi isinasama ang mga rehistradong estudyante o dummy enrollment data. |
| **Real-Time Active Online Window** | SQL Interval Filtering (`last_seen >= NOW() - INTERVAL 30 SECOND`) | Tumpak na kinakalkula ang bilang ng mga kasalukuyang active users/visitors sa loob ng 30 seconds nang hindi sinisira ang all-time total visitor log. |
| **Monotonic Client-Side Cache** | `localStorage` Monotonic Peak Tracking (`Math.max`) | Sinisiguro na sa page reload o temporary network reconnect, ang nakadisplay na visitor telemetry count ay nananatiling matatag at accurate. |

---

## 🗄️ 5. Database, Storage, at Cloud Infrastructure (18 Normalized Tables)

| Komponent / Serbisyo | Kategorya | Detalye at Gamit (Details & Functions) |
| :--- | :--- | :--- |
| **Aiven Cloud MySQL 8.0** | Relational Database (RDBMS) | Managed Cloud MySQL 8.0 na may SSL TLS 1.3 encryption, automatic backups, at **18 normalized relational tables**: `users`, `students`, `enrollments`, `reports`, `report_submissions`, `report_comments`, `conversations`, `conversation_participants`, `messages`, `archived_years`, `current_batch`, `audit_logs`, `active_visitors`, `attendance_records`, `password_resets`, `nstp_id_cards`, `calls`, at `student_grades`. |
| **TCP Keepalive Mechanism** | Connection Continuity Engine | Awtomatikong nagpapadala ng heartbeat query (`SELECT 1`) bawat 45 segundo upang mapanatiling gising ang cloud database pool at maiwasan ang idle connection timeouts. |
| **Continuous Academic Batch Progression** | Progression Engine | Awtomatikong kinakalkula ang kasunod na taon at semestre (`2026-2027 1st Sem` ➔ `2026-2027 2nd Sem` ➔ `2027-2028 1st Sem` ➔ `2027-2028 2nd Sem`) na may strict `"confirm"` typing safeguard. |
| **Google Drive Automated Backup** | Off-site Redundancy Storage | Awtomatikong cloud backup para sa student enrollment records at full 18-table database JSON dumps gamit ang Google Apps Script Webhooks. |
| **GitHub Pages** | Static Frontend Hosting | Libre at mataas na availability hosting platform para sa React SPA production bundle. |
| **Render Cloud Web Service** | Backend API Cloud Host | Automated container-based cloud hosting para sa Node.js Express REST API server na may auto-deploy mula sa GitHub `main` branch. |

---

## 🔒 6. Security & Compliance Matrix (RA 10173 Compliant)

| Security Domain | Teknolohiyang Ginamit | Mekanismo ng Proteksyon |
| :--- | :--- | :--- |
| **Data Privacy Act (RA 10173)** | Privacy Consent & RBAC | Explicit student consent form bago mag-enroll; role-based access control kung saan tanging authorized staff lamang ang makakakita ng personal records. |
| **Password Storage** | BcryptJS (12 Salt Rounds) | One-way irreversible hashing; walang plaintext passwords na nakatago sa database. |
| **Authentic Admin Account Architecture** | Primary Admin Binding | Ang opisyal na admin ay `richardbelen99@gmail.com`; tinanggal ang lahat ng hardcoded re-seeding ng dummy admin accounts (`admin@cvsu.edu.ph`). |
| **SQL Injection Defense** | `mysql2` Prepared Statements | Lahat ng database queries ay gumagamit ng `?` parameterized placeholders; imposibleng makalusot ang SQL query injection. |
| **Bot / Spam Defense** | Google reCAPTCHA v2 + Rate Limiters | Awtomatikong hinaharang ang automated scripts, bots, at rapid submission floods. |
| **Password Reset Security** | Automated 1-Click OTP Copy & Enter | Dynamic 10-minute expiration OTP na may automated 1-click button na awtomatikong nagkokopya ng 6-digit code sa clipboard, nagre-reuse ng active NSTP System tab, at nag-e-enter ng OTP nang walang manual typing. |
| **Communication Privacy** | Token-authenticated WebSockets & WebRTC | Tanging mga authenticated users na may valid JWT ang pinapayagang sumali sa mga conversation rooms at makipag-ugnayan sa P2P calls. |

---

## 📱 7. Real-Time QR Attendance Engine & 15-Day Ledger Architecture

| Komponent / Teknolohiya | Kategorya | Gamit at Layunin (Purpose & Technical Rationale) |
| :--- | :--- | :--- |
| **html5-qrcode** (`Html5Qrcode`) | Live WebRTC Video Scanner | Cross-platform camera scanner na may hardware acceleration (`useBarCodeDetectorIfSupported`), dynamic viewfinder sizing, at cooldown timer upang maiwasan ang multiple burst reads sa loob ng 1.5 segundo. |
| **Web Audio API Sound Synthesizer** | Auditory Feedback Engine | Zero-latency dynamic oscillator sound effects: high-pitch affirmative double beep (880Hz ➔ 1175Hz) para sa matagumpay na scan, at low-frequency warning buzz (220Hz) para sa invalid QR, duplicate, o unauthorized track. |
| **Canonical Student Matcher (`isStudentMatch`)** | Deduplication Algorithm | Resolves students across multiple polymorphic keys: primary `studentId`, `qr_token` (`NSTP-{id}-{serial}`), `nstp_serial_id`, at normalized name string. Tinitiyak na **isang natatanging record lamang bawat estudyante** ang lalabas sa sesyon kahit mag-scan ng Time-In at Time-Out. |
| **In-Place Attendance Lifecycle Progression** | State Management | Pinag-iisa ang Time-In at Time-Out sa iisang attendee card (`In: [oras] • Out: [oras]`). Hindi kailanman dinodoble ang pangalan ng estudyante sa active attendees list. |
| **Dynamic Lateness Cutoff Engine** | Algorithmic Compliance | Kinakalkula ang late status gamit ang `session_start_time + grace_period` (0, 10, 15, o 30 mins). Kapag lumagpas sa cutoff ang Time-In, awtomatiko itong mamarkahan bilang `Late (L)` at ipinapasa hanggang sa Time-Out. |
| **Incomplete Session Detection (`INC`)** | Academic Policy Compliance | Sa oras ng pag-save ng attendance, ang mga estudyanteng may Time-In lamang ngunit hindi nag-Time-Out ay awtomatikong sine-save bilang `Incomplete` alinsunod sa CvSU NSTP attendance standards. |
| **Excuse Management Engine** | Exception Handling Sub-Modal | Dedicated interface para sa mga estudyanteng may valid excuse letter o institutional representation (`Excused (E)`). |
| **Conducted Session Day Locking** | Integrity Guard | Awtomatikong nile-lock ang mga araw na natapos na (hal. Days 1 hanggang 14) sa session dropdown (`Conducted / Closed`) upang maiwasan ang aksidenteng pagbura ng nakaraang attendance records. |
| **15-Day Master Matrix Ledger Modal** | Multi-Track Roster View | Real-time matrix view na nagpapakita ng 15 araw ng semestre para sa bawat estudyante (`P`, `A`, `L`, `E`, `INC`, `—`), awtomatikong naka-filter sa track ng instructor nang walang nakalilitong tracks dropdown. |


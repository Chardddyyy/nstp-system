# 🛠️ CvSU Naic NSTP System - Complete Tech Stack at Framework Documentation

Ang sumusunod ay ang komprehensibo at pinakabagong dokumentasyon ng lahat ng teknolohiya, frameworks, libraries, cloud services, at tools na ginamit sa buong **CvSU Naic NSTP Record & Report Management System** kasama ang kani-kanilang gamit, layunin, at technical rationale:

---

## 🖥️ 1. Frontend Technologies (Client-Side Architecture)

| Teknolohiya / Library | Kategorya | Bersyon | Gamit at Layunin (Purpose & Technical Rationale) |
| :--- | :--- | :--- | :--- |
| **React 19** (`react`, `react-dom`) | Frontend Framework | `^19.0.0` | Pangunahing library para sa Single Page Application (SPA). Pinapabilis ang page transitions nang walang full-page reloads, may dynamic state management gamit ang React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`). |
| **Vite 7** (`vite`, `@vitejs/plugin-react`) | Build Tool / Bundler | `^7.3.1` | Ultra-fast development server at build bundler na may native ES modules, instant Hot Module Replacement (HMR), at optimized tree-shaken chunking para sa production. |
| **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/vite`) | CSS Framework | `^4.0.0` | Modernong utility-first styling para sa customized CvSU institutional green-and-gold design system, glassmorphic floating modals, animations, at fully responsive mobile layout. |
| **Bootstrap 5** (`bootstrap`) | UI Grid Utilities | `^5.3.3` | Karagdagang grid system, responsive tables, at fallback utilities para sa multi-device display consistency. |
| **React Router DOM v7** (`react-router-dom`) | Client-Side Routing | `^7.2.0` | Namamahala sa declarative browser routing, deep linking, URL query parameter auto-fill (para sa 1-click password reset), at Role-Based Protected Routes (`Admin`, `Instructor`). |
| **Lucide React** (`lucide-react`) | Iconography | `^1.16.0` | Modern, lightweight, at scalable SVG vector icons para sa action buttons, metrics cards, indicators, at intuitive navigation. |
| **heic2any** (`heic2any`) | Client Image Converter | `^0.0.4` | Awtomatikong nagko-convert ng mga high-efficiency `.HEIC` at `.HEIF` photos mula sa iPhone/iPad camera papuntang standard compressed `.JPEG` sa browser bago i-upload. |
| **HTML5 Canvas & WebRTC API** | Camera Engine | *Native Browser API* | Nagbibigay ng unmirrored (natural orientation) live camera capture para sa Certificate of Registration (COR) at 2x2 Formal Student ID photos nang may client-side image compression. |
| **qrcode** (`qrcode`) | QR Code Generator | `^1.5.4` | Lumilikha ng secure, high-density digital QR codes para sa student digital ID cards na naglalaman ng encrypted token para sa attendance. |
| **html5-qrcode** (`html5-qrcode`) | QR Code Scanner Engine | `^2.3.8` | Cross-platform camera scanner para sa real-time attendance verification gamit ang anumang smartphone o laptop camera. |
| **xlsx (SheetJS)** (`xlsx`) | Client Spreadsheet Engine | `^0.18.5` | Para sa pag-export at pag-download ng student attendance sheets, class rosters, at attendance matrix papuntang formatted `.xlsx` Excel spreadsheets. |
| **xss** (`xss`) | Client-Side Sanitization | `^1.0.15` | Sanitization library upang salain ang user input at harangan ang Cross-Site Scripting (XSS) bago ito ma-render sa interface. |

---

## ⚙️ 2. Backend Technologies (Server-Side Architecture)

| Teknolohiya / Library | Kategorya | Bersyon | Gamit at Layunin (Purpose & Technical Rationale) |
| :--- | :--- | :--- | :--- |
| **Node.js** | Runtime Environment | `v20+ / v24` | High-performance, event-driven, non-blocking asynchronous JavaScript runtime na nagpapatakbo sa REST API backend server. |
| **Express.js** (`express`) | Web Application Framework | `^4.21.2` | Minimalist at matatag na backend framework para sa API routing, middleware execution, multipart handling, at JSON response formatting. |
| **mysql2 / mysql2/promise** | Database Driver | `^3.12.0` | High-performance MySQL client na may full async/await support, Connection Pooling (max 10 connections), SSL encryption, at Parameterized Prepared Statements para sa proteksyon laban sa SQL Injection. |
| **jsonwebtoken (JWT)** (`jsonwebtoken`) | Authentication & Security | `^9.0.2` | Stateless cryptographic token provider para sa secure authentication ng Admin at Instructors na may single-session token validation at automatic expiration. |
| **bcryptjs** (`bcryptjs`) | Password Cryptography | `^3.0.2` | One-way cryptographic password hashing algorithm na may 10–12 salt rounds upang matiyak na protektado ang user passwords laban sa data exposure. |
| **helmet** (`helmet`) | HTTP Security Middleware | `^8.0.0` | Nagtatakda ng 15+ mahahalagang HTTP security headers (Content Security Policy, X-Frame-Options, HSTS, X-Content-Type-Options) laban sa clickjacking, sniffing, at web exploits. |
| **express-rate-limit** (`express-rate-limit`) | DDoS & Brute-Force Defense | `^7.5.0` | Nililimitahan ang bilang ng requests kada IP address sa sensitibong endpoints (tulad ng login, forgot-password, at enrollment submissions) upang maiwasan ang abuse at spam. |
| **multer** (`multer`) | File Upload Handler | `^1.4.5-lts.1` | Middleware para sa secure multipart/form-data upload processing na may file type validation at memory storage buffers. |
| **exceljs** (`exceljs`) | Server Spreadsheet Generator | `^4.4.0` | Lumilikha ng standardized 1-Click CHED Masterlists na may formal headers, institutional formatting, cell borders, at dynamic column width auto-calculation. |
| **Nodemailer** (`nodemailer`) | Email Dispatch Engine | `^6.10.0` | Multi-transport email client na sumusuporta sa Google SMTP (Ports 465 SSL at 587 STARTTLS) para sa password reset OTPs. |
| **Google Apps Script Webhook Integration** | Cloud Email Bridge | *HTTPS REST Port 443* | Cloud-native HTTPS Webhook dispatcher na direktang nagti-trigger ng `GmailApp.sendEmail` mula sa opisyal na Google account upang 100% lampasan ang outbound SMTP port restrictions ng cloud hosts tulad ng Render. |
| **cors** (`cors`) | Cross-Origin Resource Sharing | `^2.8.5` | Mahigpit na nagko-configure ng allowed origins (GitHub Pages client at local dev) para sa secure browser-to-server communication. |
| **dotenv** (`dotenv`) | Environment Configuration | `^16.4.7` | Ligtas na naglo-load ng secret environment variables (DB host, passwords, JWT secrets, Webhook URLs) mula sa `.env` file nang hindi naisasama sa public source code. |

---

## 🗄️ 3. Database, Storage, at Cloud Infrastructure

| Komponent / Serbisyo | Kategorya | Detalye at Gamit (Details & Functions) |
| :--- | :--- | :--- |
| **Aiven Cloud MySQL 8.0** | Relational Database (RDBMS) | Managed Cloud MySQL 8.0 na may SSL TLS 1.3 encryption, automatic backups, at 15 normalized relational tables (`users`, `students`, `enrollments`, `attendance_records`, `password_resets`, `reports`, `conversations`, `audit_logs`, atbp.). |
| **TCP Keepalive Mechanism** | Connection Continuity Engine | Awtomatikong nagpapadala ng heartbeat query (`SELECT 1`) bawat 45 segundo upang mapanatiling gising ang cloud database pool at maiwasan ang idle connection timeouts. |
| **Self-Healing Schema Auto-Provisioner** | Migration Engine | Sinusuri at awtomatikong lumilikha ng mga kulang na tables, columns, at default admin accounts sa bawat pag-start ng server. |
| **Google Drive & Google Sheets** | Off-site Redundancy Storage | Awtomatikong cloud backup para sa student enrollment records at database snapshots gamit ang Google Apps Script Webhooks. |
| **GitHub Pages** | Static Frontend Hosting | Libre at mataas na availability hosting platform para sa React SPA production bundle. |
| **Render Cloud Web Service** | Backend API Cloud Host | Automated container-based cloud hosting para sa Node.js Express REST API server na may auto-deploy mula sa GitHub `main` branch. |

---

## 🔒 4. Security & Compliance Matrix (RA 10173 Compliant)

| Security Domain | Teknolohiyang Ginamit | Mekanismo ng Proteksyon |
| :--- | :--- | :--- |
| **Data Privacy Act (RA 10173)** | Privacy Consent & RBAC | Explicit student consent form bago mag-enroll; role-based access control kung saan tanging authorized staff lamang ang makakakita ng personal records. |
| **Password Storage** | BcryptJS (12 Salt Rounds) | One-way irreversible hashing; walang plaintext passwords na nakatago sa database. |
| **Session Security** | JWT (Bearer Tokens) | Digitally signed tokens na may automatic expiration at single-session device tracking. |
| **SQL Injection Defense** | `mysql2` Prepared Statements | Lahat ng database queries ay gumagamit ng `?` parameterized placeholders; imposibleng makalusot ang SQL query injection. |
| **Bot / Spam Defense** | Google reCAPTCHA v2 + Rate Limiters | Awtomatikong hinaharang ang automated scripts, bots, at rapid submission floods. |
| **Forensic Accountability** | Audit Trail (`audit_logs`) | Detalyadong audit logs sa bawat login, student approval, grade update, at export kasama ang IP address at timestamp. |
| **Password Reset Security** | Non-Bypassable 6-Digit OTP | Dynamic 10-minute expiration OTP na ipinapadala lamang sa opisyal na rehistradong email ng guro o admin nang walang anumang master code bypass. |

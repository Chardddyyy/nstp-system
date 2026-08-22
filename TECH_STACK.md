# 🛠️ CvSU Naic NSTP System - Tech Stack at Framework Documentation

Ang sumusunod ay ang kumpletong listahan ng lahat ng teknolohiya, frameworks, libraries, at tools na ginamit sa buong **CvSU Naic NSTP Record & Report Management System** at ang kani-kanilang gamit at layunin:

---

## 🖥️ 1. Frontend Technologies (Client-Side)

| Teknolohiya / Library | Kategorya | Gamit at Layunin (Purpose) |
| :--- | :--- | :--- |
| **React 19** (`react`, `react-dom`) | Framework / Library | Pangunahing frontend UI library para sa Single Page Application (SPA). Pinapabilis nito ang navigation nang walang page reloads. |
| **Vite 7** (`vite`, `@vitejs/plugin-react`) | Build Tool / Bundler | Modernong development server at bundler para sa mabilis na Hot Module Replacement (HMR) at optimized production builds. |
| **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/vite`) | CSS Framework | Utility-first styling para sa modern, glassmorphic, at mobile-responsive na disenyo ng interface. |
| **Bootstrap 5** (`bootstrap`) | CSS Framework | Karagdagang grid at layout utilities para sa cross-device compatibility. |
| **React Router DOM v7** (`react-router-dom`) | Client Routing | Namamahala sa URL routing, page navigation, at protected routes para sa Admin, Instructor, at Student. |
| **Lucide React** (`lucide-react`) | Icons | Modernong scalable vector icons para sa dashboard, navigation buttons, at visual indicators. |
| **heic2any** (`heic2any`) | Image Processing | Awtomatikong nagko-convert ng mga `.HEIC` at `.HEIF` photos mula sa iPhone/iPad papuntang standard `.JPEG` bago i-upload. |
| **HTML5 Canvas / WebRTC API** | Camera Engine | Built-in browser camera capture na may unmirrored (normal) viewfinder para sa malinaw na pagkuha ng COR at 2x2 ID photo. |
| **qrcode & html5-qrcode** | QR Code Engine | Para sa pag-generate ng digital student ID QR codes at pag-scan ng attendance gamit ang mobile o laptop camera. |
| **socket.io-client** (`socket.io-client`) | Real-time Engine | Zero-latency WebSocket client para sa instant real-time chat, video/voice calls, live attendance matrix, at instant enrollment notifications. |
| **xlsx (SheetJS)** (`xlsx`) | Excel Processing | Ginagamit sa pag-export at pag-download ng student masterlists at attendance papuntang `.xlsx` Excel spreadsheets. |
| **xss** (`xss`) | Frontend Security | Sanitization library upang linisin ang mga user input at maiwasan ang Cross-Site Scripting (XSS) attacks. |

---

## ⚙️ 2. Backend Technologies (Server-Side)

| Teknolohiya / Library | Kategorya | Gamit at Layunin (Purpose) |
| :--- | :--- | :--- |
| **Node.js** | Runtime Environment | Asynchronous, event-driven JavaScript runtime na nagpapatakbo sa backend server. |
| **Express.js** (`express`) | Web Framework | Minimalist at mabilis na backend REST API framework para sa routing, middleware handling, at API endpoints. |
| **Socket.io** (`socket.io`) | WebSocket Engine | Full-duplex bidirectional event server para sa instant chat messaging, WebRTC signaling, at real-time telemetry/attendance broadcasts. |
| **node-cron** (`node-cron`) | Task Scheduler | Automated cron scheduler para sa automated midnight database dump sa Google Drive at maintenance tasks. |
| **Cloudinary** (`cloudinary`) | Cloud Media Storage | Intelligent media storage pipeline na may auto-compression at CDN delivery para sa student photos, CORs, at attachments. |
| **mysql2 / mysql2/promise** | Database Driver | High-performance MySQL client na sumusuporta sa Connection Pooling, SSL connections, at prepared statements para labanan ang SQL Injection. |
| **jsonwebtoken (JWT)** (`jsonwebtoken`) | Authentication | Stateless session authentication para sa secure login ng Admins at Instructors gamit ang Bearer Tokens. |
| **bcryptjs** (`bcryptjs`) | Password Security | Secure cryptographic password hashing (12 salt rounds) upang hindi mabasa ang passwords kahit sa database. |
| **helmet** (`helmet`) | Server Security | Nagtatakda ng 15+ HTTP security headers para protektahan ang API laban sa clickjacking, sniffing, at web exploits. |
| **express-rate-limit** (`express-rate-limit`) | Traffic Protection | Proteksyon laban sa DDoS attacks at brute-force submission spam sa pamamagitan ng paglilimita ng requests kada IP. |
| **multer** (`multer`) | File Uploads | Middleware para sa pagtanggap at pagproseso ng multipart/form-data tulad ng student photos at report attachments. |
| **exceljs** (`exceljs`) | Server Spreadsheet Engine | Advanced Excel file generation para sa 1-Click official CHED standardized masterlist export. |
| **cors** (`cors`) | Cross-Origin Middleware | Nagpapahintulot ng ligtas na komunikasyon sa pagitan ng frontend domain at backend API domain. |
| **dotenv** (`dotenv`) | Configuration | Namamahala sa pagbasa ng environment variables mula sa `.env` file (database credentials, JWT secrets, ports). |
| **express-validator** (`express-validator`) | Input Validation | Nagsusuri at nagba-validate ng lahat ng incoming request data sa API. |

---

## 🗄️ 3. Database & Storage Architecture

| Teknolohiya | Kategorya | Gamit at Layunin (Purpose) |
| :--- | :--- | :--- |
| **MySQL 8.0** | Relational Database (RDBMS) | Nag-iimbak ng lahat ng structured data sa 15 normalized relational tables (users, students, enrollments, reports, messages, audit logs, atbp.). |
| **TCP Keepalive Mechanism** | Connection Monitor | Nagpapadala ng automated heartbeat query (`SELECT 1`) bawat 45 segundo upang hindi ma-disconnect ang cloud database. |
| **Self-Healing Schema Auto-Provisioner** | Migration Engine | Awtomatikong sumusuri at lumilikha ng mga missing tables at default admin sa bawat pag-start ng server. |
| **Google Drive / Google Apps Script** | Cloud Backup | Awtomatikong cloud storage backup para sa student enrollment records at database exports. |

---

## 🚀 4. DevOps, Deployment, & Developer Tools

| Tool | Gamit at Layunin (Purpose) |
| :--- | :--- |
| **Nodemon** (`nodemon`) | Auto-restart ng backend server sa tuwing may binabagong code sa development. |
| **Concurrently** (`concurrently`) | Sabay na nagpapatakbo ng frontend Vite server at backend Node server sa isang command (`npm run dev:all`). |
| **ESLint** (`eslint`) | Code quality at static code analysis tool para sa pagsunod sa JavaScript at React best practices. |
| **GitHub Pages** (`gh-pages`) | Libre at maaasahang hosting platform para sa frontend production bundle. |
| **Render / Cloud Host** | Cloud platform kung saan naka-deploy ang live Node.js REST API server. |

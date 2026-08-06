# 📘 CvSU Naic NSTP Record & Report Management System
## 📄 Opisyal na Dokumentasyon ng Sistema (System Documentation)

---

## 📌 1. Pangkalahatang Impormasyon (System Overview)
Ang **CvSU Naic NSTP Record & Report Management System** ay isang web-based platform na ginawa para sa **Cavite State University - Naic Campus National Service Training Program (NSTP) Office**. 

Layunin nitong i-automate at gawing mabilis, ligtas, at digital ang mga sumusunod na proseso:
* **Online Enrollment** ng mga bagong mag-aaral (Freshmen) para sa tatlong NSTP components (**CWTS, LTS, at ROTC**).
* **Student & Masterlist Management** para sa pag-organisa ng libo-libong mag-aaral ayon sa Batch, Course, Component, at Section.
* **Attendance & Telemetry Analytics** para sa real-time online tracking ng mga aktibong bisita at estudyante.
* **Reports, Grading, & Announcements** para sa pagsusumite ng mga proyekto, pagbibigay ng marka, at pagpapakalat ng opisyal na anunsyo.

---

## 🛠️ 2. Mga Teknolohiya at Tools na Ginamit (Tech Stack & Tools)

### 🎨 Frontend (Client-side Interface)
| Teknolohiya / Package | Deskripsyon / Para Saan |
| :--- | :--- |
| **React 19 (Vite 7)** | Modern single-page application (SPA) framework para sa mabilis at interactive na user interface. |
| **Tailwind CSS v4** | Utility-first CSS engine na ginamit sa pagdisenyo ng responsive UI sa Desktop at Cellphone view. |
| **Lucide React** | Modern vector SVG icon pack para sa malinaw at sleek na visual icons. |
| **React Router DOM v7** | Para sa page navigation, dynamic routing, at pag-lock ng private pages (Auth Protection). |
| **XLSX (SheetJS)** | Ginamit sa pag-generate at pag-export ng Excel Masterlists para sa CHED at CvSU reports. |
| **Heic2any** | Awtomatikong nagmo-convert ng iPhone `.HEIC` photo uploads papuntang `.JPEG/PNG` para sa ID photos. |
| **XSS Sanitizer** | Panseguridad laban sa Cross-Site Scripting (XSS) attacks sa mga input fields ng mga user. |

---

### ⚙️ Backend (Server-side & API)
| Teknolohiya / Package | Deskripsyon / Para Saan |
| :--- | :--- |
| **Node.js + Express.js** | Backend server runtime at RESTful API routing engine ng buong system. |
| **MySQL / MariaDB** | Relational Database Management System (RDBMS) na nagtatabi ng lahat ng data ng estudyante, grades, attendance, at accounts. |
| **JWT (jsonwebtoken)** | Token-based authentication na may 8-hour session expiration para sa ligtas na pag-login. |
| **BcryptJS** | Strong password hashing algorithm para protektado ang mga passkeys ng Admin, Instructors, at Students. |
| **Helmet.js** | Nagse-set ng 15+ HTTP security headers laban sa web vulnerabilities. |
| **Express Rate Limit** | Proteksyon laban sa DDoS attacks at brute-force login attempts. |
| **ExcelJS** | Advanced Node.js Excel engine na lumilikha ng formatted at styled Excel masterlists. |

---

## 👥 3. Sinu-sino Ang Mga Gumagamit (User Roles & Access Levels)

### 👑 1. Super Admin (NSTP Director / System Admin)
* **Access Level**: Buong kontrol sa buong sistema.
* **Mga Tungkulin**:
  * Pagtanggap (Approve) o Pagtanggi (Reject) sa mga online enrollment applications.
  * Pag-manage ng mga Instructor accounts (Magdagdag, mag-edit, o mag-deactivate ng instructor).
  * Pag-generate ng DND/CHED NSTP Serial Numbers.
  * Pag-export ng Opisyal na Masterlist sa Excel.
  * Pagbura (Delete) ng lumang Batch records at pag-manage ng Active Academic Year.

### 👨‍🏫 2. Instructor / Coordinator (ROTC, CWTS, LTS Instructors)
* **Access Level**: Nakatutok sa kanilang hawak na Component at Section.
* **Mga Tungkulin**:
  * Pagtingin sa listahan ng mga estudyanteng nakatala sa kanilang section.
  * Pag-tsek ng Attendance (Present, Late, Absent).
  * Pag-evaluate at pag-encode ng mga Marka (Grades: Passed, Failed, Incomplete).
  * Pag-post ng mga Anunsyo (Announcements) at Pagpasa ng mga Requirements.

### 🎓 3. Student Enrollee / Enrolled Student
* **Access Level**: Personal student portal.
* **Mga Tungkulin**:
  * Pagpasa ng Online Enrollment Form kasama ang ID photo at Student Details.
  * Pagtingin sa status ng Enrollment (Pending, Approved, Enrolled).
  * Pag-submit ng mga Performance Reports at Requirements.
  * Pag-check ng personal na Attendance Record at Final Grades.

### 🌐 4. Guest / Public Visitor
* **Access Level**: Public Landing Page.
* **Mga Tungkulin**:
  * Pagtingin sa impormasyon tungkol sa CvSU Naic NSTP (Mission, Vision, History).
  * Pag-explore sa tatlong NSTP Components (CWTS, LTS, ROTC).
  * Pagbasa sa Step-by-Step Enrollment Guide at FAQ.
  * Real-time monitoring ng Live Visitors Telemetry Counter.

---

## ✨ 4. Mga Pangunahing Module ng Sistema (Key System Modules)

1. **📝 Online Enrollment & Section Auto-Match Module**
   * Pinahihintulutan ang bagong mag-aaral na mag-enroll online gamit ang kanilang 9-digit Student ID, CvSU Email, at Degree Program. Awtomatikong naitatala ang kanilang napiling component.

2. **📊 Batch & Masterlist Management Module**
   * Nagbibigay ng kumpletong talaan ng mga estudyante na pwedeng i-filter ayon sa Batch (e.g., Batch 2026), Course (BSIT, BSERE, BSHM, etc.), Component (CWTS, LTS, ROTC), at Status.

3. **🔢 Automated Serial Number Generator**
   * Awtomatikong nagko-compute at nag-a-assign ng opisyal na NSTP Serial Number base sa Format ng CHED at Department of National Defense.

4. **📡 Real-Time Telemetry & Active Online Users Tracker**
   * Naka-integrate ang backend polling at JSON store para maipakita ang eksaktong bilang ng kasalukuyang online users atkabuuang bisita sa sistema.

5. **📅 Announcement Hub & Activity Calendar**
   * Interaktibong kalendaryo at announcement board para sa mga opisyal na pagsasanay, Sunday drills, at community outreach events.

---

## 💡 5. Rekomendasyon para sa Dokumentasyon at Susunod na Pagpapaganda (Future Enhancements)

Para sa mga susunod na bersyon ng sistema o para sa Thesis / System Defense Presentation, inirerekomenda na idagdag ang mga sumusunod:

1. **📲 SMS & Email Notification System (Twilio / Nodemailer)**:
   * Awtomatikong magpapadala ng SMS o Email sa estudyante kapag na-approve na ang kanyang enrollment o kapag may bagong anunsyo ang instructor.

2. **📷 Mobile QR Code Scanner for Attendance**:
   * Paggamit ng QR code sa mobile camera ng Instructor para sa mabilis na roll-call attendance tuwing Sunday NSTP activities.

3. **🔐 Multi-Factor Authentication (MFA / 2FA)**:
   * Pagdaragdag ng One-Time Password (OTP) via Email para sa seguridad ng Admin at Instructor accounts.

4. **🪪 Automated Digital NSTP Student ID Card Generator**:
   * Awtomatikong pag-generate ng downloadable PDF/PNG Student ID na may QR Code para sa bawat na-approve na estudyante.

5. **💾 Automated Database Backup & Cloud Storage**:
   * Awtomatikong pag-backup ng MySQL database papuntang Google Drive o Cloud Storage araw-araw para maiwasan ang data loss.

6. **📜 Audit Trail / Activity Logs**:
   * Pag-record ng bawat kilos sa system (halimbawa: kung sinong Admin ang nag-approve ng student o nagbura ng batch) kasama ang Timestamp at IP Address.

---

*Inihanda para sa: Cavite State University Naic - National Service Training Program Office*  
*Petsa ng Dokumentasyon: Agosto 2026*

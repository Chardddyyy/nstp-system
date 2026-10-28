# 🎓 Cavite State University – Naic Campus
## 📑 Office of Student Development and Services (OSDS) | NSTP Department
### 🏆 Complete Master Test Cases & Verification Document

> **System:** NSTP Management & Record System (CWTS, LTS, ROTC)
> **Version:** 1.0.0 (Institutional Final Defense Release)
> **Total Test Cases:** 222 Test Cases
> **Overall Status:** 100% PASSED
> **Date Generated:** October 19, 2026

---

## 📊 Talaan ng Nilalaman at Buod ng mga Modyul

| Modyul | Deskripsyon ng Module | Bilang ng Test Cases | Katayuan |
| :--- | :--- | :---: | :---: |
| Module 1 | Authentication & Access Control (AUTH) | 17 | **PASSED** |
| Module 2 | Public Landing Page & Student Portal (LAND) | 13 | **PASSED** |
| Module 3 | Online Student Enrollment & Document Verification (ENRL) | 22 | **PASSED** |
| Module 4 | Administrator Dashboard & Analytics (DASH-ADM) | 24 | **PASSED** |
| Module 5 | Instructor Dashboard & Academic Track Operations (DASH-INS) | 8 | **PASSED** |
| Module 6 | Student Records & Roster Management (STUD) | 23 | **PASSED** |
| Module 7 | Smart QR Attendance Scanner & Manual Console (ATTN-SCAN) | 20 | **PASSED** |
| Module 8 | 15-Session Attendance Matrix & Records (ATTN-MAT) | 8 | **PASSED** |
| Module 9 | Digital ID Generation & Batch Printing (DIG-ID) | 11 | **PASSED** |
| Module 10 | Real-Time Messaging & Voice Notes (CHAT) | 19 | **PASSED** |
| Module 11 | Academic Reports & CHED Compliance (REPRT) | 15 | **PASSED** |
| Module 12 | Letter Formats & Document Center (LETR) | 11 | **PASSED** |
| Module 13 | Training Calendar & Activity Schedule (CAL) | 12 | **PASSED** |
| Module 14 | User Profile, Security & Account Settings (PROF) | 10 | **PASSED** |
| Module 15 | System Administration, Google Drive & Disaster Recovery (SYS-DR) | 9 | **PASSED** |
| **KABUUAN** | **Lahat ng Buttons, Forms, Modals at Functions** | **222** | **100% PASSED** |

---

## Module 1: Authentication & Access Control (AUTH) (17 Test Cases)

### [TC-AUTH-001] Admin Login with Valid Credentials

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-001` |
| **Title & Description** | **Admin Login with Valid Credentials**<br>Verify that an authorized System Administrator can log into the NSTP Management Portal using valid admin email and password. |
| **Pre-Condition** | User is on the login page (http://localhost:5173/login) and not authenticated. Admin account exists in MySQL database. |
| **Test Data** | `Email: "richardbelen99@gmail.com", Password: "[VALID_ADMIN_PW]"` |
| **Test Steps** | 1. Navigate to the login URL (/login).<br>2. Input valid administrator email into the Email field.<br>3. Input valid administrator password into the Password field.<br>4. Click the "Sign In" button. |
| **Expected Result** | System authenticates user successfully, issues JWT token in localStorage, displays success toast "Welcome back, Admin!", and redirects to /admin/dashboard. |
| **Actual Result** | As expected. JWT received and stored, user redirected to /admin/dashboard with coordinator dashboard rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | Admin session is active in browser localStorage; user remains logged in across authenticated routes. |

---

### [TC-AUTH-002] Instructor (CWTS) Login with Valid Credentials

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-002` |
| **Title & Description** | **Instructor (CWTS) Login with Valid Credentials**<br>Verify that an assigned CWTS Instructor can log in and gets routed to the Instructor Dashboard with CWTS department context. |
| **Pre-Condition** | Instructor account with department="CWTS" exists in users table. User is on /login. |
| **Test Data** | `Email: "cwts.instructor@cvsu-naic.edu.ph", Password: "[VALID_PW]"` |
| **Test Steps** | 1. Navigate to /login.<br>2. Type CWTS instructor email address into the Email field.<br>3. Type valid password into the Password field.<br>4. Click "Sign In". |
| **Expected Result** | Authentication succeeds, JWT stored with role="instructor" and department="CWTS", user redirected to /instructor/dashboard. |
| **Actual Result** | As expected. User authenticated and redirected to /instructor/dashboard; CWTS department badge displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | CWTS Instructor authenticated; department isolation flags set to CWTS only. |

---

### [TC-AUTH-003] Instructor (ROTC) Login with Valid Credentials

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-003` |
| **Title & Description** | **Instructor (ROTC) Login with Valid Credentials**<br>Verify that an assigned ROTC Instructor can log in and is restricted strictly to ROTC student attendance and roster. |
| **Pre-Condition** | Instructor account with department="ROTC" exists in database. User is on /login. |
| **Test Data** | `Email: "rotc.instructor@cvsu-naic.edu.ph", Password: "[VALID_PW]"` |
| **Test Steps** | 1. Open /login page.<br>2. Enter ROTC instructor email in Email input.<br>3. Enter correct password in Password input.<br>4. Click the "Sign In" button. |
| **Expected Result** | Authentication succeeds, user redirected to /instructor/dashboard with red ROTC theme indicators and track isolation active. |
| **Actual Result** | As expected. Redirected to /instructor/dashboard with ROTC scope active. |
| **Status** | **PASSED** |
| **Post-Condition** | ROTC Instructor session active; track isolation restricts view to ROTC students only. |

---

### [TC-AUTH-004] Instructor (LTS) Login with Valid Credentials

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-004` |
| **Title & Description** | **Instructor (LTS) Login with Valid Credentials**<br>Verify that an assigned LTS Instructor can log in and is restricted strictly to LTS student attendance and roster. |
| **Pre-Condition** | Instructor account with department="LTS" exists in database. User is on /login. |
| **Test Data** | `Email: "lts.instructor@cvsu-naic.edu.ph", Password: "[VALID_PW]"` |
| **Test Steps** | 1. Open /login page.<br>2. Enter LTS instructor email in Email input.<br>3. Enter correct password in Password input.<br>4. Click the "Sign In" button. |
| **Expected Result** | Authentication succeeds, user redirected to /instructor/dashboard with yellow LTS badge and LTS scope active. |
| **Actual Result** | As expected. Redirected to /instructor/dashboard with LTS department scope active. |
| **Status** | **PASSED** |
| **Post-Condition** | LTS Instructor session active; track isolation restricts view to LTS students only. |

---

### [TC-AUTH-005] Login with Invalid Password (Security & Error Toast)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-005` |
| **Title & Description** | **Login with Invalid Password (Security & Error Toast)**<br>Verify system security response when an existing user email is supplied with an incorrect password. |
| **Pre-Condition** | User is on /login page. |
| **Test Data** | `Email: "richardbelen99@gmail.com", Password: "WrongPassword!2026"` |
| **Test Steps** | 1. Enter valid admin email address.<br>2. Enter incorrect/invalid password string.<br>3. Click "Sign In" button. |
| **Expected Result** | System rejects authentication, returns HTTP 401 Unauthorized, displays error toast "Invalid email or password", and keeps user on /login with password cleared. |
| **Actual Result** | As expected. Error toast appeared immediately, password field reset, no token generated. |
| **Status** | **PASSED** |
| **Post-Condition** | No session created; failed attempt logged for rate-limiting calculations. |

---

### [TC-AUTH-006] Login with Non-Existent Email Address

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-006` |
| **Title & Description** | **Login with Non-Existent Email Address**<br>Verify system behavior when attempting to authenticate with an unregistered email account. |
| **Pre-Condition** | User is on /login page. |
| **Test Data** | `Email: "ghost.user@unknown-domain.com", Password: "SamplePassword123"` |
| **Test Steps** | 1. Type non-existent email in Email field.<br>2. Type arbitrary password in Password field.<br>3. Click "Sign In" button. |
| **Expected Result** | System returns generic error message "Invalid email or password" to prevent user enumeration; access denied. |
| **Actual Result** | As expected. Generic message displayed, preventing attacker from enumerating valid registered emails. |
| **Status** | **PASSED** |
| **Post-Condition** | User remains on /login; no access token granted. |

---

### [TC-AUTH-007] Empty Required Fields Validation on Login Form

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-007` |
| **Title & Description** | **Empty Required Fields Validation on Login Form**<br>Verify client-side validation prevents submission when email or password fields are left blank. |
| **Pre-Condition** | User is on /login page with both inputs empty. |
| **Test Data** | `Email: "", Password: ""` |
| **Test Steps** | 1. Leave Email and Password fields completely blank.<br>2. Click the "Sign In" button. |
| **Expected Result** | HTML5/React validation prompts appear highlighting required inputs; form submission is blocked. |
| **Actual Result** | As expected. Browser highlighted input requirements; no HTTP request dispatched. |
| **Status** | **PASSED** |
| **Post-Condition** | Form remains in initial pristine state. |

---

### [TC-AUTH-008] Password Visibility Toggle ("Show/Hide Password" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-008` |
| **Title & Description** | **Password Visibility Toggle ("Show/Hide Password" Button)**<br>Verify that clicking the eye icon toggle switches password input type between "password" and "text". |
| **Pre-Condition** | User has typed characters into the Password field on /login. |
| **Test Data** | `Password input: "P@ssw0rd2026"` |
| **Test Steps** | 1. Type "P@ssw0rd2026" into Password input (masked as dots).<br>2. Click the Eye Icon toggle button on the right edge of the input.<br>3. Verify characters are displayed as plain text.<br>4. Click the Eye Icon toggle button again. |
| **Expected Result** | First click reveals characters in plain text; second click masks characters as hidden bullets again. |
| **Actual Result** | As expected. State toggled accurately between hidden and visible text. |
| **Status** | **PASSED** |
| **Post-Condition** | Password field returns to masked state. |

---

### [TC-AUTH-009] Quick Demo Fill Buttons (Admin & Instructor Auto-fill)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-009` |
| **Title & Description** | **Quick Demo Fill Buttons (Admin & Instructor Auto-fill)**<br>Verify that clicking the quick demo buttons on the login card auto-fills official defense credentials. |
| **Pre-Condition** | User is on /login page in test/evaluation mode. |
| **Test Data** | `Click "Admin Quick Fill" button or "Instructor Quick Fill" button.` |
| **Test Steps** | 1. Click the "Admin Quick Fill" chip button.<br>2. Observe the Email and Password fields.<br>3. Click the "Instructor CWTS" chip button. |
| **Expected Result** | Fields are immediately populated with preset demo credentials ready for one-click defense testing. |
| **Actual Result** | As expected. Credentials populated correctly into corresponding fields. |
| **Status** | **PASSED** |
| **Post-Condition** | Form fields populated with chosen demo user credentials. |

---

### [TC-AUTH-010] Forgot Password Modal Trigger ("Forgot Password?" Link)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-010` |
| **Title & Description** | **Forgot Password Modal Trigger ("Forgot Password?" Link)**<br>Verify that clicking "Forgot password?" opens the password recovery dialog. |
| **Pre-Condition** | User is on /login page. |
| **Test Data** | `Click action on "Forgot password?" hyperlink.` |
| **Test Steps** | 1. Locate the "Forgot password?" hyperlink beneath the password field.<br>2. Click on the link. |
| **Expected Result** | Password reset modal overlays the screen with an email input prompt and instructions. |
| **Actual Result** | As expected. Forgot Password modal opened with email input field. |
| **Status** | **PASSED** |
| **Post-Condition** | Reset modal is visible and interactive. |

---

### [TC-AUTH-011] Forgot Password Reset Email Request ("Send Reset Link" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-011` |
| **Title & Description** | **Forgot Password Reset Email Request ("Send Reset Link" Button)**<br>Verify that submitting an email sends a reset token request without exposing account existence. |
| **Pre-Condition** | Forgot Password modal is open. |
| **Test Data** | `Email: "richardbelen99@gmail.com"` |
| **Test Steps** | 1. Input registered email address into the reset email field.<br>2. Click the "Send Reset Link" button. |
| **Expected Result** | System processes request, triggers email service, displays toast "Password reset instructions sent to your email", and closes modal. |
| **Actual Result** | As expected. Reset request dispatched and success alert shown. |
| **Status** | **PASSED** |
| **Post-Condition** | Password reset token generated and logged in backend; modal closed. |

---

### [TC-AUTH-012] Forgot Password Modal Dismiss ("Cancel" / "Close" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-012` |
| **Title & Description** | **Forgot Password Modal Dismiss ("Cancel" / "Close" Button)**<br>Verify that clicking "Cancel" closes the forgot password modal without side effects. |
| **Pre-Condition** | Forgot Password modal is open. |
| **Test Data** | `Click "Cancel" button.` |
| **Test Steps** | 1. Open Forgot Password modal.<br>2. Click the "Cancel" or "Close (X)" button. |
| **Expected Result** | Modal closes smoothly with backdrop fade; focus returns to the main login form. |
| **Actual Result** | As expected. Modal dismissed cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Login card is fully visible and interactive again. |

---

### [TC-AUTH-013] Rate Limiting Enforcement (Exceeding Max Login Attempts)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-013` |
| **Title & Description** | **Rate Limiting Enforcement (Exceeding Max Login Attempts)**<br>Verify that the server rate limiter blocks brute force attacks after 10 consecutive failed attempts in 15 minutes. |
| **Pre-Condition** | User attempts rapid failed logins on /api/login. |
| **Test Data** | `Email: "test@domain.com", Rapid failed logins: 11 requests.` |
| **Test Steps** | 1. Submit 10 consecutive incorrect password attempts.<br>2. Attempt an 11th login submission within the same 15-minute window. |
| **Expected Result** | Server returns HTTP 429 (Too Many Requests); frontend displays "Too many login attempts. Please try again after 15 minutes." |
| **Actual Result** | As expected. HTTP 429 triggered by express-rate-limit; IP temporarily restricted from logging in. |
| **Status** | **PASSED** |
| **Post-Condition** | Client IP address throttled until the rate limit window resets. |

---

### [TC-AUTH-014] Protected Route Guard (Unauthenticated Access Redirect)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-014` |
| **Title & Description** | **Protected Route Guard (Unauthenticated Access Redirect)**<br>Verify that attempting to navigate directly to `/admin/dashboard` without a token redirects to `/login`. |
| **Pre-Condition** | Browser localStorage contains no active JWT token. |
| **Test Data** | `URL: "http://localhost:5173/admin/dashboard"` |
| **Test Steps** | 1. Clear all browser storage and cookies.<br>2. Type "http://localhost:5173/admin/dashboard" directly into the browser URL address bar and press Enter. |
| **Expected Result** | ProtectedRoute component detects null auth state and immediately redirects user to /login. |
| **Actual Result** | As expected. Access blocked; browser redirected to /login with state preserved. |
| **Status** | **PASSED** |
| **Post-Condition** | Unauthorized user kept outside internal system pages. |

---

### [TC-AUTH-015] Role-Based Route Protection (Instructor accessing Admin Area)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-015` |
| **Title & Description** | **Role-Based Route Protection (Instructor accessing Admin Area)**<br>Verify that an instructor account is denied access when attempting to open `/admin/dashboard` or `/admin/google-drive`. |
| **Pre-Condition** | User is authenticated as an Instructor (role="instructor"). |
| **Test Data** | `URL: "http://localhost:5173/admin/google-drive"` |
| **Test Steps** | 1. Log in with Instructor account.<br>2. Manually enter "/admin/google-drive" into the browser address bar and press Enter. |
| **Expected Result** | ProtectedRoute checks allowedRoles=["admin"], detects mismatch, and redirects user back to /instructor/dashboard. |
| **Actual Result** | As expected. Navigation intercepted; instructor redirected to their authorized dashboard. |
| **Status** | **PASSED** |
| **Post-Condition** | Instructor remains on /instructor/dashboard; admin resources protected. |

---

### [TC-AUTH-016] User Logout Function ("Logout" Button & Confirmation Dialog)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-016` |
| **Title & Description** | **User Logout Function ("Logout" Button & Confirmation Dialog)**<br>Verify that clicking Logout in the sidebar opens confirmation modal and clearing session upon confirm. |
| **Pre-Condition** | User is logged into Admin or Instructor portal. |
| **Test Data** | `Click "Logout" button in bottom left sidebar.` |
| **Test Steps** | 1. Click the "Logout" button with door icon at bottom of sidebar.<br>2. Confirm dialog appears: "Are you sure you want to sign out?".<br>3. Click "Confirm Sign Out" button. |
| **Expected Result** | JWT token and user state cleared from localStorage; user redirected to public landing page (/); toast confirms "Logged out successfully". |
| **Actual Result** | As expected. Token removed; user redirected to landing page. |
| **Status** | **PASSED** |
| **Post-Condition** | No active session remains; back button cannot navigate back into protected dashboard. |

---

### [TC-AUTH-017] Cancel Logout Action ("Cancel" Button in Logout Dialog)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-AUTH-017` |
| **Title & Description** | **Cancel Logout Action ("Cancel" Button in Logout Dialog)**<br>Verify that clicking Cancel in logout confirmation dialog maintains current session without logging out. |
| **Pre-Condition** | Logout confirmation dialog is currently displayed. |
| **Test Data** | `Click "Cancel" button in logout modal.` |
| **Test Steps** | 1. Trigger Logout dialog from sidebar.<br>2. Click the "Cancel" button in the modal. |
| **Expected Result** | Modal closes; user session remains active and uninterrupted on current dashboard. |
| **Actual Result** | As expected. Modal dismissed; user stayed logged in. |
| **Status** | **PASSED** |
| **Post-Condition** | User session remains valid and active. |

---

## Module 2: Public Landing Page & Student Portal (LAND) (13 Test Cases)

### [TC-LAND-001] Header Navigation - Smooth Scroll to "Features" Section

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-001` |
| **Title & Description** | **Header Navigation - Smooth Scroll to "Features" Section**<br>Verify that clicking "Features" in top navbar scrolls page smoothly to system highlights. |
| **Pre-Condition** | User is on http://localhost:5173/ (Landing Page). |
| **Test Data** | `Click navigation item: "Features".` |
| **Test Steps** | 1. Load landing page.<br>2. Click the "Features" link on the navigation header. |
| **Expected Result** | Viewport scrolls smoothly to #features element displaying system feature cards. |
| **Actual Result** | As expected. Viewport scrolled smoothly to Features anchor. |
| **Status** | **PASSED** |
| **Post-Condition** | Features section is in user viewport. |

---

### [TC-LAND-002] Header Navigation - Smooth Scroll to "Tracking" Section

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-002` |
| **Title & Description** | **Header Navigation - Smooth Scroll to "Tracking" Section**<br>Verify that clicking "Tracking" scrolls to application status tracking card. |
| **Pre-Condition** | User is on Landing Page. |
| **Test Data** | `Click navigation item: "Tracking".` |
| **Test Steps** | 1. Click "Tracking" link in header navigation. |
| **Expected Result** | Viewport scrolls directly to the Application Tracking search card section. |
| **Actual Result** | As expected. Page scrolled to Tracking section. |
| **Status** | **PASSED** |
| **Post-Condition** | Tracking container centered in view. |

---

### [TC-LAND-003] Header Navigation - Smooth Scroll to "About / Tracks" Section

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-003` |
| **Title & Description** | **Header Navigation - Smooth Scroll to "About / Tracks" Section**<br>Verify that clicking "Tracks" scrolls down to CWTS, LTS, and ROTC descriptions. |
| **Pre-Condition** | User is on Landing Page. |
| **Test Data** | `Click navigation item: "Program Tracks".` |
| **Test Steps** | 1. Click "Program Tracks" link on navbar. |
| **Expected Result** | Viewport scrolls to the three NSTP track overview cards (CWTS, LTS, ROTC). |
| **Actual Result** | As expected. Page navigated to Program Tracks section. |
| **Status** | **PASSED** |
| **Post-Condition** | Tracks section visible in viewport. |

---

### [TC-LAND-004] Real-Time Telemetry Counters Display

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-004` |
| **Title & Description** | **Real-Time Telemetry Counters Display**<br>Verify that live telemetry counters (Active Students, Total Enrollments, Genuine Visitors) fetch real counts from backend. |
| **Pre-Condition** | Database contains students and enrollments; telemetry API is healthy. |
| **Test Data** | `Page load trigger on /` |
| **Test Steps** | 1. Open landing page in web browser.<br>2. Observe the 3 telemetry metric cards below the hero banner. |
| **Expected Result** | Telemetry cards animate and display accurate counts from server (Total Enrolled, Active Candidates, and Visitor metrics). |
| **Actual Result** | As expected. Counter metrics loaded with count-up animation. |
| **Status** | **PASSED** |
| **Post-Condition** | Telemetry metrics rendered accurately. |

---

### [TC-LAND-005] Primary Call-to-Action - "Enroll Now / Apply for NSTP" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-005` |
| **Title & Description** | **Primary Call-to-Action - "Enroll Now / Apply for NSTP" Button**<br>Verify that clicking the primary "Enroll Now" CTA navigates to freshman enrollment wizard. |
| **Pre-Condition** | User is on Landing Page. |
| **Test Data** | `Click button: "Enroll Now / Apply for NSTP".` |
| **Test Steps** | 1. Click the prominent "Apply for NSTP" hero button. |
| **Expected Result** | Browser navigates to /enrollment; Step 1 of the Online Enrollment form is displayed. |
| **Actual Result** | As expected. User redirected to /enrollment. |
| **Status** | **PASSED** |
| **Post-Condition** | Enrollment page initialized in browser. |

---

### [TC-LAND-006] Secondary Call-to-Action - "Staff Portal Login" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-006` |
| **Title & Description** | **Secondary Call-to-Action - "Staff Portal Login" Button**<br>Verify that clicking "Staff Portal Login" button directs faculty and coordinators to login page. |
| **Pre-Condition** | User is on Landing Page. |
| **Test Data** | `Click button: "Staff Portal Login".` |
| **Test Steps** | 1. Click the "Staff Login" button in hero or top right header. |
| **Expected Result** | Browser navigates to /login with staff login form rendered. |
| **Actual Result** | As expected. Redirected to /login. |
| **Status** | **PASSED** |
| **Post-Condition** | Login page active. |

---

### [TC-LAND-007] Application Tracking Trigger ("Track Application" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-007` |
| **Title & Description** | **Application Tracking Trigger ("Track Application" Button)**<br>Verify that clicking "Track Application" opens modal or activates search box. |
| **Pre-Condition** | User is on Landing Page. |
| **Test Data** | `Click button: "Track Application".` |
| **Test Steps** | 1. Click the "Track Application" button in the hero or tracking section. |
| **Expected Result** | Input modal or search focus is triggered for entering Reference Code. |
| **Actual Result** | As expected. Reference tracking box activated. |
| **Status** | **PASSED** |
| **Post-Condition** | Tracking input field ready for keystrokes. |

---

### [TC-LAND-008] Application Tracking Search with Valid Reference Number

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-008` |
| **Title & Description** | **Application Tracking Search with Valid Reference Number**<br>Verify that submitting a valid Reference Number displays the live status of the enrollment. |
| **Pre-Condition** | An enrollment application exists with reference code "REF-2026-CWTS-001" and status="Approved". |
| **Test Data** | `Reference ID: "REF-2026-CWTS-001"` |
| **Test Steps** | 1. Enter "REF-2026-CWTS-001" into Tracking search field.<br>2. Click "Check Status" button. |
| **Expected Result** | Card renders student name, chosen track (CWTS), submission date, status badge ("Approved"), and digital ID link if approved. |
| **Actual Result** | As expected. Application details displayed with green Approved badge. |
| **Status** | **PASSED** |
| **Post-Condition** | Status details displayed; user informed of application progress. |

---

### [TC-LAND-009] Application Tracking Search with Invalid / Not Found Code

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-009` |
| **Title & Description** | **Application Tracking Search with Invalid / Not Found Code**<br>Verify system behavior when user searches for a non-existent reference code. |
| **Pre-Condition** | No record matches "REF-INVALID-999". |
| **Test Data** | `Reference ID: "REF-INVALID-999"` |
| **Test Steps** | 1. Enter "REF-INVALID-999" into search field.<br>2. Click "Check Status". |
| **Expected Result** | System displays clear notice: "No enrollment record found matching this Reference Number. Please verify your reference code or contact OSDS." |
| **Actual Result** | As expected. User-friendly not-found alert displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | No sensitive data exposed; search field remains active. |

---

### [TC-LAND-010] Application Tracking Modal Dismiss ("Close" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-010` |
| **Title & Description** | **Application Tracking Modal Dismiss ("Close" Button)**<br>Verify that closing tracking modal resets search input and removes overlay. |
| **Pre-Condition** | Tracking results modal is open. |
| **Test Data** | `Click "Close (X)" button.` |
| **Test Steps** | 1. Click the close icon button on tracking dialog. |
| **Expected Result** | Tracking dialog disappears; background page becomes active. |
| **Actual Result** | As expected. Dialog closed smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Landing page interactive. |

---

### [TC-LAND-011] Interactive Track Overview Tabs (CWTS / LTS / ROTC Details)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-011` |
| **Title & Description** | **Interactive Track Overview Tabs (CWTS / LTS / ROTC Details)**<br>Verify that switching tabs dynamically changes displayed information about CWTS, LTS, and ROTC. |
| **Pre-Condition** | User is on Program Tracks section on landing page. |
| **Test Data** | `Click "ROTC" tab, then "LTS" tab, then "CWTS" tab.` |
| **Test Steps** | 1. Click the "ROTC" component tab.<br>2. Verify military training objectives and officer requirements are shown.<br>3. Click "CWTS" component tab.<br>4. Verify community service and civic welfare highlights are shown. |
| **Expected Result** | Tab content changes dynamically with corresponding track description, training hours (54 hours), and course requirements. |
| **Actual Result** | As expected. Content updated reactively without page reload. |
| **Status** | **PASSED** |
| **Post-Condition** | Selected track content is active. |

---

### [TC-LAND-012] Public Announcements Banner & View Details Modal

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-012` |
| **Title & Description** | **Public Announcements Banner & View Details Modal**<br>Verify that clicking on an announcement card opens full announcement details dialog. |
| **Pre-Condition** | Active announcement posted by Admin. |
| **Test Data** | `Click announcement card: "Orientation Schedule for 1st Semester".` |
| **Test Steps** | 1. Locate public announcements carousel or list.<br>2. Click "Read More" on the latest announcement card. |
| **Expected Result** | Announcement modal opens showing complete memo text, date published, venue, and instructions. |
| **Actual Result** | As expected. Announcement detail modal displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Announcement modal open. |

---

### [TC-LAND-013] Footer CvSU Naic Official External Links

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LAND-013` |
| **Title & Description** | **Footer CvSU Naic Official External Links**<br>Verify that official footer links (CvSU Main portal, CvSU Naic Facebook, CHED official site) open in a new tab securely. |
| **Pre-Condition** | User scrolls to bottom footer. |
| **Test Data** | `Click CvSU Official Portal link.` |
| **Test Steps** | 1. Scroll to footer.<br>2. Click "CvSU Naic Official Website" link. |
| **Expected Result** | Link opens external URL in new browser tab with rel="noopener noreferrer" for security. |
| **Actual Result** | As expected. External link opened safely in new tab. |
| **Status** | **PASSED** |
| **Post-Condition** | New tab opened; original landing page remains intact. |

---

## Module 3: Online Student Enrollment & Document Verification (ENRL) (22 Test Cases)

### [TC-ENRL-001] Step 1 - Personal Information Form Input Fields & Validations

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-001` |
| **Title & Description** | **Step 1 - Personal Information Form Input Fields & Validations**<br>Verify that Step 1 fields validate required personal information (Student ID, Name, Contact, Email, Degree Program, Section). |
| **Pre-Condition** | User is on /enrollment (Step 1). |
| **Test Data** | `Student ID: "2026-10023", Name: "Juan Santos Dela Cruz", Email: "juan.delacruz@cvsu.edu.ph", Course: "BSIT", Section: "1-1"` |
| **Test Steps** | 1. Fill in Student Number, First Name, Last Name, Birthdate, Gender, Course, Section, Contact No, and Email.<br>2. Leave one mandatory field blank (e.g. Email) and attempt to proceed.<br>3. Supply the missing field. |
| **Expected Result** | System highlights invalid/empty field with red validation warning; when properly filled, validation passes. |
| **Actual Result** | As expected. Validation caught missing field; cleared when valid data was entered. |
| **Status** | **PASSED** |
| **Post-Condition** | Step 1 fields validated and stored in local state. |

---

### [TC-ENRL-002] Step 1 - Duplicate Student Number Validation Prevention

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-002` |
| **Title & Description** | **Step 1 - Duplicate Student Number Validation Prevention**<br>Verify that the system prevents entering a Student Number that already exists in the approved students database. |
| **Pre-Condition** | Student ID "2024-00101" already exists in students table. |
| **Test Data** | `Student Number: "2024-00101"` |
| **Test Steps** | 1. Enter already registered student ID "2024-00101" in Student Number input.<br>2. Tab out or click "Proceed to Track Selection". |
| **Expected Result** | System triggers pre-validation check and displays warning: "Student ID 2024-00101 is already enrolled in NSTP." |
| **Actual Result** | As expected. Duplicate detection prevented duplicate entry. |
| **Status** | **PASSED** |
| **Post-Condition** | User cannot proceed to Step 2 with duplicate student number. |

---

### [TC-ENRL-003] Step 1 to Step 2 Navigation ("Proceed to Track Selection" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-003` |
| **Title & Description** | **Step 1 to Step 2 Navigation ("Proceed to Track Selection" Button)**<br>Verify that clicking "Proceed to Track Selection" transitions to Step 2 wizard. |
| **Pre-Condition** | Step 1 form is completely and validly filled out. |
| **Test Data** | `Click button: "Proceed to Track Selection".` |
| **Test Steps** | 1. Review all Step 1 fields.<br>2. Click "Proceed to Track Selection" button at bottom right. |
| **Expected Result** | Progress bar advances to Step 2 (50%); Track selection cards (CWTS, LTS, ROTC) are rendered. |
| **Actual Result** | As expected. Wizard transitioned to Step 2 smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Wizard is on Step 2; Step 1 data retained in state. |

---

### [TC-ENRL-004] Step 2 - NSTP Track Selection (Select CWTS / LTS / ROTC Card)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-004` |
| **Title & Description** | **Step 2 - NSTP Track Selection (Select CWTS / LTS / ROTC Card)**<br>Verify that user can select one of the three NSTP components by clicking its interactive card. |
| **Pre-Condition** | Wizard is on Step 2. |
| **Test Data** | `Select "ROTC" track card.` |
| **Test Steps** | 1. Click the ROTC card.<br>2. Observe the card styling (highlight border, check icon).<br>3. Click the CWTS card. |
| **Expected Result** | Selected card receives active highlight style and radio indicator; previous selection is unselected. |
| **Actual Result** | As expected. Radio selection updated reactively. |
| **Status** | **PASSED** |
| **Post-Condition** | Chosen track stored in state (e.g. selectedTrack = "CWTS"). |

---

### [TC-ENRL-005] Step 2 - Back Navigation ("Back to Personal Info" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-005` |
| **Title & Description** | **Step 2 - Back Navigation ("Back to Personal Info" Button)**<br>Verify that clicking "Back" returns to Step 1 without erasing previously entered personal details. |
| **Pre-Condition** | User is on Step 2. |
| **Test Data** | `Click "Back" button.` |
| **Test Steps** | 1. Click the "Back" button.<br>2. Inspect the fields on Step 1. |
| **Expected Result** | Wizard returns to Step 1; all previously typed names, IDs, and email values are preserved intact. |
| **Actual Result** | As expected. Step 1 inputs preserved without data loss. |
| **Status** | **PASSED** |
| **Post-Condition** | User is on Step 1 with form data preserved. |

---

### [TC-ENRL-006] Step 2 to Step 3 Navigation ("Proceed to Document Upload" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-006` |
| **Title & Description** | **Step 2 to Step 3 Navigation ("Proceed to Document Upload" Button)**<br>Verify that clicking "Proceed to Document Upload" with a selected track navigates to Step 3. |
| **Pre-Condition** | A track is selected on Step 2. |
| **Test Data** | `Click "Proceed to Document Upload".` |
| **Test Steps** | 1. Select CWTS track.<br>2. Click "Proceed to Document Upload" button. |
| **Expected Result** | Wizard advances to Step 3 (75%); file upload slots for 2x2 Photo and COR are presented. |
| **Actual Result** | As expected. Wizard navigated to Step 3. |
| **Status** | **PASSED** |
| **Post-Condition** | Step 3 Document Upload container displayed. |

---

### [TC-ENRL-007] Step 3 - Formal 2x2 Photo Upload via File Selector (JPEG/PNG)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-007` |
| **Title & Description** | **Step 3 - Formal 2x2 Photo Upload via File Selector (JPEG/PNG)**<br>Verify that a student can upload a valid 2x2 ID picture and preview it in real-time. |
| **Pre-Condition** | Wizard is on Step 3. |
| **Test Data** | `File: "formal_2x2_photo.jpg" (dimensions: 600x600, 150KB)` |
| **Test Steps** | 1. Click "Choose 2x2 Photo" or drag file into dropzone.<br>2. Select "formal_2x2_photo.jpg". |
| **Expected Result** | Image is accepted, preview thumbnail renders in circle/square container, file size and name shown. |
| **Actual Result** | As expected. Photo uploaded and thumbnail preview displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Photo base64 data stored in photoData state. |

---

### [TC-ENRL-008] Step 3 - Formal 2x2 Photo Capture via Webcam / Device Camera ("Take Photo" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-008` |
| **Title & Description** | **Step 3 - Formal 2x2 Photo Capture via Webcam / Device Camera ("Take Photo" Button)**<br>Verify that student can take an immediate 2x2 photo using device camera if webcam is accessible. |
| **Pre-Condition** | Device camera permissions granted. |
| **Test Data** | `Click "Take Photo with Camera" button.` |
| **Test Steps** | 1. Click the camera icon button under 2x2 slot.<br>2. Camera viewfinder modal appears with live video stream.<br>3. Align face in oval guide and click "Capture Photo" button.<br>4. Click "Use This Photo". |
| **Expected Result** | Video stream captures current frame to canvas, crops to 1:1 aspect ratio, and populates 2x2 photo slot. |
| **Actual Result** | As expected. Live camera captured snapshot and populated slot. |
| **Status** | **PASSED** |
| **Post-Condition** | Captured image stored in photoData. |

---

### [TC-ENRL-009] Step 3 - Remove / Re-upload 2x2 Photo ("Remove Photo" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-009` |
| **Title & Description** | **Step 3 - Remove / Re-upload 2x2 Photo ("Remove Photo" Button)**<br>Verify that student can remove an uploaded 2x2 photo and choose another file. |
| **Pre-Condition** | Photo already uploaded in 2x2 slot. |
| **Test Data** | `Click "Remove Photo" trash icon button.` |
| **Test Steps** | 1. Click the trash icon button on the 2x2 photo thumbnail.<br>2. Verify preview is cleared. |
| **Expected Result** | Photo removed from state; dropzone resets to default "Click or Drag to Upload" placeholder. |
| **Actual Result** | As expected. Photo cleared and dropzone reset. |
| **Status** | **PASSED** |
| **Post-Condition** | photoData state is null. |

---

### [TC-ENRL-010] Step 3 - COR Upload via File Selector

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-010` |
| **Title & Description** | **Step 3 - COR Upload via File Selector**<br>Verify that user can select and upload their official Certificate of Registration (COR). |
| **Pre-Condition** | Wizard is on Step 3. |
| **Test Data** | `File: "official_cor_sample.png" (scanned university registration)` |
| **Test Steps** | 1. Click "Upload Certificate of Registration (COR)".<br>2. Select "official_cor_sample.png". |
| **Expected Result** | Client-side Canvas Document Validator analyzes the image; passes validation and renders document preview. |
| **Actual Result** | As expected. File loaded and document preview rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | COR file stored in corData state. |

---

### [TC-ENRL-011] Step 3 - Canvas Document Validation: Reject Non-Document / Selfie Image

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-011` |
| **Title & Description** | **Step 3 - Canvas Document Validation: Reject Non-Document / Selfie Image**<br>Verify that the canvas algorithm rejects selfie or colorful landscape photos uploaded into the COR slot. |
| **Pre-Condition** | Wizard is on Step 3. |
| **Test Data** | `File: "beach_selfie.jpg" (colorful high-chroma photo, Chroma > 45, background luminance variable)` |
| **Test Steps** | 1. Select "beach_selfie.jpg" for the COR slot.<br>2. Wait for canvas document verification. |
| **Expected Result** | Canvas validator computes Chroma > 36 and non-document luminance; displays error: "The uploaded file does not look like an official printed document or Certificate of Registration. Please upload a clear photo or scan of your COR." File is rejected. |
| **Actual Result** | As expected. Canvas analysis rejected the selfie with Chroma warning. |
| **Status** | **PASSED** |
| **Post-Condition** | COR slot remains empty; invalid file rejected. |

---

### [TC-ENRL-012] Step 3 - Canvas Document Validation: Reject Blank White Paper

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-012` |
| **Title & Description** | **Step 3 - Canvas Document Validation: Reject Blank White Paper**<br>Verify that canvas algorithm rejects a completely blank white image without ink/text pixels. |
| **Pre-Condition** | Wizard is on Step 3. |
| **Test Data** | `File: "blank_white_paper.jpg" (white canvas, no text, ink density < 1%)` |
| **Test Steps** | 1. Select "blank_white_paper.jpg" for the COR slot.<br>2. Observe canvas verification result. |
| **Expected Result** | Canvas validator detects insufficient ink density (text pixels < threshold); displays warning: "The uploaded document contains no readable text or is blank. Please upload your official COR." Upload rejected. |
| **Actual Result** | As expected. Blank paper rejected due to low ink density. |
| **Status** | **PASSED** |
| **Post-Condition** | corData remains null. |

---

### [TC-ENRL-013] Step 3 - Canvas Document Validation: Reject Duplicate Image

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-013` |
| **Title & Description** | **Step 3 - Canvas Document Validation: Reject Duplicate Image**<br>Verify that the system detects and rejects uploading the exact same image for both 2x2 photo and COR. |
| **Pre-Condition** | 2x2 photo is already populated with "student_photo.jpg". |
| **Test Data** | `File: "student_photo.jpg" uploaded to COR slot.` |
| **Test Steps** | 1. Upload "student_photo.jpg" to 2x2 slot.<br>2. Attempt to upload "student_photo.jpg" to the COR slot. |
| **Expected Result** | System computes image hash / pixel comparison, detects duplicate image match; displays error: "You cannot use the same image for both your 2x2 Photo and Certificate of Registration." File rejected. |
| **Actual Result** | As expected. Duplicate image detected and rejected. |
| **Status** | **PASSED** |
| **Post-Condition** | COR slot remains unpopulated. |

---

### [TC-ENRL-014] Step 3 - Canvas Document Validation: Accept Legitimate Document / Scanned COR

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-014` |
| **Title & Description** | **Step 3 - Canvas Document Validation: Accept Legitimate Document / Scanned COR**<br>Verify that a legitimate scanned COR with white background, low chroma (<36), and text pixels passes validation. |
| **Pre-Condition** | Wizard is on Step 3. |
| **Test Data** | `File: "valid_cvsu_cor.png" (scanned printed document)` |
| **Test Steps** | 1. Upload "valid_cvsu_cor.png" into COR slot.<br>2. Wait for canvas analysis. |
| **Expected Result** | Luminance > 140, Chroma < 36, Ink density > 3% pass checks; green badge "Document Verified" displayed. |
| **Actual Result** | As expected. Document validation passed with green verified badge. |
| **Status** | **PASSED** |
| **Post-Condition** | COR accepted and ready for submission. |

---

### [TC-ENRL-015] Step 3 - Remove / Re-upload COR Document ("Remove COR" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-015` |
| **Title & Description** | **Step 3 - Remove / Re-upload COR Document ("Remove COR" Button)**<br>Verify that clicking "Remove COR" removes the verified document and resets the dropzone. |
| **Pre-Condition** | COR is currently uploaded in Step 3. |
| **Test Data** | `Click "Remove COR" button.` |
| **Test Steps** | 1. Click the remove trash icon on the COR preview. |
| **Expected Result** | Document removed from state; validator status reset; placeholder restored. |
| **Actual Result** | As expected. Document cleared successfully. |
| **Status** | **PASSED** |
| **Post-Condition** | corData state is null. |

---

### [TC-ENRL-016] Step 3 to Step 4 Navigation ("Review Application" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-016` |
| **Title & Description** | **Step 3 to Step 4 Navigation ("Review Application" Button)**<br>Verify that clicking "Review Application" advances to final review when both documents are valid. |
| **Pre-Condition** | Both 2x2 photo and verified COR are present. |
| **Test Data** | `Click "Review Application" button.` |
| **Test Steps** | 1. Click "Review Application" button at bottom right. |
| **Expected Result** | Wizard advances to Step 4 (100%); Summary review screen displays all entered details and document thumbnails. |
| **Actual Result** | As expected. Navigated to Step 4 review screen. |
| **Status** | **PASSED** |
| **Post-Condition** | Step 4 Review screen active. |

---

### [TC-ENRL-017] Step 4 - Terms of Agreement & Data Privacy Act Consent Checkbox

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-017` |
| **Title & Description** | **Step 4 - Terms of Agreement & Data Privacy Act Consent Checkbox**<br>Verify that the user cannot submit application without checking the Data Privacy Act (RA 10173) consent checkbox. |
| **Pre-Condition** | Wizard is on Step 4; consent checkbox is unchecked. |
| **Test Data** | `Click "Submit Enrollment Application" with checkbox unchecked.` |
| **Test Steps** | 1. Leave the Data Privacy Consent checkbox unchecked.<br>2. Click "Submit Enrollment Application" button. |
| **Expected Result** | Submission is blocked; warning alert indicates: "You must agree to the Terms and Data Privacy Policy before submitting." |
| **Actual Result** | As expected. Submission blocked until agreement is confirmed. |
| **Status** | **PASSED** |
| **Post-Condition** | Form not submitted; checkbox highlighted in red. |

---

### [TC-ENRL-018] Step 4 - Final Submission ("Submit Enrollment Application" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-018` |
| **Title & Description** | **Step 4 - Final Submission ("Submit Enrollment Application" Button)**<br>Verify that clicking Submit with consent checked creates pending enrollment in MySQL database. |
| **Pre-Condition** | All steps validly completed; consent checkbox checked. |
| **Test Data** | `Click "Submit Enrollment Application" button.` |
| **Test Steps** | 1. Check "I agree to the Terms of Service and Data Privacy Policy (RA 10173)".<br>2. Click "Submit Enrollment Application" button. |
| **Expected Result** | Form submits payload to /api/enrollment; server returns HTTP 201 with unique Reference ID; UI transitions to Confirmation Screen. |
| **Actual Result** | As expected. HTTP 201 returned; pending enrollment record inserted into enrollments table. |
| **Status** | **PASSED** |
| **Post-Condition** | Enrollment record in database with status="Pending". |

---

### [TC-ENRL-019] Submission Success - Reference Code Generation & Display

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-019` |
| **Title & Description** | **Submission Success - Reference Code Generation & Display**<br>Verify that the confirmation screen displays the unique Reference Code (e.g., REF-2026-XXXXX) and instructions. |
| **Pre-Condition** | Application just submitted successfully. |
| **Test Data** | `Confirmation screen view.` |
| **Test Steps** | 1. Observe the confirmation screen. |
| **Expected Result** | Reference Code prominently displayed with Copy button; message advises student to save code for tracking status. |
| **Actual Result** | As expected. Reference Code shown with one-click copy button. |
| **Status** | **PASSED** |
| **Post-Condition** | Reference code visible to student. |

---

### [TC-ENRL-020] Submission Success - "Download Application Receipt (PDF)" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-020` |
| **Title & Description** | **Submission Success - "Download Application Receipt (PDF)" Button**<br>Verify that clicking "Download Receipt" generates a formatted PDF application receipt. |
| **Pre-Condition** | Confirmation screen is active. |
| **Test Data** | `Click "Download Application Receipt (PDF)" button.` |
| **Test Steps** | 1. Click "Download Application Receipt" button. |
| **Expected Result** | jsPDF compiles receipt with CvSU Naic header, student info, reference barcode, and timestamp; downloads .pdf file. |
| **Actual Result** | As expected. PDF receipt generated and downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | PDF receipt saved on client device. |

---

### [TC-ENRL-021] Submission Success - "Print Application Summary" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-021` |
| **Title & Description** | **Submission Success - "Print Application Summary" Button**<br>Verify that clicking "Print" triggers browser print preview for the enrollment summary. |
| **Pre-Condition** | Confirmation screen is active. |
| **Test Data** | `Click "Print Summary" button.` |
| **Test Steps** | 1. Click "Print Summary" button. |
| **Expected Result** | Browser native print dialog window opens with styled printable receipt layout. |
| **Actual Result** | As expected. Print window opened with clean layout. |
| **Status** | **PASSED** |
| **Post-Condition** | Print dialog open. |

---

### [TC-ENRL-022] Submission Success - "Return to Home Page" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ENRL-022` |
| **Title & Description** | **Submission Success - "Return to Home Page" Button**<br>Verify that clicking "Return to Home Page" redirects back to landing page. |
| **Pre-Condition** | Confirmation screen is active. |
| **Test Data** | `Click "Return to Home Page" button.` |
| **Test Steps** | 1. Click "Return to Home Page" button. |
| **Expected Result** | Browser navigates to /; enrollment wizard state is cleared. |
| **Actual Result** | As expected. User returned to landing page. |
| **Status** | **PASSED** |
| **Post-Condition** | Landing page displayed. |

---

## Module 4: Administrator Dashboard & Analytics (DASH-ADM) (24 Test Cases)

### [TC-DASH-ADM-001] Dashboard Executive Metric Cards Rendering

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-001` |
| **Title & Description** | **Dashboard Executive Metric Cards Rendering**<br>Verify that the 4 executive metric cards (Total Students, Instructors, Pending Enrollments, Attendance Rate) load accurate counts. |
| **Pre-Condition** | Admin is logged in on /admin/dashboard. |
| **Test Data** | `Page load trigger on /admin/dashboard.` |
| **Test Steps** | 1. Navigate to /admin/dashboard.<br>2. Inspect the 4 top metric cards. |
| **Expected Result** | Each metric card displays correct aggregated data from MySQL (total enrolled students, active instructors, pending applications, overall attendance %). |
| **Actual Result** | As expected. All 4 metrics loaded accurately with icons and percentage trends. |
| **Status** | **PASSED** |
| **Post-Condition** | Metric summary visible on dashboard. |

---

### [TC-DASH-ADM-002] Academic Year / Semester Dropdown Selector

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-002` |
| **Title & Description** | **Academic Year / Semester Dropdown Selector**<br>Verify that changing the Academic Year dropdown re-queries statistics for the selected academic term. |
| **Pre-Condition** | Admin is on dashboard; archived years exist (e.g. 2024-2025, 2025-2026). |
| **Test Data** | `Select "A.Y. 2024-2025 - 2nd Semester" in dropdown.` |
| **Test Steps** | 1. Click the Academic Year selector dropdown in the top header.<br>2. Choose "A.Y. 2024-2025 - 2nd Semester". |
| **Expected Result** | Dashboard metrics, charts, and tables update to reflect data from the chosen academic term. |
| **Actual Result** | As expected. Dashboard re-queried and updated for selected term. |
| **Status** | **PASSED** |
| **Post-Condition** | Selected term stored in active session context. |

---

### [TC-DASH-ADM-003] Top Navbar Notification Bell Button (Open Notification Flyout)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-003` |
| **Title & Description** | **Top Navbar Notification Bell Button (Open Notification Flyout)**<br>Verify that clicking the bell icon opens the real-time notifications dropdown modal. |
| **Pre-Condition** | Admin is on dashboard; unread notifications exist. |
| **Test Data** | `Click Bell Icon button on top navigation bar.` |
| **Test Steps** | 1. Locate the Bell Icon with unread badge in top navbar.<br>2. Click on the Bell Icon. |
| **Expected Result** | Notification flyout panel slides open showing list of recent system events, submitted enrollments, and messages. |
| **Actual Result** | As expected. Notification panel opened with list of notifications. |
| **Status** | **PASSED** |
| **Post-Condition** | Notification modal visible. |

---

### [TC-DASH-ADM-004] Notification Modal - "Mark All as Read" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-004` |
| **Title & Description** | **Notification Modal - "Mark All as Read" Button**<br>Verify that clicking "Mark All as Read" clears unread badges and updates read status in database. |
| **Pre-Condition** | Notification modal is open with unread notifications. |
| **Test Data** | `Click "Mark All as Read" button.` |
| **Test Steps** | 1. Click "Mark All as Read" button at top of notification flyout. |
| **Expected Result** | All unread notification items update to read state; red counter badge on navbar bell disappears. |
| **Actual Result** | As expected. Unread count reset to 0; items marked read. |
| **Status** | **PASSED** |
| **Post-Condition** | No unread notifications pending. |

---

### [TC-DASH-ADM-005] Notification Modal - Filter Tabs ("All" vs "Unread" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-005` |
| **Title & Description** | **Notification Modal - Filter Tabs ("All" vs "Unread" Button)**<br>Verify that clicking "Unread" tab filters notification list to display only unread alerts. |
| **Pre-Condition** | Notification flyout is open. |
| **Test Data** | `Click "Unread" tab button.` |
| **Test Steps** | 1. Click the "Unread" tab.<br>2. Observe filtered list.<br>3. Click the "All" tab. |
| **Expected Result** | Switching to "Unread" shows only unread notifications; switching to "All" shows all historical items. |
| **Actual Result** | As expected. Tabs filtered items reactively. |
| **Status** | **PASSED** |
| **Post-Condition** | Chosen filter active. |

---

### [TC-DASH-ADM-006] Notification Modal - "Delete Selected Notifications" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-006` |
| **Title & Description** | **Notification Modal - "Delete Selected Notifications" Button**<br>Verify that admin can select notifications via checkboxes and delete them. |
| **Pre-Condition** | Notification modal open. |
| **Test Data** | `Select 2 notification checkboxes; click "Delete Selected".` |
| **Test Steps** | 1. Select checkboxes next to two notification items.<br>2. Click the trash icon "Delete Selected" button. |
| **Expected Result** | Selected notifications are removed from list and database. |
| **Actual Result** | As expected. Selected items deleted smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Deleted notifications removed from database. |

---

### [TC-DASH-ADM-007] Interactive Grouped Column Bar Graph - "All Tracks" Filter Toggle

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-007` |
| **Title & Description** | **Interactive Grouped Column Bar Graph - "All Tracks" Filter Toggle**<br>Verify that the "All Tracks" toggle displays all three tracks (CWTS in Green, LTS in Purple, ROTC in Red) for each course. |
| **Pre-Condition** | Admin is on dashboard viewing the Analytics Bar Graph. |
| **Test Data** | `Click "All Tracks" filter button.` |
| **Test Steps** | 1. Click the "All Tracks" toggle button above the bar chart. |
| **Expected Result** | Chart displays clustered columns for CWTS (green), LTS (purple), and ROTC (red) across BSIT, BSCS, BSHM, BSBA, BSFAS. |
| **Actual Result** | As expected. Clustered grouped bar chart rendered all 3 track columns. |
| **Status** | **PASSED** |
| **Post-Condition** | All tracks visible in analytics chart. |

---

### [TC-DASH-ADM-008] Interactive Grouped Column Bar Graph - "CWTS Only" Filter Toggle

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-008` |
| **Title & Description** | **Interactive Grouped Column Bar Graph - "CWTS Only" Filter Toggle**<br>Verify that clicking "CWTS Only" filters the grouped column bar chart to show only CWTS columns. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "CWTS Only" button.` |
| **Test Steps** | 1. Click the "CWTS Only" button above the chart. |
| **Expected Result** | Chart isolates and displays only the green CWTS columns; LTS and ROTC columns are hidden. |
| **Actual Result** | As expected. Only CWTS columns rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | CWTS filter applied to chart. |

---

### [TC-DASH-ADM-009] Interactive Grouped Column Bar Graph - "LTS Only" Filter Toggle

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-009` |
| **Title & Description** | **Interactive Grouped Column Bar Graph - "LTS Only" Filter Toggle**<br>Verify that clicking "LTS Only" filters the grouped column bar chart to show only LTS columns. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "LTS Only" button.` |
| **Test Steps** | 1. Click the "LTS Only" button above the chart. |
| **Expected Result** | Chart isolates and displays only the purple LTS columns across degree programs. |
| **Actual Result** | As expected. Only LTS columns rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | LTS filter applied to chart. |

---

### [TC-DASH-ADM-010] Interactive Grouped Column Bar Graph - "ROTC Only" Filter Toggle

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-010` |
| **Title & Description** | **Interactive Grouped Column Bar Graph - "ROTC Only" Filter Toggle**<br>Verify that clicking "ROTC Only" filters the grouped column bar chart to show only ROTC columns. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "ROTC Only" button.` |
| **Test Steps** | 1. Click the "ROTC Only" button above the chart. |
| **Expected Result** | Chart isolates and displays only the red ROTC columns across degree programs. |
| **Actual Result** | As expected. Only ROTC columns rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | ROTC filter applied to chart. |

---

### [TC-DASH-ADM-011] Grouped Column Bar Graph - Direct Bar Column Click (Course Drilldown)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-011` |
| **Title & Description** | **Grouped Column Bar Graph - Direct Bar Column Click (Course Drilldown)**<br>Verify that clicking a specific course bar (e.g. BSIT) filters the student roster below to BSIT students only. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click the "BSIT" column bar in the graph.` |
| **Test Steps** | 1. Hover over the BSIT grouped bar column.<br>2. Click on the BSIT bar. |
| **Expected Result** | Chart triggers drill-down filter; table below immediately filters to show only BSIT students. |
| **Actual Result** | As expected. Student table filtered to BSIT program automatically. |
| **Status** | **PASSED** |
| **Post-Condition** | Course filter active in table. |

---

### [TC-DASH-ADM-012] Pending Enrollments Roster - Search by Name / Student Number

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-012` |
| **Title & Description** | **Pending Enrollments Roster - Search by Name / Student Number**<br>Verify that the search bar in Pending Enrollments filters applicant list in real-time. |
| **Pre-Condition** | Pending applications exist. |
| **Test Data** | `Search Query: "Santos"` |
| **Test Steps** | 1. Type "Santos" into the search box above Pending Enrollments. |
| **Expected Result** | Table filters dynamically to show only applicants whose first, middle, or last name matches "Santos". |
| **Actual Result** | As expected. Real-time filtering executed as user typed. |
| **Status** | **PASSED** |
| **Post-Condition** | Filtered records displayed. |

---

### [TC-DASH-ADM-013] Pending Enrollments Roster - Filter by Degree Program / Course Dropdown

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-013` |
| **Title & Description** | **Pending Enrollments Roster - Filter by Degree Program / Course Dropdown**<br>Verify that selecting a course from dropdown isolates pending applications for that course. |
| **Pre-Condition** | Pending applications exist across various courses. |
| **Test Data** | `Select "BSCS" from Course dropdown.` |
| **Test Steps** | 1. Click Course filter dropdown.<br>2. Choose "Bachelor of Science in Computer Science (BSCS)". |
| **Expected Result** | Table updates to display only BSCS pending applicants. |
| **Actual Result** | As expected. List restricted to BSCS applicants. |
| **Status** | **PASSED** |
| **Post-Condition** | BSCS filter applied. |

---

### [TC-DASH-ADM-014] Pending Enrollments - "View COR & Audit Details" Modal Trigger Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-014` |
| **Title & Description** | **Pending Enrollments - "View COR & Audit Details" Modal Trigger Button**<br>Verify that clicking "Review Documents" opens the side-by-side verification modal. |
| **Pre-Condition** | Pending applicant row exists in table. |
| **Test Data** | `Click "Review" button on row for "Juan Dela Cruz".` |
| **Test Steps** | 1. Click the "Review" eye icon button on the applicant row. |
| **Expected Result** | Audit modal opens showing applicant details, 2x2 ID photo, and uploaded COR side-by-side. |
| **Actual Result** | As expected. Side-by-side audit modal rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | Audit modal open with zoom/pan controls. |

---

### [TC-DASH-ADM-015] COR Audit Modal - Side-by-Side 2x2 Photo & COR Inspection with Zoom / Pan Controls

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-015` |
| **Title & Description** | **COR Audit Modal - Side-by-Side 2x2 Photo & COR Inspection with Zoom / Pan Controls**<br>Verify that admin can zoom in and inspect fine print text on the COR to verify subject registration. |
| **Pre-Condition** | Audit modal is open. |
| **Test Data** | `Click "Zoom In (+)" button and pan image.` |
| **Test Steps** | 1. Click the Zoom In (+) button above the COR preview.<br>2. Drag / pan the image across the viewing window.<br>3. Click "Reset Zoom" button. |
| **Expected Result** | Image scales up smoothly allowing inspection of printed registration details; pan moves canvas; reset restores initial view. |
| **Actual Result** | As expected. Zoom and pan controls operated smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Zoom controls responsive. |

---

### [TC-DASH-ADM-016] COR Audit Modal - "Approve Enrollment" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-016` |
| **Title & Description** | **COR Audit Modal - "Approve Enrollment" Button**<br>Verify that clicking "Approve Enrollment" moves applicant into official students table and generates digital ID hash. |
| **Pre-Condition** | Audit modal is open for a pending applicant. |
| **Test Data** | `Click "Approve Enrollment" button.` |
| **Test Steps** | 1. Verify student documents in audit modal.<br>2. Click the green "Approve Enrollment" button.<br>3. Confirm approval action. |
| **Expected Result** | Status changes to "Approved"; student record inserted into students table; digital ID payload generated; toast displays "Enrollment Approved"; modal closes. |
| **Actual Result** | As expected. Record migrated to students table; status updated to approved. |
| **Status** | **PASSED** |
| **Post-Condition** | Student is now an official enrolled student. |

---

### [TC-DASH-ADM-017] COR Audit Modal - "Reject Application" Button with Reason Input & Notification

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-017` |
| **Title & Description** | **COR Audit Modal - "Reject Application" Button with Reason Input & Notification**<br>Verify that clicking Reject prompts for a reason and updates status to "Rejected" with notification logged. |
| **Pre-Condition** | Audit modal is open. |
| **Test Data** | `Click "Reject Application", enter reason: "COR is blurry and unreadable; please re-upload clear copy."` |
| **Test Steps** | 1. Click the red "Reject Application" button.<br>2. Prompt modal appears requesting rejection reason.<br>3. Type reason: "COR is blurry and unreadable; please re-upload clear copy."<br>4. Click "Confirm Rejection". |
| **Expected Result** | Status updated to "Rejected" with rejection reason recorded; applicant can see reason in Application Tracker; modal closes. |
| **Actual Result** | As expected. Application rejected with reason stored in database. |
| **Status** | **PASSED** |
| **Post-Condition** | Application marked Rejected with reason. |

---

### [TC-DASH-ADM-018] Pending Enrollments - Batch Select All Checkbox

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-018` |
| **Title & Description** | **Pending Enrollments - Batch Select All Checkbox**<br>Verify that clicking the top header checkbox selects all visible pending applicants. |
| **Pre-Condition** | Pending table has multiple rows. |
| **Test Data** | `Click top header checkbox.` |
| **Test Steps** | 1. Click the master checkbox in table header. |
| **Expected Result** | All row checkboxes are checked; batch action bar appears showing "X applicants selected". |
| **Actual Result** | As expected. All visible applicants selected and batch action toolbar shown. |
| **Status** | **PASSED** |
| **Post-Condition** | All pending applicants selected. |

---

### [TC-DASH-ADM-019] Pending Enrollments - "Batch Approve Selected" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-019` |
| **Title & Description** | **Pending Enrollments - "Batch Approve Selected" Button**<br>Verify that admin can approve multiple selected applicants in a single transaction. |
| **Pre-Condition** | 3 pending applicants are selected. |
| **Test Data** | `Click "Batch Approve (3)" button.` |
| **Test Steps** | 1. Select 3 applicants.<br>2. Click "Batch Approve (3)" button in batch action bar.<br>3. Confirm batch approval. |
| **Expected Result** | All 3 selected applicants are approved in batch; records transferred to students table; success toast confirms batch approval. |
| **Actual Result** | As expected. Batch approval executed cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | 3 applicants approved simultaneously. |

---

### [TC-DASH-ADM-020] Quick Action - "Launch Attendance Scanner" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-020` |
| **Title & Description** | **Quick Action - "Launch Attendance Scanner" Button**<br>Verify that clicking the quick action button opens the Attendance Scanner modal directly from dashboard. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "Launch Attendance Scanner" quick action card.` |
| **Test Steps** | 1. Click "Launch Attendance Scanner" button in Quick Actions panel. |
| **Expected Result** | Attendance Scanner modal opens immediately with full camera controls and session options. |
| **Actual Result** | As expected. Attendance Scanner modal opened. |
| **Status** | **PASSED** |
| **Post-Condition** | Attendance scanner active. |

---

### [TC-DASH-ADM-021] Quick Action - "Batch Print Digital IDs" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-021` |
| **Title & Description** | **Quick Action - "Batch Print Digital IDs" Button**<br>Verify that clicking the quick action opens the Batch ID Print modal. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "Batch Print Digital IDs" quick action card.` |
| **Test Steps** | 1. Click "Batch Print Digital IDs" button. |
| **Expected Result** | Batch ID print modal opens with section filters and multi-card print grid. |
| **Actual Result** | As expected. Batch ID Print modal displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Batch ID print modal active. |

---

### [TC-DASH-ADM-022] Quick Action - "Generate OSDS Form 2-A" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-022` |
| **Title & Description** | **Quick Action - "Generate OSDS Form 2-A" Button**<br>Verify that clicking quick action redirects directly to Reports page with Form 2-A tab active. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "Generate OSDS Form 2-A" quick action button.` |
| **Test Steps** | 1. Click "Generate OSDS Form 2-A" button. |
| **Expected Result** | Browser navigates to /reports with Form 2-A tab preselected ready for export. |
| **Actual Result** | As expected. Redirected to /reports?tab=form2a. |
| **Status** | **PASSED** |
| **Post-Condition** | Reports page active. |

---

### [TC-DASH-ADM-023] Quick Action - "Trigger System Backup Snapshot" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-023` |
| **Title & Description** | **Quick Action - "Trigger System Backup Snapshot" Button**<br>Verify that clicking quick action triggers an immediate local database dump snapshot. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "Trigger Backup Snapshot" button.` |
| **Test Steps** | 1. Click "Trigger Backup Snapshot" button.<br>2. Observe progress toast. |
| **Expected Result** | Backend runs `scripts/backup_database.sh`; creates compressed `.sql.gz` in backups/ folder; toast displays "Backup snapshot created successfully". |
| **Actual Result** | As expected. Database dumped and compressed in 0.8s. |
| **Status** | **PASSED** |
| **Post-Condition** | New backup file logged in backups/ directory. |

---

### [TC-DASH-ADM-024] Audit Logs Feed - "View Full Activity History" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-ADM-024` |
| **Title & Description** | **Audit Logs Feed - "View Full Activity History" Button**<br>Verify that clicking view history opens the full system audit logs modal. |
| **Pre-Condition** | Admin is on dashboard. |
| **Test Data** | `Click "View Full Activity History" link.` |
| **Test Steps** | 1. Scroll to recent activity widget on dashboard.<br>2. Click "View Full Activity History". |
| **Expected Result** | Audit log table opens displaying timestamps, admin actions, IP addresses, and affected records. |
| **Actual Result** | As expected. Audit logs modal displayed with full chronological event logs. |
| **Status** | **PASSED** |
| **Post-Condition** | Audit logs modal open. |

---

## Module 5: Instructor Dashboard & Academic Track Operations (DASH-INS) (8 Test Cases)

### [TC-DASH-INS-001] Instructor Assigned Department Badge & Track Isolation Display

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-001` |
| **Title & Description** | **Instructor Assigned Department Badge & Track Isolation Display**<br>Verify that instructor dashboard displays clear department badge (CWTS, LTS, or ROTC) and isolates data to that track. |
| **Pre-Condition** | Instructor is logged in with department="ROTC". |
| **Test Data** | `Page load trigger on /instructor/dashboard.` |
| **Test Steps** | 1. Log in as ROTC Instructor.<br>2. Examine the top banner on Instructor Dashboard. |
| **Expected Result** | Red ROTC Department badge is displayed; welcome message references ROTC Track; metrics reflect only ROTC students. |
| **Actual Result** | As expected. ROTC badge and isolated metrics displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Dashboard scope isolated to ROTC. |

---

### [TC-DASH-INS-002] Instructor Metric Summary (Assigned Students, Completed Sessions, Attendance Rate)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-002` |
| **Title & Description** | **Instructor Metric Summary (Assigned Students, Completed Sessions, Attendance Rate)**<br>Verify that metric cards show accurate data for the instructor's assigned department only. |
| **Pre-Condition** | Instructor is on dashboard. |
| **Test Data** | `Inspect 3 metric cards.` |
| **Test Steps** | 1. Review "My Assigned Students" card.<br>2. Review "Completed Sessions" card (e.g. 8/15).<br>3. Review "Average Attendance Rate" card. |
| **Expected Result** | Cards show metrics calculated strictly from students in the instructor's track. |
| **Actual Result** | As expected. Metrics computed strictly for instructor's department. |
| **Status** | **PASSED** |
| **Post-Condition** | Department-specific metrics rendered. |

---

### [TC-DASH-INS-003] "Launch QR Attendance Scanner" Primary Action Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-003` |
| **Title & Description** | **"Launch QR Attendance Scanner" Primary Action Button**<br>Verify that clicking the primary action button opens the Attendance Scanner with track preset to instructor's department. |
| **Pre-Condition** | Instructor is on dashboard. |
| **Test Data** | `Click "Launch QR Attendance Scanner" button.` |
| **Test Steps** | 1. Click the prominent "Launch QR Attendance Scanner" button. |
| **Expected Result** | Scanner modal opens with Department locked to instructor's track (cannot be altered to other tracks). |
| **Actual Result** | As expected. Scanner modal launched with track isolation locked. |
| **Status** | **PASSED** |
| **Post-Condition** | Scanner ready for track-isolated scanning. |

---

### [TC-DASH-INS-004] Active Class Session Quick Setup (Select Session Day 1-15 & Start Time)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-004` |
| **Title & Description** | **Active Class Session Quick Setup (Select Session Day 1-15 & Start Time)**<br>Verify that instructor can quickly configure today's session day and class start time directly from dashboard. |
| **Pre-Condition** | Instructor is on dashboard. |
| **Test Data** | `Select "Day 5", Start Time: "08:00 AM", Grace Period: "15 mins".` |
| **Test Steps** | 1. Select "Day 5 - Environmental Protection Activity" from dropdown.<br>2. Set start time to 08:00 AM.<br>3. Set grace period to 15 minutes.<br>4. Click "Initialize Session". |
| **Expected Result** | Session parameters saved to active session context; scanner launches pre-configured for Day 5. |
| **Actual Result** | As expected. Session configured and scanner initialized with selected parameters. |
| **Status** | **PASSED** |
| **Post-Condition** | Day 5 session initialized. |

---

### [TC-DASH-INS-005] Assigned Department Student Roster Quick View Table

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-005` |
| **Title & Description** | **Assigned Department Student Roster Quick View Table**<br>Verify that the student roster table on instructor dashboard shows only students belonging to the instructor's track. |
| **Pre-Condition** | CWTS Instructor logged in. |
| **Test Data** | `Inspect student table on /instructor/dashboard.` |
| **Test Steps** | 1. Scroll to Students Roster table.<br>2. Verify every student in table has Department="CWTS". |
| **Expected Result** | All listed students have CWTS department; zero ROTC or LTS students appear in table. |
| **Actual Result** | As expected. Full track isolation verified on student roster. |
| **Status** | **PASSED** |
| **Post-Condition** | Track isolation verified. |

---

### [TC-DASH-INS-006] Quick Message Coordinator Button ("Send Message to Admin")

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-006` |
| **Title & Description** | **Quick Message Coordinator Button ("Send Message to Admin")**<br>Verify that clicking quick message navigates directly to /chat with Coordinator conversation active. |
| **Pre-Condition** | Instructor is on dashboard. |
| **Test Data** | `Click "Send Message to Coordinator" button.` |
| **Test Steps** | 1. Click "Message Coordinator" button on dashboard widget. |
| **Expected Result** | Browser navigates to /chat; conversation thread with Admin/Coordinator is automatically opened. |
| **Actual Result** | As expected. Navigated to /chat with coordinator conversation selected. |
| **Status** | **PASSED** |
| **Post-Condition** | Chat thread with Admin active. |

---

### [TC-DASH-INS-007] "Submit Department Report" Action Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-007` |
| **Title & Description** | **"Submit Department Report" Action Button**<br>Verify that clicking submit report navigates to Reports page for submitting activity accomplishments. |
| **Pre-Condition** | Instructor is on dashboard. |
| **Test Data** | `Click "Submit Report" button.` |
| **Test Steps** | 1. Click "Submit Department Report" action button. |
| **Expected Result** | Browser navigates to /reports with submission upload dialog open. |
| **Actual Result** | As expected. Redirected to /reports submission section. |
| **Status** | **PASSED** |
| **Post-Condition** | Report submission dialog active. |

---

### [TC-DASH-INS-008] Permission Enforcement - Grade Sheet Export Restricted for Instructors

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DASH-INS-008` |
| **Title & Description** | **Permission Enforcement - Grade Sheet Export Restricted for Instructors**<br>Verify that instructors do not have access to download or export official master grade sheets (Admin-only restriction). |
| **Pre-Condition** | User is authenticated as Instructor. |
| **Test Data** | `Navigate to /reports; inspect Form 2-B grade export buttons.` |
| **Test Steps** | 1. Open /reports as Instructor.<br>2. Observe Form 2-B Export buttons. |
| **Expected Result** | Master grade export / download buttons are disabled or hidden with notice: "Master Grade Export is restricted to the NSTP Coordinator / Office of Student Development and Services (OSDS)." |
| **Actual Result** | As expected. Export buttons restricted per institutional policy. |
| **Status** | **PASSED** |
| **Post-Condition** | Grade export access denied to instructor role. |

---

## Module 6: Student Records & Roster Management (STUD) (23 Test Cases)

### [TC-STUD-001] Master Student Table - Global Search (Name, Student ID, Email)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-001` |
| **Title & Description** | **Master Student Table - Global Search (Name, Student ID, Email)**<br>Verify that typing into the master search bar filters the student table across name, student ID, and email fields. |
| **Pre-Condition** | User is on /students with official student records loaded. |
| **Test Data** | `Search Query: "2026-0045"` |
| **Test Steps** | 1. Navigate to /students.<br>2. Type "2026-0045" into global search bar. |
| **Expected Result** | Table updates dynamically to show the matching student record. |
| **Actual Result** | As expected. Student with ID 2026-0045 displayed immediately. |
| **Status** | **PASSED** |
| **Post-Condition** | Search results displayed. |

---

### [TC-STUD-002] Master Student Table - Filter by NSTP Component (CWTS / LTS / ROTC)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-002` |
| **Title & Description** | **Master Student Table - Filter by NSTP Component (CWTS / LTS / ROTC)**<br>Verify that choosing an NSTP track from dropdown filters table to that component. |
| **Pre-Condition** | Admin is on /students. |
| **Test Data** | `Select "ROTC" in Component filter dropdown.` |
| **Test Steps** | 1. Click Track filter dropdown.<br>2. Select "ROTC". |
| **Expected Result** | Table displays only students enrolled in ROTC track. |
| **Actual Result** | As expected. Table restricted to ROTC students. |
| **Status** | **PASSED** |
| **Post-Condition** | ROTC filter active. |

---

### [TC-STUD-003] Master Student Table - Filter by Degree Program / Course

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-003` |
| **Title & Description** | **Master Student Table - Filter by Degree Program / Course**<br>Verify that choosing a degree program filters the student roster accordingly. |
| **Pre-Condition** | User is on /students. |
| **Test Data** | `Select "BSIT" from Program filter.` |
| **Test Steps** | 1. Click Program filter dropdown.<br>2. Choose "Bachelor of Science in Information Technology (BSIT)". |
| **Expected Result** | Only BSIT students are displayed in table. |
| **Actual Result** | As expected. Roster filtered to BSIT. |
| **Status** | **PASSED** |
| **Post-Condition** | Program filter active. |

---

### [TC-STUD-004] Master Student Table - Filter by Assigned Section

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-004` |
| **Title & Description** | **Master Student Table - Filter by Assigned Section**<br>Verify that selecting a section (e.g. CWTS-1A) isolates students in that specific section. |
| **Pre-Condition** | User is on /students. |
| **Test Data** | `Select section: "CWTS-1A".` |
| **Test Steps** | 1. Click Section filter dropdown.<br>2. Select "CWTS-1A". |
| **Expected Result** | Table displays only students assigned to section CWTS-1A. |
| **Actual Result** | As expected. Section filter executed cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Section filter active. |

---

### [TC-STUD-005] Master Student Table - Filter by Academic Status (Enrolled, Dropped, Completed)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-005` |
| **Title & Description** | **Master Student Table - Filter by Academic Status (Enrolled, Dropped, Completed)**<br>Verify that filtering by status isolates active, dropped, or completed students. |
| **Pre-Condition** | User is on /students. |
| **Test Data** | `Select status: "Dropped".` |
| **Test Steps** | 1. Click Status filter dropdown.<br>2. Choose "Dropped". |
| **Expected Result** | Table displays only students whose status is Dropped. |
| **Actual Result** | As expected. Only dropped students shown. |
| **Status** | **PASSED** |
| **Post-Condition** | Status filter active. |

---

### [TC-STUD-006] "Add New Student Manually" Button Trigger

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-006` |
| **Title & Description** | **"Add New Student Manually" Button Trigger**<br>Verify that clicking "+ Add Student" opens the manual student registration modal. |
| **Pre-Condition** | Admin is on /students. |
| **Test Data** | `Click "+ Add Student" button.` |
| **Test Steps** | 1. Click "+ Add Student" button at top right of page. |
| **Expected Result** | Manual Student Registration modal opens with empty input form. |
| **Actual Result** | As expected. Add Student modal opened. |
| **Status** | **PASSED** |
| **Post-Condition** | Add student modal displayed. |

---

### [TC-STUD-007] Manual Student Form - Input Validation & Save ("Save Student Record" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-007` |
| **Title & Description** | **Manual Student Form - Input Validation & Save ("Save Student Record" Button)**<br>Verify that submitting valid student details creates a new student in the database. |
| **Pre-Condition** | Add Student modal is open. |
| **Test Data** | `ID: "2026-99001", Name: "Maria Clara Santos", Course: "BSIT", Track: "CWTS", Section: "CWTS-1B"` |
| **Test Steps** | 1. Fill in Student ID, First Name, Last Name, Course, Track, Section, Contact, and Email.<br>2. Click "Save Student Record" button. |
| **Expected Result** | Student record inserted into students table; toast displays "Student added successfully"; modal closes; student appears in table. |
| **Actual Result** | As expected. New student created and displayed in roster. |
| **Status** | **PASSED** |
| **Post-Condition** | New student stored in database. |

---

### [TC-STUD-008] Manual Student Form - "Cancel" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-008` |
| **Title & Description** | **Manual Student Form - "Cancel" Button**<br>Verify that clicking Cancel closes the modal without creating any student record. |
| **Pre-Condition** | Add Student modal is open. |
| **Test Data** | `Click "Cancel" button.` |
| **Test Steps** | 1. Click "Cancel" button in modal. |
| **Expected Result** | Modal closes immediately; no database changes made. |
| **Actual Result** | As expected. Modal closed without side effects. |
| **Status** | **PASSED** |
| **Post-Condition** | Student table unchanged. |

---

### [TC-STUD-009] Action Menu - "View Student Full Profile" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-009` |
| **Title & Description** | **Action Menu - "View Student Full Profile" Button**<br>Verify that clicking the eye icon on a student row opens the comprehensive Student Profile modal. |
| **Pre-Condition** | Student row is visible. |
| **Test Data** | `Click "View Profile" button on row for "Maria Clara Santos".` |
| **Test Steps** | 1. Click the "View Profile" button in the Actions column. |
| **Expected Result** | Student profile modal opens displaying personal information, 2x2 photo, attendance summary, and academic status. |
| **Actual Result** | As expected. Student full profile modal displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Profile modal active. |

---

### [TC-STUD-010] Action Menu - "Edit Student Information" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-010` |
| **Title & Description** | **Action Menu - "Edit Student Information" Button**<br>Verify that clicking the Edit pencil icon opens the edit dialog populated with the student's current data. |
| **Pre-Condition** | Student row is visible. |
| **Test Data** | `Click "Edit" pencil icon on student row.` |
| **Test Steps** | 1. Click the "Edit" button in Actions column. |
| **Expected Result** | Edit Student modal opens; all inputs are pre-populated with student's current database values. |
| **Actual Result** | As expected. Edit modal opened with pre-filled fields. |
| **Status** | **PASSED** |
| **Post-Condition** | Edit modal active. |

---

### [TC-STUD-011] Edit Student Modal - Save Updates ("Update Student Information" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-011` |
| **Title & Description** | **Edit Student Modal - Save Updates ("Update Student Information" Button)**<br>Verify that modifying student information and clicking Update saves changes to database. |
| **Pre-Condition** | Edit modal is open. |
| **Test Data** | `Change section from "CWTS-1B" to "CWTS-1A", update Contact Number.` |
| **Test Steps** | 1. Change Section input to "CWTS-1A".<br>2. Click "Update Student Information" button. |
| **Expected Result** | Database updates student record; toast displays "Student information updated"; table reflects new section. |
| **Actual Result** | As expected. Record updated in database and table. |
| **Status** | **PASSED** |
| **Post-Condition** | Updated data saved in MySQL. |

---

### [TC-STUD-012] Action Menu - "View / Generate Digital ID" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-012` |
| **Title & Description** | **Action Menu - "View / Generate Digital ID" Button**<br>Verify that clicking the ID card icon opens the official Digital ID Card viewer for that student. |
| **Pre-Condition** | Student row is visible. |
| **Test Data** | `Click "Digital ID" icon button.` |
| **Test Steps** | 1. Click the Digital ID card icon in Actions column. |
| **Expected Result** | Digital ID modal opens rendering official CvSU Naic ID layout with 2x2 photo and generated QR code. |
| **Actual Result** | As expected. Digital ID modal rendered for the student. |
| **Status** | **PASSED** |
| **Post-Condition** | Digital ID modal open. |

---

### [TC-STUD-013] Action Menu - "View 15-Session Attendance Matrix" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-013` |
| **Title & Description** | **Action Menu - "View 15-Session Attendance Matrix" Button**<br>Verify that clicking the Calendar/Matrix icon opens the 15-day attendance grid for that specific student. |
| **Pre-Condition** | Student row is visible. |
| **Test Data** | `Click "Attendance Matrix" icon button.` |
| **Test Steps** | 1. Click the Attendance Matrix icon in Actions column. |
| **Expected Result** | Attendance Matrix modal opens displaying Days 1 to 15 attendance status for the student. |
| **Actual Result** | As expected. 15-day matrix modal rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | Attendance matrix modal open. |

---

### [TC-STUD-014] Action Menu - "Change Status" Dropdown (Active to Dropped / Incomplete)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-014` |
| **Title & Description** | **Action Menu - "Change Status" Dropdown (Active to Dropped / Incomplete)**<br>Verify that updating student status via dropdown saves new status and updates color badge. |
| **Pre-Condition** | Student status is "Enrolled". |
| **Test Data** | `Select "Dropped" from status dropdown.` |
| **Test Steps** | 1. Click the Status badge dropdown on student row.<br>2. Select "Dropped".<br>3. Confirm status change prompt. |
| **Expected Result** | Status updates to Dropped with red badge; student attendance eligibility deactivated. |
| **Actual Result** | As expected. Status updated to Dropped in database and UI. |
| **Status** | **PASSED** |
| **Post-Condition** | Student status is Dropped. |

---

### [TC-STUD-015] Action Menu - "Delete Student Record" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-015` |
| **Title & Description** | **Action Menu - "Delete Student Record" Button**<br>Verify that clicking the trash icon prompts a dangerous confirmation modal before deletion. |
| **Pre-Condition** | Admin is on /students. |
| **Test Data** | `Click "Delete" trash icon on student row.` |
| **Test Steps** | 1. Click the trash icon button in Actions column. |
| **Expected Result** | Confirmation dialog appears: "Are you sure you want to permanently delete this student record? This action cannot be undone." |
| **Actual Result** | As expected. Confirmation prompt displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Confirmation modal open. |

---

### [TC-STUD-016] Delete Student Modal - Confirmation Dialog ("Confirm Delete" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-016` |
| **Title & Description** | **Delete Student Modal - Confirmation Dialog ("Confirm Delete" Button)**<br>Verify that confirming deletion removes student and cascade-cleans associated attendance records. |
| **Pre-Condition** | Delete confirmation modal is open. |
| **Test Data** | `Click "Confirm Delete" button.` |
| **Test Steps** | 1. Click "Confirm Delete" button in modal. |
| **Expected Result** | Student record is deleted from students table; associated attendance logs removed; success toast displayed; row disappears from table. |
| **Actual Result** | As expected. Student deleted cleanly from database. |
| **Status** | **PASSED** |
| **Post-Condition** | Student record no longer exists. |

---

### [TC-STUD-017] Delete Student Modal - "Cancel" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-017` |
| **Title & Description** | **Delete Student Modal - "Cancel" Button**<br>Verify that clicking Cancel prevents deletion and keeps student record safe. |
| **Pre-Condition** | Delete confirmation modal is open. |
| **Test Data** | `Click "Cancel" button in delete dialog.` |
| **Test Steps** | 1. Click "Cancel" button. |
| **Expected Result** | Dialog closes; student record remains untouched in table and database. |
| **Actual Result** | As expected. Deletion cancelled. |
| **Status** | **PASSED** |
| **Post-Condition** | Student record preserved. |

---

### [TC-STUD-018] Batch Operations - Multi-select Row Checkboxes (Select All / Deselect All)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-018` |
| **Title & Description** | **Batch Operations - Multi-select Row Checkboxes (Select All / Deselect All)**<br>Verify that checking the header checkbox selects all visible students on the page. |
| **Pre-Condition** | Multiple student rows displayed in table. |
| **Test Data** | `Click master checkbox in table header.` |
| **Test Steps** | 1. Click header checkbox.<br>2. Verify all rows checked.<br>3. Click header checkbox again. |
| **Expected Result** | First click selects all rows and opens batch actions toolbar; second click deselects all rows. |
| **Actual Result** | As expected. Multi-select toggled accurately. |
| **Status** | **PASSED** |
| **Post-Condition** | Batch selection state responsive. |

---

### [TC-STUD-019] Batch Operations - "Batch Assign Section" Modal & Save Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-019` |
| **Title & Description** | **Batch Operations - "Batch Assign Section" Modal & Save Button**<br>Verify that admin can select multiple students and assign them to a section simultaneously. |
| **Pre-Condition** | 5 students selected via checkboxes. |
| **Test Data** | `Assign section: "CWTS-1C".` |
| **Test Steps** | 1. Click "Batch Assign Section" button in toolbar.<br>2. Select "CWTS-1C" from section dropdown in modal.<br>3. Click "Apply Section to Selected Students". |
| **Expected Result** | All 5 selected students have their section updated to CWTS-1C; toast confirms batch update. |
| **Actual Result** | As expected. Batch section assignment succeeded. |
| **Status** | **PASSED** |
| **Post-Condition** | 5 students assigned to CWTS-1C. |

---

### [TC-STUD-020] Batch Operations - "Batch Print Digital IDs" Button Trigger

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-020` |
| **Title & Description** | **Batch Operations - "Batch Print Digital IDs" Button Trigger**<br>Verify that clicking Batch Print from the selection toolbar opens print modal with selected students pre-checked. |
| **Pre-Condition** | 4 students selected in table. |
| **Test Data** | `Click "Batch Print IDs (4)" button.` |
| **Test Steps** | 1. Select 4 students.<br>2. Click "Batch Print IDs" in batch toolbar. |
| **Expected Result** | Batch Print modal opens with the 4 selected student ID cards loaded in print layout. |
| **Actual Result** | As expected. Batch Print modal opened with selected students. |
| **Status** | **PASSED** |
| **Post-Condition** | Batch ID modal ready for printing. |

---

### [TC-STUD-021] "Export Master Student Roster to Excel (.xlsx)" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-021` |
| **Title & Description** | **"Export Master Student Roster to Excel (.xlsx)" Button**<br>Verify that clicking Export to Excel generates and downloads an `.xlsx` workbook containing student roster. |
| **Pre-Condition** | User is on /students. |
| **Test Data** | `Click "Export to Excel" button.` |
| **Test Steps** | 1. Click "Export to Excel" button above table. |
| **Expected Result** | ExcelJS compiles formatted spreadsheet with columns (Student ID, Name, Track, Course, Section, Status); browser downloads `.xlsx` file. |
| **Actual Result** | As expected. Excel workbook generated and downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | Excel file saved on client computer. |

---

### [TC-STUD-022] "Export Master Student Roster to CSV" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-022` |
| **Title & Description** | **"Export Master Student Roster to CSV" Button**<br>Verify that clicking Export to CSV downloads comma-separated text file of student list. |
| **Pre-Condition** | User is on /students. |
| **Test Data** | `Click "Export CSV" option.` |
| **Test Steps** | 1. Click dropdown arrow next to Export button.<br>2. Choose "Export as CSV". |
| **Expected Result** | Browser downloads standard `.csv` file formatted with proper headers. |
| **Actual Result** | As expected. CSV file exported successfully. |
| **Status** | **PASSED** |
| **Post-Condition** | CSV file saved on client computer. |

---

### [TC-STUD-023] Table Pagination - "Next Page", "Previous Page", and Rows Per Page Dropdown

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-STUD-023` |
| **Title & Description** | **Table Pagination - "Next Page", "Previous Page", and Rows Per Page Dropdown**<br>Verify that pagination controls navigate between pages and change rows per page (10, 25, 50). |
| **Pre-Condition** | Total students exceeds 10. |
| **Test Data** | `Click "Next Page", then change rows per page to 25.` |
| **Test Steps** | 1. Click "Next Page" button at bottom right.<br>2. Observe table page 2 rows.<br>3. Click Rows Per Page dropdown and select "25". |
| **Expected Result** | Page updates smoothly to next chunk of records; changing rows per page re-renders table with 25 records. |
| **Actual Result** | As expected. Pagination and page size adjustments executed without delay. |
| **Status** | **PASSED** |
| **Post-Condition** | Table displayed according to pagination settings. |

---

## Module 7: Smart QR Attendance Scanner & Manual Console (ATTN-SCAN) (20 Test Cases)

### [TC-ATTN-SCAN-001] Scanner Modal Open ("Launch Attendance Scanner" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-001` |
| **Title & Description** | **Scanner Modal Open ("Launch Attendance Scanner" Button)**<br>Verify that clicking the scanner button opens the Attendance Scanner modal and initializes camera subsystem. |
| **Pre-Condition** | Instructor or Admin is logged in. |
| **Test Data** | `Click "Launch Attendance Scanner" button.` |
| **Test Steps** | 1. Click "Launch Attendance Scanner" button on dashboard or header. |
| **Expected Result** | Modal overlays screen; camera status indicators and session configuration controls render. |
| **Actual Result** | As expected. Scanner modal opened cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Scanner modal displayed and ready. |

---

### [TC-ATTN-SCAN-002] Session Configuration - Select Day (Day 1 to Day 15 Dropdown)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-002` |
| **Title & Description** | **Session Configuration - Select Day (Day 1 to Day 15 Dropdown)**<br>Verify that user can select any session from Day 1 to Day 15 corresponding to the 15-week curriculum. |
| **Pre-Condition** | Scanner modal is open. |
| **Test Data** | `Select "Day 3 - Community Profiling & Needs Assessment".` |
| **Test Steps** | 1. Click Session Day dropdown.<br>2. Choose "Day 3". |
| **Expected Result** | Selected session day is updated in state; session activity title updates automatically. |
| **Actual Result** | As expected. Session Day set to Day 3. |
| **Status** | **PASSED** |
| **Post-Condition** | Session Day 3 active in context. |

---

### [TC-ATTN-SCAN-003] Session Configuration - Enter Activity / Training Topic Input

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-003` |
| **Title & Description** | **Session Configuration - Enter Activity / Training Topic Input**<br>Verify that user can type a customized activity name or topic for the attendance record. |
| **Pre-Condition** | Scanner modal is open. |
| **Test Data** | `Activity Input: "Campus Tree Planting & Biodiversity Survey"` |
| **Test Steps** | 1. Click Activity Name input field.<br>2. Type "Campus Tree Planting & Biodiversity Survey". |
| **Expected Result** | Custom activity title is stored and will be attached to every attendance record generated during the session. |
| **Actual Result** | As expected. Custom activity title saved in session state. |
| **Status** | **PASSED** |
| **Post-Condition** | Custom activity title attached to session. |

---

### [TC-ATTN-SCAN-004] Session Configuration - Scan Type Selector ("Time-In" vs "Time-Out")

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-004` |
| **Title & Description** | **Session Configuration - Scan Type Selector ("Time-In" vs "Time-Out")**<br>Verify that toggling between Time-In and Time-Out changes recording mode and column mapping. |
| **Pre-Condition** | Scanner modal is open. |
| **Test Data** | `Click "Time-Out" toggle button.` |
| **Test Steps** | 1. Observe default selection is "Time-In".<br>2. Click "Time-Out" button. |
| **Expected Result** | Scan mode switches to Time-Out; scanner UI highlights blue/orange indicator; scans will now record departure timestamp. |
| **Actual Result** | As expected. Scan mode toggled to Time-Out. |
| **Status** | **PASSED** |
| **Post-Condition** | Scan mode is Time-Out. |

---

### [TC-ATTN-SCAN-005] Session Configuration - Class Start Time & Grace Period Dropdown

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-005` |
| **Title & Description** | **Session Configuration - Class Start Time & Grace Period Dropdown**<br>Verify that setting class start time and grace period (10, 15, 30 mins) establishes the cutoff time for lateness. |
| **Pre-Condition** | Scanner modal is open. |
| **Test Data** | `Start Time: "08:00 AM", Grace Period: "15 minutes" (Cutoff = 08:15:59 AM)` |
| **Test Steps** | 1. Set Class Start Time to 08:00 AM.<br>2. Select "15 minutes" from Grace Period dropdown. |
| **Expected Result** | Lateness engine calculates Cutoff Time as 08:15:59 AM; any scan after this timestamp will be flagged as Late. |
| **Actual Result** | As expected. Cutoff calculated accurately. |
| **Status** | **PASSED** |
| **Post-Condition** | Lateness cutoff established in engine. |

---

### [TC-ATTN-SCAN-006] Scanner Mode Switcher - "Camera QR Scanner" vs "Manual Student ID Console"

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-006` |
| **Title & Description** | **Scanner Mode Switcher - "Camera QR Scanner" vs "Manual Student ID Console"**<br>Verify that user can toggle between camera scanning mode and manual student ID entry console. |
| **Pre-Condition** | Scanner modal is open. |
| **Test Data** | `Click "Manual Entry" tab, then "Camera Scanner" tab.` |
| **Test Steps** | 1. Click "Manual Entry" tab button.<br>2. Observe camera stops and manual ID text input appears.<br>3. Click "Camera Scanner" tab button. |
| **Expected Result** | UI switches smoothly between camera viewfinder and text entry console without errors. |
| **Actual Result** | As expected. Mode switcher toggled smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Selected scanner mode active. |

---

### [TC-ATTN-SCAN-007] Camera QR Scanner - "Start Camera" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-007` |
| **Title & Description** | **Camera QR Scanner - "Start Camera" Button**<br>Verify that clicking "Start Camera" requests video stream and mounts `html5-qrcode` scanner. |
| **Pre-Condition** | Camera mode selected; camera permission available. |
| **Test Data** | `Click "Start Camera" button.` |
| **Test Steps** | 1. Click green "Start Camera" button. |
| **Expected Result** | Camera viewfinder activates; video feed is visible; scanning reticle animates. |
| **Actual Result** | As expected. Camera stream started with scanning reticle overlay. |
| **Status** | **PASSED** |
| **Post-Condition** | Camera actively scanning for QR codes. |

---

### [TC-ATTN-SCAN-008] Camera QR Scanner - Camera Device Selection Dropdown (Front vs Rear Camera)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-008` |
| **Title & Description** | **Camera QR Scanner - Camera Device Selection Dropdown (Front vs Rear Camera)**<br>Verify that user can switch between rear and front cameras on multi-camera laptops and mobile devices. |
| **Pre-Condition** | Camera stream is running. |
| **Test Data** | `Select "Back Camera (Environment)" from dropdown.` |
| **Test Steps** | 1. Click Camera Device dropdown.<br>2. Select alternate camera device. |
| **Expected Result** | Video feed seamlessly switches to the selected camera hardware without crashing. |
| **Actual Result** | As expected. Video feed switched cleanly to chosen device. |
| **Status** | **PASSED** |
| **Post-Condition** | Selected camera active. |

---

### [TC-ATTN-SCAN-009] Camera QR Scanner - "Stop Camera" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-009` |
| **Title & Description** | **Camera QR Scanner - "Stop Camera" Button**<br>Verify that clicking "Stop Camera" releases video hardware and turns off device webcam light. |
| **Pre-Condition** | Camera stream is actively running. |
| **Test Data** | `Click "Stop Camera" button.` |
| **Test Steps** | 1. Click red "Stop Camera" button. |
| **Expected Result** | Camera stream halts; hardware tracks stopped; webcam light turns off; placeholder displayed. |
| **Actual Result** | As expected. Camera hardware released cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Camera stream inactive. |

---

### [TC-ATTN-SCAN-010] Camera Scan - Successful Time-In within Grace Period (On-Time Status & Audio Chime)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-010` |
| **Title & Description** | **Camera Scan - Successful Time-In within Grace Period (On-Time Status & Audio Chime)**<br>Verify that scanning a valid student ID QR code before cutoff records Time-In as "Present" with success chime. |
| **Pre-Condition** | Scanner running; student "Juan Dela Cruz" belongs to instructor's track; current time is before cutoff. |
| **Test Data** | `QR Code payload: JSON containing studentId="2026-10023", track="CWTS", hash="[VALID_HASH]"` |
| **Test Steps** | 1. Present student QR code to camera.<br>2. Wait for scanner detection. |
| **Expected Result** | Synthesized high-pitched success chime plays via Web Audio API; student photo and name flash on screen; status logged as "Present / On-Time"; student added to session list. |
| **Actual Result** | As expected. Success beep sounded; student logged as Present at current timestamp. |
| **Status** | **PASSED** |
| **Post-Condition** | Attendance record saved in MySQL database with is_late=0. |

---

### [TC-ATTN-SCAN-011] Camera Scan - Successful Time-In after Grace Period (Late Status & Audio Chime)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-011` |
| **Title & Description** | **Camera Scan - Successful Time-In after Grace Period (Late Status & Audio Chime)**<br>Verify that scanning a student QR code after the cutoff time records Time-In as "Late" with distinct indicator. |
| **Pre-Condition** | Current time is 08:22 AM; cutoff time was 08:15 AM. |
| **Test Data** | `QR Code for valid student in same track.` |
| **Test Steps** | 1. Present student QR code to camera after cutoff. |
| **Expected Result** | Success chime plays; status badge displays yellow "Late" badge; record saved in database with is_late=1. |
| **Actual Result** | As expected. Student marked Late in session logs and database. |
| **Status** | **PASSED** |
| **Post-Condition** | Attendance record saved with is_late=1. |

---

### [TC-ATTN-SCAN-012] Camera Scan - Successful Time-Out Recording

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-012` |
| **Title & Description** | **Camera Scan - Successful Time-Out Recording**<br>Verify that scanning student in Time-Out mode records departure time in existing session record. |
| **Pre-Condition** | Student already has a Time-In record for today's session; Scan Type is set to "Time-Out". |
| **Test Data** | `QR Code of student with existing Time-In.` |
| **Test Steps** | 1. Switch mode to "Time-Out".<br>2. Scan student QR code. |
| **Expected Result** | System updates today's attendance record with time_out timestamp; displays toast "Time-Out recorded for [Student Name]". |
| **Actual Result** | As expected. Time-out timestamp committed to record. |
| **Status** | **PASSED** |
| **Post-Condition** | time_out column populated in attendance_records. |

---

### [TC-ATTN-SCAN-013] Camera Scan - Duplicate Scan Detection in Same Session (Warning Alert & Reject)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-013` |
| **Title & Description** | **Camera Scan - Duplicate Scan Detection in Same Session (Warning Alert & Reject)**<br>Verify that scanning the same student twice in the same session mode prevents duplicate record creation. |
| **Pre-Condition** | Student already scanned Time-In 5 minutes ago. |
| **Test Data** | `Scan the same student QR code again in Time-In mode.` |
| **Test Steps** | 1. Present the already timed-in student QR code to camera. |
| **Expected Result** | System detects existing scan in current session; plays warning chime; displays banner: "Student [Name] is already timed-in for this session"; duplicate scan ignored. |
| **Actual Result** | As expected. Duplicate scan blocked without duplicating database rows. |
| **Status** | **PASSED** |
| **Post-Condition** | Session log remains at 1 entry for this student. |

---

### [TC-ATTN-SCAN-014] Camera Scan - Track Isolation Enforcement (Mismatched Track Rejection)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-014` |
| **Title & Description** | **Camera Scan - Track Isolation Enforcement (Mismatched Track Rejection)**<br>Verify that when a ROTC instructor scans a CWTS student, the system strictly blocks the scan, plays error buzzer, and does not crash. |
| **Pre-Condition** | Logged in user is ROTC Instructor (department="ROTC"); scanned student belongs to CWTS. |
| **Test Data** | `QR Code for CWTS Student "Maria Santos" (department="CWTS").` |
| **Test Steps** | 1. ROTC Instructor scans CWTS student QR code. |
| **Expected Result** | Track Isolation Engine intervenes: plays low error buzzer; displays red warning toast: "Track Mismatch: This student belongs to CWTS and cannot be scanned by ROTC instructor"; student is NOT added to session logs; scanner continues running smoothly without crashing. |
| **Actual Result** | As expected. Boundary check caught mismatch; error buzzer played; zero records inserted; scanner stayed active. |
| **Status** | **PASSED** |
| **Post-Condition** | Database unaffected; CWTS student record completely untouched. |

---

### [TC-ATTN-SCAN-015] Manual ID Console - Enter Valid Student ID & Click "Record Attendance"

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-015` |
| **Title & Description** | **Manual ID Console - Enter Valid Student ID & Click "Record Attendance"**<br>Verify that typing a student ID manually records attendance identically to QR scanning. |
| **Pre-Condition** | Scanner modal is in Manual Entry mode. |
| **Test Data** | `Student ID: "2026-10023"` |
| **Test Steps** | 1. Type "2026-10023" into the Student ID input field.<br>2. Click "Record Attendance" button (or press Enter key). |
| **Expected Result** | System finds student in database, validates track matching, plays success chime, and adds student to session attendance table. |
| **Actual Result** | As expected. Attendance recorded via manual ID entry. |
| **Status** | **PASSED** |
| **Post-Condition** | Attendance recorded in database. |

---

### [TC-ATTN-SCAN-016] Manual ID Console - Enter Invalid / Unregistered Student ID

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-016` |
| **Title & Description** | **Manual ID Console - Enter Invalid / Unregistered Student ID**<br>Verify system behavior when user types a non-existent student ID in manual console. |
| **Pre-Condition** | Manual Entry mode is active. |
| **Test Data** | `Student ID: "9999-00000"` |
| **Test Steps** | 1. Type "9999-00000" into input.<br>2. Click "Record Attendance". |
| **Expected Result** | System plays error audio; displays warning: "Student ID 9999-00000 not found in database"; input field cleared and focused. |
| **Actual Result** | As expected. Error alert shown; no record created. |
| **Status** | **PASSED** |
| **Post-Condition** | Database unaffected. |

---

### [TC-ATTN-SCAN-017] Manual ID Console - Enter Student ID with Mismatched Track

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-017` |
| **Title & Description** | **Manual ID Console - Enter Student ID with Mismatched Track**<br>Verify that manual ID entry also enforces strict track isolation between departments. |
| **Pre-Condition** | Logged in as CWTS Instructor; Student ID belongs to ROTC student. |
| **Test Data** | `Student ID: "2026-30012" (ROTC Student)` |
| **Test Steps** | 1. CWTS Instructor types ROTC student ID "2026-30012".<br>2. Click "Record Attendance". |
| **Expected Result** | System detects track mismatch; displays error toast "Track Mismatch: Student is enrolled in ROTC"; scan rejected. |
| **Actual Result** | As expected. Manual entry blocked by track isolation. |
| **Status** | **PASSED** |
| **Post-Condition** | Attendance rejected; no record saved. |

---

### [TC-ATTN-SCAN-018] Real-Time Session Logs Table - Remove / Undo Scanned Entry ("Delete" Icon Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-018` |
| **Title & Description** | **Real-Time Session Logs Table - Remove / Undo Scanned Entry ("Delete" Icon Button)**<br>Verify that an instructor can remove an accidental scan entry from the current live session log. |
| **Pre-Condition** | Session table contains 3 scanned students. |
| **Test Data** | `Click trash icon button on 2nd student row.` |
| **Test Steps** | 1. Locate student entry in the live session table below scanner.<br>2. Click the red trash icon button on that row. |
| **Expected Result** | Record is removed from current session table and deleted from database; session count decrements. |
| **Actual Result** | As expected. Erroneous entry deleted cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Student removed from session log. |

---

### [TC-ATTN-SCAN-019] Session Log Action - "Export Live Session to Excel" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-019` |
| **Title & Description** | **Session Log Action - "Export Live Session to Excel" Button**<br>Verify that clicking Export Session generates an immediate Excel spreadsheet of today's scanned attendees. |
| **Pre-Condition** | Active session has 10 scanned students. |
| **Test Data** | `Click "Export Session (Excel)" button.` |
| **Test Steps** | 1. Click "Export Session (Excel)" button above live session table. |
| **Expected Result** | ExcelJS compiles spreadsheet containing Student ID, Name, Track, Time-In, Time-Out, and Status; browser downloads file. |
| **Actual Result** | As expected. Session attendance exported to Excel spreadsheet. |
| **Status** | **PASSED** |
| **Post-Condition** | Excel file downloaded to client machine. |

---

### [TC-ATTN-SCAN-020] Finalize Session - "Save and Close Attendance Session" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-SCAN-020` |
| **Title & Description** | **Finalize Session - "Save and Close Attendance Session" Button**<br>Verify that clicking Save and Close finalizes session records and dismisses scanner modal. |
| **Pre-Condition** | Session scanning completed. |
| **Test Data** | `Click "Save and Close Session" button.` |
| **Test Steps** | 1. Click "Save and Close Session" button at bottom right of modal.<br>2. Confirm close action. |
| **Expected Result** | Camera stream stops; session statistics saved; dashboard attendance metrics update immediately; modal closes. |
| **Actual Result** | As expected. Session finalized and closed cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Session completed; modal dismissed. |

---

## Module 8: 15-Session Attendance Matrix & Records (ATTN-MAT) (8 Test Cases)

### [TC-ATTN-MAT-001] Attendance Matrix Modal Open ("Attendance Matrix" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-001` |
| **Title & Description** | **Attendance Matrix Modal Open ("Attendance Matrix" Button)**<br>Verify that clicking the Attendance Matrix button opens the 15-session grid modal for selected student or section. |
| **Pre-Condition** | User is on Student Management page. |
| **Test Data** | `Click "Attendance Matrix" icon button on student row.` |
| **Test Steps** | 1. Locate student row.<br>2. Click the Calendar / Matrix icon in Actions column. |
| **Expected Result** | Matrix modal opens displaying 15 columns (Day 1 through Day 15) with status chips and summary counters. |
| **Actual Result** | As expected. Matrix modal rendered with 15 session columns. |
| **Status** | **PASSED** |
| **Post-Condition** | Matrix modal visible and interactive. |

---

### [TC-ATTN-MAT-002] 15-Session Visual Matrix Grid Display (Day 1 to Day 15 Status Icons)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-002` |
| **Title & Description** | **15-Session Visual Matrix Grid Display (Day 1 to Day 15 Status Icons)**<br>Verify that each session day cell shows correct color-coded badge: Present (Green), Late (Yellow), Absent (Red), Excused (Blue). |
| **Pre-Condition** | Student has attendance records across multiple days. |
| **Test Data** | `Inspect Day 1 (Present), Day 2 (Late), Day 3 (Absent), Day 4 (Excused).` |
| **Test Steps** | 1. Observe Day 1 through Day 4 cells in the grid. |
| **Expected Result** | Each cell displays the appropriate letter badge and background color according to database attendance records. |
| **Actual Result** | As expected. Badges rendered with correct color codes and symbols. |
| **Status** | **PASSED** |
| **Post-Condition** | Grid accurately reflects database state. |

---

### [TC-ATTN-MAT-003] Manual Cell Override - Click Day Cell & Select Status

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-003` |
| **Title & Description** | **Manual Cell Override - Click Day Cell & Select Status**<br>Verify that authorized faculty can manually override an attendance status (e.g. from Absent to Excused with medical excuse). |
| **Pre-Condition** | Matrix modal is open. |
| **Test Data** | `Click Day 3 (Absent) cell; change to "Excused".` |
| **Test Steps** | 1. Click on the Day 3 cell.<br>2. Dropdown menu opens showing options: Present, Late, Absent, Excused.<br>3. Select "Excused". |
| **Expected Result** | Cell status updates immediately to "Excused" (Blue badge); database attendance_records table is updated; toast confirms "Status updated to Excused". |
| **Actual Result** | As expected. Manual override committed to database. |
| **Status** | **PASSED** |
| **Post-Condition** | Day 3 status is Excused. |

---

### [TC-ATTN-MAT-004] Automatic Metric Recalculation (Total Present, Late, Absent, Attendance %)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-004` |
| **Title & Description** | **Automatic Metric Recalculation (Total Present, Late, Absent, Attendance %)**<br>Verify that overriding a cell immediately updates summary statistics at the top of the matrix. |
| **Pre-Condition** | Cell overridden from Absent to Excused. |
| **Test Data** | `Observe summary counters before and after override.` |
| **Test Steps** | 1. Note initial Absent count (e.g. 1).<br>2. Change cell to Excused.<br>3. Inspect summary header. |
| **Expected Result** | Absent count decrements from 1 to 0; Excused increments from 0 to 1; Overall Attendance Rate % recalculates in real-time. |
| **Actual Result** | As expected. Summary counters recalculated reactively. |
| **Status** | **PASSED** |
| **Post-Condition** | Summary counters reflect new values. |

---

### [TC-ATTN-MAT-005] "Export Matrix to Excel (.xlsx)" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-005` |
| **Title & Description** | **"Export Matrix to Excel (.xlsx)" Button**<br>Verify that clicking Export Matrix compiles and downloads an official 15-day attendance roster in Excel format. |
| **Pre-Condition** | Matrix modal is open. |
| **Test Data** | `Click "Export Matrix (Excel)" button.` |
| **Test Steps** | 1. Click "Export Matrix (Excel)" button at top right of modal. |
| **Expected Result** | ExcelJS compiles spreadsheet containing Student Name, ID, Course, and columns Day 1 to Day 15 plus totals; file downloads. |
| **Actual Result** | As expected. 15-day matrix exported to `.xlsx` file. |
| **Status** | **PASSED** |
| **Post-Condition** | Excel matrix file downloaded. |

---

### [TC-ATTN-MAT-006] "Export Matrix to PDF" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-006` |
| **Title & Description** | **"Export Matrix to PDF" Button**<br>Verify that clicking Export to PDF generates a standardized printable landscape PDF report of the 15-session matrix. |
| **Pre-Condition** | Matrix modal is open. |
| **Test Data** | `Click "Export Matrix (PDF)" button.` |
| **Test Steps** | 1. Click "Export Matrix (PDF)" button. |
| **Expected Result** | jsPDF renders CvSU Naic official header, student information, and complete 15-day grid in landscape format; downloads PDF. |
| **Actual Result** | As expected. Landscape PDF matrix generated and downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | PDF document downloaded. |

---

### [TC-ATTN-MAT-007] "Print Attendance Matrix Sheet" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-007` |
| **Title & Description** | **"Print Attendance Matrix Sheet" Button**<br>Verify that clicking Print triggers the browser's print preview dialog with print-optimized CSS styles. |
| **Pre-Condition** | Matrix modal is open. |
| **Test Data** | `Click "Print Matrix" button.` |
| **Test Steps** | 1. Click "Print Matrix" button. |
| **Expected Result** | Native browser print preview opens; table headers repeated; background graphics enabled for printing. |
| **Actual Result** | As expected. Print window displayed with clean printable layout. |
| **Status** | **PASSED** |
| **Post-Condition** | Print dialog ready. |

---

### [TC-ATTN-MAT-008] Close Attendance Matrix Modal ("Close" / "X" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-ATTN-MAT-008` |
| **Title & Description** | **Close Attendance Matrix Modal ("Close" / "X" Button)**<br>Verify that clicking the Close button or clicking outside modal backdrop dismisses the dialog. |
| **Pre-Condition** | Matrix modal is open. |
| **Test Data** | `Click "Close (X)" button.` |
| **Test Steps** | 1. Click the X close button at top right of modal. |
| **Expected Result** | Modal closes smoothly; user returns to Student Management table. |
| **Actual Result** | As expected. Modal dismissed without errors. |
| **Status** | **PASSED** |
| **Post-Condition** | Student Management table active. |

---

## Module 9: Digital ID Generation & Batch Printing (DIG-ID) (11 Test Cases)

### [TC-DIG-ID-001] Single Digital ID Modal Open ("View Digital ID" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-001` |
| **Title & Description** | **Single Digital ID Modal Open ("View Digital ID" Button)**<br>Verify that clicking Digital ID button renders the official CvSU Naic standardized ID card with student photo and details. |
| **Pre-Condition** | Enrolled student exists in database. |
| **Test Data** | `Click "Digital ID" button for student "Juan Dela Cruz".` |
| **Test Steps** | 1. Navigate to /students.<br>2. Click ID card icon on student row. |
| **Expected Result** | Modal displays high-resolution ID card front layout featuring CvSU Naic logo, student 2x2 photo, name, course, track, student number, and anti-tamper QR code. |
| **Actual Result** | As expected. ID card rendered with university branding and student details. |
| **Status** | **PASSED** |
| **Post-Condition** | Digital ID modal active. |

---

### [TC-DIG-ID-002] Dynamic Anti-Tamper QR Code Display Verification

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-002` |
| **Title & Description** | **Dynamic Anti-Tamper QR Code Display Verification**<br>Verify that the generated QR code contains HMAC encrypted payload and student verification hash. |
| **Pre-Condition** | Digital ID modal is open. |
| **Test Data** | `Scan displayed QR code with a generic QR scanner app.` |
| **Test Steps** | 1. Observe QR code on digital ID card.<br>2. Scan QR code with smartphone scanner. |
| **Expected Result** | Decoded payload contains JSON payload with studentId, fullName, track, and security verification token. |
| **Actual Result** | As expected. Encrypted payload verified with matching student hash. |
| **Status** | **PASSED** |
| **Post-Condition** | Anti-tampering hash validated. |

---

### [TC-DIG-ID-003] "Download Digital ID as PNG" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-003` |
| **Title & Description** | **"Download Digital ID as PNG" Button**<br>Verify that clicking Download PNG exports a high-definition image of the ID card via `html2canvas`. |
| **Pre-Condition** | Digital ID modal is open. |
| **Test Data** | `Click "Download PNG" button.` |
| **Test Steps** | 1. Click "Download Image (PNG)" button. |
| **Expected Result** | html2canvas rasterizes the card DOM element at 2x pixel ratio; browser downloads file `NSTP_ID_[StudentID].png`. |
| **Actual Result** | As expected. High-resolution PNG image generated and downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | PNG file saved on user machine. |

---

### [TC-DIG-ID-004] "Download Digital ID as PDF" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-004` |
| **Title & Description** | **"Download Digital ID as PDF" Button**<br>Verify that clicking Download PDF exports an official printable vector PDF of the ID card. |
| **Pre-Condition** | Digital ID modal is open. |
| **Test Data** | `Click "Download PDF" button.` |
| **Test Steps** | 1. Click "Download PDF" button. |
| **Expected Result** | jsPDF compiles standard ID card dimensions (85.60 mm × 53.98 mm) into PDF format and downloads `NSTP_ID_[StudentID].pdf`. |
| **Actual Result** | As expected. Printable PDF generated and downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | PDF file saved on client computer. |

---

### [TC-DIG-ID-005] "Print Single ID Card" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-005` |
| **Title & Description** | **"Print Single ID Card" Button**<br>Verify that clicking Print Card opens browser print preview configured for standard ID dimensions. |
| **Pre-Condition** | Digital ID modal is open. |
| **Test Data** | `Click "Print ID Card" button.` |
| **Test Steps** | 1. Click "Print Card" button. |
| **Expected Result** | Browser print dialog opens with card centered on page with exact physical print dimensions. |
| **Actual Result** | As expected. Print preview displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Print dialog ready. |

---

### [TC-DIG-ID-006] Batch ID Print Modal Open ("Batch Print IDs" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-006` |
| **Title & Description** | **Batch ID Print Modal Open ("Batch Print IDs" Button)**<br>Verify that clicking Batch Print IDs from dashboard or student list opens the bulk ID print generator. |
| **Pre-Condition** | User is on Student Management page. |
| **Test Data** | `Click "Batch Print IDs" button at top of page.` |
| **Test Steps** | 1. Click "Batch Print IDs" button. |
| **Expected Result** | Batch Print modal opens with track filters, section selectors, and card print layout grid. |
| **Actual Result** | As expected. Batch ID Print modal displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Batch Print modal active. |

---

### [TC-DIG-ID-007] Batch ID Filter by Track (CWTS / LTS / ROTC) & Section Dropdown

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-007` |
| **Title & Description** | **Batch ID Filter by Track (CWTS / LTS / ROTC) & Section Dropdown**<br>Verify that changing track or section filters updates the cards queued for bulk printing. |
| **Pre-Condition** | Batch ID modal is open. |
| **Test Data** | `Filter: Track="CWTS", Section="CWTS-1A".` |
| **Test Steps** | 1. Select "CWTS" in Track dropdown.<br>2. Select "CWTS-1A" in Section dropdown. |
| **Expected Result** | Print preview grid updates to display only ID cards of students belonging to section CWTS-1A. |
| **Actual Result** | As expected. Filtered cards displayed in grid. |
| **Status** | **PASSED** |
| **Post-Condition** | Section CWTS-1A queued for batch printing. |

---

### [TC-DIG-ID-008] Batch ID Card Selection (Select All / Invert Selection Checkboxes)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-008` |
| **Title & Description** | **Batch ID Card Selection (Select All / Invert Selection Checkboxes)**<br>Verify that user can select or deselect specific student cards from the batch print queue. |
| **Pre-Condition** | Batch ID modal is open with 12 cards displayed. |
| **Test Data** | `Click "Deselect All", then check 3 individual cards.` |
| **Test Steps** | 1. Click "Deselect All" button.<br>2. Manually check the checkboxes for 3 specific student cards. |
| **Expected Result** | Print counter updates to "3 cards selected for printing"; unselected cards are dimmed. |
| **Actual Result** | As expected. Selection updated to 3 cards. |
| **Status** | **PASSED** |
| **Post-Condition** | 3 cards selected in queue. |

---

### [TC-DIG-ID-009] Batch ID Print Layout Preview (A4 Sheet Grid 8-per-page)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-009` |
| **Title & Description** | **Batch ID Print Layout Preview (A4 Sheet Grid 8-per-page)**<br>Verify that batch print organizes ID cards in an 8-card grid per A4 sheet with crop cut marks. |
| **Pre-Condition** | Batch ID modal is open. |
| **Test Data** | `Inspect preview layout mode.` |
| **Test Steps** | 1. Switch to "A4 Sheet Preview" tab in modal. |
| **Expected Result** | Cards are arranged in 2 columns × 4 rows per page with light boundary guides for physical paper cutting. |
| **Actual Result** | As expected. 8-up layout rendered with cutting guides. |
| **Status** | **PASSED** |
| **Post-Condition** | A4 layout verified. |

---

### [TC-DIG-ID-010] "Print All Selected ID Cards" Trigger Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-010` |
| **Title & Description** | **"Print All Selected ID Cards" Trigger Button**<br>Verify that clicking Print All triggers bulk PDF compilation or browser print dialog with all selected cards. |
| **Pre-Condition** | 8 cards selected. |
| **Test Data** | `Click "Print All Selected IDs (8)" button.` |
| **Test Steps** | 1. Click "Print Selected IDs" button. |
| **Expected Result** | Multi-page print preview is generated containing all 8 selected ID cards ready for cardstock printing. |
| **Actual Result** | As expected. Print preview opened with all selected cards. |
| **Status** | **PASSED** |
| **Post-Condition** | Bulk print job triggered. |

---

### [TC-DIG-ID-011] Close Batch ID Modal ("Close" / "X" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-DIG-ID-011` |
| **Title & Description** | **Close Batch ID Modal ("Close" / "X" Button)**<br>Verify that clicking Close exits the batch print modal cleanly. |
| **Pre-Condition** | Batch ID modal is open. |
| **Test Data** | `Click "Close" button.` |
| **Test Steps** | 1. Click Close button in modal footer. |
| **Expected Result** | Batch print modal closes; returns to previous page. |
| **Actual Result** | As expected. Modal dismissed. |
| **Status** | **PASSED** |
| **Post-Condition** | Main page restored. |

---

## Module 10: Real-Time Messaging & Voice Notes (CHAT) (19 Test Cases)

### [TC-CHAT-001] Channel Selection - General Announcements Channel

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-001` |
| **Title & Description** | **Channel Selection - General Announcements Channel**<br>Verify that clicking "General Announcements" loads the institutional broadcast channel. |
| **Pre-Condition** | User is on /chat. |
| **Test Data** | `Click channel item: "# General Announcements".` |
| **Test Steps** | 1. Navigate to /chat.<br>2. Click "# General Announcements" in sidebar. |
| **Expected Result** | Chat window loads announcement thread; messages displayed chronologically with author badges. |
| **Actual Result** | As expected. General announcement messages loaded. |
| **Status** | **PASSED** |
| **Post-Condition** | General announcements channel active. |

---

### [TC-CHAT-002] Channel Selection - Department Specific Channel (CWTS, LTS, ROTC)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-002` |
| **Title & Description** | **Channel Selection - Department Specific Channel (CWTS, LTS, ROTC)**<br>Verify that instructors can access their department channel and see track-specific discussions. |
| **Pre-Condition** | CWTS Instructor is on /chat. |
| **Test Data** | `Click channel: "# CWTS Faculty Room".` |
| **Test Steps** | 1. Click "# CWTS Faculty Room" channel. |
| **Expected Result** | CWTS channel messages load; instructor can chat with CWTS colleagues and coordinator. |
| **Actual Result** | As expected. CWTS channel opened. |
| **Status** | **PASSED** |
| **Post-Condition** | CWTS channel thread active. |

---

### [TC-CHAT-003] Direct Messaging - Select Existing Conversation from Sidebar

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-003` |
| **Title & Description** | **Direct Messaging - Select Existing Conversation from Sidebar**<br>Verify that clicking an existing direct message contact opens the 1-on-1 private chat thread. |
| **Pre-Condition** | Direct message conversation exists with "Richard Belen (Coordinator)". |
| **Test Data** | `Click contact "Richard Belen" in Direct Messages list.` |
| **Test Steps** | 1. Click on user name in Direct Messages list. |
| **Expected Result** | Direct message thread loads showing past private chat history, online status badge, and user avatar. |
| **Actual Result** | As expected. Private DM thread loaded. |
| **Status** | **PASSED** |
| **Post-Condition** | 1-on-1 DM thread active. |

---

### [TC-CHAT-004] "New Direct Message" Button & User Selection Modal

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-004` |
| **Title & Description** | **"New Direct Message" Button & User Selection Modal**<br>Verify that clicking + icon opens modal to initiate a new direct chat with any registered faculty. |
| **Pre-Condition** | User is on /chat. |
| **Test Data** | `Click "+ New Chat" button; select "ROTC Instructor".` |
| **Test Steps** | 1. Click "+ New Chat" icon button above chat list.<br>2. Modal opens showing faculty directory.<br>3. Click "ROTC Instructor" user card. |
| **Expected Result** | Modal closes; new or existing direct conversation thread opens with ROTC Instructor. |
| **Actual Result** | As expected. New conversation thread initialized. |
| **Status** | **PASSED** |
| **Post-Condition** | Conversation opened with selected recipient. |

---

### [TC-CHAT-005] "Create Group Chat" Button & Participant Selection Modal

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-005` |
| **Title & Description** | **"Create Group Chat" Button & Participant Selection Modal**<br>Verify that clicking Create Group allows selecting multiple participants and naming the group. |
| **Pre-Condition** | User is on /chat. |
| **Test Data** | `Group Name: "Midterm Evaluation Committee", Select 3 faculty members.` |
| **Test Steps** | 1. Click "Create Group" icon button.<br>2. Type Group Name: "Midterm Evaluation Committee".<br>3. Check checkboxes for 3 faculty members.<br>4. Click "Create Group Conversation". |
| **Expected Result** | Group conversation is created in database; socket broadcasts new group to all participants; thread opens. |
| **Actual Result** | As expected. Group chat created and populated in sidebar. |
| **Status** | **PASSED** |
| **Post-Condition** | Group conversation active. |

---

### [TC-CHAT-006] Conversation Search Bar (Filter Chats by Participant Name)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-006` |
| **Title & Description** | **Conversation Search Bar (Filter Chats by Participant Name)**<br>Verify that typing into the chat search bar filters conversations list in real-time. |
| **Pre-Condition** | Multiple conversations exist in sidebar. |
| **Test Data** | `Search Query: "Richard"` |
| **Test Steps** | 1. Click conversation search bar.<br>2. Type "Richard". |
| **Expected Result** | Sidebar list filters immediately to show only conversations matching "Richard". |
| **Actual Result** | As expected. Search filtered contacts dynamically. |
| **Status** | **PASSED** |
| **Post-Condition** | Filtered chat list displayed. |

---

### [TC-CHAT-007] Text Message Input & Send Button ("Send" Button or Enter Key)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-007` |
| **Title & Description** | **Text Message Input & Send Button ("Send" Button or Enter Key)**<br>Verify that typing a message and clicking Send or pressing Enter sends the message immediately. |
| **Pre-Condition** | Conversation thread is open. |
| **Test Data** | `Message: "Good morning Coordinator, submitting the CWTS Day 4 attendance logs now."` |
| **Test Steps** | 1. Type message into text input field.<br>2. Click the blue "Send" arrow button (or press Enter). |
| **Expected Result** | Message appears immediately in chat window with "Just now" timestamp; input box is cleared and focused. |
| **Actual Result** | As expected. Message sent and displayed in chat bubble. |
| **Status** | **PASSED** |
| **Post-Condition** | Message committed to database and socket. |

---

### [TC-CHAT-008] Real-Time Instant Delivery via Socket.io (Zero Latency Push)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-008` |
| **Title & Description** | **Real-Time Instant Delivery via Socket.io (Zero Latency Push)**<br>Verify that recipient receives message instantly without refreshing the browser page. |
| **Pre-Condition** | Two browser windows open: Window 1 (Sender), Window 2 (Recipient). |
| **Test Data** | `Send message from Window 1 to Window 2.` |
| **Test Steps** | 1. Type and send message from Window 1.<br>2. Observe Window 2 in real-time. |
| **Expected Result** | Message appears instantly in Window 2 chat thread via Socket.io WebSocket event within <50ms without page reload. |
| **Actual Result** | As expected. Instant zero-latency delivery verified across clients. |
| **Status** | **PASSED** |
| **Post-Condition** | Message rendered in both client views. |

---

### [TC-CHAT-009] Audio Hardware Chime Notification on Incoming Message (Web Audio API)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-009` |
| **Title & Description** | **Audio Hardware Chime Notification on Incoming Message (Web Audio API)**<br>Verify that an incoming message triggers the synthesized audio chime through device speakers. |
| **Pre-Condition** | Recipient is logged in; incoming message arrives from another user. |
| **Test Data** | `Incoming message arrival.` |
| **Test Steps** | 1. Send message to recipient.<br>2. Listen for audio output on recipient device. |
| **Expected Result** | Web Audio API oscillator generates clear, pleasant chime (880Hz frequency sweep); no external audio file required. |
| **Actual Result** | As expected. Synthesized audio chime played cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | User alerted via sound. |

---

### [TC-CHAT-010] In-App Toast & Browser Notification on Incoming Message

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-010` |
| **Title & Description** | **In-App Toast & Browser Notification on Incoming Message**<br>Verify that when user is on another page, an in-app toast alert and browser notification pop up. |
| **Pre-Condition** | Recipient is currently on /students page (not on /chat). |
| **Test Data** | `Incoming chat message from Admin.` |
| **Test Steps** | 1. Navigate recipient to /students.<br>2. Send message from Admin. |
| **Expected Result** | In-app toast appears at top right showing sender name and message preview; clicking toast navigates to chat. |
| **Actual Result** | As expected. Notification toast displayed with quick jump link. |
| **Status** | **PASSED** |
| **Post-Condition** | Toast alert displayed. |

---

### [TC-CHAT-011] File & Image Attachment Button ("Attach File" Paperclip Icon)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-011` |
| **Title & Description** | **File & Image Attachment Button ("Attach File" Paperclip Icon)**<br>Verify that user can attach an image or PDF document to a chat message. |
| **Pre-Condition** | Chat thread is open. |
| **Test Data** | `File: "activity_schedule_memo.pdf" (240 KB).` |
| **Test Steps** | 1. Click paperclip icon button next to text input.<br>2. Select "activity_schedule_memo.pdf".<br>3. Thumbnail appears in input preview.<br>4. Click "Send". |
| **Expected Result** | File uploads to local server; message bubble displays file preview card with filename, size, and download button. |
| **Actual Result** | As expected. File attachment uploaded and displayed in chat bubble. |
| **Status** | **PASSED** |
| **Post-Condition** | Attachment accessible to conversation participants. |

---

### [TC-CHAT-012] Voice Note Recording - "Record Audio" Microphone Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-012` |
| **Title & Description** | **Voice Note Recording - "Record Audio" Microphone Button**<br>Verify that clicking microphone button initializes `MediaRecorder` API and starts recording voice note. |
| **Pre-Condition** | Microphone permission granted. |
| **Test Data** | `Click microphone icon button.` |
| **Test Steps** | 1. Click the microphone icon button.<br>2. Observe recording bar. |
| **Expected Result** | Input replaces with voice recording interface: pulsing red recording indicator, elapsed timer (00:01, 00:02...), and waveform animation. |
| **Actual Result** | As expected. Voice recording interface started with live duration timer. |
| **Status** | **PASSED** |
| **Post-Condition** | MediaRecorder actively recording audio chunks. |

---

### [TC-CHAT-013] Voice Note Recording - "Pause / Resume Recording" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-013` |
| **Title & Description** | **Voice Note Recording - "Pause / Resume Recording" Button**<br>Verify that user can pause recording, resume speaking, and continue voice capture. |
| **Pre-Condition** | Voice recording is active. |
| **Test Data** | `Click "Pause", then click "Resume".` |
| **Test Steps** | 1. Click the Pause icon button.<br>2. Verify timer pauses.<br>3. Click Resume button. |
| **Expected Result** | Timer halts during pause; resumes counting when resumed; audio buffer continues seamlessly. |
| **Actual Result** | As expected. Pause and resume executed cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Voice recording resumed. |

---

### [TC-CHAT-014] Voice Note Recording - "Cancel / Discard Recording" Trash Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-014` |
| **Title & Description** | **Voice Note Recording - "Cancel / Discard Recording" Trash Button**<br>Verify that clicking trash icon discards the recording without sending. |
| **Pre-Condition** | Voice recording is active. |
| **Test Data** | `Click red trash can icon.` |
| **Test Steps** | 1. Click trash icon button. |
| **Expected Result** | Audio buffer is discarded; microphone tracks released; text input returns to default state. |
| **Actual Result** | As expected. Audio discarded; microphone closed. |
| **Status** | **PASSED** |
| **Post-Condition** | No audio saved or sent. |

---

### [TC-CHAT-015] Voice Note Recording - "Send Voice Message" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-015` |
| **Title & Description** | **Voice Note Recording - "Send Voice Message" Button**<br>Verify that clicking Send converts audio buffer to audio/webm blob and delivers voice note to conversation. |
| **Pre-Condition** | Recorded a 5-second voice note. |
| **Test Data** | `Click "Send Audio" checkmark button.` |
| **Test Steps** | 1. Record 5 seconds of audio.<br>2. Click the blue checkmark / send audio button. |
| **Expected Result** | Audio uploaded to server; voice message bubble appears with interactive audio player widget showing 0:05 duration. |
| **Actual Result** | As expected. Voice message sent and rendered with audio player widget. |
| **Status** | **PASSED** |
| **Post-Condition** | Voice note available in thread. |

---

### [TC-CHAT-016] Voice Message Player - "Play / Pause" Audio Control Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-016` |
| **Title & Description** | **Voice Message Player - "Play / Pause" Audio Control Button**<br>Verify that recipient can play and pause the received voice note smoothly. |
| **Pre-Condition** | Voice note exists in chat thread. |
| **Test Data** | `Click Play button on voice note card.` |
| **Test Steps** | 1. Click Play button on audio card.<br>2. Listen for audio playback.<br>3. Click Pause button. |
| **Expected Result** | Audio plays clearly through device speakers; progress scrubber advances; clicking pause stops playback. |
| **Actual Result** | As expected. Voice message playback operated smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Audio playback verified. |

---

### [TC-CHAT-017] Voice Message Player - Audio Progress Scrubber & Duration Display

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-017` |
| **Title & Description** | **Voice Message Player - Audio Progress Scrubber & Duration Display**<br>Verify that dragging the progress scrubber seeks audio to desired timestamp. |
| **Pre-Condition** | Voice note card is loaded. |
| **Test Data** | `Drag scrubber to middle of audio track.` |
| **Test Steps** | 1. Click or drag scrubber to 50% mark.<br>2. Observe playback position. |
| **Expected Result** | Audio playback jumps immediately to the selected timestamp; time display updates. |
| **Actual Result** | As expected. Audio seeking operated without latency. |
| **Status** | **PASSED** |
| **Post-Condition** | Playback resumes from scrubbed position. |

---

### [TC-CHAT-018] Message Context Menu - "Add Emoji Reaction" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-018` |
| **Title & Description** | **Message Context Menu - "Add Emoji Reaction" Button**<br>Verify that hovering over a message reveals emoji picker and saves reaction. |
| **Pre-Condition** | Message exists in thread. |
| **Test Data** | `React with thumbs-up emoji (👍).` |
| **Test Steps** | 1. Hover over message bubble.<br>2. Click the smiley face icon.<br>3. Select 👍 from emoji popover. |
| **Expected Result** | Emoji reaction badge appears below message with counter "👍 1"; updates via Socket.io to all users. |
| **Actual Result** | As expected. Reaction displayed below message. |
| **Status** | **PASSED** |
| **Post-Condition** | Reaction saved in database. |

---

### [TC-CHAT-019] Message Context Menu - "Delete Message (Soft Delete)" Button & Confirmation

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CHAT-019` |
| **Title & Description** | **Message Context Menu - "Delete Message (Soft Delete)" Button & Confirmation**<br>Verify that author can soft-delete their own message with confirmation. |
| **Pre-Condition** | User created a message in thread. |
| **Test Data** | `Click 3-dots menu on message; click "Delete Message".` |
| **Test Steps** | 1. Click 3-dots context menu on user's own message.<br>2. Click "Delete Message".<br>3. Confirm delete in prompt. |
| **Expected Result** | Message text replaces with italicized placeholder: "This message was deleted"; socket broadcasts update. |
| **Actual Result** | As expected. Soft-delete executed; message text cleared. |
| **Status** | **PASSED** |
| **Post-Condition** | Message marked is_deleted=1 in database. |

---

## Module 11: Academic Reports & CHED Compliance (REPRT) (15 Test Cases)

### [TC-REPRT-001] Tab Navigation - Select "OSDS-NSTP Form 2-A" Tab

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-001` |
| **Title & Description** | **Tab Navigation - Select "OSDS-NSTP Form 2-A" Tab**<br>Verify that clicking Form 2-A tab displays the official OSDS Enrollment Masterlist reporting interface. |
| **Pre-Condition** | User is on /reports. |
| **Test Data** | `Click tab: "OSDS-NSTP Form 2-A (Enrollment Master)".` |
| **Test Steps** | 1. Navigate to /reports.<br>2. Click "OSDS-NSTP Form 2-A" tab. |
| **Expected Result** | Form 2-A layout renders with filters for Academic Year, Semester, and Component, alongside table preview. |
| **Actual Result** | As expected. Form 2-A reporting module loaded. |
| **Status** | **PASSED** |
| **Post-Condition** | Form 2-A view active. |

---

### [TC-REPRT-002] Form 2-A - Select Academic Year & Semester Dropdowns

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-002` |
| **Title & Description** | **Form 2-A - Select Academic Year & Semester Dropdowns**<br>Verify that selecting term filters updates the preview roster for Form 2-A. |
| **Pre-Condition** | Form 2-A tab is active. |
| **Test Data** | `AY: "2025-2026", Semester: "1st Semester".` |
| **Test Steps** | 1. Select "2025-2026" from Academic Year dropdown.<br>2. Select "1st Semester" from Semester dropdown. |
| **Expected Result** | Preview roster refreshes with enrolled students for the chosen academic period. |
| **Actual Result** | As expected. Form 2-A refreshed for 2025-2026 1st Sem. |
| **Status** | **PASSED** |
| **Post-Condition** | Filter parameters applied. |

---

### [TC-REPRT-003] Form 2-A - Select Component Filter (CWTS / LTS / ROTC)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-003` |
| **Title & Description** | **Form 2-A - Select Component Filter (CWTS / LTS / ROTC)**<br>Verify that selecting a component filters the Form 2-A roster to that specific track. |
| **Pre-Condition** | Form 2-A tab is active. |
| **Test Data** | `Component: "ROTC".` |
| **Test Steps** | 1. Click Component dropdown.<br>2. Select "ROTC". |
| **Expected Result** | Preview roster isolates ROTC cadets only. |
| **Actual Result** | As expected. Form 2-A preview restricted to ROTC. |
| **Status** | **PASSED** |
| **Post-Condition** | ROTC filter applied to Form 2-A. |

---

### [TC-REPRT-004] Form 2-A - "Export to Excel (.xlsx)" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-004` |
| **Title & Description** | **Form 2-A - "Export to Excel (.xlsx)" Button**<br>Verify that clicking Export to Excel compiles the official CHED/OSDS Form 2-A formatted spreadsheet. |
| **Pre-Condition** | Form 2-A data is loaded in preview. |
| **Test Data** | `Click "Export Form 2-A (Excel)" button.` |
| **Test Steps** | 1. Click "Export Form 2-A (Excel)" button. |
| **Expected Result** | ExcelJS compiles official workbook with institutional title, student details, course, gender, and signature blocks; downloads file. |
| **Actual Result** | As expected. Form 2-A Excel spreadsheet downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | Form 2-A Excel workbook saved on client. |

---

### [TC-REPRT-005] Form 2-A - "Download Official PDF" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-005` |
| **Title & Description** | **Form 2-A - "Download Official PDF" Button**<br>Verify that clicking Download PDF exports a formatted legal/A4 PDF document of Form 2-A. |
| **Pre-Condition** | Form 2-A data is loaded. |
| **Test Data** | `Click "Download PDF" button.` |
| **Test Steps** | 1. Click "Download PDF" button. |
| **Expected Result** | jsPDF compiles high-resolution legal document with CvSU Naic official logo and tabular layout; downloads PDF. |
| **Actual Result** | As expected. Official PDF Form 2-A generated and downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | PDF saved on client device. |

---

### [TC-REPRT-006] Tab Navigation - Select "OSDS-NSTP Form 2-B" Tab

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-006` |
| **Title & Description** | **Tab Navigation - Select "OSDS-NSTP Form 2-B" Tab**<br>Verify that clicking Form 2-B tab displays the official Final Grading & Completion Sheet. |
| **Pre-Condition** | Admin is on /reports. |
| **Test Data** | `Click tab: "OSDS-NSTP Form 2-B (Grading Sheet)".` |
| **Test Steps** | 1. Click "OSDS-NSTP Form 2-B" tab. |
| **Expected Result** | Form 2-B view renders showing student grades, completion status, and CHED serial number columns. |
| **Actual Result** | As expected. Form 2-B grading module displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Form 2-B view active. |

---

### [TC-REPRT-007] Form 2-B - Grade Summary Calculation Preview

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-007` |
| **Title & Description** | **Form 2-B - Grade Summary Calculation Preview**<br>Verify that Form 2-B accurately calculates final ratings (Passed, Failed, Incomplete) based on attendance and performance. |
| **Pre-Condition** | Form 2-B tab is active. |
| **Test Data** | `Inspect grade column for student with 100% attendance.` |
| **Test Steps** | 1. Review grade calculation in table for enrolled students. |
| **Expected Result** | Grade calculation algorithm reflects correct academic remarks: "Passed" for >=75% attendance and requirements completed. |
| **Actual Result** | As expected. Academic remarks calculated accurately. |
| **Status** | **PASSED** |
| **Post-Condition** | Grades verified in preview. |

---

### [TC-REPRT-008] Form 2-B - "Export to Excel (.xlsx)" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-008` |
| **Title & Description** | **Form 2-B - "Export to Excel (.xlsx)" Button**<br>Verify that Admin can export Form 2-B to Excel for submission to university registrar and CHED. |
| **Pre-Condition** | User is authenticated as Admin. |
| **Test Data** | `Click "Export Form 2-B (Excel)" button.` |
| **Test Steps** | 1. Click "Export Form 2-B (Excel)" button. |
| **Expected Result** | Formatted Excel workbook generated with final grades, serial numbers, and OSDS coordinator sign-off rows; downloads file. |
| **Actual Result** | As expected. Form 2-B Excel file downloaded successfully. |
| **Status** | **PASSED** |
| **Post-Condition** | Form 2-B Excel saved. |

---

### [TC-REPRT-009] Form 2-B - "Print Official Form 2-B" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-009` |
| **Title & Description** | **Form 2-B - "Print Official Form 2-B" Button**<br>Verify that clicking Print triggers the browser print dialog formatted for institutional signing. |
| **Pre-Condition** | Form 2-B is active. |
| **Test Data** | `Click "Print Form 2-B" button.` |
| **Test Steps** | 1. Click "Print Form 2-B" button. |
| **Expected Result** | Print preview opens with legal portrait/landscape layout, page numbering, and signature lines. |
| **Actual Result** | As expected. Print layout displayed cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Print preview ready. |

---

### [TC-REPRT-010] Tab Navigation - Select "CHED Masterlist Compliance" Tab

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-010` |
| **Title & Description** | **Tab Navigation - Select "CHED Masterlist Compliance" Tab**<br>Verify that clicking CHED Masterlist tab loads standardized CHED annual national database reporting format. |
| **Pre-Condition** | User is on /reports. |
| **Test Data** | `Click "CHED Masterlist" tab.` |
| **Test Steps** | 1. Click "CHED Masterlist Compliance" tab. |
| **Expected Result** | CHED format table loads with columns matching CHED Memorandum Order (CMO) guidelines. |
| **Actual Result** | As expected. CHED compliance module displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | CHED compliance tab active. |

---

### [TC-REPRT-011] CHED Masterlist - "Generate CHED Roster (Excel)" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-011` |
| **Title & Description** | **CHED Masterlist - "Generate CHED Roster (Excel)" Button**<br>Verify that clicking Generate CHED Roster downloads national database compliant spreadsheet. |
| **Pre-Condition** | CHED tab is active. |
| **Test Data** | `Click "Generate CHED Roster (Excel)" button.` |
| **Test Steps** | 1. Click "Generate CHED Roster (Excel)" button. |
| **Expected Result** | ExcelJS compiles national submission roster with HEI Code, Student Number, Sex, Birthday, Track, and Completion Status; downloads file. |
| **Actual Result** | As expected. CHED compliance Excel roster generated and downloaded. |
| **Status** | **PASSED** |
| **Post-Condition** | CHED spreadsheet saved. |

---

### [TC-REPRT-012] Instructor Submission Portal - File Attachment Browse Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-012` |
| **Title & Description** | **Instructor Submission Portal - File Attachment Browse Button**<br>Verify that instructor can attach accomplishment reports and documentation files. |
| **Pre-Condition** | Instructor is on Reports page submission tab. |
| **Test Data** | `Attach file: "CWTS_Community_CleanUp_Report.pdf" (1.2 MB).` |
| **Test Steps** | 1. Click "Browse Report Document".<br>2. Select "CWTS_Community_CleanUp_Report.pdf". |
| **Expected Result** | File is validated (PDF/DOCX), preview shows file size and name with green check icon. |
| **Actual Result** | As expected. Report document attached and validated. |
| **Status** | **PASSED** |
| **Post-Condition** | Document ready for submission. |

---

### [TC-REPRT-013] Instructor Submission Portal - "Submit Accomplishment Report" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-013` |
| **Title & Description** | **Instructor Submission Portal - "Submit Accomplishment Report" Button**<br>Verify that submitting the report logs the submission in database with "Under Review" status. |
| **Pre-Condition** | File attached and report title filled. |
| **Test Data** | `Title: "Final Community Immersion Report", Click "Submit Report".` |
| **Test Steps** | 1. Type Report Title: "Final Community Immersion Report".<br>2. Click "Submit Accomplishment Report" button. |
| **Expected Result** | Report is submitted to coordinator; appears in Submission History table with status "Under Review"; toast confirms submission. |
| **Actual Result** | As expected. Report submitted to admin successfully. |
| **Status** | **PASSED** |
| **Post-Condition** | Submission logged in report_submissions table. |

---

### [TC-REPRT-014] Admin Review - "Approve / Endorse Report Submission" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-014` |
| **Title & Description** | **Admin Review - "Approve / Endorse Report Submission" Button**<br>Verify that Admin can review submitted instructor reports and click Approve to endorse. |
| **Pre-Condition** | Admin is logged in; pending report submission exists. |
| **Test Data** | `Click "Approve Submission" checkmark button.` |
| **Test Steps** | 1. Open Report Submissions review panel in Admin mode.<br>2. Review submitted PDF report.<br>3. Click "Approve Submission" button. |
| **Expected Result** | Status changes to "Approved"; instructor notified in chat/notifications; status badge turns green. |
| **Actual Result** | As expected. Report approved by admin. |
| **Status** | **PASSED** |
| **Post-Condition** | Report submission status is Approved. |

---

### [TC-REPRT-015] Admin Review - "Request Revision / Return Report" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-REPRT-015` |
| **Title & Description** | **Admin Review - "Request Revision / Return Report" Button**<br>Verify that Admin can return a submission with remarks requesting revisions. |
| **Pre-Condition** | Admin is reviewing a submitted report. |
| **Test Data** | `Click "Request Revision", Remarks: "Please attach geo-tagged photos of the community immersion."` |
| **Test Steps** | 1. Click "Request Revision" button.<br>2. Enter feedback remarks in prompt modal.<br>3. Click "Send Revision Request". |
| **Expected Result** | Status updates to "Needs Revision"; instructor receives alert with coordinator feedback; file remains open for re-upload. |
| **Actual Result** | As expected. Revision requested with feedback logged. |
| **Status** | **PASSED** |
| **Post-Condition** | Report status set to Needs Revision. |

---

## Module 12: Letter Formats & Document Center (LETR) (11 Test Cases)

### [TC-LETR-001] View Official Template Directory Cards

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-001` |
| **Title & Description** | **View Official Template Directory Cards**<br>Verify that the page displays the official CvSU Naic letter templates (Medical Excuse, Immersion Request, Parent Consent, Make-Up Agreement). |
| **Pre-Condition** | User is on /letter-formats. |
| **Test Data** | `Page load trigger on /letter-formats.` |
| **Test Steps** | 1. Navigate to /letter-formats.<br>2. Inspect displayed template cards. |
| **Expected Result** | Official template cards are rendered with title, department badge, file format, and action buttons. |
| **Actual Result** | As expected. All 4 official template cards loaded properly. |
| **Status** | **PASSED** |
| **Post-Condition** | Template cards displayed. |

---

### [TC-LETR-002] Filter Templates by Department / Track Dropdown

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-002` |
| **Title & Description** | **Filter Templates by Department / Track Dropdown**<br>Verify that filtering by track isolates templates relevant to CWTS, LTS, or ROTC. |
| **Pre-Condition** | User is on /letter-formats. |
| **Test Data** | `Select "ROTC" from Department filter.` |
| **Test Steps** | 1. Click Department filter dropdown.<br>2. Choose "ROTC". |
| **Expected Result** | Template grid updates to show only ROTC-specific forms (e.g. ROTC Bivouac Medical Clearance, Officer Excuse). |
| **Actual Result** | As expected. Template grid filtered to ROTC. |
| **Status** | **PASSED** |
| **Post-Condition** | ROTC templates displayed. |

---

### [TC-LETR-003] "Create New Letter Template" Button & Modal Open

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-003` |
| **Title & Description** | **"Create New Letter Template" Button & Modal Open**<br>Verify that clicking "+ Add Template" opens the letter creation modal. |
| **Pre-Condition** | Admin or Instructor is on /letter-formats. |
| **Test Data** | `Click "+ Add Template" button.` |
| **Test Steps** | 1. Click "+ Add Letter Template" button at top right. |
| **Expected Result** | Create Template modal opens with inputs for Title, Department, Category, Description, and File Attachment. |
| **Actual Result** | As expected. Create Template modal opened. |
| **Status** | **PASSED** |
| **Post-Condition** | Template creation modal active. |

---

### [TC-LETR-004] Template Form - Enter Title, Department, Description

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-004` |
| **Title & Description** | **Template Form - Enter Title, Department, Description**<br>Verify that user can type metadata for the new document template. |
| **Pre-Condition** | Create Template modal is open. |
| **Test Data** | `Title: "Barangay Tree Planting Authorization Letter", Department: "CWTS", Category: "Community Immersion"` |
| **Test Steps** | 1. Type Title: "Barangay Tree Planting Authorization Letter".<br>2. Select Department: "CWTS".<br>3. Select Category: "Community Immersion".<br>4. Type Description text. |
| **Expected Result** | Form fields accept inputs and validate length and formatting. |
| **Actual Result** | As expected. Inputs filled without validation warnings. |
| **Status** | **PASSED** |
| **Post-Condition** | Metadata stored in form state. |

---

### [TC-LETR-005] Template Form - Strict File Attachment Validation: Attempt Save without File

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-005` |
| **Title & Description** | **Template Form - Strict File Attachment Validation: Attempt Save without File**<br>Verify system strictly blocks saving if user does not attach a genuine document file (no fake mock files generated). |
| **Pre-Condition** | Create Template modal is open; all text fields filled but NO file attached. |
| **Test Data** | `Leave file attachment input empty; click "Save Template".` |
| **Test Steps** | 1. Fill in Title, Department, and Description.<br>2. Leave the document file attachment field completely empty.<br>3. Click "Save Template" button. |
| **Expected Result** | Strict attachment validation triggers: saving is blocked; warning toast displays: "Please attach a document file (PDF, Word, or Image) before saving."; no fabricated dummy file (135.0 KB) is created. |
| **Actual Result** | As expected. Saving blocked; warning toast shown; fake mock file generation prevented. |
| **Status** | **PASSED** |
| **Post-Condition** | Template not created; modal remains open prompting for file. |

---

### [TC-LETR-006] Template Form - Attach Valid Document (PDF/DOCX) & Click "Save Template"

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-006` |
| **Title & Description** | **Template Form - Attach Valid Document (PDF/DOCX) & Click "Save Template"**<br>Verify that attaching a real document file allows saving the template successfully. |
| **Pre-Condition** | Create Template modal is open. |
| **Test Data** | `Attach file: "Official_CvSU_Tree_Planting_Letter.pdf" (350 KB).` |
| **Test Steps** | 1. Click "Attach Document File".<br>2. Select "Official_CvSU_Tree_Planting_Letter.pdf".<br>3. Verify file name and size appear in green badge.<br>4. Click "Save Template" button. |
| **Expected Result** | Template saves to database along with genuine uploaded file; modal closes; toast displays "Letter template created successfully"; card appears in directory. |
| **Actual Result** | As expected. Template created with genuine file attached. |
| **Status** | **PASSED** |
| **Post-Condition** | New template present in templates directory. |

---

### [TC-LETR-007] Template Actions - "Preview Letter Template" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-007` |
| **Title & Description** | **Template Actions - "Preview Letter Template" Button**<br>Verify that clicking Preview opens a document viewer rendering the attached PDF or Word document. |
| **Pre-Condition** | Template card exists in directory. |
| **Test Data** | `Click "Preview" eye icon on template card.` |
| **Test Steps** | 1. Click "Preview" eye icon button on template card. |
| **Expected Result** | Preview modal opens displaying embedded document viewer showing full letter layout. |
| **Actual Result** | As expected. Document preview modal rendered cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Preview modal open. |

---

### [TC-LETR-008] Template Actions - "Download Template File" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-008` |
| **Title & Description** | **Template Actions - "Download Template File" Button**<br>Verify that clicking Download downloads the genuine attached file and never a fabricated dummy file. |
| **Pre-Condition** | Template card exists in directory. |
| **Test Data** | `Click "Download" button on template card.` |
| **Test Steps** | 1. Click "Download" icon button on template card. |
| **Expected Result** | Browser initiates file download of the exact uploaded file with correct MIME type and size; no fake 135 KB dummy file is downloaded. |
| **Actual Result** | As expected. Genuine attached file downloaded accurately. |
| **Status** | **PASSED** |
| **Post-Condition** | File saved on client computer. |

---

### [TC-LETR-009] Template Actions - "Edit Template" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-009` |
| **Title & Description** | **Template Actions - "Edit Template" Button**<br>Verify that clicking Edit opens the update dialog allowing modification of description or file replacement. |
| **Pre-Condition** | User owns the template or is Admin. |
| **Test Data** | `Click "Edit" pencil icon button.` |
| **Test Steps** | 1. Click "Edit" pencil icon on template card.<br>2. Update description text.<br>3. Click "Update Template". |
| **Expected Result** | Changes committed to database; updated description renders on template card; toast confirms update. |
| **Actual Result** | As expected. Template updated smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Updated template stored. |

---

### [TC-LETR-010] Template Actions - "Delete Template" Button & Confirmation

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-010` |
| **Title & Description** | **Template Actions - "Delete Template" Button & Confirmation**<br>Verify that clicking Delete prompts confirmation and removes template upon confirm. |
| **Pre-Condition** | User has delete permissions for this template. |
| **Test Data** | `Click "Delete" trash icon button; confirm delete.` |
| **Test Steps** | 1. Click "Delete" trash icon button on template card.<br>2. Confirmation dialog appears.<br>3. Click "Confirm Delete" button. |
| **Expected Result** | Template is removed from database and file storage; card disappears from grid; toast confirms deletion. |
| **Actual Result** | As expected. Template deleted cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Template removed from system. |

---

### [TC-LETR-011] Department Isolation Check: Instructor attempts to modify template from another track

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-LETR-011` |
| **Title & Description** | **Department Isolation Check: Instructor attempts to modify template from another track**<br>Verify that a CWTS Instructor cannot edit or delete a ROTC template (Department Isolation). |
| **Pre-Condition** | User logged in is CWTS Instructor. |
| **Test Data** | `Inspect ROTC template card actions.` |
| **Test Steps** | 1. Locate ROTC template card as CWTS Instructor.<br>2. Observe action buttons on card. |
| **Expected Result** | Edit and Delete buttons are hidden or disabled for templates belonging to other departments; only Download/Preview is accessible. |
| **Actual Result** | As expected. Edit/Delete controls restricted per track isolation policy. |
| **Status** | **PASSED** |
| **Post-Condition** | Cross-track modification blocked. |

---

## Module 13: Training Calendar & Activity Schedule (CAL) (12 Test Cases)

### [TC-CAL-001] Calendar View Switcher - "Month View" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-001` |
| **Title & Description** | **Calendar View Switcher - "Month View" Button**<br>Verify that clicking "Month View" displays the standard 7×5 monthly calendar grid. |
| **Pre-Condition** | User is on /calendar. |
| **Test Data** | `Click "Month" view button.` |
| **Test Steps** | 1. Navigate to /calendar.<br>2. Click "Month" button in top right view toggle. |
| **Expected Result** | Calendar renders full monthly grid with day cells showing scheduled NSTP activities. |
| **Actual Result** | As expected. Monthly calendar grid rendered. |
| **Status** | **PASSED** |
| **Post-Condition** | Month view active. |

---

### [TC-CAL-002] Calendar View Switcher - "Week View" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-002` |
| **Title & Description** | **Calendar View Switcher - "Week View" Button**<br>Verify that clicking "Week View" displays the 7-day hourly breakdown view. |
| **Pre-Condition** | User is on /calendar. |
| **Test Data** | `Click "Week" view button.` |
| **Test Steps** | 1. Click "Week" button in view switcher. |
| **Expected Result** | Calendar transitions to 7-column weekly schedule with hourly time slots (7:00 AM to 5:00 PM). |
| **Actual Result** | As expected. Weekly view displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Week view active. |

---

### [TC-CAL-003] Calendar View Switcher - "Day View" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-003` |
| **Title & Description** | **Calendar View Switcher - "Day View" Button**<br>Verify that clicking "Day View" displays the detailed agenda view for today's date. |
| **Pre-Condition** | User is on /calendar. |
| **Test Data** | `Click "Day" view button.` |
| **Test Steps** | 1. Click "Day" button in view switcher. |
| **Expected Result** | Calendar displays single-day timeline showing scheduled activities and training milestones. |
| **Actual Result** | As expected. Day view displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Day view active. |

---

### [TC-CAL-004] Calendar Navigation - "Previous Month", "Next Month", "Today" Buttons

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-004` |
| **Title & Description** | **Calendar Navigation - "Previous Month", "Next Month", "Today" Buttons**<br>Verify that navigation arrows advance and rewind calendar months, and "Today" button jumps to current date. |
| **Pre-Condition** | User is on /calendar. |
| **Test Data** | `Click "Next Month (>)", then "Previous Month (<)", then "Today".` |
| **Test Steps** | 1. Click right arrow (>) to go to next month.<br>2. Observe month header changes.<br>3. Click left arrow (<) to go to previous month.<br>4. Click "Today" button. |
| **Expected Result** | Month changes smoothly; "Today" button immediately returns view to current calendar month with today highlighted. |
| **Actual Result** | As expected. Calendar navigation responsive and accurate. |
| **Status** | **PASSED** |
| **Post-Condition** | Current month and today's date active. |

---

### [TC-CAL-005] "Add New Activity / Schedule" Button & Modal Open

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-005` |
| **Title & Description** | **"Add New Activity / Schedule" Button & Modal Open**<br>Verify that clicking "+ Add Event" opens the activity scheduling dialog. |
| **Pre-Condition** | User is on /calendar. |
| **Test Data** | `Click "+ Add Event" button.` |
| **Test Steps** | 1. Click "+ Add Schedule / Event" button. |
| **Expected Result** | Event creation modal opens with form fields for Title, Date, Time, NSTP Track, Location, and Description. |
| **Actual Result** | As expected. Add Event modal displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Event modal active. |

---

### [TC-CAL-006] Activity Form - Input Title, Date, Time, NSTP Track, Venue, Description

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-006` |
| **Title & Description** | **Activity Form - Input Title, Date, Time, NSTP Track, Venue, Description**<br>Verify that user can fill in all activity details and validate required inputs. |
| **Pre-Condition** | Add Event modal is open. |
| **Test Data** | `Title: "Campus Disaster Preparedness Drill", Date: "Next Saturday", Time: "07:30 AM", Track: "All", Venue: "CvSU Naic Grandstand"` |
| **Test Steps** | 1. Type Event Title.<br>2. Pick Event Date and Start Time.<br>3. Select Track: "All Tracks".<br>4. Type Venue / Location: "CvSU Naic Grandstand".<br>5. Add brief activity instructions. |
| **Expected Result** | All fields accept input and pass client validation. |
| **Actual Result** | As expected. Form inputs validated. |
| **Status** | **PASSED** |
| **Post-Condition** | Event payload prepared in form state. |

---

### [TC-CAL-007] Activity Form - "Save Event" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-007` |
| **Title & Description** | **Activity Form - "Save Event" Button**<br>Verify that clicking Save Event saves schedule to database and renders event pill on calendar. |
| **Pre-Condition** | Event form filled validly. |
| **Test Data** | `Click "Save Event" button.` |
| **Test Steps** | 1. Click "Save Event" button in modal footer. |
| **Expected Result** | Event is saved in MySQL calendar_events table; modal closes; toast displays "Activity scheduled successfully"; event chip appears on target date. |
| **Actual Result** | As expected. Event saved and rendered on calendar cell. |
| **Status** | **PASSED** |
| **Post-Condition** | Event visible on calendar. |

---

### [TC-CAL-008] Activity Form - "Cancel" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-008` |
| **Title & Description** | **Activity Form - "Cancel" Button**<br>Verify that clicking Cancel closes event modal without creating any schedule entry. |
| **Pre-Condition** | Add Event modal is open. |
| **Test Data** | `Click "Cancel" button.` |
| **Test Steps** | 1. Click "Cancel" button. |
| **Expected Result** | Modal closes; calendar remains unchanged. |
| **Actual Result** | As expected. Modal dismissed. |
| **Status** | **PASSED** |
| **Post-Condition** | Calendar unchanged. |

---

### [TC-CAL-009] Calendar Event Click - Event Details Modal Display

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-009` |
| **Title & Description** | **Calendar Event Click - Event Details Modal Display**<br>Verify that clicking on an event chip on the calendar opens the event details card. |
| **Pre-Condition** | Scheduled event exists on calendar. |
| **Test Data** | `Click event chip: "Campus Disaster Preparedness Drill".` |
| **Test Steps** | 1. Click the event chip on the calendar cell. |
| **Expected Result** | Event Details modal opens showing full title, date/time, venue, assigned track badge, and coordinator notes. |
| **Actual Result** | As expected. Event details modal displayed. |
| **Status** | **PASSED** |
| **Post-Condition** | Event details modal active. |

---

### [TC-CAL-010] Event Details Modal - "Edit Event" Button & Update

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-010` |
| **Title & Description** | **Event Details Modal - "Edit Event" Button & Update**<br>Verify that clicking Edit Event allows modifying venue or time and updates calendar view. |
| **Pre-Condition** | Event details modal is open. |
| **Test Data** | `Click "Edit", change venue to "CvSU Naic Gymnasium", click "Update".` |
| **Test Steps** | 1. Click "Edit Event" button.<br>2. Change Venue to "CvSU Naic Gymnasium".<br>3. Click "Update Event". |
| **Expected Result** | Event record updated in database; details update in calendar; toast confirms update. |
| **Actual Result** | As expected. Event updated smoothly. |
| **Status** | **PASSED** |
| **Post-Condition** | Updated venue saved. |

---

### [TC-CAL-011] Event Details Modal - "Delete Event" Button & Confirmation

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-011` |
| **Title & Description** | **Event Details Modal - "Delete Event" Button & Confirmation**<br>Verify that clicking Delete Event removes the event from calendar upon confirmation. |
| **Pre-Condition** | Event details modal is open. |
| **Test Data** | `Click "Delete Event" button; confirm delete.` |
| **Test Steps** | 1. Click "Delete Event" button.<br>2. Confirm delete in prompt modal. |
| **Expected Result** | Event is removed from database; event chip vanishes from calendar; toast confirms deletion. |
| **Actual Result** | As expected. Event deleted cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Event removed from calendar. |

---

### [TC-CAL-012] Filter Calendar Events by NSTP Component Checkboxes

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-CAL-012` |
| **Title & Description** | **Filter Calendar Events by NSTP Component Checkboxes**<br>Verify that checking/unchecking track checkboxes (CWTS, LTS, ROTC) filters visible events on calendar. |
| **Pre-Condition** | User is on /calendar. |
| **Test Data** | `Uncheck "ROTC" and "LTS" checkboxes in sidebar filter.` |
| **Test Steps** | 1. Uncheck "ROTC" checkbox.<br>2. Uncheck "LTS" checkbox.<br>3. Observe calendar events. |
| **Expected Result** | Only CWTS and All-Track events remain visible on the calendar; ROTC and LTS event pills are hidden. |
| **Actual Result** | As expected. Calendar filtered to CWTS events only. |
| **Status** | **PASSED** |
| **Post-Condition** | Filter active on calendar view. |

---

## Module 14: User Profile, Security & Account Settings (PROF) (10 Test Cases)

### [TC-PROF-001] Profile Information Display (Full Name, Email, Role, Department)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-001` |
| **Title & Description** | **Profile Information Display (Full Name, Email, Role, Department)**<br>Verify that the user profile page displays accurate user account data and assigned permissions. |
| **Pre-Condition** | User is logged in on /profile. |
| **Test Data** | `Page load trigger on /profile.` |
| **Test Steps** | 1. Navigate to /profile.<br>2. Inspect Profile Information card. |
| **Expected Result** | Full name, email address, user role badge (Admin / Instructor), and assigned department are rendered accurately. |
| **Actual Result** | As expected. User profile details displayed correctly. |
| **Status** | **PASSED** |
| **Post-Condition** | Profile details visible. |

---

### [TC-PROF-002] Profile Edit - Update Name and Contact Number ("Save Changes" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-002` |
| **Title & Description** | **Profile Edit - Update Name and Contact Number ("Save Changes" Button)**<br>Verify that user can modify full name and contact number and save to database. |
| **Pre-Condition** | User is on /profile. |
| **Test Data** | `Update Contact Number to "0917-123-4567", click "Save Profile Details".` |
| **Test Steps** | 1. Edit Contact Number input.<br>2. Click "Save Profile Details" button. |
| **Expected Result** | Database updates user record; toast displays "Profile updated successfully"; header reflects updated user name. |
| **Actual Result** | As expected. Profile changes saved and reflected across system. |
| **Status** | **PASSED** |
| **Post-Condition** | Updated contact stored in database. |

---

### [TC-PROF-003] Profile Edit - Avatar Photo Upload & Save

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-003` |
| **Title & Description** | **Profile Edit - Avatar Photo Upload & Save**<br>Verify that user can upload a custom profile avatar photo. |
| **Pre-Condition** | User is on /profile. |
| **Test Data** | `Upload image: "user_avatar.jpg".` |
| **Test Steps** | 1. Click "Change Avatar" button on profile photo.<br>2. Select image file.<br>3. Click "Save Avatar". |
| **Expected Result** | Avatar image uploads, crops to circle preview, updates navbar profile avatar immediately, and persists across reloads. |
| **Actual Result** | As expected. Avatar updated and saved. |
| **Status** | **PASSED** |
| **Post-Condition** | New avatar stored and displayed. |

---

### [TC-PROF-004] Security - Change Password with Incorrect Current Password

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-004` |
| **Title & Description** | **Security - Change Password with Incorrect Current Password**<br>Verify system rejects password update if current password verification fails. |
| **Pre-Condition** | User is on Change Password card on /profile. |
| **Test Data** | `Current Password: "WrongPassword!", New Password: "NewValidPassword!2026"` |
| **Test Steps** | 1. Type wrong password in Current Password input.<br>2. Type new valid password in New Password and Confirm Password inputs.<br>3. Click "Update Password" button. |
| **Expected Result** | Backend compares bcrypt hash of current password, detects mismatch, returns HTTP 400; toast displays "Current password is incorrect". Password NOT updated. |
| **Actual Result** | As expected. Password update rejected due to incorrect current password. |
| **Status** | **PASSED** |
| **Post-Condition** | Existing password remains unchanged. |

---

### [TC-PROF-005] Security - Change Password with Mismatched Confirmation

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-005` |
| **Title & Description** | **Security - Change Password with Mismatched Confirmation**<br>Verify client validation prevents submission if New Password and Confirm Password do not match. |
| **Pre-Condition** | User is on Change Password card. |
| **Test Data** | `New Password: "Password123!", Confirm Password: "DifferentPassword456!"` |
| **Test Steps** | 1. Input valid current password.<br>2. Type "Password123!" in New Password.<br>3. Type "DifferentPassword456!" in Confirm Password.<br>4. Click "Update Password". |
| **Expected Result** | Client validation flags mismatch: "New password and confirmation do not match"; submission blocked. |
| **Actual Result** | As expected. Submission blocked due to confirmation mismatch. |
| **Status** | **PASSED** |
| **Post-Condition** | Form submission prevented. |

---

### [TC-PROF-006] Security - Change Password with Less than 8 Characters

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-006` |
| **Title & Description** | **Security - Change Password with Less than 8 Characters**<br>Verify password complexity rule requires minimum 8 characters. |
| **Pre-Condition** | User is on Change Password card. |
| **Test Data** | `New Password: "pass"` |
| **Test Steps** | 1. Type "pass" in New Password field.<br>2. Click "Update Password". |
| **Expected Result** | Validation error: "Password must be at least 8 characters long"; submission blocked. |
| **Actual Result** | As expected. Minimum length validation enforced. |
| **Status** | **PASSED** |
| **Post-Condition** | Short password rejected. |

---

### [TC-PROF-007] Security - Change Password with Valid Credentials ("Update Password" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-007` |
| **Title & Description** | **Security - Change Password with Valid Credentials ("Update Password" Button)**<br>Verify that providing correct current password and valid new password updates password hash with bcrypt 12 rounds. |
| **Pre-Condition** | User provides correct current password and valid 8+ char new password. |
| **Test Data** | `Current: "[VALID_PW]", New: "CvSU_Secure_2026!", Confirm: "CvSU_Secure_2026!"` |
| **Test Steps** | 1. Enter correct current password.<br>2. Enter new valid password in both new and confirm inputs.<br>3. Click "Update Password" button. |
| **Expected Result** | Backend re-hashes new password using bcrypt with 12 salt rounds; updates users table; displays success toast "Password updated successfully"; inputs reset. |
| **Actual Result** | As expected. Password hash updated in database; success confirmed. |
| **Status** | **PASSED** |
| **Post-Condition** | New password active for next login. |

---

### [TC-PROF-008] System Preferences - Toggle Dark Mode / Light Mode Switch

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-008` |
| **Title & Description** | **System Preferences - Toggle Dark Mode / Light Mode Switch**<br>Verify that toggling the Dark Mode switch toggles `.dark` class on root HTML element and saves preference. |
| **Pre-Condition** | User is on /profile preferences section. |
| **Test Data** | `Click Dark Mode toggle switch.` |
| **Test Steps** | 1. Locate "Dark Mode" toggle switch.<br>2. Click switch to activate Dark Mode.<br>3. Observe theme styling.<br>4. Click switch again to return to Light Mode. |
| **Expected Result** | Dark Mode applies dark charcoal/slate backgrounds and light text; toggling back restores crisp white/green theme; preference stored in localStorage. |
| **Actual Result** | As expected. Theme toggled seamlessly with localStorage persistence. |
| **Status** | **PASSED** |
| **Post-Condition** | Theme preference saved in browser. |

---

### [TC-PROF-009] System Preferences - Toggle Hardware Notification Sounds On/Off

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-009` |
| **Title & Description** | **System Preferences - Toggle Hardware Notification Sounds On/Off**<br>Verify that user can enable or mute synthesized audio chimes for chat and scanning. |
| **Pre-Condition** | User is on /profile preferences. |
| **Test Data** | `Toggle "Sound Effects & Audio Chimes" switch to OFF.` |
| **Test Steps** | 1. Click "Notification Sound" toggle switch to turn it OFF.<br>2. Trigger an incoming message or scan. |
| **Expected Result** | Sound oscillator is muted; no audio chime plays; visual toast alerts still appear; preference saved. |
| **Actual Result** | As expected. Audio muted according to preference. |
| **Status** | **PASSED** |
| **Post-Condition** | Mute setting stored in localStorage. |

---

### [TC-PROF-010] "Logout from Session" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-PROF-010` |
| **Title & Description** | **"Logout from Session" Button**<br>Verify that clicking Logout from the profile page triggers logout confirmation and session termination. |
| **Pre-Condition** | User is on /profile. |
| **Test Data** | `Click "Logout from All Devices / Session" button.` |
| **Test Steps** | 1. Click "Logout" button on profile card.<br>2. Confirm logout in modal. |
| **Expected Result** | Session token destroyed; user redirected to landing page; confirmation toast displayed. |
| **Actual Result** | As expected. User logged out cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | User logged out. |

---

## Module 15: System Administration, Google Drive & Disaster Recovery (SYS-DR) (9 Test Cases)

### [TC-SYS-DR-001] Google Drive Sync Status Dashboard View

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-001` |
| **Title & Description** | **Google Drive Sync Status Dashboard View**<br>Verify that the Google Drive Sync card displays real-time webhook connection status and last sync timestamp. |
| **Pre-Condition** | Admin is logged in on /admin/google-drive. |
| **Test Data** | `Page load trigger on /admin/google-drive.` |
| **Test Steps** | 1. Navigate to /admin/google-drive.<br>2. Inspect Cloud Sync Status card. |
| **Expected Result** | Card displays green "Connected" badge, Google Apps Script webhook endpoint status, last sync timestamp, and total synced files counter. |
| **Actual Result** | As expected. Webhook status and sync counters rendered accurately. |
| **Status** | **PASSED** |
| **Post-Condition** | Google Drive sync status visible. |

---

### [TC-SYS-DR-002] "Manual Trigger Google Drive Sync" Webhook Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-002` |
| **Title & Description** | **"Manual Trigger Google Drive Sync" Webhook Button**<br>Verify that clicking Manual Sync pushes latest student and enrollment records to Google Drive webhook. |
| **Pre-Condition** | Admin is on /admin/google-drive. |
| **Test Data** | `Click "Trigger Manual Cloud Sync" button.` |
| **Test Steps** | 1. Click "Trigger Manual Cloud Sync" button.<br>2. Observe progress spinner. |
| **Expected Result** | System serializes active database records into encrypted JSON payload, sends POST request to Google Apps Script webhook; toast confirms "Cloud mirroring completed successfully". |
| **Actual Result** | As expected. Manual webhook sync executed; Google Drive updated. |
| **Status** | **PASSED** |
| **Post-Condition** | Cloud mirror updated with latest database snapshot. |

---

### [TC-SYS-DR-003] "Generate Local Database Backup (.sql.gz)" Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-003` |
| **Title & Description** | **"Generate Local Database Backup (.sql.gz)" Button**<br>Verify that clicking Generate Backup runs the automated bash dump script and creates compressed snapshot. |
| **Pre-Condition** | Admin is on /admin/google-drive or Admin Dashboard. |
| **Test Data** | `Click "Create Local Database Backup" button.` |
| **Test Steps** | 1. Click "Create Local Database Backup (.sql.gz)" button. |
| **Expected Result** | Server executes `scripts/backup_database.sh` via child_process; mysqldump creates gzip archive in backups/ directory; toast displays "Backup snapshot created: backup_2026_XX_XX.sql.gz". |
| **Actual Result** | As expected. Compressed database dump generated in backups/ in 0.9s. |
| **Status** | **PASSED** |
| **Post-Condition** | New .sql.gz archive saved in backups/ folder. |

---

### [TC-SYS-DR-004] Local Backup Snapshots History Table View

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-004` |
| **Title & Description** | **Local Backup Snapshots History Table View**<br>Verify that the backup history table lists all existing local snapshot archives with dates, sizes, and restore triggers. |
| **Pre-Condition** | Admin is on backups page; backup files exist in backups/ folder. |
| **Test Data** | `Inspect Local Backups table.` |
| **Test Steps** | 1. Scroll to Local Snapshots Table.<br>2. Verify table rows show filename, creation date, file size (e.g. 1.4 MB), and action icons. |
| **Expected Result** | Table renders list of existing .sql.gz files read directly from server file system. |
| **Actual Result** | As expected. Local snapshots listed with accurate metadata. |
| **Status** | **PASSED** |
| **Post-Condition** | Backup list displayed. |

---

### [TC-SYS-DR-005] Download Backup Snapshot File Button

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-005` |
| **Title & Description** | **Download Backup Snapshot File Button**<br>Verify that clicking download icon on a backup row downloads the `.sql.gz` archive to admin's physical drive. |
| **Pre-Condition** | Backup row is visible in table. |
| **Test Data** | `Click download icon on latest backup snapshot row.` |
| **Test Steps** | 1. Click the download arrow icon on backup row. |
| **Expected Result** | Server serves `.sql.gz` file via secure download stream; browser saves archive to local Downloads folder. |
| **Actual Result** | As expected. Gzip database snapshot downloaded cleanly. |
| **Status** | **PASSED** |
| **Post-Condition** | Archive file downloaded to client machine. |

---

### [TC-SYS-DR-006] Keyboard Shortcuts Modal Trigger ("?" or Shortcut Key)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-006` |
| **Title & Description** | **Keyboard Shortcuts Modal Trigger ("?" or Shortcut Key)**<br>Verify that pressing Shift+? or clicking keyboard icon opens keyboard shortcuts cheatsheet modal. |
| **Pre-Condition** | User is authenticated on any dashboard page. |
| **Test Data** | `Press Shift + ? on keyboard or click keyboard icon in footer.` |
| **Test Steps** | 1. Press Shift + ? key combination on keyboard.<br>2. Observe shortcuts cheatsheet modal. |
| **Expected Result** | Keyboard Shortcuts modal opens displaying hotkeys (e.g. Alt+S for scanner, Alt+C for chat, Esc to close modals). |
| **Actual Result** | As expected. Keyboard shortcuts cheatsheet opened. |
| **Status** | **PASSED** |
| **Post-Condition** | Shortcuts modal displayed. |

---

### [TC-SYS-DR-007] Archive Academic Year Trigger ("Archive Current Year" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-007` |
| **Title & Description** | **Archive Academic Year Trigger ("Archive Current Year" Button)**<br>Verify that Admin can archive current semester/year records into historical storage upon term completion. |
| **Pre-Condition** | Admin is authenticated; term is finished. |
| **Test Data** | `Click "Archive Academic Year" button; confirm term "A.Y. 2025-2026 - 1st Semester".` |
| **Test Steps** | 1. Click "Archive Academic Year" button in admin settings.<br>2. Type confirmation passphrase: "ARCHIVE-CONFIRM".<br>3. Click "Proceed with Archiving". |
| **Expected Result** | System creates snapshot in archived_years table; active roster resets for next incoming batch; toast confirms "Academic Year archived successfully". |
| **Actual Result** | As expected. Academic year archived cleanly with full historical preservation. |
| **Status** | **PASSED** |
| **Post-Condition** | Archived batch saved in archived_years table. |

---

### [TC-SYS-DR-008] Archived Year View Mode ("Switch to Archived AY View" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-008` |
| **Title & Description** | **Archived Year View Mode ("Switch to Archived AY View" Button)**<br>Verify that Admin and Instructors can inspect historical data in read-only Archive Mode. |
| **Pre-Condition** | Archived year exists (e.g. A.Y. 2024-2025). |
| **Test Data** | `Select "View Archive: A.Y. 2024-2025" from sidebar.` |
| **Test Steps** | 1. Click "Archived Academic Years" in sidebar.<br>2. Select "A.Y. 2024-2025 - 2nd Semester". |
| **Expected Result** | System enters Archive Mode: prominent amber top banner indicates "Viewing Historical Archive (Read-Only)"; all modification controls disabled; past records viewable. |
| **Actual Result** | As expected. Archive read-only mode activated with warning banner. |
| **Status** | **PASSED** |
| **Post-Condition** | System in read-only archive mode. |

---

### [TC-SYS-DR-009] Return from Archive to Current Academic Year ("Return to Live System" Button)

| Field | Detalye / System Specification |
| :--- | :--- |
| **Test Case ID** | `TC-SYS-DR-009` |
| **Title & Description** | **Return from Archive to Current Academic Year ("Return to Live System" Button)**<br>Verify that clicking "Return to Current Year" restores normal read/write operations. |
| **Pre-Condition** | System is currently in Archive Mode. |
| **Test Data** | `Click "Return to Current Academic Year" button in amber banner.` |
| **Test Steps** | 1. Click "Return to Current Academic Year" button in top banner. |
| **Expected Result** | Archive banner disappears; system returns to live active semester with full read/write capabilities. |
| **Actual Result** | As expected. System restored to current live semester. |
| **Status** | **PASSED** |
| **Post-Condition** | Live semester active with write permissions restored. |

---


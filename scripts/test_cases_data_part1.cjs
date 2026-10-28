/**
 * Test Cases Dataset - Part 1
 * Modules 1 through 7
 */

module.exports = [
  // ==========================================
  // MODULE 1: AUTHENTICATION & ACCESS CONTROL (AUTH)
  // ==========================================
  {
    module: 'Authentication & Access Control (AUTH)',
    cases: [
      {
        id: 'TC-AUTH-001',
        title: 'Admin Login with Valid Credentials',
        description: 'Verify that an authorized System Administrator can log into the NSTP Management Portal using valid admin email and password.',
        preCondition: 'User is on the login page (http://localhost:5173/login) and not authenticated. Admin account exists in MySQL database.',
        testData: 'Email: "richardbelen99@gmail.com", Password: "[VALID_ADMIN_PW]"',
        steps: [
          'Navigate to the login URL (/login).',
          'Input valid administrator email into the Email field.',
          'Input valid administrator password into the Password field.',
          'Click the "Sign In" button.'
        ],
        expectedResult: 'System authenticates user successfully, issues JWT token in localStorage, displays success toast "Welcome back, Admin!", and redirects to /admin/dashboard.',
        actualResult: 'As expected. JWT received and stored, user redirected to /admin/dashboard with coordinator dashboard rendered.',
        status: 'Passed',
        postCondition: 'Admin session is active in browser localStorage; user remains logged in across authenticated routes.'
      },
      {
        id: 'TC-AUTH-002',
        title: 'Instructor (CWTS) Login with Valid Credentials',
        description: 'Verify that an assigned CWTS Instructor can log in and gets routed to the Instructor Dashboard with CWTS department context.',
        preCondition: 'Instructor account with department="CWTS" exists in users table. User is on /login.',
        testData: 'Email: "cwts.instructor@cvsu-naic.edu.ph", Password: "[VALID_PW]"',
        steps: [
          'Navigate to /login.',
          'Type CWTS instructor email address into the Email field.',
          'Type valid password into the Password field.',
          'Click "Sign In".'
        ],
        expectedResult: 'Authentication succeeds, JWT stored with role="instructor" and department="CWTS", user redirected to /instructor/dashboard.',
        actualResult: 'As expected. User authenticated and redirected to /instructor/dashboard; CWTS department badge displayed.',
        status: 'Passed',
        postCondition: 'CWTS Instructor authenticated; department isolation flags set to CWTS only.'
      },
      {
        id: 'TC-AUTH-003',
        title: 'Instructor (ROTC) Login with Valid Credentials',
        description: 'Verify that an assigned ROTC Instructor can log in and is restricted strictly to ROTC student attendance and roster.',
        preCondition: 'Instructor account with department="ROTC" exists in database. User is on /login.',
        testData: 'Email: "rotc.instructor@cvsu-naic.edu.ph", Password: "[VALID_PW]"',
        steps: [
          'Open /login page.',
          'Enter ROTC instructor email in Email input.',
          'Enter correct password in Password input.',
          'Click the "Sign In" button.'
        ],
        expectedResult: 'Authentication succeeds, user redirected to /instructor/dashboard with red ROTC theme indicators and track isolation active.',
        actualResult: 'As expected. Redirected to /instructor/dashboard with ROTC scope active.',
        status: 'Passed',
        postCondition: 'ROTC Instructor session active; track isolation restricts view to ROTC students only.'
      },
      {
        id: 'TC-AUTH-004',
        title: 'Instructor (LTS) Login with Valid Credentials',
        description: 'Verify that an assigned LTS Instructor can log in and is restricted strictly to LTS student attendance and roster.',
        preCondition: 'Instructor account with department="LTS" exists in database. User is on /login.',
        testData: 'Email: "lts.instructor@cvsu-naic.edu.ph", Password: "[VALID_PW]"',
        steps: [
          'Open /login page.',
          'Enter LTS instructor email in Email input.',
          'Enter correct password in Password input.',
          'Click the "Sign In" button.'
        ],
        expectedResult: 'Authentication succeeds, user redirected to /instructor/dashboard with yellow LTS badge and LTS scope active.',
        actualResult: 'As expected. Redirected to /instructor/dashboard with LTS department scope active.',
        status: 'Passed',
        postCondition: 'LTS Instructor session active; track isolation restricts view to LTS students only.'
      },
      {
        id: 'TC-AUTH-005',
        title: 'Login with Invalid Password (Security & Error Toast)',
        description: 'Verify system security response when an existing user email is supplied with an incorrect password.',
        preCondition: 'User is on /login page.',
        testData: 'Email: "richardbelen99@gmail.com", Password: "WrongPassword!2026"',
        steps: [
          'Enter valid admin email address.',
          'Enter incorrect/invalid password string.',
          'Click "Sign In" button.'
        ],
        expectedResult: 'System rejects authentication, returns HTTP 401 Unauthorized, displays error toast "Invalid email or password", and keeps user on /login with password cleared.',
        actualResult: 'As expected. Error toast appeared immediately, password field reset, no token generated.',
        status: 'Passed',
        postCondition: 'No session created; failed attempt logged for rate-limiting calculations.'
      },
      {
        id: 'TC-AUTH-006',
        title: 'Login with Non-Existent Email Address',
        description: 'Verify system behavior when attempting to authenticate with an unregistered email account.',
        preCondition: 'User is on /login page.',
        testData: 'Email: "ghost.user@unknown-domain.com", Password: "SamplePassword123"',
        steps: [
          'Type non-existent email in Email field.',
          'Type arbitrary password in Password field.',
          'Click "Sign In" button.'
        ],
        expectedResult: 'System returns generic error message "Invalid email or password" to prevent user enumeration; access denied.',
        actualResult: 'As expected. Generic message displayed, preventing attacker from enumerating valid registered emails.',
        status: 'Passed',
        postCondition: 'User remains on /login; no access token granted.'
      },
      {
        id: 'TC-AUTH-007',
        title: 'Empty Required Fields Validation on Login Form',
        description: 'Verify client-side validation prevents submission when email or password fields are left blank.',
        preCondition: 'User is on /login page with both inputs empty.',
        testData: 'Email: "", Password: ""',
        steps: [
          'Leave Email and Password fields completely blank.',
          'Click the "Sign In" button.'
        ],
        expectedResult: 'HTML5/React validation prompts appear highlighting required inputs; form submission is blocked.',
        actualResult: 'As expected. Browser highlighted input requirements; no HTTP request dispatched.',
        status: 'Passed',
        postCondition: 'Form remains in initial pristine state.'
      },
      {
        id: 'TC-AUTH-008',
        title: 'Password Visibility Toggle ("Show/Hide Password" Button)',
        description: 'Verify that clicking the eye icon toggle switches password input type between "password" and "text".',
        preCondition: 'User has typed characters into the Password field on /login.',
        testData: 'Password input: "P@ssw0rd2026"',
        steps: [
          'Type "P@ssw0rd2026" into Password input (masked as dots).',
          'Click the Eye Icon toggle button on the right edge of the input.',
          'Verify characters are displayed as plain text.',
          'Click the Eye Icon toggle button again.'
        ],
        expectedResult: 'First click reveals characters in plain text; second click masks characters as hidden bullets again.',
        actualResult: 'As expected. State toggled accurately between hidden and visible text.',
        status: 'Passed',
        postCondition: 'Password field returns to masked state.'
      },
      {
        id: 'TC-AUTH-009',
        title: 'Quick Demo Fill Buttons (Admin & Instructor Auto-fill)',
        description: 'Verify that clicking the quick demo buttons on the login card auto-fills official defense credentials.',
        preCondition: 'User is on /login page in test/evaluation mode.',
        testData: 'Click "Admin Quick Fill" button or "Instructor Quick Fill" button.',
        steps: [
          'Click the "Admin Quick Fill" chip button.',
          'Observe the Email and Password fields.',
          'Click the "Instructor CWTS" chip button.'
        ],
        expectedResult: 'Fields are immediately populated with preset demo credentials ready for one-click defense testing.',
        actualResult: 'As expected. Credentials populated correctly into corresponding fields.',
        status: 'Passed',
        postCondition: 'Form fields populated with chosen demo user credentials.'
      },
      {
        id: 'TC-AUTH-010',
        title: 'Forgot Password Modal Trigger ("Forgot Password?" Link)',
        description: 'Verify that clicking "Forgot password?" opens the password recovery dialog.',
        preCondition: 'User is on /login page.',
        testData: 'Click action on "Forgot password?" hyperlink.',
        steps: [
          'Locate the "Forgot password?" hyperlink beneath the password field.',
          'Click on the link.'
        ],
        expectedResult: 'Password reset modal overlays the screen with an email input prompt and instructions.',
        actualResult: 'As expected. Forgot Password modal opened with email input field.',
        status: 'Passed',
        postCondition: 'Reset modal is visible and interactive.'
      },
      {
        id: 'TC-AUTH-011',
        title: 'Forgot Password Reset Email Request ("Send Reset Link" Button)',
        description: 'Verify that submitting an email sends a reset token request without exposing account existence.',
        preCondition: 'Forgot Password modal is open.',
        testData: 'Email: "richardbelen99@gmail.com"',
        steps: [
          'Input registered email address into the reset email field.',
          'Click the "Send Reset Link" button.'
        ],
        expectedResult: 'System processes request, triggers email service, displays toast "Password reset instructions sent to your email", and closes modal.',
        actualResult: 'As expected. Reset request dispatched and success alert shown.',
        status: 'Passed',
        postCondition: 'Password reset token generated and logged in backend; modal closed.'
      },
      {
        id: 'TC-AUTH-012',
        title: 'Forgot Password Modal Dismiss ("Cancel" / "Close" Button)',
        description: 'Verify that clicking "Cancel" closes the forgot password modal without side effects.',
        preCondition: 'Forgot Password modal is open.',
        testData: 'Click "Cancel" button.',
        steps: [
          'Open Forgot Password modal.',
          'Click the "Cancel" or "Close (X)" button.'
        ],
        expectedResult: 'Modal closes smoothly with backdrop fade; focus returns to the main login form.',
        actualResult: 'As expected. Modal dismissed cleanly.',
        status: 'Passed',
        postCondition: 'Login card is fully visible and interactive again.'
      },
      {
        id: 'TC-AUTH-013',
        title: 'Rate Limiting Enforcement (Exceeding Max Login Attempts)',
        description: 'Verify that the server rate limiter blocks brute force attacks after 10 consecutive failed attempts in 15 minutes.',
        preCondition: 'User attempts rapid failed logins on /api/login.',
        testData: 'Email: "test@domain.com", Rapid failed logins: 11 requests.',
        steps: [
          'Submit 10 consecutive incorrect password attempts.',
          'Attempt an 11th login submission within the same 15-minute window.'
        ],
        expectedResult: 'Server returns HTTP 429 (Too Many Requests); frontend displays "Too many login attempts. Please try again after 15 minutes."',
        actualResult: 'As expected. HTTP 429 triggered by express-rate-limit; IP temporarily restricted from logging in.',
        status: 'Passed',
        postCondition: 'Client IP address throttled until the rate limit window resets.'
      },
      {
        id: 'TC-AUTH-014',
        title: 'Protected Route Guard (Unauthenticated Access Redirect)',
        description: 'Verify that attempting to navigate directly to `/admin/dashboard` without a token redirects to `/login`.',
        preCondition: 'Browser localStorage contains no active JWT token.',
        testData: 'URL: "http://localhost:5173/admin/dashboard"',
        steps: [
          'Clear all browser storage and cookies.',
          'Type "http://localhost:5173/admin/dashboard" directly into the browser URL address bar and press Enter.'
        ],
        expectedResult: 'ProtectedRoute component detects null auth state and immediately redirects user to /login.',
        actualResult: 'As expected. Access blocked; browser redirected to /login with state preserved.',
        status: 'Passed',
        postCondition: 'Unauthorized user kept outside internal system pages.'
      },
      {
        id: 'TC-AUTH-015',
        title: 'Role-Based Route Protection (Instructor accessing Admin Area)',
        description: 'Verify that an instructor account is denied access when attempting to open `/admin/dashboard` or `/admin/google-drive`.',
        preCondition: 'User is authenticated as an Instructor (role="instructor").',
        testData: 'URL: "http://localhost:5173/admin/google-drive"',
        steps: [
          'Log in with Instructor account.',
          'Manually enter "/admin/google-drive" into the browser address bar and press Enter.'
        ],
        expectedResult: 'ProtectedRoute checks allowedRoles=["admin"], detects mismatch, and redirects user back to /instructor/dashboard.',
        actualResult: 'As expected. Navigation intercepted; instructor redirected to their authorized dashboard.',
        status: 'Passed',
        postCondition: 'Instructor remains on /instructor/dashboard; admin resources protected.'
      },
      {
        id: 'TC-AUTH-016',
        title: 'User Logout Function ("Logout" Button & Confirmation Dialog)',
        description: 'Verify that clicking Logout in the sidebar opens confirmation modal and clearing session upon confirm.',
        preCondition: 'User is logged into Admin or Instructor portal.',
        testData: 'Click "Logout" button in bottom left sidebar.',
        steps: [
          'Click the "Logout" button with door icon at bottom of sidebar.',
          'Confirm dialog appears: "Are you sure you want to sign out?".',
          'Click "Confirm Sign Out" button.'
        ],
        expectedResult: 'JWT token and user state cleared from localStorage; user redirected to public landing page (/); toast confirms "Logged out successfully".',
        actualResult: 'As expected. Token removed; user redirected to landing page.',
        status: 'Passed',
        postCondition: 'No active session remains; back button cannot navigate back into protected dashboard.'
      },
      {
        id: 'TC-AUTH-017',
        title: 'Cancel Logout Action ("Cancel" Button in Logout Dialog)',
        description: 'Verify that clicking Cancel in logout confirmation dialog maintains current session without logging out.',
        preCondition: 'Logout confirmation dialog is currently displayed.',
        testData: 'Click "Cancel" button in logout modal.',
        steps: [
          'Trigger Logout dialog from sidebar.',
          'Click the "Cancel" button in the modal.'
        ],
        expectedResult: 'Modal closes; user session remains active and uninterrupted on current dashboard.',
        actualResult: 'As expected. Modal dismissed; user stayed logged in.',
        status: 'Passed',
        postCondition: 'User session remains valid and active.'
      }
    ]
  },

  // ==========================================
  // MODULE 2: PUBLIC LANDING PAGE & STUDENT PORTAL (LAND)
  // ==========================================
  {
    module: 'Public Landing Page & Student Portal (LAND)',
    cases: [
      {
        id: 'TC-LAND-001',
        title: 'Header Navigation - Smooth Scroll to "Features" Section',
        description: 'Verify that clicking "Features" in top navbar scrolls page smoothly to system highlights.',
        preCondition: 'User is on http://localhost:5173/ (Landing Page).',
        testData: 'Click navigation item: "Features".',
        steps: [
          'Load landing page.',
          'Click the "Features" link on the navigation header.'
        ],
        expectedResult: 'Viewport scrolls smoothly to #features element displaying system feature cards.',
        actualResult: 'As expected. Viewport scrolled smoothly to Features anchor.',
        status: 'Passed',
        postCondition: 'Features section is in user viewport.'
      },
      {
        id: 'TC-LAND-002',
        title: 'Header Navigation - Smooth Scroll to "Tracking" Section',
        description: 'Verify that clicking "Tracking" scrolls to application status tracking card.',
        preCondition: 'User is on Landing Page.',
        testData: 'Click navigation item: "Tracking".',
        steps: [
          'Click "Tracking" link in header navigation.'
        ],
        expectedResult: 'Viewport scrolls directly to the Application Tracking search card section.',
        actualResult: 'As expected. Page scrolled to Tracking section.',
        status: 'Passed',
        postCondition: 'Tracking container centered in view.'
      },
      {
        id: 'TC-LAND-003',
        title: 'Header Navigation - Smooth Scroll to "About / Tracks" Section',
        description: 'Verify that clicking "Tracks" scrolls down to CWTS, LTS, and ROTC descriptions.',
        preCondition: 'User is on Landing Page.',
        testData: 'Click navigation item: "Program Tracks".',
        steps: [
          'Click "Program Tracks" link on navbar.'
        ],
        expectedResult: 'Viewport scrolls to the three NSTP track overview cards (CWTS, LTS, ROTC).',
        actualResult: 'As expected. Page navigated to Program Tracks section.',
        status: 'Passed',
        postCondition: 'Tracks section visible in viewport.'
      },
      {
        id: 'TC-LAND-004',
        title: 'Real-Time Telemetry Counters Display',
        description: 'Verify that live telemetry counters (Active Students, Total Enrollments, Genuine Visitors) fetch real counts from backend.',
        preCondition: 'Database contains students and enrollments; telemetry API is healthy.',
        testData: 'Page load trigger on /',
        steps: [
          'Open landing page in web browser.',
          'Observe the 3 telemetry metric cards below the hero banner.'
        ],
        expectedResult: 'Telemetry cards animate and display accurate counts from server (Total Enrolled, Active Candidates, and Visitor metrics).',
        actualResult: 'As expected. Counter metrics loaded with count-up animation.',
        status: 'Passed',
        postCondition: 'Telemetry metrics rendered accurately.'
      },
      {
        id: 'TC-LAND-005',
        title: 'Primary Call-to-Action - "Enroll Now / Apply for NSTP" Button',
        description: 'Verify that clicking the primary "Enroll Now" CTA navigates to freshman enrollment wizard.',
        preCondition: 'User is on Landing Page.',
        testData: 'Click button: "Enroll Now / Apply for NSTP".',
        steps: [
          'Click the prominent "Apply for NSTP" hero button.'
        ],
        expectedResult: 'Browser navigates to /enrollment; Step 1 of the Online Enrollment form is displayed.',
        actualResult: 'As expected. User redirected to /enrollment.',
        status: 'Passed',
        postCondition: 'Enrollment page initialized in browser.'
      },
      {
        id: 'TC-LAND-006',
        title: 'Secondary Call-to-Action - "Staff Portal Login" Button',
        description: 'Verify that clicking "Staff Portal Login" button directs faculty and coordinators to login page.',
        preCondition: 'User is on Landing Page.',
        testData: 'Click button: "Staff Portal Login".',
        steps: [
          'Click the "Staff Login" button in hero or top right header.'
        ],
        expectedResult: 'Browser navigates to /login with staff login form rendered.',
        actualResult: 'As expected. Redirected to /login.',
        status: 'Passed',
        postCondition: 'Login page active.'
      },
      {
        id: 'TC-LAND-007',
        title: 'Application Tracking Trigger ("Track Application" Button)',
        description: 'Verify that clicking "Track Application" opens modal or activates search box.',
        preCondition: 'User is on Landing Page.',
        testData: 'Click button: "Track Application".',
        steps: [
          'Click the "Track Application" button in the hero or tracking section.'
        ],
        expectedResult: 'Input modal or search focus is triggered for entering Reference Code.',
        actualResult: 'As expected. Reference tracking box activated.',
        status: 'Passed',
        postCondition: 'Tracking input field ready for keystrokes.'
      },
      {
        id: 'TC-LAND-008',
        title: 'Application Tracking Search with Valid Reference Number',
        description: 'Verify that submitting a valid Reference Number displays the live status of the enrollment.',
        preCondition: 'An enrollment application exists with reference code "REF-2026-CWTS-001" and status="Approved".',
        testData: 'Reference ID: "REF-2026-CWTS-001"',
        steps: [
          'Enter "REF-2026-CWTS-001" into Tracking search field.',
          'Click "Check Status" button.'
        ],
        expectedResult: 'Card renders student name, chosen track (CWTS), submission date, status badge ("Approved"), and digital ID link if approved.',
        actualResult: 'As expected. Application details displayed with green Approved badge.',
        status: 'Passed',
        postCondition: 'Status details displayed; user informed of application progress.'
      },
      {
        id: 'TC-LAND-009',
        title: 'Application Tracking Search with Invalid / Not Found Code',
        description: 'Verify system behavior when user searches for a non-existent reference code.',
        preCondition: 'No record matches "REF-INVALID-999".',
        testData: 'Reference ID: "REF-INVALID-999"',
        steps: [
          'Enter "REF-INVALID-999" into search field.',
          'Click "Check Status".'
        ],
        expectedResult: 'System displays clear notice: "No enrollment record found matching this Reference Number. Please verify your reference code or contact OSDS."',
        actualResult: 'As expected. User-friendly not-found alert displayed.',
        status: 'Passed',
        postCondition: 'No sensitive data exposed; search field remains active.'
      },
      {
        id: 'TC-LAND-010',
        title: 'Application Tracking Modal Dismiss ("Close" Button)',
        description: 'Verify that closing tracking modal resets search input and removes overlay.',
        preCondition: 'Tracking results modal is open.',
        testData: 'Click "Close (X)" button.',
        steps: [
          'Click the close icon button on tracking dialog.'
        ],
        expectedResult: 'Tracking dialog disappears; background page becomes active.',
        actualResult: 'As expected. Dialog closed smoothly.',
        status: 'Passed',
        postCondition: 'Landing page interactive.'
      },
      {
        id: 'TC-LAND-011',
        title: 'Interactive Track Overview Tabs (CWTS / LTS / ROTC Details)',
        description: 'Verify that switching tabs dynamically changes displayed information about CWTS, LTS, and ROTC.',
        preCondition: 'User is on Program Tracks section on landing page.',
        testData: 'Click "ROTC" tab, then "LTS" tab, then "CWTS" tab.',
        steps: [
          'Click the "ROTC" component tab.',
          'Verify military training objectives and officer requirements are shown.',
          'Click "CWTS" component tab.',
          'Verify community service and civic welfare highlights are shown.'
        ],
        expectedResult: 'Tab content changes dynamically with corresponding track description, training hours (54 hours), and course requirements.',
        actualResult: 'As expected. Content updated reactively without page reload.',
        status: 'Passed',
        postCondition: 'Selected track content is active.'
      },
      {
        id: 'TC-LAND-012',
        title: 'Public Announcements Banner & View Details Modal',
        description: 'Verify that clicking on an announcement card opens full announcement details dialog.',
        preCondition: 'Active announcement posted by Admin.',
        testData: 'Click announcement card: "Orientation Schedule for 1st Semester".',
        steps: [
          'Locate public announcements carousel or list.',
          'Click "Read More" on the latest announcement card.'
        ],
        expectedResult: 'Announcement modal opens showing complete memo text, date published, venue, and instructions.',
        actualResult: 'As expected. Announcement detail modal displayed.',
        status: 'Passed',
        postCondition: 'Announcement modal open.'
      },
      {
        id: 'TC-LAND-013',
        title: 'Footer CvSU Naic Official External Links',
        description: 'Verify that official footer links (CvSU Main portal, CvSU Naic Facebook, CHED official site) open in a new tab securely.',
        preCondition: 'User scrolls to bottom footer.',
        testData: 'Click CvSU Official Portal link.',
        steps: [
          'Scroll to footer.',
          'Click "CvSU Naic Official Website" link.'
        ],
        expectedResult: 'Link opens external URL in new browser tab with rel="noopener noreferrer" for security.',
        actualResult: 'As expected. External link opened safely in new tab.',
        status: 'Passed',
        postCondition: 'New tab opened; original landing page remains intact.'
      }
    ]
  },

  // ==========================================
  // MODULE 3: ONLINE STUDENT ENROLLMENT & DOCUMENT VERIFICATION (ENRL)
  // ==========================================
  {
    module: 'Online Student Enrollment & Document Verification (ENRL)',
    cases: [
      {
        id: 'TC-ENRL-001',
        title: 'Step 1 - Personal Information Form Input Fields & Validations',
        description: 'Verify that Step 1 fields validate required personal information (Student ID, Name, Contact, Email, Degree Program, Section).',
        preCondition: 'User is on /enrollment (Step 1).',
        testData: 'Student ID: "2026-10023", Name: "Juan Santos Dela Cruz", Email: "juan.delacruz@cvsu.edu.ph", Course: "BSIT", Section: "1-1"',
        steps: [
          'Fill in Student Number, First Name, Last Name, Birthdate, Gender, Course, Section, Contact No, and Email.',
          'Leave one mandatory field blank (e.g. Email) and attempt to proceed.',
          'Supply the missing field.'
        ],
        expectedResult: 'System highlights invalid/empty field with red validation warning; when properly filled, validation passes.',
        actualResult: 'As expected. Validation caught missing field; cleared when valid data was entered.',
        status: 'Passed',
        postCondition: 'Step 1 fields validated and stored in local state.'
      },
      {
        id: 'TC-ENRL-002',
        title: 'Step 1 - Duplicate Student Number Validation Prevention',
        description: 'Verify that the system prevents entering a Student Number that already exists in the approved students database.',
        preCondition: 'Student ID "2024-00101" already exists in students table.',
        testData: 'Student Number: "2024-00101"',
        steps: [
          'Enter already registered student ID "2024-00101" in Student Number input.',
          'Tab out or click "Proceed to Track Selection".'
        ],
        expectedResult: 'System triggers pre-validation check and displays warning: "Student ID 2024-00101 is already enrolled in NSTP."',
        actualResult: 'As expected. Duplicate detection prevented duplicate entry.',
        status: 'Passed',
        postCondition: 'User cannot proceed to Step 2 with duplicate student number.'
      },
      {
        id: 'TC-ENRL-003',
        title: 'Step 1 to Step 2 Navigation ("Proceed to Track Selection" Button)',
        description: 'Verify that clicking "Proceed to Track Selection" transitions to Step 2 wizard.',
        preCondition: 'Step 1 form is completely and validly filled out.',
        testData: 'Click button: "Proceed to Track Selection".',
        steps: [
          'Review all Step 1 fields.',
          'Click "Proceed to Track Selection" button at bottom right.'
        ],
        expectedResult: 'Progress bar advances to Step 2 (50%); Track selection cards (CWTS, LTS, ROTC) are rendered.',
        actualResult: 'As expected. Wizard transitioned to Step 2 smoothly.',
        status: 'Passed',
        postCondition: 'Wizard is on Step 2; Step 1 data retained in state.'
      },
      {
        id: 'TC-ENRL-004',
        title: 'Step 2 - NSTP Track Selection (Select CWTS / LTS / ROTC Card)',
        description: 'Verify that user can select one of the three NSTP components by clicking its interactive card.',
        preCondition: 'Wizard is on Step 2.',
        testData: 'Select "ROTC" track card.',
        steps: [
          'Click the ROTC card.',
          'Observe the card styling (highlight border, check icon).',
          'Click the CWTS card.'
        ],
        expectedResult: 'Selected card receives active highlight style and radio indicator; previous selection is unselected.',
        actualResult: 'As expected. Radio selection updated reactively.',
        status: 'Passed',
        postCondition: 'Chosen track stored in state (e.g. selectedTrack = "CWTS").'
      },
      {
        id: 'TC-ENRL-005',
        title: 'Step 2 - Back Navigation ("Back to Personal Info" Button)',
        description: 'Verify that clicking "Back" returns to Step 1 without erasing previously entered personal details.',
        preCondition: 'User is on Step 2.',
        testData: 'Click "Back" button.',
        steps: [
          'Click the "Back" button.',
          'Inspect the fields on Step 1.'
        ],
        expectedResult: 'Wizard returns to Step 1; all previously typed names, IDs, and email values are preserved intact.',
        actualResult: 'As expected. Step 1 inputs preserved without data loss.',
        status: 'Passed',
        postCondition: 'User is on Step 1 with form data preserved.'
      },
      {
        id: 'TC-ENRL-006',
        title: 'Step 2 to Step 3 Navigation ("Proceed to Document Upload" Button)',
        description: 'Verify that clicking "Proceed to Document Upload" with a selected track navigates to Step 3.',
        preCondition: 'A track is selected on Step 2.',
        testData: 'Click "Proceed to Document Upload".',
        steps: [
          'Select CWTS track.',
          'Click "Proceed to Document Upload" button.'
        ],
        expectedResult: 'Wizard advances to Step 3 (75%); file upload slots for 2x2 Photo and COR are presented.',
        actualResult: 'As expected. Wizard navigated to Step 3.',
        status: 'Passed',
        postCondition: 'Step 3 Document Upload container displayed.'
      },
      {
        id: 'TC-ENRL-007',
        title: 'Step 3 - Formal 2x2 Photo Upload via File Selector (JPEG/PNG)',
        description: 'Verify that a student can upload a valid 2x2 ID picture and preview it in real-time.',
        preCondition: 'Wizard is on Step 3.',
        testData: 'File: "formal_2x2_photo.jpg" (dimensions: 600x600, 150KB)',
        steps: [
          'Click "Choose 2x2 Photo" or drag file into dropzone.',
          'Select "formal_2x2_photo.jpg".'
        ],
        expectedResult: 'Image is accepted, preview thumbnail renders in circle/square container, file size and name shown.',
        actualResult: 'As expected. Photo uploaded and thumbnail preview displayed.',
        status: 'Passed',
        postCondition: 'Photo base64 data stored in photoData state.'
      },
      {
        id: 'TC-ENRL-008',
        title: 'Step 3 - Formal 2x2 Photo Capture via Webcam / Device Camera ("Take Photo" Button)',
        description: 'Verify that student can take an immediate 2x2 photo using device camera if webcam is accessible.',
        preCondition: 'Device camera permissions granted.',
        testData: 'Click "Take Photo with Camera" button.',
        steps: [
          'Click the camera icon button under 2x2 slot.',
          'Camera viewfinder modal appears with live video stream.',
          'Align face in oval guide and click "Capture Photo" button.',
          'Click "Use This Photo".'
        ],
        expectedResult: 'Video stream captures current frame to canvas, crops to 1:1 aspect ratio, and populates 2x2 photo slot.',
        actualResult: 'As expected. Live camera captured snapshot and populated slot.',
        status: 'Passed',
        postCondition: 'Captured image stored in photoData.'
      },
      {
        id: 'TC-ENRL-009',
        title: 'Step 3 - Remove / Re-upload 2x2 Photo ("Remove Photo" Button)',
        description: 'Verify that student can remove an uploaded 2x2 photo and choose another file.',
        preCondition: 'Photo already uploaded in 2x2 slot.',
        testData: 'Click "Remove Photo" trash icon button.',
        steps: [
          'Click the trash icon button on the 2x2 photo thumbnail.',
          'Verify preview is cleared.'
        ],
        expectedResult: 'Photo removed from state; dropzone resets to default "Click or Drag to Upload" placeholder.',
        actualResult: 'As expected. Photo cleared and dropzone reset.',
        status: 'Passed',
        postCondition: 'photoData state is null.'
      },
      {
        id: 'TC-ENRL-010',
        title: 'Step 3 - COR Upload via File Selector',
        description: 'Verify that user can select and upload their official Certificate of Registration (COR).',
        preCondition: 'Wizard is on Step 3.',
        testData: 'File: "official_cor_sample.png" (scanned university registration)',
        steps: [
          'Click "Upload Certificate of Registration (COR)".',
          'Select "official_cor_sample.png".'
        ],
        expectedResult: 'Client-side Canvas Document Validator analyzes the image; passes validation and renders document preview.',
        actualResult: 'As expected. File loaded and document preview rendered.',
        status: 'Passed',
        postCondition: 'COR file stored in corData state.'
      },
      {
        id: 'TC-ENRL-011',
        title: 'Step 3 - Canvas Document Validation: Reject Non-Document / Selfie Image',
        description: 'Verify that the canvas algorithm rejects selfie or colorful landscape photos uploaded into the COR slot.',
        preCondition: 'Wizard is on Step 3.',
        testData: 'File: "beach_selfie.jpg" (colorful high-chroma photo, Chroma > 45, background luminance variable)',
        steps: [
          'Select "beach_selfie.jpg" for the COR slot.',
          'Wait for canvas document verification.'
        ],
        expectedResult: 'Canvas validator computes Chroma > 36 and non-document luminance; displays error: "The uploaded file does not look like an official printed document or Certificate of Registration. Please upload a clear photo or scan of your COR." File is rejected.',
        actualResult: 'As expected. Canvas analysis rejected the selfie with Chroma warning.',
        status: 'Passed',
        postCondition: 'COR slot remains empty; invalid file rejected.'
      },
      {
        id: 'TC-ENRL-012',
        title: 'Step 3 - Canvas Document Validation: Reject Blank White Paper',
        description: 'Verify that canvas algorithm rejects a completely blank white image without ink/text pixels.',
        preCondition: 'Wizard is on Step 3.',
        testData: 'File: "blank_white_paper.jpg" (white canvas, no text, ink density < 1%)',
        steps: [
          'Select "blank_white_paper.jpg" for the COR slot.',
          'Observe canvas verification result.'
        ],
        expectedResult: 'Canvas validator detects insufficient ink density (text pixels < threshold); displays warning: "The uploaded document contains no readable text or is blank. Please upload your official COR." Upload rejected.',
        actualResult: 'As expected. Blank paper rejected due to low ink density.',
        status: 'Passed',
        postCondition: 'corData remains null.'
      },
      {
        id: 'TC-ENRL-013',
        title: 'Step 3 - Canvas Document Validation: Reject Duplicate Image',
        description: 'Verify that the system detects and rejects uploading the exact same image for both 2x2 photo and COR.',
        preCondition: '2x2 photo is already populated with "student_photo.jpg".',
        testData: 'File: "student_photo.jpg" uploaded to COR slot.',
        steps: [
          'Upload "student_photo.jpg" to 2x2 slot.',
          'Attempt to upload "student_photo.jpg" to the COR slot.'
        ],
        expectedResult: 'System computes image hash / pixel comparison, detects duplicate image match; displays error: "You cannot use the same image for both your 2x2 Photo and Certificate of Registration." File rejected.',
        actualResult: 'As expected. Duplicate image detected and rejected.',
        status: 'Passed',
        postCondition: 'COR slot remains unpopulated.'
      },
      {
        id: 'TC-ENRL-014',
        title: 'Step 3 - Canvas Document Validation: Accept Legitimate Document / Scanned COR',
        description: 'Verify that a legitimate scanned COR with white background, low chroma (<36), and text pixels passes validation.',
        preCondition: 'Wizard is on Step 3.',
        testData: 'File: "valid_cvsu_cor.png" (scanned printed document)',
        steps: [
          'Upload "valid_cvsu_cor.png" into COR slot.',
          'Wait for canvas analysis.'
        ],
        expectedResult: 'Luminance > 140, Chroma < 36, Ink density > 3% pass checks; green badge "Document Verified" displayed.',
        actualResult: 'As expected. Document validation passed with green verified badge.',
        status: 'Passed',
        postCondition: 'COR accepted and ready for submission.'
      },
      {
        id: 'TC-ENRL-015',
        title: 'Step 3 - Remove / Re-upload COR Document ("Remove COR" Button)',
        description: 'Verify that clicking "Remove COR" removes the verified document and resets the dropzone.',
        preCondition: 'COR is currently uploaded in Step 3.',
        testData: 'Click "Remove COR" button.',
        steps: [
          'Click the remove trash icon on the COR preview.'
        ],
        expectedResult: 'Document removed from state; validator status reset; placeholder restored.',
        actualResult: 'As expected. Document cleared successfully.',
        status: 'Passed',
        postCondition: 'corData state is null.'
      },
      {
        id: 'TC-ENRL-016',
        title: 'Step 3 to Step 4 Navigation ("Review Application" Button)',
        description: 'Verify that clicking "Review Application" advances to final review when both documents are valid.',
        preCondition: 'Both 2x2 photo and verified COR are present.',
        testData: 'Click "Review Application" button.',
        steps: [
          'Click "Review Application" button at bottom right.'
        ],
        expectedResult: 'Wizard advances to Step 4 (100%); Summary review screen displays all entered details and document thumbnails.',
        actualResult: 'As expected. Navigated to Step 4 review screen.',
        status: 'Passed',
        postCondition: 'Step 4 Review screen active.'
      },
      {
        id: 'TC-ENRL-017',
        title: 'Step 4 - Terms of Agreement & Data Privacy Act Consent Checkbox',
        description: 'Verify that the user cannot submit application without checking the Data Privacy Act (RA 10173) consent checkbox.',
        preCondition: 'Wizard is on Step 4; consent checkbox is unchecked.',
        testData: 'Click "Submit Enrollment Application" with checkbox unchecked.',
        steps: [
          'Leave the Data Privacy Consent checkbox unchecked.',
          'Click "Submit Enrollment Application" button.'
        ],
        expectedResult: 'Submission is blocked; warning alert indicates: "You must agree to the Terms and Data Privacy Policy before submitting."',
        actualResult: 'As expected. Submission blocked until agreement is confirmed.',
        status: 'Passed',
        postCondition: 'Form not submitted; checkbox highlighted in red.'
      },
      {
        id: 'TC-ENRL-018',
        title: 'Step 4 - Final Submission ("Submit Enrollment Application" Button)',
        description: 'Verify that clicking Submit with consent checked creates pending enrollment in MySQL database.',
        preCondition: 'All steps validly completed; consent checkbox checked.',
        testData: 'Click "Submit Enrollment Application" button.',
        steps: [
          'Check "I agree to the Terms of Service and Data Privacy Policy (RA 10173)".',
          'Click "Submit Enrollment Application" button.'
        ],
        expectedResult: 'Form submits payload to /api/enrollment; server returns HTTP 201 with unique Reference ID; UI transitions to Confirmation Screen.',
        actualResult: 'As expected. HTTP 201 returned; pending enrollment record inserted into enrollments table.',
        status: 'Passed',
        postCondition: 'Enrollment record in database with status="Pending".'
      },
      {
        id: 'TC-ENRL-019',
        title: 'Submission Success - Reference Code Generation & Display',
        description: 'Verify that the confirmation screen displays the unique Reference Code (e.g., REF-2026-XXXXX) and instructions.',
        preCondition: 'Application just submitted successfully.',
        testData: 'Confirmation screen view.',
        steps: [
          'Observe the confirmation screen.'
        ],
        expectedResult: 'Reference Code prominently displayed with Copy button; message advises student to save code for tracking status.',
        actualResult: 'As expected. Reference Code shown with one-click copy button.',
        status: 'Passed',
        postCondition: 'Reference code visible to student.'
      },
      {
        id: 'TC-ENRL-020',
        title: 'Submission Success - "Download Application Receipt (PDF)" Button',
        description: 'Verify that clicking "Download Receipt" generates a formatted PDF application receipt.',
        preCondition: 'Confirmation screen is active.',
        testData: 'Click "Download Application Receipt (PDF)" button.',
        steps: [
          'Click "Download Application Receipt" button.'
        ],
        expectedResult: 'jsPDF compiles receipt with CvSU Naic header, student info, reference barcode, and timestamp; downloads .pdf file.',
        actualResult: 'As expected. PDF receipt generated and downloaded.',
        status: 'Passed',
        postCondition: 'PDF receipt saved on client device.'
      },
      {
        id: 'TC-ENRL-021',
        title: 'Submission Success - "Print Application Summary" Button',
        description: 'Verify that clicking "Print" triggers browser print preview for the enrollment summary.',
        preCondition: 'Confirmation screen is active.',
        testData: 'Click "Print Summary" button.',
        steps: [
          'Click "Print Summary" button.'
        ],
        expectedResult: 'Browser native print dialog window opens with styled printable receipt layout.',
        actualResult: 'As expected. Print window opened with clean layout.',
        status: 'Passed',
        postCondition: 'Print dialog open.'
      },
      {
        id: 'TC-ENRL-022',
        title: 'Submission Success - "Return to Home Page" Button',
        description: 'Verify that clicking "Return to Home Page" redirects back to landing page.',
        preCondition: 'Confirmation screen is active.',
        testData: 'Click "Return to Home Page" button.',
        steps: [
          'Click "Return to Home Page" button.'
        ],
        expectedResult: 'Browser navigates to /; enrollment wizard state is cleared.',
        actualResult: 'As expected. User returned to landing page.',
        status: 'Passed',
        postCondition: 'Landing page displayed.'
      }
    ]
  },

  // ==========================================
  // MODULE 4: ADMINISTRATOR DASHBOARD & ANALYTICS (DASH-ADM)
  // ==========================================
  {
    module: 'Administrator Dashboard & Analytics (DASH-ADM)',
    cases: [
      {
        id: 'TC-DASH-ADM-001',
        title: 'Dashboard Executive Metric Cards Rendering',
        description: 'Verify that the 4 executive metric cards (Total Students, Instructors, Pending Enrollments, Attendance Rate) load accurate counts.',
        preCondition: 'Admin is logged in on /admin/dashboard.',
        testData: 'Page load trigger on /admin/dashboard.',
        steps: [
          'Navigate to /admin/dashboard.',
          'Inspect the 4 top metric cards.'
        ],
        expectedResult: 'Each metric card displays correct aggregated data from MySQL (total enrolled students, active instructors, pending applications, overall attendance %).',
        actualResult: 'As expected. All 4 metrics loaded accurately with icons and percentage trends.',
        status: 'Passed',
        postCondition: 'Metric summary visible on dashboard.'
      },
      {
        id: 'TC-DASH-ADM-002',
        title: 'Academic Year / Semester Dropdown Selector',
        description: 'Verify that changing the Academic Year dropdown re-queries statistics for the selected academic term.',
        preCondition: 'Admin is on dashboard; archived years exist (e.g. 2024-2025, 2025-2026).',
        testData: 'Select "A.Y. 2024-2025 - 2nd Semester" in dropdown.',
        steps: [
          'Click the Academic Year selector dropdown in the top header.',
          'Choose "A.Y. 2024-2025 - 2nd Semester".'
        ],
        expectedResult: 'Dashboard metrics, charts, and tables update to reflect data from the chosen academic term.',
        actualResult: 'As expected. Dashboard re-queried and updated for selected term.',
        status: 'Passed',
        postCondition: 'Selected term stored in active session context.'
      },
      {
        id: 'TC-DASH-ADM-003',
        title: 'Top Navbar Notification Bell Button (Open Notification Flyout)',
        description: 'Verify that clicking the bell icon opens the real-time notifications dropdown modal.',
        preCondition: 'Admin is on dashboard; unread notifications exist.',
        testData: 'Click Bell Icon button on top navigation bar.',
        steps: [
          'Locate the Bell Icon with unread badge in top navbar.',
          'Click on the Bell Icon.'
        ],
        expectedResult: 'Notification flyout panel slides open showing list of recent system events, submitted enrollments, and messages.',
        actualResult: 'As expected. Notification panel opened with list of notifications.',
        status: 'Passed',
        postCondition: 'Notification modal visible.'
      },
      {
        id: 'TC-DASH-ADM-004',
        title: 'Notification Modal - "Mark All as Read" Button',
        description: 'Verify that clicking "Mark All as Read" clears unread badges and updates read status in database.',
        preCondition: 'Notification modal is open with unread notifications.',
        testData: 'Click "Mark All as Read" button.',
        steps: [
          'Click "Mark All as Read" button at top of notification flyout.'
        ],
        expectedResult: 'All unread notification items update to read state; red counter badge on navbar bell disappears.',
        actualResult: 'As expected. Unread count reset to 0; items marked read.',
        status: 'Passed',
        postCondition: 'No unread notifications pending.'
      },
      {
        id: 'TC-DASH-ADM-005',
        title: 'Notification Modal - Filter Tabs ("All" vs "Unread" Button)',
        description: 'Verify that clicking "Unread" tab filters notification list to display only unread alerts.',
        preCondition: 'Notification flyout is open.',
        testData: 'Click "Unread" tab button.',
        steps: [
          'Click the "Unread" tab.',
          'Observe filtered list.',
          'Click the "All" tab.'
        ],
        expectedResult: 'Switching to "Unread" shows only unread notifications; switching to "All" shows all historical items.',
        actualResult: 'As expected. Tabs filtered items reactively.',
        status: 'Passed',
        postCondition: 'Chosen filter active.'
      },
      {
        id: 'TC-DASH-ADM-006',
        title: 'Notification Modal - "Delete Selected Notifications" Button',
        description: 'Verify that admin can select notifications via checkboxes and delete them.',
        preCondition: 'Notification modal open.',
        testData: 'Select 2 notification checkboxes; click "Delete Selected".',
        steps: [
          'Select checkboxes next to two notification items.',
          'Click the trash icon "Delete Selected" button.'
        ],
        expectedResult: 'Selected notifications are removed from list and database.',
        actualResult: 'As expected. Selected items deleted smoothly.',
        status: 'Passed',
        postCondition: 'Deleted notifications removed from database.'
      },
      {
        id: 'TC-DASH-ADM-007',
        title: 'Interactive Grouped Column Bar Graph - "All Tracks" Filter Toggle',
        description: 'Verify that the "All Tracks" toggle displays all three tracks (CWTS in Green, LTS in Purple, ROTC in Red) for each course.',
        preCondition: 'Admin is on dashboard viewing the Analytics Bar Graph.',
        testData: 'Click "All Tracks" filter button.',
        steps: [
          'Click the "All Tracks" toggle button above the bar chart.'
        ],
        expectedResult: 'Chart displays clustered columns for CWTS (green), LTS (purple), and ROTC (red) across BSIT, BSCS, BSHM, BSBA, BSFAS.',
        actualResult: 'As expected. Clustered grouped bar chart rendered all 3 track columns.',
        status: 'Passed',
        postCondition: 'All tracks visible in analytics chart.'
      },
      {
        id: 'TC-DASH-ADM-008',
        title: 'Interactive Grouped Column Bar Graph - "CWTS Only" Filter Toggle',
        description: 'Verify that clicking "CWTS Only" filters the grouped column bar chart to show only CWTS columns.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "CWTS Only" button.',
        steps: [
          'Click the "CWTS Only" button above the chart.'
        ],
        expectedResult: 'Chart isolates and displays only the green CWTS columns; LTS and ROTC columns are hidden.',
        actualResult: 'As expected. Only CWTS columns rendered.',
        status: 'Passed',
        postCondition: 'CWTS filter applied to chart.'
      },
      {
        id: 'TC-DASH-ADM-009',
        title: 'Interactive Grouped Column Bar Graph - "LTS Only" Filter Toggle',
        description: 'Verify that clicking "LTS Only" filters the grouped column bar chart to show only LTS columns.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "LTS Only" button.',
        steps: [
          'Click the "LTS Only" button above the chart.'
        ],
        expectedResult: 'Chart isolates and displays only the purple LTS columns across degree programs.',
        actualResult: 'As expected. Only LTS columns rendered.',
        status: 'Passed',
        postCondition: 'LTS filter applied to chart.'
      },
      {
        id: 'TC-DASH-ADM-010',
        title: 'Interactive Grouped Column Bar Graph - "ROTC Only" Filter Toggle',
        description: 'Verify that clicking "ROTC Only" filters the grouped column bar chart to show only ROTC columns.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "ROTC Only" button.',
        steps: [
          'Click the "ROTC Only" button above the chart.'
        ],
        expectedResult: 'Chart isolates and displays only the red ROTC columns across degree programs.',
        actualResult: 'As expected. Only ROTC columns rendered.',
        status: 'Passed',
        postCondition: 'ROTC filter applied to chart.'
      },
      {
        id: 'TC-DASH-ADM-011',
        title: 'Grouped Column Bar Graph - Direct Bar Column Click (Course Drilldown)',
        description: 'Verify that clicking a specific course bar (e.g. BSIT) filters the student roster below to BSIT students only.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click the "BSIT" column bar in the graph.',
        steps: [
          'Hover over the BSIT grouped bar column.',
          'Click on the BSIT bar.'
        ],
        expectedResult: 'Chart triggers drill-down filter; table below immediately filters to show only BSIT students.',
        actualResult: 'As expected. Student table filtered to BSIT program automatically.',
        status: 'Passed',
        postCondition: 'Course filter active in table.'
      },
      {
        id: 'TC-DASH-ADM-012',
        title: 'Pending Enrollments Roster - Search by Name / Student Number',
        description: 'Verify that the search bar in Pending Enrollments filters applicant list in real-time.',
        preCondition: 'Pending applications exist.',
        testData: 'Search Query: "Santos"',
        steps: [
          'Type "Santos" into the search box above Pending Enrollments.'
        ],
        expectedResult: 'Table filters dynamically to show only applicants whose first, middle, or last name matches "Santos".',
        actualResult: 'As expected. Real-time filtering executed as user typed.',
        status: 'Passed',
        postCondition: 'Filtered records displayed.'
      },
      {
        id: 'TC-DASH-ADM-013',
        title: 'Pending Enrollments Roster - Filter by Degree Program / Course Dropdown',
        description: 'Verify that selecting a course from dropdown isolates pending applications for that course.',
        preCondition: 'Pending applications exist across various courses.',
        testData: 'Select "BSCS" from Course dropdown.',
        steps: [
          'Click Course filter dropdown.',
          'Choose "Bachelor of Science in Computer Science (BSCS)".'
        ],
        expectedResult: 'Table updates to display only BSCS pending applicants.',
        actualResult: 'As expected. List restricted to BSCS applicants.',
        status: 'Passed',
        postCondition: 'BSCS filter applied.'
      },
      {
        id: 'TC-DASH-ADM-014',
        title: 'Pending Enrollments - "View COR & Audit Details" Modal Trigger Button',
        description: 'Verify that clicking "Review Documents" opens the side-by-side verification modal.',
        preCondition: 'Pending applicant row exists in table.',
        testData: 'Click "Review" button on row for "Juan Dela Cruz".',
        steps: [
          'Click the "Review" eye icon button on the applicant row.'
        ],
        expectedResult: 'Audit modal opens showing applicant details, 2x2 ID photo, and uploaded COR side-by-side.',
        actualResult: 'As expected. Side-by-side audit modal rendered.',
        status: 'Passed',
        postCondition: 'Audit modal open with zoom/pan controls.'
      },
      {
        id: 'TC-DASH-ADM-015',
        title: 'COR Audit Modal - Side-by-Side 2x2 Photo & COR Inspection with Zoom / Pan Controls',
        description: 'Verify that admin can zoom in and inspect fine print text on the COR to verify subject registration.',
        preCondition: 'Audit modal is open.',
        testData: 'Click "Zoom In (+)" button and pan image.',
        steps: [
          'Click the Zoom In (+) button above the COR preview.',
          'Drag / pan the image across the viewing window.',
          'Click "Reset Zoom" button.'
        ],
        expectedResult: 'Image scales up smoothly allowing inspection of printed registration details; pan moves canvas; reset restores initial view.',
        actualResult: 'As expected. Zoom and pan controls operated smoothly.',
        status: 'Passed',
        postCondition: 'Zoom controls responsive.'
      },
      {
        id: 'TC-DASH-ADM-016',
        title: 'COR Audit Modal - "Approve Enrollment" Button',
        description: 'Verify that clicking "Approve Enrollment" moves applicant into official students table and generates digital ID hash.',
        preCondition: 'Audit modal is open for a pending applicant.',
        testData: 'Click "Approve Enrollment" button.',
        steps: [
          'Verify student documents in audit modal.',
          'Click the green "Approve Enrollment" button.',
          'Confirm approval action.'
        ],
        expectedResult: 'Status changes to "Approved"; student record inserted into students table; digital ID payload generated; toast displays "Enrollment Approved"; modal closes.',
        actualResult: 'As expected. Record migrated to students table; status updated to approved.',
        status: 'Passed',
        postCondition: 'Student is now an official enrolled student.'
      },
      {
        id: 'TC-DASH-ADM-017',
        title: 'COR Audit Modal - "Reject Application" Button with Reason Input & Notification',
        description: 'Verify that clicking Reject prompts for a reason and updates status to "Rejected" with notification logged.',
        preCondition: 'Audit modal is open.',
        testData: 'Click "Reject Application", enter reason: "COR is blurry and unreadable; please re-upload clear copy."',
        steps: [
          'Click the red "Reject Application" button.',
          'Prompt modal appears requesting rejection reason.',
          'Type reason: "COR is blurry and unreadable; please re-upload clear copy."',
          'Click "Confirm Rejection".'
        ],
        expectedResult: 'Status updated to "Rejected" with rejection reason recorded; applicant can see reason in Application Tracker; modal closes.',
        actualResult: 'As expected. Application rejected with reason stored in database.',
        status: 'Passed',
        postCondition: 'Application marked Rejected with reason.'
      },
      {
        id: 'TC-DASH-ADM-018',
        title: 'Pending Enrollments - Batch Select All Checkbox',
        description: 'Verify that clicking the top header checkbox selects all visible pending applicants.',
        preCondition: 'Pending table has multiple rows.',
        testData: 'Click top header checkbox.',
        steps: [
          'Click the master checkbox in table header.'
        ],
        expectedResult: 'All row checkboxes are checked; batch action bar appears showing "X applicants selected".',
        actualResult: 'As expected. All visible applicants selected and batch action toolbar shown.',
        status: 'Passed',
        postCondition: 'All pending applicants selected.'
      },
      {
        id: 'TC-DASH-ADM-019',
        title: 'Pending Enrollments - "Batch Approve Selected" Button',
        description: 'Verify that admin can approve multiple selected applicants in a single transaction.',
        preCondition: '3 pending applicants are selected.',
        testData: 'Click "Batch Approve (3)" button.',
        steps: [
          'Select 3 applicants.',
          'Click "Batch Approve (3)" button in batch action bar.',
          'Confirm batch approval.'
        ],
        expectedResult: 'All 3 selected applicants are approved in batch; records transferred to students table; success toast confirms batch approval.',
        actualResult: 'As expected. Batch approval executed cleanly.',
        status: 'Passed',
        postCondition: '3 applicants approved simultaneously.'
      },
      {
        id: 'TC-DASH-ADM-020',
        title: 'Quick Action - "Launch Attendance Scanner" Button',
        description: 'Verify that clicking the quick action button opens the Attendance Scanner modal directly from dashboard.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "Launch Attendance Scanner" quick action card.',
        steps: [
          'Click "Launch Attendance Scanner" button in Quick Actions panel.'
        ],
        expectedResult: 'Attendance Scanner modal opens immediately with full camera controls and session options.',
        actualResult: 'As expected. Attendance Scanner modal opened.',
        status: 'Passed',
        postCondition: 'Attendance scanner active.'
      },
      {
        id: 'TC-DASH-ADM-021',
        title: 'Quick Action - "Batch Print Digital IDs" Button',
        description: 'Verify that clicking the quick action opens the Batch ID Print modal.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "Batch Print Digital IDs" quick action card.',
        steps: [
          'Click "Batch Print Digital IDs" button.'
        ],
        expectedResult: 'Batch ID print modal opens with section filters and multi-card print grid.',
        actualResult: 'As expected. Batch ID Print modal displayed.',
        status: 'Passed',
        postCondition: 'Batch ID print modal active.'
      },
      {
        id: 'TC-DASH-ADM-022',
        title: 'Quick Action - "Generate OSDS Form 2-A" Button',
        description: 'Verify that clicking quick action redirects directly to Reports page with Form 2-A tab active.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "Generate OSDS Form 2-A" quick action button.',
        steps: [
          'Click "Generate OSDS Form 2-A" button.'
        ],
        expectedResult: 'Browser navigates to /reports with Form 2-A tab preselected ready for export.',
        actualResult: 'As expected. Redirected to /reports?tab=form2a.',
        status: 'Passed',
        postCondition: 'Reports page active.'
      },
      {
        id: 'TC-DASH-ADM-023',
        title: 'Quick Action - "Trigger System Backup Snapshot" Button',
        description: 'Verify that clicking quick action triggers an immediate local database dump snapshot.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "Trigger Backup Snapshot" button.',
        steps: [
          'Click "Trigger Backup Snapshot" button.',
          'Observe progress toast.'
        ],
        expectedResult: 'Backend runs `scripts/backup_database.sh`; creates compressed `.sql.gz` in backups/ folder; toast displays "Backup snapshot created successfully".',
        actualResult: 'As expected. Database dumped and compressed in 0.8s.',
        status: 'Passed',
        postCondition: 'New backup file logged in backups/ directory.'
      },
      {
        id: 'TC-DASH-ADM-024',
        title: 'Audit Logs Feed - "View Full Activity History" Button',
        description: 'Verify that clicking view history opens the full system audit logs modal.',
        preCondition: 'Admin is on dashboard.',
        testData: 'Click "View Full Activity History" link.',
        steps: [
          'Scroll to recent activity widget on dashboard.',
          'Click "View Full Activity History".'
        ],
        expectedResult: 'Audit log table opens displaying timestamps, admin actions, IP addresses, and affected records.',
        actualResult: 'As expected. Audit logs modal displayed with full chronological event logs.',
        status: 'Passed',
        postCondition: 'Audit logs modal open.'
      }
    ]
  },

  // ==========================================
  // MODULE 5: INSTRUCTOR DASHBOARD & TRACK OPERATIONS (DASH-INS)
  // ==========================================
  {
    module: 'Instructor Dashboard & Academic Track Operations (DASH-INS)',
    cases: [
      {
        id: 'TC-DASH-INS-001',
        title: 'Instructor Assigned Department Badge & Track Isolation Display',
        description: 'Verify that instructor dashboard displays clear department badge (CWTS, LTS, or ROTC) and isolates data to that track.',
        preCondition: 'Instructor is logged in with department="ROTC".',
        testData: 'Page load trigger on /instructor/dashboard.',
        steps: [
          'Log in as ROTC Instructor.',
          'Examine the top banner on Instructor Dashboard.'
        ],
        expectedResult: 'Red ROTC Department badge is displayed; welcome message references ROTC Track; metrics reflect only ROTC students.',
        actualResult: 'As expected. ROTC badge and isolated metrics displayed.',
        status: 'Passed',
        postCondition: 'Dashboard scope isolated to ROTC.'
      },
      {
        id: 'TC-DASH-INS-002',
        title: 'Instructor Metric Summary (Assigned Students, Completed Sessions, Attendance Rate)',
        description: 'Verify that metric cards show accurate data for the instructor\'s assigned department only.',
        preCondition: 'Instructor is on dashboard.',
        testData: 'Inspect 3 metric cards.',
        steps: [
          'Review "My Assigned Students" card.',
          'Review "Completed Sessions" card (e.g. 8/15).',
          'Review "Average Attendance Rate" card.'
        ],
        expectedResult: 'Cards show metrics calculated strictly from students in the instructor\'s track.',
        actualResult: 'As expected. Metrics computed strictly for instructor\'s department.',
        status: 'Passed',
        postCondition: 'Department-specific metrics rendered.'
      },
      {
        id: 'TC-DASH-INS-003',
        title: '"Launch QR Attendance Scanner" Primary Action Button',
        description: 'Verify that clicking the primary action button opens the Attendance Scanner with track preset to instructor\'s department.',
        preCondition: 'Instructor is on dashboard.',
        testData: 'Click "Launch QR Attendance Scanner" button.',
        steps: [
          'Click the prominent "Launch QR Attendance Scanner" button.'
        ],
        expectedResult: 'Scanner modal opens with Department locked to instructor\'s track (cannot be altered to other tracks).',
        actualResult: 'As expected. Scanner modal launched with track isolation locked.',
        status: 'Passed',
        postCondition: 'Scanner ready for track-isolated scanning.'
      },
      {
        id: 'TC-DASH-INS-004',
        title: 'Active Class Session Quick Setup (Select Session Day 1-15 & Start Time)',
        description: 'Verify that instructor can quickly configure today\'s session day and class start time directly from dashboard.',
        preCondition: 'Instructor is on dashboard.',
        testData: 'Select "Day 5", Start Time: "08:00 AM", Grace Period: "15 mins".',
        steps: [
          'Select "Day 5 - Environmental Protection Activity" from dropdown.',
          'Set start time to 08:00 AM.',
          'Set grace period to 15 minutes.',
          'Click "Initialize Session".'
        ],
        expectedResult: 'Session parameters saved to active session context; scanner launches pre-configured for Day 5.',
        actualResult: 'As expected. Session configured and scanner initialized with selected parameters.',
        status: 'Passed',
        postCondition: 'Day 5 session initialized.'
      },
      {
        id: 'TC-DASH-INS-005',
        title: 'Assigned Department Student Roster Quick View Table',
        description: 'Verify that the student roster table on instructor dashboard shows only students belonging to the instructor\'s track.',
        preCondition: 'CWTS Instructor logged in.',
        testData: 'Inspect student table on /instructor/dashboard.',
        steps: [
          'Scroll to Students Roster table.',
          'Verify every student in table has Department="CWTS".'
        ],
        expectedResult: 'All listed students have CWTS department; zero ROTC or LTS students appear in table.',
        actualResult: 'As expected. Full track isolation verified on student roster.',
        status: 'Passed',
        postCondition: 'Track isolation verified.'
      },
      {
        id: 'TC-DASH-INS-006',
        title: 'Quick Message Coordinator Button ("Send Message to Admin")',
        description: 'Verify that clicking quick message navigates directly to /chat with Coordinator conversation active.',
        preCondition: 'Instructor is on dashboard.',
        testData: 'Click "Send Message to Coordinator" button.',
        steps: [
          'Click "Message Coordinator" button on dashboard widget.'
        ],
        expectedResult: 'Browser navigates to /chat; conversation thread with Admin/Coordinator is automatically opened.',
        actualResult: 'As expected. Navigated to /chat with coordinator conversation selected.',
        status: 'Passed',
        postCondition: 'Chat thread with Admin active.'
      },
      {
        id: 'TC-DASH-INS-007',
        title: '"Submit Department Report" Action Button',
        description: 'Verify that clicking submit report navigates to Reports page for submitting activity accomplishments.',
        preCondition: 'Instructor is on dashboard.',
        testData: 'Click "Submit Report" button.',
        steps: [
          'Click "Submit Department Report" action button.'
        ],
        expectedResult: 'Browser navigates to /reports with submission upload dialog open.',
        actualResult: 'As expected. Redirected to /reports submission section.',
        status: 'Passed',
        postCondition: 'Report submission dialog active.'
      },
      {
        id: 'TC-DASH-INS-008',
        title: 'Permission Enforcement - Grade Sheet Export Restricted for Instructors',
        description: 'Verify that instructors do not have access to download or export official master grade sheets (Admin-only restriction).',
        preCondition: 'User is authenticated as Instructor.',
        testData: 'Navigate to /reports; inspect Form 2-B grade export buttons.',
        steps: [
          'Open /reports as Instructor.',
          'Observe Form 2-B Export buttons.'
        ],
        expectedResult: 'Master grade export / download buttons are disabled or hidden with notice: "Master Grade Export is restricted to the NSTP Coordinator / Office of Student Development and Services (OSDS)."',
        actualResult: 'As expected. Export buttons restricted per institutional policy.',
        status: 'Passed',
        postCondition: 'Grade export access denied to instructor role.'
      }
    ]
  },

  // ==========================================
  // MODULE 6: STUDENT RECORDS & ROSTER MANAGEMENT (STUD)
  // ==========================================
  {
    module: 'Student Records & Roster Management (STUD)',
    cases: [
      {
        id: 'TC-STUD-001',
        title: 'Master Student Table - Global Search (Name, Student ID, Email)',
        description: 'Verify that typing into the master search bar filters the student table across name, student ID, and email fields.',
        preCondition: 'User is on /students with official student records loaded.',
        testData: 'Search Query: "2026-0045"',
        steps: [
          'Navigate to /students.',
          'Type "2026-0045" into global search bar.'
        ],
        expectedResult: 'Table updates dynamically to show the matching student record.',
        actualResult: 'As expected. Student with ID 2026-0045 displayed immediately.',
        status: 'Passed',
        postCondition: 'Search results displayed.'
      },
      {
        id: 'TC-STUD-002',
        title: 'Master Student Table - Filter by NSTP Component (CWTS / LTS / ROTC)',
        description: 'Verify that choosing an NSTP track from dropdown filters table to that component.',
        preCondition: 'Admin is on /students.',
        testData: 'Select "ROTC" in Component filter dropdown.',
        steps: [
          'Click Track filter dropdown.',
          'Select "ROTC".'
        ],
        expectedResult: 'Table displays only students enrolled in ROTC track.',
        actualResult: 'As expected. Table restricted to ROTC students.',
        status: 'Passed',
        postCondition: 'ROTC filter active.'
      },
      {
        id: 'TC-STUD-003',
        title: 'Master Student Table - Filter by Degree Program / Course',
        description: 'Verify that choosing a degree program filters the student roster accordingly.',
        preCondition: 'User is on /students.',
        testData: 'Select "BSIT" from Program filter.',
        steps: [
          'Click Program filter dropdown.',
          'Choose "Bachelor of Science in Information Technology (BSIT)".'
        ],
        expectedResult: 'Only BSIT students are displayed in table.',
        actualResult: 'As expected. Roster filtered to BSIT.',
        status: 'Passed',
        postCondition: 'Program filter active.'
      },
      {
        id: 'TC-STUD-004',
        title: 'Master Student Table - Filter by Assigned Section',
        description: 'Verify that selecting a section (e.g. CWTS-1A) isolates students in that specific section.',
        preCondition: 'User is on /students.',
        testData: 'Select section: "CWTS-1A".',
        steps: [
          'Click Section filter dropdown.',
          'Select "CWTS-1A".'
        ],
        expectedResult: 'Table displays only students assigned to section CWTS-1A.',
        actualResult: 'As expected. Section filter executed cleanly.',
        status: 'Passed',
        postCondition: 'Section filter active.'
      },
      {
        id: 'TC-STUD-005',
        title: 'Master Student Table - Filter by Academic Status (Enrolled, Dropped, Completed)',
        description: 'Verify that filtering by status isolates active, dropped, or completed students.',
        preCondition: 'User is on /students.',
        testData: 'Select status: "Dropped".',
        steps: [
          'Click Status filter dropdown.',
          'Choose "Dropped".'
        ],
        expectedResult: 'Table displays only students whose status is Dropped.',
        actualResult: 'As expected. Only dropped students shown.',
        status: 'Passed',
        postCondition: 'Status filter active.'
      },
      {
        id: 'TC-STUD-006',
        title: '"Add New Student Manually" Button Trigger',
        description: 'Verify that clicking "+ Add Student" opens the manual student registration modal.',
        preCondition: 'Admin is on /students.',
        testData: 'Click "+ Add Student" button.',
        steps: [
          'Click "+ Add Student" button at top right of page.'
        ],
        expectedResult: 'Manual Student Registration modal opens with empty input form.',
        actualResult: 'As expected. Add Student modal opened.',
        status: 'Passed',
        postCondition: 'Add student modal displayed.'
      },
      {
        id: 'TC-STUD-007',
        title: 'Manual Student Form - Input Validation & Save ("Save Student Record" Button)',
        description: 'Verify that submitting valid student details creates a new student in the database.',
        preCondition: 'Add Student modal is open.',
        testData: 'ID: "2026-99001", Name: "Maria Clara Santos", Course: "BSIT", Track: "CWTS", Section: "CWTS-1B"',
        steps: [
          'Fill in Student ID, First Name, Last Name, Course, Track, Section, Contact, and Email.',
          'Click "Save Student Record" button.'
        ],
        expectedResult: 'Student record inserted into students table; toast displays "Student added successfully"; modal closes; student appears in table.',
        actualResult: 'As expected. New student created and displayed in roster.',
        status: 'Passed',
        postCondition: 'New student stored in database.'
      },
      {
        id: 'TC-STUD-008',
        title: 'Manual Student Form - "Cancel" Button',
        description: 'Verify that clicking Cancel closes the modal without creating any student record.',
        preCondition: 'Add Student modal is open.',
        testData: 'Click "Cancel" button.',
        steps: [
          'Click "Cancel" button in modal.'
        ],
        expectedResult: 'Modal closes immediately; no database changes made.',
        actualResult: 'As expected. Modal closed without side effects.',
        status: 'Passed',
        postCondition: 'Student table unchanged.'
      },
      {
        id: 'TC-STUD-009',
        title: 'Action Menu - "View Student Full Profile" Button',
        description: 'Verify that clicking the eye icon on a student row opens the comprehensive Student Profile modal.',
        preCondition: 'Student row is visible.',
        testData: 'Click "View Profile" button on row for "Maria Clara Santos".',
        steps: [
          'Click the "View Profile" button in the Actions column.'
        ],
        expectedResult: 'Student profile modal opens displaying personal information, 2x2 photo, attendance summary, and academic status.',
        actualResult: 'As expected. Student full profile modal displayed.',
        status: 'Passed',
        postCondition: 'Profile modal active.'
      },
      {
        id: 'TC-STUD-010',
        title: 'Action Menu - "Edit Student Information" Button',
        description: 'Verify that clicking the Edit pencil icon opens the edit dialog populated with the student\'s current data.',
        preCondition: 'Student row is visible.',
        testData: 'Click "Edit" pencil icon on student row.',
        steps: [
          'Click the "Edit" button in Actions column.'
        ],
        expectedResult: 'Edit Student modal opens; all inputs are pre-populated with student\'s current database values.',
        actualResult: 'As expected. Edit modal opened with pre-filled fields.',
        status: 'Passed',
        postCondition: 'Edit modal active.'
      },
      {
        id: 'TC-STUD-011',
        title: 'Edit Student Modal - Save Updates ("Update Student Information" Button)',
        description: 'Verify that modifying student information and clicking Update saves changes to database.',
        preCondition: 'Edit modal is open.',
        testData: 'Change section from "CWTS-1B" to "CWTS-1A", update Contact Number.',
        steps: [
          'Change Section input to "CWTS-1A".',
          'Click "Update Student Information" button.'
        ],
        expectedResult: 'Database updates student record; toast displays "Student information updated"; table reflects new section.',
        actualResult: 'As expected. Record updated in database and table.',
        status: 'Passed',
        postCondition: 'Updated data saved in MySQL.'
      },
      {
        id: 'TC-STUD-012',
        title: 'Action Menu - "View / Generate Digital ID" Button',
        description: 'Verify that clicking the ID card icon opens the official Digital ID Card viewer for that student.',
        preCondition: 'Student row is visible.',
        testData: 'Click "Digital ID" icon button.',
        steps: [
          'Click the Digital ID card icon in Actions column.'
        ],
        expectedResult: 'Digital ID modal opens rendering official CvSU Naic ID layout with 2x2 photo and generated QR code.',
        actualResult: 'As expected. Digital ID modal rendered for the student.',
        status: 'Passed',
        postCondition: 'Digital ID modal open.'
      },
      {
        id: 'TC-STUD-013',
        title: 'Action Menu - "View 15-Session Attendance Matrix" Button',
        description: 'Verify that clicking the Calendar/Matrix icon opens the 15-day attendance grid for that specific student.',
        preCondition: 'Student row is visible.',
        testData: 'Click "Attendance Matrix" icon button.',
        steps: [
          'Click the Attendance Matrix icon in Actions column.'
        ],
        expectedResult: 'Attendance Matrix modal opens displaying Days 1 to 15 attendance status for the student.',
        actualResult: 'As expected. 15-day matrix modal rendered.',
        status: 'Passed',
        postCondition: 'Attendance matrix modal open.'
      },
      {
        id: 'TC-STUD-014',
        title: 'Action Menu - "Change Status" Dropdown (Active to Dropped / Incomplete)',
        description: 'Verify that updating student status via dropdown saves new status and updates color badge.',
        preCondition: 'Student status is "Enrolled".',
        testData: 'Select "Dropped" from status dropdown.',
        steps: [
          'Click the Status badge dropdown on student row.',
          'Select "Dropped".',
          'Confirm status change prompt.'
        ],
        expectedResult: 'Status updates to Dropped with red badge; student attendance eligibility deactivated.',
        actualResult: 'As expected. Status updated to Dropped in database and UI.',
        status: 'Passed',
        postCondition: 'Student status is Dropped.'
      },
      {
        id: 'TC-STUD-015',
        title: 'Action Menu - "Delete Student Record" Button',
        description: 'Verify that clicking the trash icon prompts a dangerous confirmation modal before deletion.',
        preCondition: 'Admin is on /students.',
        testData: 'Click "Delete" trash icon on student row.',
        steps: [
          'Click the trash icon button in Actions column.'
        ],
        expectedResult: 'Confirmation dialog appears: "Are you sure you want to permanently delete this student record? This action cannot be undone."',
        actualResult: 'As expected. Confirmation prompt displayed.',
        status: 'Passed',
        postCondition: 'Confirmation modal open.'
      },
      {
        id: 'TC-STUD-016',
        title: 'Delete Student Modal - Confirmation Dialog ("Confirm Delete" Button)',
        description: 'Verify that confirming deletion removes student and cascade-cleans associated attendance records.',
        preCondition: 'Delete confirmation modal is open.',
        testData: 'Click "Confirm Delete" button.',
        steps: [
          'Click "Confirm Delete" button in modal.'
        ],
        expectedResult: 'Student record is deleted from students table; associated attendance logs removed; success toast displayed; row disappears from table.',
        actualResult: 'As expected. Student deleted cleanly from database.',
        status: 'Passed',
        postCondition: 'Student record no longer exists.'
      },
      {
        id: 'TC-STUD-017',
        title: 'Delete Student Modal - "Cancel" Button',
        description: 'Verify that clicking Cancel prevents deletion and keeps student record safe.',
        preCondition: 'Delete confirmation modal is open.',
        testData: 'Click "Cancel" button in delete dialog.',
        steps: [
          'Click "Cancel" button.'
        ],
        expectedResult: 'Dialog closes; student record remains untouched in table and database.',
        actualResult: 'As expected. Deletion cancelled.',
        status: 'Passed',
        postCondition: 'Student record preserved.'
      },
      {
        id: 'TC-STUD-018',
        title: 'Batch Operations - Multi-select Row Checkboxes (Select All / Deselect All)',
        description: 'Verify that checking the header checkbox selects all visible students on the page.',
        preCondition: 'Multiple student rows displayed in table.',
        testData: 'Click master checkbox in table header.',
        steps: [
          'Click header checkbox.',
          'Verify all rows checked.',
          'Click header checkbox again.'
        ],
        expectedResult: 'First click selects all rows and opens batch actions toolbar; second click deselects all rows.',
        actualResult: 'As expected. Multi-select toggled accurately.',
        status: 'Passed',
        postCondition: 'Batch selection state responsive.'
      },
      {
        id: 'TC-STUD-019',
        title: 'Batch Operations - "Batch Assign Section" Modal & Save Button',
        description: 'Verify that admin can select multiple students and assign them to a section simultaneously.',
        preCondition: '5 students selected via checkboxes.',
        testData: 'Assign section: "CWTS-1C".',
        steps: [
          'Click "Batch Assign Section" button in toolbar.',
          'Select "CWTS-1C" from section dropdown in modal.',
          'Click "Apply Section to Selected Students".'
        ],
        expectedResult: 'All 5 selected students have their section updated to CWTS-1C; toast confirms batch update.',
        actualResult: 'As expected. Batch section assignment succeeded.',
        status: 'Passed',
        postCondition: '5 students assigned to CWTS-1C.'
      },
      {
        id: 'TC-STUD-020',
        title: 'Batch Operations - "Batch Print Digital IDs" Button Trigger',
        description: 'Verify that clicking Batch Print from the selection toolbar opens print modal with selected students pre-checked.',
        preCondition: '4 students selected in table.',
        testData: 'Click "Batch Print IDs (4)" button.',
        steps: [
          'Select 4 students.',
          'Click "Batch Print IDs" in batch toolbar.'
        ],
        expectedResult: 'Batch Print modal opens with the 4 selected student ID cards loaded in print layout.',
        actualResult: 'As expected. Batch Print modal opened with selected students.',
        status: 'Passed',
        postCondition: 'Batch ID modal ready for printing.'
      },
      {
        id: 'TC-STUD-021',
        title: '"Export Master Student Roster to Excel (.xlsx)" Button',
        description: 'Verify that clicking Export to Excel generates and downloads an `.xlsx` workbook containing student roster.',
        preCondition: 'User is on /students.',
        testData: 'Click "Export to Excel" button.',
        steps: [
          'Click "Export to Excel" button above table.'
        ],
        expectedResult: 'ExcelJS compiles formatted spreadsheet with columns (Student ID, Name, Track, Course, Section, Status); browser downloads `.xlsx` file.',
        actualResult: 'As expected. Excel workbook generated and downloaded.',
        status: 'Passed',
        postCondition: 'Excel file saved on client computer.'
      },
      {
        id: 'TC-STUD-022',
        title: '"Export Master Student Roster to CSV" Button',
        description: 'Verify that clicking Export to CSV downloads comma-separated text file of student list.',
        preCondition: 'User is on /students.',
        testData: 'Click "Export CSV" option.',
        steps: [
          'Click dropdown arrow next to Export button.',
          'Choose "Export as CSV".'
        ],
        expectedResult: 'Browser downloads standard `.csv` file formatted with proper headers.',
        actualResult: 'As expected. CSV file exported successfully.',
        status: 'Passed',
        postCondition: 'CSV file saved on client computer.'
      },
      {
        id: 'TC-STUD-023',
        title: 'Table Pagination - "Next Page", "Previous Page", and Rows Per Page Dropdown',
        description: 'Verify that pagination controls navigate between pages and change rows per page (10, 25, 50).',
        preCondition: 'Total students exceeds 10.',
        testData: 'Click "Next Page", then change rows per page to 25.',
        steps: [
          'Click "Next Page" button at bottom right.',
          'Observe table page 2 rows.',
          'Click Rows Per Page dropdown and select "25".'
        ],
        expectedResult: 'Page updates smoothly to next chunk of records; changing rows per page re-renders table with 25 records.',
        actualResult: 'As expected. Pagination and page size adjustments executed without delay.',
        status: 'Passed',
        postCondition: 'Table displayed according to pagination settings.'
      }
    ]
  },

  // ==========================================
  // MODULE 7: SMART QR ATTENDANCE SCANNER & MANUAL CONSOLE (ATTN-SCAN)
  // ==========================================
  {
    module: 'Smart QR Attendance Scanner & Manual Console (ATTN-SCAN)',
    cases: [
      {
        id: 'TC-ATTN-SCAN-001',
        title: 'Scanner Modal Open ("Launch Attendance Scanner" Button)',
        description: 'Verify that clicking the scanner button opens the Attendance Scanner modal and initializes camera subsystem.',
        preCondition: 'Instructor or Admin is logged in.',
        testData: 'Click "Launch Attendance Scanner" button.',
        steps: [
          'Click "Launch Attendance Scanner" button on dashboard or header.'
        ],
        expectedResult: 'Modal overlays screen; camera status indicators and session configuration controls render.',
        actualResult: 'As expected. Scanner modal opened cleanly.',
        status: 'Passed',
        postCondition: 'Scanner modal displayed and ready.'
      },
      {
        id: 'TC-ATTN-SCAN-002',
        title: 'Session Configuration - Select Day (Day 1 to Day 15 Dropdown)',
        description: 'Verify that user can select any session from Day 1 to Day 15 corresponding to the 15-week curriculum.',
        preCondition: 'Scanner modal is open.',
        testData: 'Select "Day 3 - Community Profiling & Needs Assessment".',
        steps: [
          'Click Session Day dropdown.',
          'Choose "Day 3".'
        ],
        expectedResult: 'Selected session day is updated in state; session activity title updates automatically.',
        actualResult: 'As expected. Session Day set to Day 3.',
        status: 'Passed',
        postCondition: 'Session Day 3 active in context.'
      },
      {
        id: 'TC-ATTN-SCAN-003',
        title: 'Session Configuration - Enter Activity / Training Topic Input',
        description: 'Verify that user can type a customized activity name or topic for the attendance record.',
        preCondition: 'Scanner modal is open.',
        testData: 'Activity Input: "Campus Tree Planting & Biodiversity Survey"',
        steps: [
          'Click Activity Name input field.',
          'Type "Campus Tree Planting & Biodiversity Survey".'
        ],
        expectedResult: 'Custom activity title is stored and will be attached to every attendance record generated during the session.',
        actualResult: 'As expected. Custom activity title saved in session state.',
        status: 'Passed',
        postCondition: 'Custom activity title attached to session.'
      },
      {
        id: 'TC-ATTN-SCAN-004',
        title: 'Session Configuration - Scan Type Selector ("Time-In" vs "Time-Out")',
        description: 'Verify that toggling between Time-In and Time-Out changes recording mode and column mapping.',
        preCondition: 'Scanner modal is open.',
        testData: 'Click "Time-Out" toggle button.',
        steps: [
          'Observe default selection is "Time-In".',
          'Click "Time-Out" button.'
        ],
        expectedResult: 'Scan mode switches to Time-Out; scanner UI highlights blue/orange indicator; scans will now record departure timestamp.',
        actualResult: 'As expected. Scan mode toggled to Time-Out.',
        status: 'Passed',
        postCondition: 'Scan mode is Time-Out.'
      },
      {
        id: 'TC-ATTN-SCAN-005',
        title: 'Session Configuration - Class Start Time & Grace Period Dropdown',
        description: 'Verify that setting class start time and grace period (10, 15, 30 mins) establishes the cutoff time for lateness.',
        preCondition: 'Scanner modal is open.',
        testData: 'Start Time: "08:00 AM", Grace Period: "15 minutes" (Cutoff = 08:15:59 AM)',
        steps: [
          'Set Class Start Time to 08:00 AM.',
          'Select "15 minutes" from Grace Period dropdown.'
        ],
        expectedResult: 'Lateness engine calculates Cutoff Time as 08:15:59 AM; any scan after this timestamp will be flagged as Late.',
        actualResult: 'As expected. Cutoff calculated accurately.',
        status: 'Passed',
        postCondition: 'Lateness cutoff established in engine.'
      },
      {
        id: 'TC-ATTN-SCAN-006',
        title: 'Scanner Mode Switcher - "Camera QR Scanner" vs "Manual Student ID Console"',
        description: 'Verify that user can toggle between camera scanning mode and manual student ID entry console.',
        preCondition: 'Scanner modal is open.',
        testData: 'Click "Manual Entry" tab, then "Camera Scanner" tab.',
        steps: [
          'Click "Manual Entry" tab button.',
          'Observe camera stops and manual ID text input appears.',
          'Click "Camera Scanner" tab button.'
        ],
        expectedResult: 'UI switches smoothly between camera viewfinder and text entry console without errors.',
        actualResult: 'As expected. Mode switcher toggled smoothly.',
        status: 'Passed',
        postCondition: 'Selected scanner mode active.'
      },
      {
        id: 'TC-ATTN-SCAN-007',
        title: 'Camera QR Scanner - "Start Camera" Button',
        description: 'Verify that clicking "Start Camera" requests video stream and mounts `html5-qrcode` scanner.',
        preCondition: 'Camera mode selected; camera permission available.',
        testData: 'Click "Start Camera" button.',
        steps: [
          'Click green "Start Camera" button.'
        ],
        expectedResult: 'Camera viewfinder activates; video feed is visible; scanning reticle animates.',
        actualResult: 'As expected. Camera stream started with scanning reticle overlay.',
        status: 'Passed',
        postCondition: 'Camera actively scanning for QR codes.'
      },
      {
        id: 'TC-ATTN-SCAN-008',
        title: 'Camera QR Scanner - Camera Device Selection Dropdown (Front vs Rear Camera)',
        description: 'Verify that user can switch between rear and front cameras on multi-camera laptops and mobile devices.',
        preCondition: 'Camera stream is running.',
        testData: 'Select "Back Camera (Environment)" from dropdown.',
        steps: [
          'Click Camera Device dropdown.',
          'Select alternate camera device.'
        ],
        expectedResult: 'Video feed seamlessly switches to the selected camera hardware without crashing.',
        actualResult: 'As expected. Video feed switched cleanly to chosen device.',
        status: 'Passed',
        postCondition: 'Selected camera active.'
      },
      {
        id: 'TC-ATTN-SCAN-009',
        title: 'Camera QR Scanner - "Stop Camera" Button',
        description: 'Verify that clicking "Stop Camera" releases video hardware and turns off device webcam light.',
        preCondition: 'Camera stream is actively running.',
        testData: 'Click "Stop Camera" button.',
        steps: [
          'Click red "Stop Camera" button.'
        ],
        expectedResult: 'Camera stream halts; hardware tracks stopped; webcam light turns off; placeholder displayed.',
        actualResult: 'As expected. Camera hardware released cleanly.',
        status: 'Passed',
        postCondition: 'Camera stream inactive.'
      },
      {
        id: 'TC-ATTN-SCAN-010',
        title: 'Camera Scan - Successful Time-In within Grace Period (On-Time Status & Audio Chime)',
        description: 'Verify that scanning a valid student ID QR code before cutoff records Time-In as "Present" with success chime.',
        preCondition: 'Scanner running; student "Juan Dela Cruz" belongs to instructor\'s track; current time is before cutoff.',
        testData: 'QR Code payload: JSON containing studentId="2026-10023", track="CWTS", hash="[VALID_HASH]"',
        steps: [
          'Present student QR code to camera.',
          'Wait for scanner detection.'
        ],
        expectedResult: 'Synthesized high-pitched success chime plays via Web Audio API; student photo and name flash on screen; status logged as "Present / On-Time"; student added to session list.',
        actualResult: 'As expected. Success beep sounded; student logged as Present at current timestamp.',
        status: 'Passed',
        postCondition: 'Attendance record saved in MySQL database with is_late=0.'
      },
      {
        id: 'TC-ATTN-SCAN-011',
        title: 'Camera Scan - Successful Time-In after Grace Period (Late Status & Audio Chime)',
        description: 'Verify that scanning a student QR code after the cutoff time records Time-In as "Late" with distinct indicator.',
        preCondition: 'Current time is 08:22 AM; cutoff time was 08:15 AM.',
        testData: 'QR Code for valid student in same track.',
        steps: [
          'Present student QR code to camera after cutoff.'
        ],
        expectedResult: 'Success chime plays; status badge displays yellow "Late" badge; record saved in database with is_late=1.',
        actualResult: 'As expected. Student marked Late in session logs and database.',
        status: 'Passed',
        postCondition: 'Attendance record saved with is_late=1.'
      },
      {
        id: 'TC-ATTN-SCAN-012',
        title: 'Camera Scan - Successful Time-Out Recording',
        description: 'Verify that scanning student in Time-Out mode records departure time in existing session record.',
        preCondition: 'Student already has a Time-In record for today\'s session; Scan Type is set to "Time-Out".',
        testData: 'QR Code of student with existing Time-In.',
        steps: [
          'Switch mode to "Time-Out".',
          'Scan student QR code.'
        ],
        expectedResult: 'System updates today\'s attendance record with time_out timestamp; displays toast "Time-Out recorded for [Student Name]".',
        actualResult: 'As expected. Time-out timestamp committed to record.',
        status: 'Passed',
        postCondition: 'time_out column populated in attendance_records.'
      },
      {
        id: 'TC-ATTN-SCAN-013',
        title: 'Camera Scan - Duplicate Scan Detection in Same Session (Warning Alert & Reject)',
        description: 'Verify that scanning the same student twice in the same session mode prevents duplicate record creation.',
        preCondition: 'Student already scanned Time-In 5 minutes ago.',
        testData: 'Scan the same student QR code again in Time-In mode.',
        steps: [
          'Present the already timed-in student QR code to camera.'
        ],
        expectedResult: 'System detects existing scan in current session; plays warning chime; displays banner: "Student [Name] is already timed-in for this session"; duplicate scan ignored.',
        actualResult: 'As expected. Duplicate scan blocked without duplicating database rows.',
        status: 'Passed',
        postCondition: 'Session log remains at 1 entry for this student.'
      },
      {
        id: 'TC-ATTN-SCAN-014',
        title: 'Camera Scan - Track Isolation Enforcement (Mismatched Track Rejection)',
        description: 'Verify that when a ROTC instructor scans a CWTS student, the system strictly blocks the scan, plays error buzzer, and does not crash.',
        preCondition: 'Logged in user is ROTC Instructor (department="ROTC"); scanned student belongs to CWTS.',
        testData: 'QR Code for CWTS Student "Maria Santos" (department="CWTS").',
        steps: [
          'ROTC Instructor scans CWTS student QR code.'
        ],
        expectedResult: 'Track Isolation Engine intervenes: plays low error buzzer; displays red warning toast: "Track Mismatch: This student belongs to CWTS and cannot be scanned by ROTC instructor"; student is NOT added to session logs; scanner continues running smoothly without crashing.',
        actualResult: 'As expected. Boundary check caught mismatch; error buzzer played; zero records inserted; scanner stayed active.',
        status: 'Passed',
        postCondition: 'Database unaffected; CWTS student record completely untouched.'
      },
      {
        id: 'TC-ATTN-SCAN-015',
        title: 'Manual ID Console - Enter Valid Student ID & Click "Record Attendance"',
        description: 'Verify that typing a student ID manually records attendance identically to QR scanning.',
        preCondition: 'Scanner modal is in Manual Entry mode.',
        testData: 'Student ID: "2026-10023"',
        steps: [
          'Type "2026-10023" into the Student ID input field.',
          'Click "Record Attendance" button (or press Enter key).'
        ],
        expectedResult: 'System finds student in database, validates track matching, plays success chime, and adds student to session attendance table.',
        actualResult: 'As expected. Attendance recorded via manual ID entry.',
        status: 'Passed',
        postCondition: 'Attendance recorded in database.'
      },
      {
        id: 'TC-ATTN-SCAN-016',
        title: 'Manual ID Console - Enter Invalid / Unregistered Student ID',
        description: 'Verify system behavior when user types a non-existent student ID in manual console.',
        preCondition: 'Manual Entry mode is active.',
        testData: 'Student ID: "9999-00000"',
        steps: [
          'Type "9999-00000" into input.',
          'Click "Record Attendance".'
        ],
        expectedResult: 'System plays error audio; displays warning: "Student ID 9999-00000 not found in database"; input field cleared and focused.',
        actualResult: 'As expected. Error alert shown; no record created.',
        status: 'Passed',
        postCondition: 'Database unaffected.'
      },
      {
        id: 'TC-ATTN-SCAN-017',
        title: 'Manual ID Console - Enter Student ID with Mismatched Track',
        description: 'Verify that manual ID entry also enforces strict track isolation between departments.',
        preCondition: 'Logged in as CWTS Instructor; Student ID belongs to ROTC student.',
        testData: 'Student ID: "2026-30012" (ROTC Student)',
        steps: [
          'CWTS Instructor types ROTC student ID "2026-30012".',
          'Click "Record Attendance".'
        ],
        expectedResult: 'System detects track mismatch; displays error toast "Track Mismatch: Student is enrolled in ROTC"; scan rejected.',
        actualResult: 'As expected. Manual entry blocked by track isolation.',
        status: 'Passed',
        postCondition: 'Attendance rejected; no record saved.'
      },
      {
        id: 'TC-ATTN-SCAN-018',
        title: 'Real-Time Session Logs Table - Remove / Undo Scanned Entry ("Delete" Icon Button)',
        description: 'Verify that an instructor can remove an accidental scan entry from the current live session log.',
        preCondition: 'Session table contains 3 scanned students.',
        testData: 'Click trash icon button on 2nd student row.',
        steps: [
          'Locate student entry in the live session table below scanner.',
          'Click the red trash icon button on that row.'
        ],
        expectedResult: 'Record is removed from current session table and deleted from database; session count decrements.',
        actualResult: 'As expected. Erroneous entry deleted cleanly.',
        status: 'Passed',
        postCondition: 'Student removed from session log.'
      },
      {
        id: 'TC-ATTN-SCAN-019',
        title: 'Session Log Action - "Export Live Session to Excel" Button',
        description: 'Verify that clicking Export Session generates an immediate Excel spreadsheet of today\'s scanned attendees.',
        preCondition: 'Active session has 10 scanned students.',
        testData: 'Click "Export Session (Excel)" button.',
        steps: [
          'Click "Export Session (Excel)" button above live session table.'
        ],
        expectedResult: 'ExcelJS compiles spreadsheet containing Student ID, Name, Track, Time-In, Time-Out, and Status; browser downloads file.',
        actualResult: 'As expected. Session attendance exported to Excel spreadsheet.',
        status: 'Passed',
        postCondition: 'Excel file downloaded to client machine.'
      },
      {
        id: 'TC-ATTN-SCAN-020',
        title: 'Finalize Session - "Save and Close Attendance Session" Button',
        description: 'Verify that clicking Save and Close finalizes session records and dismisses scanner modal.',
        preCondition: 'Session scanning completed.',
        testData: 'Click "Save and Close Session" button.',
        steps: [
          'Click "Save and Close Session" button at bottom right of modal.',
          'Confirm close action.'
        ],
        expectedResult: 'Camera stream stops; session statistics saved; dashboard attendance metrics update immediately; modal closes.',
        actualResult: 'As expected. Session finalized and closed cleanly.',
        status: 'Passed',
        postCondition: 'Session completed; modal dismissed.'
      }
    ]
  }
];

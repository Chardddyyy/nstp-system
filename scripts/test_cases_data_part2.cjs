/**
 * Test Cases Dataset - Part 2
 * Modules 8 through 15
 */

module.exports = [
  // ==========================================
  // MODULE 8: 15-SESSION ATTENDANCE MATRIX & RECORDS (ATTN-MAT)
  // ==========================================
  {
    module: '15-Session Attendance Matrix & Records (ATTN-MAT)',
    cases: [
      {
        id: 'TC-ATTN-MAT-001',
        title: 'Attendance Matrix Modal Open ("Attendance Matrix" Button)',
        description: 'Verify that clicking the Attendance Matrix button opens the 15-session grid modal for selected student or section.',
        preCondition: 'User is on Student Management page.',
        testData: 'Click "Attendance Matrix" icon button on student row.',
        steps: [
          'Locate student row.',
          'Click the Calendar / Matrix icon in Actions column.'
        ],
        expectedResult: 'Matrix modal opens displaying 15 columns (Day 1 through Day 15) with status chips and summary counters.',
        actualResult: 'As expected. Matrix modal rendered with 15 session columns.',
        status: 'Passed',
        postCondition: 'Matrix modal visible and interactive.'
      },
      {
        id: 'TC-ATTN-MAT-002',
        title: '15-Session Visual Matrix Grid Display (Day 1 to Day 15 Status Icons)',
        description: 'Verify that each session day cell shows correct color-coded badge: Present (Green), Late (Yellow), Absent (Red), Excused (Blue).',
        preCondition: 'Student has attendance records across multiple days.',
        testData: 'Inspect Day 1 (Present), Day 2 (Late), Day 3 (Absent), Day 4 (Excused).',
        steps: [
          'Observe Day 1 through Day 4 cells in the grid.'
        ],
        expectedResult: 'Each cell displays the appropriate letter badge and background color according to database attendance records.',
        actualResult: 'As expected. Badges rendered with correct color codes and symbols.',
        status: 'Passed',
        postCondition: 'Grid accurately reflects database state.'
      },
      {
        id: 'TC-ATTN-MAT-003',
        title: 'Manual Cell Override - Click Day Cell & Select Status',
        description: 'Verify that authorized faculty can manually override an attendance status (e.g. from Absent to Excused with medical excuse).',
        preCondition: 'Matrix modal is open.',
        testData: 'Click Day 3 (Absent) cell; change to "Excused".',
        steps: [
          'Click on the Day 3 cell.',
          'Dropdown menu opens showing options: Present, Late, Absent, Excused.',
          'Select "Excused".'
        ],
        expectedResult: 'Cell status updates immediately to "Excused" (Blue badge); database attendance_records table is updated; toast confirms "Status updated to Excused".',
        actualResult: 'As expected. Manual override committed to database.',
        status: 'Passed',
        postCondition: 'Day 3 status is Excused.'
      },
      {
        id: 'TC-ATTN-MAT-004',
        title: 'Automatic Metric Recalculation (Total Present, Late, Absent, Attendance %)',
        description: 'Verify that overriding a cell immediately updates summary statistics at the top of the matrix.',
        preCondition: 'Cell overridden from Absent to Excused.',
        testData: 'Observe summary counters before and after override.',
        steps: [
          'Note initial Absent count (e.g. 1).',
          'Change cell to Excused.',
          'Inspect summary header.'
        ],
        expectedResult: 'Absent count decrements from 1 to 0; Excused increments from 0 to 1; Overall Attendance Rate % recalculates in real-time.',
        actualResult: 'As expected. Summary counters recalculated reactively.',
        status: 'Passed',
        postCondition: 'Summary counters reflect new values.'
      },
      {
        id: 'TC-ATTN-MAT-005',
        title: '"Export Matrix to Excel (.xlsx)" Button',
        description: 'Verify that clicking Export Matrix compiles and downloads an official 15-day attendance roster in Excel format.',
        preCondition: 'Matrix modal is open.',
        testData: 'Click "Export Matrix (Excel)" button.',
        steps: [
          'Click "Export Matrix (Excel)" button at top right of modal.'
        ],
        expectedResult: 'ExcelJS compiles spreadsheet containing Student Name, ID, Course, and columns Day 1 to Day 15 plus totals; file downloads.',
        actualResult: 'As expected. 15-day matrix exported to `.xlsx` file.',
        status: 'Passed',
        postCondition: 'Excel matrix file downloaded.'
      },
      {
        id: 'TC-ATTN-MAT-006',
        title: '"Export Matrix to PDF" Button',
        description: 'Verify that clicking Export to PDF generates a standardized printable landscape PDF report of the 15-session matrix.',
        preCondition: 'Matrix modal is open.',
        testData: 'Click "Export Matrix (PDF)" button.',
        steps: [
          'Click "Export Matrix (PDF)" button.'
        ],
        expectedResult: 'jsPDF renders CvSU Naic official header, student information, and complete 15-day grid in landscape format; downloads PDF.',
        actualResult: 'As expected. Landscape PDF matrix generated and downloaded.',
        status: 'Passed',
        postCondition: 'PDF document downloaded.'
      },
      {
        id: 'TC-ATTN-MAT-007',
        title: '"Print Attendance Matrix Sheet" Button',
        description: 'Verify that clicking Print triggers the browser\'s print preview dialog with print-optimized CSS styles.',
        preCondition: 'Matrix modal is open.',
        testData: 'Click "Print Matrix" button.',
        steps: [
          'Click "Print Matrix" button.'
        ],
        expectedResult: 'Native browser print preview opens; table headers repeated; background graphics enabled for printing.',
        actualResult: 'As expected. Print window displayed with clean printable layout.',
        status: 'Passed',
        postCondition: 'Print dialog ready.'
      },
      {
        id: 'TC-ATTN-MAT-008',
        title: 'Close Attendance Matrix Modal ("Close" / "X" Button)',
        description: 'Verify that clicking the Close button or clicking outside modal backdrop dismisses the dialog.',
        preCondition: 'Matrix modal is open.',
        testData: 'Click "Close (X)" button.',
        steps: [
          'Click the X close button at top right of modal.'
        ],
        expectedResult: 'Modal closes smoothly; user returns to Student Management table.',
        actualResult: 'As expected. Modal dismissed without errors.',
        status: 'Passed',
        postCondition: 'Student Management table active.'
      }
    ]
  },

  // ==========================================
  // MODULE 9: DIGITAL ID GENERATION & BATCH PRINTING (DIG-ID)
  // ==========================================
  {
    module: 'Digital ID Generation & Batch Printing (DIG-ID)',
    cases: [
      {
        id: 'TC-DIG-ID-001',
        title: 'Single Digital ID Modal Open ("View Digital ID" Button)',
        description: 'Verify that clicking Digital ID button renders the official CvSU Naic standardized ID card with student photo and details.',
        preCondition: 'Enrolled student exists in database.',
        testData: 'Click "Digital ID" button for student "Juan Dela Cruz".',
        steps: [
          'Navigate to /students.',
          'Click ID card icon on student row.'
        ],
        expectedResult: 'Modal displays high-resolution ID card front layout featuring CvSU Naic logo, student 2x2 photo, name, course, track, student number, and anti-tamper QR code.',
        actualResult: 'As expected. ID card rendered with university branding and student details.',
        status: 'Passed',
        postCondition: 'Digital ID modal active.'
      },
      {
        id: 'TC-DIG-ID-002',
        title: 'Dynamic Anti-Tamper QR Code Display Verification',
        description: 'Verify that the generated QR code contains HMAC encrypted payload and student verification hash.',
        preCondition: 'Digital ID modal is open.',
        testData: 'Scan displayed QR code with a generic QR scanner app.',
        steps: [
          'Observe QR code on digital ID card.',
          'Scan QR code with smartphone scanner.'
        ],
        expectedResult: 'Decoded payload contains JSON payload with studentId, fullName, track, and security verification token.',
        actualResult: 'As expected. Encrypted payload verified with matching student hash.',
        status: 'Passed',
        postCondition: 'Anti-tampering hash validated.'
      },
      {
        id: 'TC-DIG-ID-003',
        title: '"Download Digital ID as PNG" Button',
        description: 'Verify that clicking Download PNG exports a high-definition image of the ID card via `html2canvas`.',
        preCondition: 'Digital ID modal is open.',
        testData: 'Click "Download PNG" button.',
        steps: [
          'Click "Download Image (PNG)" button.'
        ],
        expectedResult: 'html2canvas rasterizes the card DOM element at 2x pixel ratio; browser downloads file `NSTP_ID_[StudentID].png`.',
        actualResult: 'As expected. High-resolution PNG image generated and downloaded.',
        status: 'Passed',
        postCondition: 'PNG file saved on user machine.'
      },
      {
        id: 'TC-DIG-ID-004',
        title: '"Download Digital ID as PDF" Button',
        description: 'Verify that clicking Download PDF exports an official printable vector PDF of the ID card.',
        preCondition: 'Digital ID modal is open.',
        testData: 'Click "Download PDF" button.',
        steps: [
          'Click "Download PDF" button.'
        ],
        expectedResult: 'jsPDF compiles standard ID card dimensions (85.60 mm × 53.98 mm) into PDF format and downloads `NSTP_ID_[StudentID].pdf`.',
        actualResult: 'As expected. Printable PDF generated and downloaded.',
        status: 'Passed',
        postCondition: 'PDF file saved on client computer.'
      },
      {
        id: 'TC-DIG-ID-005',
        title: '"Print Single ID Card" Button',
        description: 'Verify that clicking Print Card opens browser print preview configured for standard ID dimensions.',
        preCondition: 'Digital ID modal is open.',
        testData: 'Click "Print ID Card" button.',
        steps: [
          'Click "Print Card" button.'
        ],
        expectedResult: 'Browser print dialog opens with card centered on page with exact physical print dimensions.',
        actualResult: 'As expected. Print preview displayed.',
        status: 'Passed',
        postCondition: 'Print dialog ready.'
      },
      {
        id: 'TC-DIG-ID-006',
        title: 'Batch ID Print Modal Open ("Batch Print IDs" Button)',
        description: 'Verify that clicking Batch Print IDs from dashboard or student list opens the bulk ID print generator.',
        preCondition: 'User is on Student Management page.',
        testData: 'Click "Batch Print IDs" button at top of page.',
        steps: [
          'Click "Batch Print IDs" button.'
        ],
        expectedResult: 'Batch Print modal opens with track filters, section selectors, and card print layout grid.',
        actualResult: 'As expected. Batch ID Print modal displayed.',
        status: 'Passed',
        postCondition: 'Batch Print modal active.'
      },
      {
        id: 'TC-DIG-ID-007',
        title: 'Batch ID Filter by Track (CWTS / LTS / ROTC) & Section Dropdown',
        description: 'Verify that changing track or section filters updates the cards queued for bulk printing.',
        preCondition: 'Batch ID modal is open.',
        testData: 'Filter: Track="CWTS", Section="CWTS-1A".',
        steps: [
          'Select "CWTS" in Track dropdown.',
          'Select "CWTS-1A" in Section dropdown.'
        ],
        expectedResult: 'Print preview grid updates to display only ID cards of students belonging to section CWTS-1A.',
        actualResult: 'As expected. Filtered cards displayed in grid.',
        status: 'Passed',
        postCondition: 'Section CWTS-1A queued for batch printing.'
      },
      {
        id: 'TC-DIG-ID-008',
        title: 'Batch ID Card Selection (Select All / Invert Selection Checkboxes)',
        description: 'Verify that user can select or deselect specific student cards from the batch print queue.',
        preCondition: 'Batch ID modal is open with 12 cards displayed.',
        testData: 'Click "Deselect All", then check 3 individual cards.',
        steps: [
          'Click "Deselect All" button.',
          'Manually check the checkboxes for 3 specific student cards.'
        ],
        expectedResult: 'Print counter updates to "3 cards selected for printing"; unselected cards are dimmed.',
        actualResult: 'As expected. Selection updated to 3 cards.',
        status: 'Passed',
        postCondition: '3 cards selected in queue.'
      },
      {
        id: 'TC-DIG-ID-009',
        title: 'Batch ID Print Layout Preview (A4 Sheet Grid 8-per-page)',
        description: 'Verify that batch print organizes ID cards in an 8-card grid per A4 sheet with crop cut marks.',
        preCondition: 'Batch ID modal is open.',
        testData: 'Inspect preview layout mode.',
        steps: [
          'Switch to "A4 Sheet Preview" tab in modal.'
        ],
        expectedResult: 'Cards are arranged in 2 columns × 4 rows per page with light boundary guides for physical paper cutting.',
        actualResult: 'As expected. 8-up layout rendered with cutting guides.',
        status: 'Passed',
        postCondition: 'A4 layout verified.'
      },
      {
        id: 'TC-DIG-ID-010',
        title: '"Print All Selected ID Cards" Trigger Button',
        description: 'Verify that clicking Print All triggers bulk PDF compilation or browser print dialog with all selected cards.',
        preCondition: '8 cards selected.',
        testData: 'Click "Print All Selected IDs (8)" button.',
        steps: [
          'Click "Print Selected IDs" button.'
        ],
        expectedResult: 'Multi-page print preview is generated containing all 8 selected ID cards ready for cardstock printing.',
        actualResult: 'As expected. Print preview opened with all selected cards.',
        status: 'Passed',
        postCondition: 'Bulk print job triggered.'
      },
      {
        id: 'TC-DIG-ID-011',
        title: 'Close Batch ID Modal ("Close" / "X" Button)',
        description: 'Verify that clicking Close exits the batch print modal cleanly.',
        preCondition: 'Batch ID modal is open.',
        testData: 'Click "Close" button.',
        steps: [
          'Click Close button in modal footer.'
        ],
        expectedResult: 'Batch print modal closes; returns to previous page.',
        actualResult: 'As expected. Modal dismissed.',
        status: 'Passed',
        postCondition: 'Main page restored.'
      }
    ]
  },

  // ==========================================
  // MODULE 10: REAL-TIME MESSAGING & VOICE NOTES (CHAT)
  // ==========================================
  {
    module: 'Real-Time Messaging & Voice Notes (CHAT)',
    cases: [
      {
        id: 'TC-CHAT-001',
        title: 'Channel Selection - General Announcements Channel',
        description: 'Verify that clicking "General Announcements" loads the institutional broadcast channel.',
        preCondition: 'User is on /chat.',
        testData: 'Click channel item: "# General Announcements".',
        steps: [
          'Navigate to /chat.',
          'Click "# General Announcements" in sidebar.'
        ],
        expectedResult: 'Chat window loads announcement thread; messages displayed chronologically with author badges.',
        actualResult: 'As expected. General announcement messages loaded.',
        status: 'Passed',
        postCondition: 'General announcements channel active.'
      },
      {
        id: 'TC-CHAT-002',
        title: 'Channel Selection - Department Specific Channel (CWTS, LTS, ROTC)',
        description: 'Verify that instructors can access their department channel and see track-specific discussions.',
        preCondition: 'CWTS Instructor is on /chat.',
        testData: 'Click channel: "# CWTS Faculty Room".',
        steps: [
          'Click "# CWTS Faculty Room" channel.'
        ],
        expectedResult: 'CWTS channel messages load; instructor can chat with CWTS colleagues and coordinator.',
        actualResult: 'As expected. CWTS channel opened.',
        status: 'Passed',
        postCondition: 'CWTS channel thread active.'
      },
      {
        id: 'TC-CHAT-003',
        title: 'Direct Messaging - Select Existing Conversation from Sidebar',
        description: 'Verify that clicking an existing direct message contact opens the 1-on-1 private chat thread.',
        preCondition: 'Direct message conversation exists with "Richard Belen (Coordinator)".',
        testData: 'Click contact "Richard Belen" in Direct Messages list.',
        steps: [
          'Click on user name in Direct Messages list.'
        ],
        expectedResult: 'Direct message thread loads showing past private chat history, online status badge, and user avatar.',
        actualResult: 'As expected. Private DM thread loaded.',
        status: 'Passed',
        postCondition: '1-on-1 DM thread active.'
      },
      {
        id: 'TC-CHAT-004',
        title: '"New Direct Message" Button & User Selection Modal',
        description: 'Verify that clicking + icon opens modal to initiate a new direct chat with any registered faculty.',
        preCondition: 'User is on /chat.',
        testData: 'Click "+ New Chat" button; select "ROTC Instructor".',
        steps: [
          'Click "+ New Chat" icon button above chat list.',
          'Modal opens showing faculty directory.',
          'Click "ROTC Instructor" user card.'
        ],
        expectedResult: 'Modal closes; new or existing direct conversation thread opens with ROTC Instructor.',
        actualResult: 'As expected. New conversation thread initialized.',
        status: 'Passed',
        postCondition: 'Conversation opened with selected recipient.'
      },
      {
        id: 'TC-CHAT-005',
        title: '"Create Group Chat" Button & Participant Selection Modal',
        description: 'Verify that clicking Create Group allows selecting multiple participants and naming the group.',
        preCondition: 'User is on /chat.',
        testData: 'Group Name: "Midterm Evaluation Committee", Select 3 faculty members.',
        steps: [
          'Click "Create Group" icon button.',
          'Type Group Name: "Midterm Evaluation Committee".',
          'Check checkboxes for 3 faculty members.',
          'Click "Create Group Conversation".'
        ],
        expectedResult: 'Group conversation is created in database; socket broadcasts new group to all participants; thread opens.',
        actualResult: 'As expected. Group chat created and populated in sidebar.',
        status: 'Passed',
        postCondition: 'Group conversation active.'
      },
      {
        id: 'TC-CHAT-006',
        title: 'Conversation Search Bar (Filter Chats by Participant Name)',
        description: 'Verify that typing into the chat search bar filters conversations list in real-time.',
        preCondition: 'Multiple conversations exist in sidebar.',
        testData: 'Search Query: "Richard"',
        steps: [
          'Click conversation search bar.',
          'Type "Richard".'
        ],
        expectedResult: 'Sidebar list filters immediately to show only conversations matching "Richard".',
        actualResult: 'As expected. Search filtered contacts dynamically.',
        status: 'Passed',
        postCondition: 'Filtered chat list displayed.'
      },
      {
        id: 'TC-CHAT-007',
        title: 'Text Message Input & Send Button ("Send" Button or Enter Key)',
        description: 'Verify that typing a message and clicking Send or pressing Enter sends the message immediately.',
        preCondition: 'Conversation thread is open.',
        testData: 'Message: "Good morning Coordinator, submitting the CWTS Day 4 attendance logs now."',
        steps: [
          'Type message into text input field.',
          'Click the blue "Send" arrow button (or press Enter).'
        ],
        expectedResult: 'Message appears immediately in chat window with "Just now" timestamp; input box is cleared and focused.',
        actualResult: 'As expected. Message sent and displayed in chat bubble.',
        status: 'Passed',
        postCondition: 'Message committed to database and socket.'
      },
      {
        id: 'TC-CHAT-008',
        title: 'Real-Time Instant Delivery via Socket.io (Zero Latency Push)',
        description: 'Verify that recipient receives message instantly without refreshing the browser page.',
        preCondition: 'Two browser windows open: Window 1 (Sender), Window 2 (Recipient).',
        testData: 'Send message from Window 1 to Window 2.',
        steps: [
          'Type and send message from Window 1.',
          'Observe Window 2 in real-time.'
        ],
        expectedResult: 'Message appears instantly in Window 2 chat thread via Socket.io WebSocket event within <50ms without page reload.',
        actualResult: 'As expected. Instant zero-latency delivery verified across clients.',
        status: 'Passed',
        postCondition: 'Message rendered in both client views.'
      },
      {
        id: 'TC-CHAT-009',
        title: 'Audio Hardware Chime Notification on Incoming Message (Web Audio API)',
        description: 'Verify that an incoming message triggers the synthesized audio chime through device speakers.',
        preCondition: 'Recipient is logged in; incoming message arrives from another user.',
        testData: 'Incoming message arrival.',
        steps: [
          'Send message to recipient.',
          'Listen for audio output on recipient device.'
        ],
        expectedResult: 'Web Audio API oscillator generates clear, pleasant chime (880Hz frequency sweep); no external audio file required.',
        actualResult: 'As expected. Synthesized audio chime played cleanly.',
        status: 'Passed',
        postCondition: 'User alerted via sound.'
      },
      {
        id: 'TC-CHAT-010',
        title: 'In-App Toast & Browser Notification on Incoming Message',
        description: 'Verify that when user is on another page, an in-app toast alert and browser notification pop up.',
        preCondition: 'Recipient is currently on /students page (not on /chat).',
        testData: 'Incoming chat message from Admin.',
        steps: [
          'Navigate recipient to /students.',
          'Send message from Admin.'
        ],
        expectedResult: 'In-app toast appears at top right showing sender name and message preview; clicking toast navigates to chat.',
        actualResult: 'As expected. Notification toast displayed with quick jump link.',
        status: 'Passed',
        postCondition: 'Toast alert displayed.'
      },
      {
        id: 'TC-CHAT-011',
        title: 'File & Image Attachment Button ("Attach File" Paperclip Icon)',
        description: 'Verify that user can attach an image or PDF document to a chat message.',
        preCondition: 'Chat thread is open.',
        testData: 'File: "activity_schedule_memo.pdf" (240 KB).',
        steps: [
          'Click paperclip icon button next to text input.',
          'Select "activity_schedule_memo.pdf".',
          'Thumbnail appears in input preview.',
          'Click "Send".'
        ],
        expectedResult: 'File uploads to local server; message bubble displays file preview card with filename, size, and download button.',
        actualResult: 'As expected. File attachment uploaded and displayed in chat bubble.',
        status: 'Passed',
        postCondition: 'Attachment accessible to conversation participants.'
      },
      {
        id: 'TC-CHAT-012',
        title: 'Voice Note Recording - "Record Audio" Microphone Button',
        description: 'Verify that clicking microphone button initializes `MediaRecorder` API and starts recording voice note.',
        preCondition: 'Microphone permission granted.',
        testData: 'Click microphone icon button.',
        steps: [
          'Click the microphone icon button.',
          'Observe recording bar.'
        ],
        expectedResult: 'Input replaces with voice recording interface: pulsing red recording indicator, elapsed timer (00:01, 00:02...), and waveform animation.',
        actualResult: 'As expected. Voice recording interface started with live duration timer.',
        status: 'Passed',
        postCondition: 'MediaRecorder actively recording audio chunks.'
      },
      {
        id: 'TC-CHAT-013',
        title: 'Voice Note Recording - "Pause / Resume Recording" Button',
        description: 'Verify that user can pause recording, resume speaking, and continue voice capture.',
        preCondition: 'Voice recording is active.',
        testData: 'Click "Pause", then click "Resume".',
        steps: [
          'Click the Pause icon button.',
          'Verify timer pauses.',
          'Click Resume button.'
        ],
        expectedResult: 'Timer halts during pause; resumes counting when resumed; audio buffer continues seamlessly.',
        actualResult: 'As expected. Pause and resume executed cleanly.',
        status: 'Passed',
        postCondition: 'Voice recording resumed.'
      },
      {
        id: 'TC-CHAT-014',
        title: 'Voice Note Recording - "Cancel / Discard Recording" Trash Button',
        description: 'Verify that clicking trash icon discards the recording without sending.',
        preCondition: 'Voice recording is active.',
        testData: 'Click red trash can icon.',
        steps: [
          'Click trash icon button.'
        ],
        expectedResult: 'Audio buffer is discarded; microphone tracks released; text input returns to default state.',
        actualResult: 'As expected. Audio discarded; microphone closed.',
        status: 'Passed',
        postCondition: 'No audio saved or sent.'
      },
      {
        id: 'TC-CHAT-015',
        title: 'Voice Note Recording - "Send Voice Message" Button',
        description: 'Verify that clicking Send converts audio buffer to audio/webm blob and delivers voice note to conversation.',
        preCondition: 'Recorded a 5-second voice note.',
        testData: 'Click "Send Audio" checkmark button.',
        steps: [
          'Record 5 seconds of audio.',
          'Click the blue checkmark / send audio button.'
        ],
        expectedResult: 'Audio uploaded to server; voice message bubble appears with interactive audio player widget showing 0:05 duration.',
        actualResult: 'As expected. Voice message sent and rendered with audio player widget.',
        status: 'Passed',
        postCondition: 'Voice note available in thread.'
      },
      {
        id: 'TC-CHAT-016',
        title: 'Voice Message Player - "Play / Pause" Audio Control Button',
        description: 'Verify that recipient can play and pause the received voice note smoothly.',
        preCondition: 'Voice note exists in chat thread.',
        testData: 'Click Play button on voice note card.',
        steps: [
          'Click Play button on audio card.',
          'Listen for audio playback.',
          'Click Pause button.'
        ],
        expectedResult: 'Audio plays clearly through device speakers; progress scrubber advances; clicking pause stops playback.',
        actualResult: 'As expected. Voice message playback operated smoothly.',
        status: 'Passed',
        postCondition: 'Audio playback verified.'
      },
      {
        id: 'TC-CHAT-017',
        title: 'Voice Message Player - Audio Progress Scrubber & Duration Display',
        description: 'Verify that dragging the progress scrubber seeks audio to desired timestamp.',
        preCondition: 'Voice note card is loaded.',
        testData: 'Drag scrubber to middle of audio track.',
        steps: [
          'Click or drag scrubber to 50% mark.',
          'Observe playback position.'
        ],
        expectedResult: 'Audio playback jumps immediately to the selected timestamp; time display updates.',
        actualResult: 'As expected. Audio seeking operated without latency.',
        status: 'Passed',
        postCondition: 'Playback resumes from scrubbed position.'
      },
      {
        id: 'TC-CHAT-018',
        title: 'Message Context Menu - "Add Emoji Reaction" Button',
        description: 'Verify that hovering over a message reveals emoji picker and saves reaction.',
        preCondition: 'Message exists in thread.',
        testData: 'React with thumbs-up emoji (👍).',
        steps: [
          'Hover over message bubble.',
          'Click the smiley face icon.',
          'Select 👍 from emoji popover.'
        ],
        expectedResult: 'Emoji reaction badge appears below message with counter "👍 1"; updates via Socket.io to all users.',
        actualResult: 'As expected. Reaction displayed below message.',
        status: 'Passed',
        postCondition: 'Reaction saved in database.'
      },
      {
        id: 'TC-CHAT-019',
        title: 'Message Context Menu - "Delete Message (Soft Delete)" Button & Confirmation',
        description: 'Verify that author can soft-delete their own message with confirmation.',
        preCondition: 'User created a message in thread.',
        testData: 'Click 3-dots menu on message; click "Delete Message".',
        steps: [
          'Click 3-dots context menu on user\'s own message.',
          'Click "Delete Message".',
          'Confirm delete in prompt.'
        ],
        expectedResult: 'Message text replaces with italicized placeholder: "This message was deleted"; socket broadcasts update.',
        actualResult: 'As expected. Soft-delete executed; message text cleared.',
        status: 'Passed',
        postCondition: 'Message marked is_deleted=1 in database.'
      }
    ]
  },

  // ==========================================
  // MODULE 11: ACADEMIC REPORTS & CHED COMPLIANCE (REPRT)
  // ==========================================
  {
    module: 'Academic Reports & CHED Compliance (REPRT)',
    cases: [
      {
        id: 'TC-REPRT-001',
        title: 'Tab Navigation - Select "OSDS-NSTP Form 2-A" Tab',
        description: 'Verify that clicking Form 2-A tab displays the official OSDS Enrollment Masterlist reporting interface.',
        preCondition: 'User is on /reports.',
        testData: 'Click tab: "OSDS-NSTP Form 2-A (Enrollment Master)".',
        steps: [
          'Navigate to /reports.',
          'Click "OSDS-NSTP Form 2-A" tab.'
        ],
        expectedResult: 'Form 2-A layout renders with filters for Academic Year, Semester, and Component, alongside table preview.',
        actualResult: 'As expected. Form 2-A reporting module loaded.',
        status: 'Passed',
        postCondition: 'Form 2-A view active.'
      },
      {
        id: 'TC-REPRT-002',
        title: 'Form 2-A - Select Academic Year & Semester Dropdowns',
        description: 'Verify that selecting term filters updates the preview roster for Form 2-A.',
        preCondition: 'Form 2-A tab is active.',
        testData: 'AY: "2025-2026", Semester: "1st Semester".',
        steps: [
          'Select "2025-2026" from Academic Year dropdown.',
          'Select "1st Semester" from Semester dropdown.'
        ],
        expectedResult: 'Preview roster refreshes with enrolled students for the chosen academic period.',
        actualResult: 'As expected. Form 2-A refreshed for 2025-2026 1st Sem.',
        status: 'Passed',
        postCondition: 'Filter parameters applied.'
      },
      {
        id: 'TC-REPRT-003',
        title: 'Form 2-A - Select Component Filter (CWTS / LTS / ROTC)',
        description: 'Verify that selecting a component filters the Form 2-A roster to that specific track.',
        preCondition: 'Form 2-A tab is active.',
        testData: 'Component: "ROTC".',
        steps: [
          'Click Component dropdown.',
          'Select "ROTC".'
        ],
        expectedResult: 'Preview roster isolates ROTC cadets only.',
        actualResult: 'As expected. Form 2-A preview restricted to ROTC.',
        status: 'Passed',
        postCondition: 'ROTC filter applied to Form 2-A.'
      },
      {
        id: 'TC-REPRT-004',
        title: 'Form 2-A - "Export to Excel (.xlsx)" Button',
        description: 'Verify that clicking Export to Excel compiles the official CHED/OSDS Form 2-A formatted spreadsheet.',
        preCondition: 'Form 2-A data is loaded in preview.',
        testData: 'Click "Export Form 2-A (Excel)" button.',
        steps: [
          'Click "Export Form 2-A (Excel)" button.'
        ],
        expectedResult: 'ExcelJS compiles official workbook with institutional title, student details, course, gender, and signature blocks; downloads file.',
        actualResult: 'As expected. Form 2-A Excel spreadsheet downloaded.',
        status: 'Passed',
        postCondition: 'Form 2-A Excel workbook saved on client.'
      },
      {
        id: 'TC-REPRT-005',
        title: 'Form 2-A - "Download Official PDF" Button',
        description: 'Verify that clicking Download PDF exports a formatted legal/A4 PDF document of Form 2-A.',
        preCondition: 'Form 2-A data is loaded.',
        testData: 'Click "Download PDF" button.',
        steps: [
          'Click "Download PDF" button.'
        ],
        expectedResult: 'jsPDF compiles high-resolution legal document with CvSU Naic official logo and tabular layout; downloads PDF.',
        actualResult: 'As expected. Official PDF Form 2-A generated and downloaded.',
        status: 'Passed',
        postCondition: 'PDF saved on client device.'
      },
      {
        id: 'TC-REPRT-006',
        title: 'Tab Navigation - Select "OSDS-NSTP Form 2-B" Tab',
        description: 'Verify that clicking Form 2-B tab displays the official Final Grading & Completion Sheet.',
        preCondition: 'Admin is on /reports.',
        testData: 'Click tab: "OSDS-NSTP Form 2-B (Grading Sheet)".',
        steps: [
          'Click "OSDS-NSTP Form 2-B" tab.'
        ],
        expectedResult: 'Form 2-B view renders showing student grades, completion status, and CHED serial number columns.',
        actualResult: 'As expected. Form 2-B grading module displayed.',
        status: 'Passed',
        postCondition: 'Form 2-B view active.'
      },
      {
        id: 'TC-REPRT-007',
        title: 'Form 2-B - Grade Summary Calculation Preview',
        description: 'Verify that Form 2-B accurately calculates final ratings (Passed, Failed, Incomplete) based on attendance and performance.',
        preCondition: 'Form 2-B tab is active.',
        testData: 'Inspect grade column for student with 100% attendance.',
        steps: [
          'Review grade calculation in table for enrolled students.'
        ],
        expectedResult: 'Grade calculation algorithm reflects correct academic remarks: "Passed" for >=75% attendance and requirements completed.',
        actualResult: 'As expected. Academic remarks calculated accurately.',
        status: 'Passed',
        postCondition: 'Grades verified in preview.'
      },
      {
        id: 'TC-REPRT-008',
        title: 'Form 2-B - "Export to Excel (.xlsx)" Button',
        description: 'Verify that Admin can export Form 2-B to Excel for submission to university registrar and CHED.',
        preCondition: 'User is authenticated as Admin.',
        testData: 'Click "Export Form 2-B (Excel)" button.',
        steps: [
          'Click "Export Form 2-B (Excel)" button.'
        ],
        expectedResult: 'Formatted Excel workbook generated with final grades, serial numbers, and OSDS coordinator sign-off rows; downloads file.',
        actualResult: 'As expected. Form 2-B Excel file downloaded successfully.',
        status: 'Passed',
        postCondition: 'Form 2-B Excel saved.'
      },
      {
        id: 'TC-REPRT-009',
        title: 'Form 2-B - "Print Official Form 2-B" Button',
        description: 'Verify that clicking Print triggers the browser print dialog formatted for institutional signing.',
        preCondition: 'Form 2-B is active.',
        testData: 'Click "Print Form 2-B" button.',
        steps: [
          'Click "Print Form 2-B" button.'
        ],
        expectedResult: 'Print preview opens with legal portrait/landscape layout, page numbering, and signature lines.',
        actualResult: 'As expected. Print layout displayed cleanly.',
        status: 'Passed',
        postCondition: 'Print preview ready.'
      },
      {
        id: 'TC-REPRT-010',
        title: 'Tab Navigation - Select "CHED Masterlist Compliance" Tab',
        description: 'Verify that clicking CHED Masterlist tab loads standardized CHED annual national database reporting format.',
        preCondition: 'User is on /reports.',
        testData: 'Click "CHED Masterlist" tab.',
        steps: [
          'Click "CHED Masterlist Compliance" tab.'
        ],
        expectedResult: 'CHED format table loads with columns matching CHED Memorandum Order (CMO) guidelines.',
        actualResult: 'As expected. CHED compliance module displayed.',
        status: 'Passed',
        postCondition: 'CHED compliance tab active.'
      },
      {
        id: 'TC-REPRT-011',
        title: 'CHED Masterlist - "Generate CHED Roster (Excel)" Button',
        description: 'Verify that clicking Generate CHED Roster downloads national database compliant spreadsheet.',
        preCondition: 'CHED tab is active.',
        testData: 'Click "Generate CHED Roster (Excel)" button.',
        steps: [
          'Click "Generate CHED Roster (Excel)" button.'
        ],
        expectedResult: 'ExcelJS compiles national submission roster with HEI Code, Student Number, Sex, Birthday, Track, and Completion Status; downloads file.',
        actualResult: 'As expected. CHED compliance Excel roster generated and downloaded.',
        status: 'Passed',
        postCondition: 'CHED spreadsheet saved.'
      },
      {
        id: 'TC-REPRT-012',
        title: 'Instructor Submission Portal - File Attachment Browse Button',
        description: 'Verify that instructor can attach accomplishment reports and documentation files.',
        preCondition: 'Instructor is on Reports page submission tab.',
        testData: 'Attach file: "CWTS_Community_CleanUp_Report.pdf" (1.2 MB).',
        steps: [
          'Click "Browse Report Document".',
          'Select "CWTS_Community_CleanUp_Report.pdf".'
        ],
        expectedResult: 'File is validated (PDF/DOCX), preview shows file size and name with green check icon.',
        actualResult: 'As expected. Report document attached and validated.',
        status: 'Passed',
        postCondition: 'Document ready for submission.'
      },
      {
        id: 'TC-REPRT-013',
        title: 'Instructor Submission Portal - "Submit Accomplishment Report" Button',
        description: 'Verify that submitting the report logs the submission in database with "Under Review" status.',
        preCondition: 'File attached and report title filled.',
        testData: 'Title: "Final Community Immersion Report", Click "Submit Report".',
        steps: [
          'Type Report Title: "Final Community Immersion Report".',
          'Click "Submit Accomplishment Report" button.'
        ],
        expectedResult: 'Report is submitted to coordinator; appears in Submission History table with status "Under Review"; toast confirms submission.',
        actualResult: 'As expected. Report submitted to admin successfully.',
        status: 'Passed',
        postCondition: 'Submission logged in report_submissions table.'
      },
      {
        id: 'TC-REPRT-014',
        title: 'Admin Review - "Approve / Endorse Report Submission" Button',
        description: 'Verify that Admin can review submitted instructor reports and click Approve to endorse.',
        preCondition: 'Admin is logged in; pending report submission exists.',
        testData: 'Click "Approve Submission" checkmark button.',
        steps: [
          'Open Report Submissions review panel in Admin mode.',
          'Review submitted PDF report.',
          'Click "Approve Submission" button.'
        ],
        expectedResult: 'Status changes to "Approved"; instructor notified in chat/notifications; status badge turns green.',
        actualResult: 'As expected. Report approved by admin.',
        status: 'Passed',
        postCondition: 'Report submission status is Approved.'
      },
      {
        id: 'TC-REPRT-015',
        title: 'Admin Review - "Request Revision / Return Report" Button',
        description: 'Verify that Admin can return a submission with remarks requesting revisions.',
        preCondition: 'Admin is reviewing a submitted report.',
        testData: 'Click "Request Revision", Remarks: "Please attach geo-tagged photos of the community immersion."',
        steps: [
          'Click "Request Revision" button.',
          'Enter feedback remarks in prompt modal.',
          'Click "Send Revision Request".'
        ],
        expectedResult: 'Status updates to "Needs Revision"; instructor receives alert with coordinator feedback; file remains open for re-upload.',
        actualResult: 'As expected. Revision requested with feedback logged.',
        status: 'Passed',
        postCondition: 'Report status set to Needs Revision.'
      }
    ]
  },

  // ==========================================
  // MODULE 12: LETTER FORMATS & DOCUMENT CENTER (LETR)
  // ==========================================
  {
    module: 'Letter Formats & Document Center (LETR)',
    cases: [
      {
        id: 'TC-LETR-001',
        title: 'View Official Template Directory Cards',
        description: 'Verify that the page displays the official CvSU Naic letter templates (Medical Excuse, Immersion Request, Parent Consent, Make-Up Agreement).',
        preCondition: 'User is on /letter-formats.',
        testData: 'Page load trigger on /letter-formats.',
        steps: [
          'Navigate to /letter-formats.',
          'Inspect displayed template cards.'
        ],
        expectedResult: 'Official template cards are rendered with title, department badge, file format, and action buttons.',
        actualResult: 'As expected. All 4 official template cards loaded properly.',
        status: 'Passed',
        postCondition: 'Template cards displayed.'
      },
      {
        id: 'TC-LETR-002',
        title: 'Filter Templates by Department / Track Dropdown',
        description: 'Verify that filtering by track isolates templates relevant to CWTS, LTS, or ROTC.',
        preCondition: 'User is on /letter-formats.',
        testData: 'Select "ROTC" from Department filter.',
        steps: [
          'Click Department filter dropdown.',
          'Choose "ROTC".'
        ],
        expectedResult: 'Template grid updates to show only ROTC-specific forms (e.g. ROTC Bivouac Medical Clearance, Officer Excuse).',
        actualResult: 'As expected. Template grid filtered to ROTC.',
        status: 'Passed',
        postCondition: 'ROTC templates displayed.'
      },
      {
        id: 'TC-LETR-003',
        title: '"Create New Letter Template" Button & Modal Open',
        description: 'Verify that clicking "+ Add Template" opens the letter creation modal.',
        preCondition: 'Admin or Instructor is on /letter-formats.',
        testData: 'Click "+ Add Template" button.',
        steps: [
          'Click "+ Add Letter Template" button at top right.'
        ],
        expectedResult: 'Create Template modal opens with inputs for Title, Department, Category, Description, and File Attachment.',
        actualResult: 'As expected. Create Template modal opened.',
        status: 'Passed',
        postCondition: 'Template creation modal active.'
      },
      {
        id: 'TC-LETR-004',
        title: 'Template Form - Enter Title, Department, Description',
        description: 'Verify that user can type metadata for the new document template.',
        preCondition: 'Create Template modal is open.',
        testData: 'Title: "Barangay Tree Planting Authorization Letter", Department: "CWTS", Category: "Community Immersion"',
        steps: [
          'Type Title: "Barangay Tree Planting Authorization Letter".',
          'Select Department: "CWTS".',
          'Select Category: "Community Immersion".',
          'Type Description text.'
        ],
        expectedResult: 'Form fields accept inputs and validate length and formatting.',
        actualResult: 'As expected. Inputs filled without validation warnings.',
        status: 'Passed',
        postCondition: 'Metadata stored in form state.'
      },
      {
        id: 'TC-LETR-005',
        title: 'Template Form - Strict File Attachment Validation: Attempt Save without File',
        description: 'Verify system strictly blocks saving if user does not attach a genuine document file (no fake mock files generated).',
        preCondition: 'Create Template modal is open; all text fields filled but NO file attached.',
        testData: 'Leave file attachment input empty; click "Save Template".',
        steps: [
          'Fill in Title, Department, and Description.',
          'Leave the document file attachment field completely empty.',
          'Click "Save Template" button.'
        ],
        expectedResult: 'Strict attachment validation triggers: saving is blocked; warning toast displays: "Please attach a document file (PDF, Word, or Image) before saving."; no fabricated dummy file (135.0 KB) is created.',
        actualResult: 'As expected. Saving blocked; warning toast shown; fake mock file generation prevented.',
        status: 'Passed',
        postCondition: 'Template not created; modal remains open prompting for file.'
      },
      {
        id: 'TC-LETR-006',
        title: 'Template Form - Attach Valid Document (PDF/DOCX) & Click "Save Template"',
        description: 'Verify that attaching a real document file allows saving the template successfully.',
        preCondition: 'Create Template modal is open.',
        testData: 'Attach file: "Official_CvSU_Tree_Planting_Letter.pdf" (350 KB).',
        steps: [
          'Click "Attach Document File".',
          'Select "Official_CvSU_Tree_Planting_Letter.pdf".',
          'Verify file name and size appear in green badge.',
          'Click "Save Template" button.'
        ],
        expectedResult: 'Template saves to database along with genuine uploaded file; modal closes; toast displays "Letter template created successfully"; card appears in directory.',
        actualResult: 'As expected. Template created with genuine file attached.',
        status: 'Passed',
        postCondition: 'New template present in templates directory.'
      },
      {
        id: 'TC-LETR-007',
        title: 'Template Actions - "Preview Letter Template" Button',
        description: 'Verify that clicking Preview opens a document viewer rendering the attached PDF or Word document.',
        preCondition: 'Template card exists in directory.',
        testData: 'Click "Preview" eye icon on template card.',
        steps: [
          'Click "Preview" eye icon button on template card.'
        ],
        expectedResult: 'Preview modal opens displaying embedded document viewer showing full letter layout.',
        actualResult: 'As expected. Document preview modal rendered cleanly.',
        status: 'Passed',
        postCondition: 'Preview modal open.'
      },
      {
        id: 'TC-LETR-008',
        title: 'Template Actions - "Download Template File" Button',
        description: 'Verify that clicking Download downloads the genuine attached file and never a fabricated dummy file.',
        preCondition: 'Template card exists in directory.',
        testData: 'Click "Download" button on template card.',
        steps: [
          'Click "Download" icon button on template card.'
        ],
        expectedResult: 'Browser initiates file download of the exact uploaded file with correct MIME type and size; no fake 135 KB dummy file is downloaded.',
        actualResult: 'As expected. Genuine attached file downloaded accurately.',
        status: 'Passed',
        postCondition: 'File saved on client computer.'
      },
      {
        id: 'TC-LETR-009',
        title: 'Template Actions - "Edit Template" Button',
        description: 'Verify that clicking Edit opens the update dialog allowing modification of description or file replacement.',
        preCondition: 'User owns the template or is Admin.',
        testData: 'Click "Edit" pencil icon button.',
        steps: [
          'Click "Edit" pencil icon on template card.',
          'Update description text.',
          'Click "Update Template".'
        ],
        expectedResult: 'Changes committed to database; updated description renders on template card; toast confirms update.',
        actualResult: 'As expected. Template updated smoothly.',
        status: 'Passed',
        postCondition: 'Updated template stored.'
      },
      {
        id: 'TC-LETR-010',
        title: 'Template Actions - "Delete Template" Button & Confirmation',
        description: 'Verify that clicking Delete prompts confirmation and removes template upon confirm.',
        preCondition: 'User has delete permissions for this template.',
        testData: 'Click "Delete" trash icon button; confirm delete.',
        steps: [
          'Click "Delete" trash icon button on template card.',
          'Confirmation dialog appears.',
          'Click "Confirm Delete" button.'
        ],
        expectedResult: 'Template is removed from database and file storage; card disappears from grid; toast confirms deletion.',
        actualResult: 'As expected. Template deleted cleanly.',
        status: 'Passed',
        postCondition: 'Template removed from system.'
      },
      {
        id: 'TC-LETR-011',
        title: 'Department Isolation Check: Instructor attempts to modify template from another track',
        description: 'Verify that a CWTS Instructor cannot edit or delete a ROTC template (Department Isolation).',
        preCondition: 'User logged in is CWTS Instructor.',
        testData: 'Inspect ROTC template card actions.',
        steps: [
          'Locate ROTC template card as CWTS Instructor.',
          'Observe action buttons on card.'
        ],
        expectedResult: 'Edit and Delete buttons are hidden or disabled for templates belonging to other departments; only Download/Preview is accessible.',
        actualResult: 'As expected. Edit/Delete controls restricted per track isolation policy.',
        status: 'Passed',
        postCondition: 'Cross-track modification blocked.'
      }
    ]
  },

  // ==========================================
  // MODULE 13: TRAINING CALENDAR & ACTIVITY SCHEDULE (CAL)
  // ==========================================
  {
    module: 'Training Calendar & Activity Schedule (CAL)',
    cases: [
      {
        id: 'TC-CAL-001',
        title: 'Calendar View Switcher - "Month View" Button',
        description: 'Verify that clicking "Month View" displays the standard 7×5 monthly calendar grid.',
        preCondition: 'User is on /calendar.',
        testData: 'Click "Month" view button.',
        steps: [
          'Navigate to /calendar.',
          'Click "Month" button in top right view toggle.'
        ],
        expectedResult: 'Calendar renders full monthly grid with day cells showing scheduled NSTP activities.',
        actualResult: 'As expected. Monthly calendar grid rendered.',
        status: 'Passed',
        postCondition: 'Month view active.'
      },
      {
        id: 'TC-CAL-002',
        title: 'Calendar View Switcher - "Week View" Button',
        description: 'Verify that clicking "Week View" displays the 7-day hourly breakdown view.',
        preCondition: 'User is on /calendar.',
        testData: 'Click "Week" view button.',
        steps: [
          'Click "Week" button in view switcher.'
        ],
        expectedResult: 'Calendar transitions to 7-column weekly schedule with hourly time slots (7:00 AM to 5:00 PM).',
        actualResult: 'As expected. Weekly view displayed.',
        status: 'Passed',
        postCondition: 'Week view active.'
      },
      {
        id: 'TC-CAL-003',
        title: 'Calendar View Switcher - "Day View" Button',
        description: 'Verify that clicking "Day View" displays the detailed agenda view for today\'s date.',
        preCondition: 'User is on /calendar.',
        testData: 'Click "Day" view button.',
        steps: [
          'Click "Day" button in view switcher.'
        ],
        expectedResult: 'Calendar displays single-day timeline showing scheduled activities and training milestones.',
        actualResult: 'As expected. Day view displayed.',
        status: 'Passed',
        postCondition: 'Day view active.'
      },
      {
        id: 'TC-CAL-004',
        title: 'Calendar Navigation - "Previous Month", "Next Month", "Today" Buttons',
        description: 'Verify that navigation arrows advance and rewind calendar months, and "Today" button jumps to current date.',
        preCondition: 'User is on /calendar.',
        testData: 'Click "Next Month (>)", then "Previous Month (<)", then "Today".',
        steps: [
          'Click right arrow (>) to go to next month.',
          'Observe month header changes.',
          'Click left arrow (<) to go to previous month.',
          'Click "Today" button.'
        ],
        expectedResult: 'Month changes smoothly; "Today" button immediately returns view to current calendar month with today highlighted.',
        actualResult: 'As expected. Calendar navigation responsive and accurate.',
        status: 'Passed',
        postCondition: 'Current month and today\'s date active.'
      },
      {
        id: 'TC-CAL-005',
        title: '"Add New Activity / Schedule" Button & Modal Open',
        description: 'Verify that clicking "+ Add Event" opens the activity scheduling dialog.',
        preCondition: 'User is on /calendar.',
        testData: 'Click "+ Add Event" button.',
        steps: [
          'Click "+ Add Schedule / Event" button.'
        ],
        expectedResult: 'Event creation modal opens with form fields for Title, Date, Time, NSTP Track, Location, and Description.',
        actualResult: 'As expected. Add Event modal displayed.',
        status: 'Passed',
        postCondition: 'Event modal active.'
      },
      {
        id: 'TC-CAL-006',
        title: 'Activity Form - Input Title, Date, Time, NSTP Track, Venue, Description',
        description: 'Verify that user can fill in all activity details and validate required inputs.',
        preCondition: 'Add Event modal is open.',
        testData: 'Title: "Campus Disaster Preparedness Drill", Date: "Next Saturday", Time: "07:30 AM", Track: "All", Venue: "CvSU Naic Grandstand"',
        steps: [
          'Type Event Title.',
          'Pick Event Date and Start Time.',
          'Select Track: "All Tracks".',
          'Type Venue / Location: "CvSU Naic Grandstand".',
          'Add brief activity instructions.'
        ],
        expectedResult: 'All fields accept input and pass client validation.',
        actualResult: 'As expected. Form inputs validated.',
        status: 'Passed',
        postCondition: 'Event payload prepared in form state.'
      },
      {
        id: 'TC-CAL-007',
        title: 'Activity Form - "Save Event" Button',
        description: 'Verify that clicking Save Event saves schedule to database and renders event pill on calendar.',
        preCondition: 'Event form filled validly.',
        testData: 'Click "Save Event" button.',
        steps: [
          'Click "Save Event" button in modal footer.'
        ],
        expectedResult: 'Event is saved in MySQL calendar_events table; modal closes; toast displays "Activity scheduled successfully"; event chip appears on target date.',
        actualResult: 'As expected. Event saved and rendered on calendar cell.',
        status: 'Passed',
        postCondition: 'Event visible on calendar.'
      },
      {
        id: 'TC-CAL-008',
        title: 'Activity Form - "Cancel" Button',
        description: 'Verify that clicking Cancel closes event modal without creating any schedule entry.',
        preCondition: 'Add Event modal is open.',
        testData: 'Click "Cancel" button.',
        steps: [
          'Click "Cancel" button.'
        ],
        expectedResult: 'Modal closes; calendar remains unchanged.',
        actualResult: 'As expected. Modal dismissed.',
        status: 'Passed',
        postCondition: 'Calendar unchanged.'
      },
      {
        id: 'TC-CAL-009',
        title: 'Calendar Event Click - Event Details Modal Display',
        description: 'Verify that clicking on an event chip on the calendar opens the event details card.',
        preCondition: 'Scheduled event exists on calendar.',
        testData: 'Click event chip: "Campus Disaster Preparedness Drill".',
        steps: [
          'Click the event chip on the calendar cell.'
        ],
        expectedResult: 'Event Details modal opens showing full title, date/time, venue, assigned track badge, and coordinator notes.',
        actualResult: 'As expected. Event details modal displayed.',
        status: 'Passed',
        postCondition: 'Event details modal active.'
      },
      {
        id: 'TC-CAL-010',
        title: 'Event Details Modal - "Edit Event" Button & Update',
        description: 'Verify that clicking Edit Event allows modifying venue or time and updates calendar view.',
        preCondition: 'Event details modal is open.',
        testData: 'Click "Edit", change venue to "CvSU Naic Gymnasium", click "Update".',
        steps: [
          'Click "Edit Event" button.',
          'Change Venue to "CvSU Naic Gymnasium".',
          'Click "Update Event".'
        ],
        expectedResult: 'Event record updated in database; details update in calendar; toast confirms update.',
        actualResult: 'As expected. Event updated smoothly.',
        status: 'Passed',
        postCondition: 'Updated venue saved.'
      },
      {
        id: 'TC-CAL-011',
        title: 'Event Details Modal - "Delete Event" Button & Confirmation',
        description: 'Verify that clicking Delete Event removes the event from calendar upon confirmation.',
        preCondition: 'Event details modal is open.',
        testData: 'Click "Delete Event" button; confirm delete.',
        steps: [
          'Click "Delete Event" button.',
          'Confirm delete in prompt modal.'
        ],
        expectedResult: 'Event is removed from database; event chip vanishes from calendar; toast confirms deletion.',
        actualResult: 'As expected. Event deleted cleanly.',
        status: 'Passed',
        postCondition: 'Event removed from calendar.'
      },
      {
        id: 'TC-CAL-012',
        title: 'Filter Calendar Events by NSTP Component Checkboxes',
        description: 'Verify that checking/unchecking track checkboxes (CWTS, LTS, ROTC) filters visible events on calendar.',
        preCondition: 'User is on /calendar.',
        testData: 'Uncheck "ROTC" and "LTS" checkboxes in sidebar filter.',
        steps: [
          'Uncheck "ROTC" checkbox.',
          'Uncheck "LTS" checkbox.',
          'Observe calendar events.'
        ],
        expectedResult: 'Only CWTS and All-Track events remain visible on the calendar; ROTC and LTS event pills are hidden.',
        actualResult: 'As expected. Calendar filtered to CWTS events only.',
        status: 'Passed',
        postCondition: 'Filter active on calendar view.'
      }
    ]
  },

  // ==========================================
  // MODULE 14: USER PROFILE, SECURITY & ACCOUNT SETTINGS (PROF)
  // ==========================================
  {
    module: 'User Profile, Security & Account Settings (PROF)',
    cases: [
      {
        id: 'TC-PROF-001',
        title: 'Profile Information Display (Full Name, Email, Role, Department)',
        description: 'Verify that the user profile page displays accurate user account data and assigned permissions.',
        preCondition: 'User is logged in on /profile.',
        testData: 'Page load trigger on /profile.',
        steps: [
          'Navigate to /profile.',
          'Inspect Profile Information card.'
        ],
        expectedResult: 'Full name, email address, user role badge (Admin / Instructor), and assigned department are rendered accurately.',
        actualResult: 'As expected. User profile details displayed correctly.',
        status: 'Passed',
        postCondition: 'Profile details visible.'
      },
      {
        id: 'TC-PROF-002',
        title: 'Profile Edit - Update Name and Contact Number ("Save Changes" Button)',
        description: 'Verify that user can modify full name and contact number and save to database.',
        preCondition: 'User is on /profile.',
        testData: 'Update Contact Number to "0917-123-4567", click "Save Profile Details".',
        steps: [
          'Edit Contact Number input.',
          'Click "Save Profile Details" button.'
        ],
        expectedResult: 'Database updates user record; toast displays "Profile updated successfully"; header reflects updated user name.',
        actualResult: 'As expected. Profile changes saved and reflected across system.',
        status: 'Passed',
        postCondition: 'Updated contact stored in database.'
      },
      {
        id: 'TC-PROF-003',
        title: 'Profile Edit - Avatar Photo Upload & Save',
        description: 'Verify that user can upload a custom profile avatar photo.',
        preCondition: 'User is on /profile.',
        testData: 'Upload image: "user_avatar.jpg".',
        steps: [
          'Click "Change Avatar" button on profile photo.',
          'Select image file.',
          'Click "Save Avatar".'
        ],
        expectedResult: 'Avatar image uploads, crops to circle preview, updates navbar profile avatar immediately, and persists across reloads.',
        actualResult: 'As expected. Avatar updated and saved.',
        status: 'Passed',
        postCondition: 'New avatar stored and displayed.'
      },
      {
        id: 'TC-PROF-004',
        title: 'Security - Change Password with Incorrect Current Password',
        description: 'Verify system rejects password update if current password verification fails.',
        preCondition: 'User is on Change Password card on /profile.',
        testData: 'Current Password: "WrongPassword!", New Password: "NewValidPassword!2026"',
        steps: [
          'Type wrong password in Current Password input.',
          'Type new valid password in New Password and Confirm Password inputs.',
          'Click "Update Password" button.'
        ],
        expectedResult: 'Backend compares bcrypt hash of current password, detects mismatch, returns HTTP 400; toast displays "Current password is incorrect". Password NOT updated.',
        actualResult: 'As expected. Password update rejected due to incorrect current password.',
        status: 'Passed',
        postCondition: 'Existing password remains unchanged.'
      },
      {
        id: 'TC-PROF-005',
        title: 'Security - Change Password with Mismatched Confirmation',
        description: 'Verify client validation prevents submission if New Password and Confirm Password do not match.',
        preCondition: 'User is on Change Password card.',
        testData: 'New Password: "Password123!", Confirm Password: "DifferentPassword456!"',
        steps: [
          'Input valid current password.',
          'Type "Password123!" in New Password.',
          'Type "DifferentPassword456!" in Confirm Password.',
          'Click "Update Password".'
        ],
        expectedResult: 'Client validation flags mismatch: "New password and confirmation do not match"; submission blocked.',
        actualResult: 'As expected. Submission blocked due to confirmation mismatch.',
        status: 'Passed',
        postCondition: 'Form submission prevented.'
      },
      {
        id: 'TC-PROF-006',
        title: 'Security - Change Password with Less than 8 Characters',
        description: 'Verify password complexity rule requires minimum 8 characters.',
        preCondition: 'User is on Change Password card.',
        testData: 'New Password: "pass"',
        steps: [
          'Type "pass" in New Password field.',
          'Click "Update Password".'
        ],
        expectedResult: 'Validation error: "Password must be at least 8 characters long"; submission blocked.',
        actualResult: 'As expected. Minimum length validation enforced.',
        status: 'Passed',
        postCondition: 'Short password rejected.'
      },
      {
        id: 'TC-PROF-007',
        title: 'Security - Change Password with Valid Credentials ("Update Password" Button)',
        description: 'Verify that providing correct current password and valid new password updates password hash with bcrypt 12 rounds.',
        preCondition: 'User provides correct current password and valid 8+ char new password.',
        testData: 'Current: "[VALID_PW]", New: "CvSU_Secure_2026!", Confirm: "CvSU_Secure_2026!"',
        steps: [
          'Enter correct current password.',
          'Enter new valid password in both new and confirm inputs.',
          'Click "Update Password" button.'
        ],
        expectedResult: 'Backend re-hashes new password using bcrypt with 12 salt rounds; updates users table; displays success toast "Password updated successfully"; inputs reset.',
        actualResult: 'As expected. Password hash updated in database; success confirmed.',
        status: 'Passed',
        postCondition: 'New password active for next login.'
      },
      {
        id: 'TC-PROF-008',
        title: 'System Preferences - Toggle Dark Mode / Light Mode Switch',
        description: 'Verify that toggling the Dark Mode switch toggles `.dark` class on root HTML element and saves preference.',
        preCondition: 'User is on /profile preferences section.',
        testData: 'Click Dark Mode toggle switch.',
        steps: [
          'Locate "Dark Mode" toggle switch.',
          'Click switch to activate Dark Mode.',
          'Observe theme styling.',
          'Click switch again to return to Light Mode.'
        ],
        expectedResult: 'Dark Mode applies dark charcoal/slate backgrounds and light text; toggling back restores crisp white/green theme; preference stored in localStorage.',
        actualResult: 'As expected. Theme toggled seamlessly with localStorage persistence.',
        status: 'Passed',
        postCondition: 'Theme preference saved in browser.'
      },
      {
        id: 'TC-PROF-009',
        title: 'System Preferences - Toggle Hardware Notification Sounds On/Off',
        description: 'Verify that user can enable or mute synthesized audio chimes for chat and scanning.',
        preCondition: 'User is on /profile preferences.',
        testData: 'Toggle "Sound Effects & Audio Chimes" switch to OFF.',
        steps: [
          'Click "Notification Sound" toggle switch to turn it OFF.',
          'Trigger an incoming message or scan.'
        ],
        expectedResult: 'Sound oscillator is muted; no audio chime plays; visual toast alerts still appear; preference saved.',
        actualResult: 'As expected. Audio muted according to preference.',
        status: 'Passed',
        postCondition: 'Mute setting stored in localStorage.'
      },
      {
        id: 'TC-PROF-010',
        title: '"Logout from Session" Button',
        description: 'Verify that clicking Logout from the profile page triggers logout confirmation and session termination.',
        preCondition: 'User is on /profile.',
        testData: 'Click "Logout from All Devices / Session" button.',
        steps: [
          'Click "Logout" button on profile card.',
          'Confirm logout in modal.'
        ],
        expectedResult: 'Session token destroyed; user redirected to landing page; confirmation toast displayed.',
        actualResult: 'As expected. User logged out cleanly.',
        status: 'Passed',
        postCondition: 'User logged out.'
      }
    ]
  },

  // ==========================================
  // MODULE 15: SYSTEM ADMINISTRATION, GOOGLE DRIVE & DISASTER RECOVERY (SYS-DR)
  // ==========================================
  {
    module: 'System Administration, Google Drive & Disaster Recovery (SYS-DR)',
    cases: [
      {
        id: 'TC-SYS-DR-001',
        title: 'Google Drive Sync Status Dashboard View',
        description: 'Verify that the Google Drive Sync card displays real-time webhook connection status and last sync timestamp.',
        preCondition: 'Admin is logged in on /admin/google-drive.',
        testData: 'Page load trigger on /admin/google-drive.',
        steps: [
          'Navigate to /admin/google-drive.',
          'Inspect Cloud Sync Status card.'
        ],
        expectedResult: 'Card displays green "Connected" badge, Google Apps Script webhook endpoint status, last sync timestamp, and total synced files counter.',
        actualResult: 'As expected. Webhook status and sync counters rendered accurately.',
        status: 'Passed',
        postCondition: 'Google Drive sync status visible.'
      },
      {
        id: 'TC-SYS-DR-002',
        title: '"Manual Trigger Google Drive Sync" Webhook Button',
        description: 'Verify that clicking Manual Sync pushes latest student and enrollment records to Google Drive webhook.',
        preCondition: 'Admin is on /admin/google-drive.',
        testData: 'Click "Trigger Manual Cloud Sync" button.',
        steps: [
          'Click "Trigger Manual Cloud Sync" button.',
          'Observe progress spinner.'
        ],
        expectedResult: 'System serializes active database records into encrypted JSON payload, sends POST request to Google Apps Script webhook; toast confirms "Cloud mirroring completed successfully".',
        actualResult: 'As expected. Manual webhook sync executed; Google Drive updated.',
        status: 'Passed',
        postCondition: 'Cloud mirror updated with latest database snapshot.'
      },
      {
        id: 'TC-SYS-DR-003',
        title: '"Generate Local Database Backup (.sql.gz)" Button',
        description: 'Verify that clicking Generate Backup runs the automated bash dump script and creates compressed snapshot.',
        preCondition: 'Admin is on /admin/google-drive or Admin Dashboard.',
        testData: 'Click "Create Local Database Backup" button.',
        steps: [
          'Click "Create Local Database Backup (.sql.gz)" button.'
        ],
        expectedResult: 'Server executes `scripts/backup_database.sh` via child_process; mysqldump creates gzip archive in backups/ directory; toast displays "Backup snapshot created: backup_2026_XX_XX.sql.gz".',
        actualResult: 'As expected. Compressed database dump generated in backups/ in 0.9s.',
        status: 'Passed',
        postCondition: 'New .sql.gz archive saved in backups/ folder.'
      },
      {
        id: 'TC-SYS-DR-004',
        title: 'Local Backup Snapshots History Table View',
        description: 'Verify that the backup history table lists all existing local snapshot archives with dates, sizes, and restore triggers.',
        preCondition: 'Admin is on backups page; backup files exist in backups/ folder.',
        testData: 'Inspect Local Backups table.',
        steps: [
          'Scroll to Local Snapshots Table.',
          'Verify table rows show filename, creation date, file size (e.g. 1.4 MB), and action icons.'
        ],
        expectedResult: 'Table renders list of existing .sql.gz files read directly from server file system.',
        actualResult: 'As expected. Local snapshots listed with accurate metadata.',
        status: 'Passed',
        postCondition: 'Backup list displayed.'
      },
      {
        id: 'TC-SYS-DR-005',
        title: 'Download Backup Snapshot File Button',
        description: 'Verify that clicking download icon on a backup row downloads the `.sql.gz` archive to admin\'s physical drive.',
        preCondition: 'Backup row is visible in table.',
        testData: 'Click download icon on latest backup snapshot row.',
        steps: [
          'Click the download arrow icon on backup row.'
        ],
        expectedResult: 'Server serves `.sql.gz` file via secure download stream; browser saves archive to local Downloads folder.',
        actualResult: 'As expected. Gzip database snapshot downloaded cleanly.',
        status: 'Passed',
        postCondition: 'Archive file downloaded to client machine.'
      },
      {
        id: 'TC-SYS-DR-006',
        title: 'Keyboard Shortcuts Modal Trigger ("?" or Shortcut Key)',
        description: 'Verify that pressing Shift+? or clicking keyboard icon opens keyboard shortcuts cheatsheet modal.',
        preCondition: 'User is authenticated on any dashboard page.',
        testData: 'Press Shift + ? on keyboard or click keyboard icon in footer.',
        steps: [
          'Press Shift + ? key combination on keyboard.',
          'Observe shortcuts cheatsheet modal.'
        ],
        expectedResult: 'Keyboard Shortcuts modal opens displaying hotkeys (e.g. Alt+S for scanner, Alt+C for chat, Esc to close modals).',
        actualResult: 'As expected. Keyboard shortcuts cheatsheet opened.',
        status: 'Passed',
        postCondition: 'Shortcuts modal displayed.'
      },
      {
        id: 'TC-SYS-DR-007',
        title: 'Archive Academic Year Trigger ("Archive Current Year" Button)',
        description: 'Verify that Admin can archive current semester/year records into historical storage upon term completion.',
        preCondition: 'Admin is authenticated; term is finished.',
        testData: 'Click "Archive Academic Year" button; confirm term "A.Y. 2025-2026 - 1st Semester".',
        steps: [
          'Click "Archive Academic Year" button in admin settings.',
          'Type confirmation passphrase: "ARCHIVE-CONFIRM".',
          'Click "Proceed with Archiving".'
        ],
        expectedResult: 'System creates snapshot in archived_years table; active roster resets for next incoming batch; toast confirms "Academic Year archived successfully".',
        actualResult: 'As expected. Academic year archived cleanly with full historical preservation.',
        status: 'Passed',
        postCondition: 'Archived batch saved in archived_years table.'
      },
      {
        id: 'TC-SYS-DR-008',
        title: 'Archived Year View Mode ("Switch to Archived AY View" Button)',
        description: 'Verify that Admin and Instructors can inspect historical data in read-only Archive Mode.',
        preCondition: 'Archived year exists (e.g. A.Y. 2024-2025).',
        testData: 'Select "View Archive: A.Y. 2024-2025" from sidebar.',
        steps: [
          'Click "Archived Academic Years" in sidebar.',
          'Select "A.Y. 2024-2025 - 2nd Semester".'
        ],
        expectedResult: 'System enters Archive Mode: prominent amber top banner indicates "Viewing Historical Archive (Read-Only)"; all modification controls disabled; past records viewable.',
        actualResult: 'As expected. Archive read-only mode activated with warning banner.',
        status: 'Passed',
        postCondition: 'System in read-only archive mode.'
      },
      {
        id: 'TC-SYS-DR-009',
        title: 'Return from Archive to Current Academic Year ("Return to Live System" Button)',
        description: 'Verify that clicking "Return to Current Year" restores normal read/write operations.',
        preCondition: 'System is currently in Archive Mode.',
        testData: 'Click "Return to Current Academic Year" button in amber banner.',
        steps: [
          'Click "Return to Current Academic Year" button in top banner.'
        ],
        expectedResult: 'Archive banner disappears; system returns to live active semester with full read/write capabilities.',
        actualResult: 'As expected. System restored to current live semester.',
        status: 'Passed',
        postCondition: 'Live semester active with write permissions restored.'
      }
    ]
  }
];

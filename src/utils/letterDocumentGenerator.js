// Utility to generate official, highly professional downloadable documents (HTML / Word format) for CvSU Naic NSTP Letters

export function generateOfficialLetterHTML(template, batchYear = '2024-2025') {
  const tTitle = template?.title || 'Official NSTP Endorsement Letter';
  const tDept = template?.department || 'All';
  
  let specificBody = '';
  let addressee = '';
  let subject = tTitle.toUpperCase();

  if (tDept === 'CWTS' || tTitle.toLowerCase().includes('barangay') || tTitle.toLowerCase().includes('immersion')) {
    addressee = `
      <strong>HON. BARANGAY CHAIRMAN &amp; SANGGUNIANG BARANGAY</strong><br/>
      Barangay Bucana Malaki / Partner Communities<br/>
      Municipality of Naic, Province of Cavite
    `;
    specificBody = `
      <p>Greetings of Peace, Service, and Solidarity!</p>
      <p>The <strong>Cavite State University - Naic Campus</strong>, through the <strong>National Service Training Program - Civic Welfare Training Service (NSTP-CWTS)</strong>, is dedicated to empowering students through active community participation, civic responsibility, and environmental stewardship in compliance with Republic Act No. 9163.</p>
      <p>In this regard, we respectfully request permission and formal endorsement to conduct our community immersion programs and service initiatives within your esteemed barangay for Academic Batch <strong>${batchYear}</strong>. Our student volunteers will be engaged in the following community-building activities:</p>
      <ul>
        <li><strong>Participatory Community Needs Profiling</strong> - Household surveys to assess health, sanitation, and youth welfare priorities.</li>
        <li><strong>Coastal &amp; Ecological Rehabilitation</strong> - Mangrove planting, tree growing, and coastal clean-up campaigns along the Bucana shoreline.</li>
        <li><strong>Disaster Risk Reduction &amp; Emergency Preparedness</strong> - Basic first-aid demonstrations and community evacuation route mapping in coordination with Naic MDRRMO.</li>
        <li><strong>Livelihood &amp; Solid Waste Management Workshops</strong> - Community composting and eco-crafting livelihood seminars.</li>
      </ul>
      <p>All student activities will be closely supervised by university NSTP faculty coordinators and designated group team leaders. We assure your office that strict adherence to safety, health, and ethical protocols will be maintained throughout the engagement.</p>
      <p>We look forward to a meaningful and fruitful partnership with your barangay leadership in serving the community of Naic.</p>
    `;
  } else if (tDept === 'LTS' || tTitle.toLowerCase().includes('literacy') || tTitle.toLowerCase().includes('reading')) {
    addressee = `
      <strong>THE PRINCIPAL / HEAD TEACHER</strong><br/>
      Partner Public Elementary School<br/>
      Division of Cavite, Naic District
    `;
    specificBody = `
      <p>Warm Institutional Greetings!</p>
      <p>In accordance with the mandate of the National Service Training Program Act (R.A. 9163), the <strong>Literacy Training Service (LTS)</strong> of Cavite State University - Naic is dedicated to enhancing the literacy, numeracy, and educational capabilities of young learners in our adopted public elementary schools.</p>
      <p>We respectfully seek your approval to implement our <strong>"Alagang Basa at Dunong" Literacy Outreach &amp; Reading Clinic Program</strong> for Batch <strong>${batchYear}</strong>. Under this project, our trained NSTP-LTS student facilitators will conduct the following instructional activities:</p>
      <ul>
        <li><strong>Diagnostic Pre-Literacy &amp; Reading Assessment</strong> for identified non-readers and slow-readers in Grades 1 to 3.</li>
        <li><strong>Remedial Phonetics, Storytelling &amp; Guided Reading Sessions</strong> every weekend / designated community schedule.</li>
        <li><strong>Basic Numeracy &amp; Math Skills Tutorials</strong> utilizing interactive learning kits and storybooks.</li>
        <li><strong>Donation and Handover of Illustrated Children Storybooks</strong> to bolster the school's reading corner.</li>
      </ul>
      <p>Our student facilitators have been adequately trained in pedagogical ethics and child safeguarding policies. We will work in close coordination with your designated grade level coordinators.</p>
      <p>Thank you very much for your steadfast support in cultivating young minds and fostering literacy in Naic.</p>
    `;
  } else if (tDept === 'ROTC' || tTitle.toLowerCase().includes('rotc') || tTitle.toLowerCase().includes('tactical') || tTitle.toLowerCase().includes('training')) {
    addressee = `
      <strong>THE COMMANDING OFFICER / COMMANDANT</strong><br/>
      Naval Reserve Command / AFP Training Grounds<br/>
      Cavite Naval Base / Naic Field Station
    `;
    specificBody = `
      <p>Sir / Ma'am:</p>
      <p>The <strong>Department of Military Science and Tactics (DMST) - Reserve Officers' Training Corps (ROTC)</strong> Unit of Cavite State University - Naic Campus respectfully submits this official request for authorization and tactical coordination for Batch <strong>${batchYear}</strong>.</p>
      <p>In order to fulfill the prescribed Program of Instruction (POI) and enhance the discipline, leadership, and military preparedness of our midshipmen and cadet corps, we request permission for the conduct of the following field activities:</p>
      <ul>
        <li><strong>Troop Formation, Muster, and Ceremonial Drill Exercises</strong> at designated muster grounds.</li>
        <li><strong>Basic Land Navigation, Compass Reading &amp; Orienteering</strong> practical field tactical exercises.</li>
        <li><strong>Basic Life Support, Rescue Operations &amp; Disaster Response Drills</strong> in collaboration with naval reservist instructors.</li>
        <li><strong>Annual Tactical Inspection (ATI) and Culminating Pass-in-Review Ceremony</strong>.</li>
      </ul>
      <p>Rest assured that highest standards of military discipline, safety guidelines, and physical well-being protocols shall be enforced by our military training staff.</p>
      <p>For your favorable consideration and approval.</p>
    `;
  } else if (tTitle.toLowerCase().includes('consent') || tTitle.toLowerCase().includes('waiver') || tTitle.toLowerCase().includes('parent')) {
    addressee = `
      <strong>TO: OFFICE OF STUDENT DEVELOPMENT AND SERVICES (OSDS) - NSTP</strong><br/>
      Cavite State University - Naic Campus
    `;
    specificBody = `
      <p><strong>PARENTAL / GUARDIAN CONSENT, MEDICAL DECLARATION, AND WAIVER FORM</strong></p>
      <p>I, the undersigned parent / legal guardian of the student identified below, hereby give my full consent and voluntary permission for my son/daughter/ward to participate in the mandatory off-campus community immersion, literacy outreach, or tactical training activities under the <strong>National Service Training Program (NSTP)</strong> of Cavite State University - Naic for Batch <strong>${batchYear}</strong>.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px; margin: 15px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px; width: 30%;"><strong>Student Full Name:</strong></td>
            <td style="padding: 6px; border-bottom: 1px solid #94a3b8;">___________________________________________</td>
          </tr>
          <tr>
            <td style="padding: 6px;"><strong>Student ID / Number:</strong></td>
            <td style="padding: 6px; border-bottom: 1px solid #94a3b8;">___________________________________________</td>
          </tr>
          <tr>
            <td style="padding: 6px;"><strong>Degree Program &amp; Section:</strong></td>
            <td style="padding: 6px; border-bottom: 1px solid #94a3b8;">___________________________________________</td>
          </tr>
          <tr>
            <td style="padding: 6px;"><strong>NSTP Component &amp; Section:</strong></td>
            <td style="padding: 6px; border-bottom: 1px solid #94a3b8;">[ ] CWTS &nbsp;&nbsp;&nbsp; [ ] LTS &nbsp;&nbsp;&nbsp; [ ] ROTC</td>
          </tr>
          <tr>
            <td style="padding: 6px;"><strong>Emergency Contact Person:</strong></td>
            <td style="padding: 6px; border-bottom: 1px solid #94a3b8;">___________________________________________</td>
          </tr>
          <tr>
            <td style="padding: 6px;"><strong>Emergency Contact Number:</strong></td>
            <td style="padding: 6px; border-bottom: 1px solid #94a3b8;">___________________________________________</td>
          </tr>
        </table>
      </div>

      <p><strong>HEALTH &amp; MEDICAL DECLARATION:</strong> I certify that my child is in good physical and mental health to participate in the designated university activities, and has no medical condition that would endanger his/her well-being during the conduct of the program.</p>
      <p>I acknowledge that the university administrators and NSTP faculty shall exercise due diligence and reasonable care for the safety of the students throughout the activity.</p>
      
      <div style="margin-top: 30px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <br/><br/>
              ___________________________________________<br/>
              <strong>Signature of Parent / Legal Guardian</strong><br/>
              Date: ________________________
            </td>
            <td style="width: 50%; text-align: center;">
              <br/><br/>
              ___________________________________________<br/>
              <strong>Signature of Student</strong><br/>
              Date: ________________________
            </td>
          </tr>
        </table>
      </div>
    `;
  } else {
    // CHED Serial / General Endorsement
    addressee = `
      <strong>DIRECTOR IV</strong><br/>
      Commission on Higher Education (CHED) - Regional Office 4A (CALABARZON)<br/>
      City of San Fernando / Regional Government Center
    `;
    specificBody = `
      <p>Dear Director:</p>
      <p>The <strong>Cavite State University - Naic Campus (HEI Code: 04021)</strong> respectfully submits the certified master list of student-graduates who have satisfactorily completed the six (6) units requirement of the <strong>National Service Training Program (NSTP)</strong> in accordance with Republic Act No. 9163 and its Revised Implementing Rules and Regulations for Academic Year <strong>${batchYear}</strong>.</p>
      <p>Herewith attached is the institutional <strong>CHED Form A (Enrolment &amp; Graduates Statistical Summary)</strong> and <strong>CHED Form B (Alphabetical Master List of Graduates with Complete Demographic and Academic Profiles)</strong> for your verification and issuance of the official <strong>National NSTP Serial Numbers</strong>.</p>
      <p>Summary of Endorsed Candidates for Graduation:</p>
      <ul>
        <li><strong>Civic Welfare Training Service (CWTS)</strong> - Passed and Endorsed</li>
        <li><strong>Literacy Training Service (LTS)</strong> - Passed and Endorsed</li>
        <li><strong>Reserve Officers' Training Corps (ROTC)</strong> - Passed and Endorsed into the AFP Reserve Force</li>
      </ul>
      <p>We certify under oath that all student records submitted herein have been thoroughly validated, graded, and approved by the University Registrar and Campus Administration.</p>
      <p>Thank you for your continued guidance and prompt action.</p>
    `;
  }

  return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${tTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 1in;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #111827;
      margin: 20px 40px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #065f46;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header h3 {
      font-size: 11pt;
      font-weight: normal;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header h2 {
      font-size: 14pt;
      font-weight: bold;
      color: #065f46;
      margin: 4px 0;
    }
    .header h4 {
      font-size: 11pt;
      font-weight: bold;
      margin: 2px 0;
    }
    .header p {
      font-size: 9.5pt;
      color: #4b5563;
      margin: 2px 0;
    }
    .ref-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 11pt;
    }
    .addressee {
      margin-bottom: 20px;
      font-size: 11.5pt;
      line-height: 1.3;
    }
    .subject-line {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 20px;
      font-size: 11.5pt;
    }
    .content {
      text-align: justify;
      line-height: 1.5;
      font-size: 11.5pt;
    }
    .content p {
      margin-bottom: 12px;
      text-indent: 2em;
    }
    .content ul {
      margin-top: 6px;
      margin-bottom: 14px;
      padding-left: 30px;
    }
    .content li {
      margin-bottom: 6px;
    }
    .signatures {
      margin-top: 40px;
      width: 100%;
    }
    .signatures td {
      vertical-align: top;
      padding-top: 30px;
      font-size: 11pt;
    }
    .sign-title {
      font-weight: bold;
      text-decoration: underline;
    }
    .sign-pos {
      font-size: 10pt;
      color: #374151;
    }
    .footer-note {
      margin-top: 30px;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      font-size: 8.5pt;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h3>Republic of the Philippines</h3>
    <h2>CAVITE STATE UNIVERSITY</h2>
    <h4>CCAT Campus / Naic Campus</h4>
    <p>Bucana Malaki, Naic, Cavite | (046) 856-0942 | info.naic@cvsu.edu.ph</p>
    <p style="font-weight: bold; color: #065f46; margin-top: 4px;">OFFICE OF STUDENT DEVELOPMENT AND SERVICES - NATIONAL SERVICE TRAINING PROGRAM (NSTP)</p>
  </div>

  <div class="ref-line">
    <div><strong>Control No:</strong> CvSU-NSTP-${batchYear.replace(/[^0-9]/g, '')}-${template?.id || '001'}</div>
    <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </div>

  <div class="addressee">
    ${addressee}
  </div>

  <div class="subject-line">
    SUBJECT: ${subject}
  </div>

  <div class="content">
    ${specificBody}
  </div>

  <table class="signatures">
    <tr>
      <td style="width: 50%;">
        Prepared &amp; Endorsed by:<br/><br/><br/>
        <span class="sign-title">NSTP COORDINATOR</span><br/>
        <span class="sign-pos">${tDept} Department Head / Facilitator</span><br/>
        <span class="sign-pos">Cavite State University - Naic</span>
      </td>
      <td style="width: 50%;">
        Approved by:<br/><br/><br/>
        <span class="sign-title">DR. ARACELI B. VILLAS, Ph.D.</span><br/>
        <span class="sign-pos">Campus Administrator / NSTP Director</span><br/>
        <span class="sign-pos">Cavite State University - Naic</span>
      </td>
    </tr>
  </table>

  <div class="footer-note">
    Document officially generated by CvSU Naic NSTP Online Portal &bull; Batch Year: ${batchYear} &bull; Cavite State University Naic Campus
  </div>
</body>
</html>
  `;
}

export function downloadOfficialLetter(template, batchYear = '2024-2025') {
  const htmlContent = generateOfficialLetterHTML(template, batchYear);
  const cleanTitle = (template?.title || 'CvSU_NSTP_Official_Letter').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}_Batch_${batchYear.replace(/\s+/g, '_')}.doc`;
  
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

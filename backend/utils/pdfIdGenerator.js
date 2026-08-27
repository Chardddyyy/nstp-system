const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Resolves an image source (data URI, remote URL, local path, or raw base64) into a valid Buffer.
 */
async function resolveImageBuffer(imgSource) {
  if (!imgSource || typeof imgSource !== 'string') return null;
  const clean = imgSource.trim();
  if (!clean) return null;

  try {
    // 1. Data URI format: data:image/jpeg;base64,.....
    if (clean.startsWith('data:image/') || clean.includes(';base64,')) {
      const base64Data = clean.split(';base64,').pop();
      return Buffer.from(base64Data, 'base64');
    }

    // 2. HTTP/HTTPS URL (e.g. Cloudinary, QuickChart, etc.)
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const resp = await fetch(clean);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    }

    // 3. Local File System Path
    if (fs.existsSync(clean)) {
      return fs.readFileSync(clean);
    }

    // 4. Raw base64 string fallback
    if (clean.length > 100 && !clean.includes(' ')) {
      return Buffer.from(clean, 'base64');
    }
  } catch (err) {
    console.warn('[PDF ID] Notice resolving image buffer:', err.message);
  }
  return null;
}

/**
 * Generates an official standard-size printable PDF buffer for a student's NSTP ID Card.
 * Exact physical badge size (~54mm x ~86mm standard ID card proportions), centered on A4.
 */
async function generateStudentIdPdf(studentData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 20,
        info: {
          Title: `NSTP ID Card - ${studentData.name || studentData.fullName || 'Student'}`,
          Author: 'Cavite State University Naic - NSTP Department'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const studentName = (studentData.fullName || studentData.name || 'STUDENT NAME').toUpperCase();
      const studentId = String(studentData.studentId || studentData.student_id || studentData.studentNumber || '202610001');
      const department = (studentData.department || 'CWTS').toUpperCase();
      
      // NSTP Section formatting
      let nstpSection = studentData.nstp_section || studentData.nstpSection || '';
      if (!nstpSection || (!nstpSection.toUpperCase().includes('CWTS') && !nstpSection.toUpperCase().includes('ROTC') && !nstpSection.toUpperCase().includes('LTS'))) {
        const rawSec = studentData.section || '';
        const numMatch = String(rawSec).match(/\d+/);
        const secNum = numMatch ? numMatch[0] : '1';
        nstpSection = `${department} ${secNum}`;
      }
      const section = nstpSection.replace('-', ' ').trim();

      const serialNo = studentData.nstp_serial_id || `NSTP-${department}-2026-00001`;
      const qrToken = studentData.qr_token || `NSTP-${studentId}-${serialNo}`;
      const schoolYear = studentData.schoolYear || '2026-2027';
      const emergencyContact = studentData.emergencyContact || 'Emergency Contact';
      const emergencyNumber = studentData.emergencyNumber || '09000000000';
      const rawPhoto = studentData.id_photo_2x2 || studentData.photo || studentData.registrationPhoto || studentData.registration_photo || studentData.profilePicture || null;

      const trackLabels = {
        CWTS: 'CIVIC WELFARE TRAINING SERVICE',
        ROTC: "RESERVE OFFICERS' TRAINING CORPS",
        LTS: 'LITERACY TRAINING SERVICE'
      };
      const deptFull = trackLabels[department] || 'CIVIC WELFARE TRAINING SERVICE';

      // ── Page Header Text ──
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#064e3b')
        .text('CAVITE STATE UNIVERSITY - NAIC CAMPUS', { align: 'center' });
      doc.font('Helvetica').fontSize(8.5).fillColor('#475569')
        .text(`National Service Training Program • Academic Year ${schoolYear}`, { align: 'center' });
      doc.moveDown(0.6);

      // ── Standard CR80 / PVC Proportions: 165 pt width x 265 pt height (~58mm x ~93mm) ──
      const cardWidth = 165;
      const cardHeight = 265;
      const cardX = (595.28 - cardWidth) / 2; // Center horizontally on A4
      const cardY = 85;

      // Draw Outer Cutting & Laminating Guide Box (Light dashed guide)
      doc.save();
      doc.roundedRect(cardX - 4, cardY - 4, cardWidth + 8, cardHeight + 8, 12)
        .lineWidth(0.8)
        .dash(3, { space: 3 })
        .strokeColor('#94a3b8')
        .stroke();
      doc.restore();

      // Card Background & Main Outer Border
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 10)
        .lineWidth(1.8)
        .strokeColor('#064e3b')
        .fillColor('#ffffff')
        .fillAndStroke();

      // ── Top Header Bar ──
      const headerHeight = 32;
      doc.save();
      doc.roundedRect(cardX, cardY, cardWidth, headerHeight, 10).clip();
      doc.rect(cardX, cardY, cardWidth, headerHeight).fillColor('#064e3b').fill();
      doc.restore();

      // Gold bottom line
      doc.rect(cardX, cardY + headerHeight, cardWidth, 1.8).fillColor('#fbbf24').fill();

      // Lanyard Slot
      doc.roundedRect(cardX + (cardWidth - 28) / 2, cardY + 3, 28, 3, 1.5)
        .fillColor('#022c22').fill();

      // Logo in Header (if exists)
      const logoPath = path.join(__dirname, '..', '..', 'public', 'cvsu.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, cardX + 5, cardY + 8, { width: 19, height: 19 });
      }

      // Header Text
      doc.font('Helvetica-Bold').fontSize(5.8).fillColor('#ffffff')
        .text('CAVITE STATE UNIVERSITY', cardX + 27, cardY + 10, { width: 100, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(5).fillColor('#fde047')
        .text('NAIC CAMPUS • NSTP', cardX + 27, cardY + 17, { width: 100, lineBreak: false });

      // Track Badge
      doc.roundedRect(cardX + cardWidth - 34, cardY + 10, 29, 13, 2.5)
        .fillColor('#022c22').fill();
      doc.font('Helvetica-Bold').fontSize(6).fillColor('#fde047')
        .text(department, cardX + cardWidth - 34, cardY + 13.5, { width: 29, align: 'center' });

      // ── 2x2 Student Photo Box ──
      const photoBoxY = cardY + 39;
      const photoSize = 48;
      const photoX = cardX + (cardWidth - photoSize) / 2;
      
      doc.roundedRect(photoX, photoBoxY, photoSize, photoSize, 6)
        .lineWidth(1.2).strokeColor('#064e3b').fillColor('#f8fafc').fillAndStroke();

      // Resolve and render 2x2 photo if available
      const photoBuffer = await resolveImageBuffer(rawPhoto);
      if (photoBuffer) {
        try {
          doc.save();
          doc.roundedRect(photoX + 0.5, photoBoxY + 0.5, photoSize - 1, photoSize - 1, 5).clip();
          doc.image(photoBuffer, photoX, photoBoxY, {
            fit: [photoSize, photoSize],
            align: 'center',
            valign: 'center'
          });
          doc.restore();
        } catch (imgErr) {
          console.warn('[PDF ID] Photo drawing fallback:', imgErr.message);
          doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#064e3b')
            .text('2x2 PHOTO', photoX, photoBoxY + 20, { width: photoSize, align: 'center' });
        }
      } else {
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#064e3b')
          .text('2x2 PHOTO', photoX, photoBoxY + 20, { width: photoSize, align: 'center' });
      }

      // ── Student Name & Role ──
      const nameY = photoBoxY + photoSize + 4;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a')
        .text(studentName, cardX + 4, nameY, { width: cardWidth - 8, align: 'center', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(5).fillColor('#047857')
        .text('STUDENT', cardX + 4, nameY + 9.5, { width: cardWidth - 8, align: 'center' });

      // ── Student ID & Section Strip ──
      const infoBoxY = nameY + 18;
      doc.roundedRect(cardX + 8, infoBoxY, cardWidth - 16, 17, 3.5)
        .fillColor('#f1f5f9').fill();

      doc.font('Helvetica-Bold').fontSize(4.5).fillColor('#64748b')
        .text('STUDENT NO.', cardX + 11, infoBoxY + 2);
      doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#0f172a')
        .text(studentId, cardX + 11, infoBoxY + 7.5);

      doc.font('Helvetica-Bold').fontSize(4.5).fillColor('#64748b')
        .text('SECTION', cardX + cardWidth / 2 + 4, infoBoxY + 2);
      doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#047857')
        .text(section, cardX + cardWidth / 2 + 4, infoBoxY + 7.5);

      // ── Matriculation Number Bar ──
      const matY = infoBoxY + 20;
      doc.roundedRect(cardX + 8, matY, cardWidth - 16, 11, 2.5)
        .fillColor('#ecfdf5').fill();
      doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#064e3b')
        .text(`MATRICULATION: ${serialNo}`, cardX + 8, matY + 2.5, { width: cardWidth - 16, align: 'center', lineBreak: false });

      // ── QR Code ──
      const qrY = matY + 13;
      const qrDataUrl = await QRCode.toDataURL(qrToken, { margin: 1, width: 100, color: { dark: '#064e3b' } });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, cardX + (cardWidth - 45) / 2, qrY, { width: 45, height: 45 });

      // ── Emergency Contact ──
      const emY = qrY + 47;
      doc.font('Helvetica').fontSize(4.8).fillColor('#334155')
        .text(`Emergency Contact: ${emergencyContact} (${emergencyNumber})`, cardX + 6, emY, { width: cardWidth - 12, align: 'center', lineBreak: false });

      // ── Coordinator Signature ──
      const sigY = emY + 8;
      const sigPath = path.join(__dirname, '..', '..', 'public', 'signature.png');
      if (fs.existsSync(sigPath)) {
        doc.image(sigPath, cardX + (cardWidth - 55) / 2, sigY - 3, { width: 55, height: 16 });
      }
      doc.moveTo(cardX + (cardWidth - 80) / 2, sigY + 12).lineTo(cardX + (cardWidth + 80) / 2, sigY + 12)
        .lineWidth(0.6).strokeColor('#475569').stroke();

      doc.font('Helvetica-Bold').fontSize(5).fillColor('#0f172a')
        .text('FN MI. LN', cardX + 6, sigY + 13.5, { width: cardWidth - 12, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(4.2).fillColor('#047857')
        .text('NSTP CAMPUS COORDINATOR', cardX + 6, sigY + 18.5, { width: cardWidth - 12, align: 'center' });

      // ── Footer Ribbon ──
      const footerY = cardY + cardHeight - 15;
      doc.save();
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 10).clip();
      doc.rect(cardX, footerY, cardWidth, 15).fillColor('#022c22').fill();
      doc.restore();

      doc.rect(cardX, footerY, cardWidth, 1.2).fillColor('#fbbf24').fill();
      doc.font('Helvetica-Bold').fontSize(5).fillColor('#fde047')
        .text(deptFull, cardX + 6, footerY + 4.5, { width: 100, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(5).fillColor('#fef08a')
        .text(`AY ${schoolYear}`, cardX + cardWidth - 52, footerY + 4.5, { width: 46, align: 'right' });

      // ── Instructions below Card ──
      const instrY = cardY + cardHeight + 20;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#064e3b')
        .text('OFFICIAL PRINTING & USAGE INSTRUCTIONS:', 40, instrY, { align: 'center' });
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(7.5).fillColor('#334155')
        .text('1. Print this page in full color on Photo Paper, PVC Card, or Cardstock (Standard 100% Scale).', 40, instrY + 13, { align: 'center' })
        .text('2. Cut along the outer dashed guide box and laminate with an ID clip / lanyard for protection.', 40, instrY + 23, { align: 'center' })
        .text('3. Present the embedded QR code to your NSTP Instructor during training sessions for attendance.', 40, instrY + 33, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateStudentIdPdf };

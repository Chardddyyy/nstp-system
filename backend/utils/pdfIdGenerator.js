const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Generates an official printable PDF buffer for a student's NSTP ID Card.
 * Formatted cleanly on standard A4 / ID Card layout for printing and laminating.
 */
async function generateStudentIdPdf(studentData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
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
      const studentId = String(studentData.studentId || studentData.student_id || '202610001');
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

      const trackLabels = {
        CWTS: 'CIVIC WELFARE TRAINING SERVICE',
        ROTC: "RESERVE OFFICERS' TRAINING CORPS",
        LTS: 'LITERACY TRAINING SERVICE'
      };
      const deptFull = trackLabels[department] || 'CIVIC WELFARE TRAINING SERVICE';

      // ── Page Header ──
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#064e3b')
        .text('CAVITE STATE UNIVERSITY - NAIC CAMPUS', { align: 'center' });
      doc.font('Helvetica').fontSize(10).fillColor('#475569')
        .text(`National Service Training Program • Academic Year ${schoolYear}`, { align: 'center' });
      doc.moveDown(0.8);

      // ── Card Dimensions & Coordinates (Centered on A4) ──
      const cardWidth = 240;
      const cardHeight = 380;
      const cardX = (595.28 - cardWidth) / 2;
      const cardY = 90;

      // Draw Card Background & Outer Border
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 14)
        .lineWidth(2)
        .strokeColor('#064e3b')
        .fillColor('#ffffff')
        .fillAndStroke();

      // Top Header Bar
      const headerHeight = 44;
      doc.save();
      doc.roundedRect(cardX, cardY, cardWidth, headerHeight, 14).clip();
      doc.rect(cardX, cardY, cardWidth, headerHeight).fillColor('#064e3b').fill();
      doc.restore();

      // Gold bottom line on header
      doc.rect(cardX, cardY + headerHeight, cardWidth, 2.5).fillColor('#fbbf24').fill();

      // Lanyard Slot
      doc.roundedRect(cardX + (cardWidth - 40) / 2, cardY + 4, 40, 4, 2)
        .fillColor('#022c22').fill();

      // Logo in Header (if exists)
      const logoPath = path.join(__dirname, '..', '..', 'public', 'cvsu.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, cardX + 8, cardY + 12, { width: 26, height: 26 });
      }

      // Header Text
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
        .text('CAVITE STATE UNIVERSITY', cardX + 38, cardY + 14, { width: 140, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#fde047')
        .text('NAIC CAMPUS • NSTP', cardX + 38, cardY + 24, { width: 140, lineBreak: false });

      // Track Badge
      doc.roundedRect(cardX + cardWidth - 46, cardY + 15, 38, 16, 3)
        .fillColor('#022c22').fill();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#fde047')
        .text(department, cardX + cardWidth - 46, cardY + 19, { width: 38, align: 'center' });

      // ── 2x2 Photo Box ──
      const photoBoxY = cardY + 54;
      const photoSize = 72;
      const photoX = cardX + (cardWidth - photoSize) / 2;
      doc.roundedRect(photoX, photoBoxY, photoSize, photoSize, 8)
        .lineWidth(1.5).strokeColor('#064e3b').fillColor('#f8fafc').fillAndStroke();
      
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#064e3b')
        .text('2x2 PHOTO', photoX, photoBoxY + 30, { width: photoSize, align: 'center' });

      // ── Student Name & Role ──
      const nameY = photoBoxY + photoSize + 6;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a')
        .text(studentName, cardX + 6, nameY, { width: cardWidth - 12, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#047857')
        .text('STUDENT', cardX + 6, nameY + 13, { width: cardWidth - 12, align: 'center' });

      // ── Student ID & Section Strip ──
      const infoBoxY = nameY + 24;
      doc.roundedRect(cardX + 12, infoBoxY, cardWidth - 24, 24, 5)
        .fillColor('#f1f5f9').fill();

      doc.font('Helvetica-Bold').fontSize(6).fillColor('#64748b')
        .text('STUDENT NO.', cardX + 16, infoBoxY + 3);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a')
        .text(studentId, cardX + 16, infoBoxY + 11);

      doc.font('Helvetica-Bold').fontSize(6).fillColor('#64748b')
        .text('SECTION', cardX + cardWidth / 2 + 6, infoBoxY + 3);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#047857')
        .text(section, cardX + cardWidth / 2 + 6, infoBoxY + 11);

      // ── Matriculation Number Bar ──
      const matY = infoBoxY + 28;
      doc.roundedRect(cardX + 12, matY, cardWidth - 24, 15, 4)
        .fillColor('#ecfdf5').fill();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#064e3b')
        .text(`MATRICULATION: ${serialNo}`, cardX + 12, matY + 3.5, { width: cardWidth - 24, align: 'center' });

      // ── QR Code ──
      const qrY = matY + 18;
      const qrDataUrl = await QRCode.toDataURL(qrToken, { margin: 1, width: 140, color: { dark: '#064e3b' } });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, cardX + (cardWidth - 62) / 2, qrY, { width: 62, height: 62 });

      // ── Emergency Contact ──
      const emY = qrY + 65;
      doc.font('Helvetica').fontSize(6.5).fillColor('#334155')
        .text(`Emergency Contact: ${emergencyContact} (${emergencyNumber})`, cardX + 10, emY, { width: cardWidth - 20, align: 'center' });

      // ── Coordinator Signature ──
      const sigY = emY + 12;
      const sigPath = path.join(__dirname, '..', '..', 'public', 'signature.png');
      if (fs.existsSync(sigPath)) {
        doc.image(sigPath, cardX + (cardWidth - 75) / 2, sigY - 4, { width: 75, height: 22 });
      }
      doc.moveTo(cardX + (cardWidth - 110) / 2, sigY + 16).lineTo(cardX + (cardWidth + 110) / 2, sigY + 16)
        .lineWidth(0.8).strokeColor('#475569').stroke();

      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#0f172a')
        .text('FN MI. LN', cardX + 10, sigY + 18, { width: cardWidth - 20, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#047857')
        .text('NSTP CAMPUS COORDINATOR', cardX + 10, sigY + 25, { width: cardWidth - 20, align: 'center' });

      // ── Footer Ribbon ──
      const footerY = cardY + cardHeight - 20;
      doc.save();
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 14).clip();
      doc.rect(cardX, footerY, cardWidth, 20).fillColor('#022c22').fill();
      doc.restore();

      doc.rect(cardX, footerY, cardWidth, 1.5).fillColor('#fbbf24').fill();
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#fde047')
        .text(deptFull, cardX + 8, footerY + 6, { width: 140, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#fef08a')
        .text(`AY ${schoolYear}`, cardX + cardWidth - 70, footerY + 6, { width: 62, align: 'right' });

      // ── Instructions below Card ──
      const instrY = cardY + cardHeight + 25;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#064e3b')
        .text('OFFICIAL PRINTING & USAGE INSTRUCTIONS:', 50, instrY, { align: 'center' });
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
        .text('1. Print this official ID card in full color (Photo Paper or PVC Card size) and laminate for protection.', 50, instrY + 16, { align: 'center' })
        .text('2. Present the embedded QR code to your NSTP Instructor during training sessions for attendance.', 50, instrY + 28, { align: 'center' })
        .text('3. Always carry this official Digital ID card during all scheduled NSTP campus and community activities.', 50, instrY + 40, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateStudentIdPdf };

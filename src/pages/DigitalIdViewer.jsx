import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Shield, FileText, Loader2, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DEMO_COORDINATOR_SIGNATURE_SVG, COORDINATOR_NAME, COORDINATOR_TITLE, COORDINATOR_INSTITUTION } from '../utils/signatureAssets';

function DigitalIdViewer() {
  const [searchParams] = useSearchParams();
  const cardRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Extract student details from URL parameters
  const studentId = searchParams.get('id') || searchParams.get('studentId') || '202610001';
  const fullName = (searchParams.get('name') || searchParams.get('fullName') || 'STUDENT NAME').toUpperCase();
  const department = (searchParams.get('dept') || searchParams.get('department') || 'CWTS').toUpperCase();
  
  // Format NSTP Section strictly (e.g. CWTS 1, ROTC 1, LTS 1), never academic degree section like "BSIT 3A"
  const rawSection = searchParams.get('sec') || searchParams.get('section') || '';
  const section = (() => {
    if (rawSection && (rawSection.toUpperCase().includes('CWTS') || rawSection.toUpperCase().includes('ROTC') || rawSection.toUpperCase().includes('LTS'))) {
      return rawSection.toUpperCase().replace('-', ' ').trim();
    }
    const numMatch = String(rawSection).match(/\d+/);
    const secNum = numMatch ? numMatch[0] : '1';
    return `${department} ${secNum}`;
  })();

  const serialNo = searchParams.get('serial') || searchParams.get('serialNo') || `NSTP-${department}-2026-00001`;
  const schoolYear = searchParams.get('sy') || searchParams.get('schoolYear') || '2026-2027';
  const emergencyContact = searchParams.get('contact') || searchParams.get('emergencyContact') || 'Emergency Contact';
  const emergencyNumber = searchParams.get('phone') || searchParams.get('emergencyNumber') || '09000000000';
  const photoUrl = searchParams.get('photo') || null;
  const qrToken = searchParams.get('qr') || `NSTP-${studentId}-${serialNo}`;

  const trackLabels = {
    CWTS: 'CIVIC WELFARE TRAINING SERVICE',
    ROTC: "RESERVE OFFICERS' TRAINING CORPS",
    LTS: 'LITERACY TRAINING SERVICE'
  };
  const deptFull = trackLabels[department] || 'CIVIC WELFARE TRAINING SERVICE';

  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrToken)}&size=240&dark=064e3b&ecLevel=H`;

  // Direct PDF Generation & Download
  const handleDownloadPdf = useCallback(async () => {
    if (!cardRef.current || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Fast, crisp 300dpi-equivalent render
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create standard portrait PDF formatted for ID Card (A4 layout with centered standard card)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Center the standard-sized ID card on an A4 page (~58mm x ~93mm standard ID size)
      const cardWidthMm = 58;
      const cardHeightMm = (canvas.height * cardWidthMm) / canvas.width;
      const xPos = (210 - cardWidthMm) / 2;
      const yPos = 35;

      // Add Header text on PDF
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(6, 78, 59); // #064e3b
      pdf.text('CAVITE STATE UNIVERSITY - NAIC CAMPUS', 105, 18, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Official NSTP Printable Digital ID Card • AY ${schoolYear}`, 105, 24, { align: 'center' });

      pdf.addImage(imgData, 'PNG', xPos, yPos, cardWidthMm, cardHeightMm);

      // Add Guidelines below card on PDF
      const guideY = yPos + cardHeightMm + 15;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(6, 78, 59);
      pdf.text('OFFICIAL PRINTING & USAGE INSTRUCTIONS:', 105, guideY, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      pdf.text('1. Print this page in full color on Photo Paper, PVC Card, or Cardstock (100% Scale).', 105, guideY + 6, { align: 'center' });
      pdf.text('2. Cut along the outer border and laminate with an official lanyard clip.', 105, guideY + 11, { align: 'center' });
      pdf.text('3. Present the embedded QR code to your NSTP Instructor during training activities.', 105, guideY + 16, { align: 'center' });

      const fileName = `NSTP_ID_Card_${studentId}_${fullName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [isGeneratingPdf, fullName, studentId, schoolYear]);

  const handlePrint = () => {
    window.print();
  };

  // Automatic PDF download and/or print dialog when accessed from email button
  useEffect(() => {
    const shouldDownload = searchParams.get('download') === 'pdf' || searchParams.get('download') === '1' || searchParams.get('download') === 'true' || searchParams.get('auto') === '1';
    const shouldAutoPrint = searchParams.get('print') === '1' || searchParams.get('autoprint') === '1';

    let dTimer, pTimer;
    if (shouldDownload) {
      dTimer = setTimeout(() => {
        handleDownloadPdf();
      }, 500);
    }
    
    if (shouldAutoPrint) {
      pTimer = setTimeout(() => {
        window.print();
      }, 1000);
    }

    return () => {
      if (dTimer) clearTimeout(dTimer);
      if (pTimer) clearTimeout(pTimer);
    };
  }, [searchParams, handleDownloadPdf]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 px-3 sm:px-6 font-sans">
      
      {/* Top Action Bar (Hidden during Print) */}
      <div className="w-full max-w-md mb-5 bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center gap-3 print:hidden">
        
        <div className="w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>NSTP Portal</span>
          </Link>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Official Student ID
          </span>
        </div>

        {/* Primary Download & Print Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print ID Card</span>
          </button>
        </div>

        {pdfSuccess && (
          <div className="w-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold py-1 px-3 rounded-lg flex items-center justify-center gap-1 animate-fade-in">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>PDF downloaded to your device!</span>
          </div>
        )}

      </div>

      {/* THE OFFICIAL PORTRAIT PRINTABLE ID CARD */}
      <div ref={cardRef} className="id-card-print-target w-[320px] bg-white rounded-3xl border-[2.5px] border-emerald-950 overflow-hidden shadow-2xl text-center relative print:shadow-none print:m-0 print:border-2">
        
        {/* Top Header Bar with Lanyard Slot & CvSU Seal */}
        <div className="bg-emerald-950 p-2.5 border-b-2 border-amber-400 relative">
          {/* Lanyard Slot Cutout */}
          <div className="w-11 h-1.5 bg-emerald-900 rounded-full border border-white/30 mx-auto mb-1.5"></div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-md shrink-0">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-left flex-1 min-w-0">
              <div className="text-[8.5px] font-black text-white uppercase tracking-tight leading-tight">CAVITE STATE UNIVERSITY</div>
              <div className="text-[7.5px] font-extrabold text-amber-300 tracking-wider leading-tight">NAIC CAMPUS • NSTP</div>
            </div>

            <div className="shrink-0">
              <span className="bg-emerald-900/90 text-amber-300 border border-amber-300/80 text-[8px] font-black px-2 py-0.5 rounded uppercase">
                {department}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 bg-white">
          
          {/* 2x2 Photo Box */}
          <div className="w-[84px] h-[88px] mx-auto mb-2 bg-slate-50 rounded-xl border-2 border-emerald-950 shadow-[0_0_0_1.5px_#fbbf24] overflow-hidden flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Student Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center font-mono text-[8px] font-black text-emerald-950">
                <div className="text-xl mb-0.5">👤</div>
                2x2 PHOTO
              </div>
            )}
          </div>

          {/* Student Name */}
          <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
            {fullName}
          </div>
          <div className="text-[7.5px] font-black text-emerald-700 uppercase tracking-widest mb-2">
            STUDENT
          </div>

          {/* Student Number & Section Box */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded-lg border border-slate-200 mb-2 text-left">
            <div>
              <span className="block text-[6.5px] font-bold text-slate-500 uppercase">STUDENT NO.</span>
              <span className="block text-[10.5px] font-black text-slate-900 font-mono leading-none mt-0.5">{studentId}</span>
            </div>
            <div className="border-l border-dashed border-slate-300 pl-2">
              <span className="block text-[6.5px] font-bold text-slate-500 uppercase">SECTION</span>
              <span className="block text-[10.5px] font-black text-emerald-800 font-mono leading-none mt-0.5">{section}</span>
            </div>
          </div>

          {/* Matriculation Number Strip */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-md py-1 px-2 mb-2">
            <span className="block text-[6.5px] font-black text-emerald-800 uppercase tracking-wider">MATRICULATION NO.</span>
            <span className="block text-[9.5px] font-black text-emerald-950 font-mono">{serialNo}</span>
          </div>

          {/* Attendance QR Code */}
          <div className="w-[106px] p-1 bg-white border-[1.5px] border-emerald-950 rounded-xl mx-auto shadow-xs mb-1">
            <img src={qrCodeUrl} alt="QR Code" className="w-[98px] h-[98px] mx-auto block" />
          </div>
          <div className="text-[7px] font-bold text-slate-400 font-mono mb-2">
            {serialNo}
          </div>

          {/* Emergency Contact */}
          <div className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-[8px] text-slate-700 mb-2 text-center">
            <span className="font-bold text-slate-900">Emergency Contact:</span> {emergencyContact} ({emergencyNumber})
          </div>

          {/* Coordinator Signature */}
          <div className="mt-1 text-center">
            <div className="h-8 flex items-center justify-center -mb-2 pointer-events-none">
              <img src={`${import.meta.env.BASE_URL}signature.png`} alt="Coordinator Signature" className="h-full object-contain" onError={(e) => { e.currentTarget.src = DEMO_COORDINATOR_SIGNATURE_SVG; }} />
            </div>
            <div className="w-36 border-t border-slate-600 mx-auto mb-0.5"></div>
            <div className="text-[8px] font-black text-slate-900 uppercase tracking-wider">{COORDINATOR_NAME}</div>
            <div className="text-[6.5px] font-extrabold text-emerald-800 uppercase leading-tight">{COORDINATOR_TITLE}</div>
            <div className="text-[6px] text-slate-500 leading-tight">{COORDINATOR_INSTITUTION}</div>
          </div>

        </div>

        {/* Footer Ribbon */}
        <div className="bg-emerald-950 text-amber-300 py-1 px-3 text-[7.5px] font-black uppercase tracking-wider border-t-2 border-amber-400 flex items-center justify-between">
          <span className="truncate">{deptFull}</span>
          <span className="font-mono shrink-0 ml-1">AY {schoolYear}</span>
        </div>

      </div>

      {/* Guidelines Box below (Hidden during print) */}
      <div className="w-full max-w-md mt-5 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-xs text-slate-600 leading-relaxed print:hidden">
        <div className="font-black text-emerald-900 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <Shield className="w-4 h-4 text-emerald-700" />
          <span>Official Digital ID &amp; Attendance Guide</span>
        </div>
        <ul className="space-y-1 text-[11.5px] text-slate-600 pl-4 list-disc">
          <li><strong>Print &amp; Laminate:</strong> Print this card in full color (PVC or Glossy Card size) and laminate for protection.</li>
          <li><strong>Attendance Recording:</strong> Present the embedded QR code to your instructor during training activities.</li>
          <li><strong>Direct PDF:</strong> Click <strong>Print ID / Save PDF</strong> at the top to save an official PDF copy directly.</li>
        </ul>
      </div>

    </div>
  );
}

export default DigitalIdViewer;

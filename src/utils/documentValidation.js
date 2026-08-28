/**
 * Document & RegForm (COR) Validation & Verification Utilities
 * Detects if an uploaded attachment is a valid paper Certificate of Registration (COR)
 * or a suspicious non-document file (e.g. 2x2 selfie uploaded twice, random photo, or non-paper image).
 */

export function analyzeDocumentFile(fileOrDataUrl) {
  return new Promise((resolve) => {
    if (!fileOrDataUrl) {
      return resolve({ isDocument: false, isSuspicious: true, reason: 'Missing document attachment' });
    }

    // If PDF, it is a valid document file format
    if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('data:application/pdf') || fileOrDataUrl.toLowerCase().includes('.pdf'))) {
      return resolve({ isDocument: true, isSuspicious: false, reason: 'Valid PDF document format' });
    }

    if (typeof window === 'undefined') {
      return resolve({ isDocument: true, isSuspicious: false });
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const aspectRatio = width / (height || 1);

        // Standard paper documents (Letter/A4 portrait) have aspect ratio ~0.65 to 0.85
        // Standard paper documents in landscape have aspect ratio ~1.25 to 1.55
        // Square selfies / 2x2 photos have aspect ratio ~0.95 to 1.05 (1:1)
        const isSquareSelfieRatio = aspectRatio >= 0.92 && aspectRatio <= 1.08 && width < 1200;

        // Perform canvas pixel sample analysis for document paper texture (high white/light background ratio)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.min(width, 100);
        canvas.height = Math.min(height, 100);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let lightPixelCount = 0;
        let totalSampled = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalSampled++;
          // High brightness pixel typical for white/light paper background (> 190)
          if (r > 185 && g > 185 && b > 185) {
            lightPixelCount++;
          }
        }

        const lightRatio = lightPixelCount / (totalSampled || 1);

        // If very low light ratio (< 25%) and square/selfie ratio, it is very likely a photo/selfie, not a paper document
        if (isSquareSelfieRatio && lightRatio < 0.35) {
          return resolve({
            isDocument: false,
            isSuspicious: true,
            reason: 'Square portrait/selfie ratio detected instead of full paper document'
          });
        }

        if (lightRatio < 0.20) {
          return resolve({
            isDocument: false,
            isSuspicious: true,
            reason: 'Dark/scenic image detected without paper document background'
          });
        }

        resolve({ isDocument: true, isSuspicious: false, reason: 'Valid document characteristics' });
      } catch (_) {
        resolve({ isDocument: true, isSuspicious: false });
      }
    };

    img.onerror = () => {
      resolve({ isDocument: true, isSuspicious: false });
    };

    img.src = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl);
  });
}

/**
 * Returns audit status for an enrollment record to show immediate badge to Admin.
 */
export function getRegformAuditStatus(enrollment) {
  if (!enrollment) return { isSuspicious: false };

  const regPhoto = enrollment.registration_photo || enrollment.registrationPhoto || enrollment.cor || enrollment.reg_form || '';
  const idPhoto = enrollment.id_photo_2x2 || enrollment.photo || enrollment.idPhoto2x2 || '';

  // 1. If explicit flag set during enrollment
  if (enrollment.is_flagged_regform || enrollment.isFlaggedRegform) {
    return {
      isSuspicious: true,
      badgeLabel: '⚠️ Check RegForm',
      reason: enrollment.regform_flag_reason || 'Document flagged during submission: Possible non-document photo uploaded.'
    };
  }

  // 2. Missing registration photo
  if (!regPhoto || regPhoto.trim() === '') {
    return {
      isSuspicious: true,
      badgeLabel: '⚠️ No RegForm',
      reason: 'No Certificate of Registration (COR) attachment uploaded.'
    };
  }

  // 3. User uploaded their 2x2 ID photo twice for both fields
  if (idPhoto && regPhoto && idPhoto === regPhoto) {
    return {
      isSuspicious: true,
      badgeLabel: '⚠️ 2x2 Uploaded as COR',
      reason: 'Duplicate photo detected: Student uploaded their 2x2 ID portrait photo instead of their official paper Certificate of Registration (COR).'
    };
  }

  return { isSuspicious: false };
}

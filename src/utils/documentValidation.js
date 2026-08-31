import { useState, useEffect } from 'react';

// Global memory cache for fast instantaneous audit lookups
const regformAuditCache = new Map();

/**
 * Robust image & canvas pixel analysis for document characteristics.
 */
export function analyzeDocumentFile(fileOrDataUrl) {
  return new Promise((resolve) => {
    if (!fileOrDataUrl) {
      return resolve({ isDocument: false, isSuspicious: true, badgeLabel: '⚠️ No RegForm', reason: 'No Certificate of Registration (COR) attachment uploaded.' });
    }

    const strUrl = String(fileOrDataUrl).trim();

    // Check if placeholder or avatar
    if (strUrl.includes('cvsu.png') || strUrl.includes('avatars') || strUrl.includes('placeholder')) {
      return resolve({
        isDocument: false,
        isSuspicious: true,
        badgeLabel: '⚠️ Invalid RegForm',
        reason: 'Placeholder or default image detected instead of official Certificate of Registration.'
      });
    }

    // If PDF, it is a valid document file format
    if (strUrl.startsWith('data:application/pdf') || strUrl.toLowerCase().includes('.pdf')) {
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
        let highSaturationCount = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalSampled++;

          // Light pixel typical of printed white document paper
          if (r > 175 && g > 175 && b > 175) {
            lightPixelCount++;
          }

          // Measure color saturation variance (faces, shirts, colorful scenery have higher variance than black text on white paper)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min > 45) {
            highSaturationCount++;
          }
        }

        const lightRatio = lightPixelCount / (totalSampled || 1);
        const saturationRatio = highSaturationCount / (totalSampled || 1);

        // Standard paper documents (Letter/A4 portrait ~0.65 to 0.84, landscape ~1.22 to 1.60)
        // Square selfies / 2x2 portrait photos have aspect ratio ~0.86 to 1.16
        const isSquarePhotoRatio = aspectRatio >= 0.86 && aspectRatio <= 1.16;

        // If square ratio (like 2x2 ID portrait or selfie):
        if (isSquarePhotoRatio) {
          // Square photos with non-paper color variance or typical selfie framing
          if (saturationRatio > 0.25 || lightRatio < 0.65) {
            return resolve({
              isDocument: false,
              isSuspicious: true,
              badgeLabel: '⚠️ Not a RegForm',
              reason: 'The uploaded file appears to be a 2x2 portrait photo, selfie, or square image rather than a printed Certificate of Registration (COR).'
            });
          }
        } else {
          // For rectangular document aspect ratios: only flag if strongly non-document (very dark or heavily saturated image)
          if (lightRatio < 0.18 && saturationRatio > 0.55) {
            return resolve({
              isDocument: false,
              isSuspicious: true,
              badgeLabel: '⚠️ Check Document',
              reason: 'The uploaded file appears too dark or colorful for a printed paper Certificate of Registration (COR).'
            });
          }
        }

        resolve({ isDocument: true, isSuspicious: false, reason: 'Valid document characteristics' });
      } catch (_) {
        resolve({ isDocument: true, isSuspicious: false });
      }
    };

    img.onerror = () => {
      resolve({ isDocument: true, isSuspicious: false });
    };

    img.src = strUrl;
  });
}

/**
 * Returns audit status for an enrollment record to show immediate badge to Admin.
 */
export function getRegformAuditStatus(enrollment, auditStateMap = {}) {
  if (!enrollment) return { isSuspicious: false };

  const enrollId = String(enrollment.id || enrollment.studentId || '');
  const regPhoto = enrollment.registration_photo || enrollment.registrationPhoto || enrollment.cor || enrollment.reg_form || '';
  const idPhoto = enrollment.id_photo_2x2 || enrollment.photo || enrollment.idPhoto2x2 || '';

  // 1. If explicit flag set during enrollment
  if (enrollment.is_flagged_regform || enrollment.isFlaggedRegform) {
    return {
      isSuspicious: true,
      badgeLabel: '⚠️ Check RegForm',
      reason: enrollment.regform_flag_reason || 'Document flagged: Possible non-document photo uploaded.'
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

  // 4. Check dynamic audit state map from active analysis
  if (enrollId && auditStateMap[enrollId]) {
    return auditStateMap[enrollId];
  }

  // 5. Check global memory cache
  if (regformAuditCache.has(regPhoto)) {
    return regformAuditCache.get(regPhoto);
  }

  return { isSuspicious: false };
}

/**
 * React hook that actively analyzes all pending enrollments in the background
 * and returns an audit status map { [enrollmentId]: auditResult }
 */
export function useRegformAuditor(enrollments = []) {
  const [auditMap, setAuditMap] = useState({});

  useEffect(() => {
    if (!Array.isArray(enrollments) || enrollments.length === 0) return;

    let isMounted = true;
    enrollments.forEach((enr) => {
      const enrId = String(enr.id || enr.studentId || '');
      const regPhoto = enr.registration_photo || enr.registrationPhoto || enr.cor || enr.reg_form || '';

      if (!enrId || !regPhoto) return;

      if (regformAuditCache.has(regPhoto)) {
        const cached = regformAuditCache.get(regPhoto);
        setAuditMap(prev => prev[enrId] === cached ? prev : { ...prev, [enrId]: cached });
        return;
      }

      analyzeDocumentFile(regPhoto).then(result => {
        regformAuditCache.set(regPhoto, result);
        if (isMounted) {
          setAuditMap(prev => ({ ...prev, [enrId]: result }));
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [enrollments]);

  return auditMap;
}


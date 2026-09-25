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

        // Visual analysis based on official CvSU Naic COR specimen (sample-cor.jpg):
        // 1. Paper background: White/light printed bond paper (high lightness ratio)
        // 2. Paper neutrality: Low color chroma/saturation (black ink on white paper, very low color variance)
        // 3. Ink marks: Contains dark print/table strokes (luminance < 115) against light paper (luminance > 140)
        // NOTE: Does NOT discriminate based on aspect ratio or square/rectangular size ("wag lang sa size, sa mismong itsura ng papel")
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.min(width, 100);
        canvas.height = Math.min(height, 100);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let lightPaperCount = 0;
        let darkInkCount = 0;
        let totalSampled = 0;
        let highChromaCount = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalSampled++;

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);

          // Paper pixel: light background typical of white bond paper
          if (lum > 140) {
            lightPaperCount++;
          }
          // Printed text/grid ink
          if (lum < 115) {
            darkInkCount++;
          }
          // High chroma: colorful pixels typical of portraits, selfies, clothing, scenery (COR is predominantly neutral white/grey)
          if (chroma > 36) {
            highChromaCount++;
          }
        }

        const paperRatio = lightPaperCount / (totalSampled || 1);
        const chromaRatio = highChromaCount / (totalSampled || 1);

        // A valid COR paper document has a dominant light paper background and low overall color saturation
        // If image is heavily colored (selfie, clothing, nature, portrait photo) or lacks paper background:
        if (chromaRatio > 0.38) {
          return resolve({
            isDocument: false,
            isSuspicious: true,
            badgeLabel: '⚠️ Check RegForm Paper',
            reason: 'The uploaded file does not match the official Certificate of Registration (COR) paper appearance. It contains high color photographic saturation (selfie/photo) rather than printed white paper with tabular courses and registrar markings (see official specimen).'
          });
        }

        // If extremely dark (not a paper document on white bond paper)
        if (paperRatio < 0.22) {
          return resolve({
            isDocument: false,
            isSuspicious: true,
            badgeLabel: '⚠️ Non-Paper Image',
            reason: 'The uploaded file appears too dark to be an official printed paper Certificate of Registration (COR).'
          });
        }

        resolve({ isDocument: true, isSuspicious: false, reason: 'Matches official paper document characteristics' });
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


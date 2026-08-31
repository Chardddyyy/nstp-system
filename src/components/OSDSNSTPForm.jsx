import React from 'react';

const OSDSNSTPForm = ({
  academicYear = '2025-2026',
  campusName = 'Cavite State University - Naic',
  classification = 'PUBLIC',
  region = '4A - CALABARZON',
  _address = 'Bucana Malaki, Naic, Cavite',
  students = [],
  gradesMap = {},
  statsData = null
}) => {
  // Compute demographic statistics if not provided
  const computedStats = React.useMemo(() => {
    if (statsData) return statsData;

    const data = {
      sem1: {
        ROTC: { m: 0, f: 0 },
        CWTS: { m: 0, f: 0 },
        LTS: { m: 0, f: 0 }
      },
      sem2: {
        ROTC: { m: 0, f: 0 },
        CWTS: { m: 0, f: 0 },
        LTS: { m: 0, f: 0 }
      },
      summer: {
        ROTC: { m: 0, f: 0 },
        CWTS: { m: 0, f: 0 },
        LTS: { m: 0, f: 0 }
      },
      graduates: {
        ROTC: { m: 0, f: 0 },
        CWTS: { m: 0, f: 0 },
        LTS: { m: 0, f: 0 }
      }
    };

    const yearStrLower = String(academicYear || '').toLowerCase();
    const is1stSemExplicit = yearStrLower.includes('1st') || yearStrLower.includes('first');
    const is2ndSemExplicit = yearStrLower.includes('2nd') || yearStrLower.includes('second');
    const isAnnualExplicit = yearStrLower.includes('annual') || yearStrLower.includes('whole') || yearStrLower.includes('full');

    const isOnly1stSemBatch = is1stSemExplicit || (!is2ndSemExplicit && !isAnnualExplicit && (students || []).every(st => !st.final_grade_2 && (!st.semester || st.semester === '1st Semester')));

    (students || []).forEach((st) => {
      // 1. Identify Component (ROTC, LTS, CWTS)
      const deptRaw = (st.department || '').toUpperCase();
      let targetDept = null;
      if (deptRaw.includes('ROTC')) targetDept = 'ROTC';
      else if (deptRaw.includes('LTS')) targetDept = 'LTS';
      else if (deptRaw.includes('CWTS')) targetDept = 'CWTS';

      if (!targetDept) return;

      // 2. Identify Gender (Male / Female)
      const sexRaw = (st.sex || st.gender || 'Male').toUpperCase();
      const genKey = sexRaw.startsWith('F') ? 'f' : 'm';

      // 1st Sem Enrollees: All enrolled students in cohort
      data.sem1[targetDept][genKey] += 1;

      if (isOnly1stSemBatch) {
        // If purely 1st semester batch, 2nd sem and graduates are not yet applicable (0)
        return;
      }

      const sid = String(st.studentId || st.student_id || st.id || '').trim();
      const sem2GradeObj = (gradesMap && sid) ? (gradesMap[`${sid}_2nd Semester`] || gradesMap[sid]?.['2nd Semester'] || gradesMap[`${sid}_2nd`] || {}) : {};
      const sem1GradeObj = (gradesMap && sid) ? (gradesMap[`${sid}_1st Semester`] || gradesMap[sid]?.['1st Semester'] || gradesMap[`${sid}_1st`] || {}) : {};

      const g1Raw = st.final_grade_1 || st.grade_sem1 || sem1GradeObj.final_grade || sem1GradeObj.grade || (st.semester === '1st Semester' ? st.final_grade : '') || st.midterm_grade || '';
      const g2Raw = st.final_grade_2 || st.grade_sem2 || sem2GradeObj.final_grade || sem2GradeObj.grade || (st.semester === '2nd Semester' ? st.final_grade : '') || '';

      const g1Str = String(g1Raw).trim();
      const g2Str = String(g2Raw).trim();

      const num2 = parseFloat(g2Str);
      const isFailed2 = num2 > 3.0 || g2Str.includes('5.0') || g2Str.toUpperCase().includes('FAIL') || g2Str.toUpperCase().includes('INC') || g2Str.toUpperCase().includes('DRP');
      const isPass2 = (!isNaN(num2) && num2 >= 1.0 && num2 <= 3.0 && !isFailed2) || g2Str.toLowerCase() === 'passed';

      const has2ndSemFlag = st.has_2nd_sem !== false && st.has_2nd_sem !== 0;
      const isSem2Enrolled = has2ndSemFlag && Boolean(g2Str) && g2Str !== '-';

      if (isSem2Enrolled) {
        data.sem2[targetDept][genKey] += 1;

        // Graduates: Nakabase LAMANG sa 2nd semester grade (1.00 hanggang 3.00 lamang, bawal ang 5.00/INC/DRP)
        if (isPass2 && !isFailed2) {
          data.graduates[targetDept][genKey] += 1;
        }
      }
    });

    return data;
  }, [students, gradesMap, statsData, academicYear]);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 bg-white text-sm font-sans text-black">
      
      {/* HEADER SECTION W/ LOGOS */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 relative border-b border-gray-100 pb-4">
        {/* Left Logo - CHED */}
        <div className="shrink-0">
          <img
            src={`${cleanBase}ched-logo.png`}
            alt="CHED Logo"
            className="w-16 h-16 sm:w-24 sm:h-24 object-contain"
            onError={(e) => {
              if (!e.currentTarget.dataset.failed) {
                e.currentTarget.dataset.failed = '1';
                e.currentTarget.src = './ched-logo.png';
              }
            }}
          />
        </div>
        
        {/* Header Text */}
        <div className="text-center leading-snug px-2">
          <p className="uppercase text-xs sm:text-sm tracking-wider">Republic of the Philippines</p>
          <p className="uppercase font-semibold text-xs sm:text-sm">Office of the President</p>
          <p className="uppercase font-bold text-sm sm:text-lg text-emerald-950">Commission on Higher Education</p>
        </div>

        {/* Right Logo - Institution Logo (e.g. CvSU) */}
        <div className="shrink-0">
          <img
            src={`${cleanBase}cvsu.png`}
            alt="Institution Logo"
            className="w-16 h-16 sm:w-24 sm:h-24 object-contain"
            onError={(e) => {
              if (!e.currentTarget.dataset.failed) {
                e.currentTarget.dataset.failed = '1';
                e.currentTarget.src = `${cleanBase}cvsu-logo.png`;
              } else if (e.currentTarget.dataset.failed === '1') {
                e.currentTarget.dataset.failed = '2';
                e.currentTarget.src = './cvsu.png';
              }
            }}
          />
        </div>
      </div>

      {/* FORM TITLE & ACADEMIC YEAR */}
      <div className="text-center mb-6">
        <h1 className="font-bold text-sm sm:text-lg mb-4 text-emerald-950 uppercase tracking-tight">
          SUMMARY NUMBER OF ENROLLMENT AND GRADUATES OF NSTP
        </h1>
        <div className="flex justify-between items-center px-2 sm:px-12 text-xs sm:text-base font-semibold">
          <p>
            Academic Year: <span className="border-b-2 border-black px-2 min-w-24 inline-block font-bold">{academicYear}</span>
          </p>
          <p>Region: {region}</p>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="overflow-x-auto mt-4 shadow-sm rounded-lg border border-black">
        <table className="w-full border-collapse border border-black text-center text-[10px] sm:text-xs">
          <thead className="bg-gray-50 text-black">
            {/* Header Row 1 */}
            <tr>
              <th className="border border-black p-2 align-middle font-bold min-w-32" rowSpan={4}>
                NAME OF HEI/CAMPUS
              </th>
              <th className="border border-black p-2 align-middle font-bold min-w-24" rowSpan={4}>
                Classification<br/>(Private/Public)
              </th>
              <th className="border border-black p-2 bg-emerald-50/80 font-black text-emerald-950" colSpan={18}>
                ENROLLMENT
              </th>
              <th className="border border-black p-2 bg-amber-50/80 font-black text-amber-950" colSpan={6}>
                GRADUATES
              </th>
            </tr>
            {/* Header Row 2 */}
            <tr>
              <th className="border border-black p-1 font-bold bg-gray-100" colSpan={6}>1st Sem.</th>
              <th className="border border-black p-1 font-bold bg-gray-100" colSpan={6}>2nd Sem.</th>
              <th className="border border-black p-1 font-bold bg-gray-100" colSpan={6}>Summer</th>
              <th className="border border-black p-1 font-bold bg-amber-100/50" colSpan={6}></th>
            </tr>
            {/* Header Row 3 */}
            <tr>
              {/* Loop for ROTC, LTS, CWTS in 3 Semesters + Graduates */}
              {[...Array(4)].map((_, i) => (
                <React.Fragment key={`component-${i}`}>
                  <th className="border border-black p-1 font-bold">ROTC</th>
                  <th className="border border-black p-1 font-bold">LTS</th>
                  <th className="border border-black p-1 font-bold">CWTS</th>
                </React.Fragment>
              ))}
            </tr>
            {/* Header Row 4 (Male/Female) */}
            <tr>
              {[...Array(12)].map((_, i) => (
                <React.Fragment key={`gender-${i}`}>
                  <th className="border border-black p-1 font-semibold text-[9px] sm:text-xs">M</th>
                  <th className="border border-black p-1 font-semibold text-[9px] sm:text-xs">F</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          
          {/* TABLE BODY */}
          <tbody>
            {/* Data Row */}
            <tr className="hover:bg-gray-50/80 transition-colors font-medium">
              <td className="border border-black p-2 text-left font-black text-emerald-950">{campusName}</td>
              <td className="border border-black p-2 font-bold">{classification}</td>
              
              {/* 1st Sem: ROTC M/F, LTS M/F, CWTS M/F */}
              <td className="border border-black p-1.5">{computedStats.sem1.ROTC.m}</td>
              <td className="border border-black p-1.5">{computedStats.sem1.ROTC.f}</td>
              <td className="border border-black p-1.5">{computedStats.sem1.LTS.m}</td>
              <td className="border border-black p-1.5">{computedStats.sem1.LTS.f}</td>
              <td className="border border-black p-1.5">{computedStats.sem1.CWTS.m}</td>
              <td className="border border-black p-1.5">{computedStats.sem1.CWTS.f}</td>

              {/* 2nd Sem: ROTC M/F, LTS M/F, CWTS M/F */}
              <td className="border border-black p-1.5">{computedStats.sem2.ROTC.m}</td>
              <td className="border border-black p-1.5">{computedStats.sem2.ROTC.f}</td>
              <td className="border border-black p-1.5">{computedStats.sem2.LTS.m}</td>
              <td className="border border-black p-1.5">{computedStats.sem2.LTS.f}</td>
              <td className="border border-black p-1.5">{computedStats.sem2.CWTS.m}</td>
              <td className="border border-black p-1.5">{computedStats.sem2.CWTS.f}</td>

              {/* Summer: ROTC M/F, LTS M/F, CWTS M/F */}
              <td className="border border-black p-1.5">{computedStats.summer.ROTC.m}</td>
              <td className="border border-black p-1.5">{computedStats.summer.ROTC.f}</td>
              <td className="border border-black p-1.5">{computedStats.summer.LTS.m}</td>
              <td className="border border-black p-1.5">{computedStats.summer.LTS.f}</td>
              <td className="border border-black p-1.5">{computedStats.summer.CWTS.m}</td>
              <td className="border border-black p-1.5">{computedStats.summer.CWTS.f}</td>

              {/* Graduates: ROTC M/F, LTS M/F, CWTS M/F */}
              <td className="border border-black p-1.5 font-bold bg-amber-50/40 text-amber-950">{computedStats.graduates.ROTC.m}</td>
              <td className="border border-black p-1.5 font-bold bg-amber-50/40 text-amber-950">{computedStats.graduates.ROTC.f}</td>
              <td className="border border-black p-1.5 font-bold bg-amber-50/40 text-amber-950">{computedStats.graduates.LTS.m}</td>
              <td className="border border-black p-1.5 font-bold bg-amber-50/40 text-amber-950">{computedStats.graduates.LTS.f}</td>
              <td className="border border-black p-1.5 font-bold bg-amber-50/40 text-amber-950">{computedStats.graduates.CWTS.m}</td>
              <td className="border border-black p-1.5 font-bold bg-amber-50/40 text-amber-950">{computedStats.graduates.CWTS.f}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatories Footer */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs font-semibold">
        <div>
          <p className="border-b border-black w-48 mx-auto mb-1"></p>
          <p className="font-bold">Prepared by:</p>
          <p className="text-gray-600 font-normal">NSTP Coordinator</p>
        </div>
        <div>
          <p className="border-b border-black w-48 mx-auto mb-1"></p>
          <p className="font-bold">Verified by:</p>
          <p className="text-gray-600 font-normal">Campus NSTP Director</p>
        </div>
        <div>
          <p className="border-b border-black w-48 mx-auto mb-1"></p>
          <p className="font-bold">Approved by:</p>
          <p className="text-gray-600 font-normal">Campus Administrator</p>
        </div>
      </div>
      
    </div>
  );
};

export default OSDSNSTPForm;

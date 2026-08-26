import React from 'react';

const OSDSNSTPForm2B = ({
  academicYear = '2025-2026',
  semester = '1st Semester',
  heiName = 'Cavite State University - Naic',
  address = 'Bucana Malaki, Naic, Cavite',
  region = '4A - CALABARZON',
  nstpComponents = 'CWTS / ROTC / LTS',
  students = []
}) => {
  // Ensure we display rows or blank rows if empty
  const displayStudents = (students && students.length > 0) ? students : [
    {
      studentId: '2022-12345',
      lastName: 'Dela Cruz',
      firstName: 'Juan',
      middleName: 'Santos',
      program: 'BSIT',
      sex: 'M',
      birthDate: '08/17/2005',
      street: 'Brgy. Halang',
      municipality: 'Naic',
      province: 'Cavite',
      contactNumber: '09123456789',
      email: 'juan.delacruz@example.com'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 bg-white text-sm font-sans text-black">
      
      {/* HEADER SECTION W/ LOGOS */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 relative border-b border-gray-100 pb-4">
        {/* Left Logo - CHED */}
        <div className="shrink-0">
          <img src="/ched-logo.png" alt="CHED Logo" className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
        </div>
        
        {/* Header Text (Centered) */}
        <div className="text-center leading-snug px-2 flex-1">
          <p className="uppercase text-xs sm:text-sm tracking-wider">Republic of the Philippines</p>
          <p className="uppercase font-semibold text-xs sm:text-sm">Office of the President</p>
          <p className="uppercase font-bold text-sm sm:text-lg text-emerald-950">Commission on Higher Education</p>
        </div>

        {/* Right Logo - Institution Logo */}
        <div className="shrink-0">
          <img src="/cvsu-logo.png" alt="Institution Logo" className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
        </div>
      </div>

      {/* FORM TITLE & SEMESTER/YEAR (Centered) */}
      <div className="text-center mb-6">
        <h1 className="font-bold text-base sm:text-lg text-emerald-950 uppercase tracking-tight">NSTP 1 Enrollment List</h1>
        <p className="font-semibold text-xs sm:text-base mt-2">
          {semester}, Academic Year: <span className="border-b-2 border-black px-2 min-w-32 inline-block font-bold">{academicYear}</span>
        </p>
      </div>

      {/* HEI DETAILS */}
      <div className="mb-6 px-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
        <div className="space-y-2">
          <p className="font-semibold">
            Name of HEI: <span className="border-b border-black min-w-72 inline-block px-2 font-bold">{heiName}</span>
          </p>
          <p className="font-semibold">
            Address: <span className="border-b border-black min-w-72 inline-block px-2 font-normal">{address}</span>
          </p>
        </div>
        <div className="space-y-2 md:text-right">
          <p className="font-semibold">
            Region: <span className="border-b border-black min-w-64 inline-block px-2 font-bold text-left">{region}</span>
          </p>
          <p className="font-semibold">
            NSTP Components: <span className="border-b border-black min-w-64 inline-block px-2 font-bold text-left">{nstpComponents}</span>
          </p>
        </div>
      </div>

      {/* ENROLLMENT DATA TABLE */}
      <div className="overflow-x-auto shadow-sm rounded-lg border border-black">
        <table className="w-full border-collapse border border-black text-center text-[10px] sm:text-xs">
          <thead>
            {/* Main Column Headers */}
            <tr className="bg-gray-100 font-bold text-black">
              <th className="border border-black p-2 align-middle" rowSpan={2}>No.</th>
              <th className="border border-black p-2 align-middle" rowSpan={2}>Student No.</th>
              <th className="border border-black p-2" colSpan={3}>Student Name</th>
              <th className="border border-black p-2 align-middle" rowSpan={2}>Program</th>
              <th className="border border-black p-2 align-middle" rowSpan={2}>Sex</th>
              <th className="border border-black p-2 align-middle" rowSpan={2}>Birthdate</th>
              <th className="border border-black p-2" colSpan={3}>Address</th>
              <th className="border border-black p-2 align-middle" rowSpan={2}>Contact Number</th>
              <th className="border border-black p-2 align-middle" rowSpan={2}>Email Address</th>
            </tr>
            {/* Sub-Column Headers for Name and Address */}
            <tr className="bg-gray-100 font-semibold text-black">
              {/* Under Student Name */}
              <th className="border border-black p-1">Surname</th>
              <th className="border border-black p-1">First Name</th>
              <th className="border border-black p-1">Middle Name</th>
              {/* Under Address */}
              <th className="border border-black p-1">Street/Barangay</th>
              <th className="border border-black p-1">Municipality/City</th>
              <th className="border border-black p-1">Province</th>
            </tr>
          </thead>
          
          {/* TABLE BODY */}
          <tbody>
            {displayStudents.map((st, index) => {
              let surname = st.lastName || '';
              let firstName = st.firstName || '';
              let middleName = st.middleName || '';
              if (!surname && st.name && st.name.includes(',')) {
                const parts = st.name.split(',');
                surname = parts[0].trim();
                const rest = (parts[1] || '').trim().split(/\s+/);
                firstName = rest[0] || '';
                middleName = rest.slice(1).join(' ') || '';
              } else if (!surname && st.name) {
                const parts = st.name.trim().split(/\s+/);
                surname = parts[parts.length - 1] || '';
                firstName = parts.slice(0, -1).join(' ') || '';
              }

              let street = st.street || '';
              let municipality = st.municipality || '';
              let province = st.province || '';
              if (!street && !municipality && (st.address || st.homeAddress)) {
                const addr = st.address || st.homeAddress || '';
                const parts = addr.split(',').map((p) => p.trim());
                if (parts.length >= 3) {
                  street = parts[0];
                  municipality = parts[1];
                  province = parts.slice(2).join(', ');
                } else if (parts.length === 2) {
                  street = parts[0];
                  municipality = parts[1];
                } else {
                  street = addr;
                }
              }

              let birthdate = '';
              if (st.birthDate) {
                const d = new Date(st.birthDate);
                if (!isNaN(d.getTime())) {
                  birthdate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
                } else {
                  birthdate = st.birthDate;
                }
              } else if (st.birthMonth && st.birthDay && st.birthYear) {
                birthdate = `${String(st.birthMonth).padStart(2, '0')}/${String(st.birthDay).padStart(2, '0')}/${st.birthYear}`;
              }

              const sexDisplay = (st.sex || st.gender || 'M').toUpperCase().startsWith('F') ? 'F' : 'M';

              return (
                <tr key={st.id || st.studentId || index} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-black p-2 font-bold">{index + 1}</td>
                  <td className="border border-black p-2 font-mono font-bold">{st.studentId || '-'}</td>
                  <td className="border border-black p-2 text-left font-medium">{surname}</td>
                  <td className="border border-black p-2 text-left font-medium">{firstName}</td>
                  <td className="border border-black p-2 text-left font-medium">{middleName}</td>
                  <td className="border border-black p-2 font-bold">{st.program || st.course || 'BSIT'}</td>
                  <td className="border border-black p-2 font-bold">{sexDisplay}</td>
                  <td className="border border-black p-2">{birthdate || '-'}</td>
                  <td className="border border-black p-2 text-left">{street || '-'}</td>
                  <td className="border border-black p-2 text-left">{municipality || 'Naic'}</td>
                  <td className="border border-black p-2 text-left">{province || 'Cavite'}</td>
                  <td className="border border-black p-2 font-mono">{st.contactNumber || '-'}</td>
                  <td className="border border-black p-2 text-left font-mono">{st.email || '-'}</td>
                </tr>
              );
            })}

            {/* Extra blank rows if list is short to ensure standard printable page structure */}
            {displayStudents.length < 5 && [...Array(Math.max(0, 5 - displayStudents.length))].map((_, index) => (
              <tr key={`blank-${index}`} className="h-8">
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatories Footer */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs font-semibold">
        <div>
          <p className="border-b border-black w-56 mx-auto mb-1"></p>
          <p className="font-bold">Prepared by:</p>
          <p className="text-gray-600 font-normal">NSTP Department Coordinator</p>
        </div>
        <div>
          <p className="border-b border-black w-56 mx-auto mb-1"></p>
          <p className="font-bold">Certified Correct by:</p>
          <p className="text-gray-600 font-normal">Campus NSTP Director</p>
        </div>
      </div>
      
    </div>
  );
};

export default OSDSNSTPForm2B;

const pool = require('./backend/config/database');

async function run() {
  const [rows] = await pool.execute('SELECT year, data FROM archived_years');
  for (const r of rows) {
    const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
    const students = data.studentData || [];

    console.log('\n=============================================');
    console.log('BATCH:', r.year, '(Total:', students.length, 'students)');

    let sem1Count = 0;
    let sem2Count = 0;
    let gradCount = 0;
    const grads = [];
    const nonGrads = [];

    const stats = {
      sem1: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
      sem2: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } },
      graduates: { ROTC: { m: 0, f: 0 }, LTS: { m: 0, f: 0 }, CWTS: { m: 0, f: 0 } }
    };

    students.forEach((st) => {
      const sexRaw = (st.sex || st.gender || 'Male').toUpperCase();
      const genKey = sexRaw.startsWith('F') ? 'f' : 'm';
      const dept = st.department || 'CWTS';
      let targetDept = null;
      if (dept.includes('ROTC')) targetDept = 'ROTC';
      else if (dept.includes('LTS')) targetDept = 'LTS';
      else if (dept.includes('CWTS')) targetDept = 'CWTS';
      if (!targetDept) return;

      // 1st Sem
      stats.sem1[targetDept][genKey] += 1;
      sem1Count++;

      // Grade 1
      const g1 = String(st.final_grade_1 || st.grade_sem1 || '').trim();
      const num1 = parseFloat(g1);
      const isPass1 = !isNaN(num1) && num1 >= 1.0 && num1 <= 3.0 && g1 !== '5.00' && !g1.toUpperCase().includes('FAIL') && !g1.toUpperCase().includes('INC') && !g1.toUpperCase().includes('DRP');

      // Grade 2
      const g2 = String(st.final_grade_2 || st.grade_sem2 || '').trim();
      const num2 = parseFloat(g2);
      const has2ndSem = st.has_2nd_sem === true || st.has_2nd_sem === 1 || (Boolean(g2) && g2 !== '-');
      const isPass2 = has2ndSem && !isNaN(num2) && num2 >= 1.0 && num2 <= 3.0 && g2 !== '5.00' && !g2.toUpperCase().includes('FAIL') && !g2.toUpperCase().includes('INC') && !g2.toUpperCase().includes('DRP');

      if (has2ndSem && g2 && g2 !== '-') {
        stats.sem2[targetDept][genKey] += 1;
        sem2Count++;
      }

      // To graduate: MUST be enrolled in 2nd sem AND pass BOTH sem 1 and sem 2 without failing marks
      const isGrad = has2ndSem && isPass1 && isPass2;

      if (isGrad) {
        stats.graduates[targetDept][genKey] += 1;
        gradCount++;
        grads.push(st.name + ' (G1=' + g1 + ', G2=' + g2 + ')');
      } else {
        nonGrads.push(st.name + ' (G1=' + g1 + ', G2=' + g2 + ', Status=' + st.status + ')');
      }
    });

    console.log('Stats Matrix:', JSON.stringify(stats));
    console.log('Sem1 Total:', sem1Count, 'Sem2 Total:', sem2Count, 'GRADUATES:', gradCount, 'NON-GRADUATES:', nonGrads.length);
    console.log('Graduates List:', grads);
    console.log('Non-Graduates List (Failed/INC/DRP):', nonGrads);
  }
  process.exit(0);
}

run();

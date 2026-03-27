const http = require('http');

const data = JSON.stringify({
  firstName: 'Test',
  lastName: 'User',
  email: 'test@test.com',
  department: 'ROTC',
  studentId: '123456789',
  contactNumber: '09123456789',
  birthDate: '2000-01-01',
  gender: 'Male',
  address: 'Test Address',
  program: 'ROTC',
  section: 'A',
  yearLevel: '1',
  emergencyContact: 'Parent',
  emergencyNumber: '09123456788'
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/enrollments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();

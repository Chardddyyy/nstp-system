-- Insert 10 dummy students into pending enrollment
INSERT INTO enrollments (student_name, email, department, studentId, contactNumber, birthDate, gender, address, course, yearLevel, emergencyContact, emergencyNumber, status) VALUES
('Juan Dela Cruz', 'juan.delacruz@email.com', 'CWTS', '202300001', '09123456789', '2000-05-15', 'Male', '123 Main St, Manila', 'BSIT', '1st Year', 'Maria Dela Cruz', '09987654321', 'Pending'),
('Maria Santos', 'maria.santos@email.com', 'LTS', '202300002', '09123456790', '2001-08-22', 'Female', '456 Oak St, Quezon City', 'BSCS', '2nd Year', 'Pedro Santos', '09987654322', 'Pending'),
('Pedro Reyes', 'pedro.reyes@email.com', 'ROTC', '202300003', '09123456791', '1999-03-10', 'Male', '789 Pine St, Makati', 'BSBA', '3rd Year', 'Ana Reyes', '09987654323', 'Pending'),
('Ana Garcia', 'ana.garcia@email.com', 'CWTS', '202300004', '09123456792', '2002-11-05', 'Female', '321 Elm St, Pasig', 'BSHM', '1st Year', 'Jose Garcia', '09987654324', 'Pending'),
('Jose Mendoza', 'jose.mendoza@email.com', 'LTS', '202300005', '09123456793', '2000-07-18', 'Male', '654 Maple St, Taguig', 'BEED', '2nd Year', 'Teresa Mendoza', '09987654325', 'Pending'),
('Teresa Bautista', 'teresa.bautista@email.com', 'ROTC', '202300006', '09123456794', '2001-01-25', 'Female', '987 Cedar St, Mandaluyong', 'BSED', '4th Year', 'Ricardo Bautista', '09987654326', 'Pending'),
('Ricardo Tan', 'ricardo.tan@email.com', 'CWTS', '202300007', '09123456795', '1998-09-30', 'Male', '147 Birch St, Pasay', 'BSFAS', '3rd Year', 'Elena Tan', '09987654327', 'Pending'),
('Elena Lim', 'elena.lim@email.com', 'LTS', '202300008', '09123456796', '2002-04-12', 'Female', '258 Willow St, Caloocan', 'BSIT', '1st Year', 'Robert Lim', '09987654328', 'Pending'),
('Robert Chan', 'robert.chan@email.com', 'ROTC', '202300009', '09123456797', '1999-12-08', 'Male', '369 Spruce St, Malabon', 'BSCS', '2nd Year', 'Jennifer Chan', '09987654329', 'Pending'),
('Jennifer Cruz', 'jennifer.cruz@email.com', 'CWTS', '202300010', '09123456798', '2001-06-20', 'Female', '741 Aspen St, Navotas', 'BSBA', '3rd Year', 'Michael Cruz', '09987654330', 'Pending');

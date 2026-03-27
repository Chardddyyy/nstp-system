const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3307, // Your MySQL port
  user: 'root',
  password: '', // XAMPP default
  database: 'nstp_system'
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;

import mysql from 'mysql2/promise'; 

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password$$$098',
    database: 'appointment_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// async function fetchPatients() {
//     try {
//         const [rows] = await pool.query('SELECT * FROM patients'); 
//         console.log(rows); 
//     } catch (error) {
//         console.error("Error fetching patients:", error);
//     }
// }

// fetchPatients();

export default pool;

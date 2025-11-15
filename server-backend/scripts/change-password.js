import mysql from 'mysql2/promise';

async function changePassword() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1234'
    });

    await conn.query("SET old_passwords = 0");
    await conn.query("ALTER USER 'root'@'localhost' IDENTIFIED BY 'password1234'");
    await conn.query('FLUSH PRIVILEGES');
    console.log('✅ Password updated successfully');

    await conn.end();
}

changePassword().catch(console.error);

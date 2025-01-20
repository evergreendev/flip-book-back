const mysql = require('mysql2');
let pool;

function getPool(){
    if(pool) return pool;
    pool = mysql.createPool({
        connectionLimit : 10,
        host            : process.env.DB_HOST,
        user            : process.env.DB_USER,
        port          : process.env.DB_PORT,
        password        : process.env.DB_PASS,
        database        : process.env.DB_NAME,
    })

    return pool;
}


module.exports = {
    getPool: getPool,
}

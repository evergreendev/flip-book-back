var mysql = require('mysql2');
var pool;

module.exports = {
    getPool: function() {
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
}

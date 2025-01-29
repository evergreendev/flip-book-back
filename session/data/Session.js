const bcrypt = require('bcrypt');
const db = require('../../data/database');
const jwt = require('jsonwebtoken');
const pool = db.getPool();

module.exports = {
    create: async function (user) {
        if (!user || !user.password) return null;

        const[DBUser] = await pool.execute("SELECT * FROM users WHERE user_name = ?",[user.email]);

        if (!DBUser[0]) return null;

        const passwordMatch = await bcrypt.compare(user.password, DBUser[0].password);

        if (!passwordMatch) return null;

//expire one hour from now
        return jwt.sign({isAdmin: 'true', exp: Math.floor(Date.now() / 1000) + (60 * 60),}, process.env.JWT_SECRET);
    },
    checkClaim: async function (token) {
        try{
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (err){
            return false;
        }
    }
}

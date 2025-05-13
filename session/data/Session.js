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

        // User token expires in one hour
        const userToken = jwt.sign(
            {isAdmin: 'true', exp: Math.floor(Date.now() / 1000) + (60 * 15)},
            process.env.JWT_SECRET
        );

        // Refresh token expires in 7 days
        const refreshToken = jwt.sign(
            {userId: DBUser[0].id, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)}, 
            process.env.JWT_SECRET
        );

        return { userToken, refreshToken };
    },
    checkClaim: async function (token) {
        try{
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (err){
            return false;
        }
    },
    refreshToken: async function (refreshToken) {
        try {
            // Create a new user token
            const userToken = jwt.sign(
                {isAdmin: 'true', exp: Math.floor(Date.now() / 1000) + (60 * 15)},
                process.env.JWT_SECRET
            );

            return { userToken };
        } catch (err) {
            return false;
        }
    }
}

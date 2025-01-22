const bcrypt = require('bcrypt');
const db = require('../../data/database');
const { v4: uuidv4 } = require('uuid');

const pool = db.getPool();

module.exports = {
    findById: async function (id) {
        const [users] = await pool.execute("SELECT 'id','user_name' FROM users where id=?", [id]);

        return users;
    },
    findAll: async function () {
        const [users] = await pool.execute("SELECT 'id','user_name' FROM users", []);

        return users;
    },
    create: async function (user) {
        if (!user || !user.password) return null;
        const passHash = await bcrypt.hash(user.password, 8);
        const[newUser] = await pool.execute("INSERT INTO users (password,user_name,id) VALUES (?, ?, ?)",[passHash, user.email, uuidv4()]);

        return newUser;
    }
}

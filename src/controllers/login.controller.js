const jwt = require('jsonwebtoken');
const { authUser } = require('../services/auth.service');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

async function authLogin(req, res) {
    
    const {username, password} = req.body;

    const user = await authUser(username, password);

    if(user) {

        const payload = {
            user_id: user.user_id,
            username: user.username,
            display_name: user.display_name,
            email: user.email
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }
        )

        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!!!",
            token: token
        });
    }
    else {
        res.status(401).json({
            success: false,
            message: "Đăng nhập thất bại!!!"
        });
    }
}

module.exports = {
    authLogin
}
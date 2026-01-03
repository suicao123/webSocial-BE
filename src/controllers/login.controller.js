const jwt = require('jsonwebtoken');
const { authUser } = require('../services/auth.service');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;

async function authLogin(req, res) {
    
    const {username, password} = req.body;

    const user = await authUser(username, password);
    

    if(user) {

        const payload = {
            user_id: user.user_id,
            username: user.username,
            display_name: user.display_name,
            email: user.email,
            role: user.role_id
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

async function register(req, res) {
    try {
        const { username, password, display_name, email, avatar_url, role_id, bio } = req.body;

        // if (!username || !password || !display_name || !email) {
        //     return res.status(400).json({ message: "Vui lòng điền đầy đủ các trường bắt buộc." });
        // }

        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ message: "Tên đăng nhập hoặc Email đã được sử dụng." });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const newUser = await prisma.users.create({
            data: {
                username: username,
                password_hash: password_hash,
                email: email,
                display_name: display_name,
                avatar_url: avatar_url,
                role_id: role_id,
                bio: bio
            }
        });

        return res.status(201).json({
            message: "Tạo tài khoản thành công!",
            data: newUser
        });

    } catch (error) {
        console.error("Lỗi đăng ký tài khoản:", error);
        return res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
}

module.exports = {
    authLogin,
    register
}
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function authLogin(req, res) {
    
    const {username, password} = req.body;

    if(username === "admin" && password === "123456") {

        const payload = {
            userId: username,
            username: username
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
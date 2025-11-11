const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

function authMidleware(req, res, next) {

    try {
        const authHeader = req.headers['authorization'];

        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) {
            return res.status(401).json({ message: "Khong co token" });
        }

        jwt.verify(token, JWT_SECRET, (err, userPayload) => {
            if(err) {
                return res.status(401).json({ message: "sai token" });
            }

            req.user = userPayload;

            next();
        })
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token đã hết hạn' });
        }
        
        return res.status(403).json({ message: 'Token không hợp lệ' });
    }

}

module.exports = authMidleware;

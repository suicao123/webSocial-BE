const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getUser(req, res) {
    try {
        const userId = req.query.user_id;

        const user = await prisma.users.findUnique({
            where: {
                user_id: userId
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                avatar_url: true,
                display_name: true
            }
        });

        res.status(200).json(user);

    } catch (error) {
        res.status(401).json('Không tìm thấy người dùng');
    }
}

module.exports = {
    getUser
}

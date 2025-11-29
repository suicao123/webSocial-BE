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
                display_name: true,
                bio: true
            }
        });

        res.status(200).json(user);

    } catch (error) {
        res.status(401).json('Không tìm thấy người dùng');
    }
}

async function getFriends(req, res) {
    try {
        
        const user_id = req.params.id;

        const datas = await prisma.friendships.findMany({
            where: {
                status: 'accepted',
                OR: [
                    { user_one_id: user_id },
                    { user_two_id: user_id }
                ]
            },
            select: {
                user_one_id: true,
                user_two_id: true,
                users_friendships_user_one_idTousers: {
                    select: {
                        user_id: true,
                        display_name: true,
                        avatar_url: true
                    }
                },
                users_friendships_user_two_idTousers: {
                    select: {
                        user_id: true,
                        display_name: true,
                        avatar_url: true
                    }
                }
            }
        });

        const friendList = datas.map(data => {
            if(data.user_one_id.toString() === user_id.toString()) {
                return data.users_friendships_user_two_idTousers;
            }
            else {
                return data.users_friendships_user_one_idTousers;
            }
        })
        

        res.status(200).json({
            success: true,
            count: friendList.length,
            data: friendList
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Lỗi sever',
            error: error.message
        });
    }
}

module.exports = {
    getUser,
    getFriends
}

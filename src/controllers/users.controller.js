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

async function getReceivedFriendRequests(req, res) {
    try {
        const userId = BigInt(req.user.user_id);

        const requests = await prisma.friendships.findMany({
            where: {
                status: 'pending',
                AND: [
                    {
                        OR: [
                            { user_one_id: userId },
                            { user_two_id: userId }
                        ]
                    },
                    {
                        action_user_id: { not: userId }
                    }
                ]
            },
            include: {
                // Lấy thông tin người gửi (action_user_id)
                users_friendships_action_user_idTousers: {
                    select: {
                        user_id: true,
                        username: true,
                        email: true,
                        avatar_url: true,
                        display_name: true,
                        bio: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedUsers = requests.map(item => {
            const sender = item.users_friendships_action_user_idTousers;

            return {
                user_id: BigInt(sender.user_id), 
                username: sender.username,
                email: sender.email,
                avatar_url: sender.avatar_url,
                display_name: sender.display_name,
                bio: sender.bio || ""
            };
        });

        return res.status(200).json(formattedUsers);

    } catch (error) {
        console.error("Lỗi khi lấy danh sách lời mời:", error);
        return res.status(404).json({ error: 'Lấy danh sách lời mời Thất bại!.' });
    }
}

async function getNonFriends(req, res) {
    try {
        const userId = BigInt(req.user.user_id);

        const users = await prisma.users.findMany({
            take: 20, // Chỉ lấy 20 người để gợi ý (tránh load cả database)
            where: {
                AND: [
                    {
                        user_id: { not: userId } // Không lấy chính mình
                    },
                    {
                        role_id: { not: 0 } // Không lấy Admin (nếu role 0 là admin)
                    },
                    {
                        // 1. Kiểm tra các quan hệ mà User này là người thứ 1 (user_one)
                        friendships_friendships_user_one_idTousers: {
                            none: {
                                user_two_id: userId // Không được chứa mình ở vị trí user_two
                            }
                        }
                    },
                    {
                        // 2. Kiểm tra các quan hệ mà User này là người thứ 2 (user_two)
                        friendships_friendships_user_two_idTousers: {
                            none: {
                                user_one_id: userId // Không được chứa mình ở vị trí user_one
                            }
                        }
                    }
                ]
            },
            select: {
                user_id: true,
                username: true,
                email: true,
                avatar_url: true,
                display_name: true,
                bio: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        const formattedUsers = users.map(user => ({
            user_id: BigInt(user.user_id),
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url,
            display_name: user.display_name,
            bio: user.bio || ""
        }));

        return res.status(200).json(formattedUsers);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nonFiends:", error);
        return res.status(404).json({ error: 'Lấy danh sách nonFiends Thất bại!.' });
    }
}

async function sendFriendRequest(req, res) {
    try {
        const senderId = BigInt(req.user.user_id);
        const targetUserId = BigInt(req.body.target_user_id); 

        if (senderId === targetUserId) {
            return res.status(400).json({ 
                success: false, 
                message: "Không thể gửi lời mời kết bạn cho chính mình" 
            });
        }

        const userOneId = senderId < targetUserId ? senderId : targetUserId;
        const userTwoId = senderId > targetUserId ? senderId : targetUserId;

        const existingFriendship = await prisma.friendships.findUnique({
            where: {
                user_one_id_user_two_id: {
                    user_one_id: userOneId,
                    user_two_id: userTwoId
                }
            }
        });

        if (existingFriendship) {
            // Nếu đã tồn tại, kiểm tra trạng thái để báo lỗi cụ thể
            if (existingFriendship.status === 'pending') {
                return res.status(400).json({ success: false, message: "Lời mời đã được gửi trước đó" });
            }
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({ success: false, message: "Hai người đã là bạn bè" });
            }
            if (existingFriendship.status === 'blocked') {
                return res.status(400).json({ success: false, message: "Không thể gửi lời mời (Blocked)" });
            }
        }

        // 4. Tạo record mới trong bảng friendships
        const newFriendship = await prisma.friendships.create({
            data: {
                user_one_id: userOneId,
                user_two_id: userTwoId,
                action_user_id: senderId, 
                status: 'pending' 
            }
        });

        return res.status(200).json({
            success: true,
            message: "Đã gửi lời mời kết bạn thành công",
        });
    } catch (error) {
        console.error("Kết bạn thất bại:", error);
        return res.status(404).json({ error: 'Kết bạn Thất bại!.' });
    }
}

async function cancelFriendRequest(req, res) {
    try {
        const senderId = BigInt(req.user.user_id);
        const targetUserId = BigInt(req.body.target_user_id);

        const userOneId = senderId < targetUserId ? senderId : targetUserId;
        const userTwoId = senderId > targetUserId ? senderId : targetUserId;

        const friendship = await prisma.friendships.findUnique({
            where: {
                user_one_id_user_two_id: {
                    user_one_id: userOneId,
                    user_two_id: userTwoId
                }
            }
        });

        if (!friendship) {
            return res.status(404).json({ success: false, message: "Không tìm thấy lời mời kết bạn nào" });
        }

        if (friendship.status !== 'pending') {
            return res.status(400).json({ success: false, message: "Không thể hủy vì trạng thái không phải đang chờ" });
        }

        await prisma.friendships.delete({
            where: {
                user_one_id_user_two_id: {
                    user_one_id: userOneId,
                    user_two_id: userTwoId
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Đã hủy lời mời kết bạn thành công"
        });
    } catch (error) {
        console.error("Hủy kết bạn thất bại:", error);
        return res.status(404).json({ error: 'Hủy kết bạn Thất bại!.' });
    }
}

async function acceptFriendRequest(req, res) {
    try {
        const currentUserId = BigInt(req.user.user_id);
        const senderId = BigInt(req.body.target_user_id);

        const userOneId = currentUserId < senderId ? currentUserId : senderId;
        const userTwoId = currentUserId > senderId ? currentUserId : senderId;

        const friendship = await prisma.friendships.findUnique({
            where: {
                user_one_id_user_two_id: {
                    user_one_id: userOneId,
                    user_two_id: userTwoId
                }
            }
        });

        if (!friendship) {
            return res.status(404).json({ success: false, message: "Không tìm thấy lời mời kết bạn này" });
        }

        if (friendship.status === 'accepted') {
            return res.status(400).json({ success: false, message: "Hai bạn đã là bạn bè rồi" });
        }

        if (friendship.status !== 'pending') {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        if (friendship.action_user_id === currentUserId) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không thể tự chấp nhận lời mời do chính mình gửi đi" 
            });
        }

        await prisma.friendships.update({
            where: {
                user_one_id_user_two_id: {
                    user_one_id: userOneId,
                    user_two_id: userTwoId
                }
            },
            data: {
                status: 'accepted',
                action_user_id: currentUserId,
                updated_at: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Đã chấp nhận lời mời kết bạn. Hai bạn giờ đã là bạn bè!"
        });

    } catch (error) {
        console.error("Lỗi chấp nhận kết bạn:", error);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
}

module.exports = {
    getUser,
    getFriends,
    getReceivedFriendRequests,
    getNonFriends,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest
}

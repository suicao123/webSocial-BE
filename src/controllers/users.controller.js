const { PrismaClient } = require('../generated/prisma');
const { calculateGrowth } = require('../services/auth.service');
const prisma = new PrismaClient();

async function getUser(req, res) {
    try {
        const userId = req.query.user_id;

        const user = await prisma.users.findUnique({
            where: {
                user_id: BigInt(userId)
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

// async function getUsersList(req, res) {
//     try {
//         const users = await prisma.users.findMany({
//             where: {
//                 role_id: 1
//             },
//             select: {
//                 user_id: true,
//                 display_name: true,
//                 email: true,
//                 avatar_url: true,
//                 created_at: true,
//                 _count: {
//                     select: {
//                         posts_posts_user_idTousers: true, 

//                         friendships_friendships_user_one_idTousers: {
//                             where: { status: 'accepted' }
//                         },
//                         friendships_friendships_user_two_idTousers: {
//                             where: { status: 'accepted' }
//                         }
//                     }
//                 }
//             },
//             orderBy: {
//                 created_at: 'desc'
//             }
//         });

//         const formattedUsers = users.map(user => {
//             const totalFriends = 
//                 user._count.friendships_friendships_user_one_idTousers + 
//                 user._count.friendships_friendships_user_two_idTousers;

//             return {
//                 user_id: user.user_id,
//                 display_name: user.display_name,
//                 email: user.email,
//                 avatar_url: user.avatar_url,
//                 created_at: user.created_at,
//                 post_count: user._count.posts_posts_user_idTousers,
//                 friend_count: totalFriends
//             };
//         });

//         return res.status(200).json(formattedUsers);
//     } catch (error) {
        
//     }
// }

async function getUsersList(req, res) {
    try {
        const { search } = req.query;

        const whereCondition = {
            role_id: 1
        };

        if (search) {
            whereCondition.OR = [
                { 
                    display_name: { 
                        contains: search, 
                        mode: 'insensitive' // Tìm kiếm không phân biệt hoa thường
                    } 
                },
                { 
                    email: { 
                        contains: search, 
                        mode: 'insensitive' 
                    } 
                }
            ];
        }

        const users = await prisma.users.findMany({
            where: whereCondition,
            select: {
                user_id: true,
                display_name: true,
                email: true,
                avatar_url: true,
                created_at: true,
                _count: {
                    select: {
                        posts_posts_user_idTousers: true, 
                        friendships_friendships_user_one_idTousers: {
                            where: { status: 'accepted' }
                        },
                        friendships_friendships_user_two_idTousers: {
                            where: { status: 'accepted' }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // 5. Format dữ liệu trả về (giữ nguyên logic cũ)
        const formattedUsers = users.map(user => {
            const totalFriends = 
                user._count.friendships_friendships_user_one_idTousers + 
                user._count.friendships_friendships_user_two_idTousers;

            return {
                // Lưu ý: user_id là BigInt, nên convert sang string để tránh lỗi JSON
                user_id: user.user_id.toString(), 
                display_name: user.display_name,
                email: user.email,
                avatar_url: user.avatar_url,
                created_at: user.created_at,
                post_count: user._count.posts_posts_user_idTousers,
                friend_count: totalFriends
            };
        });

        return res.status(200).json(formattedUsers);

    } catch (error) {
        console.error("Lỗi lấy danh sách user:", error);
        return res.status(500).json({ message: "Lỗi Server" });
    }
}

async function getAdminsList(req, res) {
    try {
        const { search } = req.query;

        const whereCondition = {
            role_id: 0
        };

        if (search) {
            whereCondition.OR = [
                { 
                    display_name: { 
                        contains: search, 
                        mode: 'insensitive' // Tìm kiếm không phân biệt hoa thường
                    } 
                },
                { 
                    email: { 
                        contains: search, 
                        mode: 'insensitive' 
                    } 
                }
            ];
        }

        const users = await prisma.users.findMany({
            where: whereCondition,
            select: {
                user_id: true,
                display_name: true,
                email: true,
                avatar_url: true,
                created_at: true,
                _count: {
                    select: {
                        posts_posts_user_idTousers: true, 

                        friendships_friendships_user_one_idTousers: {
                            where: { status: 'accepted' }
                        },
                        friendships_friendships_user_two_idTousers: {
                            where: { status: 'accepted' }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        const formattedUsers = users.map(user => {
            const totalFriends = 
                user._count.friendships_friendships_user_one_idTousers + 
                user._count.friendships_friendships_user_two_idTousers;

            return {
                user_id: user.user_id,
                display_name: user.display_name,
                email: user.email,
                avatar_url: user.avatar_url,
                created_at: user.created_at,
                post_count: user._count.posts_posts_user_idTousers,
                friend_count: totalFriends
            };
        });

        return res.status(200).json(formattedUsers);
    } catch (error) {
        
    }
}

async function getFriends(req, res) {
    try {
        
        const user_id = req.params.id;
        const search = req.query.search;

        let whereCondition = {
            status: 'accepted',
        };

        if (search) {
            // TRƯỜNG HỢP CÓ TỪ KHÓA TÌM KIẾM
            // Logic: (Tôi là User 1 VÀ tên User 2 chứa từ khóa) HOẶC (Tôi là User 2 VÀ tên User 1 chứa từ khóa)
            whereCondition.OR = [
                {
                    user_one_id: user_id,
                    users_friendships_user_two_idTousers: {
                        display_name: {
                            contains: search,
                            mode: 'insensitive' // Tìm kiếm không phân biệt hoa thường
                        }
                    }
                },
                {
                    user_two_id: user_id,
                    users_friendships_user_one_idTousers: {
                        display_name: {
                            contains: search,
                            mode: 'insensitive' // Tìm kiếm không phân biệt hoa thường
                        }
                    }
                }
            ];
        } else {
            whereCondition.OR = [
                { user_one_id: user_id },
                { user_two_id: user_id }
            ];
        }

        const datas = await prisma.friendships.findMany({
            where: whereCondition,
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

async function getDashboardStats(req, res) {
    try {
        // --- 1. Thống kê Bài viết (Posts) ---
        const postsStats = await calculateGrowth(prisma.posts);

        // --- 2. Thống kê Người dùng (Users - Role = 1) ---
        const usersStats = await calculateGrowth(prisma.users, { role_id: 1 });

        // --- 3. Thống kê Admin (Role = 0) - Chỉ cần tổng số ---
        const totalAdmins = await prisma.users.count({
            where: { role_id: 0 }
        });

        return res.status(200).json({
            posts: {
                total: postsStats.total,
                increase: postsStats.growth_percentage
            },
            users: {
                total: usersStats.total,
                increase: usersStats.growth_percentage
            },
            admins: {
                total: totalAdmins
            }
        });

    } catch (error) {
        console.error("Lỗi lấy thống kê:", error);
        return res.status(500).json({ message: "Lỗi Server" });
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

async function uploadAvatarProfile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
        }

        // const uploadResults = req.files.map(file => ({
        //     url: file.path,
        //     public_id: file.filename
        // }));

        const uploadResults = {
            url: req.file.path,
            public_id: req.file.filename
        };

        res.status(200).json({
            message: 'Tải ảnh lên thành công',
            data: uploadResults,
        });
    }
    catch (error) {
        console.error("Lỗi khi create:", error);
        return res.status(404).json({ error: 'upload Thất bại!.' });
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

async function getFriendshipStatus(req, res) {
    try {
        const currentUserId = BigInt(req.user.user_id);
        const targetUserId = BigInt(req.params.user_id);

        const userOneId = currentUserId < targetUserId ? currentUserId : targetUserId;
        const userTwoId = currentUserId > targetUserId ? currentUserId : targetUserId;

        if(currentUserId == targetUserId) {
            return res.status(200).json('SELF');
        }

        const friendship = await prisma.friendships.findUnique({
            where: {
                user_one_id_user_two_id: {
                    user_one_id: userOneId,
                    user_two_id: userTwoId
                }
            }
        });

        let status = 'NOT_FRIEND';

        if(friendship) {
            if(friendship.status == "accepted") {
                status = "accepted";
            }
            else if (friendship.status === 'pending') {
                if (friendship.action_user_id === currentUserId) {
                    status = 'REQUEST_SENT';
                } else {
                    status = 'REQUEST_RECEIVED';
                }
            }
        }

        return res.status(200).json(status);

    } catch (error) {
        console.error("Lỗi lấy trạng thái bạn bè:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi kiểm tra trạng thái bạn bè" 
        });
    }
}

async function unfriend(req, res) {
    try {
        const currentUserId = BigInt(req.user.user_id);
        const targetUserId = BigInt(req.params.user_id);

        const userOneId = currentUserId < targetUserId ? currentUserId : targetUserId;
        const userTwoId = currentUserId > targetUserId ? currentUserId : targetUserId;

        await prisma.friendships.delete({
            where: {
                user_one_id_user_two_id: {
                    user_one_id: userOneId,
                    user_two_id:userTwoId
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Đã hủy kết bạn thành công",
        });
    } catch (error) {
        console.error("Lỗi hủy kết bạn:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi hủy kết bạn" 
        });
    }
}

async function deleteUser(req, res) {
    try {
        const user_id = req.params.id;

        const existsUser = await prisma.users.findUnique({
            where: {
                user_id: user_id
            }
        });

        if (!existsUser) {
            return res.status(404).json({ message: "Người dùng không tồn tại." });
        }

        await prisma.users.delete({
            where: {
                user_id: BigInt(user_id)
            }
        });

        return res.status(200).json({
            message: "Xóa người dùng thành công."
        });
    } catch (error) {
        console.error("Lỗi xóa user:", error);
        
        // Bắt lỗi P2025 (Record to delete does not exist) của Prisma
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Người dùng không tồn tại." });
        }

        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}

async function updateProfile(req, res) {
    try {
        const currentUserId = req.body.user_id;

        const {display_name, email, bio, avatar_url} = req.body;

        const updateRes = await prisma.users.update({
            where: {
                user_id: currentUserId
            },
            data: {
                display_name: display_name,
                email: email,
                bio: bio,
                avatar_url: avatar_url
            },
            select: {
                user_id: true,
                display_name: true,
                email: true,
                avatar_url: true
            }   
        });

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin thành công!",
            data: updateRes
        });

    } catch (error) {
        console.error("Lỗi sửa trang chủ:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi sửa trang chủ" 
        });
    }
}

module.exports = {
    getUser,
    getFriends,
    getReceivedFriendRequests,
    getNonFriends,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    getFriendshipStatus,
    unfriend,
    uploadAvatarProfile,
    updateProfile,
    getUsersList,
    deleteUser,
    getAdminsList,
    // getUsersListByName
    getDashboardStats
}

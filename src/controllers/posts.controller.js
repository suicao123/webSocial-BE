const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getPost(req, res) {
    try {
        const post = await prisma.posts.findMany({
            include: {
                // "users" là tên quan hệ mà Prisma tự tạo ra
                // trỏ từ model "posts" sang model "users"
                users_posts_user_idTousers: {
                    select: { // Chỉ lấy thông tin an toàn
                        user_id: true,
                        display_name: true,
                        avatar_url: true,
                        username: true
                    }
                },
                // Tên quan hệ đúng cho "admin duyệt" (nếu bạn cần)
                // users_posts_admin_idTousers: true, 
                    
                // Lấy cả comments và likes
                _count: {
                    select: {
                        comments: true,   // Sẽ trả về: "comments": (số lượng)
                        post_likes: true  // Sẽ trả về: "post_likes": (số lượng)
                    }
                }
            }
        });
        res.status(200).json(post);
    }
    catch (error) {
        console.error("Lỗi khi getPost:", error);
        res.status(500).json({ error: "Đã xảy ra lỗi máy chủ" });
    }
}

async function createPost(req, res) {
    try {

        const {userId, content, imageUrl} = req.body;

        if(!userId) {
            res.status(400).json({Message:'Không thấy tác giả!!!!'});
        }

        const newPost = await prisma.posts.create({
            data: {
                content: content,
                image_url: imageUrl,
                users_posts_user_idTousers: {
                    connect: {
                        // Kết nối bằng ID (primary key) của bảng 'users'
                        // Giả sử primary key của bảng users là 'user_id'
                        user_id: BigInt(userId) 
                    }
                }
            }
        });

        res.status(201).json(newPost);
    }catch (error) {
        console.error("Lỗi khi create:", error);

        if (error.code === 'P2003' || error.code === 'P2025') { 
        // P2003: Foreign key constraint failed
        // P2025: Record to connect to not found
        return res.status(404).json({ error: 'User ID không tồn tại.' });
        }
        
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
        }
}

module.exports = {
    getPost,
    createPost
}

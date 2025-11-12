const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getPost(req, res) {
    const currentid = req.user?.user_id;
    try {
        const posts = await prisma.posts.findMany({
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
                },

                post_likes: {
                    where: {
                        user_id: currentid
                    },
                    select: {
                        user_id: true
                    }
                }
            },
                
            orderBy: {
                created_at: 'desc' // Sắp xếp theo cột 'created_at' theo thứ tự giảm dần
            }
        });

        const data = posts.map(post => {
            const {post_likes, ...restPost} = post;
            return {
                ...restPost,
                isLike: post_likes.length > 0
            }
        });

        res.status(200).json(data);
    }
    catch (error) {
        console.error("Lỗi khi getPost:", error);
        res.status(500).json({ error: "Đã xảy ra lỗi máy chủ" });
    }
}

async function createPost(req, res) {
    try {

        const {user_id, content, image_url} = req.body;

        if(!user_id) {
            res.status(400).json({Message:'Không thấy tác giả!!!!'});
        }

        const newPost = await prisma.posts.create({
            data: {
                content: content,
                image_url: image_url,
                users_posts_user_idTousers: {
                    connect: {
                        // Kết nối bằng ID (primary key) của bảng 'users'
                        // Giả sử primary key của bảng users là 'user_id'
                        user_id: BigInt(user_id) 
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

async function deletePost(req, res) {
    try {

        const postId = BigInt(req.params.id);

        const postDeleted = await prisma.posts.delete({
            where: {
                post_id: postId
            }
        });

        res.status(201).json({message: "Xóa thành công!!!", postDeleted: postDeleted});


    } catch (error) {
        console.error("Lỗi khi create:", error);
        return res.status(404).json({ error: 'Post ID không tồn tại.' });
    }
}

async function uploadImage(req, res) {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
        }

        const uploadResults = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

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

async function getComment(req, res) {
    const data = req.query;

    try {
        const comments = await prisma.comments.findMany({
            where: {
                post_id: data.post_id
            },
            orderBy: {
                created_at: 'desc'
            },
            select: {
                post_id: true,
                content: true,

                users: {
                    select: {
                        display_name: true,
                        avatar_url: true
                    }
                }
            }
        });

        return res.status(200).json(comments);
    }
    catch (error) {
        console.error("Lỗi khi lấy comment:", error);
        return res.status(404).json({ error: 'Lấy comment Thất bại!.' });
    }
}

async function createComment(req, res) {
    try {
        const data = req.body;

        const dataComment = await prisma.comments.create({
            data: {
                content: data.content,

                posts: {
                    connect: {
                        post_id: BigInt(data.post_id)
                    }
                },

                users: {
                    connect: {
                        user_id: BigInt(data.user_id)
                    }
                }
            }
        });

        res.status(200).json(dataComment);

    } catch (error) {
        console.error("Lỗi khi lấy comment:", error);
        return res.status(404).json({ error: 'Tạo comment Thất bại!.' });
    }
}

async function createLike(req, res) {
    try {

        const userIdString = req.user?.user_id;
        const { id } = req.params;
        
        const user_id = BigInt(userIdString);
        const post_id = BigInt(id);
        

        const checkLike = await prisma.post_likes.findUnique({
            where: {
                user_id_post_id: {
                    user_id: user_id,
                    post_id: post_id
                }
            }
        });

        if(checkLike) {
            await prisma.post_likes.delete({
                where: {
                    user_id_post_id: {
                        user_id: user_id,
                        post_id: post_id
                    }
                }
            });
            res.status(200).json('Bỏ thích');
        }
        else {
            await prisma.post_likes.create({
                data: {
                    user_id: user_id,
                    post_id: post_id
                }
            });
            res.status(201).json('Đã thích');
        }

    } catch (error) {
        console.error("Lỗi khi lấy comment:", error);
        return res.status(404).json({ error: 'Like Thất bại!.' });
    }
}

module.exports = {
    getPost,
    createPost,
    deletePost,
    uploadImage,
    getComment,
    createComment,
    createLike
}

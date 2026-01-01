const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getOrCreateConversation(req, res) {
    try {
        const currentUserId = BigInt(req.user.user_id);
        const partnerId = BigInt(req.body.partner_id);

        // 1. Validate cơ bản
        if (!partnerId) {
            return res.status(400).json({ success: false, message: "Thiếu ID người nhận" });
        }
        if (currentUserId === partnerId) {
            return res.status(400).json({ success: false, message: "Không thể tạo cuộc trò chuyện với chính mình" });
        }

        // 2. Tìm xem đã có cuộc trò chuyện nào giữa 2 người chưa
        // Logic: Tìm conversation mà trong danh sách participants có chứa CẢ user A và user B
        let conversation = await prisma.conversations.findFirst({
            where: {
                AND: [
                    {
                        participants: {
                            some: { user_id: currentUserId }
                        }
                    },
                    {
                        participants: {
                            some: { user_id: partnerId }
                        }
                    }
                ]
            },
            include: {
                participants: {
                    include: {
                        users: true
                    }
                }
            }
        });

        // 3. Nếu CHƯA CÓ -> Tạo mới
        if (!conversation) {
            conversation = await prisma.conversations.create({
                data: {
                    // Tạo conversation rỗng, đồng thời tạo luôn 2 dòng trong bảng participants
                    participants: {
                        create: [
                            { user_id: currentUserId },
                            { user_id: partnerId }
                        ]
                    }
                },
                include: {
                    participants: {
                        include: {
                            users: true
                        }
                    }
                }
            });
        }

        const partnerParticipant = conversation.participants.find(p => p.user_id !== currentUserId);
        const partnerUserRaw = partnerParticipant ? partnerParticipant.users : null;

        let formattedPartner = null;
        if (partnerUserRaw) {
            formattedPartner = {
                user_id: BigInt(partnerUserRaw.user_id),
                avatar_url: partnerUserRaw.avatar_url,
                display_name: partnerUserRaw.display_name,
            };
        }

        return res.status(200).json({
            data: {
                conversation_id: conversation.conversation_id,
                formattedPartner: formattedPartner
            }
        });

    } catch (error) {
        console.error("Lỗi tạo cuộc trò chuyện:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi khởi tạo cuộc trò chuyện" 
        });
    }
}

async function getMessages(req, res) {
    try {
        const currentUserId = BigInt(req.user.user_id);
        const conversationId = BigInt(req.params.id);

        // 1. Kiểm tra quyền (Bắt buộc phải có để bảo mật)
        const isParticipant = await prisma.participants.findUnique({
            where: {
                user_id_conversation_id: {
                    user_id: currentUserId,
                    conversation_id: conversationId
                }
            }
        });

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: "Không có quyền xem" });
        }

        // 2. Lấy TOÀN BỘ tin nhắn
        const messages = await prisma.messages.findMany({
            where: {
                conversation_id: conversationId
            },
            orderBy: {
                message_id: 'desc'
            },
            include: {
                users: {
                    select: {
                        user_id: true,
                        username: true,
                        avatar_url: true,
                        display_name: true
                    }
                }
            }
        });

        // 3. Format dữ liệu trả về
        const formattedMessages = messages.map(msg => ({
            message_id: msg.message_id.toString(),
            content: msg.content,
            created_at: msg.created_at,
            sender_id: Number(msg.sender_id),
            sender: msg.users ? {
                user_id: Number(msg.users.user_id),
                avatar_url: msg.users.avatar_url,
                display_name: msg.users.display_name
            } : null
        }));

        return res.status(200).json(formattedMessages);

    } catch (error) {
        console.error("Lỗi lấy tin nhắn:", error);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
}

async function sendMessage(req, res) {
    try {
        const currentUserId = BigInt(req.user.user_id);
        const { conversation_id, content } = req.body;
        const conversationIdBigInt = BigInt(conversation_id);

        // 1. Validate
        if (!conversation_id || !content) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin" });
        }

        // 2. Kiểm tra xem user có trong cuộc trò chuyện này không (Bảo mật)
        const isParticipant = await prisma.participants.findUnique({
            where: {
                user_id_conversation_id: {
                    user_id: currentUserId,
                    conversation_id: conversationIdBigInt
                }
            }
        });

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền gửi tin nhắn vào đây" });
        }

        // 3. Thực hiện Transaction: Lưu tin nhắn + Update thời gian cuộc trò chuyện
        const [newMessage] = await prisma.$transaction([
            // Tạo tin nhắn
            prisma.messages.create({
                data: {
                    conversation_id: conversationIdBigInt,
                    sender_id: currentUserId,
                    content: content
                },
                include: {
                    users: { // Lấy thông tin người gửi để trả về cho Socket
                        select: {
                            user_id: true,
                            username: true,
                            avatar_url: true,
                            display_name: true
                        }
                    }
                }
            }),
            // Cập nhật updated_at của conversation để nó nhảy lên đầu list chat
            prisma.conversations.update({
                where: { conversation_id: conversationIdBigInt },
                data: { updated_at: new Date() }
            })
        ]);

        // 4. Format dữ liệu chuẩn (Khớp với format của getMessages)
        const formattedMessage = {
            message_id: newMessage.message_id.toString(),
            conversation_id: newMessage.conversation_id.toString(),
            content: newMessage.content,
            created_at: newMessage.created_at,
            sender_id: Number(newMessage.sender_id),
            sender: newMessage.users ? {
                user_id: Number(newMessage.users.user_id),
                avatar_url: newMessage.users.avatar_url,
                display_name: newMessage.users.display_name
            } : null
        };

        // 5. --- SOCKET.IO REALTIME ---
        // Lấy instance io từ app
        if (req.io) {
            const roomId = conversation_id.toString(); // Chuyển ID phòng thành chuỗi
            req.io.to(roomId).emit('receive_message', formattedMessage);
        }

        // 6. Trả về cho người gửi (để họ biết là gửi thành công)
        return res.status(200).json(formattedMessage);  

    } catch (error) {
        console.error("Lỗi gửi tin nhắn:", error);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
}

async function deleteMessage(req, res) {
    try {
        const currentUserId = BigInt(req.user.user_id);
        const { id } = req.params; // Lấy messageId từ URL params

        if (!id) {
            return res.status(400).json({ success: false, message: "Thiếu ID tin nhắn" });
        }

        const messageIdBigInt = BigInt(id);

        // 1. Tìm tin nhắn để kiểm tra quyền sở hữu và lấy conversation_id
        const message = await prisma.messages.findUnique({
            where: { message_id: messageIdBigInt },
            select: {
                message_id: true,
                sender_id: true,
                conversation_id: true
            }
        });

        if (!message) {
            return res.status(404).json({ success: false, message: "Tin nhắn không tồn tại" });
        }

        // 2. Kiểm tra quyền (Chỉ người gửi mới được xóa)
        if (message.sender_id !== currentUserId) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xóa tin nhắn này" });
        }

        // 3. Xóa tin nhắn
        await prisma.messages.delete({
            where: { message_id: messageIdBigInt }
        });

        // 4. --- SOCKET.IO REALTIME ---
        if (req.io) {
            const roomId = message.conversation_id.toString();
            const deletedMessageId = message.message_id.toString();

            // Gửi sự kiện cho tất cả mọi người trong phòng chat (bao gồm cả người xóa)
            req.io.to(roomId).emit('message_deleted', deletedMessageId);
        }

        // 5. Trả về thành công
        return res.status(200).json({ 
            success: true, 
            message: "Xóa tin nhắn thành công",
            message_id: message.message_id.toString()
        });

    } catch (error) {
        console.error("Lỗi xóa tin nhắn:", error);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
}

module.exports = {
    getOrCreateConversation,
    getMessages,
    sendMessage,
    deleteMessage
}
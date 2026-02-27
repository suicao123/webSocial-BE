BigInt.prototype.toJSON = function () {
    return this.toString();
};

const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const port = 8080;
require('dotenv').config();

//import routes
const routes = require('./src/routes');
const { Server } = require('socket.io');
const socketMiddleware = require('./src/middleware/socket.middleware');
const { log } = require('console');

app.use(cors());
app.use(express.json());

// 3. Tạo HTTP Server từ Express app
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", //URL
        methods: ["GET", "POST"]
    }
});

// hiện trạng thái online
let onlineUsers = []; 

const addNewUser = (userId, socketId) => {
    // Chỉ thêm nếu chưa tồn tại (chuyển về string để so sánh an toàn)
    if (!onlineUsers.some((user) => user.userId === userId.toString())) {
        onlineUsers.push({ userId: userId.toString(), socketId });
    }
};

const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

// Lắng nghe các sự kiện kết nối Socket
io.on("connection", (socket) => {
    // Logic xử lý khi Client kết nối và tham gia phòng (room)
    socket.on("join_post", (postId) => {
        if (postId) {
            // Cho phép socket tham gia phòng có tên là postId
            socket.join(postId);
            console.log(`Socket ${socket.id} joined room post_${postId}`);
        }
    });

    // Login chat
    socket.on("join_room", (conversationId) => {
        if (conversationId) {
            socket.join(conversationId.toString()); 
            console.log(`Socket ${socket.id} đã vào phòng chat: ${conversationId}`);
        }
    });

    //add online
    socket.on("addNewUser", (userId) => {
        if(userId) {
            addNewUser(userId, socket.id);
            // Gửi danh sách mới nhất cho TẤT CẢ client
            io.emit("getOnlineUsers", onlineUsers);
            console.log("Online Users:", onlineUsers);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
        // offline
        removeUser(socket.id);
        io.emit("getOnlineUsers", onlineUsers);
    });
});

// SỬ DỤNG MIDDLEWARE ĐỂ GẮN 'io' VÀO MỌI REQUEST
// Ta gọi hàm socketMiddleware(io) và truyền instance io vào
app.use(socketMiddleware(io));

app.use('/api/v1', routes);

app.get('/', (req, res) => {
    res.send('Haha!')
})

// app.use((err, req, res, next) => {
//     // Dòng này sẽ LUÔN LUÔN log ra lỗi chi tiết trong terminal của bạn
//     console.error("⛔️ ĐÃ XẢY RA LỖI SERVER:", err); 

//     // Xử lý lỗi từ Multer (ví dụ: file quá lớn, v.v.)
//     if (err.name === 'MulterError') {
//        return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
//     }

//     // Xử lý các lỗi khác (ví dụ: lỗi xác thực Cloudinary)
//     // Lỗi sai API key thường sẽ có message
//     return res.status(err.http_code || 500).json({ 
//       error: "Upload Thất bại do lỗi server.", 
//       message: err.message // Gửi cả message của lỗi về client
//     });
// });

// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
// })

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Socket.io is ready for connections`);
});


const socketMiddleware = (io) => {
    return (req, res, next) => {
        // Gán biến io vào req
        req.io = io;
        next();
    };
};

module.exports = socketMiddleware;
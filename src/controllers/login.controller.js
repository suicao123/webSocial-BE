
function authLogin(req, res) {
    const {username, password} = req.body;

    console.log(username, password);

    if(username === "admin" && password === "123456") {
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!!!"
        });
    }
    else {
        res.status(401).json({
            success: false,
            message: "Đăng nhập thất bại!!!"
        });
    }
}

module.exports = {
    authLogin
}
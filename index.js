BigInt.prototype.toJSON = function() {
  return this.toString();
};

const express = require('express')
const cors = require('cors')
const app = express()
const port = 8080
app.use(express.json());
require('dotenv').config();

//import routes
const routes = require('./src/routes');

app.use(cors())

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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const express = require('express')
var cors = require('cors')
const app = express()
const port = 8080
app.use(express.json());

//import routes
const routes = require('./src/routes');

app.use(cors())

routes(app);

app.get('/', (req, res) => {
    res.send('Haha!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

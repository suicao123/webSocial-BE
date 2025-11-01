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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

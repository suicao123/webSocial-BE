const loginRoute = require('./login.route');

function route(app) {

    app.use('/api/v1', loginRoute);

}

module.exports = route;

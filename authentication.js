const { checktoken } = require('./token');

var authenticationMiddleware = (req, res, next) => {
    var { Authentication } = req.headers;
    var token = Authentication.split(" ")[1];
    checktoken(token)
    .then(payload => {
        res.locals.payload = payload;
        next();
    })
    .catch(err => {
        res.status(err.code).json({err: err.err});
    });
}

module.exports = authenticationMiddleware;
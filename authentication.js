const { checktoken } = require('./token');

var authenticationMiddleware = (req, res, next) => {
    var Authorization = req.header('Authorization');
    if(!Authorization) {
	    res.status(401).json({err: "Unauthorized"});
    }
    var token = Authorization.split(" ")[1];
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

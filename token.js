const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync(process.env.PRIVKEYPATH);
const publicKey = fs.readFileSync(process.env.PUBKEYPATH);

var gentoken = userRow => new Promise((resolve, reject) => {
    var { username, password, ID } = userRow;
    jwt.sign({ username, password, ID }, privateKey, { algorithm: 'RS256' }, (err, token) => {
        if(err) {
            reject({code: 500, err});
        }
        resolve(token);
    })
});

var checktoken = token => new Promise((resolve, reject) => {
    jwt.verify(token, publicKey, { algorithm: 'RS256' }, (err, payload) => {
        if(err || !payload) {
            reject({code: 401, err: "Invalid token"});
        } else {
            resolve(payload);
        }
    });
});

module.exports = { gentoken, checktoken };
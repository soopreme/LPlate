const express = require('express');
const mysql = require('mysql');
const sanitize = require('sanitize')();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

var app = express();
var connection = mysql.createConnection({
    host: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB
});

const saltRounds = 10;
const privateKey = fs.readFileSync(process.env.PRIVKEYPATH);
const publicKey = fs.readFileSync(process.env.PUBKEYPATH);

connection.connect();

var query = query => new Promise((resolve, reject) => {
    connection.query(query, (error, results, fields) => {
        if(error) {
            reject(error);
        }
        
        if(!results) {
            return null;
        } else if(results.length == 1) {
            resolve(results[0]);
        } else {
            resolve(results);
        }
    });
});

var genhash = string => new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if(err) {
            reject({code: 500, err});
        }
        bcrypt.hash(string, salt, (err, hash) => {
            if(err) {
                reject({code: 500, err});
            }
            resolve(hash);
        })
    })
});

var checkhash = (string, hash) => new Promise((resolve, reject) => {
    bcrypt.compare(string, hash, (err, result) => {
        if(err) {
            reject({code: 500, err});
        }
        if(result) {
            resolve(result);
        } else {
            reject({code: 400});
        }
    })
});

var gentoken = userRow => new Promise((resolve, reject) => {
    var { username, password, ID } = userRow;
    jwt.sign({ username, password, ID }, privateKey, { algorithm: 'RS256' }, (err, token) => {
        if(err) {
            reject({code: 500, err});
        }
        resolve(token);
    })
});

app.post('/register', (req, res) => {
    var { email, username, password } = req.body;
    var emailSanitized = sanitize.value(email, 'string');
    var usernameSanitized = sanitize.value(username, 'string');
    

    query(`SELECT * FROM 'users' WHERE username='${usernameSanitized}'`)
    .then(result => {
        if(result) {
            reject({code: 409, err:"Username is already in use"});
        }
        return query(`SELECT * FROM 'users' WHERE email='${emailSanitized}'`);
    })
    .then(result => {
        if(result) {
            reject({code: 409, err:"Email is already in use"});
        }
        return genhash(password);
    })
    .then(passwordHashed => {
        return query(`INSERT INTO 'users' (email, username, password) VALUES ('${emailSanitized}', '${usernameSanitized}', '${passwordHashed}')`);
    })
    .then(result => {
        return gentoken(result);
    })
    .then(token => {
        return res.status(200).json({token});
    })
    .catch(err => {
        return res.status(err.code).json({err: err.err});
    });
});

app.post('/login', (req, res) => {
    var {username, password} = req.body;
    var usernameSanitized = sanitize.value(username, 'string');
    var userObject;

    query(`SELECT * FROM 'users' WHERE username='${usernameSanitized}'`)
    .then(result => {
        if(!result) {
            reject({code: 401, err: "User not found"});
        }
        userObject = result;
        return checkhash(password, result.password);
    })
    .then(result => {
        return gentoken(result);
    })
    .then(token => {
        return res.status(200).json({token});
    })
    .catch(err => {
        return res.status(err.code).json({err: err.err});
    });
});


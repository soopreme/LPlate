const express = require('express');
const mysql = require('mysql');
const sanitize = require('sanitize')();
const bcrypt = require('bcrypt');

var app = express();
var connection = mysql.createConnection({
    host: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB
});

const saltRounds = 10;

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

var hash = string => new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if(err) {
            reject({code: 500, err});
        }
        bcrypt.hash(string, salt, (err, hsh) => {
            if(err) {
                reject({code: 500, err});
            }
            resolve(hsh);
        })
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
        return hash(password);
    })
    .then(passwordHashed => {
        return query(`INSERT INTO 'users' (email, username, password) VALUES ('${emailSanitized}', '${usernameSanitized}', '${passwordHashed}')`);
    })
    .then(() => {
        return res.status(200).json({msg: "Success"});
    })
    .catch(err => {
        res.status(err.code).json({err: err.err});
    });
});


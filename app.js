const express = require('express');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const { connect, query } = require('./db');
const authentication = require('./authentication');
const { gentoken } = require('./token');
const list = require('./list');

var app = express();

const saltRounds = 10;

connect();

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
            reject({code: 400, err: "result does not exist"});
        }
    })
});

app.use(express.json());

app.post('/register', [
	check('username').isLength({min: 3, max: 255}).trim().escape(),
	check('email').isEmail().normalizeEmail()
], (req, res) => {
    var { email, username, password } = req.body;
    console.log(email);
    console.log(username);
    console.log(password);
    query(`SELECT * FROM users WHERE username='${username}';`)
    .then(result => {
        if(result.length > 0) {
            reject({code: 409, err:"Username is already in use"});
        } else {
            return query(`SELECT * FROM users WHERE email='${email}';`)
    	}
    })
    .then(result => {
        if(result.length > 0) {
            reject({code: 409, err:"Email is already in use"});
        } else {
            return genhash(password)
	}
    })
    .then(passwordHashed => {
        return query(`INSERT INTO users (email, username, password) VALUES ('${email}', '${username}', '${passwordHashed}')`);
    })
    .then(result => {
	console.log(result);
        return gentoken(result)
    })
    .then(token => {
	console.log(token);
        return res.status(200).json({token});
    })
    .catch(err => {
	if(!err.code) {
		return res.status(500).json({err});
	}
        return res.status(err.code).json({err: err.err});
    });
});

app.post('/login', [
	check('username').isLength({min: 3, max: 255}).trim().escape()	
], (req, res) => {
    var {username, password} = req.body;
    var userObject;

    query(`SELECT * FROM users WHERE username='${username}'`)
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
	if(!err.code) {
		err.code = 500;
	}
        return res.status(err.code).json({err: err.err});
    });
});

app.listen(2004);
console.log("listening on 2004");

app.use(authentication);

/* All below routes require a bearer token */

app.use("/list", list);


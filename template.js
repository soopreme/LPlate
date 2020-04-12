const express = require('express');
const { query } = require('./db');
const { authentication } = require('./authentication');

var router = express.Router();

app.post('/new', [
    check('title').isLength({ min: 1, max: 255 }).trim().escape(),
    check('body').isLength({min: 10}).escape(),
    check('url').isURL()
], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ err: errors.array() });
    }
    var {title, body, url} = req.body;
    var {username} = res.locals.payload;
    
    query(`INSERT INTO templates (author, name, description, link) VALUES ('${username}', '${title}', '${body}', '${url}'); SELECT * FROM templates WHERE ID= LAST_INSERT_ID();`)
    .then(result => {
        if(!result.id) {
            reject({code: 500, err: "Internal Server Error"});
        }
        resolve(result.id);
    })
    .then(id => {
        res.json({id});
    })
    .catch(err => {
        res.status(err.code).json({err: err.err});
    });
});

app.get('/:id', (req, res) => {
    var { id } = req.params;
    if(typeof id != 'number') {
        return res.status(400).json({err: "template ID must be a number"});
    }
    query(`SELECT * FROM templates WHERE ID=${id}`)
    .then(result => {
        if(result.length == 0) {
            reject({code: 404, err: "Template not found"})
        } else {
            return res.json(result);
        }
    })
});

app.get('/:id/star', (req, res) => {
    var template;
    var { id } = req.params;
    if(typeof id != 'number') {
        return res.status(400).json({err: "template ID must be a number"});
    }
    query(`SELECT * FROM templates WHERE ID=${id}`)
    .then(result => {
        if(result.length == 0) {
            reject({code: 404, err: "Template not found"})
        } else {
            template = result;
            var {stars} = result; 
            return query(`UPDATE templates SET stars=${++stars}`);
        }
    })
    .then(() => {
        var uid = res.locals.payload.ID;
        return query(`INSERT INTO stars (userID, templateID) VALUES (${uid}, ${id})`)
    })
    .then(result => {
        return res.json(result);
    })
    .catch(err => {
        res.code(err.code).json({err: err.err});
    });
});

module.exports = router;

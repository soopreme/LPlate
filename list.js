const express = require('express');
const { query } = require('./db');
const { authentication } = require('./authentication');

var router = express.Router();

router.get('/stars/ascending', (req, res) => {
    query(`SELECT * FROM templates ORDER BY stars ASC;`)
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(err.code).json({err: err.err});
    });
});

router.get('/stars/descending', (req, res) => {
    query(`SELECT * FROM templates ORDER BY stars DESC;`)
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(err.code).json({err: err.err});
    });
});

router.get('/name/ascending', (req, res) => {
    query(`SELECT * FROM templates ORDER BY name ASC;`)
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(err.code).json({err: err.err});
    });
});

router.get('/name/descending', (req, res) => {
    query(`SELECT * FROM templates ORDER BY name DESC;`)
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(err.code).json({err: err.err});
    });
});

module.exports = router;

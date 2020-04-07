const mysql = require('mysql');

var connection = mysql.createConnection({
    host: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB
});

var connect = () => {
    if(connection.state === 'disconnected') {
        connection.connect();
        return connection;
    } else {
        console.warn("db is already connected");
        return connection;
    }
}

var query = query => new Promise((resolve, reject) => {
    connection.query(query, (err, results, fields) => {
        if(err) {
            reject({code: 500, err});
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

module.exports({
        connect,
        query
});
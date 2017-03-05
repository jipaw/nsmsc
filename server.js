require('dotenv').config()
var express = require("express");
var http = require('http');
var mysql = require("mysql");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var md5 = require('MD5');
var cors = require('cors');
var admin = require("./API/API_ADMIN.js");
var message = require("./API/API_MESSAGE.js");
var web = require("./API/API_WEB.js");
var gateway = require("./controller/GATEWAY.js");
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

function REST() {
    var self = this;
    self.connectMysql();
};

REST.prototype.connectMysql = function() {
    var self = this;
    var pool = mysql.createPool({
        connectionLimit: process.env.DB_POOL,
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        debug: false 
    });
    pool.getConnection(function(err, connection) {
        if (err) {
            self.stop(err);
        } else {
            self.configureExpress(connection);
        }
    });
}

REST.prototype.configureExpress = function(connection) {
    var self = this;
    app.use(cors({
        "exposedHeaders": ['X-Total-Count','Content-Range', 'X-Content-Range']
    }));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(morgan("short"));
    app.use(bodyParser.json());
    var router = express.Router();
    app.use('/message', router);
    app.use('/admin', router);
    app.use('/web', router);
    var nsmsc_router = new admin(router, connection, md5, jwt);
    var nsmsc_router = new message(router, connection, io, md5);
    var nsmsc_router = new web(router, connection, md5, jwt);
    var nsmsc_router = new gateway(router, connection, io);
    app.get("/", function(req, res) {
        res.json({
            "Message": "Server Running"
        });
    });
    self.startServer();
}

REST.prototype.startServer = function() {
    server.listen(process.env.PORT, function() {
        console.log("Nsmsc server running on port:" + process.env.PORT);
    });
}

REST.prototype.stop = function(err) {
    console.log("ISSUE WITH DATABASE \n" + err);
    process.exit(1);
}

new REST();

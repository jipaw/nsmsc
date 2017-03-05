var mysql = require("mysql");
var async = require("async");
var moment = require("moment");
var ipfilter = require('express-ipfilter').IpFilter;

function NSMSC_ROUTER(router, connection, md5, jwt) {
    var self = this;
    self.handleRoutes(router, connection, md5, jwt);
}

NSMSC_ROUTER.prototype.handleRoutes = function(router, connection, md5, jwt) {
    var self = this;
    var ips = ['127.0.0.1', '::ffff:127.0.0.1'];
    router.use(ipfilter(ips, {
        mode: 'allow'
    }));
    router.use(function(err, req, res, next) {
        if (err instanceof IpDeniedError) {
            res.status(401);
            res.json({
                "rescode": "401",
                "message": "IP Not Authorized"
            });
            res.end();
        }
    });

    router.post("/auth", function(req, res) {
        var query = 'SELECT ??, ?? FROM ?? WHERE ?? = ?';
        var table = ["name", "password", "user", "name", req.body.username];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows) {
            var data = rows;
            if (err || data.length === 0) {
                res.status(403).json({
                    "Error": true,
                    "Message": "Forbidden request"
                });
            } else
            if (req.body.username !== data[0].name || md5(req.body.password) !== data[0].password) {
                res.status(401).json({
                    "Error": true,
                    "Message": "Unathorized Credential"
                });
            } else {
                var claims = {
                    "username": data[0].name,
                    "id": "1"
                };
                var token = jwt.sign(claims, 'superSecret', {});
                var data = {
                    "token": token
                }
                res.json(data);
                //console.log(data);
            }
        });


    });

    router.get("/users", function(req, res) {
        var start = req.query._start,
            items_per_page = req.query._end - req.query._start,
            sort = req.query._sort,
            order = req.query._order;
        var count_query = "SELECT COUNT(*) as total FROM ??";
        if (req.query.name) {
            var filter = req.query.name;
            var query = 'SELECT * from ?? WHERE name LIKE ' + '\'%' + filter + '%\'' + ' ORDER BY ' + sort + ' ' + order + ' LIMIT ' + start + ',' + items_per_page + ' ';
        } else {
            var query = 'SELECT * from ?? ORDER BY ' + sort + ' ' + order + ' LIMIT ' + start + ',' + items_per_page + ' ';
        }
        var table = ["user"];
        query = mysql.format(query, table);
        count_data = mysql.format(count_query, table);
        connection.query(count_data, function(err, countrows, fields) {
            if (err) {
                console.log(err);
            } else {
                totalRec = countrows[0]['total'];
            }
        });

        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                // console.log(rows);
                res.set("X-Total-Count", totalRec);
                res.json(rows);
            }
        });
    });

    router.get("/users/:id", function(req, res) {
        // console.log(req);
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["user", "id", req.params.id];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                res.status(200).json(rows);
            }
        });
    });

    router.post("/users", function(req, res) {
        // console.log(req);
        var name = req.body.name,
            password = md5(req.body.password),
            type = req.body.type,
            balance = req.body.balance,
            token_sms = req.body.token_sms,
            join_date = moment(req.body.join_date).format('YYYY-MM-DD HH:mm:ss');
        var query = "INSERT INTO ??(??,??,??) VALUES (?,?,?)";
        var table = ["user", "name", "password", "type", "balance", "token_sms", "join_date", name, password, type, balance, token_sms, join_date];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                // console.log(rows);
                res.status(200).json(rows);
            }
        });
    });

    router.put("/users/:id", function(req, res) {
        console.log(req);
        var query = "UPDATE ?? SET ?? = ?, ?? = ?, ?? = ?, ?? = ?, ?? = ? WHERE ?? = ?";
        var table = ["user", "name", req.body.name, "password", md5(req.body.password), "type", req.body.type, "balance", req.body.balance, "token_sms", req.body.token_sms, "id", req.body.id];
        query = mysql.format(query, table);
        console.log(query);
        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                res.status(200).json(rows);
            }
        });
    });

    router.delete("/users/:id", function(req, res) {
        var query = "DELETE from ?? WHERE ??=?";
        var table = ["user", "id", req.params.id];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                res.status(200).json({
                    "Error": false,
                    "Message": "Deleted the user with id " + req.params.id
                });
            }
        });
    });

    router.get("/inboxes", function(req, res) {
        var start = req.query._start,
            items_per_page = req.query._end - req.query._start,
            sort = req.query._sort,
            order = req.query._order;

        var count_query = "SELECT COUNT(*) as total FROM ??";
        var query = 'SELECT * from ?? ORDER BY ' + sort + ' ' + order + ' LIMIT ' + start + ',' + items_per_page + ' ';
        var table = ["inbox"];
        query = mysql.format(query, table);
        count_data = mysql.format(count_query, table);
        connection.query(count_data, function(err, countrows, fields) {
            if (err) {
                console.log(err);
            } else {
                totalRec = countrows[0]['total'];
                // console.log(totalRec);
            }
        });

        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                // console.log(rows);
                res.set("X-Total-Count", totalRec);
                res.json(rows);
            }
        });
    });


    router.get("/reports", function(req, res) {
        var start = req.query._start,
            items_per_page = req.query._end - req.query._start,
            sort = req.query._sort,
            order = req.query._order;

        var count_query = "SELECT COUNT(*) as total FROM ??";
        var query = 'SELECT * from ?? ORDER BY ' + sort + ' ' + order + ' LIMIT ' + start + ',' + items_per_page + ' ';
        var table = ["report"];
        query = mysql.format(query, table);
        count_data = mysql.format(count_query, table);
        connection.query(count_data, function(err, countrows, fields) {
            if (err) {
                console.log(err);
            } else {
                totalRec = countrows[0]['total'];
                // console.log(totalRec);
            }
        });

        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                // console.log(rows);
                res.set("X-Total-Count", totalRec);
                res.status(200).json(rows);
            }
        });
    });

    router.get("/smses", function(req, res) {
        var start = req.query._start,
            items_per_page = req.query._end - req.query._start,
            sort = req.query._sort,
            order = req.query._order;

        var count_query = "SELECT COUNT(*) as total FROM ??";
        var query = 'SELECT * from ?? ORDER BY ' + sort + ' ' + order + ' LIMIT ' + start + ',' + items_per_page + ' ';
        var table = ["sms_in"];
        query = mysql.format(query, table);
        count_data = mysql.format(count_query, table);
        connection.query(count_data, function(err, countrows, fields) {
            if (err) {
                console.log(err);
            } else {
                totalRec = countrows[0]['total'];
                // console.log(totalRec);
            }
        });

        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                // console.log(rows);
                res.set("X-Total-Count", totalRec);
                res.status(200).json(rows);
            }
        });
    });

    router.get("/ips", function(req, res) {
        var start = req.query._start,
            items_per_page = req.query._end - req.query._start,
            sort = req.query._sort,
            order = req.query._order;

        var count_query = "SELECT COUNT(*) as total FROM ??";
        var query = 'SELECT * from ?? ORDER BY ' + sort + ' ' + order + ' LIMIT ' + start + ',' + items_per_page + ' ';
        var table = ["whitelist"];
        query = mysql.format(query, table);
        count_data = mysql.format(count_query, table);
        connection.query(count_data, function(err, countrows, fields) {
            if (err) {
                console.log(err);
            } else {
                totalRec = countrows[0]['total'];
                // console.log(totalRec);
            }
        });

        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                // console.log(rows);
                res.set("X-Total-Count", totalRec);
                res.status(200).json(rows);
            }
        });
    });


    router.post("/ips", function(req, res) {
        // console.log(req);
        var username = req.body.username,
            ip = req.body.ip,
            is_allowed = req.body.is_allowed;
        var query = "INSERT INTO ??(??,??,??) VALUES (?,?,?)";
        var table = ["whitelist", "username", "ip", "is_allowed", username, ip, is_allowed];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                // console.log(rows);
                res.status(200).json(rows);
            }
        });
    });

    router.put("/ips/:id", function(req, res) {
        console.log(req);
        var query = "UPDATE ?? SET ?? = ?, ?? = ?, ?? = ? WHERE ?? = ?";
        var table = ["whitelist", "username", req.body.username, "ip", req.body.ip, "is_allowed", req.body.is_allowed, "id", req.body.id];
        query = mysql.format(query, table);
        console.log(query);
        connection.query(query, function(err, rows) {
            if (err) {
                res.json({
                    "Error": true,
                    "Message": "Error executing query"
                });
            } else {
                res.status(200).json(rows);
            }
        });
    });


}

module.exports = NSMSC_ROUTER;

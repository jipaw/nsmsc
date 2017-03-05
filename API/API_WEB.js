var mysql = require("mysql");
var async = require("async");
var moment = require("moment");

function WEB_ROUTER(router, connection, md5, jwt) {
    var self = this;
    self.handleRoutes(router, connection, md5, jwt);
}

WEB_ROUTER.prototype.handleRoutes = function(router, connection, md5, jwt) {
    var self = this;
    router.get("/", function(req, res) {
        res.json({
            "Message": "Server Running"
        });
    });

    router.post("/auth", function(req, res) {
        console.log(req.body);
        var headers = {
                "alg": "HS256", //denotes the algorithm (shorthand alg) used for the  signature is HMAC SHA-256
                "typ": "JWT" //denotes the type (shorthand typ) of token this is
            },
            claims = {
                "sub": "tom@stormpath.com",
                "name": "jipaw12@gmail.com",
                "id": "1"
            };
        var token = jwt.sign(claims, 'superSecret', {});
        var data = {
            "id_token": token
        }
        res.json(data);
        console.log(data);
        //var query = "SELECT * FROM ??";
        //var table = ["user"];
        //query = mysql.format(query,table);
        //connection.query(query,function(err,rows){
        //    if(err) {
        //        res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        //    } else { res.json({"Error" : false, "Message" : "Success", "Users" : rows});
        //    }
        //});
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
                    "Message": "Deleted the user with email " + req.params.id
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

module.exports = WEB_ROUTER;

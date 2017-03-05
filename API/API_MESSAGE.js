var mysql = require("mysql");
var paperwork = require("paperwork");
var bus = require('../lib/eventBus.js');
var moment = require('moment');
var ipfilter = require('express-ipfilter').IpFilter;

var post_data = {
    destination: String,
    text: String,
    user: String,
    pass: String,
    trxid: String
};
var status_data = {
    user: String,
    pass: String,
    trxid: String
};

function NSMSC_ROUTER(router, connection, io, md5) {
    var self = this;
    self.handleRoutes(router, connection, io, md5);
}

NSMSC_ROUTER.prototype.handleRoutes = function(router, connection, io, md5) {
    var self = this;

    var ips = [];
    var query = "SELECT ?? FROM ?? WHERE ??= 'true'";
    var table = ["ip", "whitelist", "is_allowed"];
    query = mysql.format(query, table);
    connection.query(query, function(err, results) {
        for (var i = 0; i < results.length; i++) {
            ips.push(results[i].ip);
        }
        router.use(ipfilter(ips, {
            mode: 'allow'
        }));
    });

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

    router.use(function(req, res, next) {
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["user", "name", req.body.user];
        query = mysql.format(query, table);
        connection.query(query, function(err, results) {
            if (!results.length) {
                res.json({
                    "rescode": "014",
                    "status": "FAILED",
                    "message": "Credential not found"
                });
                res.end();
            } else
            if (md5(req.body.password) !== results[0].password && req.body.user !== results[0].name) {
                res.json({
                    "rescode": "016",
                    "status": "FAILED",
                    "message": "Credential not match"
                });
                res.end();
            } else {
                next();
            }
        });
    });

    router.post("/post", paperwork.accept(post_data), function(req, res) {
        var objRegex = [{
                op: "TSEL",
                regex: "^628(11|12|13|21|22|23|51|52|53)"
            },
            {
                op: "ISAT",
                regex: "^628(14|15|16|55|56|57|58)"
            },
            {
                op: "XL",
                regex: "^628(17|18|19|59|77|78|31|32|33|38)"
            },
            {
                op: "THREE",
                regex: "^628(95|96|97|98|99)"
            },
            {
                op: "SMART",
                regex: "^628(81|82|83|84|85|86|87|88|89)"
            }
        ];
        var number = new RegExp(/^0/);
        if (req.body.destination.indexOf("+") === 0) {
            req.body.destination = req.body.destination.substring(1);
        } else if (req.body.destination.indexOf("0") === 0) {
            req.body.destination = req.body.destination.replace(number, '62');
        }
        for (var i = 0; i < objRegex.length; i++) {
            var data = req.body.destination.match(new RegExp(objRegex[i].regex.toString()));
            if (data !== null) {
                var hlr = objRegex[i].op;
                console.log(hlr);
            };
        }
        var data = {
            destination: req.body.destination,
            text: req.body.text,
            user: req.body.user,
            pass: req.body.pass,
            trxid: req.body.trxid,
            hlr: hlr
        }
        res.json({
            "rescode": "00",
            "status": "OK",
            "message": "Accepted",
            "trxid": data.trxid
        });
        res.end();
        console.log("Post data : ", data);
        io.emit('sms_request', data);
    });
    router.post("/status", paperwork.accept(status_data), function(req, res) {
        // console.log(req.body);
        var user = req.body.user,
            pass = req.body.password,
            trxid = req.body.trxid;
        var query = "SELECT * FROM ?? WHERE ?? = ?";
        var table = ["inbox", "trx_id", trxid];
        query = mysql.format(query, table);
        connection.query(query, function(err, results) {
            // console.log(results);
            if (!results.length) {
                res.json({
                    "rescode": "024",
                    "trxid": trxid,
                    "status": "FAILED",
                    "Message": "Trxid not found"
                });
            } else if (results.length) {
                var raw = [];
                for (var i = 0; i < results.length; i++) {
                    if (results[i].reference !== 'PENDING' && results[i].reference !== "FAILED") {
                        var status = "DELIVERED";
                        raw.push({
                            rescode: "00",
                            trxid: results[i].trx_id,
                            destination: results[i].destination,
                            status: status,
                            date: moment(results[i].in_time).format('YYYY-MM-DD HH:mm:ss')
                        });
                    }
                }
                // json = Object.assign({}, raw);
                res.send(raw);
            }
        });
    });
};

module.exports = NSMSC_ROUTER;

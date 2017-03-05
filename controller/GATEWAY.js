var kue = require('kue');
var jobs = kue.createQueue();
var modem = require('../index.js');
var bus = require('../lib/eventBus.js');
var mysql = require('mysql');
var moment = require('moment');
var logger = require("../config/logging.js");

function NSMSC_ROUTER(router, connection, io) {
    var self = this;
    self.handleRoutes(router, connection, io);
}


NSMSC_ROUTER.prototype.handleRoutes = function(router, connection, io) {
    var self = this;
    // Register event listener
    io.sockets.on('connection', function(socket) {
        socket.on('send_data', function(data) {
            console.log('Data triggered!:', data);
            var task = jobs.create('save_db_message', {
                name: "save message to db",
                destination: data.destination,
                text: data.text,
                user: data.user,
                trxid: data.trxid,
                reference: data.reference
            });
            task
                .on('complete', function() {
                    console.log('Job', task.id, 'with name', task.data.name, 'is done');
                })
                .on('failed', function() {
                    console.log('Job', task.id, 'with name', task.data.name, 'has failed');
                })

            task.delay(100).save();
            // console.log(data);
            jobs.process('save_db_message', function(task, done) {
                /* carry out all the job function here */
                var query = "INSERT INTO ??(??,??,??,??,??) VALUES (?,?,?,?,?)";
                var table = ["inbox", "user_name", "destination", "message", "trx_id", "reference", task.data.user, task.data.destination, task.data.text, task.data.trxid, task.data.reference];
                query = mysql.format(query, table);
                connection.query(query, function(err, rows) {
                    //	console.log(rows);
                    done && done();
                });

            });
        });
        socket.on('report_send', function(reportObj) {
            //console.log(reportObj);
            var data = reportObj.reports;
            var tpdu_type = data[0].tpdu_type,
                reference = data[0].reference,
                sender = data[0].sender,
                smsc_ts = moment(data[0].smsc_ts).format('YYYY-MM-DD HH:mm:ss'),
                discharge_ts = moment(data[0].discharge_ts).format('YYYY-MM-DD HH:mm:ss'),
                status = data[0].status;
            var task = jobs.create('save_report', {
                name: "save report to db",
                tpdu_type: tpdu_type,
                reference: reference,
                sender: sender,
                smsc_ts: smsc_ts,
                discharge_ts: discharge_ts,
                status: status
            });
            task
                .on('complete', function() {
                    console.log('Job', task.id, 'with name', task.data.name, 'is done');
                })
                .on('failed', function() {
                    console.log('Job', task.id, 'with name', task.data.name, 'has failed');
                })

            task.delay(100).save();
            jobs.process('save_report', function(task, done) {
                // console.log(task.data);
                var query = "INSERT INTO ??(??,??,??,??,??,??) VALUES (?,?,?,?,?,?)";
                var table = ["report", "tpdu_type", "reference", "sender", "smsc_ts", "discharge_ts", "status", task.data.tpdu_type, task.data.reference, task.data.sender, task.data.smsc_ts, task.data.discharge_ts, task.data.status];
                query = mysql.format(query, table);
                connection.query(query, function(err, rows) {
                    console.log(rows);
                    done && done();
                });
            });

        });
        socket.on('message_send', function(msg) {
            //console.log(msg);
            var tpdu_type = msg.tpdu_type,
                smsc = msg.smsc,
                sender = msg.sender,
                text = msg.text,
                time = moment(msg.time).format('YYYY-MM-DD HH:mm:ss');
            var task = jobs.create('save_message', {
                name: "save send message to db",
                tpdu_type: tpdu_type,
                smsc: smsc,
                sender: sender,
                text: text,
                time: time
            });
            task
                .on('complete', function() {
                    console.log('Job', task.id, 'with name', task.data.name, 'is done');
                })
                .on('failed', function() {
                    console.log('Job', task.id, 'with name', task.data.name, 'has failed');
                })

            task.delay(100).save();
            jobs.process('save_message', function(task, done) {
                var query = "INSERT INTO ??(??,??,??,??,??) VALUES (?,?,?,?,?)";
                var table = ["sms_in", "smsc", "tpdu_type", "sender", "text", "time", task.data.smsc, task.data.tpdu_type, task.data.sender, task.data.text, task.data.time];
                query = mysql.format(query, table);
                connection.query(query, function(err, rows) {
                    //	console.log(rows);
                });
                done && done();
            });
        });
    });
};
module.exports = NSMSC_ROUTER;

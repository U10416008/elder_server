var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/';
var dbo;
var dbCol;
var dbCol_schedule;
var map = require('./map_location.json');


//need date
function insert(userId, msg, dbtype, date) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        dbCol = dbo.collection('userTable');
        //dbCol_schedule = dbo.collection('userSchedule');
        console.log('Connected!');
        var myobj = { 'userId': userId, 'name': '', 'phone': '', 'relatePhone': '', 'date': '' };
        dbCol.find({ 'userId': userId }).limit(1).next(function(err, result) {
            if (err) throw err;
            if (!result && (msg === 'n' || msg === 'N')) {

                myobj.date = date;
                dbCol.insertOne(myobj, function(err, res) {
                    if (err) throw err;

                    console.log('1 document inserted');

                });
            } else if (msg !== 'n' && msg !== 'N') {
                myobj.name = result.name;
                myobj.phone = result.phone;
                myobj.relatePhone = result.relatePhone;
                myobj.date = result.date;
                if (dbtype == 'name') {
                    myobj.name = msg;
                } else if (dbtype === 'phone') {
                    myobj.phone = msg;
                } else if (dbtype === 'relatePhone') {
                    myobj.relatePhone = msg;
                }
                dbtype = '';
                dbCol.updateOne({ 'userId': userId }, myobj, function(err, res) {
                    if (err) throw err;
                    console.log('1 document updated');
                });
            }
            db.close();
        });

    });
}

function insert_schedule(userId, msg) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        dbCol = dbo.collection('userTable');
        dbCol_schedule = dbo.collection('userSchedule');
        console.log('Connected!');
        msg = msg.split(':');
        var myobj = { 'relatePhone': '', 'schedule': msg[2], 'hour': msg[0], 'minute': msg[1] };
        dbCol.find({ 'userId': userId }).toArray(function(err, result) {
            if (err) throw err;
            if (result.length > 0) {
                myobj.relatePhone = result[0].relatePhone;
                dbCol_schedule.insertOne(myobj, function(err, res) {
                    if (err) throw err;

                    console.log(res);
                    db.close();
                });
            } else {
                db.close();
            }
            console.log(result);
        });
    });


}

function get_schedule(relatePhone, sock) {
    console.log('DB :' + relatePhone);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        dbCol = dbo.collection('userTable');
        dbCol_schedule = dbo.collection('userSchedule');
        console.log('Connected!');
        dbCol_schedule.find({ 'relatePhone': relatePhone }).toArray(function(err, result) {
            if (err) throw err;
            //console.log(result);
            if (result.length > 0) {

                var data = result[0].hour + ':' + result[0].minute + ':' + result[0].schedule;
                console.log(data.toString());
                sock.write(data.toString());
            }

            db.close();

        });

    });
}

function getLastDate(nowDate, push) {
    var minLastDate = nowDate - 36000000;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        dbCol = dbo.collection('userTable');
        //dbCol_schedule = dbo.collection('userSchedule');
        console.log('Connected!');
        dbCol.find({ 'date': { $lte: minLastDate, $gt: 0 } }).toArray(function(err, result) {
            if (err) throw err;
            //console.log(result.length);
            if (result.length > 0) {

                for (var i = 0; i < result.length; i++) {
                    //console.log(result[i].userId + result[i].date);
                    push(result[i].userId, '該關心長輩了');
                }

            }
            db.close();

        });
    });

}

function exist(relateNumber, remindNumber, push) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        dbCol = dbo.collection('userTable');
        dbCol_schedule = dbo.collection('userSchedule');
        console.log('Connected!');
        dbCol.find({ 'phone': remindNumber, 'relatePhone': relateNumber }).toArray(function(err, result) {
            if (err) throw err;
            if (result.length > 0) {

                //console.log(result[0].userId);
                var date = new Date();

                dbCol.updateOne({ 'userId': result[0].userId }, {
                    'userId': result[0].userId,
                    'name': result[0].name,
                    'phone': result[0].phone,
                    'relatePhone': result[0].relatePhone,
                    'date': date.getTime()
                }, function(err, res) {
                    if (err) throw err;
                    console.log('1 document updated');

                    push(result[0].userId, '已關心');
                    db.close();
                });

            } else {
                console.log('not in db.');
                db.close();
            }
        });
    });

}

function exist_loc(relateNumber, push) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        dbCol = dbo.collection('userTable');
        dbCol_schedule = dbo.collection('userSchedule');
        console.log('Connected!');
        dbCol.find({ 'relatePhone': relateNumber[1] }).toArray(function(err, result) {
            if (err) throw err;
            if (result.length > 0) {
                for (var i = 0; i < result.length; i++) {
                    console.log(result[i].userId + ',' + relateNumber[2] + ', ' + relateNumber[3]);
                    map.latitude = relateNumber[3];
                    map.longitude = relateNumber[2];
                    push(result[i].userId, map);
                }
                db.close();
            } else {
                console.log('not in db.');
                db.close();
            }
        });
    });
}
exports.getLastDate = getLastDate;
exports.insert = insert;
exports.exist = exist;
exports.exist_loc = exist_loc;
exports.insert_schedule = insert_schedule;
exports.get_schedule = get_schedule;
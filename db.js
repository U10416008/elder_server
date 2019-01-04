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
//insert data to db
function insert_schedule(userId, msg) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        dbCol = dbo.collection('userTable');
        dbCol_schedule = dbo.collection('userSchedule');
        //console.log('Connected!');
        msg = msg.split(':').reverse();

        var myobj = { 'relatePhone': '', 'schedule': msg[0], 'milli': '' };
        var date = new Date();
        //console.log(date.getDate());
        var day = (msg.length > 3) ? msg[3] :
            ((Number)(msg[2]) <= date.getHours()) ? (date.getDate() + 1) : (date.getDate());
        var month = (msg.length > 4) ? msg[4] :
            ((Number)(msg[3]) <= date.getDate()) ? (date.getMonth() + 2) : (date.getMonth() + 1);
        var year = month < date.getMonth() ? (date.getFullYear() + 1) :
            (month == date.getMonth() && day <= date.getDate()) ? date.getFullYear() + 1 : date.getFullYear();
        var sDate = year + '-' + month + '-' + day + ' ' + msg[2] + ':' + msg[1] + ':00';
        console.log(sDate);
        var time = new Date(sDate).getTime();
        console.log(time);
        myobj.milli = time.toString();
        dbCol.find({ 'userId': userId }).toArray(function(err, result) {
            if (err) throw err;
            if (result.length > 0) {
                myobj.relatePhone = result[0].relatePhone;
                dbCol_schedule.insertOne(myobj, function(err, res) {
                    if (err) throw err;

                    //console.log(res);
                    db.close();
                });
            } else {
                db.close();
            }
            //console.log(result);
        });
    });


}
//delete data in db
function drop_outdate(now) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        //dbCol = dbo.collection('userTable');
        dbCol_schedule = dbo.collection('userSchedule');
        dbCol_schedule.deleteMany({ 'milli': { $lte: now.toString(), $gt: '0' } }, function(err, result) {
            if (err) throw err;
            db.close();
        });
    });
}

function get_schedule(relatePhone, sock) {
    console.log('DB :' + relatePhone);
    var time = new Date().getTime();
    var add_24h = time + 86400000;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        this.db = db;
        dbo = db.db('user');
        //dbCol = dbo.collection('userTable');
        dbCol_schedule = dbo.collection('userSchedule');
        console.log(time);

        dbCol_schedule.find({ 'relatePhone': relatePhone, 'milli': { $lte: add_24h.toString(), $gt: time.toString() } }).toArray(function(err, result) {
            if (err) throw err;
            //console.log(result);
            if (result.length > 0) {
                sort(result);
                var data = '';
                for (var i = 0; i < result.length; i++) {
                    var data_current = result[i].milli + ':' + result[i].schedule + '&';
                    data += data_current;
                }
                console.log(data.toString());

                sock.write(data.toString() + '\n');


            }

            db.close();

        });

    });
}

function sort(result) {
    result.sort(function(a, b) {
        return a.milli - b.milli;
    });
}
//get the last time of receiving the number from younger
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
//check the user is in db or not
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
exports.drop_outdate = drop_outdate;
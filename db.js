var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var dbo;
var dbCol;
var db;

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    this.db = db;
    dbo = db.db("user");
    dbCol = dbo.collection("userTable");
    console.log("Connected!");



});
//need date
function insert(userId, msg, dbtype, date) {
    var myobj = { "userId": userId, "name": "", "phone": "", "relatePhone": "", "date": "" };
    dbCol.find({ "userId": userId }).limit(1).next(function(err, result) {
        if (err) throw err;
        if (!result && (msg === 'n' || msg === 'N')) {

            myobj.date = date;
            dbCol.insertOne(myobj, function(err, res) {
                if (err) throw err;

                console.log("1 document inserted");

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
            dbCol.updateOne({ "userId": userId }, myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document updated");
            });
        }

    });
}

function getLastDate(nowDate, push) {
    var minLastDate = nowDate - 20000;
    dbCol.find({ 'date': { $lte: minLastDate, $gt: 0 } }).toArray(function(err, result) {
        if (err) throw err;
        //console.log(result.length);
        if (result.length > 0) {

            for (i = 0; i < result.length; i++) {
                console.log(result[i].userId + result[i].date);
                push(result[i].userId)
            }
        }

    });

}

function exist(relateNumber, remindNumber, push) {
    dbCol.find({ 'phone': remindNumber, 'relatePhone': relateNumber }).toArray(function(err, result) {
        if (err) {}
        if (result.length > 0) {

            console.log(result[0].userId);
            var date = new Date();

            dbCol.updateOne({ "userId": result[0].userId }, {
                "userId": result[0].userId,
                "name": result[0].name,
                "phone": result[0].phone,
                "relatePhone": result[0].relatePhone,
                "date": date.getTime()
            }, function(err, res) {
                if (err) throw err;
                console.log("1 document updated");
                push(result[0].userId);
            });

        } else {
            console.log("not in db.")
        }
    });

}
exports.getLastDate = getLastDate;
exports.insert = insert;
exports.exist = exist;
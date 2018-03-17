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

function insert(userId, msg, dbtype) {
    var myobj = { "userId": userId, "name": "", "phone": "", "relatePhone": "" };
    dbCol.find({ "userId": userId }).limit(1).next(function(err, result) {
        if (err) throw err;
        if (!result && (msg === 'n' || msg === 'N')) {
            dbCol.insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");

            });
        } else if (msg !== 'n' || msg !== 'N') {
            myobj.name = result.name;
            myobj.phone = result.phone;
            myobj.relatePhone = result.relatePhone;
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

function exist(relateNumber, cb) {
    dbCol.find({ 'relatePhone': relateNumber }).toArray(function(err, result) {
        if (err) throw err;
        console.log(result[0].userId);
        cb(result[0].userId);
    });

}
exports.insert = insert;
exports.exist = exist;
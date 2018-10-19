let linebot = require('linebot'),
    express = require('express');
var app = express();
var db = require("./db");
var net = require('net');
var server2 = require("./server");
const config = require('./config.json');
var info = require("./server_info.json");
let bot = linebot(config);
var dbtype = '';
var userId = "Ufeb02e42c5d950418ba94d645b5c1245";
var myLineRelate = require('./complete.json');
var con = net.createConnection(info.port, info.host, function() {
    con.write('Line_Server');
})
var date = new Date();
// get number
con.on('data', function(data) {
    var regtest = /((\+[0-9]{1}[0-9]{10})|([0-9]{10}))/g;
    var regexp = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/g;
    var number = (data.toString('utf8')).match(regtest);
    if (number != null) {
        console.log(number[0]);
        console.log(number[1].replace(/\+/, ''));
    }

    if (number != null && number.length >= 2) {
        db.exist(number[1].replace(/\+/, ''), number[0].replace(/\+/, ''), push)
    }
});

function push(data) {
    const mind_userId = data;
    if (mind_userId !== '') {
        bot.push(mind_userId, '該關心長輩了')
    }
}
bot.on('message', function(event) {
    // 把收到訊息的 event 印出來
    console.log(event);

    if (event.message.type == 'text') {
        var userId = event.source.userId;
        console.log(userId);
        var msg = event.message.text;
        var replyMsg = '';
        if (msg === 'n' || msg === 'N') {
            dbtype = '';
            date = new Date();
            db.insert(userId, msg, dbtype, date.getTime());
            replyMsg = myLineRelate;
        } else if (dbtype === 'phone' || dbtype === 'name' || dbtype === 'relatePhone') {
            //insert info ,needs date

            db.insert(userId, msg, dbtype, date.getTime());
            dbtype = '';
            replyMsg = 'OK';
        } else {
            replyMsg = msg;
        }
        event.reply(replyMsg).then(function(data) {
            // success
            console.log(replyMsg);
        }).catch(function(error) {
            // error
            console.log('error');
        });
    }
});
bot.on('postback', function(event) {
    console.log(event);
    var myResult = getString(event.postback.data);
    if (myResult !== '') {
        event.reply(myResult).then(function(data) {
            // success 
            console.log('訊息已傳送！');
        }).catch(function(error) {
            // error 
            console.log('error');
        });
    }

});

function getString(data) {


    if (data === 'phone' || data === 'name' || data === 'relatePhone') {
        dbtype = data;
        return '請輸入' + data;
    }
    return 'no this type';

}
setInterval(function() {
    date = new Date();
    console.log("Now Time" + date.getTime());
    db.getLastDate(date, push);

}, 10000);
setTimeout(function() {
    var userId = 'Ufeb02e42c5d950418ba94d645b5c1245';
    var sendMsg = "push msg to one user";
    bot.push(userId, [sendMsg]);
    console.log('userId: ' + userId);
    console.log('send: ' + sendMsg);
}, 3000);
const linebotParser = bot.parser();

app.post('/webhook', linebotParser);
app.get('/', function(req, res, next) {
    res.send('Hello World!')
});
// 在 localhost 走 8080 port
let server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log("My Line bot App running on port", port);
});
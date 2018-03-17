let linebot = require('linebot'),
    express = require('express');
var app = express();
var db = require("./db");
var net = require('net');
var server2 = require("./server");
const config = require('./config.json');
var info = require("./server_info.json");
var async = require('async');
let bot = linebot(config);
var dbtype = '';
var userId = "U548933d75e6e60d618c6818d70745421";
var myLineRelate = require('./complete.json');
var con = net.createConnection(info.port, info.host, function() {
    con.write('Line_Server');

})

con.on('data', function(data) {
    console.log(data.toString('utf8'));
    if (data.toString('utf8').length === 10) {
        db.exist(data.toString('utf8'), push)
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
            db.insert(userId, msg, dbtype);
            replyMsg = myLineRelate;
        } else if (dbtype === 'phone' || dbtype === 'name' || dbtype === 'relatePhone') {
            db.insert(userId, msg, dbtype);
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
setTimeout(function() {
    var userId = 'U548933d75e6e60d618c6818d70745421';
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
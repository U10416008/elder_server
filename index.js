let linebot = require('linebot'),
    express = require('express');
var app = express();
var db = require('./db');
var net = require('net');
require('./server');
const config = require('./config.json');
var info = require('./server_info.json');
let bot = linebot(config);
var dbtype = '';
var userId = 'Ufeb02e42c5d950418ba94d645b5c1245';
var myLineRelate = require('./complete.json');
var myLineSchedule = require('./schedule.json');
var con = net.createConnection(info.port, info.host, function() {
    con.write('Line_Server');

});
var regtest = /((\+[0-9]{1}[0-9]{10})|([0-9]{10}))/g;
var regSchedule = /([0,1]?[0-9]:)?([0-3]?[0-9]:)?([0-1]?[0-9]:[0-5]?[0-9]:[a-z]*)/g;
var date = new Date();

// get number
con.on('data', function(data) {
    console.log('Receive:' + data.toString('utf8'));
    var loc = data.toString('utf8').split('&');
    if (loc[0] === 'location') {
        loc[1] = loc[1].replace(/\+/, '');
        console.log(loc[1] + ', ' + loc[2] + ',' + loc[3]);
        db.exist_loc(loc, push);
        return;
    }

    var number = (data.toString('utf8')).match(regtest);
    if (number != null) {
        console.log(number[0]);
        console.log(number[1].replace(/\+/, ''));
    }

    if (number != null && number.length >= 2) {
        db.exist(number[1].replace(/\+/, ''), number[0].replace(/\+/, ''), push);
        return;
    }

});

function push(data, text) {
    const mind_userId = data;
    const push_msg = text;
    console.log(mind_userId);
    console.log(push_msg);
    if (mind_userId !== '') {
        bot.push(mind_userId, push_msg);
    }
}
bot.on('message', function(event) {
    // 把收到訊息的 event 印出來
    console.log(event);

    if (event.message.type == 'text') {
        var userId = event.source.userId;
        //console.log(userId);
        var msg = event.message.text;
        var replyMsg = '';
        if (msg === 'n' || msg === 'N') {

            date = new Date();
            db.insert(userId, msg, dbtype, date.getTime());
            replyMsg = myLineRelate;
        } else if (msg === 's' || msg === 'S') {
            replyMsg = myLineSchedule;
        } else if (dbtype === 'phone' || dbtype === 'name' || dbtype === 'relatePhone') {
            //insert info ,needs date
            replyMsg = 'OK';
            if (dbtype === 'phone' || dbtype === 'relatePhone') {
                if (msg.toString('utf8').match(regtest) == null) {

                    replyMsg = '請輸入正常電話';

                } else {
                    db.insert(userId, msg, dbtype, date.getTime());
                }
            } else {
                db.insert(userId, msg, dbtype, date.getTime());
            }


        } else if (dbtype === 'schedule') {
            replyMsg = 'OK';
            if (msg.toString('utf8').match(regSchedule) != null) {
                console.log(msg);
                db.insert_schedule(userId, msg);

            } else {
                replyMsg = '行事曆\n格式(\'MM:DD:HH:MM:what to do\')';
            }
        } else {
            replyMsg = msg;
        }
        dbtype = '';
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


    if (data === 'phone' || data === 'name' || data === 'relatePhone' ||
        data === 'schedule') {
        dbtype = data;
        return '請輸入' + data;
    }
    return 'no this type';

}
setInterval(function() {
    date = new Date();
    console.log('Now Time' + date.getTime());
    db.getLastDate(date, push);

}, 180000);
setTimeout(function() {
    var userId = 'Ufeb02e42c5d950418ba94d645b5c1245';
    var sendMsg = 'push msg to one user';
    bot.push(userId, [sendMsg]);
    console.log('userId: ' + userId);
    console.log('send: ' + sendMsg);
}, 3000);
const linebotParser = bot.parser();

app.post('/webhook', linebotParser);
app.get('/', function(req, res, next) {
    res.send('Hello World!');
});
// 在 localhost 走 8080 port
let server = app.listen(process.env.PORT || 8080, function() {
    let port = server.address().port;
    console.log('My Line bot App running on port', port);
});
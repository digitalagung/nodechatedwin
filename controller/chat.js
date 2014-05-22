var socketio = require('socket.io');
var db = require('../model/db');

var io;

// maps socket.id to user's nickname
var nicknames = {};

// list of socket ids
var clients = [];
var namesUsed = [];

exports.socketListen = function(server){
    io = socketio.listen(server);
    io.set('log level', 1);
    // Heroku won't actually allow us to use WebSockets
    // so we have to setup polling instead.
    // https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
    io.configure(function () {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);
    });
    io.sockets.on('connection', function(socket){
        initializeConnection(socket);
        handleChoosingNicknames(socket);
        handleClientDisconnections(socket);
        handleMessageBroadcasting(socket);
        handlePrivateMessaging(socket);
    });
}

function initializeConnection(socket){
    showActiveUsers(socket);
    showOldMsgs(socket);
}

function showActiveUsers(socket){
    var activeNames = [];
    var usersInRoom = io.sockets.clients();
    for (var index in usersInRoom){
        var userSocketId = usersInRoom[index].id;
        if (userSocketId !== socket.id && nicknames[userSocketId]){
            var name = nicknames[userSocketId];
            activeNames.push({
                id: namesUsed.indexOf(name), 
                nick: name
            });
        }
    }
    socket.emit('names', activeNames);
}

function showOldMsgs(socket){
    db.getLastChat(5, function(error, lastchat){
        if(error)
            console.log('errosg : ' + error);
        socket.emit('load old msgs', lastchat);
    });
}

function handleChoosingNicknames(socket){
    socket.on('choose nickname', function(nick, cb) {
        if (namesUsed.indexOf(nick) !== -1) {
            cb('That name is already taken!  Please choose another one.');
            return;
        }
        var ind = namesUsed.push(nick) - 1;
        clients[ind] = socket;
        nicknames[socket.id] = nick;
        cb(null);
        io.sockets.emit('new user', {
            id: ind, 
            nick: nick
        });
    });
}

function handleMessageBroadcasting(socket){
    socket.on('message', function(msg){
        var name = nicknames[socket.id];
        var data = {
            name: name, 
            chat:msg,
            timestamp : Math.round((new Date()).getTime() / 1000)
        };
        db.saveChat(data, function(error){
            if(error) throw error;
            io.sockets.emit('message', {
                nick: name, 
                msg: msg
            });
        });
    });
}

function handlePrivateMessaging(socket){
    socket.on('private message', function(data){
        var from = nicknames[socket.id];
        clients[data.userToPM].emit('private message', {
            from: from, 
            msg: data.msg
        });
    });
}

function handleClientDisconnections(socket){
    socket.on('disconnect', function(){
        var ind = namesUsed.indexOf(nicknames[socket.id]);
        delete namesUsed[ind];
        delete clients[ind];
        delete nicknames[socket.id];
        io.sockets.emit('user disconnect', ind);
    });
}
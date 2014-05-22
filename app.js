var http = require('http');
var express = require('express');
var chatServer = require('./controller/chat');
var app = express();

var port = process.env.PORT || 3000;
var host = '127.0.0.1';

app.use(express.static(__dirname + '/public'));
var server = http.createServer(app).listen('3000', '127.0.0.1'); 
chatServer.socketListen(server);

app.get('/', function(req, res){
    res.sendfile(__dirname + '/views/index.html');
});
var mongoskin = require('mongoskin');

var db = mongoskin.db('mongodb://127.0.0.1:27017/chatdb');

db.bind('chat');

exports.getLastChat = function(limit, callback){
    try {
        db.chat.find().sort({
            timestamp : -1
        }).limit(limit).toArray(function(error, lastchat) {
            if(error)
                throw(error);
            callback(null, {
                success : 1,
                chat : lastchat
            });
        });
    } catch (ex) {
        callback(ex);
    }
}

exports.saveChat = function(data, callback){
    try {
        db.chat.insert(data, function(error) {
            if(error)
                throw(error);
            callback();
        });
    } catch (ex) {
        callback(ex);
    }
}
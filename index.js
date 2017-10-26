var express = require('express');
var app = require('express')();
var mongoose = require('mongoose');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Message = require('./models/message.js');
var path = require("path");
var db = mongoose.connection;
var users = [];
mongoose.connect('mongodb://chandu:chan@chat-shard-00-00-wku0q.mongodb.net:27017,chat-shard-00-01-wku0q.mongodb.net:27017,chat-shard-00-02-wku0q.mongodb.net:27017/test?ssl=true&replicaSet=chat-shard-0&authSource=admin', { useMongoClient: true });
mongoose.Promise = global.Promise;
app.set('port',(process.env.PORT||5000));
app.use(express.static(path.join(__dirname,'public')));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/prev-messages', function(req, res){
    Message.find({}).select('by message -_id').sort({date:-1}).exec(function(err,messages){
      if(err){
        console.log(err);
      }
      // console.log('found in db',messages);
    // var i=0;
    // var dbmessage = [];
    // for(i=0;i<messages.length;i++){
    //   dbmessage.push(messages[i].message);
    //   // console.log(dbmessage);
    // }
    // res.send(dbmessage);
    // console.log(messages);
    res.send(messages)
  })
});
var CC = 0;
io.on('connection', function(socket){
  CC++;
  socket.on('disconnect', function(){
    CC--;
    // console.log('user disconnected');
    console.log(CC+' user connected');
    io.emit('user count',CC);
    var index = users.indexOf(socket.name);
    if(index>-1){
      users.splice(index,1);
      io.emit('active users',users);
    }
  });
  socket.on('new user',function(data){
    socket.name = data;
    users.push(socket.name);
    // users[socket.name] = socket;
    io.emit('active users',users);
  })
  console.log(CC+' user connected');
  io.emit('user count',CC);
  socket.on('chat message', function(msg){
    msg=msg.trim()
    if(msg===''){
      return false
    }
    else{
      var message = new Message({by:socket.name,message:msg})
      message.save(function(err,message){
        if(err)console.log(err);
        // console.log("saved",message);
      })
      io.emit('chat message', {name:socket.name,msg:msg});
    }
  });
});
// CONNECTION EVENTS
// When successfully connected
db.on('connected', function(){
  console.log('mongoose connected');
})
// If the connection throws an error
db.on('error', function(err){
  console.log('mongoose connection error: '+err);
})
// When the connection is disconnected
db.on('disconnected', function(){
  console.log('mongoose disconnected');
})
// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose default connection disconnected through app termination'); 
    process.exit(0); 
  }); 
});
http.listen(app.get('port'), function(){
  console.log('listening on *',app.get('port'));
});
const express = require('express');
const app = express();
const fs = require('fs');
var https = require('http').Server(app);
var io = require('socket.io')(https);
const path = require('path');
// const router = Router();

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const port = process.env.PORT || 3000;

app.use(express.static('public'));
// app.use(router)

app.get('/', function(req, res) {
    // res.set('Content-Type', 'text/html')
    // res.status(200).send("<h1>Hello GFG Learner!</h1>");
    res.sendFile(path.join(__dirname, 'webrtcpage.html'))
})

app.get('/client.js', function (req, res) {
    res.sendFile(path.join(__dirname, 'client.js'));
  });

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('create or join', function (room) {
        console.log('create or join to room ', room);
        
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
        var numClients = myRoom.length;

        console.log(room, ' has ', numClients, ' clients');

        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients == 1) {
            socket.join(room);
            socket.emit('joined', room);
        } else {
            socket.emit('full', room);
        }
    });

    socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });

    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer',event.sdp);
    });

});


https.listen(port, function (error) {
    if(!error)
        console.log('listening on', port)
    else 
    console.log("Error occurred.", error);
});
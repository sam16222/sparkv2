// Copyright 2021 Google LLC

// Use of this source code is governed by an MIT-style
// license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});
const path = require('path');

const port = process.env.PORT || 3000;

// app.use(express.static('public'));

app.use(express.static(path.join(__dirname, '/static')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'webrtcpage.html'));
});

app.get('/close', (req, res) => {
    server.close()
    res.send("Http closed")
})

app.get('/share', function (req, res) {
    res.sendFile(path.join(__dirname, 'screen-sharing-min.html'));
});


app.get('/client.js', function (req, res) {
    res.sendFile(path.join(__dirname, 'client.js'));
});

app.get('/hand_gesture.js', function (req, res) {
    res.sendFile(path.join(__dirname, 'hand_gesture.js'));
});

/** This is triggered when a client is connected */
io.on('connection', function (socket) {
    console.log('a user connected');
    console.log('connect socket id:' + `${socket.id}`);

    /** This function is triggered when someone clicks to join the room */
    socket.on('create or join', function (room) {
        console.log('create or join to room ', room);

        var myRoom = io.of("/").adapter.rooms.get(room)

        if (myRoom === undefined || myRoom.size == 0) {
            console.log("a room has been created. no participants to join.");
            socket.join(room);
            socket.emit('created', room);
            console.log(io.of("/").adapter.rooms.get(room).size)
        } else if (myRoom.size == 1) {
            console.log("a participants to join available room")
            socket.join(room);
            socket.emit('joined', room);
        } else {
            socket.emit('full', room);
        }

    });

    /** This function is triggered when the person in the room is ready to communicate */
    socket.on('ready', function (room) {
        socket.broadcast.to(room).emit('ready');
    });


    socket.on('screen-shared', function (room) {
        socket.broadcast.to(room).emit('screen-shared');
    })


    /** This function is triggered when server gets a candidate from a person in the room */
    socket.on('candidate', function (event) {

        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('answer-screen', function (event) {
        socket.broadcast.to(event.room).emit('answer-screen', event.sdp);

        /** This function is triggered when server gets an offer from a person in the room */
        socket.on('offer', function (event) {
            socket.broadcast.to(event.room).emit('offer', event.sdp);
        });

        /** This function is triggered when server gets an answer from a person in the room */
        socket.on('answer', function (event) {
            socket.broadcast.to(event.room).emit('answer', event.sdp);
        });

        /** This function is triggered when a user disconnects */
        socket.on('disconnect', function () {
            console.log('a user disconnected');
        });
    });
})

const server = http.listen(port, function (error) {
    if (!error)
        console.log('listening on', port, "\nTap on http://localhost:3000/");
    else
        console.log("Error occurred.", error);
});

module.exports = { app, io };
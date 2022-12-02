/* Copyright (C) 2022 Kraft, Royapally, Sarthi, Ramaswamy, Maduru, Harde- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license that can be found in the LICENSE file or
 * at https://opensource.org/licenses/MIT.
 * You should have received a copy of the MIT license with
 * this file. If not, please write to: develop.nak@gmail.com, or visit https://github.com/SiddarthR56/spark/blob/main/README.md.
 */

const express = require('express');
const fs = require("fs");

/**
 * The app instance.
 *
 * @param {Object} [opts] The Server and net.Server options.
 * @param {Function} [opts.objectSerializer=JSON.stringify] Serializes an object into a binary
 *        buffer. This functions allows you to implement custom serialization protocols for
 *        the data or even use other known protocols like "Protocol Buffers" or  "MessagePack".
 * @param {Function} [opts.objectDeserializer=JSON.parse] Deserializes a binary buffer into an
 *        object. This functions allows you to implement custom serialization protocols for
 *        the data or even use other known protocols like "Protocol Buffers" or  "MessagePack".
 * @constructor
 * @fires app#use
 * @fires app#get
 * @fires app#on
 */
const app = express();

var privateKey = fs.readFileSync('sslcert/key.pem').toString();
var certificate = fs.readFileSync('sslcert/cert.pem').toString();

var credentials = {key: privateKey, cert: certificate}

var http = require('https').Server(credentials, app);
var io = require('socket.io')(http, {
  cors: {
    origin: '*',
  },
});

const path = require('path');

// rate limiter code adapted from https://codeql.github.com/codeql-query-help/javascript/js-missing-rate-limiting/
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});

// apply rate limiter to all requests
app.use(limiter);

/**
 * Constant for PORT
 */
const port = process.env.PORT || 3000;

/**
 * app use the dir.
 *
 * @event app#use
 */
app.use(express.static(path.join(__dirname, '/static')));

/**
 * app get page.
 *
 * @event app#get
 * @param {Object} req request
 * @param {Object} res response
 */
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'webrtcpage.html'));
});

app.get('/close', (req, res) => {
  server.close();
  res.send('Http closed');
});

/**
 * app get page.
 *
 * @event app#get
 * @param {Object} req request
 * @param {Object} res response
 */
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
  socket.on('create or join', function (message) {
    var room = message.room
    console.log('create or join to room ', room);

    var myRoom = io.of('/').adapter.rooms.get(room);

    if (myRoom === undefined || myRoom.size == 0) {
      console.log(`Room ${room} has been created.`);
      socket.join(room);
      socket.emit('created', room);
      console.log(io.of('/').adapter.rooms);
    } else if (myRoom.size <= 5) {
      console.log(`Participant ${socket.id} has joined room ${room}.`);
      socket.join(room);
      socket.emit('joined', room);
    }
  });

  /** This function is triggered when the person in the room is ready to communicate */
  socket.on('ready', function (message) {
    socket.broadcast.to(message.room).emit('ready', message);
  });

  socket.on('emoji', function (message) {
    socket.broadcast.to(message.room).emit('emoji', message);
  });

  socket.on('screen-shared', function (room) {
    socket.broadcast.to(room).emit('screen-shared');
  });

  /** This function is triggered when server gets a candidate from a person in the room */
  socket.on('candidate', function (event) {
    socket.broadcast.to(event.room).emit('candidate', event);
  });

  socket.on('answer-screen', function (event) {
    socket.broadcast.to(event.room).emit('answer-screen', event.sdp);
  });

  /** This function is triggered when server gets an offer from a person in the room */
  socket.on('offer', function (message) {
    socket.broadcast.to(message.room).emit('offer', message);
  });

  /** This function is triggered when server gets an answer from a person in the room */
  socket.on('answer', function (message) {
    socket.broadcast.to(message.room).emit('answer', message);
  });

  /** This function is triggered when a user disconnects */
  socket.on('disconnect-call', function (message) {
    console.log(message)
    socket.broadcast.to(message.room).emit('disconnect-call', message);
    console.log(`user ${socket.id} disconnected`);
  });
});

const server = http.listen(port, function (error) {
  if (!error) console.log('listening on', port, '\nTap on https://localhost:3000/');
  else console.log('Error occurred.', error);
});

module.exports = { app, io };

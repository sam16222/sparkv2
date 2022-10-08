// Copyright 2021 Google LLC

// Use of this source code is governed by an MIT-style
// license that can be found in the LICENSE file or at
// https://opensource.org/licenses/MIT.

/* eslint-disable no-unused-vars */

var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var divConsultingControls = document.getElementById("consultingControls");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var toggleButton = document.getElementById('toggle-cam');
var toggleMic = document.getElementById('toggle-mic');

var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;

/** Contains the stun server URL that will be used */
var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;

/**
 * The socket instance.
 *
 * @param {Object} [opts] The Server and net.Server options.
 * @param {Function} [opts.objectSerializer=JSON.stringify] Serializes an object into a binary
 *        buffer. This functions allows you to implement custom serialization protocols for
 *        the data or even use other known protocols like "Protocol Buffers" or  "MessagePack".
 * @param {Function} [opts.objectDeserializer=JSON.parse] Deserializes a binary buffer into an
 *        object. This functions allows you to implement custom serialization protocols for
 *        the data or even use other known protocols like "Protocol Buffers" or  "MessagePack".
 * @constructor
 * @fires socket#on
 * @fires socket#close
 * @fires socket#connection
 * @fires socket#error
 */
var socket = io();

btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        alert("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
        console.log("Room number " + roomNumber + " gathered");
        console.log('connect socket id:' + `${socket.id}`);
        socket.emit("create or join", roomNumber);
        // divSelectRoom.style = "display: none;";
        divConsultingRoom.style = "display: block;";
        divConsultingControls.style = "display: block;";
    }
};

/**
  * Socket connects.
  * 
  * @event socket#connect
 */
socket.on('connect', function() {
    console.log("Connection acheived.");
    console.log(socket.id);
});

/**
  * Socket creating a room.
  * 
  * @event socket#created
  * @param {number} room - Room number
  * 
 */
socket.on('created', function (room) {
    console.log("You are the first one in the room. Room created.")
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

/**
 * Function is triggered when the video on/off button is clicked.
 */
toggleButton.addEventListener('click', () =>{
    const videoTrack = localStream.getTracks().find(track => track.kind === 'video');
    if(videoTrack.enabled){
        videoTrack.enabled = false;
        toggleButton.innerHTML = "Show cam"
    } else{
        videoTrack.enabled = true;
        toggleButton.innerHTML = "Hide cam"
    }
});

/**
 * Function is triggered when when the audio mute/unmute button is clicked.
 */
toggleMic.addEventListener('click', () =>{
    const audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
    if(audioTrack.enabled){
        audioTrack.enabled = false;
        toggleMic.innerHTML = "Unmute microphone"
    } else{
        audioTrack.enabled = true;
        toggleMic.innerHTML = "Mute microphone"
    }
});

/**
 * Function is triggered when a room is successfully joined.
 * @param {number} room - Room number
 */
socket.on('joined', function (room) {
    console.log("You are joining an existing room. Room joined.")
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit('ready', roomNumber);
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

/**
 * Function is triggered when it receives an ice candidate.
 */
socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

/**
 * This function is triggered when a person joins the room and is ready to communicate.
 */
socket.on('ready', function () {
    if (isCaller) {
        console.log("Attempting to access video log of joined user.")
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

/**
 * This function is triggered when an offer is received.
 */
socket.on('offer', function (event) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

/**
 * This function is triggered when an answer is received.
 */
socket.on('answer', function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

/**
 * This function is triggered when a user is disconnected.
 */
socket.on( 'disconnect', function () {
    console.log( 'disconnected to server' );
});

/**
 * Implements the onIceCandidate function
 * which is part of RTCPeerConnection
 * @param {*} event event
 */
function onIceCandidate(event) {
    console.log(event)
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

/**
 * Impements the onAddStrean function that takes an event as an input
 * @param {*} event event
 */
function onAddStream(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}

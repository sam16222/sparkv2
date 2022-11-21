/* Copyright (C) 2022 Kraft, Royapally, Sarthi, Ramaswamy, Maduru, Harde- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license that can be found in the LICENSE file or
 * at https://opensource.org/licenses/MIT.
 * You should have received a copy of the MIT license with
 * this file. If not, please write to: develop.nak@gmail.com, or visit https://github.com/SiddarthR56/spark/blob/main/README.md.
 */

/* eslint-disable no-unused-vars */
/* global io, onResults, Gesture, Hands, Camera, gesturesEnabled:true*/

var divSelectRoom = document.getElementById('selectRoom');
var divConsultingRoom = document.getElementById('consultingRoom');
var divConsultingRoomwSharing = document.getElementById('consultingRoomwSharing');
var divConsultingControls = document.getElementById('consultingControls');
var inputRoomNumber = document.getElementById('roomNumber');
var btnGoRoom = document.getElementById('goRoom');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var screenVideo = document.getElementById('screen-sharing');
var toggleButton = document.getElementById('toggle-cam');
var toggleMic = document.getElementById('toggle-mic');
var toggleGesture = document.getElementById('gestures');
var toastButton = document.getElementById('toastbtn');
var screenShare = document.getElementById('screen-share');
var disconnectcall = document.getElementById('disconnect-call');

var roomNumber;
var localStream;
var remoteStream;
var screenStream;
var rtcPeerConnection;

/** Contains the stun server URL that will be used */
var iceServers = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' }, 
    { urls: 'stun:stun.l.google.com:19302' }
    // {
    //   urls: "turn:turnserver.example.org",
    //   username: "webrtc",
    //   credential: "turnpassword"
    // }
  ],
};

var streamConstraints = { audio: true, video: true };
var isCaller;
var startedStream = false;
const senders = [];

class ToastClass {

  constructor() {
      this.hideTimeout = null;
      this.el = document.createElement('div');
      this.el.className = 'toast';
      document.body.appendChild(this.el);
  }

  /**
   * @param {string} message - Toast Message
   * @param {string} state   - Toast State (success, error)
   * @param {boolean} longToast   - Keep toast for longer period of time
  */
  show(message, state, longToast=false) {
      clearTimeout(this.hideTimeout);
      this.el.textContent = message;
      this.el.classList.add('show');

      if (state) {
          this.el.classList.add(state);
      }

      if (longToast) {
        this.hideTimeout = setTimeout(() => {
          this.el.classList.remove('show');
          this.el.classList.remove(state);
        }, 4000);
      } else {
        this.hideTimeout = setTimeout(() => {
          this.el.classList.remove('show');
          this.el.classList.remove(state);
        }, 2000);
      }
      
  }
};

var Toast = new ToastClass();
document.addEventListener('DOMContentLoaded', () => Toast);

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

/**
 * Function is triggered when a gesture is recognized.
 */
function onGestureAction(results) {
  var gesture = onResults(results);
  switch (gesture) {
    case Gesture.RightSwipe:
      {
        console.log('start share');
        Toast.show('Screen share start', 'success');
        start_share();
      }
      break;
    case Gesture.LeftSwipe:
      {
        console.log('end share');
        Toast.show('Screen share end', 'success');
        end_share();
      }
      break;
    case Gesture.All5Fingers:
      {
        console.log('Five Fingers');
        const videoTrack = localStream.getTracks().find((track) => track.kind === 'video');
        if (!videoTrack.enabled) {
          videoTrack.enabled = true;
          console.log('Camera is on!');
        } else {
          console.log('Camera is already on!');
        }
      }
      break;
    case Gesture.ThumbsUp:
      {
        console.log('unmute audio');
        Toast.show('Audio Unmuted', 'success');
        const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
        unmute(audioTrack);
      }
      break;
    case Gesture.ThumbsDown:
      {
        console.log('mute audio');
        Toast.show('Audio Muted', 'success');
        const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
        mute(audioTrack);
      }
      break;
    case Gesture.UpSwipe:
      {
        console.log('Up Swipe unmute audion');
        const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
        unmute(audioTrack);
      }
      break;
    case Gesture.DownSwipe:
      {
        console.log('Down Swipe mute audio');
        const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
        mute(audioTrack);
      }
      break;
    case Gesture.TwoFingers:
      {
        console.log('Two Fingers');
        if (!disconnectcall.disabled) {
          //Disconnecting the call
          rtcPeerConnection.close();
          socket.emit('disconnect-call', roomNumber);
          Toast.show('Call disconnected', 'error');
          location.reload();
        } else {
          console.log('Call connection not found, hence cannot disconnect.');
        }
      }
      break;
    case Gesture.ClosedFist:
      {
        console.log('Closed Fist');
        const videoTrack = localStream.getTracks().find((track) => track.kind === 'video');
        if (videoTrack.enabled) {
          videoTrack.enabled = false;
          console.log('Camera turned off!');
        } else {
          console.log('Camera is already off!');
        }
      }
      break;
    default: {
      //pass
    }
  }
}

/**
 * Function is triggered when a participant tries to enter the room.
 */
btnGoRoom.onclick = function () {
  if (inputRoomNumber.value === '') {
    console.log('Please type a room number');
  } else {
    roomNumber = inputRoomNumber.value;
    console.log('Room number ' + roomNumber + ' gathered');
    console.log('connect socket id:' + `${socket.id}`);
    socket.emit('create or join', roomNumber);
    divConsultingRoom.style = 'display: block;';
    divConsultingControls.style = 'display: block;';

    //Hand Gesture
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onGestureAction);

    const camera = new Camera(localVideo, {
      onFrame: async () => {
        await hands.send({ image: localVideo });
      },
      width: 640,
      height: 320,
    });
    camera.start();
  }
};

/**
 * Socket connects.
 *
 * @event socket#connect
 */
socket.on('connect', function () {
  console.log('Connection acheived.');
  // divSelectRoom.style = "display: none;";
  divConsultingRoom.style = 'display: block;';
  divConsultingControls.style = 'display: block;';
});

/**
 * Socket creating a room.
 *
 * @event socket#created
 * @param {number} room - Room number
 *
 */
socket.on('created', function (room) {
  console.log('You are the first one in the room. Room created.');
  Toast.show('Room created. You are the first participant.', 'success', true);
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then(function (stream) {
      localStream = stream;
      localVideo.srcObject = stream;
      isCaller = true;
    })
    .catch(function (err) {
      console.log('An error ocurred when accessing media devices', err);
      Toast.show('Oops, an error ocurred when accessing media devices!', 'error', true);
    });
});

/**
 * Function is triggered when the video on/off button is clicked.
 */
toggleButton.addEventListener('click', () => {
  const videoTrack = localStream.getTracks().find((track) => track.kind === 'video');
  if (videoTrack.enabled) {
    videoTrack.enabled = false;
    toggleButton.innerHTML = '<i class="material-icons">videocam_off</i>';
  } else {
    videoTrack.enabled = true;
    toggleButton.innerHTML = '<i class="material-icons">videocam</i>';
  }
});

/**
 * Function is triggered when when the audio mute/unmute button is clicked.
 */
toggleMic.addEventListener('click', () => {
  const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
  if (audioTrack.enabled) {
    mute(audioTrack);
  } else {
    unmute(audioTrack);
  }
});

toggleGesture.addEventListener('click', () => {
  if (gesturesEnabled == true) {
    disable_gestures();
  } else {
    enable_gestures();
  }
});

disconnectcall.addEventListener('click', () => {
  //Disconnecting the call
  rtcPeerConnection.close();
  socket.emit('disconnect-call', roomNumber);
  Toast.show('Call disconnected', 'error');
  location.reload();
});

screenShare.addEventListener('click', () => {
  if (document.getElementById('consultingRoomwSharing').style.cssText == 'display: block;') {
    end_share();
  } else {
    start_share();
  }
});

function mute(audioTrack) {
  if (audioTrack.enabled === true) {
    audioTrack.enabled = false;
    toggleMic.innerHTML = '<i class="material-icons">mic_off</i>';
  }
}

function unmute(audioTrack) {
  if (audioTrack.enabled === false) {
    audioTrack.enabled = true;
    toggleMic.innerHTML = '<i class="material-icons">mic</i>';
  }
}

function end_share() {
  if (startedStream) {
    console.log('Ending screen share.');
    Toast.show('Ending screen share.', 'success');
    screenShare.innerHTML = '<i class="material-icons">screen_share</i>';
    divConsultingRoomwSharing.style = 'display: none';
    remoteVideo.className = 'video-large';
    senders.find((sender) => sender.track.kind === 'video').replaceTrack(localStream.getTracks()[1]);
    startedStream = false;
  } else {
    console.log('No Stream started yet.');
  }
}

function start_share() {
  if (startedStream) {
    console.log('share in progress');
    Toast.show('Screen share in progress', 'success', true);
    return;
  }
  console.log('Beginning screen share.');
  screenShare.innerHTML = '<i class="material-icons">stop_screen_share</i>';
  console.log('screen sharing chain enabled');

  remoteVideo.className = 'video-small';
  divConsultingRoomwSharing.style = 'display: block;';

  navigator.mediaDevices
    .getDisplayMedia({ video: { cursor: 'always' }, audio: false })
    .then(function (stream) {
      const screenTrack = stream.getTracks()[0];
      screenVideo.srcObject = stream;
      startedStream = true;
      senders.find((sender) => sender.track.kind === 'video').replaceTrack(screenTrack);
    })
    .catch(function (err) {
      console.log('An error ocurred when accessing media devices', err);
    });

  console.log('screen sharing has begun');
}

function disable_gestures() {
  if (gesturesEnabled) {
    console.log('Disabling gestures.');
    Toast.show('Disabling the gestures ... ', 'success');
    gesturesEnabled = false;
    toggleGesture.innerHTML = 'Enable Gestures';
  } else {
    console.log('Gestures already disabled');
    Toast.show('Gestures are already disabled', 'success', true);
  }
}

function enable_gestures() {
  if (gesturesEnabled === false) {
    console.log('Enabling gestures.');
    Toast.show('Enabling the gestures ... ', 'success');
    gesturesEnabled = true;
    toggleGesture.innerHTML = 'Disable Gestures';
  } else {
    console.log('Gestures Already Enabled');
    Toast.show('Gestures are already ensabled', 'success', true);
  }
}

/**
 * Socket joining a room.
 *
 * @event socket#joined
 * @param {number} room - Room number
 *
 */
socket.on('joined', function (room) {
  console.log('You are joining an existing room. Room joined.');
  Toast.show('You have joined the room', 'success', true);
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then(function (stream) {
      localStream = stream;
      localVideo.srcObject = stream;
      socket.emit('ready', roomNumber);
    })
    .catch(function (err) {
      console.log('An error ocurred when accessing media devices', err);
      Toast.show('Oops, An error ocurred when accessing media devices', 'error', true);
    });
});

/**
 * Function is triggered when it receives an ice candidate.
 *
 * @event socket#candidate
 * @param {*} event event
 */
socket.on('candidate', function (event) {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  rtcPeerConnection.addIceCandidate(candidate);
});

/**
 * This function is triggered when a person joins the room and is ready to communicate.
 *
 * @event socket#ready
 */
socket.on('ready', function () {
  if (isCaller) {
    console.log('Attempting to access video log of joined user.');
    Toast.show('Attempting to access video log of joined user.', 'success');
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    console.log('track added');
    localStream.getTracks().forEach((track) => senders.push(rtcPeerConnection.addTrack(track, localStream)));
    rtcPeerConnection
      .createOffer()
      .then((sessionDescription) => {
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit('offer', {
          type: 'offer',
          sdp: sessionDescription,
          room: roomNumber,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

/**
 * This function is triggered when an offer is received.
 *
 * @event socket#offer
 * @param {*} event event
 */
socket.on('offer', function (event) {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    console.log('offer recieved. remote track being added.');
    localStream.getTracks().forEach((track) => senders.push(rtcPeerConnection.addTrack(track, localStream)));
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    rtcPeerConnection
      .createAnswer()
      .then((sessionDescription) => {
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit('answer', {
          type: 'answer',
          sdp: sessionDescription,
          room: roomNumber,
        });
      })
      .catch((error) => {
        console.log(error);
      });
    screenShare.disabled = false;
    disconnectcall.disabled = false;
  }
});

/**
 * This function is triggered when an answer is received.
 *
 * @event socket#answer
 * @param {*} event event
 */
socket.on('answer', function (event) {
  console.log('connection fully established. Both remote participants connection should be open.');
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
  screenShare.disabled = false;
  disconnectcall.disabled = false;
});

socket.on('full', function () {
  console.log('Room is full. You can not enter this room right now.');
  Toast.show('Room is full hence you can not enter the meeting room', 'error', true);
});
/**
 * This function is triggered when a user is disconnected.
 * @event socket#disconnect
 */
socket.on('disconnect-call', function () {
  rtcPeerConnection.close();
  console.log('disconnected to client');
  Toast.show('Call disconnected', 'success', true);
  location.reload();
});

/**
 * Implements the onIceCandidate function
 * which is part of RTCPeerConnection
 * @param {*} event event
 */
function onIceCandidate(event) {
  console.log(event);
  if (event.candidate) {
    console.log('sending ice candidate');
    socket.emit('candidate', {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber,
    });
  }
}

/**
 * Implements the onAddStrean function that takes an event as an input
 * @param {*} event event
 */
function onAddStream(event) {
  console.log('Remote video is being connected to the current client.');
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.stream;
}

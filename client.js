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
var heartEmoji = document.getElementById('heart-emoji');
var likeEmoji = document.getElementById('like-emoji');
var happyEmoji = document.getElementById('happy-emoji');
var askQuestionEmoji = document.getElementById('question-emoji');
var celebrationEmoji = document.getElementById('celebration-emoji');
var clearEmoji = document.getElementById('clear-emoji');
var toggleGesture = document.getElementById('gestures');
var toastButton = document.getElementById('toastbtn');
var screenShare = document.getElementById('screen-share');
var disconnectcall = document.getElementById('disconnect-call');

var roomNumber;
var localStream;
var remoteStream;
var screenStream;
var rtcPeerConnection;

var origContentHeight = document.getElementsByClassName('content')[0].clientHeight - 40;
var origContentWidth = document.getElementsByClassName('content')[0].clientWidth - 40;

const localUuid = createUUID();
var localDisplayName;
var peerConnections = {};

/** Contains the stun server URL that will be used */
var iceServers = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
    // {
    //   urls: "turn:turnserver.example.org",
    //   username: "webrtc",
    //   credential: "turnpassword"
    // }
  ],
};

var streamConstraints = {
  audio: true,
  video: {
    width: { max: 320 },
    height: { max: 240 },
    frameRate: { max: 30 },
  },
};
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
  show(message, state, longToast = false) {
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
}

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

//#region Gestures and DOM Events

/**
 * Function is triggered when a gesture is recognized.
 */
function onGestureAction(results) {
  if (!gesturesEnabled) return;
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
        toggleVideo(true);
      }
      break;
    case Gesture.ThumbsUp:
      {
        console.log('unmute audio');
        Toast.show('Audio Unmuted', 'success');
        unmute();
      }
      break;
    case Gesture.ThumbsDown:
      {
        console.log('mute audio');
        Toast.show('Audio Muted', 'success');
        mute();
      }
      break;
    case Gesture.UpSwipe:
      {
        console.log('Up Swipe unmute audion');
        unmute();
      }
      break;
    case Gesture.DownSwipe:
      {
        console.log('Down Swipe mute audio');
        mute();
      }
      break;
    case Gesture.TwoFingers:
      {
        console.log('Two Fingers');
        if (!disconnectcall.disabled) {
          disconnectcall.click();
        } else {
          console.log('Call connection not found, hence cannot disconnect.');
        }
      }
      break;
    case Gesture.ClosedFist:
      {
        console.log('Closed Fist');
        toggleVideo(true);
      }
      break;
    default: {
      //pass
    }
  }
}

function toggleVideo(disable = false) {
  const videoTrack = localStream.getTracks().find((track) => track.kind === 'video');
  if (videoTrack.enabled || disable === true) {
    videoTrack.enabled = false;
    toggleButton.innerHTML = '<i class="material-icons">videocam_off</i>';
  } else {
    videoTrack.enabled = true;
    toggleButton.innerHTML = '<i class="material-icons">videocam</i>';
  }
}

function toggleAudio() {
  const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
  if (audioTrack.enabled) {
    mute();
  } else {
    unmute();
  }
}

function addReaction(emoji_id) {
  var new_message = {
    room: roomNumber,
    uuid: localUuid,
    dest: 'all',
  };
  var emoji = '';
  switch (emoji_id) {
    case 1:
      emoji = 'favorite';
      break;
    case 2:
      emoji = 'thumb_up';
      break;
    case 3:
      emoji = 'sentiment_very_satisfied';
      break;
    case 4:
      emoji = 'celebration';
      break;
    case 5:
      emoji = 'question_mark';
      break;
    case 6:
      emoji = 'remove';
      break;
  }
  new_message['emoji'] = emoji;
  createEmojiContainer('localVideoContainer', emoji);
  socket.emit('emoji', new_message);
}

function createEmojiContainer(videoContainer, emoji) {
  var parentNode = document.getElementById(videoContainer);
  var childNode = document.getElementById(videoContainer + '-emoji-container');
  try {
    console.log(videoContainer);
    parentNode.removeChild(childNode);
  } catch (err) {
    console.log(err);
  }
  if (emoji == 'remove') {
    return;
  }
  var emojiContainer = document.createElement('div');
  emojiContainer.setAttribute('id', videoContainer + '-emoji-container');
  emojiContainer.setAttribute('class', 'reactionLabel');
  emojiContainer.innerHTML = '<i class="material-icons">' + emoji + '</i>';
  document.getElementById(videoContainer).appendChild(emojiContainer);
}

function toggleGestures() {
  if (gesturesEnabled == true) {
    disable_gestures();
  } else {
    enable_gestures();
  }
}

function disconnectCall() {
  socket.emit('disconnect-call', createMessage());
  Toast.show('Call disconnected', 'error');
}

function toggleScreenShare() {
  if (document.getElementById('consultingRoomwSharing').style.cssText == 'display: block;') {
    end_share();
  } else {
    start_share();
  }
}

/**
 * Function is triggered when the video on/off button is clicked.
 */
toggleButton.addEventListener('click', toggleVideo);

/**
 * Function is triggered when when the audio mute/unmute button is clicked.
 */
toggleMic.addEventListener('click', toggleAudio);

heartEmoji.addEventListener('click', function () {
  addReaction(1);
});

likeEmoji.addEventListener('click', function () {
  addReaction(2);
});

happyEmoji.addEventListener('click', function () {
  addReaction(3);
});

celebrationEmoji.addEventListener('click', function () {
  addReaction(4);
});

askQuestionEmoji.addEventListener('click', function () {
  addReaction(5);
});

clearEmoji.addEventListener('click', function () {
  addReaction(6);
});

toggleGesture.addEventListener('click', toggleGestures);

disconnectcall.addEventListener('click', disconnectCall);

screenShare.addEventListener('click', toggleScreenShare);

function mute() {
  const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
  if (audioTrack.enabled === true) {
    audioTrack.enabled = false;
    toggleMic.innerHTML = '<i class="material-icons">mic_off</i>';
  }
}

function unmute() {
  const audioTrack = localStream.getTracks().find((track) => track.kind === 'audio');
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
    localVideo.className = 'video-large';
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

  localVideo.className = 'video-small';
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

//#endregion

function createMessage(dest = 'all') {
  return {
    room: roomNumber,
    uuid: localUuid,
    dest: dest,
    displayName: localDisplayName,
  };
}

function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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

    socket.emit('create or join', createMessage());
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
    disable_gestures();
  }
};

/**
 * Socket connects.
 *
 * @event socket#connect
 */
socket.on('connect', function () {
  console.log('Connection acheived.');
  if (sessionStorage.getItem('sparkName')) {
    localDisplayName = sessionStorage.getItem('sparkName');
  } else {
    localDisplayName = prompt('Enter your name', 'Guest');
    sessionStorage.setItem('sparkName', localDisplayName);
  }
  document.getElementById('hello-text').innerHTML = 'Hello ' + localDisplayName + '!';
  // divSelectRoom.style = "display: none;";
  divConsultingRoom.style = 'display: block;';
  divConsultingControls.style = 'display: block;';
});

function makeLabel(label) {
  var vidLabel = document.createElement('div');
  vidLabel.appendChild(document.createTextNode(label));
  vidLabel.setAttribute('class', 'videoLabel');
  return vidLabel;
}

function updateLayout() {
  // update CSS grid based on number of diplayed videos

  var contentHeight = origContentHeight;
  var contentWidth = origContentWidth;
  var gridCount = 1;
  var numVideos = Object.keys(peerConnections).length + 1; // add one to include local video

  if (numVideos > 1 && numVideos <= 4) {
    // 2x2 grid
    contentHeight = origContentHeight / 2;
    contentWidth = origContentWidth / 2;
    gridCount = Math.ceil(numVideos / 2);
  } else if (numVideos > 4) {
    // 3x3 grid
    contentHeight = origContentHeight / 3;
    contentWidth = origContentWidth / 3;
    gridCount = Math.ceil(numVideos / 3);
  }
  var rowHeight = contentHeight + 'px';
  var colWidth = contentWidth + 'px';
  console.log(document.documentElement.style);
  document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
  document.documentElement.style.setProperty(`--colWidth`, colWidth);
  document.documentElement.style.setProperty(`--gridCount`, gridCount);
}

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
  setupLocalScream(true);
});

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
  setupLocalScream(false);
});

socket.on('emoji', function (message) {
  createEmojiContainer('remoteVideo-' + message.uuid, message.emoji);
});

function setupLocalScream(selfInitiated = false) {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then(function (stream) {
      localStream = stream;
      localVideo.srcObject = stream;
      document.getElementById('localVideoContainer').appendChild(makeLabel(localDisplayName));
      selfInitiated ? (isCaller = true) : socket.emit('ready', createMessage());
      updateLayout();
    })
    .catch(function (err) {
      console.log('An error ocurred when accessing media devices', err);
      Toast.show('Oops, An error ocurred when accessing media devices', 'error', true);
    });
}

function setUpPeer(peerUuid, displayName, initCall = false) {
  if (peerConnections[peerUuid]) {
    console.log('Peer already exists');
    return;
  }
  console.log(`Setting up peer connection for ${displayName} with uuid: ${peerUuid}`);
  const peerConnection = new RTCPeerConnection(iceServers);
  peerConnections[peerUuid] = peerConnection;
  peerConnection.onicecandidate = (event) => onIceCandidate(event, peerUuid);
  peerConnection.ontrack = (event) => onAddStream(event, peerUuid, displayName);
  peerConnection.oniceconnectionstatechange = (event) => onIceStateChange(event, peerUuid);
  localStream.getTracks().forEach((track) => senders.push(peerConnection.addTrack(track, localStream)));
  // peerConnection.addStream(localStream);
  if (initCall) {
    peerConnection
      .createOffer()
      .then((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        socket.emit('offer', {
          type: 'offer',
          sdp: sessionDescription,
          room: roomNumber,
          uuid: localUuid,
          dest: peerUuid,
        });
      })
      .catch(errorHandler);
  }
}

function handleReadyOfferAnswer(message) {
  var peerUuid = message.uuid;
  if (peerUuid == localUuid || (message.dest != localUuid && message.dest != 'all')) return;
  if (message.displayName && message.dest == 'all') {
    // set up peer connection object for a newcomer peer
    setUpPeer(peerUuid, message.displayName);
    socket.emit('ready', createMessage(peerUuid));
  } else if (message.displayName && message.dest == localUuid) {
    // initiate call if we are the newcomer peer
    setUpPeer(peerUuid, message.displayName, true);
  } else if (message.sdp) {
    // handle offer
    peerConnections[peerUuid]
      .setRemoteDescription(new RTCSessionDescription(message.sdp))
      .then(function () {
        // Only create answers in response to offers
        if (message.type == 'offer') {
          peerConnections[peerUuid]
            .createAnswer()
            .then((sessionDescription) => {
              peerConnections[peerUuid].setLocalDescription(sessionDescription);
              socket.emit('answer', {
                type: 'answer',
                sdp: sessionDescription,
                room: roomNumber,
                uuid: localUuid,
                dest: peerUuid,
              });
            })
            .catch(errorHandler);
        }
      })
      .catch(errorHandler);
  }
}

/**
 * This function is triggered when a person joins the room and is ready to communicate.
 *
 * @event socket#ready
 */
socket.on('ready', function (message) {
  console.log('ready signal received', message);
  handleReadyOfferAnswer(message);
});

/**
 * This function is triggered when an offer is received.
 *
 * @event socket#offer
 * @param {*} event event
 */
socket.on('offer', function (message) {
  console.log('offer received', message);
  handleReadyOfferAnswer(message);
});

/**
 * This function is triggered when an answer is received.
 *
 * @event socket#answer
 * @param {*} event event
 */
socket.on('answer', function (message) {
  console.log('connection fully established. Both remote participants connection should be open.', message);
  handleReadyOfferAnswer(message);
});

socket.on('full', function () {
  console.log('Room is full. You can not enter this room right now.');
  Toast.show('Room is full hence you can not enter the meeting room', 'error', true);
});
/**
 * This function is triggered when a user is disconnected.
 * @event socket#disconnect
 */
socket.on('disconnect-call', function (message) {
  console.log('disconnected', message);
  if (message.uuid == localUuid) return;
  console.log(peerConnections);
  peerConnections[message.uuid].close();
  onIceStateChange(null, message.uuid);
  Toast.show('Call disconnected', 'success', true);
  // location.reload();
});

/**
 * Function is triggered when it receives an ice candidate.
 *
 * @event socket#candidate
 * @param {*} event event
 */
socket.on('candidate', function (event) {
  var peerUuid = event.uuid;
  if (peerUuid == localUuid) return;
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  peerConnections[peerUuid].addIceCandidate(candidate);
});

/**
 * Implements the onIceCandidate function
 * which is part of RTCPeerConnection
 * @param {*} event event
 */
function onIceCandidate(event, peerUuid) {
  // console.log(event);
  if (event.candidate) {
    // console.log('sending ice candidate');
    socket.emit('candidate', {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber,
      uuid: localUuid,
      dest: peerUuid,
    });
  }
}

function onIceStateChange(event, peerUuid) {
  console.log(`${peerUuid} exited the room`);
  console.log(peerConnections);
  if (peerConnections[peerUuid]) {
    var state = peerConnections[peerUuid].iceConnectionState;
    console.log(`connection with peer ${peerUuid} ${state}`);
    if (state === 'failed' || state === 'closed' || state === 'disconnected') {
      delete peerConnections[peerUuid];
      document.getElementById('video-grid').removeChild(document.getElementById('remoteVideo-' + peerUuid));
      updateLayout();
      if (Object.keys(peerConnections).length == 0) {
        inputRoomNumber.value = '';
        //TODO: create a leave room function to disable buttons and stuff
      }
    }
    console.log('remaining connections ', peerConnections);
  }
}

/**
 * Implements the onAddStrean function that takes an event as an input
 * @param {*} event event
 */
function onAddStream(event, peerUuid, displayName) {
  console.log(`got remote stream, peer ${peerUuid}`);

  var ele = document.getElementById('remoteVideo-' + peerUuid);
  if (ele == null) {
    //assign stream to new HTML video element
    // var vidElement = document.createElement('video');
    // vidElement.setAttribute('autoplay', '');
    // vidElement.setAttribute('muted', '');
    // vidElement.setAttribute('class', 'video-small');
    // vidElement.setAttribute('id', 'remoteVideo-'+peerUuid);
    // vidElement.srcObject = event.streams[0];
    // console.log(event)
    // document.getElementById('video-grid').appendChild(vidElement);

    var vidElement = document.createElement('video');
    vidElement.setAttribute('autoplay', '');
    vidElement.setAttribute('muted', '');
    vidElement.srcObject = event.streams[0];

    var vidContainer = document.createElement('div');
    vidContainer.setAttribute('id', 'remoteVideo-' + peerUuid);
    vidContainer.setAttribute('class', 'videoContainer');
    vidContainer.appendChild(vidElement);
    vidContainer.appendChild(makeLabel(displayName));

    document.getElementById('video-grid').appendChild(vidContainer);

    updateLayout();
  }
  screenShare.disabled = false;
  disconnectcall.disabled = false;
}

function errorHandler(error) {
  console.error(error);
}
